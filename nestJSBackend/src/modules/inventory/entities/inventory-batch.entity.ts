import { Column, Entity, JoinColumn, ManyToOne, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from './warehouse.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('inventory_batches')
@Index(['product', 'warehouse', 'receivedDate']) // Critical for FIFO performance
export class InventoryBatch extends AbstractEntity {
    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => Warehouse, { nullable: false })
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;

    @Column({
        name: 'qty_remaining',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    qtyRemaining: number;

    @Column({
        name: 'cost_per_unit',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    costPerUnit: number;

    @Column({ name: 'received_date', type: 'timestamp with time zone' })
    receivedDate: Date;

    @Column({ name: 'expiry_date', type: 'timestamp with time zone', nullable: true })
    expiryDate: Date;
}
