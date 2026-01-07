import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Store } from '../../organization/entities/store.entity';

/**
 * Discount Type - How the discount is categorized
 */
export enum DiscountType {
    // Manual Discounts (applied by staff)
    MANUAL_PERCENTAGE = 'MANUAL_PERCENTAGE',
    MANUAL_FIXED = 'MANUAL_FIXED',

    // Company/Corporate Discounts
    CORPORATE_PRESET = 'CORPORATE_PRESET',
    VIP_CUSTOMER = 'VIP_CUSTOMER',
    STAFF = 'STAFF',

    // Promotional Discounts
    PROMOTION = 'PROMOTION',
    HAPPY_HOUR = 'HAPPY_HOUR',
    SEASONAL = 'SEASONAL',

    // Loyalty/Reward Discounts
    LOYALTY = 'LOYALTY',
    POINTS_REDEMPTION = 'POINTS_REDEMPTION',

    // Special Discounts
    MANAGER_OVERRIDE = 'MANAGER_OVERRIDE',
    COUPON = 'COUPON',
    BIRTHDAY = 'BIRTHDAY',
    FIRST_ORDER = 'FIRST_ORDER',
    BULK_ORDER = 'BULK_ORDER',

    // Delivery Discounts
    FREE_DELIVERY = 'FREE_DELIVERY',
    DELIVERY_REDUCTION = 'DELIVERY_REDUCTION',
}

/**
 * Discount Method - How the discount value is calculated
 */
export enum DiscountMethod {
    PERCENTAGE = 'PERCENTAGE',     // % off total
    FIXED_AMOUNT = 'FIXED_AMOUNT', // Fixed SAR/EGP amount off
    BUY_X_GET_Y = 'BUY_X_GET_Y',   // Buy X items get Y free
    FREE_ITEM = 'FREE_ITEM',       // Free item included
}

/**
 * Discount Scope - What the discount applies to
 */
export enum DiscountScope {
    ORDER = 'ORDER',               // Entire order
    ITEM = 'ITEM',                 // Specific items
    CATEGORY = 'CATEGORY',         // Product category
    DELIVERY = 'DELIVERY',         // Delivery charges only
}

/**
 * Discount Status
 */
export enum DiscountStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    EXPIRED = 'EXPIRED',
    SCHEDULED = 'SCHEDULED',
}

/**
 * Day of Week for scheduling
 */
export enum DayOfWeek {
    SUNDAY = 0,
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6,
}

/**
 * =============================================================================
 * ENTITY: Discount
 * =============================================================================
 *
 * Company/Store-level discount definitions that can be applied to orders.
 * This is the template/master record; OrderDiscount tracks actual usage.
 *
 * Features:
 * - Multiple discount types (manual, corporate, promotional, loyalty)
 * - Configurable approval requirements
 * - Time-based scheduling (happy hour, seasonal)
 * - Minimum/maximum limits
 * - Usage tracking
 * - Multi-language support
 *
 * Workflow:
 * 1. Admin creates discount templates in this entity
 * 2. Staff applies discount to order → creates OrderDiscount record
 * 3. OrderDiscount links back to this Discount template
 *
 * Example:
 * {
 *   code: 'STAFF-15',
 *   name: 'Staff Discount',
 *   type: 'STAFF',
 *   method: 'PERCENTAGE',
 *   value: 15.00,
 *   requiresApproval: false,
 *   requiresPin: true,
 *   isActive: true
 * }
 */
@Entity('discounts')
@Index(['storeId', 'code'], { unique: true })
@Index(['storeId', 'type'])
@Index(['storeId', 'status'])
export class Discount extends AbstractEntity {
    // =====================================================
    // STORE RELATIONSHIP
    // =====================================================

    @Column({ name: 'store_id' })
    storeId: string;

