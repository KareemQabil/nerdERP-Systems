import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from './warehouse.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * Reservation Status
 * Tracks the lifecycle of stock reservations
 */
export enum ReservationStatus {
    ACTIVE = 'ACTIVE',         // Stock is reserved (soft hold)
    COMMITTED = 'COMMITTED',   // Stock has been committed (hard deduct on fire)
    RELEASED = 'RELEASED',     // Reservation released (order voided pre-fire)
    EXPIRED = 'EXPIRED',       // Reservation auto-expired (timeout)
}

/**
 * Reservation Priority
 * Determines order of fulfillment when stock is limited
 */
export enum ReservationPriority {
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',         // VIP customer, urgent order
    URGENT = 'URGENT',     // Kitchen already preparing related items
}

/**
 * Stock Reservation Entity
 * 
 * Implements the Reserve → Commit → Release flow:
 * 1. RESERVE (saveCheck): Soft hold on stock, can be stolen if urgent
 * 2. COMMIT (fireToKitchen): Hard deduction, physically removed
 * 3. RELEASE (voidOrder pre-fire): Return stock to available
 * 
 * If void happens after fire (COMMITTED), stock is logged as waste
 */
@Entity('stock_reservations')
export class StockReservation extends AbstractEntity {
    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'product_id' })
    productId: string;

    @ManyToOne(() => Warehouse)
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;

    @Column({ name: 'warehouse_id' })
    warehouseId: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer()
    })
    quantity: number;

    /**
     * Register session that created this reservation
     */
    @Column({ name: 'session_id', nullable: true })
    sessionId: string;

    /**
     * Order this reservation belongs to
     */
    @Column({ name: 'order_id', nullable: true })
    orderId: string;

    /**
     * Order item this reservation is for
     */
    @Column({ name: 'order_item_id', nullable: true })
    orderItemId: string;

    /**
     * Current status of the reservation
     */
    @Column({
        type: 'enum',
        enum: ReservationStatus,
        default: ReservationStatus.ACTIVE,
    })
    status: ReservationStatus;

    /**
     * Priority of this reservation
     */
    @Column({
        type: 'enum',
        enum: ReservationPriority,
        default: ReservationPriority.NORMAL,
    })
    priority: ReservationPriority;

    /**
     * When this reservation expires if not committed
     * Default: 30 minutes from creation
     */
    @Column({ name: 'expires_at', type: 'timestamp with time zone' })
    expiresAt: Date;

    /**
     * When the reservation was committed (fire to kitchen)
     */
    @Column({ name: 'committed_at', type: 'timestamp with time zone', nullable: true })
    committedAt: Date;

    /**
     * When the reservation was released (void pre-fire)
     */
    @Column({ name: 'released_at', type: 'timestamp with time zone', nullable: true })
    releasedAt: Date;

    /**
     * Reason for release
     */
    @Column({ name: 'release_reason', nullable: true })
    releaseReason: string;

    /**
     * If this was a recipe, store the exploded ingredients
     * Format: [{ productId: string, quantity: number, batchId: string }]
     */
    @Column({ type: 'jsonb', nullable: true, name: 'exploded_ingredients' })
    explodedIngredients: Array<{
        productId: string;
        productName: string;
        quantity: number;
        batchId?: string;
        costPerUnit?: number;
    }>;

    /**
     * Total cost of reserved stock (for COGS)
     */
    @Column({
        name: 'total_cost',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    totalCost: number;

    /**
     * Notes about this reservation
     */
    @Column({ type: 'text', nullable: true })
    notes: string;

    // =========================================================================
    // LEGACY FIELDS (kept for backward compatibility)
    // =========================================================================

    @Column({ default: false, name: 'is_released' })
    isReleased: boolean;
}
