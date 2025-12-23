import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * Modifier Entity
 * Groups of modifiers (e.g., "Cooking Level", "Size", "Extras")
 */
@Entity('modifiers')
export class Modifier extends AbstractEntity {
    @Column({ name: 'modifier_name' })
    modifierName: string;

    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { name: string }>;

    @Column({ name: 'is_required', default: false })
    isRequired: boolean;

    @Column({ name: 'min_selections', default: 0 })
    minSelections: number;

    @Column({ name: 'max_selections', default: 1 })
    maxSelections: number;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => ModifierOption, (option) => option.modifier, { cascade: true })
    options: ModifierOption[];
}

/**
 * Modifier Option Entity
 * Individual options within a modifier group
 */
@Entity('modifier_options')
export class ModifierOption extends AbstractEntity {
    @ManyToOne(() => Modifier, (modifier) => modifier.options, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'modifier_id' })
    modifier: Modifier;

    @Column({ name: 'option_name' })
    optionName: string;

    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { name: string }>;

    @Column({
        name: 'price_adjustment',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    priceAdjustment: number;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    /**
     * Product ID if this option deducts inventory
     */
    @Column({ name: 'deduct_product_id', nullable: true })
    deductProductId: string;

    @Column({ name: 'deduct_quantity', type: 'decimal', precision: 10, scale: 3, transformer: new DecimalTransformer(), nullable: true })
    deductQuantity: number;
}

/**
 * Product Modifier Junction
 * Links products to modifier groups
 */
@Entity('product_modifiers')
export class ProductModifier extends AbstractEntity {
    @Column({ name: 'product_id' })
    productId: string;

    @Column({ name: 'modifier_id' })
    modifierId: string;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    /**
     * Conditional logic for showing this modifier
     * Example: { "==": [{ "var": "size" }, "Large"] }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'condition_logic' })
    conditionLogic: any;
}
