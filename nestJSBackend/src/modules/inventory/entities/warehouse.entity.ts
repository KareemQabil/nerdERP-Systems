import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { InventoryBatch } from './inventory-batch.entity';
import { StockMove } from './stock-move.entity';

@Entity('warehouses')
export class Warehouse extends AbstractEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    location: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => InventoryBatch, (batch) => batch.warehouse)
    batches: InventoryBatch[];

    @OneToMany(() => StockMove, (move) => move.warehouse)
    stockMoves: StockMove[];
}
