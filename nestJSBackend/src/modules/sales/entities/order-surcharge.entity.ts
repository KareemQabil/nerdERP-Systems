import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { SalesOrder } from './sales-order.entity';

/**
 * Order Surcharge Entity
 * Tracks service charges, delivery fees, packaging fees, tips, etc.
 * Separate from discounts to maintain clear accounting
 * 
 * Examples:
 * - Service Charge (10% of subtotal)
 * - Delivery Fee (SAR 15.000 flat)
 * - late_night_fee (SAR 5.000 after 11 PM)
 * - Packaging Fee (SAR 2.000 per item)
 */
@Entity('order_surcharges')
export class OrderSurcharge extends AbstractEntity {
    @ManyToOne(() => SalesOrder, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: SalesOrder;

    @Column({ name: 'surcharge_name' })
    surchargeName: string; // 'service_charge', 'delivery_fee', 'packaging_fee'

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    amount: number;

    /**
     * Calculation method: 'percentage' or 'fixed'
     */
    @Column({ name: 'calculation_method' })
    calculationMethod: string;

    /**
     * Rate if percentage-based (e.g., 10 for 10%)
     */
    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    rate: number;

    @Column({ type: 'text', nullable: true })
    description: string;
}
