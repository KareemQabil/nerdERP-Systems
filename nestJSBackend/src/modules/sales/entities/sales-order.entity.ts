import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { RegisterSession } from '../../cash/entities/register-session.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { OrderSurcharge } from './order-surcharge.entity';
import { OrderTax } from './order-tax.entity';
import { OrderStateHistory } from './order-state-history.entity';
import { Refund } from './refund.entity';

export enum OrderStatus {
    DRAFT = 'DRAFT',              // Order being built
    FIRED_TO_KITCHEN = 'FIRED_TO_KITCHEN', // Sent to kitchen
    PREPARING = 'PREPARING',       // Kitchen working on it
    READY = 'READY',               // Ready for service
    PENDING = 'PENDING',           // Legacy (for backward compatibility)
    PAID = 'PAID',                 // Payment complete
    COMPLETED = 'COMPLETED',       // Order closed
    VOID = 'VOID',                 // Cancelled
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
    REFUNDED = 'REFUNDED',
}

@Entity('sales_orders')
export class SalesOrder extends AbstractEntity {
    @Column({ name: 'order_number', unique: true })
    orderNumber: string;

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

    // NEW: Order Type (will be replaced by workflow states in future)
    @Column({ name: 'order_type', nullable: true })
    orderType: string; // 'DINE_IN', 'TAKEOUT', 'DELIVERY'

    // Table association for dine-in orders
    @Column({ name: 'table_id', type: 'uuid', nullable: true })
    tableId: string;

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
