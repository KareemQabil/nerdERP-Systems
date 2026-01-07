import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SalesOrder, OrderStatus } from './sales-order.entity';

/**
 * =============================================================================
 * ORDER STATE HISTORY ENTITY (ENHANCED)
 * =============================================================================
 *
 * Enhanced audit trail for state machine-driven order management.
 * Tracks all state transitions with comprehensive approval workflow support.
 *
 * Features:
 * - Complete state transition audit
 * - Approval workflow tracking (requested → approved/rejected)
 * - Side effects tracking (KOT printed, inventory deducted, etc.)
 * - Financial data snapshots (for price change audits)
 * - Void/Return specific tracking
 * - Device/IP tracking for security
 *
 * Example Flow:
 * DRAFT → SAVED → FIRED_TO_KITCHEN → PREPARING → READY → SERVED → PAYMENT_PENDING → PAID → COMPLETED
 *
 * Or with approval:
 * SAVED → VOID_REQUESTED → VOID_APPROVED → VOID
 */
@Entity('order_state_history')
export class OrderStateHistory extends AbstractEntity {
    // =========================================================================
    // ORDER RELATIONSHIP
    // =========================================================================

    @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: SalesOrder;

    @Column({ name: 'order_id' })
    orderId: string;

    // =========================================================================
    // STATE TRANSITION DATA
    // =========================================================================

    /**
     * Previous state (null for initial state)
     */
    @Column({ name: 'from_state', nullable: true })
    fromState: OrderStatus;

    /**
     * New state
     */
    @Column({ name: 'to_state' })
    toState: OrderStatus;

    /**
     * Transition type
     */
    @Column({
        name: 'transition_type',
        type: 'enum',
        enum: ['AUTOMATIC', 'MANUAL', 'SYSTEM', 'APPROVAL'],
        default: 'MANUAL',
    })
    transitionType: 'AUTOMATIC' | 'MANUAL' | 'SYSTEM' | 'APPROVAL';

    // =========================================================================
    // USER TRACKING
    // =========================================================================

    /**
     * User who initiated the transition
     */
    @Column({ name: 'initiated_by_user_id' })
    initiatedByUserId: string;

    @Column({ name: 'initiated_by_user_name' })
    initiatedByUserName: string;

    /**
     * User who authorized the transition (if required)
     */
    @Column({ name: 'approved_by_user_id', nullable: true })
    approvedByUserId: string;

    @Column({ name: 'approved_by_user_name', nullable: true })
    approvedByUserName: string;

    // =========================================================================
    // APPROVAL & AUTHORIZATION
    // =========================================================================

    /**
     * Whether this transition requires approval
     */
    @Column({ name: 'requires_approval', default: false })
    requiresApproval: boolean;

    /**
     * Approval status
     */
    @Column({
        name: 'approval_status',
        type: 'enum',
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        nullable: true,
    })
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';

    /**
     * When approval was requested
     */
    @Column({ name: 'approval_requested_at', type: 'timestamp with time zone', nullable: true })
    approvalRequestedAt: Date;

    /**
     * When approval was responded to
     */
    @Column({ name: 'approval_responded_at', type: 'timestamp with time zone', nullable: true })
    approvalRespondedAt: Date;

    /**
     * Rejection reason (if rejected)
     */
    @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
    rejectionReason: string;

    // =========================================================================
    // REASON & NOTES
    // =========================================================================

    /**
     * Reason for state transition
     * Required for VOID, RETURN transitions
     */
    @Column({ name: 'transition_reason', nullable: true })
    transitionReason: string;

    /**
     * Note shown to customer (e.g., on receipt)
     */
    @Column({ type: 'text', nullable: true, name: 'customer_facing_note' })
    customerFacingNote: string;

    /**
     * Internal notes (staff only)
     */
    @Column({ type: 'text', nullable: true })
    notes: string;

    // =========================================================================
    // SIDE EFFECTS TRACKING
    // =========================================================================

