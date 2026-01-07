import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SalesOrder } from './sales-order.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * =============================================================================
 * ORDER DISCOUNT TYPES
 * =============================================================================
 */

/**
 * Discount Type Classification
 */
export enum DiscountType {
  CORPORATE_PRESET = 'CORPORATE_PRESET',   // Pre-configured corporate discount
  MANUAL_PERCENTAGE = 'MANUAL_PERCENTAGE', // Staff enters percentage
  MANUAL_AMOUNT = 'MANUAL_AMOUNT',         // Staff enters fixed amount
  COUPON_CODE = 'COUPON_CODE',             // Discount from coupon code
  LOYALTY_REDEMPTION = 'LOYALTY_REDEMPTION', // Points redemption
  PROMOTION = 'PROMOTION',                 // System-applied promotion
}

/**
 * Discount Method
 */
export enum DiscountMethod {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

/**
 * Discount Status
 */
export enum DiscountStatus {
  PENDING = 'PENDING',       // Awaiting authorization
  APPROVED = 'APPROVED',     // Manager approved
  APPLIED = 'APPLIED',       // Applied to order
  REJECTED = 'REJECTED',     // Manager rejected
  REVERSED = 'REVERSED',     // Reversed after application
}

/**
 * =============================================================================
 * ENTITY: OrderDiscount
 * =============================================================================
 *
 * Tracks detailed discount information for sales orders.
 * Replaces simple discountAmount/discountReason fields with full audit trail.
 *
 * Features:
 * - Multiple discounts per order (corporate + manual)
 * - Authorization workflow for manager-required discounts
 * - Link to discount code/coupon definitions
 * - Full audit trail
 *
 * @example
 * // Corporate Discount (requires manager approval)
 * {
 *   discountType: 'CORPORATE_PRESET',
 *   discountMethod: 'PERCENTAGE',
 *   value: 15.00,
 *   amount: 45.00,
 *   discountCode: 'CORP-EGYPT-001',
 *   authorizedByUserId: 'manager-uuid',
 *   status: 'APPLIED'
 * }
 */
@Entity('order_discounts')
export class OrderDiscount extends AbstractEntity {
  // =========================================================================
  // ORDER RELATIONSHIP
  // =========================================================================

  @ManyToOne(() => SalesOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder;

  @Column({ name: 'order_id' })
  orderId: string;

  // =========================================================================
  // DISCOUNT TYPE & METHOD
  // =========================================================================

  /**
   * Type of discount being applied
   */
  @Column({
    name: 'discount_type',
    type: 'enum',
    enum: DiscountType,
  })
  discountType: DiscountType;

  /**
   * Whether discount is percentage or fixed amount
   */
  @Column({
    name: 'discount_method',
    type: 'enum',
    enum: DiscountMethod,
  })
  discountMethod: DiscountMethod;

  // =========================================================================
  // DISCOUNT VALUES
  // =========================================================================

  /**
   * Discount value (percentage or amount)
   * For PERCENTAGE: e.g., 15.00 (15%)
   * For FIXED: e.g., 50.00 (50 EGP)
   */
  @Column({
    name: 'value',
    type: 'decimal',
    precision: 10,
    scale: 3,
    transformer: new DecimalTransformer(),
  })
  value: number;

  /**
   * Calculated discount amount in currency
   * The actual amount deducted from the order total
   */
  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 10,
    scale: 3,
    transformer: new DecimalTransformer(),
  })
  amount: number;

  // =========================================================================
  // AUTHORIZATION
  // =========================================================================

  /**
   * Whether this discount requires manager approval
   * Determined by discount configuration
   */
  @Column({ name: 'requires_authorization', default: false })
  requiresAuthorization: boolean;

  /**
   * User who requested the discount
   */
  @Column({ name: 'requested_by_user_id', nullable: true })
  requestedByUserId: string;

  /**
   * User who authorized the discount (manager/admin)
   */
  @Column({ name: 'authorized_by_user_id', nullable: true })
  authorizedByUserId: string;

  /**
   * Authorization timestamp
   */
  @Column({ name: 'authorized_at', type: 'timestamp with time zone', nullable: true })
  authorizedAt: Date;

  // =========================================================================
  // DISCOUNT CODE & REASON
  // =========================================================================

  /**
   * Discount code (if applicable)
   * Links to corporate discount definition or coupon code
   */
  @Column({ name: 'discount_code', nullable: true })
  discountCode: string;

  /**
   * Reason for discount (audit trail)
   * Required for manual discounts
   */
  @Column({ type: 'text', nullable: true })
  reason: string;

  /**
   * Internal notes (not shown to customer)
   */
  @Column({ type: 'text', nullable: true })
  notes: string;

  // =========================================================================
  // STATUS & WORKFLOW
  // =========================================================================

  /**
   * Current discount status
   */
  @Column({
    name: 'status',
    type: 'enum',
    enum: DiscountStatus,
    default: DiscountStatus.APPLIED,
  })
  status: DiscountStatus;

  /**
   * Rejection reason (if rejected)
   */
  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  // =========================================================================
  // APPLICATION DETAILS
  // =========================================================================

  /**
   * Whether discount applies to tax
   * true = discount reduces total including tax
   * false = discount applies to subtotal only
   */
  @Column({ name: 'apply_to_tax', default: true })
  applyToTax: boolean;

  /**
   * Whether discount applies to service charge
   */
  @Column({ name: 'apply_to_service_charge', default: true })
  applyToServiceCharge: boolean;

  /**
   * Whether discount applies to delivery fee
   */
  @Column({ name: 'apply_to_delivery', default: true })
  applyToDelivery: boolean;

  // =========================================================================
  // AUDIT METADATA
  // =========================================================================

  /**
   * Device where discount was applied
   */
  @Column({ name: 'device_id', nullable: true })
  deviceId: string;

  /**
   * IP address for security audit
   */
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  /**
   * Additional metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // =========================================================================
  // METHODS
  // =========================================================================

  /**
   * Calculate discount amount for a given base value
   */
  calculateAmount(baseValue: number): number {
    if (this.discountMethod === DiscountMethod.PERCENTAGE) {
      return baseValue * (this.value / 100);
    }
    return this.value;
  }

  /**
   * Check if discount can be applied
   */
  canBeApplied(): boolean {
    return this.status === DiscountStatus.APPROVED ||
      (this.status === DiscountStatus.APPLIED && !this.requiresAuthorization);
  }

  /**
   * Mark as approved by manager
   */
  approve(authorizedByUserId: string): void {
    this.status = DiscountStatus.APPROVED;
    this.authorizedByUserId = authorizedByUserId;
    this.authorizedAt = new Date();
  }

  /**
   * Mark as rejected
   */
  reject(reason: string): void {
    this.status = DiscountStatus.REJECTED;
    this.rejectionReason = reason;
  }
}
