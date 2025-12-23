import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { SalesOrder } from './sales-order.entity';

/**
 * Order Tax Entity
 * Detailed tax breakdown per order  
 * Supports multi-rate taxes (VAT, service tax, local tax, etc.)
 * 
 * Examples:
 * Saudi Arabia: VAT 15%
 * India: CGST 9% + SGST 9%
 * US: State Tax 6% + Local Tax 2%
 */
@Entity('order_taxes')
export class OrderTax extends AbstractEntity {
    @ManyToOne(() => SalesOrder, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: SalesOrder;

    @Column({ name: 'tax_name' })
    taxName: string; // 'VAT', 'CGST', 'SGST', 'STATE_TAX'

    @Column({
        name: 'tax_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    taxRate: number; // 15.00 for 15%

    @Column({
        name: 'taxable_amount',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    taxableAmount: number; // Amount on which tax is calculated

    @Column({
        name: 'tax_amount',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    taxAmount: number; // Calculated tax amount

    @Column({ name: 'is_inclusive', default: false })
    isInclusive: boolean; // Tax included in price or added on top

    /**
     * Tax authority/jurisdiction code
     * Example: 'SA-VAT', 'IN-CGST', 'US-CA-STATE'
     */
    @Column({ name: 'jurisdiction_code', nullable: true })
    jurisdictionCode: string;
}
