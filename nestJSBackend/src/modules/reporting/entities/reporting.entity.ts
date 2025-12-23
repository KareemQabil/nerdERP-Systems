import { Entity, Column, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * Daily Sales Summary Entity
 * Pre-aggregated daily sales data for fast reporting
 */
@Entity('daily_sales_summaries')
@Index(['storeId', 'businessDate'], { unique: true })
export class DailySalesSummary extends AbstractEntity {
    @Column({ name: 'store_id' })
    storeId: string;

    @Column({ name: 'business_date', type: 'date' })
    businessDate: Date;

    @Column({ name: 'order_count', default: 0 })
    orderCount: number;

    @Column({ name: 'total_gross', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), default: 0 })
    totalGross: number;

    @Column({ name: 'total_net', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), default: 0 })
    totalNet: number;

    @Column({ name: 'total_tax', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), default: 0 })
    totalTax: number;

    @Column({ name: 'total_discounts', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), default: 0 })
    totalDiscounts: number;

    @Column({ name: 'total_surcharges', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), default: 0 })
    totalSurcharges: number;

    @Column({ name: 'refund_count', default: 0 })
    refundCount: number;

    @Column({ name: 'total_refunds', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), default: 0 })
    totalRefunds: number;

    @Column({ name: 'void_count', default: 0 })
    voidCount: number;

    /**
     * Payment breakdown by method
     * Example: { CASH: 5000.000, CARD: 3000.000, MADA: 2000.000 }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'payment_breakdown' })
    paymentBreakdown: Record<string, number>;

    /**
     * Sales by category
     * Example: { 'Food': 8000.000, 'Beverages': 2000.000 }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'category_breakdown' })
    categoryBreakdown: Record<string, number>;

    @Column({ name: 'aggregated_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    aggregatedAt: Date;
}

/**
 * Shift Summary Entity
 * End-of-shift report data
 */
@Entity('shift_summaries')
export class ShiftSummary extends AbstractEntity {
    @Column({ name: 'register_session_id', unique: true })
    registerSessionId: string;

    @Column({ name: 'store_id' })
    storeId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'user_name' })
    userName: string;

    @Column({ name: 'opened_at', type: 'timestamp with time zone' })
    openedAt: Date;

    @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
    closedAt: Date;

    @Column({ name: 'opening_cash', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer() })
    openingCash: number;

    @Column({ name: 'expected_cash', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), nullable: true })
    expectedCash: number;

    @Column({ name: 'actual_cash', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), nullable: true })
    actualCash: number;

    @Column({ name: 'cash_variance', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), nullable: true })
    cashVariance: number;

    @Column({ name: 'order_count', default: 0 })
    orderCount: number;

    @Column({ name: 'total_sales', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), default: 0 })
    totalSales: number;

    @Column({ type: 'jsonb', nullable: true, name: 'payment_breakdown' })
    paymentBreakdown: Record<string, number>;

    @Column({ type: 'text', nullable: true })
    notes: string;
}
