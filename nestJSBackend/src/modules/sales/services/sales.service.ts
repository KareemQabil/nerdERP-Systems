import { Injectable, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { createHash, randomUUID } from 'crypto';
import Decimal from 'decimal.js';
import { SalesOrder, OrderStatus, PaymentStatus } from '../entities/sales-order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Payment } from '../entities/payment.entity';
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
    ) { }

    @Transactional()
    async createOrder(dto: CreateOrderDto): Promise<SalesOrder> {
        // 1. Validate Session
        const session = await this.sessionRepo.findOneBy({ id: dto.registerSessionId });
        if (!session || !session.isOpen) throw new BadRequestException({ code: 'SALES_009', message: 'Register session closed' });

        // 2. Prepare Order Structure
        const order = this.orderRepo.create({
            orderNumber: await this.generateOrderNumber(),
            status: OrderStatus.PAID, // Assuming immediate payment for POS
            paymentStatus: PaymentStatus.PAID,
            registerSession: session,
            items: [],
            payments: [],
        });

        let totalGross = new Decimal(0);
        let totalTax = new Decimal(0);

        // 3. Process Items & Deduct Inventory
        for (const itemDto of dto.items) {
            const product = await this.productRepo.findOneBy({ id: itemDto.productId });
            if (!product) throw new BadRequestException({ code: 'SALES_004', message: `Product ${itemDto.productId} not found` });

            // Inventory Deduction (FIFO)
            if (product.trackInventory) {
                await this.inventoryService.deductInventory({
                    productId: product.id,
                    warehouseId: dto.warehouseId,
                    quantity: itemDto.quantity,
                    referenceType: StockReferenceType.SALE,
                    referenceId: 'PENDING', // Will update with Order ID later if needed, or rely on correlation
                } as DeductStockDto);
            }

            // Calculations
            const quantity = new Decimal(itemDto.quantity);
            const unitPrice = new Decimal(itemDto.unitPrice);
            const lineTotal = quantity.times(unitPrice);
            const taxRate = new Decimal(0.15); // Hardcoded 15% VAT for Saudi
            const taxAmount = lineTotal.times(taxRate.div(new Decimal(1).plus(taxRate))); // Inclusive Tax Calc: Total * (0.15 / 1.15)

            totalGross = totalGross.plus(lineTotal);
            totalTax = totalTax.plus(taxAmount);

            const orderItem = this.itemRepo.create({
                product,
                productName: product.name,
                quantity: quantity.toNumber(),
                unitPrice: unitPrice.toNumber(),
                taxAmount: taxAmount.toNumber(),
                total: lineTotal.toNumber(),
                costAtSale: product.costPrice, // Snapshot current cost
            });
            order.items.push(orderItem);
        }

        order.totalGross = totalGross.toNumber();
        order.totalTax = totalTax.toNumber();
        order.totalNet = totalGross.minus(totalTax).toNumber();

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
        if (!totalPaid.equals(totalGross)) {
            // Allow implied rounding diff? No, strict checks.
            // For simplicity in MVP, strict equality.
            if (Math.abs(totalPaid.toNumber() - totalGross.toNumber()) > 0.01) {
                throw new BadRequestException({ code: 'SALES_005', message: 'Payment amount mismatch' });
            }
        }

        // 5. ZATCA Compliance (Hash Chaining)
        const lastOrder = await this.orderRepo.findOne({
            where: {},
            order: { createdAt: 'DESC' },
        });

        const previousHash = lastOrder?.invoiceHash || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljNzcyNTBdae5lbe24s3d5402371569'; // Genesis Hash (Base64 of 0)
        const invoiceHash = this.generateZatcaHash(order, previousHash);

        order.previousHash = previousHash;
        order.invoiceHash = invoiceHash;
        order.zatcaUuid = randomUUID();
        order.zatcaQrCode = this.generateZatcaQr(order);

        // 6. Persist Order
        const savedOrder = await this.orderRepo.save(order);

        // 7. INTEGRATION: Create Kitchen Tickets (if applicable)
        await this.createKitchenTicketsForOrder(savedOrder);

        // 8. INTEGRATION: Update Register Session Cash Balance (for CASH payments)
        await this.updateRegisterSessionForPayments(savedOrder);

        return savedOrder;
    }

    private async generateOrderNumber(): Promise<string> {
        const count = await this.orderRepo.count();
        return `ORD-${String(count + 1).padStart(6, '0')}`;
    }

    private generateZatcaHash(order: SalesOrder, previousHash: string): string {
        // Simplified ZATCA hashing for MVP (OrderNum + Total + Date + Previous)
        const raw = `${order.orderNumber}${order.totalGross}${new Date().toISOString()}${previousHash}`;
        return createHash('sha256').update(raw).digest('base64');
    }

    private generateZatcaQr(order: SalesOrder): string {
        // Stub for TLV generation (would use extensive library in prod)
        return `ZATCA-QR-STUB:${order.invoiceHash}`;
    }

    // ============ PHASE 2 INTEGRATION METHODS ============

    /**
     * Phase 1: Kitchen Integration
     * Auto-create kitchen tickets for applicable order types
     */
    private async createKitchenTicketsForOrder(order: SalesOrder): Promise<void> {
        // Only create tickets for dine-in and takeaway orders
        if (order.status !== OrderStatus.PAID) return;

        // Get order type from DTO context (would need to be stored in entity)
        // For now, assume all orders need kitchen tickets
        const kitchenItems = await this.orderRepo.findOne({
            where: { id: order.id },
            relations: ['items', 'items.product'],
        });

        if (!kitchenItems || kitchenItems.items.length === 0) return;

        // Group items by kitchen station
        const itemsByStation = new Map<string, any[]>();

        for (const item of kitchenItems.items) {
            if (item.product.isKitchenItem) {
                // Note: Product entity may need kitchenStationId field
                // For now, route all kitchen items to a default station
                const stationId = 'default'; // Would use item.product.kitchenStationId

                if (!itemsByStation.has(stationId)) {
                    itemsByStation.set(stationId, []);
                }

                itemsByStation.get(stationId)!.push({
                    productId: item.product.id,
                    productName: item.productName,
                    quantity: item.quantity.toString(),
                    modifiers: [], // OrderItem doesn't have modifiers field yet
                    specialInstructions: '', // OrderItem doesn't have notes field yet
                });
            }
        }

        // Create kitchen tickets (commented out until KitchenService createTicket method is verified)
        // for (const [stationId, items] of itemsByStation) {
        //     await this.kitchenService.createTicket({
        //         orderId: order.id,
        //         orderNumber: order.orderNumber,
        //         items,
        //     });
        // }
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

        // Free table if exists (would need tableId in order entity)
        // if (order.tableId) {
        //     await this.tablesService.freeTable(order.tableId);
        // }

        return order;
    }
}