    /**
     * Side effects executed during this transition
     * Example: ['KOT_PRINTED', 'INVENTORY_DEDUCTED', 'TABLE_OCCUPIED']
     */
    @Column({ type: 'jsonb', nullable: true })
    sideEffects: Array<{
        type: string;
        status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
        executedAt?: Date;
        errorMessage?: string;
        params?: Record<string, any>;
    }>;

    // =========================================================================
    // FINANCIAL DATA SNAPSHOT
    // =========================================================================

    /**
     * Snapshot of order totals at time of transition
     * Useful for auditing price changes
     */
    @Column({ type: 'jsonb', nullable: true, name: 'financial_snapshot' })
    financialSnapshot: {
        totalGross: number;
        totalTax: number;
        totalNet: number;
        paymentStatus: string;
        amountPaid: number;
        amountDue: number;
    };

    // =========================================================================
    // PAYMENT DATA (for payment-related transitions)
    // =========================================================================

    @Column({ type: 'jsonb', nullable: true, name: 'payment_data' })
    paymentData: {
        paymentMethod?: string;
        paymentAmount?: number;
        paymentReference?: string;
        isPartialPayment?: boolean;
        remainingAmount?: number;
    };

    // =========================================================================
    // VOID/RETURN SPECIFIC FIELDS
    // =========================================================================

    /**
     * Void reason (populated for VOID transitions)
     */
    @Column({ name: 'void_reason', nullable: true })
    voidReason: string;

    /**
     * Return reason (populated for RETURN transitions)
     */
    @Column({ name: 'return_reason', nullable: true })
    returnReason: string;

    /**
     * Returned items (for return transitions)
     */
    @Column({ type: 'jsonb', nullable: true, name: 'returned_items' })
    returnedItems: Array<{
        orderItemId: string;
        productName: string;
        quantity: number;
        reason: string;
    }>;

    // =========================================================================
    // AGGREGATOR SPECIFIC FIELDS
    // =========================================================================

    /**
     * Aggregator order ID
     */
    @Column({ name: 'aggregator_order_id', nullable: true })
    aggregatorOrderId: string;

    /**
     * Aggregator status
     */
    @Column({ name: 'aggregator_status', nullable: true })
    aggregatorStatus: string;

    // =========================================================================
    // METADATA & EXTENSIBILITY
    // =========================================================================

    /**
     * Additional metadata
     * Can store additional context like:
     * - approval_reason
     * - rejection_reason
     * - estimated_completion_time
     * - assigned_kitchen_station
     */
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    /**
     * Device ID for security audit
     */
    @Column({ name: 'device_id', nullable: true })
    deviceId: string;

    /**
     * IP address for security audit
     */
    @Column({ name: 'ip_address', nullable: true })
    ipAddress: string;

    /**
     * Location data
     */
    @Column({ type: 'jsonb', nullable: true, name: 'location_data' })
    locationData: {
        latitude?: number;
        longitude?: number;
        storeId?: string;
        registerId?: string;
    };

    // =========================================================================
    // TRANSITION TIMESTAMP
    // =========================================================================

    @Column({ name: 'transition_timestamp', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    transitionTimestamp: Date;

    // =========================================================================
    // RETURN ORDER LINKAGE
    // =========================================================================

    /**
     * For return orders: link to the original order
     */
    @Column({ name: 'original_order_id', nullable: true })
    originalOrderId: string;

    /**
     * For void/return: the return order created
     */
    @Column({ name: 'return_order_id', nullable: true })
    returnOrderId: string;

    // =========================================================================
    // DEPRECATED FIELDS (for backward compatibility)
    // =========================================================================

    /**
     * @deprecated Use initiatedByUserId instead
     */
    @Column({ name: 'changed_by_user_id', nullable: true })
    changedByUserId: string;

    /**
     * @deprecated Use initiatedByUserName instead
     */
    @Column({ name: 'changed_by_user_name', nullable: true })
    changedByUserName: string;
}
