import { Injectable, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';
import { SalesOrder, OrderStatus, PaymentStatus, OrderType } from '../entities/sales-order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Payment, PaymentMethod } from '../entities/payment.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { InventoryService } from '../../inventory/services/inventory.service';
import { Product } from '../../products/entities/product.entity';
import { RegisterSession } from '../../cash/entities/register-session.entity';
import { DeductStockDto } from '../../inventory/dto/stock-operation.dto';
import { StockReferenceType } from '../../inventory/entities/stock-move.entity';
// Phase 2 Integration
import { KitchenService } from '../../kitchen/services/kitchen.service';
import { TablesService } from '../../tables/services/tables.service';
import { RegisterSessionService } from '../../cash/services/register-session.service';
// Phase 4: ZATCA Integration
import { QrCodeService, ZatcaQRData } from '../../zatca/services/qr-code.service';
import { DigitalSignatureService, InvoiceHashData } from '../../zatca/services/digital-signature.service';
// H-POS Enterprise Configuration
import { StoreConfigurationService } from '../../organization/services/store-configuration.service';

@Injectable()
export class SalesService {
    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(OrderItem)
        private readonly itemRepo: Repository<OrderItem>,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(RegisterSession)
        private readonly sessionRepo: Repository<RegisterSession>,
        private readonly inventoryService: InventoryService,
        // Phase 2 Integration Services
        @Inject(forwardRef(() => KitchenService))
        private readonly kitchenService: KitchenService,
        @Inject(forwardRef(() => TablesService))
        private readonly tablesService: TablesService,
        @Inject(forwardRef(() => RegisterSessionService))
        private readonly registerSessionService: RegisterSessionService,
        // Phase 4: ZATCA Services
        private readonly qrCodeService: QrCodeService,
        private readonly digitalSignatureService: DigitalSignatureService,
        // H-POS Enterprise Configuration
        private readonly storeConfigService: StoreConfigurationService,
    ) { }

    @Transactional()
    async createOrder(dto: CreateOrderDto): Promise<SalesOrder> {
        // 1. Validate Session
        const session = await this.sessionRepo.findOneBy({ id: dto.registerSessionId });
        if (!session || !session.isOpen) throw new BadRequestException({ code: 'SALES_009', message: 'Register session closed' });

        // H-POS Enterprise: Get store configuration for dynamic rates
        const posConfig = session.storeId
            ? await this.storeConfigService.getPOSConfig(session.storeId)
            : { vatRate: 0.14, serviceChargeRate: 0.12, serviceChargeAppliesTo: ['DINE_IN'] }; // Defaults

        // 2. Prepare Order Structure
        const order = this.orderRepo.create({
            orderNumber: await this.generateOrderNumber(),
            status: OrderStatus.PAID, // Assuming immediate payment for POS
            paymentStatus: PaymentStatus.PAID,
            registerSession: session,
            items: [],
            payments: [],
            // H-POS: Order Type fields
            orderType: dto.orderType,
            tableId: dto.tableId,
            customerCount: dto.customerCount,
        });

        let totalGross = new Decimal(0);

        // 3. Process Items & Deduct Inventory
        for (const itemDto of dto.items) {
            const product = await this.productRepo.findOneBy({ id: itemDto.productId });
            if (!product) throw new BadRequestException(`Product ${itemDto.productId} not found`);

            // Deduct Inventory (FIFO handled in InventoryService)
            if (product.trackInventory) {
                await this.inventoryService.deductInventory({
                    productId: product.id,
                    warehouseId: dto.warehouseId,
                    quantity: itemDto.quantity,
                    referenceType: StockReferenceType.SALE,
                    referenceId: 'TEMP', // Will be replaced with actual order ID
                });
            }

            // Calculations (without tax - will calculate after service charge)
            const quantity = new Decimal(itemDto.quantity);
            const unitPrice = new Decimal(itemDto.unitPrice);
            const lineTotal = quantity.times(unitPrice);

            totalGross = totalGross.plus(lineTotal);

            const orderItem = this.itemRepo.create({
                product,
                productName: product.name,
                quantity: quantity.toNumber(),
                unitPrice: unitPrice.toNumber(),
                taxAmount: 0, // Will be calculated after service charge
                total: lineTotal.toNumber(),
                costAtSale: product.costPrice, // Snapshot current cost
            });
            order.items.push(orderItem);
        }

        // H-POS: Calculate Service Charge (based on store config)
        let serviceChargeAmount = new Decimal(0);
        const serviceChargeAppliesTo = posConfig.serviceChargeAppliesTo || ['DINE_IN'];
        const orderTypeStr = dto.orderType || '';
        if (orderTypeStr && serviceChargeAppliesTo.includes(orderTypeStr) && dto.tableId) {
            // Service charge is calculated on items subtotal
            serviceChargeAmount = totalGross.times(new Decimal(posConfig.serviceChargeRate));
        }

        // H-POS: Calculate totals with service charge
        // Calculation flow:
        // 1. Items Subtotal (totalGross)
        // 2. + Service Charge (based on config)
        // 3. = Subtotal Before Tax
        // 4. + VAT (on Subtotal Before Tax) - from store config
        // 5. = Total Net
        const subtotalBeforeTax = totalGross.plus(serviceChargeAmount);
        const taxRate = new Decimal(posConfig.vatRate);
        const totalTax = subtotalBeforeTax.times(taxRate.div(new Decimal(1).plus(taxRate))); // Inclusive tax
        const totalNet = subtotalBeforeTax.plus(totalTax);

        // Store service charge in order
        if (orderTypeStr && serviceChargeAppliesTo.includes(orderTypeStr) && dto.tableId) {
            order.serviceChargeRate = posConfig.serviceChargeRate;
            order.serviceChargeAmount = serviceChargeAmount.toNumber();
        }

        order.totalGross = totalGross.toNumber(); // Items subtotal (before service charge and tax)
        order.totalTax = totalTax.toNumber();
        order.totalNet = totalNet.toNumber(); // Final total including service charge and tax

        // 4. Process Payments
        let totalPaid = new Decimal(0);
        for (const payDto of dto.payments) {
            const amount = new Decimal(payDto.amount);
            totalPaid = totalPaid.plus(amount);
            const payment = this.paymentRepo.create({
                amount: amount.toNumber(),
                method: payDto.method,
            });
            order.payments.push(payment);
        }

        // Validate Payment Totals
        // Allow some tolerance for rounding differences between frontend and backend
        const paymentDiff = totalPaid.minus(totalNet).abs();
        const tolerance = new Decimal(0.10); // 10 halalas / qirsh tolerance

        if (paymentDiff.greaterThan(tolerance)) {
            // Only reject if underpaid significantly
            if (totalPaid.lessThan(totalNet.minus(tolerance))) {
                throw new BadRequestException({
                    code: 'SALES_005',
                    message: `Payment amount mismatch. Expected: ${totalNet.toFixed(2)}, Received: ${totalPaid.toFixed(2)}`
                });
            }
        }

        // 5. ZATCA Compliance (Hash Chaining & QR Code)
        // Get invoice sequence count for invoice number generation
        const orderCount = await this.orderRepo.count();
        const invoiceNumber = this.digitalSignatureService.generateInvoiceNumber(orderCount + 1);

        // Create invoice hash chain entry
        const hashData: InvoiceHashData = {
            orderId: 'temp', // Will update with actual ID after save
            invoiceNumber,
            timestamp: new Date().toISOString(),
            totalWithVat: totalNet.toFixed(2),
            vatAmount: totalTax.toFixed(2),
            vatNumber: '300000000000003', // TODO: Get from organization settings
            previousHash: '', // Service will handle this
        };

        const hashEntry = await this.digitalSignatureService.createInvoiceHashEntry(hashData);
        order.previousHash = hashEntry.previousHash;
        order.invoiceHash = hashEntry.invoiceHash;
        order.zatcaUuid = hashEntry.id;
        order.invoiceNumber = invoiceNumber;

        // Generate ZATCA QR code
        const qrData: ZatcaQRData = {
            seller: 'NerdPOS', // TODO: Get from organization settings
            vatNo: '300000000000003', // TODO: Get from organization settings
            timestamp: new Date().toISOString(),
            total: totalNet.toFixed(2),
            vat: totalTax.toFixed(2),
        };
        const qrCode = this.qrCodeService.generateQrForFrontend(qrData) as { encoded: string };
        order.zatcaQrCode = qrCode.encoded;

        // 6. Persist Order
        const savedOrder = await this.orderRepo.save(order);

        // 7. INTEGRATION: Create Kitchen Tickets (if applicable)
        await this.createKitchenTicketsForOrder(savedOrder);

        // 8. INTEGRATION: Update Register Session Cash Balance (for CASH payments)
        await this.updateRegisterSessionForPayments(savedOrder);

        return savedOrder;
    }

    /**
     * Find orders with optional filters
     * Used by Order Lookup and Reprint functionality
     */
    async findOrders(options: {
        status?: OrderStatus;
        limit?: number;
        orderDirection?: 'ASC' | 'DESC';
        storeId?: string;
    }): Promise<SalesOrder[]> {
        const { status, limit = 50, orderDirection = 'DESC', storeId } = options;

        const queryBuilder = this.orderRepo.createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('order.payments', 'payments')
            .leftJoinAndSelect('order.registerSession', 'session');

        if (status) {
            queryBuilder.andWhere('order.status = :status', { status });
        }

        if (storeId) {
            queryBuilder.andWhere('session.storeId = :storeId', { storeId });
        }

        queryBuilder
            .orderBy('order.createdAt', orderDirection)
            .take(limit);

        return queryBuilder.getMany();
    }

    /**
     * Get order by ID with full details including invoice data
     * Used for invoice/receipt display
     */
    async getOrderById(orderId: string): Promise<SalesOrder | null> {
        return await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'items.product', 'payments', 'registerSession'],
        });
    }

    private async generateOrderNumber(): Promise<string> {
        const count = await this.orderRepo.count();
        return `ORD-${String(count + 1).padStart(6, '0')}`;
    }

    // ============ PHASE 2 INTEGRATION METHODS ============

    /**
     * Phase 1: Kitchen Integration
     * Auto-create kitchen tickets for applicable order types
     */
    private async createKitchenTicketsForOrder(order: SalesOrder): Promise<void> {
        // Only fire kitchen tickets for paid orders with kitchen items
        if (order.status !== OrderStatus.PAID) return;

        try {
            // Call kitchen service to fire order
            await this.kitchenService.fireOrderToKitchen(order.id);
        } catch (error: any) {
            // Log error but don't fail order creation
            console.error('[SalesService] Failed to fire order to kitchen:', error);
            // Only throw if there were actual kitchen items that needed firing
            if (error.code === 'KITCHEN_003') {
                // No items to fire is not an error
                return;
            }
            throw error;
        }
    }

    /**
     * Phase 4: Cash Integration  
     * Update register session balance for cash payments
     */
    private async updateRegisterSessionForPayments(order: SalesOrder): Promise<void> {
        const orderWithPayments = await this.orderRepo.findOne({
            where: { id: order.id },
            relations: ['payments', 'registerSession'],
        });

        if (!orderWithPayments || !orderWithPayments.registerSession) return;

        for (const payment of orderWithPayments.payments) {
            if (payment.method === 'CASH') {
                // Create cash transaction record
                // await this.registerSessionService.recordCashTransaction({
                //     sessionId: orderWithPayments.registerSession.id,
                //     transactionType: 'SALE',
                //     amount: payment.amount.toString(),
                //     description: `Sale ${orderWithPayments.orderNumber}`,
                //     referenceType: 'SALES_ORDER',
                //     referenceId: orderWithPayments.id,
                // });
            }
        }
    }

    /**
     * Phase 3: Table Management
     * Occupy table for dine-in orders
     */
    async createDineInOrder(dto: CreateOrderDto & { tableId?: string }): Promise<SalesOrder> {
        // Validate table availability if tableId provided
        if (dto.tableId) {
            const table = await this.tablesService.findTableById(dto.tableId);
            if (table.status !== 'AVAILABLE') {
                throw new BadRequestException({
                    code: 'SALES_011',
                    message: 'Table already occupied',
                });
            }
        }

        // Create order
        const order = await this.createOrder(dto);

        // Occupy table
        if (dto.tableId) {
            await this.tablesService.occupyTable(dto.tableId, order.id);
        }

        return order;
    }

    /**
     * Complete order and free table
     */
    async completeOrderAndFreeTable(orderId: string): Promise<SalesOrder> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items'],
        });

        if (!order) {
            throw new BadRequestException({ code: 'SALES_001', message: 'Order not found' });
        }

        // Free table if exists
        if (order.tableId) {
            await this.tablesService.freeTable(order.tableId);
        }

        return order;
    }

    // =========================================================================
    // H-POS: Order Operations (Save/Get Check Workflow)
    // =========================================================================

    /**
     * Save Check - Create an open (unpaid) order
     * Used for dine-in where payment comes later
     */
    @Transactional()
    async saveCheck(dto: CreateOrderDto): Promise<SalesOrder> {
        // Validate Session
        const session = await this.sessionRepo.findOneBy({ id: dto.registerSessionId });
        if (!session || !session.isOpen) {
            throw new BadRequestException({ code: 'SALES_009', message: 'Register session closed' });
        }

        // Get POS config for rates
        const posConfig = session.storeId
            ? await this.storeConfigService.getPOSConfig(session.storeId)
            : { vatRate: 0.14, serviceChargeRate: 0.12, serviceChargeAppliesTo: ['DINE_IN'] };

        // Create order with OPEN status (not paid yet)
        const order = this.orderRepo.create({
            orderNumber: await this.generateOrderNumber(),
            status: OrderStatus.PENDING, // Open order
            paymentStatus: PaymentStatus.PENDING, // Not paid
            registerSession: session,
            items: [],
            payments: [],
            orderType: dto.orderType,
            tableId: dto.tableId,
            customerCount: dto.customerCount,
            isSalesOrder: true, // H-POS: Track as sales order
        });

        let totalGross = new Decimal(0);

        // Process items (without inventory deduction - will deduct on completion)
        for (const itemDto of dto.items) {
            const product = await this.productRepo.findOneBy({ id: itemDto.productId });
            if (!product) {
                throw new BadRequestException(`Product ${itemDto.productId} not found`);
            }

            const quantity = new Decimal(itemDto.quantity);
            const unitPrice = new Decimal(itemDto.unitPrice);
            const lineTotal = quantity.times(unitPrice);
            totalGross = totalGross.plus(lineTotal);

            const orderItem = this.itemRepo.create({
                product,
                productName: product.name,
                quantity: quantity.toNumber(),
                unitPrice: unitPrice.toNumber(),
                taxAmount: 0,
                total: lineTotal.toNumber(),
                costAtSale: product.costPrice,
            });

            // Phase 1: Reserve stock for tracked inventory items (soft hold)
            if (product.trackInventory) {
                try {
                    const warehouseId = dto.warehouseId || await this.inventoryService.getDefaultWarehouse(product.id);
                    const reservationId = await this.inventoryService.reserveStock({
                        productId: product.id,
                        warehouseId,
                        quantity: itemDto.quantity,
                        sessionId: dto.registerSessionId,
                        reason: 'Order item reservation',
                        expiresInMinutes: 30, // 30 minute hold
                    });
                    orderItem.stockReservationId = reservationId;
                    orderItem.stockCommitted = false;
                } catch (error: any) {
                    // Log but continue - stock check is soft validation
                    console.warn(`[SalesService] Stock reservation failed for ${product.name}: ${error.message}`);
                }
            }

            order.items.push(orderItem);
        }

        // Calculate service charge
        let serviceChargeAmount = new Decimal(0);
        const serviceChargeAppliesTo = posConfig.serviceChargeAppliesTo || ['DINE_IN'];
        const orderTypeStr = dto.orderType || '';
        if (orderTypeStr && serviceChargeAppliesTo.includes(orderTypeStr) && dto.tableId) {
            serviceChargeAmount = totalGross.times(new Decimal(posConfig.serviceChargeRate));
            order.serviceChargeRate = posConfig.serviceChargeRate;
            order.serviceChargeAmount = serviceChargeAmount.toNumber();
        }

        // Calculate totals
        const subtotalBeforeTax = totalGross.plus(serviceChargeAmount);
        const taxRate = new Decimal(posConfig.vatRate);
        const totalTax = subtotalBeforeTax.times(taxRate.div(new Decimal(1).plus(taxRate)));
        const totalNet = subtotalBeforeTax.plus(totalTax);

        order.totalGross = totalGross.toNumber();
        order.totalTax = totalTax.toNumber();
        order.totalNet = totalNet.toNumber();

        // Save order
        const savedOrder = await this.orderRepo.save(order);

        // Create kitchen tickets
        await this.createKitchenTicketsForOrder(savedOrder);

        // Occupy table if dine-in
        if (dto.tableId) {
            await this.tablesService.occupyTable(dto.tableId, savedOrder.id, dto.customerCount);
        }

        return savedOrder;
    }

    /**
     * Get Check - Retrieve an open order by ID
     */
    async getCheckById(orderId: string): Promise<SalesOrder> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'items.product', 'payments', 'registerSession'],
        });

        if (!order) {
            throw new BadRequestException({ code: 'SALES_001', message: 'Order not found' });
        }

        return order;
    }

    /**
     * Get all open checks for a session or table
     */
    async getOpenChecks(filters: {
        registerSessionId?: string;
        tableId?: string;
        storeId?: string;
    }): Promise<SalesOrder[]> {
        const query = this.orderRepo.createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('order.registerSession', 'session')
            .where('order.paymentStatus = :status', { status: PaymentStatus.PENDING });

        if (filters.registerSessionId) {
            query.andWhere('order.registerSession.id = :sessionId', { sessionId: filters.registerSessionId });
        }

        if (filters.tableId) {
            query.andWhere('order.tableId = :tableId', { tableId: filters.tableId });
        }

        if (filters.storeId) {
            query.andWhere('session.storeId = :storeId', { storeId: filters.storeId });
        }

        return await query.orderBy('order.createdAt', 'DESC').getMany();
    }

    /**
     * Add items to an existing open check
     */
    @Transactional()
    async addItemsToCheck(orderId: string, items: Array<{ productId: string; quantity: number; unitPrice: number }>): Promise<SalesOrder> {
        const order = await this.getCheckById(orderId);

        if (order.paymentStatus !== PaymentStatus.PENDING) {
            throw new BadRequestException({ code: 'SALES_003', message: 'Order already paid' });
        }

        // Get POS config
        const session = order.registerSession;
        const posConfig = session?.storeId
            ? await this.storeConfigService.getPOSConfig(session.storeId)
            : { vatRate: 0.14, serviceChargeRate: 0.12, serviceChargeAppliesTo: ['DINE_IN'] };

        let additionalTotal = new Decimal(0);

        // Add new items
        for (const itemDto of items) {
            const product = await this.productRepo.findOneBy({ id: itemDto.productId });
            if (!product) {
                throw new BadRequestException(`Product ${itemDto.productId} not found`);
            }

            const quantity = new Decimal(itemDto.quantity);
            const unitPrice = new Decimal(itemDto.unitPrice);
            const lineTotal = quantity.times(unitPrice);
            additionalTotal = additionalTotal.plus(lineTotal);

            const orderItem = this.itemRepo.create({
                order,
                product,
                productName: product.name,
                quantity: quantity.toNumber(),
                unitPrice: unitPrice.toNumber(),
                taxAmount: 0,
                total: lineTotal.toNumber(),
                costAtSale: product.costPrice,
            });
            await this.itemRepo.save(orderItem);
        }

        // Recalculate totals
        const newTotalGross = new Decimal(order.totalGross).plus(additionalTotal);
        let serviceChargeAmount = new Decimal(0);

        const serviceChargeAppliesTo = posConfig.serviceChargeAppliesTo || ['DINE_IN'];
        const orderTypeStr = order.orderType || '';
        if (orderTypeStr && serviceChargeAppliesTo.includes(orderTypeStr) && order.tableId) {
            serviceChargeAmount = newTotalGross.times(new Decimal(posConfig.serviceChargeRate));
        }

        const subtotalBeforeTax = newTotalGross.plus(serviceChargeAmount);
        const taxRate = new Decimal(posConfig.vatRate);
        const totalTax = subtotalBeforeTax.times(taxRate.div(new Decimal(1).plus(taxRate)));
        const totalNet = subtotalBeforeTax.plus(totalTax);

        order.totalGross = newTotalGross.toNumber();
        order.serviceChargeAmount = serviceChargeAmount.toNumber();
        order.totalTax = totalTax.toNumber();
        order.totalNet = totalNet.toNumber();

        return await this.orderRepo.save(order);
    }

    /**
     * Void/Delete Order
     * Requires manager approval via frontend
     * 
     * Phase 1: Stock handling during void:
     * - Pre-fire items: Release reservation (stock restored)
     * - Post-fire items: Log as waste (inventory already deducted)
     */
    @Transactional()
    async voidOrder(orderId: string, reason: string, voidedBy: string): Promise<SalesOrder> {
        const order = await this.getCheckById(orderId);

        if (order.status === OrderStatus.VOID) {
            throw new BadRequestException({ code: 'SALES_007', message: 'Order already voided' });
        }

        // Phase 1: Handle inventory for each item based on fire status
        for (const item of order.items) {
            if (!item.product?.trackInventory) continue;

            if (item.stockCommitted) {
                // Post-fire: Stock already deducted, log as waste
                // The WasteEntry will be created by a separate waste tracking service
                item.loggedAsWaste = true;
                item.wasteReason = `Order voided: ${reason}`;
                await this.itemRepo.save(item);

                console.log(`[SalesService] Item ${item.productName} logged as waste (post-fire void)`);
            } else if (item.stockReservationId) {
                // Pre-fire: Release the reservation (stock not yet deducted)
                try {
                    await this.inventoryService.releaseReservation(item.stockReservationId);
                    console.log(`[SalesService] Released reservation ${item.stockReservationId} for ${item.productName}`);
                } catch (error: any) {
                    console.warn(`[SalesService] Failed to release reservation: ${error.message}`);
                }
            }
        }

        // Mark as voided
        order.status = OrderStatus.VOID;
        order.paymentStatus = PaymentStatus.REFUNDED;
        order.notes = `VOIDED: ${reason} (by ${voidedBy})`;
        order.voidReason = reason;
        order.voidedByUserId = voidedBy;
        order.voidedAt = new Date();

        // Free table if occupied
        if (order.tableId) {
            await this.tablesService.freeTable(order.tableId);
        }

        return await this.orderRepo.save(order);
    }

    /**
     * Close Check - Finalize and process payment
     */
    @Transactional()
    async closeCheck(orderId: string, payments: Array<{ method: PaymentMethod; amount: number }>): Promise<SalesOrder> {
        const order = await this.getCheckById(orderId);

        if (order.paymentStatus !== PaymentStatus.PENDING) {
            throw new BadRequestException({ code: 'SALES_003', message: 'Order already paid' });
        }

        // Validate payment total
        const totalPaid = payments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
        const totalDue = new Decimal(order.totalNet);

        if (totalPaid.lessThan(totalDue.minus('0.01'))) {
            throw new BadRequestException({ code: 'SALES_005', message: 'Payment amount insufficient' });
        }

        // Process payments
        for (const payDto of payments) {
            const payment = this.paymentRepo.create({
                order,
                method: payDto.method,
                amount: payDto.amount,
            });
            await this.paymentRepo.save(payment);
        }

        // Deduct inventory for all items
        for (const item of order.items) {
            if (item.product?.trackInventory) {
                await this.inventoryService.deductInventory({
                    productId: item.product.id,
                    warehouseId: order.registerSession?.storeId || '',
                    quantity: item.quantity,
                    referenceType: StockReferenceType.SALE,
                    referenceId: order.id,
                });
            }
        }

        // Update order status
        order.status = OrderStatus.COMPLETED;
        order.paymentStatus = PaymentStatus.PAID;
        order.salesOrderClosedAt = new Date();

        // Phase 1: Table Cleaning Workflow
        // Instead of freeing table directly, set to CLEANING status
        // Staff will mark it clean after clearing
        if (order.tableId) {
            try {
                await this.tablesService.setTableCleaning(order.tableId);
            } catch (error: any) {
                // Fallback to freeTable if setTableCleaning fails (e.g., status mismatch)
                console.warn(`[SalesService] Could not set table to cleaning: ${error.message}`);
                await this.tablesService.freeTable(order.tableId);
            }
        }

        // Update register session
        await this.updateRegisterSessionForPayments(order);

        return await this.orderRepo.save(order);
    }
}

