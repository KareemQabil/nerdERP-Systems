import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { SalesOrder } from './sales-order.entity';

export enum RefundStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    COMPLETED = 'COMPLETED',
}

export enum RefundReason {
    CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
    DEFECTIVE_PRODUCT = 'DEFECTIVE_PRODUCT',
    WRONG_ORDER = 'WRONG_ORDER',
    QUALITY_ISSUE = 'QUALITY_ISSUE',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    MANAGER_DISCRETION = 'MANAGER_DISCRETION',
    OTHER = 'OTHER',
}

/**
 * Refund Entity
 * Manages refund requests with approval workflow
 * Supports full or partial refunds
 * Tracks inventory return if applicable
 * 
 * Workflow:
 * 1. Cashier initiates refund (PENDING)
 * 2. Manager approves/rejects (APPROVED/REJECTED)
 * 3. System processes refund (COMPLETED)
 */
@Entity('refunds')
export class Refund extends AbstractEntity {
    @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: SalesOrder;

    @Column({ name: 'refund_number', unique: true })
    refundNumber: string;

    @Column({
        type: 'enum',
        enum: RefundStatus,
        default: RefundStatus.PENDING,
    })
    status: RefundStatus;

    @Column({
        name: 'refund_reason',
        type: 'enum',
        enum: RefundReason,
    })
    refundReason: RefundReason;

    @Column({
        name: 'refund_amount',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    refundAmount: number;

    /**
     * Items being refunded
     * Example: [{ product_id: 'uuid', quantity: 2, reason: 'defective' }]
     */
    @Column({ type: 'jsonb', name: 'refunded_items', nullable: true })
    refundedItems: Array<{
        product_id: string;
        product_name: string;
        quantity: number;
        reason: string;
        return_to_inventory: boolean;
    }>;

    // User tracking
    @Column({ name: 'requested_by_user_id' })
    requestedByUserId: string;

    @Column({ name: 'requested_by_user_name' })
    requestedByUserName: string;

    @Column({ name: 'requested_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    requestedAt: Date;

    @Column({ name: 'approved_by_user_id', nullable: true })
    approvedByUserId: string;

    @Column({ name: 'approved_by_user_name', nullable: true })
    approvedByUserName: string;

    @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
    approvedAt: Date;

    @Column({ name: 'rejection_reason', type: 'text', nullable: true })
    rejectionReason: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    /**
     * Store original payment method for refund processing
     */
    @Column({ name: 'original_payment_method', nullable: true })
    originalPaymentMethod: string;

    @Column({ name: 'original_payment_id', nullable: true })
    originalPaymentId: string;

    @Column({ name: 'processed_at', type: 'timestamp with time zone', nullable: true })
    processedAt: Date;
}
