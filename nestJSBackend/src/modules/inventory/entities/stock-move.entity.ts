import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from './warehouse.entity';
import { InventoryBatch } from './inventory-batch.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

export enum StockMoveType {
    IN = 'IN',
    OUT = 'OUT',
    ADJ = 'ADJ',
}

export enum StockReferenceType {
    SALE = 'SALE',
    PURCHASE_ORDER = 'PO',
    MANUAL = 'MANUAL',
    WASTE = 'WASTE',
    RECIPE = 'RECIPE',
}

@Entity('stock_moves')
export class StockMove extends AbstractEntity {
    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => Warehouse, { nullable: false })
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;

    @ManyToOne(() => InventoryBatch, { nullable: true })
    @JoinColumn({ name: 'batch_id' })
    batch: InventoryBatch;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    quantity: number;

    @Column({
        name: 'move_type',
        type: 'enum',
        enum: StockMoveType,
    })
    moveType: StockMoveType;

    @Column({
        name: 'reference_type',
        type: 'enum',
        enum: StockReferenceType,
    })
    referenceType: StockReferenceType;

    @Column({ name: 'reference_id', nullable: true })
    referenceId: string;

    @Column({
        name: 'cost_per_unit',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    costPerUnit: number;
}
