/**
 * Payment Entity
 * H-POS: Comprehensive payment methods for Egyptian restaurants
 */
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SalesOrder } from './sales-order.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * H-POS Payment Methods
 * Includes local methods (Cash, Card) and delivery platform payments
 */
export enum PaymentMethod {
    // Standard Methods
    CASH = 'CASH',
    CARD = 'CARD',           // Generic card
    VISA = 'VISA',           // Visa credit/debit
    MASTERCARD = 'MASTERCARD',
    MADA = 'MADA',           // Saudi debit network
    MEEZA = 'MEEZA',         // Egyptian debit network

    // Electronic Payment Terminals
    EPT = 'EPT',             // External payment terminal

    // Mobile Payments
    APPLE_PAY = 'APPLE_PAY',
    GOOGLE_PAY = 'GOOGLE_PAY',

    // Delivery Platform Payments (collected by platform)
    TALABAT = 'TALABAT',
    MARSOOL = 'MARSOOL',
    INSTASHOP = 'INSTASHOP',
    HUNGERSTATION = 'HUNGERSTATION',
    CAREEM = 'CAREEM',

    // Other
    VOUCHER = 'VOUCHER',
    LOYALTY_POINTS = 'LOYALTY_POINTS',
    CREDIT = 'CREDIT',       // Customer credit/tab
}

/**
 * Payment Status for tracking payment lifecycle
 */
export enum PaymentTransactionStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    DECLINED = 'DECLINED',
    VOIDED = 'VOIDED',
    REFUNDED = 'REFUNDED',
}

@Entity('payments')
export class Payment extends AbstractEntity {
    @ManyToOne(() => SalesOrder, (order) => order.payments)
    @JoinColumn({ name: 'order_id' })
    order: SalesOrder;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    amount: number;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
    })
    method: PaymentMethod;

    /**
     * Payment transaction status
     */
    @Column({
        type: 'enum',
        enum: PaymentTransactionStatus,
        default: PaymentTransactionStatus.APPROVED,
    })
    status: PaymentTransactionStatus;

    /**
     * Transaction reference from terminal or platform
     * e.g., terminal transaction ID, platform order number
     */
    @Column({ nullable: true })
    reference: string;

    /**
     * Tip amount included in this payment
     */
    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    tipAmount: number;

    /**
     * Change given (for cash payments)
     */
    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    changeAmount: number;

    /**
     * Amount tendered (for cash - may be more than payment amount)
     */
    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    tenderedAmount: number;

    /**
     * Card last 4 digits (for audit purposes)
     */
    @Column({ name: 'card_last_four', nullable: true })
    cardLastFour: string;

    /**
     * Terminal ID used for payment
     */
    @Column({ name: 'terminal_id', nullable: true })
    terminalId: string;

    /**
     * Approval code from payment processor
     */
    @Column({ name: 'approval_code', nullable: true })
    approvalCode: string;

    /**
     * User who processed this payment
     */
    @Column({ name: 'processed_by_user_id', nullable: true })
    processedByUserId: string;

    /**
     * Timestamp when payment was processed
     */
    @Column({ name: 'processed_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    processedAt: Date;
}
