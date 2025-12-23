import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

export enum GiftCardStatus {
    ACTIVE = 'ACTIVE',
    REDEEMED = 'REDEEMED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

/**
 * Gift Card Entity
 * Prepaid cards that can be purchased and redeemed
 */
@Entity('gift_cards')
export class GiftCard extends AbstractEntity {
    @Column({ name: 'card_number', unique: true })
    cardNumber: string;

    @Column({ type: 'enum', enum: GiftCardStatus, default: GiftCardStatus.ACTIVE })
    status: GiftCardStatus;

    @Column({
        name: 'initial_balance',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    initialBalance: number;

    @Column({
        name: 'current_balance',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    currentBalance: number;

    @Column({ name: 'expiry_date', type: 'timestamp with time zone', nullable: true })
    expiryDate: Date;

    @Column({ name: 'issued_by_user_id', nullable: true })
    issuedByUserId: string;

    @Column({ name: 'issued_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    issuedAt: Date;

    @Column({ name: 'customer_id', nullable: true })
    customerId: string;

    @Column({ name: 'customer_name', nullable: true })
    customerName: string;

    @Column({ type: 'text', nullable: true })
    notes: string;
}

/**
 * Gift Card Transaction Entity
 * Tracks all transactions on a gift card
 */
@Entity('gift_card_transactions')
export class GiftCardTransaction extends AbstractEntity {
    @ManyToOne(() => GiftCard, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'gift_card_id' })
    giftCard: GiftCard;

    @Column({ name: 'transaction_type' })
    transactionType: string; // 'ISSUE', 'REDEEM', 'REFUND', 'EXPIRE'

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    amount: number;

    @Column({
        name: 'balance_after',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    balanceAfter: number;

    @Column({ name: 'order_id', nullable: true })
    orderId: string;

    @Column({ name: 'performed_by_user_id' })
    performedByUserId: string;
}