    @ManyToOne(() => Store, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'store_id' })
    store: Store;

    // =====================================================
    // DISCOUNT IDENTITY
    // =====================================================

    /**
     * Unique discount code (e.g., 'STAFF-15', 'VIP-20', 'HAPPY-HOUR')
     */
    @Column({ unique: false, length: 50 })
    code: string;

    /**
     * Display name in English
     */
    @Column({ length: 100 })
    name: string;

    /**
     * Display name in Arabic
     */
    @Column({ name: 'name_ar', length: 100, nullable: true })
    nameAr: string;

    /**
     * Description/Notes
     */
    @Column({ type: 'text', nullable: true })
    description: string;

    /**
     * Arabic description
     */
    @Column({ name: 'description_ar', type: 'text', nullable: true })
    descriptionAr: string;

    // =====================================================
    // DISCOUNT CONFIGURATION
    // =====================================================

    /**
     * Type of discount (STAFF, CORPORATE, PROMOTION, etc.)
     */
    @Column({
        type: 'enum',
        enum: DiscountType,
        default: DiscountType.MANUAL_PERCENTAGE,
    })
    type: DiscountType;

    /**
     * How discount is calculated (PERCENTAGE, FIXED_AMOUNT, etc.)
     */
    @Column({
        type: 'enum',
        enum: DiscountMethod,
        default: DiscountMethod.PERCENTAGE,
    })
    method: DiscountMethod;

    /**
     * Discount value (percentage or fixed amount)
     * For PERCENTAGE: 15 = 15%
     * For FIXED_AMOUNT: 50 = 50 SAR/EGP
     */
    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        default: 0,
    })
    value: number;

    /**
     * What the discount applies to
     */
    @Column({
        type: 'enum',
        enum: DiscountScope,
        default: DiscountScope.ORDER,
    })
    scope: DiscountScope;

    // =====================================================
    // LIMITS & CONSTRAINTS
    // =====================================================

    /**
     * Minimum order value required to apply this discount
     */
    @Column({
        name: 'minimum_order_value',
        type: 'decimal',
        precision: 10,
        scale: 3,
        nullable: true,
    })
    minimumOrderValue: number;

    /**
     * Maximum discount amount that can be applied
     * Useful for percentage discounts on high-value orders
     */
    @Column({
        name: 'maximum_discount_amount',
        type: 'decimal',
        precision: 10,
        scale: 3,
        nullable: true,
    })
    maximumDiscountAmount: number;

    /**
     * Maximum times this discount can be used per day (null = unlimited)
     */
    @Column({ name: 'max_uses_per_day', type: 'int', nullable: true })
    maxUsesPerDay: number;

    /**
     * Maximum times this discount can be used total (null = unlimited)
     */
    @Column({ name: 'max_uses_total', type: 'int', nullable: true })
    maxUsesTotal: number;

    /**
     * Current total uses count
     */
    @Column({ name: 'current_uses_count', type: 'int', default: 0 })
    currentUsesCount: number;

    // =====================================================
    // SCHEDULING (Happy Hour, Seasonal, etc.)
    // =====================================================

    /**
     * Start date for this discount (for scheduled/seasonal discounts)
     */
    @Column({ name: 'valid_from', type: 'timestamptz', nullable: true })
    validFrom: Date;

    /**
     * End date for this discount
     */
    @Column({ name: 'valid_until', type: 'timestamptz', nullable: true })
    validUntil: Date;

    /**
     * Days of week this discount is valid (for happy hour)
     * e.g., [0, 6] = Sunday and Saturday only
     */
    @Column({ name: 'valid_days', type: 'simple-array', nullable: true })
    validDays: number[];

    /**
     * Start time each day (HH:MM format, e.g., '14:00')
     */
    @Column({ name: 'valid_time_from', length: 5, nullable: true })
    validTimeFrom: string;

    /**
     * End time each day (HH:MM format, e.g., '18:00')
     */
    @Column({ name: 'valid_time_until', length: 5, nullable: true })
    validTimeUntil: string;

    // =====================================================
    // AUTHORIZATION REQUIREMENTS
    // =====================================================

    /**
     * Requires manager approval to apply
     */
    @Column({ name: 'requires_approval', default: false })
    requiresApproval: boolean;

    /**
     * Requires PIN verification
     */
    @Column({ name: 'requires_pin', default: false })
    requiresPin: boolean;

    /**
     * Allowed user roles to apply this discount
     * Empty array = all roles allowed
     */
    @Column({ name: 'allowed_roles', type: 'simple-array', nullable: true })
    allowedRoles: string[];

    // =====================================================
    // SCOPE RESTRICTIONS
    // =====================================================

    /**
     * Order types this discount can be applied to
     * Empty array = all order types
     */
    @Column({ name: 'applicable_order_types', type: 'simple-array', nullable: true })
    applicableOrderTypes: string[];

    /**
     * Product category IDs this discount applies to (for CATEGORY scope)
     */
    @Column({ name: 'applicable_category_ids', type: 'simple-array', nullable: true })
    applicableCategoryIds: string[];

    /**
     * Product IDs this discount applies to (for ITEM scope)
     */
    @Column({ name: 'applicable_product_ids', type: 'simple-array', nullable: true })
    applicableProductIds: string[];

    /**
     * Customer IDs this discount is limited to (for VIP/specific customer)
     */
    @Column({ name: 'applicable_customer_ids', type: 'simple-array', nullable: true })
    applicableCustomerIds: string[];

    // =====================================================
    // COMBINATION RULES
    // =====================================================

    /**
     * Can this discount be combined with other discounts?
     */
    @Column({ name: 'combinable', default: false })
    combinable: boolean;

    /**
     * Discount IDs that cannot be combined with this one
     */
    @Column({ name: 'excluded_discount_ids', type: 'simple-array', nullable: true })
    excludedDiscountIds: string[];

    /**
     * Priority when multiple discounts apply (higher = applied first)
     */
    @Column({ default: 0 })
    priority: number;

    // =====================================================
    // STATUS & TRACKING
    // =====================================================

    /**
     * Discount status
     */
    @Column({
        type: 'enum',
        enum: DiscountStatus,
        default: DiscountStatus.ACTIVE,
    })
    status: DiscountStatus;

    /**
     * Is discount currently active?
     */
    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    /**
     * Display order in list
     */
    @Column({ name: 'sort_order', default: 0 })
    sortOrder: number;

    // =====================================================
    // AUDIT FIELDS
    // =====================================================

    /**
     * Who created this discount
     */
    @Column({ name: 'created_by_user_id', nullable: true })
    createdByUserId: string;

    /**
     * Who last modified this discount
     */
    @Column({ name: 'last_modified_by_user_id', nullable: true })
    lastModifiedByUserId: string;

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Check if discount is currently valid based on schedule
     */
    isCurrentlyValid(): boolean {
        const now = new Date();

        // Check date range
        if (this.validFrom && now < this.validFrom) {
            return false;
        }
        if (this.validUntil && now > this.validUntil) {
            return false;
        }

        // Check day of week
        if (this.validDays && this.validDays.length > 0) {
            const dayOfWeek = now.getDay();
            if (!this.validDays.includes(dayOfWeek)) {
                return false;
            }
        }

        // Check time of day
        if (this.validTimeFrom && this.validTimeUntil) {
            const currentTime = now.toTimeString().substring(0, 5); // HH:MM
            if (currentTime < this.validTimeFrom || currentTime > this.validTimeUntil) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if discount can be used (not exceeded limits)
     */
    canBeUsed(): boolean {
        if (!this.isActive) {
            return false;
        }

        if (this.status !== DiscountStatus.ACTIVE) {
            return false;
        }

        if (!this.isCurrentlyValid()) {
            return false;
        }

        if (this.maxUsesTotal && this.currentUsesCount >= this.maxUsesTotal) {
            return false;
        }

        return true;
    }

    /**
     * Calculate discount amount for a given order total
     */
    calculateAmount(orderTotal: number): number {
        if (this.minimumOrderValue && orderTotal < this.minimumOrderValue) {
            return 0;
        }

        let discountAmount = 0;

        if (this.method === DiscountMethod.PERCENTAGE) {
            discountAmount = orderTotal * (this.value / 100);
        } else if (this.method === DiscountMethod.FIXED_AMOUNT) {
            discountAmount = Number(this.value);
        }

        // Apply maximum cap
        if (this.maximumDiscountAmount && discountAmount > this.maximumDiscountAmount) {
            discountAmount = Number(this.maximumDiscountAmount);
        }

        return discountAmount;
    }

    /**
     * Check if discount applies to a specific order type
     */
    appliesToOrderType(orderType: string): boolean {
        if (!this.applicableOrderTypes || this.applicableOrderTypes.length === 0) {
            return true; // No restrictions
        }
        return this.applicableOrderTypes.includes(orderType);
    }

    /**
     * Check if discount applies to a specific product
     */
    appliesToProduct(productId: string, categoryId?: string): boolean {
        if (this.scope === DiscountScope.ORDER || this.scope === DiscountScope.DELIVERY) {
            return true; // Order/Delivery level discounts apply to all products
        }

        if (this.scope === DiscountScope.ITEM) {
            if (!this.applicableProductIds || this.applicableProductIds.length === 0) {
                return true;
            }
            return this.applicableProductIds.includes(productId);
        }

        if (this.scope === DiscountScope.CATEGORY && categoryId) {
            if (!this.applicableCategoryIds || this.applicableCategoryIds.length === 0) {
                return true;
            }
            return this.applicableCategoryIds.includes(categoryId);
        }

        return false;
    }

    /**
     * Increment usage count
     */
    incrementUsage(): void {
        this.currentUsesCount += 1;
    }
}
