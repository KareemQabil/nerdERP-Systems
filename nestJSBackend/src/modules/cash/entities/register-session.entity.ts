import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * Register Session Entity
 * Tracks cash flow through POS terminals for shift reconciliation
 */
@Entity('register_sessions')
export class RegisterSession extends AbstractEntity {
    @Column({ name: 'device_id' })
    deviceId: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'store_id' })
    storeId: string;

    @Column({ name: 'is_open', default: true })
    isOpen: boolean;

    @Column({
        name: 'opening_balance',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    openingBalance: number;

    @Column({
        name: 'expected_balance',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    expectedBalance: number;

    @Column({
        name: 'actual_balance',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    actualBalance: number;

    @Column({
        name: 'total_cash_sales',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalCashSales: number;

    @Column({
        name: 'total_drops',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalDrops: number;

    @Column({
        name: 'total_petty_cash',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalPettyCash: number;

    @Column({
        name: 'discrepancy',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    discrepancy: number;

    @Column({ name: 'opened_at', type: 'timestamp with time zone' })
    openedAt: Date;

    @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
    closedAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;
}
