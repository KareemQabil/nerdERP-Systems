import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

export enum CashTransactionType {
    SALE = 'SALE',
    REFUND = 'REFUND',
    PETTY_CASH = 'PETTY_CASH',
    DROP_TO_SAFE = 'DROP_TO_SAFE',
    BANK_DROP = 'BANK_DROP',
    FLOAT_ADJUSTMENT = 'FLOAT_ADJUSTMENT',
    OPENING_BALANCE = 'OPENING_BALANCE',
}

/**
 * Cash Transaction Entity
 * All cash movements in register sessions
 */
@Entity('cash_transactions')
export class CashTransaction extends AbstractEntity {
    @Column({ name: 'register_session_id' })
    registerSessionId: string;

    @Column({ type: 'enum', enum: CashTransactionType, name: 'transaction_type' })
    transactionType: CashTransactionType;

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

    @Column({ name: 'approved_by_user_id', nullable: true })
    approvedByUserId: string;

    @Column({ type: 'text', nullable: true })
    notes: string;
}

/**
 * Bank Drop Entity
 * Records of cash dropped to bank/safe
 */
@Entity('bank_drops')
export class BankDrop extends AbstractEntity {
    @Column({ name: 'drop_number', unique: true })
    dropNumber: string;

    @Column({ name: 'store_id' })
    storeId: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    amount: number;

    @Column({ name: 'dropped_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    droppedAt: Date;

    @Column({ name: 'dropped_by_user_id' })
    droppedByUserId: string;

    @Column({ name: 'verified_by_user_id', nullable: true })
    verifiedByUserId: string;

    @Column({ name: 'verified_at', type: 'timestamp with time zone', nullable: true })
    verifiedAt: Date;

    @Column({ name: 'bank_reference', nullable: true })
    bankReference: string;

    @Column({ type: 'text', nullable: true })
    notes: string;
}
