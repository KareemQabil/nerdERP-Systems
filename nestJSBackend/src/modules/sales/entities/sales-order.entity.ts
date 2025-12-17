import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { RegisterSession } from '../../cash/entities/register-session.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

export enum OrderStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    VOID = 'VOID',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
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

    @ManyToOne(() => RegisterSession, { nullable: true })
    @JoinColumn({ name: 'register_session_id' })
    registerSession: RegisterSession;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @OneToMany(() => Payment, (payment) => payment.order, { cascade: true })
    payments: Payment[];
}
