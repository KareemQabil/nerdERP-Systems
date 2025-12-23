import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Warehouse } from './warehouse.entity';

export enum TransferStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    IN_TRANSIT = 'IN_TRANSIT',
    RECEIVED = 'RECEIVED',
    CANCELLED = 'CANCELLED',
}

/**
 * Stock Transfer Entity
 * Manages inventory movement between warehouses/stores
 * 
 * Workflow:
 * 1. DRAFT - Created, not yet approved
 * 2. PENDING - Approved, waiting for shipment
 * 3. IN_TRANSIT - Items picked and shipped
 * 4. RECEIVED - Items received at destination
 */
@Entity('stock_transfers')
export class StockTransfer extends AbstractEntity {
    @Column({ name: 'transfer_number', unique: true })
    transferNumber: string;

    @ManyToOne(() => Warehouse, { nullable: false })
    @JoinColumn({ name: 'from_warehouse_id' })
    fromWarehouse: Warehouse;

    @ManyToOne(() => Warehouse, { nullable: false })
    @JoinColumn({ name: 'to_warehouse_id' })
    toWarehouse: Warehouse;

    @Column({
        type: 'enum',
        enum: TransferStatus,
        default: TransferStatus.DRAFT,
    })
    status: TransferStatus;

    @Column({ name: 'requested_by_user_id' })
    requestedByUserId: string;

    @Column({ name: 'requested_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    requestedAt: Date;

    @Column({ name: 'approved_by_user_id', nullable: true })
    approvedByUserId: string;

    @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
    approvedAt: Date;

    @Column({ name: 'shipped_at', type: 'timestamp with time zone', nullable: true })
    shippedAt: Date;

    @Column({ name: 'received_at', type: 'timestamp with time zone', nullable: true })
    receivedAt: Date;

    @Column({ name: 'received_by_user_id', nullable: true })
    receivedByUserId: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @OneToMany(() => StockTransferItem, (item) => item.transfer, { cascade: true })
    items: StockTransferItem[];
}

/**
 * Stock Transfer Item Entity
 * Individual line items in a stock transfer
 */
@Entity('stock_transfer_items')
export class StockTransferItem extends AbstractEntity {
    @ManyToOne(() => StockTransfer, (transfer) => transfer.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'transfer_id' })
    transfer: StockTransfer;

    @Column({ name: 'product_id' })
    productId: string;

    @Column({ name: 'product_name' })
    productName: string;

    @Column({
        name: 'quantity_requested',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    quantityRequested: number;

    @Column({
        name: 'quantity_shipped',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    quantityShipped: number;

    @Column({
        name: 'quantity_received',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        nullable: true,
    })
    quantityReceived: number;

    @Column({ type: 'text', nullable: true })
    notes: string;
}
