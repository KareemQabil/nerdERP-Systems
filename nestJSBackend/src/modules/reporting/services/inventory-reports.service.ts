import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { InventoryBatch } from '../../inventory/entities/inventory-batch.entity';
import { StockMove } from '../../inventory/entities/stock-move.entity';
import Decimal from 'decimal.js';

@Injectable()
export class InventoryReportsService {
    constructor(
        @InjectRepository(InventoryBatch)
        private readonly batchRepo: Repository<InventoryBatch>,
        @InjectRepository(StockMove)
        private readonly stockMoveRepo: Repository<StockMove>,
    ) { }

    /**
     * Get current stock levels across all warehouses
     */
    async getStockLevels(warehouseId?: string) {
        const query = this.batchRepo
            .createQueryBuilder('batch')
            .leftJoinAndSelect('batch.product', 'product')
            .leftJoinAndSelect('batch.warehouse', 'warehouse')
            .where('batch.qty_remaining > :zero', { zero: '0' });

        if (warehouseId) {
            query.andWhere('batch.warehouse_id = :warehouseId', { warehouseId });
        }

        const batches = await query.getMany();

        // Group by product
        const stockByProduct: Record<string, any> = {};

        for (const batch of batches) {
            const productId = batch.product.id;

            if (!stockByProduct[productId]) {
                stockByProduct[productId] = {
                    productId,
                    productName: batch.product.name,
                    totalQuantity: new Decimal(0),
                    batches: [],
                };
            }

            stockByProduct[productId].totalQuantity = stockByProduct[productId].totalQuantity
                .plus(batch.qtyRemaining);

            stockByProduct[productId].batches.push({
                batchNumber: batch.batchNumber,
                warehouse: batch.warehouse.name,
                quantity: batch.qtyRemaining,
                expiryDate: batch.expiryDate,
            });
        }

        return Object.values(stockByProduct).map((item: any) => ({
            ...item,
            totalQuantity: item.totalQuantity.toFixed(3),
        }));
    }

    /**
     * Get low stock alerts (products below reorder point)
     */
    async getLowStockAlerts(threshold: number = 10) {
        const batches = await this.batchRepo
            .createQueryBuilder('batch')
            .leftJoinAndSelect('batch.product', 'product')
            .select('batch.product_id', 'productId')
            .addSelect('product.name', 'productName')
            .addSelect('SUM(batch.qty_remaining)', 'totalQuantity')
            .groupBy('batch.product_id, product.name')
            .having('SUM(batch.qty_remaining) < :threshold', { threshold: threshold.toString() })
            .getRawMany();

        return batches.map(item => ({
            productId: item.productId,
            productName: item.productName,
            currentStock: parseFloat(item.totalQuantity).toFixed(3),
            status: 'LOW_STOCK',
        }));
    }

    /**
     * Get batches expiring within specified days
     */
    async getExpiringBatches(days: number = 30) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const batches = await this.batchRepo
            .createQueryBuilder('batch')
            .leftJoinAndSelect('batch.product', 'product')
            .leftJoinAndSelect('batch.warehouse', 'warehouse')
            .where('batch.expiry_date < :futureDate', { futureDate })
            .andWhere('CAST(batch.qty_remaining AS DECIMAL) > 0')
            .orderBy('batch.expiry_date', 'ASC')
            .getMany();

        return batches.map(batch => {
            const daysUntilExpiry = Math.ceil(
                (batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
                batchNumber: batch.batchNumber,
                productName: batch.product.name,
                warehouse: batch.warehouse.name,
                quantity: batch.qtyRemaining,
                expiryDate: batch.expiryDate.toISOString().split('T')[0],
                daysUntilExpiry,
                status: daysUntilExpiry <= 7 ? 'URGENT' : daysUntilExpiry <= 14 ? 'WARNING' : 'NOTICE',
            };
        });
    }

    /**
     * Get stock movement history
     */
    async getStockMovements(startDate: Date, endDate: Date, productId?: string) {
        const query = this.stockMoveRepo
            .createQueryBuilder('move')
            .leftJoinAndSelect('move.product', 'product')
            .leftJoinAndSelect('move.warehouse', 'warehouse')
            .where('move.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
            .orderBy('move.created_at', 'DESC')
            .limit(100);

        if (productId) {
            query.andWhere('move.product_id = :productId', { productId });
        }

        const moves = await query.getMany();

        return moves.map(move => ({
            date: move.createdAt.toISOString(),
            productName: move.product.name,
            warehouse: move.warehouse.name,
            moveType: move.moveType,
            quantity: move.quantity,
            referenceType: move.referenceType,
            referenceId: move.referenceId,
        }));
    }
}
