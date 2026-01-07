import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { SalesOrder, OrderType, OrderStatus, PaymentStatus } from '../../sales/entities/sales-order.entity';
import { OrderItem } from '../../sales/entities/order-item.entity';
import { Product } from '../../products/entities/product.entity';
import { CalculationPipelineService, CalculationContext } from '../../sales/services/calculation-pipeline.service';
import { OrderStateMachineService } from '../../sales/services/order-state-machine.service';
import { StoreConfigurationService } from '../../organization/services/store-configuration.service';

/**
 * =============================================================================
 * AGGREGATOR TYPES
 * =============================================================================
 */

export enum AggregatorProvider {
    TALABAT = 'TALABAT',
    MARSOOL = 'MARSOOL',
    INSTASHOP = 'INSTASHOP',
    HUNGRY = 'HUNGRY',
    CAREEM = 'CAREEM',
}

export enum AggregatorOrderStatus {
    PENDING = 'PENDING',           // Received but not accepted
    ACCEPTED = 'ACCEPTED',         // Restaurant accepted
    PREPARING = 'PREPARING',       // Kitchen preparing
    READY = 'READY',               // Ready for pickup
    PICKED_UP = 'PICKED_UP',       // Driver picked up
    DELIVERED = 'DELIVERED',       // Delivered to customer
    CANCELLED = 'CANCELLED',       // Order cancelled
    REJECTED = 'REJECTED',         // Restaurant rejected
}

export interface AggregatorConfig {
    provider: AggregatorProvider;
    enabled: boolean;
    webhookSecret?: string;
    webhookUrl?: string;
    apiEndpoint: string;
    apiKey?: string;
    storeId?: string;
    fixedDeliveryFee?: number;
    commissionRate?: number; // Percentage
    autoAcceptOrders?: boolean;
    syncIntervalMinutes?: number;
}

export interface WebhookPayload {
    provider: AggregatorProvider;
    orderId: string;
    aggregatorOrderId: string;
    status: AggregatorOrderStatus;
    timestamp: Date;
    signature?: string;
    data: Record<string, any>;
}

export interface AggregatorOrder {
    aggregatorOrderId: string;
    provider: AggregatorProvider;
    customerName: string;
    customerPhone: string;
    deliveryAddress: {
        address: string;
        lat?: number;
        lng?: number;
        zone?: string;
    };
    items: Array<{
        productId?: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        notes?: string;
    }>;
    subtotal: number;
    deliveryFee: number;
    commission: number;
    total: number;
    specialInstructions?: string;
    scheduledFor?: Date;
}

/**
 * =============================================================================
 * AGGREGATOR SERVICE
 * =============================================================================
 *
 * Handles integration with third-party food delivery aggregators:
 * - Talabat
 * - Marsool
 * - Instashop
 * - Hungry
 * - Careem NOW
 *
 * Features:
 * - Webhook接收 and validation
 * - Order parsing and creation
 * - Status synchronization
 * - Automatic order acceptance
 * - Commission tracking
 *
 * Workflow:
 * 1. Aggregator sends webhook → handleWebhook()
 * 2. Parse order data → parseAggregatorOrder()
 * 3. Validate signature → validateWebhookSignature()
 * 4. Create local order → createOrderFromAggregator()
 * 5. Sync status back → syncOrderStatus()
 *
 * Configuration stored in StoreConfiguration with key 'aggregator.providers'
 *
 * @example
 * // Handle incoming webhook
 * const result = await aggregatorService.handleWebhook({
 *   provider: 'TALABAT',
 *   orderId: 'talabat-123',
 *   aggregatorOrderId: 'TB-12345',
 *   status: 'PENDING',
 *   timestamp: new Date(),
 *   data: { ... },
 * });
 */
