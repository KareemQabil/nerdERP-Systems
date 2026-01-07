import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { RegisterSession } from '../../cash/entities/register-session.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { OrderSurcharge } from './order-surcharge.entity';
import { OrderTax } from './order-tax.entity';
import { OrderStateHistory } from './order-state-history.entity';
import { Refund } from './refund.entity';

/**
 * =============================================================================
 * ORDER STATUS ENUM
 * =============================================================================
 *
 * Complete order status states for enterprise POS workflow
 * Supports multiple order types: DINE_IN, TAKEAWAY, DELIVERY, AGGREGATORS
 */
export enum OrderStatus {
    // =========================================================================
    // INITIAL STATES
    // =========================================================================
    DRAFT = 'DRAFT',                      // Order being built, items being added
    SAVED = 'SAVED',                      // Check saved, order committed but not paid

    // =========================================================================
    // KITCHEN WORKFLOW STATES
    // =========================================================================
    FIRED_TO_KITCHEN = 'FIRED_TO_KITCHEN', // Sent to kitchen display
    PREPARING = 'PREPARING',               // Kitchen acknowledged, cooking in progress
    READY = 'READY',                       // Food ready, awaiting service/delivery/pickup
    SERVED = 'SERVED',                     // Food served to customer (dine-in only)

    // =========================================================================
    // PAYMENT WORKFLOW STATES
    // =========================================================================
    PAYMENT_PENDING = 'PAYMENT_PENDING',   // Awaiting payment (dine-in post-service)
    PAYMENT_PROCESSING = 'PAYMENT_PROCESSING', // Payment transaction in progress
    PAID = 'PAID',                         // Payment received and confirmed
    PARTIALLY_PAID = 'PARTIALLY_PAID',     // Partial payment received (split payments)

    // =========================================================================
    // DELIVERY-SPECIFIC STATES
    // =========================================================================
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', // Driver has picked up order
    AWAITING_PICKUP = 'AWAITING_PICKUP',   // Aggregator order ready for pickup

    // =========================================================================
    // AGGREGATOR-SPECIFIC STATES
    // =========================================================================
    RECEIVED_FROM_AGGREGATOR = 'RECEIVED_FROM_AGGREGATOR', // Order from Talabat/Marsool

    // =========================================================================
    // APPROVAL WORKFLOW STATES
    // =========================================================================
    VOID_REQUESTED = 'VOID_REQUESTED',     // Void request pending manager approval
    VOID_APPROVED = 'VOID_APPROVED',       // Manager approved void
    RETURN_REQUESTED = 'RETURN_REQUESTED', // Return request pending approval
    RETURN_APPROVED = 'RETURN_APPROVED',   // Return approved, processing

    // =========================================================================
    // TERMINAL STATES
    // =========================================================================
    COMPLETED = 'COMPLETED',               // Order fully closed and finalized
    VOID = 'VOID',                         // Order cancelled/voided
    REFUNDED = 'REFUNDED',                 // Order refunded (new terminal state)

    // =========================================================================
    // LEGACY STATES (for backward compatibility)
    // =========================================================================
    PENDING = 'PENDING',                   // @deprecated Use SAVED or PAYMENT_PENDING
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
    REFUNDED = 'REFUNDED',
}

/**
 * H-POS Order Types
 * Egyptian Restaurant POS System
 */
export enum OrderType {
    DINE_IN = 'DINE_IN',           // داخل المطعم
    TAKEAWAY = 'TAKEAWAY',         // تيك أواي
    DELIVERY = 'DELIVERY',         // توصيل
    TALABAT = 'TALABAT',           // طلب
    MARSOOL = 'MARSOOL',           // رسل
    INSTASHOP = 'INSTASHOP',       // انستاشوب
}

/**
 * Database indexes for performance optimization
 * - createdAt index: Speeds up date range queries (daily/monthly reports)
 * - status index: Fast filtering by order status
 * - paymentStatus index: Fast filtering by payment status
 * - orderType index: Fast filtering by order type (DINE_IN, DELIVERY, etc.)
 * - Composite status+createdAt index: Optimizes common report queries (e.g., completed orders in date range)
 */
