import {
    Column,
    Entity,
    Tree,
    TreeChildren,
    TreeParent,
    OneToMany,
} from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from './product.entity';

@Entity('product_categories')
@Tree('materialized-path')
export class ProductCategory extends AbstractEntity {
    @Column()
    name: string;

    @Column({ name: 'name_ar', nullable: true })
    nameAr: string;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ name: 'color_hex', nullable: true })
    colorHex: string;

    @TreeParent()
    parent: ProductCategory;

    @TreeChildren()
    children: ProductCategory[];

    @OneToMany(() => Product, (product) => product.category)
    products: Product[];
}
