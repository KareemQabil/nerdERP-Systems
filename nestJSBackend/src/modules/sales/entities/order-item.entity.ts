import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { SalesOrder } from './sales-order.entity';
import { Product } from '../../products/entities/product.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('order_items')
export class OrderItem extends AbstractEntity {
    @ManyToOne(() => SalesOrder, (order) => order.items)
    @JoinColumn({ name: 'order_id' })
    order: SalesOrder;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'product_name' })
    productName: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    quantity: number;

    @Column({
        name: 'unit_price', // Price at the moment of sale
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    unitPrice: number;

    @Column({
        name: 'cost_at_sale', // COGS at moment of sale (snapshot)
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    costAtSale: number;

    @Column({
        name: 'tax_amount',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    taxAmount: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    total: number;
}
