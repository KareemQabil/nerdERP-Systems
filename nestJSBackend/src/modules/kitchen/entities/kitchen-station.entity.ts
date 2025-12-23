import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * Kitchen Station Entity
 * Represents physical cooking/preparation stations (Grill, Fryer, Drinks)
 * Products are routed to stations for ticket printing
 */
@Entity('kitchen_stations')
export class KitchenStation extends AbstractEntity {
    @Column({ name: 'station_name' })
    stationName: string;

    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { name: string }>;

    @Column({ name: 'station_code', unique: true })
    stationCode: string; // 'GRILL', 'FRYER', 'BAR', 'PIZZA'

    @Column({ nullable: true })
    color: string;

    @Column({ nullable: true })
    icon: string;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'store_id' })
    storeId: string;

    /**
     * Default printer for this station
     */
    @Column({ name: 'printer_id', nullable: true })
    printerId: string;

    /**
     * KDS display configuration
     */
    @Column({ type: 'jsonb', nullable: true, name: 'kds_config' })
    kdsConfig: {
        auto_bump_seconds?: number;
        alert_threshold_seconds?: number;
        sound_enabled?: boolean;
    };
}
