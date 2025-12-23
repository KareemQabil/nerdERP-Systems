import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * Device Entity
 * Tracks POS terminals and devices
 */
@Entity('devices')
export class Device extends AbstractEntity {
    @Column({ name: 'device_name' })
    deviceName: string;

    @Column({ name: 'device_code', unique: true })
    deviceCode: string;

    @Column({ name: 'device_type' })
    deviceType: string; // 'POS', 'KDS', 'KIOSK', 'MOBILE'

    @Column({ name: 'hardware_id', nullable: true })
    hardwareId: string;

    @Column({ name: 'last_seen_at', type: 'timestamp with time zone', nullable: true })
    lastSeenAt: Date;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'store_id' })
    storeId: string;

    @Column({ type: 'jsonb', nullable: true })
    config: Record<string, any>;
}
