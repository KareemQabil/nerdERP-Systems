import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrintJob } from '../entities/print-job.entity';
import { PrintTemplate, TemplateType } from '../entities/print-template.entity';
import { KitchenStation } from '../../kitchen/entities/kitchen-station.entity';
import { Printer, PrinterType } from '../../kitchen/entities/printer.entity';
import { SalesOrder, OrderType } from '../../sales/entities/sales-order.entity';
import { OrderItem } from '../../sales/entities/order-item.entity';
import { Product } from '../../products/entities/product.entity';
import { PrintQueueService } from './print-queue.service';
import { ReceiptGeneratorService } from './receipt-generator.service';

/**
 * =============================================================================
 * PRINTER ROUTING TYPES
 * =============================================================================
 */

export interface PrinterRoutingConfig {
    version: string;
    storeId: string;
    stationMappings: StationMapping[];
    orderTypeRules: OrderTypeRule[];
    priorityConfig: PriorityConfig;
    falloverConfig: FalloverConfig;
}

export interface StationMapping {
    stationId: string;
    stationCode: string;
    primaryPrinterId: string;
    fallbackPrinterIds: string[];
    falloverConfig: {
        enabled: boolean;
        maxRetryAttempts: number;
        alertOnFallover: boolean;
    };
    templateId: string;
}

export interface OrderTypeRule {
    orderType: OrderType;
    autoPrint: {
        customerReceipt: boolean;
        kitchenTickets: boolean;
    };
    receiptPrinterId?: string;
    receiptTemplateId?: string;
    priorityLevel?: number; // 1-5, 1=highest
}

export interface PriorityConfig {
    levels: PriorityLevel[];
    autoEscalation: {
        enabled: boolean;
        waitTimeMinutes: number;
    };
}

export interface PriorityLevel {
    level: number;
    name: 'EMERGENCY' | 'EXPEDITE' | 'NORMAL' | 'REPRINT' | 'TEST';
    queuePosition: 'front' | 'back';
}

export interface FalloverConfig {
    globalEnabled: boolean;
    maxRetryAttempts: number;
    alertThreshold: number; // Alert after N failures
}

export interface RouteOrderResult {
    success: boolean;
    printJobs: PrintJob[];
    errors: Array<{
        station: string;
        printer: string;
        error: string;
    }>;
}

export interface StationGrouping {
    stationCode: string;
    stationId: string;
    stationName: string;
    items: OrderItem[];
    printerId: string;
    templateId: string;
}

/**
 * =============================================================================
 * PRINTER ROUTING SERVICE
 * =============================================================================
 *
 * Orchestrates intelligent print job routing based on:
 * - Kitchen station assignments (products → stations → printers)
 * - Order type rules (DINE_IN, TAKEAWAY, DELIVERY)
 * - Priority queue handling (EMERGENCY, EXPEDITE, NORMAL)
 * - Automatic fallover to backup printers
 * - Split printing (per-station kitchen tickets)
 *
 * Configuration is stored in StoreConfiguration with key 'printing.printer_routing'
 *
 * Workflow:
 * 1. Order is fired to kitchen → routeOrder() called
 * 2. Items grouped by station → groupItemsByStation()
 * 3. For each station → queueKitchenTicket()
 * 4. Customer receipt queued → queueReceipt()
 * 5. Jobs prioritized and assigned to printers
 * 6. Fallover handling for failed prints
 *
 * @example
 * const result = await printerRouting.routeOrder({
 *   orderId: 'order-uuid',
 *   orderType: 'DINE_IN',
 *   priorityLevel: 2, // EXPEDITE
 * });
 */
@Injectable()
export class PrinterRoutingService {
    private readonly logger = new Logger(PrinterRoutingService.name);

