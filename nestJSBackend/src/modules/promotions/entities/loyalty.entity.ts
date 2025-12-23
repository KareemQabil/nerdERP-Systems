import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * Loyalty Tier Entity
 * Defines customer loyalty levels with point earning/redemption rates
 */
@Entity('loyalty_tiers')
export class LoyaltyTier extends AbstractEntity {
    @Column({ name: 'tier_name' })
    tierName: string;

    @Column({ type: 'jsonb' })
    translations: Record<string, { name: string; description?: string }>;

    @Column({ name: 'min_points', default: 0 })
    minPoints: number; // Points needed to reach this tier

    @Column({
        name: 'points_per_currency',
        type: 'decimal',
        precision: 5,
        scale: 2,
        transformer: new DecimalTransformer(),
        default: 1,
    })
    pointsPerCurrency: number; // Points earned per 1 SAR spent

    @Column({
        name: 'redemption_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
        transformer: new DecimalTransformer(),
        default: 0.01,
    })
    redemptionRate: number; // Currency value per point (0.01 = 100 points = 1 SAR)

    @Column({
        name: 'discount_percentage',
        type: 'decimal',
        precision: 5,
        scale: 2,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    discountPercentage: number; // Automatic discount for this tier

    @Column({ nullable: true })
    color: string;

    @Column({ nullable: true })
    icon: string;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;
}

/**
 * Customer Loyalty Entity
 * Tracks customer points and tier membership
 */
@Entity('customer_loyalty')
export class CustomerLoyalty extends AbstractEntity {
    @Column({ name: 'customer_id', unique: true })
    customerId: string;

    @Column({ name: 'total_points', default: 0 })
    totalPoints: number;

    @Column({ name: 'available_points', default: 0 })
    availablePoints: number;

    @Column({ name: 'tier_id', nullable: true })
    tierId: string;

    @Column({ name: 'lifetime_spend', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), default: 0 })
    lifetimeSpend: number;

    @Column({ name: 'last_activity_date', type: 'timestamp with time zone', nullable: true })
    lastActivityDate: Date;
}

/**
 * Loyalty Transaction Entity
 * Tracks points earn/redeem history
 */
@Entity('loyalty_transactions')
export class LoyaltyTransaction extends AbstractEntity {
    @Column({ name: 'customer_id' })
    customerId: string;

    @Column({ name: 'transaction_type' })
    transactionType: string; // 'EARN', 'REDEEM', 'EXPIRE', 'ADJUST'

    @Column()
    points: number;

    @Column({ name: 'points_after' })
    pointsAfter: number;

    @Column({ name: 'order_id', nullable: true })
    orderId: string;

    @Column({ type: 'text', nullable: true })
    description: string;
}
