import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * Table Zone Entity
 * Groups tables by area (Indoor, Outdoor, VIP, Bar)
 */
@Entity('table_zones')
export class TableZone extends AbstractEntity {
    @Column({ name: 'zone_name' })
    zoneName: string;

    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { name: string }>;

    @Column({ nullable: true })
    color: string;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'store_id' })
    storeId: string;
}

export enum TableStatus {
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED',
    RESERVED = 'RESERVED',
    CLEANING = 'CLEANING',
    BLOCKED = 'BLOCKED',
}

/**
 * Table Entity
 * Physical tables with floor plan coordinates and QR codes
 */
@Entity('tables')
export class Table extends AbstractEntity {
    @Column({ name: 'table_number' })
    tableNumber: string;

    @ManyToOne(() => TableZone, { nullable: true })
    @JoinColumn({ name: 'zone_id' })
    zone: TableZone;

    @Column({ type: 'enum', enum: TableStatus, default: TableStatus.AVAILABLE })
    status: TableStatus;

    @Column({ name: 'min_seats', default: 1 })
    minSeats: number;

    @Column({ name: 'max_seats', default: 4 })
    maxSeats: number;

    /**
     * Floor plan coordinates for table map display
     */
    @Column({ type: 'jsonb', nullable: true, name: 'floor_position' })
    floorPosition: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation?: number;
        shape?: 'rectangle' | 'circle' | 'oval';
    };

    @Column({ name: 'qr_code', unique: true, nullable: true })
    qrCode: string;

    @Column({ name: 'current_order_id', nullable: true })
    currentOrderId: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'store_id' })
    storeId: string;
}
