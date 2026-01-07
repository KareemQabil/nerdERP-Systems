import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SalesOrder, OrderType, OrderStatus } from './sales-order.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * =============================================================================
 * RETURN ORDER TYPES
 * =============================================================================
 */

/**
 * Return Reason Categories
 */
export enum ReturnReason {
  // Product Issues
  DEFECTIVE = 'DEFECTIVE',
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  WRONG_ITEM = 'WRONG_ITEM',

  // Customer Issues
  CUSTOMER_DISSATISFIED = 'CUSTOMER_DISSATISFIED',
  CUSTOMER_CHANGE_OF_MIND = 'CUSTOMER_CHANGE_OF_MIND',
  TASTE_ISSUE = 'TASTE_ISSUE',

  // Service Issues
  DELAYED_SERVICE = 'DELAYED_SERVICE',
  POOR_SERVICE = 'POOR_SERVICE',
  WRONG_TABLE = 'WRONG_TABLE',

  // Payment Issues
  OVERCHARGED = 'OVERCHARGED',
  DUPLICATE_CHARGE = 'DUPLICATE_CHARGE',

  // Other
  OTHER = 'OTHER',
}

/**
 * Return Status
 */
export enum ReturnStatus {
  REQUESTED = 'REQUESTED',       // Return requested, pending approval
  APPROVED = 'APPROVED',         // Manager approved
  REJECTED = 'REJECTED',         // Manager rejected
  PROCESSED = 'PROCESSED',       // Return/refund processed
  COMPLETED = 'COMPLETED',       // Return fully completed
  CANCELLED = 'CANCELLED',       // Return cancelled
}

/**
 * Return Type
 */
export enum ReturnType {
  FULL_RETURN = 'FULL_RETURN',           // Entire order returned
  PARTIAL_RETURN = 'PARTIAL_RETURN',     // Specific items returned
  ITEM_RETURN = 'ITEM_RETURN',           // Individual item returned
}

/**
 * Returned Item Detail
 */
export interface ReturnedItem {
  orderItemId: string;
  productId: string;
  productName: string;
  productNameAr?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  reason: string;
  condition: 'CONSUMED' | 'PARTIALLY_CONSUMED' | 'UNUSED' | 'PACKED';
  returnToInventory: boolean;
}

/**
 * =============================================================================
 * ENTITY: ReturnOrder
 * =============================================================================
 *
 * Tracks returns and refunds for completed orders.
 * Links return orders to original orders for full audit trail.
 *
 * Workflow:
 * 1. Customer requests return (from completed order)
 * 2. Manager approves (with inspection if applicable)
 * 3. System processes refund
 * 4. Inventory restored (if applicable)
 * 5. Original order linked for reference
 *
 * @example
 * // Partial return with refund
 * {
 *   originalOrderId: 'uuid-original-order',
 *   returnType: 'PARTIAL_RETURN',
 *   returnedItems: [{
 *     orderItemId: 'uuid-item-1',
 *     productName: 'Grilled Chicken',
 *     quantity: 1,
 *     reason: 'Customer dissatisfied',
 *     condition: 'UNUSED',
 *     returnToInventory: false
 *   }],
 *   refundAmount: 150.00,
 *   status: 'APPROVED'
 * }
 */
