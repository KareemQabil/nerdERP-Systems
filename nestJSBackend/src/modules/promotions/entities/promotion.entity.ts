import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

export enum PromotionType {
    PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
    FIXED_DISCOUNT = 'FIXED_DISCOUNT',
    BOGO = 'BOGO', // Buy One Get One
    BUY_X_GET_Y = 'BUY_X_GET_Y',
    TIERED_DISCOUNT = 'TIERED_DISCOUNT',
    HAPPY_HOUR = 'HAPPY_HOUR',
    BUNDLE = 'BUNDLE',
}

/**
 * Promotion Entity
 * Configurable promotions with JSONLogic conditions
 * 
 * Examples:
 * - Happy Hour: 20% off 5-9 PM on weekdays
 * - BOGO: Buy 1 Burger, Get 1 Free
 * - Tiered: Spend 100+ get 10%, 200+ get 15%
 */
@Entity('promotions')
export class Promotion extends AbstractEntity {
    @Column({ name: 'promotion_code', unique: true })
    promotionCode: string;

    @Column({ type: 'jsonb' })
    translations: Record<string, { name: string; description?: string }>;

    @Column({ type: 'enum', enum: PromotionType, name: 'promotion_type' })
    promotionType: PromotionType;

    /**
     * JSONLogic condition for activation
     * Example: { "and": [{ ">=": [{ "var": "subtotal" }, 100] }, { "in": [{ "var": "hour" }, [17, 18, 19, 20]] }] }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'condition_logic' })
    conditionLogic: any;

    /**
     * Discount value (percentage or fixed amount)
     */
    @Column({
        name: 'discount_value',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    discountValue: number;

    @Column({
        name: 'max_discount',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    maxDiscount: number; // Cap on discount amount

    @Column({ name: 'min_purchase', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), nullable: true })
    minPurchase: number; // Minimum order amount

    @Column({ name: 'start_date', type: 'timestamp with time zone' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'timestamp with time zone', nullable: true })
    endDate: Date;

    @Column({ name: 'usage_limit', nullable: true })
    usageLimit: number; // Max times this promo can be used

    @Column({ name: 'usage_count', default: 0 })
    usageCount: number;

    @Column({ name: 'per_customer_limit', nullable: true })
    perCustomerLimit: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ default: 0 })
    priority: number; // Higher = applied first

    @Column({ name: 'combinable', default: false })
    combinable: boolean; // Can combine with other promos

    @Column({ type: 'jsonb', nullable: true, name: 'applies_to_products' })
    appliesToProducts: string[]; // Product IDs, null = all

    @Column({ type: 'jsonb', nullable: true, name: 'applies_to_categories' })
    appliesToCategories: string[]; // Category IDs

    @Column({ type: 'jsonb', nullable: true, name: 'applies_to_stores' })
    appliesToStores: string[]; // Store IDs, null = all
}
