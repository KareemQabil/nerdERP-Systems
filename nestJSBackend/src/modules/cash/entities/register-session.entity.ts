import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * Register Session Entity
 * Tracks cash flow through POS terminals for shift reconciliation
 */
@Entity('register_sessions')
export class RegisterSession extends AbstractEntity {
    @Column({ name: 'device_id' })
    deviceId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'store_id' })
    storeId: string;

    @Column({ name: 'is_open', default: true })
    isOpen: boolean;

    @Column({
        name: 'opening_balance',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    openingBalance: number;

    @Column({
        name: 'expected_balance',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    expectedBalance: number;

    @Column({
        name: 'actual_balance',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    actualBalance: number;

    @Column({
        name: 'total_cash_sales',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalCashSales: number;

    @Column({
        name: 'total_drops',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalDrops: number;

    @Column({
        name: 'total_petty_cash',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalPettyCash: number;

    @Column({
        name: 'discrepancy',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    discrepancy: number;

    @Column({ name: 'opened_at', type: 'timestamp with time zone' })
    openedAt: Date;

    @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
    closedAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    // =========================================================================
    // MULTI-PAYMENT TYPE TRACKING
    // =========================================================================

    @Column({
        name: 'total_card_sales',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalCardSales: number;

    @Column({
        name: 'total_wallet_sales',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalWalletSales: number;

    @Column({
        name: 'total_credit_sales',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalCreditSales: number;

    @Column({
        name: 'total_refunds',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalRefunds: number;

    // =========================================================================
    // SESSION ANALYTICS
    // =========================================================================

    @Column({ name: 'order_count', default: 0 })
    orderCount: number;

    @Column({ name: 'void_count', default: 0 })
    voidCount: number;

    @Column({ name: 'refund_count', default: 0 })
    refundCount: number;

    @Column({ name: 'price_override_count', default: 0 })
    priceOverrideCount: number;

    @Column({ name: 'manager_interventions', default: 0 })
    managerInterventions: number;

    // =========================================================================
    // BLIND CLOSE SUPPORT
    // =========================================================================

    /**
     * When true, the expected balance was NOT shown to cashier at close
     * (Blind close implementation)
     */
    @Column({ name: 'is_blind_close', default: true })
    isBlindClose: boolean;

    /**
     * Manager who reviewed the session discrepancy (if any)
     */
    @Column({ name: 'reviewed_by_user_id', nullable: true })
    reviewedByUserId: string;

    @Column({ name: 'reviewed_at', type: 'timestamp with time zone', nullable: true })
    reviewedAt: Date;

    @Column({ name: 'manager_review_notes', type: 'text', nullable: true })
    managerReviewNotes: string;

    // =========================================================================
    // HANDOVER SUPPORT
    // =========================================================================

    /**
     * If this session was handed over from another cashier
     */
    @Column({ name: 'handover_from_session_id', nullable: true })
    handoverFromSessionId?: string;

    /**
     * If this session was handed over to another session
     */
    @Column({ name: 'handover_to_session_id', nullable: true })
    handoverToSessionId?: string;
}
