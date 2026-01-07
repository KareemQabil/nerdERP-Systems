import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * Handover Status
 * Tracks the state of a shift handover between cashiers
 */
export enum HandoverStatus {
    PENDING = 'PENDING',         // Handover initiated, awaiting new cashier
    ACCEPTED = 'ACCEPTED',       // New cashier accepted the handover
    DISPUTED = 'DISPUTED',       // New cashier disputes the count
    RESOLVED = 'RESOLVED',       // Manager resolved the dispute
    CANCELLED = 'CANCELLED',     // Handover was cancelled
}

/**
 * Register Handover Entity
 * 
 * Tracks shift changes between cashiers during an active register session.
 * Supports blind handover where the incoming cashier counts cash without
 * knowing the expected amount.
 */
@Entity('register_handovers')
export class RegisterHandover extends AbstractEntity {
    /**
     * The session being handed over
     */
    @Column({ name: 'from_session_id' })
    fromSessionId: string;

    /**
     * The new session created for the incoming cashier
     */
    @Column({ name: 'to_session_id', nullable: true })
    toSessionId: string;

    /**
     * Outgoing cashier user ID
     */
    @Column({ name: 'from_user_id' })
    fromUserId: string;

    /**
     * Incoming cashier user ID
     */
    @Column({ name: 'to_user_id' })
    toUserId: string;

    /**
     * Store ID for the handover
     */
    @Column({ name: 'store_id' })
    storeId: string;

    /**
     * Device ID for the register
     */
    @Column({ name: 'device_id' })
    deviceId: string;

    /**
     * When the handover was initiated
     */
    @Column({ name: 'handover_initiated_at', type: 'timestamp with time zone' })
    handoverInitiatedAt: Date;

    /**
     * When the handover was completed (accepted/resolved)
     */
    @Column({ name: 'handover_completed_at', type: 'timestamp with time zone', nullable: true })
    handoverCompletedAt: Date;

    /**
     * Cash count by outgoing cashier (blind - they don't see expected)
     */
    @Column({
        name: 'from_cashier_count',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    fromCashierCount: number;

    /**
     * Cash count by incoming cashier (verification count)
     */
    @Column({
        name: 'to_cashier_count',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    toCashierCount: number;

    /**
     * System-calculated expected balance at handover time
     * Only visible to managers, never to cashiers
     */
    @Column({
        name: 'expected_balance',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    expectedBalance: number;

    /**
     * Discrepancy between from_cashier_count and expected
     */
    @Column({
        name: 'from_discrepancy',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    fromDiscrepancy: number;

    /**
     * Discrepancy between the two cashier counts
     */
    @Column({
        name: 'count_discrepancy',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    countDiscrepancy: number;

    /**
     * Status of the handover
     */
    @Column({
        type: 'enum',
        enum: HandoverStatus,
        default: HandoverStatus.PENDING,
    })
    status: HandoverStatus;

    /**
     * Notes from outgoing cashier
     */
    @Column({ name: 'from_notes', type: 'text', nullable: true })
    fromNotes: string;

    /**
     * Notes from incoming cashier
     */
    @Column({ name: 'to_notes', type: 'text', nullable: true })
    toNotes: string;

    /**
     * Manager who resolved dispute (if any)
     */
    @Column({ name: 'resolved_by_user_id', nullable: true })
    resolvedByUserId: string;

    /**
     * Manager's resolution notes
     */
    @Column({ name: 'manager_notes', type: 'text', nullable: true })
    managerNotes: string;

    /**
     * Final accepted balance after resolution
     */
    @Column({
        name: 'final_balance',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    finalBalance: number;
}
