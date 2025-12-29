import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { InventoryBatch } from '../entities/inventory-batch.entity';
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
}