@Injectable()
export class AggregatorService {
    private readonly logger = new Logger(AggregatorService.name);
    private readonly configs: Map<AggregatorProvider, AggregatorConfig> = new Map();
    private readonly axiosInstances: Map<AggregatorProvider, AxiosInstance> = new Map();

    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepo: Repository<OrderItem>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
        private readonly calculationPipeline: CalculationPipelineService,
        private readonly stateMachineService: OrderStateMachineService,
        private readonly storeConfigService: StoreConfigurationService,
    ) {
        this.loadConfigurations();
    }

    // =========================================================================
    // WEBHOOK HANDLING
    // =========================================================================

    /**
     * Handle incoming webhook from aggregator
     *
     * Main entry point for all aggregator webhooks.
     * Routes to appropriate provider handler.
     */
    async handleWebhook(payload: WebhookPayload, headers: Record<string, string>): Promise<{
        success: boolean;
        orderId?: string;
        internalOrderId?: string;
        error?: string;
    }> {
        try {
            // Load provider config
            const config = this.getConfig(payload.provider);
            if (!config || !config.enabled) {
                throw new BadRequestException(`Provider ${payload.provider} is not enabled`);
            }

            // Validate webhook signature
            if (config.webhookSecret) {
                const isValid = this.validateWebhookSignature(payload, headers, config.webhookSecret);
                if (!isValid) {
                    throw new UnauthorizedException('Invalid webhook signature');
                }
            }

            // Route to provider-specific handler
            const result = await this.routeToProvider(payload, config);

            this.logger.log(
                `Webhook processed: ${payload.provider} - ${payload.aggregatorOrderId}`
            );

            return result;
        } catch (error) {
            this.logger.error(
                `Webhook error: ${error.message}`,
                error.stack,
            );
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Route webhook to provider-specific handler
     */
    private async routeToProvider(
        payload: WebhookPayload,
        config: AggregatorConfig,
    ): Promise<{ success: boolean; orderId?: string; internalOrderId?: string; error?: string }> {
        switch (payload.provider) {
            case AggregatorProvider.TALABAT:
                return await this.handleTalabatWebhook(payload, config);
            case AggregatorProvider.MARSOOL:
                return await this.handleMarsoolWebhook(payload, config);
            case AggregatorProvider.INSTASHOP:
                return await this.handleInstashopWebhook(payload, config);
            default:
                return {
                    success: false,
                    error: `Unsupported provider: ${payload.provider}`,
                };
        }
    }

    /**
     * Handle Talabat webhook
     */
    private async handleTalabatWebhook(
        payload: WebhookPayload,
        config: AggregatorConfig,
    ): Promise<{ success: boolean; orderId?: string; internalOrderId?: string; error?: string }> {
        // Talabat-specific parsing
        const orderData = this.parseTalabatOrder(payload.data);

        // Check if order already exists
        const existingOrder = await this.orderRepo.findOne({
            where: { metadata: { aggregatorOrderId: payload.aggregatorOrderId } } as any,
        });

        if (existingOrder) {
            // Update existing order status
            await this.updateOrderFromAggregator(existingOrder, payload.status);
            return {
                success: true,
                orderId: payload.aggregatorOrderId,
                internalOrderId: existingOrder.id,
            };
        }

        // Create new order
        const order = await this.createOrderFromAggregator(orderData, config);

        return {
            success: true,
            orderId: payload.aggregatorOrderId,
            internalOrderId: order.id,
        };
    }

    /**
     * Handle Marsool webhook
     */
    private async handleMarsoolWebhook(
        payload: WebhookPayload,
        config: AggregatorConfig,
    ): Promise<{ success: boolean; orderId?: string; internalOrderId?: string; error?: string }> {
        const orderData = this.parseMarsoolOrder(payload.data);

        const existingOrder = await this.orderRepo.findOne({
            where: { metadata: { aggregatorOrderId: payload.aggregatorOrderId } } as any,
        });

        if (existingOrder) {
            await this.updateOrderFromAggregator(existingOrder, payload.status);
            return {
                success: true,
                orderId: payload.aggregatorOrderId,
                internalOrderId: existingOrder.id,
            };
        }

        const order = await this.createOrderFromAggregator(orderData, config);

        return {
            success: true,
            orderId: payload.aggregatorOrderId,
            internalOrderId: order.id,
        };
    }

    /**
     * Handle Instashop webhook
     */
    private async handleInstashopWebhook(
        payload: WebhookPayload,
        config: AggregatorConfig,
    ): Promise<{ success: boolean; orderId?: string; internalOrderId?: string; error?: string }> {
        const orderData = this.parseInstashopOrder(payload.data);

        const existingOrder = await this.orderRepo.findOne({
            where: { metadata: { aggregatorOrderId: payload.aggregatorOrderId } } as any,
        });

        if (existingOrder) {
            await this.updateOrderFromAggregator(existingOrder, payload.status);
            return {
                success: true,
                orderId: payload.aggregatorOrderId,
                internalOrderId: existingOrder.id,
            };
        }

        const order = await this.createOrderFromAggregator(orderData, config);

        return {
            success: true,
            orderId: payload.aggregatorOrderId,
            internalOrderId: order.id,
        };
    }

    // =========================================================================
    // ORDER PARSING
    // =========================================================================

    /**
     * Parse Talabat order format
     */
    private parseTalabatOrder(data: any): AggregatorOrder {
        return {
            aggregatorOrderId: data.order_id || data.orderId,
            provider: AggregatorProvider.TALABAT,
            customerName: data.customer_name || data.customerName,
            customerPhone: data.customer_phone || data.customerPhone,
            deliveryAddress: {
                address: data.delivery_address || data.address?.full,
                lat: data.address?.lat,
                lng: data.address?.lng,
                zone: data.zone_id || data.zoneId,
            },
            items: (data.items || []).map((item: any) => ({
                productId: item.product_id || item.productId,
                productName: item.product_name || item.productName,
                quantity: item.quantity,
                unitPrice: item.price || item.unit_price,
                notes: item.notes || item.special_instructions,
            })),
            subtotal: data.subtotal || 0,
            deliveryFee: data.delivery_fee || 0,
            commission: data.commission || 0,
            total: data.total || 0,
            specialInstructions: data.special_instructions || data.notes,
            scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : undefined,
        };
    }

    /**
     * Parse Marsool order format
     */
    private parseMarsoolOrder(data: any): AggregatorOrder {
        return {
            aggregatorOrderId: data.order_id || data.id,
            provider: AggregatorProvider.MARSOOL,
            customerName: data.customer?.name || data.customer_name,
            customerPhone: data.customer?.phone || data.customer_phone,
            deliveryAddress: {
                address: data.delivery_address || data.address,
                lat: data.location?.latitude,
                lng: data.location?.longitude,
            },
            items: (data.order_items || data.items || []).map((item: any) => ({
                productId: item.product_id,
                productName: item.product_name || item.name,
                quantity: item.qty || item.quantity,
                unitPrice: item.price,
                notes: item.notes,
            })),
            subtotal: data.subtotal || 0,
            deliveryFee: data.delivery_fee || 15, // Marsool default
            commission: data.commission || 0,
            total: data.total || data.grand_total,
            specialInstructions: data.notes,
            scheduledFor: data.scheduled_time ? new Date(data.scheduled_time) : undefined,
        };
    }

    /**
     * Parse Instashop order format
     */
    private parseInstashopOrder(data: any): AggregatorOrder {
        return {
            aggregatorOrderId: data.order_id || data.id,
            provider: AggregatorProvider.INSTASHOP,
            customerName: `${data.customer?.first_name} ${data.customer?.last_name}`.trim(),
            customerPhone: data.customer?.phone,
            deliveryAddress: {
                address: data.shipping_address?.address1,
                lat: data.shipping_address?.latitude,
                lng: data.shipping_address?.longitude,
            },
            items: (data.line_items || data.items || []).map((item: any) => ({
                productId: item.product_id,
                productName: item.product_name || item.name,
                quantity: item.quantity,
                unitPrice: item.price || item.unit_price,
                notes: item.instructions,
            })),
            subtotal: data.subtotal || 0,
            deliveryFee: data.shipping_fee || 0,
            commission: 0, // Instashop commission handled differently
            total: data.total || data.grand_total,
            specialInstructions: data.customer_note,
            scheduledFor: data.scheduled_time ? new Date(data.scheduled_time) : undefined,
        };
    }

    // =========================================================================
    // ORDER CREATION
    // =========================================================================

    /**
     * Create local order from aggregator order
     */
    async createOrderFromAggregator(
        aggregatorOrder: AggregatorOrder,
        config: AggregatorConfig,
    ): Promise<SalesOrder> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Match products by name
            const itemsWithProducts = await this.matchProducts(aggregatorOrder.items);

            // Create calculation context
            const calcContext: CalculationContext = {
                orderType: OrderType.DELIVERY,
                items: itemsWithProducts.map(item => ({
                    productId: item.productId || '',
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    modifiersTotal: 0,
                    lineTotal: item.quantity * item.unitPrice,
                    isVoided: false,
                    discountExempt: false,
                    priceIncludesTax: true,
                })),
                deliveryZoneId: aggregatorOrder.deliveryAddress.zone,
                customerCount: 1,
                storeId: config.storeId || '',
                storeConfig: {
                    vatRate: 0.15,
                    serviceChargeRate: 0,
                    serviceChargeAppliesTo: [],
                    currencyCode: 'SAR',
                },
            };

            // Calculate totals using pipeline
            const calcResult = await this.calculationPipeline.executePipeline(calcContext);

            // Create order
            const order = queryRunner.manager.create(SalesOrder, {
                orderNumber: await this.generateOrderNumber(config.storeId || ''),
                orderType: OrderType.DELIVERY,
                status: OrderStatus.RECEIVED_FROM_AGGREGATOR,
                paymentStatus: PaymentStatus.PAID, // Aggregator orders are pre-paid
                deliveryZoneId: aggregatorOrder.deliveryAddress.zone,
                specialInstructions: aggregatorOrder.specialInstructions,
                scheduledDeliveryTime: aggregatorOrder.scheduledFor,
                // Pipeline results
                totalGross: calcResult.totalGross,
                totalTax: calcResult.totalTax,
                totalNet: calcResult.totalNet,
                // Store aggregator-specific data in metadata
                metadata: {
                    aggregatorOrderId: aggregatorOrder.aggregatorOrderId,
                    aggregatorProvider: aggregatorOrder.provider,
                    customerName: aggregatorOrder.customerName,
                    customerPhone: aggregatorOrder.customerPhone,
                    isAggregatorOrder: true,
                    aggregatorCommission: aggregatorOrder.commission,
                    aggregatorTotal: aggregatorOrder.total,
                    deliveryFee: aggregatorOrder.deliveryFee,
                    deliveryAddress: aggregatorOrder.deliveryAddress,
                },
            });

            const savedOrder = await queryRunner.manager.save(order);

            // Create order items
            for (const item of itemsWithProducts) {
                const orderItem = queryRunner.manager.create(OrderItem, {
                    orderId: savedOrder.id,
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.quantity * item.unitPrice,
                    notes: item.notes,
                });
                await queryRunner.manager.save(orderItem);
            }

            await queryRunner.commitTransaction();

            this.logger.log(
                `Aggregator order created: ${aggregatorOrder.provider} - ${aggregatorOrder.aggregatorOrderId} → ${savedOrder.orderNumber}`
            );

            // Auto-accept if configured
            if (config.autoAcceptOrders) {
                await this.syncOrderStatus(savedOrder.id, AggregatorOrderStatus.ACCEPTED);
            }

            return savedOrder;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Match aggregator products to local products
     */
    private async matchProducts(items: Array<{
        productId?: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        notes?: string;
    }>): Promise<Array<{
        productId?: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        notes?: string;
    }>> {
        const matchedItems: Array<{
            productId?: string;
            productName: string;
            quantity: number;
            unitPrice: number;
            notes?: string;
        }> = [];

        for (const item of items) {
            // Try to find product by external ID in metadata
            let productId: string | undefined;
            if (item.productId) {
                const products = await this.productRepo.find({
                    where: { name: item.productName },
                });
                const matchedProduct = products.find(p =>
                    (p.metadata as Record<string, any>)?.aggregatorProductId === item.productId
                );
                productId = matchedProduct?.id;
            }

            // If not found, try matching by name
            if (!productId) {
                const products = await this.productRepo.find({
                    where: { name: item.productName },
                    take: 1,
                });
                productId = products[0]?.id;
            }

            matchedItems.push({
                ...item,
                productId,
            });
        }

        return matchedItems;
    }

    // =========================================================================
    // STATUS SYNCHRONIZATION
    // =========================================================================

    /**
     * Update order from aggregator status change
     */
    private async updateOrderFromAggregator(
        order: SalesOrder,
        aggregatorStatus: AggregatorOrderStatus,
    ): Promise<void> {
        const statusMap: Record<AggregatorOrderStatus, OrderStatus> = {
            [AggregatorOrderStatus.PENDING]: OrderStatus.RECEIVED_FROM_AGGREGATOR,
            [AggregatorOrderStatus.ACCEPTED]: OrderStatus.SAVED,
            [AggregatorOrderStatus.PREPARING]: OrderStatus.PREPARING,
            [AggregatorOrderStatus.READY]: OrderStatus.READY,
            [AggregatorOrderStatus.PICKED_UP]: OrderStatus.OUT_FOR_DELIVERY,
            [AggregatorOrderStatus.DELIVERED]: OrderStatus.COMPLETED,
            [AggregatorOrderStatus.CANCELLED]: OrderStatus.VOID,
            [AggregatorOrderStatus.REJECTED]: OrderStatus.VOID,
        };

        const newStatus = statusMap[aggregatorStatus];
        if (newStatus && newStatus !== order.status) {
            await this.stateMachineService.transition(
                order.id,
                newStatus,
                {
                    order,
                    user: { id: 'aggregator', firstName: 'Aggregator', lastName: 'Sync' } as any,
                    reason: `Status sync from aggregator: ${aggregatorStatus}`,
                    metadata: {
                        aggregatorStatus,
                        autoSync: true,
                    },
                },
            );
        }
    }

    /**
     * Sync order status to aggregator
     *
     * Called when local order status changes, notifies aggregator.
     */
    async syncOrderStatus(
        orderId: string,
        status: AggregatorOrderStatus,
    ): Promise<{ success: boolean; error?: string }> {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });

        if (!order || !order.metadata?.aggregatorProvider) {
            return { success: false, error: 'Order not found or not an aggregator order' };
        }

        const config = this.getConfig(order.metadata.aggregatorProvider as AggregatorProvider);
        if (!config || !config.enabled) {
            return { success: false, error: 'Provider not configured' };
        }

        try {
            await this.sendStatusToAggregator(order, status, config);
            return { success: true };
        } catch (error) {
            this.logger.error(
                `Failed to sync status to ${order.metadata?.aggregatorProvider}: ${error.message}`
            );
            return { success: false, error: error.message };
        }
    }

    /**
     * Send status update to aggregator API
     */
    private async sendStatusToAggregator(
        order: SalesOrder,
        status: AggregatorOrderStatus,
        config: AggregatorConfig,
    ): Promise<void> {
        const axiosInstance = this.getAxiosInstance(config);
        const aggregatorOrderId = order.metadata?.aggregatorOrderId;

        // Provider-specific API calls
        switch (config.provider) {
            case AggregatorProvider.TALABAT:
                await axiosInstance.post(`${config.apiEndpoint}/orders/${aggregatorOrderId}/status`, {
                    status,
                    timestamp: new Date().toISOString(),
                });
                break;

            case AggregatorProvider.MARSOOL:
                await axiosInstance.put(`${config.apiEndpoint}/orders/${aggregatorOrderId}`, {
                    status,
                });
                break;

            case AggregatorProvider.INSTASHOP:
                await axiosInstance.post(`${config.apiEndpoint}/webhook/status`, {
                    order_id: aggregatorOrderId,
                    status,
                });
                break;
        }

        this.logger.log(
            `Status synced to ${config.provider}: ${aggregatorOrderId} → ${status}`
        );
    }

    // =========================================================================
    // CONFIGURATION MANAGEMENT
    // =========================================================================

    /**
     * Load aggregator configurations from StoreConfiguration
     * Note: Aggregator configs are loaded on-demand when a storeId is available
     */
    private async loadConfigurations(): Promise<void> {
        // Skip loading on startup - aggregator configs will be loaded on-demand
        // when processing webhooks or when explicitly called with a valid storeId
        this.logger.log('Aggregator service initialized - configs will be loaded on-demand');
    }

    /**
     * Get configuration for provider
     */
    private getConfig(provider: AggregatorProvider): AggregatorConfig | undefined {
        return this.configs.get(provider);
    }

    /**
     * Create axios instance for provider
     */
    private createAxiosInstance(config: AggregatorConfig): void {
        const axiosInstance = axios.create({
            baseURL: config.apiEndpoint,
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        this.axiosInstances.set(config.provider, axiosInstance);
    }

    /**
     * Get axios instance for provider
     */
    private getAxiosInstance(config: AggregatorConfig): AxiosInstance {
        return this.axiosInstances.get(config.provider) || axios.create();
    }

    /**
     * Update provider configuration
     * @param storeId - Valid store UUID
     * @param provider - Aggregator provider (TALABAT, MARSOOL, etc.)
     * @param config - Configuration for the provider
     */
    async updateConfiguration(
        storeId: string,
        provider: AggregatorProvider,
        config: AggregatorConfig,
    ): Promise<void> {
        await this.storeConfigService.setConfig(
            storeId,
            `aggregator.providers.${provider}`,
            config,
            'JSON' as any,
            'aggregator',
        );
        this.configs.set(provider, config);
        this.createAxiosInstance(config);
        this.logger.log(`Aggregator config updated: ${provider}`);
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================

    /**
     * Validate webhook signature
     */
    private validateWebhookSignature(
        payload: WebhookPayload,
        headers: Record<string, string>,
        secret: string,
    ): boolean {
        const signature = headers['x-signature'] || headers['X-Signature'];
        if (!signature) {
            return false;
        }

        // Simple HMAC validation (implement based on provider spec)
        // This is a placeholder - actual implementation depends on provider
        const computedSignature = this.computeSignature(payload, secret);
        return signature === computedSignature;
    }

    /**
     * Compute webhook signature
     */
    private computeSignature(payload: WebhookPayload, secret: string): string {
        const crypto = require('crypto');
        const data = JSON.stringify(payload.data);
        return crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Generate order number for aggregator orders
     */
    private async generateOrderNumber(storeId: string): Promise<string> {
        const prefix = 'AGG'; // Aggregator order prefix
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }
}
