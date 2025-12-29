import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Product } from '../../products/entities/product.entity';
import { Warehouse } from './warehouse.entity';

/**
 * Temporary stock reservation during checkout
 * Prevents overselling - holds stock for 5 minutes
 * Auto-released if payment not completed
 */
@Entity('stock_reservations')
export class StockReservation extends AbstractEntity {
    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'product_id' })
    productId: string;

    @ManyToOne(() => Warehouse)
    @JoinColumn({ name: 'warehouse_id' })
    warehouse: Warehouse;

    @Column({ name: 'warehouse_id' })
    warehouseId: string;

    @Column({ type: 'decimal', precision: 10, scale: 3 })
    quantity: number;

    @Column({ name: 'session_id' })
    sessionId: string;

    @Column({ name: 'expires_at', type: 'timestamp with time zone' })
    expiresAt: Date;

    @Column({ default: false, name: 'is_released' })
    isReleased: boolean;
}
