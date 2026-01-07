import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from './warehouse.entity';
import { InventoryBatch } from './inventory-batch.entity';

/**
 * Waste Reason Enum
 * Categorizes waste for reporting and analysis
 */
export enum WasteReason {
    SPOILAGE_EXPIRY = 'SPOILAGE_EXPIRY',       // Expired or spoiled
    DAMAGED_STORAGE = 'DAMAGED_STORAGE',       // Damaged in storage/handling
    DAMAGED_PREP = 'DAMAGED_PREP',             // Damaged during prep (dropped, burnt)
    QUALITY_REJECT = 'QUALITY_REJECT',         // Customer complaint, quality issue
    PORTION_TEST = 'PORTION_TEST',             // Chef sampling, portion testing
    STAFF_MEAL = 'STAFF_MEAL',                 // Employee consumption
    THEFT_SHORTAGE = 'THEFT_SHORTAGE',         // Physical count mismatch
    OVERPRODUCTION = 'OVERPRODUCTION',         // Made too much
    VOIDED_ORDER = 'VOIDED_ORDER',             // Order voided after kitchen fire
    RECIPE_WASTE = 'RECIPE_WASTE',             // Normal recipe trimming/waste
    OTHER = 'OTHER',
}

/**
 * Waste Entry Status
 */
export enum WasteStatus {
    PENDING = 'PENDING',       // Awaiting manager approval (high value)
    APPROVED = 'APPROVED',     // Approved and logged
    REJECTED = 'REJECTED',     // Manager rejected (needs investigation)
}

/**
 * Waste Entry Entity
 * 
 * Tracks all stock waste for:
 * - COGS accuracy
 * - Shrinkage analysis
 * - Compliance reporting
 * - Theft detection
 * - Menu engineering (high-waste items)
 */
@Entity('waste_entries')
export class WasteEntry extends AbstractEntity {
    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'product_id' })
    productId: string;

    @ManyToOne(() => Warehouse, { nullable: true })
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;

    @Column({ name: 'warehouse_id', nullable: true })
    warehouseId: string;

    @ManyToOne(() => InventoryBatch, { nullable: true })
    @JoinColumn({ name: 'batch_id' })
    batch: InventoryBatch;

    @Column({ name: 'batch_id', nullable: true })
    batchId: string;

    /**
     * Quantity wasted
     */
    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    quantity: number;

    /**
     * Unit of measure
     */
    @Column({ nullable: true })
    unit: string;

    /**
     * Cost per unit at time of waste
     */
    @Column({
        name: 'unit_cost',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    unitCost: number;

    /**
     * Total cost of waste (quantity * unit_cost)
     */
    @Column({
        name: 'total_cost',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    totalCost: number;

    /**
     * Main reason category
     */
    @Column({
        type: 'enum',
        enum: WasteReason,
    })
    reason: WasteReason;

    /**
     * Additional detail about the reason
     */
    @Column({ name: 'sub_reason', nullable: true })
    subReason: string;

    /**
     * Detailed notes
     */
    @Column({ type: 'text', nullable: true })
    notes: string;

    /**
     * Current status
     */
    @Column({
        type: 'enum',
        enum: WasteStatus,
        default: WasteStatus.APPROVED,
    })
    status: WasteStatus;

    /**
     * User who reported the waste
     */
    @Column({ name: 'reported_by_user_id' })
    reportedByUserId: string;

    /**
     * Manager who approved (if required)
     */
    @Column({ name: 'approved_by_user_id', nullable: true })
    approvedByUserId: string;

    /**
     * When reported
     */
    @Column({ name: 'reported_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    reportedAt: Date;

    /**
     * When approved
     */
    @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
    approvedAt: Date;

    /**
     * Photo evidence (URLs or paths)
     */
    @Column({ type: 'jsonb', nullable: true, name: 'photo_evidence' })
    photoEvidence: string[];

    /**
     * Corrective action taken
     */
    @Column({ name: 'corrective_action', type: 'text', nullable: true })
    correctiveAction: string;

    /**
     * Store ID
     */
    @Column({ name: 'store_id' })
    storeId: string;

    /**
     * Whether to include in variance reports
     */
    @Column({ name: 'affects_variance', default: true })
    affectsVariance: boolean;

    // =========================================================================
    // LINKED REFERENCES
    // =========================================================================

    /**
     * If waste is from a voided order
     */
    @Column({ name: 'order_id', nullable: true })
    orderId: string;

    /**
     * If waste is from a specific order item
     */
    @Column({ name: 'order_item_id', nullable: true })
    orderItemId: string;

    /**
     * If waste is from a stock reservation
     */
    @Column({ name: 'reservation_id', nullable: true })
    reservationId: string;
}
