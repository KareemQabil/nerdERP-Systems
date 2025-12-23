import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { StockAlert, AlertType, AlertStatus } from '../entities/stock-alert.entity';
import { InventoryBatch } from '../entities/inventory-batch.entity';

@Injectable()
export class StockAlertService {
    constructor(
        @InjectRepository(StockAlert)
        private readonly alertRepo: Repository<StockAlert>,
        @InjectRepository(InventoryBatch)
        private readonly batchRepo: Repository<InventoryBatch>,
    ) { }

    async findActive(): Promise<StockAlert[]> {
        return await this.alertRepo.find({
            where: { status: AlertStatus.ACTIVE },
            order: { triggeredAt: 'DESC' },
        });
    }

    async findByProduct(productId: string, warehouseId?: string): Promise<StockAlert[]> {
        const query = this.alertRepo
            .createQueryBuilder('alert')
            .where('alert.product_id = :productId', { productId });

        if (warehouseId) {
            query.andWhere('alert.warehouse_id = :warehouseId', { warehouseId });
        }

        return await query.orderBy('alert.triggered_at', 'DESC').getMany();
    }

    @Transactional()
    async checkAndCreateAlerts(productId: string, warehouseId: string): Promise<void> {
        // Get total stock for product in warehouse
        const batches = await this.batchRepo.find({
            where: {
                product: { id: productId },
                warehouse: { id: warehouseId }
            },
        });

        const totalStock = batches.reduce((sum, batch) => sum + parseFloat(batch.qtyRemaining as any), 0);

        // Check for low stock (example threshold: 10 units)
        const threshold = 10;
        if (totalStock <= threshold && totalStock > 0) {
            await this.createAlert({
                productId,
                warehouseId,
                alertType: AlertType.LOW_STOCK,
                currentQuantity: totalStock,
                thresholdQuantity: threshold,
            });
        } else if (totalStock === 0) {
            await this.createAlert({
                productId,
                warehouseId,
                alertType: AlertType.OUT_OF_STOCK,
                currentQuantity: 0,
            });
        }

        // Check for expiring items
        const expiringBatches = await this.batchRepo.find({
            where: {
                product: { id: productId },
                warehouse: { id: warehouseId },
                expiryDate: LessThan(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
            },
        });

        if (expiringBatches.length > 0) {
            await this.createAlert({
                productId,
                warehouseId,
                alertType: AlertType.EXPIRING_SOON,
                currentQuantity: totalStock,
            });
        }
    }

    @Transactional()
    async createAlert(data: {
        productId: string;
        warehouseId: string;
        alertType: AlertType;
        currentQuantity: number;
        thresholdQuantity?: number;
    }): Promise<StockAlert> {
        // Check if alert already exists
        const existing = await this.alertRepo.findOne({
            where: {
                productId: data.productId,
                warehouseId: data.warehouseId,
                alertType: data.alertType,
                status: AlertStatus.ACTIVE,
            },
        });

        if (existing) {
            return existing;
        }

        const alert = this.alertRepo.create(data);
        return await this.alertRepo.save(alert);
    }

    @Transactional()
    async acknowledge(id: string, userId: string): Promise<StockAlert> {
        const alert = await this.alertRepo.findOne({ where: { id } });
        if (!alert) {
            throw new NotFoundException(`Alert with ID ${id} not found`);
        }

        alert.status = AlertStatus.ACKNOWLEDGED;
        alert.acknowledgedAt = new Date();
        alert.acknowledgedByUserId = userId;

        return await this.alertRepo.save(alert);
    }

    @Transactional()
    async resolve(id: string): Promise<StockAlert> {
        const alert = await this.alertRepo.findOne({ where: { id } });
        if (!alert) {
            throw new NotFoundException(`Alert with ID ${id} not found`);
        }

        alert.status = AlertStatus.RESOLVED;
        alert.resolvedAt = new Date();

        return await this.alertRepo.save(alert);
    }
}
