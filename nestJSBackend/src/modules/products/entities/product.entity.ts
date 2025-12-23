import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { ProductCategory } from './product-category.entity';

export enum ProductType {
    STANDARD = 'STANDARD',
    SERVICE = 'SERVICE',
    COMBO = 'COMBO',
}

@Entity('products')
export class Product extends AbstractEntity {
    @Column({ unique: true })
    sku: string;

    @Column({ unique: true, nullable: true })
    barcode: string;

    @Column()
    name: string;

    @Column({ name: 'name_ar', nullable: true })
    nameAr: string;

    @Column({
        type: 'enum',
        enum: ProductType,
        default: ProductType.STANDARD,
    })
    type: ProductType;

    @Column({ name: 'track_inventory', default: true })
    trackInventory: boolean;

    @Column({
        name: 'sale_price',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    salePrice: number;

    @Column({
        name: 'cost_price',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    costPrice: number;

    @ManyToOne(() => ProductCategory, (category) => category.products, {
        nullable: true,
    })
    @JoinColumn({ name: 'category_id' })
    category: ProductCategory;

    // ============= KITCHEN ROUTING =============
    @Column({ name: 'is_kitchen_item', default: false })
    isKitchenItem: boolean;

    /**
     * Kitchen station IDs this product routes to
     * Example: ['uuid-grill', 'uuid-fryer'] for items needing multiple stations
     */
    @Column({ type: 'jsonb', nullable: true, name: 'kitchen_station_ids' })
    kitchenStationIds: string[];

    @Column({ name: 'print_to_kitchen', default: true })
    printToKitchen: boolean;

    @Column({ name: 'default_prep_time_minutes', nullable: true })
    defaultPrepTimeMinutes: number;

    // ============= INVENTORY ROUTING =============
    /**
     * Default warehouse ID for stock deduction
     * Can be overridden per store via StoreConfiguration
     */
    @Column({ name: 'default_warehouse_id', nullable: true })
    defaultWarehouseId: string;

    /**
     * Warehouse routing rules per store
     * Example: { 'store-1': 'warehouse-fridge', 'store-2': 'warehouse-bar' }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'warehouse_routing' })
    warehouseRouting: Record<string, string>;

    // ============= CALCULATION ROUTING =============
    /**
     * Tax profile ID - determines which taxes apply
     * null = use store default tax profile
     */
    @Column({ name: 'tax_profile_id', nullable: true })
    taxProfileId: string;

    /**
     * Products exempt from discounts
     */
    @Column({ name: 'discount_exempt', default: false })
    discountExempt: boolean;

    /**
     * Price includes tax (for display)
     */
    @Column({ name: 'price_includes_tax', default: true })
    priceIncludesTax: boolean;

    // ============= COMPOSABLE CONFIGURATION =============
    /**
     * Product-specific behavior overrides
     * Example: { 
     *   allow_modifiers: true,
     *   require_modifier: false,
     *   allow_open_price: false,
     *   min_quantity: 1,
     *   max_quantity: 10,
     *   age_restricted: false
     * }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'behavior_config' })
    behaviorConfig: {
        allow_modifiers?: boolean;
        require_modifier?: boolean;
        allow_open_price?: boolean;
        min_quantity?: number;
        max_quantity?: number;
        age_restricted?: boolean;
        [key: string]: any;
    };

    @Column({ name: 'is_prepared', default: false })
    isPrepared: boolean; // Has recipe = true, raw material = false

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    /**
     * Custom fields storage
     * Stores custom field values defined via CustomFieldDefinition
     * Example: { spice_level: 'Hot', allergens: ['nuts', 'dairy'], origin_country: 'SA' }
     */
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
}
