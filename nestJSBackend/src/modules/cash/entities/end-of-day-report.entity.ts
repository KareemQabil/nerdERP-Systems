import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { RegisterSession } from './register-session.entity';

export enum EODStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    REVIEWED = 'REVIEWED',
}

/**
 * End of Day Report Entity
 * Aggregates all register sessions for a store's daily closure
 * Manager reviews all discrepancies here
 */
@Entity('end_of_day_reports')
export class EndOfDayReport extends AbstractEntity {
    @Column({ name: 'store_id' })
    storeId: string;

    /**
     * The calendar date when EOD was actually run
     */
    @Column({ name: 'report_date', type: 'date' })
    reportDate: Date;

    /**
     * The business day this report covers
     * May differ from reportDate if restaurant closes after midnight
     * Example: Report run at 2 AM on the 28th → businessDate = 27th
     */
    @Column({ name: 'business_date', type: 'date' })
    businessDate: Date;

    @Column({ name: 'manager_id', nullable: true })
    managerId: string;

    @Column({ type: 'enum', enum: EODStatus, default: EODStatus.PENDING })
    status: EODStatus;

    // ===== SESSION AGGREGATIONS =====

    @Column({ name: 'total_sessions', default: 0 })
    totalSessions: number;

    @Column({ name: 'sessions_with_discrepancy', default: 0 })
    sessionsWithDiscrepancy: number;

    // ===== CASH TOTALS =====

    @Column({
        name: 'total_opening_balance',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalOpeningBalance: number;

    @Column({
        name: 'total_cash_sales',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalCashSales: number;

    @Column({
        name: 'total_card_sales',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalCardSales: number;

    @Column({
        name: 'total_other_sales',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalOtherSales: number;

    @Column({
        name: 'total_sales',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalSales: number;

    @Column({
        name: 'total_drops_to_safe',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalDropsToSafe: number;

    @Column({
        name: 'total_petty_cash',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalPettyCash: number;

    @Column({
        name: 'total_refunds',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalRefunds: number;

    @Column({
        name: 'total_discounts',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalDiscounts: number;

    @Column({
        name: 'total_tax_collected',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalTaxCollected: number;

    // ===== DISCREPANCY TRACKING =====

    @Column({
        name: 'total_expected_cash',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalExpectedCash: number;

    @Column({
        name: 'total_actual_cash',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalActualCash: number;

    @Column({
        name: 'total_discrepancy',
        type: 'decimal', precision: 10, scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalDiscrepancy: number;

    // ===== ORDER COUNTS =====

    @Column({ name: 'total_orders', default: 0 })
    totalOrders: number;

    @Column({ name: 'total_items_sold', default: 0 })
    totalItemsSold: number;

    @Column({ name: 'total_voids', default: 0 })
    totalVoids: number;

    // ===== TIMESTAMPS =====

    @Column({ name: 'started_at', type: 'timestamp with time zone', nullable: true })
    startedAt: Date;

    @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
    completedAt: Date;

    @Column({ name: 'reviewed_at', type: 'timestamp with time zone', nullable: true })
    reviewedAt: Date;

    // ===== NOTES / COMMENTS =====

    @Column({ name: 'manager_notes', type: 'text', nullable: true })
    managerNotes: string;

    // ===== SESSION DETAILS (JSON for quick access) =====

    @Column({ name: 'session_summaries', type: 'jsonb', nullable: true })
    sessionSummaries: SessionSummary[];
}

/**
 * Session summary stored in JSONB for quick display
 */
export interface SessionSummary {
    sessionId: string;
    userId: string;
    userName: string;
    deviceId: string;
    openedAt: string;
    closedAt: string;
    openingBalance: string;
    expectedBalance: string;
    actualBalance: string;
    discrepancy: string;
    hasDiscrepancy: boolean;
    notes: string | null;
}