@Entity('return_orders')
export class ReturnOrder extends AbstractEntity {
  // =========================================================================
  // ORIGINAL ORDER RELATIONSHIP
  // =========================================================================

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: 'original_order_id' })
  originalOrder: SalesOrder;

  @Column({ name: 'original_order_id' })
  originalOrderId: string;

  /**
   * Original order number (denormalized for easy reference)
   */
  @Column({ name: 'original_order_number' })
  originalOrderNumber: string;

  // =========================================================================
  // RETURN TYPE & STATUS
  // =========================================================================

  /**
   * Type of return
   */
  @Column({
    name: 'return_type',
    type: 'enum',
    enum: ReturnType,
  })
  returnType: ReturnType;

  /**
   * Current return status
   */
  @Column({
    name: 'status',
    type: 'enum',
    enum: ReturnStatus,
    default: ReturnStatus.REQUESTED,
  })
  status: ReturnStatus;

  // =========================================================================
  // RETURNED ITEMS
  // =========================================================================

  /**
   * Items being returned
   * Includes all details needed for refund and inventory
   */
  @Column({ type: 'jsonb', name: 'returned_items' })
  returnedItems: ReturnedItem[];

  /**
   * Number of items being returned
   */
  @Column({ name: 'items_count', default: 0 })
  itemsCount: number;

  // =========================================================================
  // REASON & NOTES
  // =========================================================================

  /**
   * Primary return reason
   */
  @Column({
    name: 'return_reason',
    type: 'enum',
    enum: ReturnReason,
  })
  returnReason: ReturnReason;

  /**
   * Detailed explanation
   */
  @Column({ type: 'text', nullable: true })
  details: string;

  /**
   * Customer-facing note
   */
  @Column({ type: 'text', nullable: true, name: 'customer_note' })
  customerNote: string;

  /**
   * Internal notes (staff only)
   */
  @Column({ type: 'text', nullable: true, name: 'internal_notes' })
  internalNotes: string;

  // =========================================================================
  // REFUND DETAILS
  // =========================================================================

  /**
   * Total refund amount
   * May include tax, service charge, delivery fee proration
   */
  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 10,
    scale: 3,
    transformer: new DecimalTransformer(),
  })
  refundAmount: number;

  /**
   * Refund breakdown (JSONB)
   * Shows how refund was calculated
   */
  @Column({ type: 'jsonb', nullable: true, name: 'refund_breakdown' })
  refundBreakdown: {
    itemsSubtotal: number;
    serviceCharge: number;
    tax: number;
    deliveryFee: number;
    total: number;
  };

  /**
   * Whether items are returned to inventory
   * Food items typically cannot be restocked
   */
  @Column({ name: 'restore_inventory', default: false })
  restoreInventory: boolean;

  /**
   * Refund method
   */
  @Column({ name: 'refund_method', nullable: true })
  refundMethod: 'CASH' | 'CARD' | 'ORIGINAL_PAYMENT' | 'STORE_CREDIT' | 'BANK_TRANSFER';

  // =========================================================================
  // APPROVAL WORKFLOW
  // =========================================================================

  /**
   * Whether manager approval is required
   */
  @Column({ name: 'requires_approval', default: true })
  requiresApproval: boolean;

  /**
   * User who requested the return
   */
  @Column({ name: 'requested_by_user_id' })
  requestedByUserId: string;

  @Column({ name: 'requested_by_user_name' })
  requestedByUserName: string;

  /**
   * User who approved the return
   */
  @Column({ name: 'approved_by_user_id', nullable: true })
  approvedByUserId: string;

  @Column({ name: 'approved_by_user_name', nullable: true })
  approvedByUserName: string;

  /**
   * Approval timestamp
   */
  @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
  approvedAt: Date;

  /**
   * Rejection reason (if rejected)
   */
  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  // =========================================================================
  // PROCESSING DETAILS
  // =========================================================================

  /**
   * When return was processed
   */
  @Column({ name: 'processed_at', type: 'timestamp with time zone', nullable: true })
  processedAt: Date;

  /**
   * User who processed the return
   */
  @Column({ name: 'processed_by_user_id', nullable: true })
  processedByUserId: string;

  /**
   * When return was completed
   */
  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt: Date;

  // =========================================================================
  // CUSTOMER INFORMATION
  // =========================================================================

  /**
   * Customer name (if available)
   */
  @Column({ name: 'customer_name', nullable: true })
  customerName: string;

  /**
   * Customer phone (for follow-up)
   */
  @Column({ name: 'customer_phone', nullable: true })
  customerPhone: string;

  // =========================================================================
  // STORE & LOCATION
  // =========================================================================

  /**
   * Store where return is processed
   */
  @Column({ name: 'store_id' })
  storeId: string;

  /**
   * Register/session for refund
   */
  @Column({ name: 'register_session_id', nullable: true })
  registerSessionId: string;

  // =========================================================================
  // AUDIT METADATA
  // =========================================================================

  /**
   * Device where return was initiated
   */
  @Column({ name: 'device_id', nullable: true })
  deviceId: string;

  /**
   * IP address for security
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
   * Check if return can be approved
   */
  canBeApproved(): boolean {
    return this.status === ReturnStatus.REQUESTED && this.returnedItems.length > 0;
  }

  /**
   * Mark as approved
   */
  approve(approvedByUserId: string, approvedByUserName: string): void {
    this.status = ReturnStatus.APPROVED;
    this.approvedByUserId = approvedByUserId;
    this.approvedByUserName = approvedByUserName;
    this.approvedAt = new Date();
  }

  /**
   * Mark as rejected
   */
  reject(reason: string): void {
    this.status = ReturnStatus.REJECTED;
    this.rejectionReason = reason;
  }

  /**
   * Calculate refund amount based on returned items
   */
  calculateRefund(): number {
    return this.returnedItems.reduce((sum, item) => {
      return sum + (item.totalAmount || (item.quantity * item.unitPrice));
    }, 0);
  }

  /**
   * Check if items can be restocked
   * Food items typically cannot be returned to inventory
   */
  canRestockToInventory(): boolean {
    return this.returnedItems.some(item =>
      item.returnToInventory && item.condition !== 'CONSUMED'
    );
  }
}
