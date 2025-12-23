import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

export enum AlertType {
    LOW_STOCK = 'LOW_STOCK',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    EXPIRING_SOON = 'EXPIRING_SOON',
    EXPIRED = 'EXPIRED',
    REORDER_POINT = 'REORDER_POINT',
}

export enum AlertStatus {
    ACTIVE = 'ACTIVE',
    ACKNOWLEDGED = 'ACKNOWLEDGED',
    RESOLVED = 'RESOLVED',
}

/**
 * Stock Alert Entity
 * Inventory alerts with auto-reorder support
 */
@Entity('stock_alerts')
export class StockAlert extends AbstractEntity {
    @Column({ name: 'product_id' })
    productId: string;

    @Column({ name: 'warehouse_id' })
    warehouseId: string;

    @Column({ type: 'enum', enum: AlertType, name: 'alert_type' })
    alertType: AlertType;

    @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
    status: AlertStatus;

    @Column({
        name: 'current_quantity',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    currentQuantity: number;

    @Column({
        name: 'threshold_quantity',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    thresholdQuantity: number;

    @Column({ name: 'triggered_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    triggeredAt: Date;

    @Column({ name: 'acknowledged_at', type: 'timestamp with time zone', nullable: true })
    acknowledgedAt: Date;

    @Column({ name: 'acknowledged_by_user_id', nullable: true })
    acknowledgedByUserId: string;

    @Column({ name: 'resolved_at', type: 'timestamp with time zone', nullable: true })
    resolvedAt: Date;

    /**
     * Auto-reorder configuration
     */
    @Column({ name: 'auto_reorder_enabled', default: false })
    autoReorderEnabled: boolean;

    @Column({
        name: 'auto_reorder_quantity',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    autoReorderQuantity: number;

    @Column({ name: 'preferred_supplier_id', nullable: true })
    preferredSupplierId: string;
}