@Index(['createdAt'])
@Index(['status'])
@Index(['paymentStatus'])
@Index(['orderType'])
@Index(['status', 'createdAt'])
@Entity('sales_orders')
export class SalesOrder extends AbstractEntity {
    @Column({ name: 'order_number', unique: true })
    orderNumber: string;

    @Column({ name: 'invoice_number', nullable: true })
    invoiceNumber: string;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    status: OrderStatus;

    @Column({
        name: 'payment_status',
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    paymentStatus: PaymentStatus;

    @Column({
        name: 'total_gross',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    totalGross: number;

    @Column({
        name: 'total_tax',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    totalTax: number;

    @Column({
        name: 'total_net',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    totalNet: number;

    // ZATCA Compliance
    @Column({ name: 'invoice_hash', nullable: true })
    invoiceHash: string;

    @Column({ name: 'previous_hash', nullable: true })
    previousHash: string;

    @Column({ name: 'zatca_uuid', nullable: true })
    zatcaUuid: string;

    @Column({ name: 'zatca_qr_code', type: 'text', nullable: true })
    zatcaQrCode: string;

    // NEW: Calculation Pipeline Integration
    @ManyToOne(() => RegisterSession, { nullable: true })
    @JoinColumn({ name: 'register_session_id' })
    registerSession: RegisterSession;

    /**
     * Calculation breakdown - audit trail of pipeline execution
     * Example: [{ step: "TAX (1)", before: 100, after: 115, applied: 15 }]
     */
    @Column({ type: 'jsonb', nullable: true, name: 'calculation_breakdown' })
    calculationBreakdown: Array<{
        step: string;
        before: number;
        after: number;
        applied: number | null;
    }>;

    /**
     * Country-specific compliance data
     * Saudi ZATCA, Indian GST, US Sales Tax, etc.
     */
    @Column({ type: 'jsonb', nullable: true, name: 'compliance_data' })
    complianceData: {
        zatca?: {
            xml_uuid: string;
            invoice_hash: string;
            previous_hash: string;
            qr_code: string;
            signature: string;
            submission_status: string;
        };
        gst?: any;
        sales_tax?: any;
    };

    // NEW: Discounts
    @Column({
        name: 'discount_amount',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    discountAmount: number;

    @Column({ name: 'discount_reason', nullable: true })
    discountReason: string;

    // NEW: Surcharges
    @Column({
        name: 'total_surcharges',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalSurcharges: number;

    // NEW: Order Type (H-POS Order Types)
    @Column({
        name: 'order_type',
        type: 'enum',
        enum: OrderType,
        nullable: true,
    })
    orderType: OrderType;

    // H-POS: Table Service Charge (12% for dine-in)
    @Column({ name: 'service_charge_rate', type: 'decimal', precision: 5, scale: 4, nullable: true })
    serviceChargeRate: number; // e.g., 0.12 for 12%

    @Column({ name: 'service_charge_amount', type: 'decimal', precision: 10, scale: 3, nullable: true })
    serviceChargeAmount: number;

    // H-POS: Table association for dine-in orders
    @Column({ name: 'table_id', type: 'uuid', nullable: true })
    tableId: string;

    // H-POS: Number of customers at the table
    @Column({ name: 'customer_count', nullable: true })
    customerCount: number;

    // H-POS: Sales Order tracking (unpaid delivery orders)
    @Column({ name: 'is_sales_order', default: false })
    isSalesOrder: boolean; // Tracks unpaid delivery orders

    @Column({ name: 'sales_order_closed_at', type: 'timestamp with time zone', nullable: true })
    salesOrderClosedAt: Date; // When order was finally paid/closed

    // =============================================================================
    // NEW: Void Tracking Columns
    // =============================================================================

    @Column({ name: 'voided_at', type: 'timestamp with time zone', nullable: true })
    voidedAt: Date;

    @Column({ name: 'void_reason', nullable: true })
    voidReason: string;

    @Column({ name: 'voided_by_user_id', nullable: true })
    voidedByUserId: string;

    @Column({ name: 'void_authorized_by_user_id', nullable: true })
    voidAuthorizedByUserId: string;

    // =============================================================================
    // NEW: Order Lifecycle Timestamps
    // =============================================================================

    @Column({ name: 'fired_to_kitchen_at', type: 'timestamp with time zone', nullable: true })
    firedToKitchenAt: Date;

    @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
    completedAt: Date;

    /**
     * Custom fields storage
     * Stores custom field values defined via CustomFieldDefinition
     */
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    tags: string[]; // ['vip', 'rush_order', 'delivery']

    @Column({ type: 'text', nullable: true })
    notes: string;

    // =============================================================================
    // NEW: CALCULATION PIPELINE VERSIONING
    // =============================================================================

    /**
     * Pipeline configuration version used for this order
     * Enables audit trail and reproducibility
     */
    @Column({ name: 'pipeline_version', nullable: true })
    pipelineVersion: string;

    /**
     * Pipeline ID used for this order
     */
    @Column({ name: 'pipeline_id', nullable: true })
    pipelineId: string;

    // =============================================================================
    // NEW: DELIVERY MANAGEMENT FIELDS
    // =============================================================================

    /**
     * Delivery zone ID
     */
    @Column({ name: 'delivery_zone_id', nullable: true })
    deliveryZoneId: string;

    /**
     * Delivery address
     */
    @Column({ type: 'jsonb', nullable: true, name: 'delivery_address' })
    deliveryAddress: {
        street: string;
        building: string;
        floor?: string;
        apartment?: string;
        landmark?: string;
        coordinates?: { lat: number; lng: number };
    };

    /**
     * Delivery fee charged
     */
    @Column({
        name: 'delivery_fee',
        type: 'decimal',
        precision: 10,
        scale: 3,
        nullable: true,
        transformer: new DecimalTransformer(),
    })
    deliveryFee: number;

    /**
     * Assigned driver
     */
    @Column({ name: 'driver_id', nullable: true })
    driverId: string;

    /**
     * Delivery status
     */
    @Column({
        name: 'delivery_status',
        type: 'enum',
        enum: ['PENDING', 'ASSIGNED', 'PREPARING', 'READY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'],
        nullable: true,
    })
    deliveryStatus: 'PENDING' | 'ASSIGNED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

    /**
     * Delivery timestamps
     */
    @Column({ name: 'driver_assigned_at', type: 'timestamp with time zone', nullable: true })
    driverAssignedAt: Date;

    @Column({ name: 'order_picked_up_at', type: 'timestamp with time zone', nullable: true })
    orderPickedUpAt: Date;

    @Column({ name: 'out_for_delivery_at', type: 'timestamp with time zone', nullable: true })
    outForDeliveryAt: Date;

    @Column({ name: 'delivered_at', type: 'timestamp with time zone', nullable: true })
    deliveredAt: Date;

    /**
     * Delivery notes
     */
    @Column({ type: 'text', nullable: true, name: 'delivery_notes' })
    deliveryNotes: string;

    /**
     * Customer contact for delivery
     */
    @Column({ type: 'jsonb', nullable: true, name: 'delivery_contact' })
    deliveryContact: {
        name: string;
        phone: string;
        alternativePhone?: string;
    };

    // =============================================================================
    // NEW: TABLE SPLITTING & RETURN ORDER LINKAGE
    // =============================================================================

    /**
     * For split bills: parent order ID
     * If this is a child order from a split, references the original
     */
    @Column({ name: 'parent_order_id', nullable: true })
    parentOrderId: string;

    /**
     * For returns: original order ID that this return is from
     */
    @Column({ name: 'original_order_id', nullable: true })
    originalOrderId: string;

    /**
     * For split bills: seat assignment
     * Maps items to specific seats/guests
     */
    @Column({ type: 'jsonb', nullable: true, name: 'seat_assignments' })
    seatAssignments: Array<{
        orderItemId: string;
        seatNumber: number;
        guestName?: string;
    }>;

    // Relations
    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @OneToMany(() => Payment, (payment) => payment.order, { cascade: true })
    payments: Payment[];

    @OneToMany(() => OrderSurcharge, (surcharge) => surcharge.order, { cascade: true })
    surcharges: OrderSurcharge[];

    @OneToMany(() => OrderTax, (tax) => tax.order, { cascade: true })
    taxes: OrderTax[];

    @OneToMany(() => OrderStateHistory, (history) => history.order, { cascade: true })
    stateHistory: OrderStateHistory[];

    @OneToMany(() => Refund, (refund) => refund.order, { cascade: true })
    refunds: Refund[];
}
