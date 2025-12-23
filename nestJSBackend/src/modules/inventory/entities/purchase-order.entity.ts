import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';
import { Supplier } from './supplier.entity';
import { Warehouse } from './warehouse.entity';

export enum PurchaseOrderStatus {
    DRAFT = 'DRAFT',
    SENT = 'SENT',
    PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
    RECEIVED = 'RECEIVED',
    CANCELLED = 'CANCELLED',
}

/**
 * Purchase Order Entity
 * Manages procurement from suppliers with receiving workflow
 * 
 * Workflow:
 * 1. DRAFT - Created, not yet sent to supplier
 * 2. SENT - Sent to supplier, awaiting delivery
 * 3. PARTIALLY_RECEIVED - Some items received
 * 4. RECEIVED - All items received
 */
@Entity('purchase_orders')
export class PurchaseOrder extends AbstractEntity {
    @Column({ name: 'po_number', unique: true })
    poNumber: string;

    @ManyToOne(() => Supplier, { nullable: false })
    @JoinColumn({ name: 'supplier_id' })
    supplier: Supplier;

    @ManyToOne(() => Warehouse, { nullable: false })
    @JoinColumn({ name: 'receiving_warehouse_id' })
    receivingWarehouse: Warehouse;

    @Column({
        type: 'enum',
        enum: PurchaseOrderStatus,
        default: PurchaseOrderStatus.DRAFT,
    })
    status: PurchaseOrderStatus;

    @Column({
        name: 'total_amount',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    totalAmount: number;

    @Column({ name: 'expected_delivery_date', type: 'timestamp with time zone', nullable: true })
    expectedDeliveryDate: Date;

    @Column({ name: 'created_by_user_id' })
    createdByUserId: string;

    @Column({ name: 'sent_at', type: 'timestamp with time zone', nullable: true })
    sentAt: Date;

    @Column({ name: 'received_at', type: 'timestamp with time zone', nullable: true })
    receivedAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, { cascade: true })
    items: PurchaseOrderItem[];
}

/**
 * Purchase Order Item Entity
 * Individual line items in a purchase order
 */
@Entity('purchase_order_items')
export class PurchaseOrderItem extends AbstractEntity {
    @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'purchase_order_id' })
    purchaseOrder: PurchaseOrder;

    @Column({ name: 'product_id' })
    productId: string;

    @Column({ name: 'product_name' })
    productName: string;

    @Column({
        name: 'quantity_ordered',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    quantityOrdered: number;

    @Column({
        name: 'quantity_received',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    quantityReceived: number;

    @Column({
        name: 'unit_cost',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    unitCost: number;

    @Column({
        name: 'line_total',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    lineTotal: number;

    @Column({ nullable: true })
    unit: string; // 'PIECE', 'CASE', 'KG'
}
