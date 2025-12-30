import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Decimal } from 'decimal.js';
import { InventoryBatch, QualityStatus } from '../entities/inventory-batch.entity';
import { StockMove, StockMoveType, StockReferenceType } from '../entities/stock-move.entity';
import { AddStockDto, DeductStockDto } from '../dto/stock-operation.dto';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from '../entities/warehouse.entity';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(InventoryBatch)
        private readonly batchRepo: Repository<InventoryBatch>,
        @InjectRepository(StockMove)
        private readonly stockMoveRepo: Repository<StockMove>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(Warehouse)
        private readonly warehouseRepo: Repository<Warehouse>,
    ) { }

    @Transactional()
    async addStock(dto: AddStockDto): Promise<InventoryBatch> {
        const product = await this.productRepo.findOneBy({ id: dto.productId });
        if (!product) throw new BadRequestException('Product not found');

        const warehouse = await this.warehouseRepo.findOneBy({ id: dto.warehouseId });
        if (!warehouse) throw new BadRequestException('Warehouse not found');

        // 1. Create Batch
        const batch = this.batchRepo.create({
            product,
            warehouse,
            qtyRemaining: dto.quantity,
            costPerUnit: dto.costPrice,
            receivedDate: new Date(),
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        });
        await this.batchRepo.save(batch);

        // 2. Create Stock Move
        const move = this.stockMoveRepo.create({
            product,
            warehouse,
            batch,
            quantity: dto.quantity,
            moveType: StockMoveType.IN,
            referenceType: dto.referenceType || StockReferenceType.MANUAL,
            referenceId: dto.referenceId,
            costPerUnit: dto.costPrice,
        });
        await this.stockMoveRepo.save(move);

        return batch;
    }

    @Transactional()
    async deductInventory(dto: DeductStockDto): Promise<StockMove[]> {
        const { productId, warehouseId, quantity } = dto;
        let qtyToDeduct = quantity;

        // 1. Fetch batches FIFO (Oldest First)
        const batches = await this.batchRepo.find({
            where: {
                product: { id: productId },
                warehouse: { id: warehouseId },
                qtyRemaining: MoreThan(0),
            },
            order: { receivedDate: 'ASC' },
        });

        const totalAvailable = batches.reduce((sum, b) => sum + Number(b.qtyRemaining), 0);
        if (totalAvailable < qtyToDeduct) {
            throw new BadRequestException({
                code: 'INV_002',
                message: `Insufficient stock. Required: ${qtyToDeduct}, Available: ${totalAvailable}`,
            });
        }

        const moves: StockMove[] = [];

        // 2. Iterate and Deduct
        for (const batch of batches) {
            if (qtyToDeduct <= 0) break;

            const batchQty = Number(batch.qtyRemaining);
            const deduction = Math.min(batchQty, qtyToDeduct);

            // Update Batch
            batch.qtyRemaining = batchQty - deduction;
            await this.batchRepo.save(batch);

            // Create Stock Move
            const move = this.stockMoveRepo.create({
                product: { id: productId },
                warehouse: { id: warehouseId },
                batch: batch,
                quantity: deduction,
                moveType: StockMoveType.OUT,
                referenceType: dto.referenceType || StockReferenceType.MANUAL,
                referenceId: dto.referenceId,
                costPerUnit: batch.costPerUnit, // COGS tracking
            });
            await this.stockMoveRepo.save(move);
            moves.push(move);

            qtyToDeduct -= deduction;
        }

        return moves;
    }

    /**
     * Get inventory summary grouped by product and warehouse
     */
    async getInventorySummary(warehouseId?: string): Promise<any[]> {
        const qb = this.batchRepo
            .createQueryBuilder('batch')
            .leftJoinAndSelect('batch.product', 'product')
            .leftJoinAndSelect('batch.warehouse', 'warehouse')
            .leftJoinAndSelect('product.category', 'category')
            .where('batch.qtyRemaining > 0');

        if (warehouseId) {
            qb.andWhere('warehouse.id = :warehouseId', { warehouseId });
        }

        const batches = await qb.getMany();

        // Group by product + warehouse
        const summaryMap = new Map<string, any>();

        for (const batch of batches) {
            const key = `${batch.product.id}-${batch.warehouse.id}`;

            if (!summaryMap.has(key)) {
                summaryMap.set(key, {
                    productId: batch.product.id,
                    productName: batch.product.name,
                    productSku: batch.product.sku,
                    categoryName: batch.product.category?.name || null,
                    warehouseId: batch.warehouse.id,
                    warehouseName: batch.warehouse.name,
                    totalQty: 0,
                    totalValue: 0,
                    batchCount: 0,
                    reorderLevel: (batch.product as any).behaviorConfig?.min_quantity || null,
                    isLowStock: false,
                    earliestExpiry: null,
                });
            }

            const summary = summaryMap.get(key);
            const qty = Number(batch.qtyRemaining);
            const cost = Number(batch.costPerUnit);

            summary.totalQty += qty;
            summary.totalValue += qty * cost;
            summary.batchCount += 1;

            // Track earliest expiry
            if (batch.expiryDate) {
                if (!summary.earliestExpiry || new Date(batch.expiryDate) < new Date(summary.earliestExpiry)) {
                    summary.earliestExpiry = batch.expiryDate;
                }
            }
        }

        // Calculate averages and check low stock
        const results = Array.from(summaryMap.values()).map(item => {
            item.avgCost = item.totalQty > 0 ? (item.totalValue / item.totalQty).toFixed(3) : '0.000';
            item.totalQty = item.totalQty.toFixed(3);
            item.totalValue = item.totalValue.toFixed(3);
            item.isLowStock = item.reorderLevel && Number(item.totalQty) <= Number(item.reorderLevel);
            return item;
        });

        return results;
    }

    /**
     * Get all batches with optional filters
     */
    async getBatches(filters: {
        warehouseId?: string;
        productId?: string;
        qualityStatus?: string;
        expiringWithinDays?: number;
    }): Promise<InventoryBatch[]> {
        const qb = this.batchRepo
            .createQueryBuilder('batch')
            .leftJoinAndSelect('batch.product', 'product')
            .leftJoinAndSelect('batch.warehouse', 'warehouse')
            .where('batch.qtyRemaining > 0')
            .orderBy('batch.receivedDate', 'ASC'); // FIFO order

        if (filters.warehouseId) {
            qb.andWhere('warehouse.id = :warehouseId', { warehouseId: filters.warehouseId });
        }

        if (filters.productId) {
            qb.andWhere('product.id = :productId', { productId: filters.productId });
        }

        if (filters.qualityStatus) {
            qb.andWhere('batch.qualityStatus = :qualityStatus', { qualityStatus: filters.qualityStatus });
        }

        if (filters.expiringWithinDays) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + filters.expiringWithinDays);
            qb.andWhere('batch.expiryDate IS NOT NULL AND batch.expiryDate <= :expiryDate', { expiryDate });
        }

        return qb.take(100).getMany();
    }

    // ==================== STOCK RESERVATION FOR POS ====================

    /**
     * Reserve stock for checkout
     *
     * Creates a temporary reservation on inventory to prevent overselling
     * Reservation expires after a configurable time (default 5 minutes)
     *
     * @param params Reservation parameters
     * @returns The stock reservation ID
     */
    @Transactional()
    async reserveStock(params: {
        productId: string;
        warehouseId: string;
        quantity: number | Decimal;
        sessionId: string;
        orderId?: string;
        reason?: string;
        expiresInMinutes?: number;
    }): Promise<string> {
        const qtyToReserve = params.quantity instanceof Decimal
            ? params.quantity
            : new Decimal(params.quantity);

        // Check availability
        const batches = await this.batchRepo.find({
            where: {
                product: { id: params.productId },
                warehouse: { id: params.warehouseId },
                qtyRemaining: MoreThan(0),
            },
            order: { receivedDate: 'ASC' },
        });

        const totalAvailable = batches.reduce(
            (sum, b) => sum.plus(new Decimal(b.qtyRemaining)),
            new Decimal(0),
        );

        if (totalAvailable.lessThan(qtyToReserve)) {
            throw new BadRequestException({
                code: 'INV_001',
                messageKey: 'INSUFFICIENT_STOCK',
                message: `Insufficient stock. Required: ${qtyToReserve}, Available: ${totalAvailable}`,
            });
        }

        // Create reservation using a special stock move type
        const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + (params.expiresInMinutes || 5));

        // Create stock move as reservation (doesn't actually deduct yet)
        const reservationMove = this.stockMoveRepo.create();
        reservationMove.product = { id: params.productId } as any;
        reservationMove.warehouse = { id: params.warehouseId } as any;
        reservationMove.quantity = qtyToReserve.toNumber();
        reservationMove.moveType = StockMoveType.RESERVATION;
        reservationMove.referenceType = StockReferenceType.SALE;
        reservationMove.referenceId = reservationId;
        reservationMove.metadata = {
            sessionId: params.sessionId,
            orderId: params.orderId,
            reason: params.reason,
            expiresAt: expiryDate.toISOString(),
            status: 'PENDING',
        };

        await this.stockMoveRepo.save(reservationMove);

        return reservationId;
    }

    /**
     * Commit a reservation - actually deduct the stock
     *
     * Called when payment is confirmed and order is finalized
     *
     * @param reservationId The reservation ID to commit
     */
    @Transactional()
    async commitReservation(reservationId: string): Promise<void> {
        // Find the reservation move
        const reservationMove = await this.stockMoveRepo.findOne({
            where: { referenceId: reservationId },
            relations: ['product', 'warehouse'],
        });

        if (!reservationMove) {
            throw new BadRequestException({
                code: 'INV_003',
                messageKey: 'RESERVATION_NOT_FOUND',
                message: 'Stock reservation not found',
            });
        }

        // Check if already committed
        if (reservationMove.metadata?.status === 'COMMITTED') {
            return; // Already committed, no action needed
        }

        // Actually deduct the inventory using FIFO
        await this.deductInventory({
            productId: reservationMove.product.id,
            warehouseId: reservationMove.warehouse.id,
            quantity: reservationMove.quantity,
            referenceType: StockReferenceType.SALE,
            referenceId: reservationMove.metadata?.orderId || reservationId,
        });

        // Update reservation status
        reservationMove.metadata = {
            ...reservationMove.metadata,
            status: 'COMMITTED',
            committedAt: new Date().toISOString(),
        };
        await this.stockMoveRepo.save(reservationMove);
    }

    /**
     * Release a reservation - cancel the temporary hold
     *
     * Called when checkout is cancelled or times out
     *
     * @param reservationId The reservation ID to release
     */
    @Transactional()
    async releaseReservation(reservationId: string): Promise<void> {
        const reservationMove = await this.stockMoveRepo.findOne({
            where: { referenceId: reservationId },
        });

        if (!reservationMove) {
            return; // Already released or never existed
        }

        // Update status to released
        reservationMove.metadata = {
            ...reservationMove.metadata,
            status: 'RELEASED',
            releasedAt: new Date().toISOString(),
        };
        await this.stockMoveRepo.save(reservationMove);
    }

    /**
     * Restore stock (for void operations)
     *
     * Adds stock back to inventory when an order/item is voided
     *
     * @param params Restoration parameters
     */
    @Transactional()
    async restoreStock(params: {
        productId: string;
        quantity: number | Decimal;
        reason: string;
        referenceType: StockReferenceType;
        referenceId: string;
        warehouseId?: string;
    }): Promise<void> {
        const qtyToRestore = params.quantity instanceof Decimal
            ? params.quantity
            : new Decimal(params.quantity);

        // Use default warehouse if not specified
        const warehouseId = params.warehouseId || await this.getDefaultWarehouse(params.productId);

        // Add stock as a "return" - creates new batches or adds to existing
        // For simplicity, we create a new batch with the current average cost
        const product = await this.productRepo.findOneBy({ id: params.productId });

        if (!product) {
            throw new BadRequestException('Product not found');
        }

        const costPerUnit = product.costPrice || 0;

        // Create a batch for the returned stock
        const batch = this.batchRepo.create();
        batch.product = product;
        batch.warehouse = { id: warehouseId } as any;
        batch.qtyRemaining = qtyToRestore.toNumber();
        batch.costPerUnit = costPerUnit;
        batch.receivedDate = new Date();
        batch.qualityStatus = QualityStatus.GOOD;

        await this.batchRepo.save(batch);

        // Create stock move record
        const move = this.stockMoveRepo.create();
        move.product = product;
        move.warehouse = { id: warehouseId } as any;
        move.batch = batch;
        move.quantity = qtyToRestore.toNumber();
        move.moveType = StockMoveType.RETURN;
        move.referenceType = params.referenceType;
        move.referenceId = params.referenceId;
        move.costPerUnit = costPerUnit;

        await this.stockMoveRepo.save(move);
    }

    /**
     * Get stock availability for POS
     *
     * Returns current available quantity for a product at a warehouse
     *
     * @param productId The product ID
     * @param warehouseId The warehouse ID
     * @returns Available quantity
     */
    async getAvailableStock(productId: string, warehouseId: string): Promise<Decimal> {
        const batches = await this.batchRepo.find({
            where: {
                product: { id: productId },
                warehouse: { id: warehouseId },
                qtyRemaining: MoreThan(0),
            },
        });

        return batches.reduce(
            (sum, b) => sum.plus(new Decimal(b.qtyRemaining)),
            new Decimal(0),
        );
    }

    /**
     * Check availability for multiple items (POS checkout)
     *
     * Returns a map of product ID to availability status
     *
     * @param items Array of items to check
     * @param warehouseId The warehouse to check
     * @returns Map of availability results
     */
    async checkAvailabilityForPOS(
        items: Array<{ productId: string; quantity: number | Decimal }>,
        warehouseId: string,
    ): Promise<Map<string, { isAvailable: boolean; requested: Decimal; availableQty: Decimal }>> {
        const results = new Map();

        for (const item of items) {
            const requestedQty = item.quantity instanceof Decimal
                ? item.quantity
                : new Decimal(item.quantity);

            const availableQty = await this.getAvailableStock(item.productId, warehouseId);

            results.set(item.productId, {
                isAvailable: availableQty.greaterThanOrEqualTo(requestedQty),
                requested: requestedQty,
                availableQty: availableQty,
            });
        }

        return results;
    }

    /**
     * Clean up expired reservations
     *
     * Should be run periodically (e.g., every 5 minutes)
     * Releases reservations that have expired
     */
    @Transactional()
    async cleanupExpiredReservations(): Promise<number> {
        const now = new Date();

        const expiredReservations = await this.stockMoveRepo.find({
            where: {
                moveType: StockMoveType.RESERVATION,
            },
        });

        let cleaned = 0;

        for (const reservation of expiredReservations) {
            const expiresAt = reservation.metadata?.expiresAt;

            if (expiresAt && new Date(expiresAt) < now && reservation.metadata?.status === 'PENDING') {
                await this.releaseReservation(reservation.referenceId);
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * Get default warehouse for a product
     */
    private async getDefaultWarehouse(productId: string): Promise<string> {
        const product = await this.productRepo.findOneBy({ id: productId });

        if (product?.defaultWarehouseId) {
            return product.defaultWarehouseId;
        }

        // Return first warehouse found (or throw if none)
        const warehouse = await this.warehouseRepo.findOne({ where: {} });

        if (!warehouse) {
            throw new BadRequestException('No warehouse configured');
        }

        return warehouse.id;
    }
}
