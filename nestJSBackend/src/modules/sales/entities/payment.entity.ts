import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SalesOrder } from './sales-order.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    MADA = 'MADA',
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
}
