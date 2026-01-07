import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { KitchenStation } from './kitchen-station.entity';

export enum TicketStatus {
    NEW = 'NEW',
    IN_PROGRESS = 'IN_PROGRESS',
    READY = 'READY',
    BUMPED = 'BUMPED',
    CANCELLED = 'CANCELLED',
    RECALLED = 'RECALLED',
}

export enum TicketPriority {
    NORMAL = 'NORMAL',
    RUSH = 'RUSH',
    VIP = 'VIP',
}

/**
 * Kitchen Ticket Entity
 * Represents a cooking order sent to a kitchen station
 */
@Entity('kitchen_tickets')
export class KitchenTicket extends AbstractEntity {
    @Column({ name: 'ticket_number' })
    ticketNumber: string;

    @ManyToOne(() => KitchenStation)
    @JoinColumn({ name: 'station_id' })
    station: KitchenStation;

    @Column({ name: 'order_id' })
    orderId: string;

    @Column({ name: 'order_number' })
    orderNumber: string;

    @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.NEW })
    status: TicketStatus;

    @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.NORMAL })
    priority: TicketPriority;

    @Column({ name: 'sent_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    sentAt: Date;

    @Column({ name: 'started_at', type: 'timestamp with time zone', nullable: true })
    startedAt: Date;

    @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
    completedAt: Date;

    @Column({ name: 'bumped_at', type: 'timestamp with time zone', nullable: true })
    bumpedAt: Date;

    @Column({ name: 'bumped_by_user_id', nullable: true })
    bumpedByUserId: string;

    /**
     * Preparation time in seconds
     */
    @Column({ name: 'prep_time_seconds', nullable: true })
    prepTimeSeconds: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ name: 'recalled_at', type: 'timestamp with time zone', nullable: true })
    recalledAt: Date;

    @Column({ name: 'recall_reason', type: 'text', nullable: true })
    recallReason: string;

    @Column({ name: 'is_modified', default: false })
    isModified: boolean;

    @OneToMany(() => KitchenTicketItem, (item) => item.ticket, { cascade: true })
    items: KitchenTicketItem[];
}

/**
 * Kitchen Ticket Item Entity
 * Individual items on a kitchen ticket
 */
@Entity('kitchen_ticket_items')
export class KitchenTicketItem extends AbstractEntity {
    @ManyToOne(() => KitchenTicket, (ticket) => ticket.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ticket_id' })
    ticket: KitchenTicket;

    @Column({ name: 'order_item_id' })
    orderItemId: string;

    @Column({ name: 'product_id' })
    productId: string;

    @Column({ name: 'product_name' })
    productName: string;

    @Column({ type: 'decimal', precision: 10, scale: 3 })
    quantity: number;

    /**
     * Modifiers applied to this item
     * Example: ['No Onions', 'Extra Cheese', 'Well Done']
     */
    @Column({ type: 'jsonb', nullable: true })
    modifiers: string[];

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ name: 'is_prepared', default: false })
    isPrepared: boolean;

    @Column({ name: 'prepared_at', type: 'timestamp with time zone', nullable: true })
    preparedAt: Date;

    @Column({ name: 'is_added', default: false })
    isAdded: boolean;

    @Column({ name: 'is_modified', default: false })
    isModified: boolean;

    @Column({ name: 'is_voided', default: false })
    isVoided: boolean;

    @Column({ name: 'voided_at', type: 'timestamp with time zone', nullable: true })
    voidedAt: Date;

    @Column({ name: 'void_reason', type: 'text', nullable: true })
    voidReason: string;
}
