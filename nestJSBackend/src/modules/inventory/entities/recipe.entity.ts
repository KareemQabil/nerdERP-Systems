import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('recipes')
export class Recipe extends AbstractEntity {
    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: 'product_id' })
    product: Product; // The composed product (e.g. Burger)

    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: 'ingredient_id' })
    ingredient: Product; // The raw item (e.g. Bun)

    @Column({
        name: 'quantity_required',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    quantityRequired: number;
}