    // Default routing configuration (fallback)
    private readonly defaultConfig: PrinterRoutingConfig = {
        version: '1.0',
        storeId: '',
        stationMappings: [],
        orderTypeRules: [
            {
                orderType: OrderType.DINE_IN,
                autoPrint: {
                    customerReceipt: true,
                    kitchenTickets: true,
                },
                priorityLevel: 3, // NORMAL
            },
            {
                orderType: OrderType.TAKEAWAY,
                autoPrint: {
                    customerReceipt: true,
                    kitchenTickets: true,
                },
                priorityLevel: 3,
            },
            {
                orderType: OrderType.DELIVERY,
                autoPrint: {
                    customerReceipt: true,
                    kitchenTickets: true,
                },
                priorityLevel: 3,
            },
        ],
        priorityConfig: {
            levels: [
                { level: 1, name: 'EMERGENCY', queuePosition: 'front' },
                { level: 2, name: 'EXPEDITE', queuePosition: 'front' },
                { level: 3, name: 'NORMAL', queuePosition: 'back' },
                { level: 4, name: 'REPRINT', queuePosition: 'back' },
                { level: 5, name: 'TEST', queuePosition: 'back' },
            ],
            autoEscalation: {
                enabled: true,
                waitTimeMinutes: 5,
            },
        },
        falloverConfig: {
            globalEnabled: true,
            maxRetryAttempts: 2,
            alertThreshold: 3,
        },
    };

    private config: PrinterRoutingConfig;

    constructor(
        @InjectRepository(KitchenStation)
        private readonly stationRepo: Repository<KitchenStation>,
        @InjectRepository(Printer)
        private readonly printerRepo: Repository<Printer>,
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepo: Repository<OrderItem>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(PrintTemplate)
        private readonly templateRepo: Repository<PrintTemplate>,
        @InjectRepository(PrintJob)
        private readonly printJobRepo: Repository<PrintJob>,
        private readonly printQueue: PrintQueueService,
        private readonly receiptGenerator: ReceiptGeneratorService,
        private readonly storeConfigService: any, // Inject actual StoreConfigurationService
    ) {
        this.config = { ...this.defaultConfig };
        this.loadConfiguration();
    }

    // =========================================================================
    // ROUTING OPERATIONS
    // =========================================================================

