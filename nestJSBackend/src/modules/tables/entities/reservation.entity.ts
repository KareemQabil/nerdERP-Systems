import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Table } from './table.entity';

export enum ReservationStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    SEATED = 'SEATED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

/**
 * Reservation Entity
 * Table reservations with workflow support
 */
@Entity('reservations')
export class Reservation extends AbstractEntity {
    @Column({ name: 'reservation_number', unique: true })
    reservationNumber: string;

    @ManyToOne(() => Table, { nullable: true })
    @JoinColumn({ name: 'table_id' })
    table: Table;

    @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING })
    status: ReservationStatus;

    @Column({ name: 'customer_name' })
    customerName: string;

    @Column({ name: 'customer_phone', nullable: true })
    customerPhone: string;

    @Column({ name: 'customer_email', nullable: true })
    customerEmail: string;

    @Column({ name: 'customer_id', nullable: true })
    customerId: string;

    @Column({ name: 'party_size' })
    partySize: number;

    @Column({ name: 'reservation_date', type: 'date' })
    reservationDate: Date;

    @Column({ name: 'reservation_time', type: 'time' })
    reservationTime: string;

    @Column({ name: 'duration_minutes', default: 90 })
    durationMinutes: number;

    @Column({ name: 'deposit_amount', type: 'decimal', precision: 10, scale: 3, nullable: true })
    depositAmount: number;

    @Column({ name: 'deposit_paid', default: false })
    depositPaid: boolean;

    @Column({ name: 'confirmed_at', type: 'timestamp with time zone', nullable: true })
    confirmedAt: Date;

    @Column({ name: 'seated_at', type: 'timestamp with time zone', nullable: true })
    seatedAt: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ name: 'special_requests', type: 'text', nullable: true })
    specialRequests: string;

    @Column({ name: 'store_id' })
    storeId: string;
}
