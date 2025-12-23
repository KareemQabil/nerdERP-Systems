import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SalesOrder } from './sales-order.entity';

/**
 * Order State History Entity
 * Tracks all state transitions for workflow-driven order management
 * Provides audit trail of who changed what and when
 * 
 * Example Flow:
 * DRAFT → PENDING → PREPARING → READY → COMPLETED
 * 
 * Or with approval:
 * DRAFT → PENDING_APPROVAL → APPROVED → PREPARING → ...
 */
@Entity('order_state_history')
export class OrderStateHistory extends AbstractEntity {
    @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: SalesOrder;

    @Column({ name: 'from_state', nullable: true })
    fromState: string; // Previous state (null for initial state)

    @Column({ name: 'to_state' })
    toState: string; // New state

    @Column({ name: 'changed_by_user_id' })
    changedByUserId: string; // UUID of user who made the change

    @Column({ name: 'changed_by_user_name' })
    changedByUserName: string; // Name for display

    @Column({ type: 'text', nullable: true })
    notes: string; // Optional notes/reason for state change

    /**
     * Metadata for state transition
     * Can store additional context like:
     * - approval_reason
     * - rejection_reason
     * - estimated_completion_time
     * - assigned_kitchen_station
     */
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ name: 'transition_timestamp', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    transitionTimestamp: Date;
}
