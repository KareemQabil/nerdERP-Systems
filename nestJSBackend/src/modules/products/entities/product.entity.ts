import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { ProductCategory } from './product-category.entity';

export enum ProductType {
    STANDARD = 'STANDARD',
    SERVICE = 'SERVICE',
    COMBO = 'COMBO',
}

@Entity('products')
export class Product extends AbstractEntity {
    @Column({ unique: true })
    sku: string;

    @Column({ unique: true, nullable: true })
    barcode: string;

    @Column()
    name: string;

    @Column({ name: 'name_ar', nullable: true })
    nameAr: string;

    @Column({
        type: 'enum',
        enum: ProductType,
        default: ProductType.STANDARD,
    })
    type: ProductType;

    @Column({ name: 'track_inventory', default: true })
    trackInventory: boolean;

    @Column({
        name: 'sale_price',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    salePrice: number;

    @Column({
        name: 'cost_price',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    costPrice: number;

    @ManyToOne(() => ProductCategory, (category) => category.products, {
        nullable: true,
    })
    @JoinColumn({ name: 'category_id' })
    category: ProductCategory;
}
