import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SalesOrder } from './sales-order.entity';
import { Product } from '../../products/entities/product.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

// =============================================================================
// TYPES
// =============================================================================

export interface OrderItemModifier {
    modifierId: string;
    modifierName: string;
    modifierNameAr?: string;
    priceAdjustment: number;
    isNegative: boolean;
}

// =============================================================================
// ORDER ITEM ENTITY
// =============================================================================

@Entity('order_items')
export class OrderItem extends AbstractEntity {
    @ManyToOne(() => SalesOrder, (order) => order.items)
    @JoinColumn({ name: 'order_id' })
    order: SalesOrder;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'product_name' })
    productName: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    quantity: number;

    @Column({
        name: 'unit_price', // Price at the moment of sale
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    unitPrice: number;

    @Column({
        name: 'cost_at_sale', // COGS at moment of sale (snapshot)
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    costAtSale: number;

    @Column({
        name: 'tax_amount',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    taxAmount: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    total: number;

    // =============================================================================
    // NEW: Void Tracking Columns
    // =============================================================================

    @Column({ name: 'is_voided', default: false })
    isVoided: boolean;

    @Column({ name: 'voided_at', type: 'timestamp with time zone', nullable: true })
    voidedAt: Date;

    @Column({ name: 'void_reason', nullable: true })
    voidReason: string;

    @Column({ name: 'voided_by_user_id', nullable: true })
    voidedByUserId: string;

    @Column({ name: 'void_authorized_by_user_id', nullable: true })
    voidAuthorizedByUserId: string;

    // =============================================================================
    // NEW: Kitchen Status Tracking
    // =============================================================================

    @Column({ name: 'kitchen_status', type: 'varchar', length: 20, nullable: true })
    kitchenStatus: 'PENDING' | 'FIRED' | 'PREPARING' | 'READY' | 'SERVED' | null;

    @Column({ name: 'fired_to_kitchen_at', type: 'timestamp with time zone', nullable: true })
    firedToKitchenAt: Date;

    // =============================================================================
    // NEW: Modifiers Storage
    // =============================================================================

    @Column({ type: 'jsonb', nullable: true })
    modifiers: OrderItemModifier[];

    // =============================================================================
    // NEW: Special Instructions
    // =============================================================================

    @Column({ name: 'special_instructions', type: 'text', nullable: true })
    specialInstructions: string;

    // =============================================================================
    // NEW: Coursing Support (Fine Dining)
    // =============================================================================

    /**
     * Course number for multi-course meals (1=appetizer, 2=main, 3=dessert, etc.)
     */
    @Column({ name: 'course_number', nullable: true })
    courseNumber: number;

    /**
     * Don't fire this item to kitchen before this time
     */
    @Column({ name: 'hold_until', type: 'timestamp with time zone', nullable: true })
    holdUntil: Date;

    /**
     * When item was ready from kitchen
     */
    @Column({ name: 'ready_at', type: 'timestamp with time zone', nullable: true })
    readyAt: Date;

    /**
     * When item was served to customer
     */
    @Column({ name: 'served_at', type: 'timestamp with time zone', nullable: true })
    servedAt: Date;

    // =============================================================================
    // NEW: Inventory Reservation Tracking
    // =============================================================================

    /**
     * Stock reservation ID (soft hold)
     * Created when item is added to order
     */
    @Column({ name: 'stock_reservation_id', nullable: true })
    stockReservationId: string;

    /**
     * Whether stock has been committed (hard deducted)
     * True after fire to kitchen
     */
    @Column({ name: 'stock_committed', default: false })
    stockCommitted: boolean;

    /**
     * If voided after fire, whether stock was logged as waste
     */
    @Column({ name: 'logged_as_waste', default: false })
    loggedAsWaste: boolean;

    /**
     * Waste reason (if logged as waste)
     */
    @Column({ name: 'waste_reason', nullable: true })
    wasteReason: string;

    // =============================================================================
    // NEW: Allergen Warnings
    // =============================================================================

    @Column({ type: 'jsonb', nullable: true, name: 'allergen_warnings' })
    allergenWarnings: string[];
}