    /**
     * Route an order for printing
     * Main entry point for order printing
     *
     * Creates:
     * - One customer receipt (if enabled)
     * - Multiple kitchen tickets (one per station)
     *
     * All jobs are queued with proper priority and printer assignments
     */
    async routeOrder(params: {
        orderId: string;
        orderType: OrderType;
        priorityLevel?: number; // 1-5, defaults to 3 (NORMAL)
        priorityName?: 'EMERGENCY' | 'EXPEDITE' | 'NORMAL' | 'REPRINT' | 'TEST';
        autoPrint?: boolean; // Override auto-print settings
    }): Promise<RouteOrderResult> {
        // Fetch order with items and products
        const order = await this.orderRepo.findOne({
            where: { id: params.orderId },
            relations: ['items', 'items.product'],
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${params.orderId}`);
        }

        const errors: Array<{ station: string; printer: string; error: string }> = [];
        const printJobs: PrintJob[] = [];

        // Get order type rule
        const orderTypeRule = this.getOrderTypeRule(params.orderType);
        const shouldAutoPrint = params.autoPrint !== undefined ? params.autoPrint : orderTypeRule?.autoPrint?.kitchenTickets !== false;

        if (!shouldAutoPrint) {
            this.logger.log(`Auto-print disabled for order ${order.orderNumber}`);
            return { success: true, printJobs: [], errors };
        }

        // Set priority
        const priorityLevel = params.priorityLevel || orderTypeRule?.priorityLevel || 3;
        const priorityName = params.priorityName || this.getPriorityName(priorityLevel);

        // Group items by station
        const stationGroupings = await this.groupItemsByStation(order);

        this.logger.log(`Routing order ${order.orderNumber}: ${stationGroupings.length} stations`);

        // Queue kitchen tickets for each station
        for (const grouping of stationGroupings) {
            try {
                const job = await this.queueKitchenTicket({
                    orderId: order.id,
                    stationCode: grouping.stationCode,
                    items: grouping.items,
                    printerId: grouping.printerId,
                    templateId: grouping.templateId,
                    priorityLevel,
                    priorityName,
                    storeId: order.registerSession?.storeId,
                });
                printJobs.push(job);
            } catch (error) {
                errors.push({
                    station: grouping.stationCode,
                    printer: grouping.printerId,
                    error: error.message,
                });
            }
        }

        // Queue customer receipt (if enabled)
        if (orderTypeRule?.autoPrint?.customerReceipt) {
            try {
                const receiptJob = await this.queueReceipt({
                    orderId: order.id,
                    printerId: orderTypeRule.receiptPrinterId,
                    templateId: orderTypeRule.receiptTemplateId,
                    priorityLevel,
                    priorityName,
                    storeId: order.registerSession?.storeId,
                });
                if (receiptJob) {
                    printJobs.push(receiptJob);
                }
            } catch (error) {
                errors.push({
                    station: 'RECEIPT',
                    printer: orderTypeRule.receiptPrinterId || 'DEFAULT',
                    error: error.message,
                });
            }
        }

        this.logger.log(`Order ${order.orderNumber} routed: ${printJobs.length} jobs queued, ${errors.length} errors`);

        return {
            success: errors.length === 0,
            printJobs,
            errors,
        };
    }

    /**
     * Group order items by kitchen station
     *
     * Uses product.kitchenStationId to determine which station
     * handles each item. Items without station go to DEFAULT station.
     */
    async groupItemsByStation(order: SalesOrder): Promise<StationGrouping[]> {
        const groupings: Map<string, StationGrouping> = new Map();

        // Fetch all products for items
        const productIds = order.items.map(item => item.product?.id).filter(Boolean) as string[];
        const products = await this.productRepo.findBy({ id: In(productIds) });
        const productMap = new Map(products.map(p => [p.id, p]));

        // Fetch all stations
        const stations = await this.stationRepo.find({ where: { isActive: true } });
        const stationMap = new Map(stations.map(s => [s.id, s]));
        const stationCodeMap = new Map(stations.map(s => [s.stationCode, s]));

        // Get station mappings from config
        const stationMappings = new Map(
            this.config.stationMappings.map(sm => [sm.stationCode, sm])
        );

        // Group items by station
        for (const item of order.items) {
            if (item.isVoided) continue; // Skip voided items

            const product = productMap.get(item.product?.id || '');
            const stationCode = product?.kitchenStationIds?.length
                ? stationMap.get(product.kitchenStationIds[0])?.stationCode || 'DEFAULT'
                : 'DEFAULT';

            if (!groupings.has(stationCode)) {
                const station = stationCodeMap.get(stationCode) || stationCodeMap.get('DEFAULT');
                const mapping = stationMappings.get(stationCode) || stationMappings.get('DEFAULT');

                if (!station || !mapping) {
                    this.logger.warn(`No station/mapping found for ${stationCode}, skipping`);
                    continue;
                }

                groupings.set(stationCode, {
                    stationCode,
                    stationId: station.id,
                    stationName: station.stationName,
                    items: [],
                    printerId: mapping.primaryPrinterId,
                    templateId: mapping.templateId,
                });
            }

            groupings.get(stationCode)!.items.push(item);
        }

        return Array.from(groupings.values());
    }

    /**
     * Queue a kitchen ticket for a specific station
     *
     * Creates a print job with:
     * - Station-specific items only
     * - Kitchen ticket template
     * - Priority and station routing info
     */
    async queueKitchenTicket(params: {
        orderId: string;
        stationCode: string;
        items: OrderItem[];
        printerId: string;
        templateId: string;
        priorityLevel: number;
        priorityName: string;
        storeId?: string;
    }): Promise<PrintJob> {
        // Get station details
        const station = await this.stationRepo.findOne({
            where: { stationCode: params.stationCode },
        });

        if (!station) {
            throw new BadRequestException(`Station not found: ${params.stationCode}`);
        }

        // Generate kitchen ticket data
        const ticketData = await this.receiptGenerator.generateKitchenTicket(
            params.orderId,
            params.stationCode as any,
        );

        // Get template
        let template: PrintTemplate | null = null;
        if (params.templateId) {
            template = await this.templateRepo.findOne({
                where: { id: params.templateId },
            });
        }

        // Create print job with enhanced fields
        const job = await this.printQueue.queuePrintJob({
            printerId: params.printerId,
            orderId: params.orderId,
            type: 'KITCHEN_TICKET',
            printData: {
                ...ticketData,
                stationCode: params.stationCode,
                stationName: station.stationName,
                items: params.items,
            },
            renderedContent: template?.render(ticketData),
            storeId: params.storeId,
        });

        // Update with routing-specific fields
        job.priorityLevel = params.priorityLevel;
        job.priorityName = params.priorityName as any;
        job.stationId = station.id;
        job.stationCode = station.stationCode;
        job.templateId = params.templateId;

        await this.printJobRepo.save(job);

        this.logger.log(
            `KOT queued: ${params.orderId} → ${params.stationCode} (${params.printerId}) [${params.priorityName}]`
        );

        return job;
    }

    /**
     * Queue a customer receipt
     *
     * Creates a print job with:
     * - Full order details
     * - Receipt template
     * - Receipt printer from order type rules
     */
    async queueReceipt(params: {
        orderId: string;
        printerId?: string;
        templateId?: string;
        priorityLevel: number;
        priorityName: string;
        storeId?: string;
    }): Promise<PrintJob | null> {
        // Get default receipt printer if not specified
        let printerId = params.printerId;
        if (!printerId) {
            const defaultPrinter = await this.printerRepo.findOne({
                where: {
                    printerType: PrinterType.RECEIPT,
                    isDefault: true,
                    ...(params.storeId && { storeId: params.storeId }),
                },
            });
            printerId = defaultPrinter?.id;
        }

        if (!printerId) {
            this.logger.warn(`No receipt printer found for order ${params.orderId}`);
            return null;
        }

        // Generate receipt data
        const receiptData = await this.receiptGenerator.generateReceipt(
            params.orderId,
            'THERMAL_80MM',
        );

        // Get template
        let template: PrintTemplate | null = null;
        if (params.templateId) {
            template = await this.templateRepo.findOne({
                where: { id: params.templateId },
            });
        }

        // Create print job
        const job = await this.printQueue.queuePrintJob({
            printerId,
            orderId: params.orderId,
            type: 'RECEIPT',
            printData: receiptData,
            renderedContent: template?.render(receiptData),
            storeId: params.storeId,
        });

        // Update with priority
        job.priorityLevel = params.priorityLevel;
        job.priorityName = params.priorityName as any;
        if (params.templateId) {
            job.templateId = params.templateId;
        }

        await this.printJobRepo.save(job);

        this.logger.log(`Receipt queued: ${params.orderId} → ${printerId} [${params.priorityName}]`);

        return job;
    }

    // =========================================================================
    // FALLOVER HANDLING
    // =========================================================================

    /**
     * Handle print job fallover to backup printer
     *
     * Called when a print job fails:
     * 1. Check if fallover is enabled for station
     * 2. Get fallback printer from configuration
     * 3. Create new job with fallback printer
     * 4. Mark original job as fallback
     */
    async handleFallover(jobId: string): Promise<PrintJob | null> {
        const job = await this.printQueue.getJobStatus(jobId);

        if (!job) {
            throw new NotFoundException(`Print job not found: ${jobId}`);
        }

        // Get station mapping
        const stationMapping = this.config.stationMappings.find(
            sm => sm.stationCode === job.stationCode
        );

        if (!stationMapping || !stationMapping.falloverConfig.enabled) {
            this.logger.warn(`Fallover not enabled for station ${job.stationCode}`);
            return null;
        }

        // Check if fallback attempts exceeded
        if (job.fallbackAttempt >= stationMapping.falloverConfig.maxRetryAttempts) {
            this.logger.error(`Max fallover attempts reached for job ${jobId}`);
            return null;
        }

        // Get fallback printer
        const fallbackPrinterId = stationMapping.fallbackPrinterIds[job.fallbackAttempt] ||
            stationMapping.fallbackPrinterIds[0];

        if (!fallbackPrinterId) {
            this.logger.error(`No fallback printer configured for ${job.stationCode}`);
            return null;
        }

        // Create fallback job
        const fallbackJob = await this.printQueue.queuePrintJob({
            printerId: fallbackPrinterId,
            orderId: job.orderId,
            type: job.type,
            printData: job.printData,
            renderedContent: job.renderedContent,
            storeId: job.storeId,
            userId: job.userId,
            deviceId: job.deviceId,
        });

        // Mark as fallback
        fallbackJob.isFallback = true;
        fallbackJob.originalPrinterId = job.printerId;
        fallbackJob.fallbackAttempt = job.fallbackAttempt + 1;
        fallbackJob.priorityLevel = job.priorityLevel;
        fallbackJob.priorityName = job.priorityName;
        fallbackJob.stationId = job.stationId;
        fallbackJob.stationCode = job.stationCode;
        fallbackJob.templateId = job.templateId;

        await this.printJobRepo.save(fallbackJob);

        // Update original job
        await this.printQueue.markFailed(jobId, 'Fallover to backup printer');

        this.logger.log(
            `Fallover: ${job.printerId} → ${fallbackPrinterId} for job ${jobId}`
        );

        // Alert if enabled
        if (stationMapping.falloverConfig.alertOnFallover) {
            this.emitFalloverAlert(job, fallbackPrinterId);
        }

        return fallbackJob;
    }

    // =========================================================================
    // PRIORITY QUEUE MANAGEMENT
    // =========================================================================

    /**
     * Auto-escalate long-waiting jobs
     *
     * Cron job runs every minute to check for jobs waiting
     * longer than the configured threshold and escalates priority.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async autoEscalateWaitingJobs(): Promise<void> {
        if (!this.config.priorityConfig.autoEscalation.enabled) {
            return;
        }

        const thresholdMinutes = this.config.priorityConfig.autoEscalation.waitTimeMinutes;

        const jobs = await this.printJobRepo.find({
            where: { status: 'QUEUED' },
        });

        let escalatedCount = 0;

        for (const job of jobs) {
            if (job.shouldExpedite(thresholdMinutes)) {
                job.escalatePriority();
                await this.printJobRepo.save(job);
                escalatedCount++;
            }
        }

        if (escalatedCount > 0) {
            this.logger.log(`Auto-escalated ${escalatedCount} waiting print jobs`);
        }
    }

    /**
     * Get prioritized queue for a printer
     *
     * Returns jobs ordered by:
     * 1. Priority level (1 first)
     * 2. Creation time (oldest first within same priority)
     */
    async getPrioritizedQueue(printerId: string): Promise<PrintJob[]> {
        return await this.printJobRepo.find({
            where: {
                printerId,
                status: 'QUEUED' as any,
            },
            order: {
                priorityLevel: 'ASC',
                createdAt: 'ASC',
            },
        });
    }

    // =========================================================================
    // CONFIGURATION MANAGEMENT
    // =========================================================================

    /**
     * Load routing configuration from StoreConfiguration
     */
    private async loadConfiguration(): Promise<void> {
        try {
            const storedConfig = await this.storeConfigService.get('printing.printer_routing');
            if (storedConfig) {
                this.config = storedConfig;
                this.logger.log('Printer routing configuration loaded');
            }
        } catch (error) {
            this.logger.warn('Failed to load routing config, using defaults');
        }
    }

    /**
     * Update routing configuration
     */
    async updateConfiguration(config: PrinterRoutingConfig): Promise<void> {
        // Validate configuration
        this.validateConfiguration(config);

        // Store in StoreConfiguration
        await this.storeConfigService.set('printing.printer_routing', config);

        this.config = config;
        this.logger.log('Printer routing configuration updated');
    }

    /**
     * Get current configuration
     */
    getConfiguration(): PrinterRoutingConfig {
        return { ...this.config };
    }

    /**
     * Validate routing configuration
     */
    private validateConfiguration(config: PrinterRoutingConfig): void {
        // Validate station mappings
        for (const mapping of config.stationMappings) {
            if (!mapping.stationId || !mapping.primaryPrinterId) {
                throw new BadRequestException(
                    `Invalid station mapping: ${mapping.stationCode}`
                );
            }
        }

        // Validate priority levels
        const validLevels = [1, 2, 3, 4, 5];
        for (const level of config.priorityConfig.levels) {
            if (!validLevels.includes(level.level)) {
                throw new BadRequestException(
                    `Invalid priority level: ${level.level}`
                );
            }
        }
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Get order type rule
     */
    private getOrderTypeRule(orderType: OrderType): OrderTypeRule | undefined {
        return this.config.orderTypeRules.find(r => r.orderType === orderType);
    }

    /**
     * Get priority name from level
     */
    private getPriorityName(level: number): 'EMERGENCY' | 'EXPEDITE' | 'NORMAL' | 'REPRINT' | 'TEST' {
        const names: Record<number, 'EMERGENCY' | 'EXPEDITE' | 'NORMAL' | 'REPRINT' | 'TEST'> = {
            1: 'EMERGENCY',
            2: 'EXPEDITE',
            3: 'NORMAL',
            4: 'REPRINT',
            5: 'TEST',
        };
        return names[level] || 'NORMAL';
    }

    /**
     * Emit fallover alert event
     * In production, this would use WebSocket gateway
     */
    private emitFalloverAlert(job: PrintJob, fallbackPrinterId: string): void {
        this.logger.warn(
            `FALLOVER ALERT: Job ${job.id} failed on ${job.printerId}, ` +
            `fallback to ${fallbackPrinterId}`
        );
        // TODO: Emit via WebSocket gateway for admin notification
    }

    // =========================================================================
    // STATUS & MONITORING
    // =========================================================================

    /**
     * Get printer routing status for dashboard
     */
    async getRoutingStatus(): Promise<{
        activeStations: number;
        activePrinters: number;
        queueStats: {
            byPrinter: Array<{
                printerId: string;
                queued: number;
                printing: number;
                failed: number;
            }>;
        };
        falloverEvents: Array<{
            jobId: string;
            fromPrinter: string;
            toPrinter: string;
            timestamp: Date;
        }>;
    }> {
        const [stations, printers, recentFallbacks] = await Promise.all([
            this.stationRepo.find({ where: { isActive: true } }),
            this.printerRepo.find({ where: { isActive: true } }),
            this.printJobRepo.find({
                where: { isFallback: true },
                take: 10,
                order: { createdAt: 'DESC' },
            }),
        ]);

        // Get queue stats per printer
        const queueStats: Array<{
            printerId: string;
            printerName?: string;
            queued: number;
            printing: number;
            completed?: number;
            failed: number;
        }> = [];
        for (const printer of printers) {
            const stats = await this.printQueue.getQueueStats(printer.id);
            queueStats.push({
                printerId: printer.id,
                printerName: printer.printerName,
                ...stats,
            });
        }

        return {
            activeStations: stations.length,
            activePrinters: printers.length,
            queueStats: {
                byPrinter: queueStats,
            },
            falloverEvents: recentFallbacks.map(job => ({
                jobId: job.id,
                fromPrinter: job.originalPrinterId || 'UNKNOWN',
                toPrinter: job.printerId,
                timestamp: job.createdAt,
            })),
        };
    }
}
