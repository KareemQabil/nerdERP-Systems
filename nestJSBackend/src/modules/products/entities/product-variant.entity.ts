import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * Promotion Usage Entity
 * Tracks promotion redemptions for limits and analytics
 */
@Entity('promotion_usages')
export class PromotionUsage extends AbstractEntity {
    @Column({ name: 'promotion_id' })
    promotionId: string;

    @Column({ name: 'order_id' })
    orderId: string;

    @Column({ name: 'customer_id', nullable: true })
    customerId: string;

    @Column({
        name: 'discount_applied',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    discountApplied: number;

    @Column({ name: 'applied_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    appliedAt: Date;

    @Column({ name: 'store_id' })
    storeId: string;
}

/**
 * Product Variant Entity
 * Size/color variations of products
 */
@Entity('product_variants')
export class ProductVariant extends AbstractEntity {
    @Column({ name: 'product_id' })
    productId: string;

    @Column({ name: 'variant_name' })
    variantName: string;

    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { name: string }>;

    @Column({ unique: true, nullable: true })
    sku: string;

    @Column({ unique: true, nullable: true })
    barcode: string;

    @Column({
        name: 'price_adjustment',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    priceAdjustment: number;

    /**
     * Variant attributes
     * Example: { size: 'Large', color: 'Red' }
     */
    @Column({ type: 'jsonb', nullable: true })
    attributes: Record<string, string>;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;
}

/**
 * Combo Entity
 * Bundle products (meals, sets)
 */
@Entity('combos')
export class Combo extends AbstractEntity {
    @Column({ name: 'combo_name' })
    comboName: string;

    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { name: string; description?: string }>;

    @Column({
        name: 'combo_price',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    comboPrice: number;

    /**
     * Combo components
     * Example: [{ product_id: 'uuid', quantity: 1, is_required: true }]
     */
    @Column({ type: 'jsonb' })
    components: Array<{
        product_id: string;
        quantity: number;
        is_required: boolean;
        allow_swap?: boolean;
        swap_options?: string[];
    }>;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;
}
