import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Product } from '../../products/entities/product.entity';

/**
 * Unit Conversion Entity
 * Allows products to be purchased in one unit and sold in another
 * 
 * Examples:
 * - Buy cases (12 units), sell pieces: factor = 12
 * - Buy kg, sell grams: factor = 1000
 * - Buy liters, sell ml: factor = 1000
 */
@Entity('unit_conversions')
@Unique(['product', 'fromUnit', 'toUnit'])
export class UnitConversion extends AbstractEntity {
    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'from_unit' })
    fromUnit: string; // 'CASE', 'KG', 'LITER', 'BOX'

    @Column({ name: 'to_unit' })
    toUnit: string; // 'PIECE', 'GRAM', 'ML', 'UNIT'

    @Column({
        name: 'conversion_factor',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    conversionFactor: number; // How many toUnit in one fromUnit

    @Column({ name: 'is_default_purchase', default: false })
    isDefaultPurchase: boolean; // Default unit for purchasing

    @Column({ name: 'is_default_sale', default: false })
    isDefaultSale: boolean; // Default unit for selling
}
