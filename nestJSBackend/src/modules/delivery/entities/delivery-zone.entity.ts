/**
 * Delivery Zone Entity
 * H-POS: Zone-based delivery pricing
 * Each zone has a name, minimum order value, and delivery fee
 */
import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('delivery_zones')
export class DeliveryZone extends AbstractEntity {
    /**
     * Zone display name (e.g., "Zone A - Downtown", "Zone B - Suburbs")
     */
    @Column({ name: 'zone_name' })
    zoneName: string;

    /**
     * Bilingual translations for zone name
     */
    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { name: string }>;

    /**
     * Zone code for quick reference (e.g., "A", "B", "DOWNTOWN")
     */
    @Column({ name: 'zone_code', unique: true })
    zoneCode: string;

    /**
     * Delivery fee for this zone (in SAR/EGP/etc)
     */
    @Column({
        name: 'delivery_fee',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
    })
    deliveryFee: number;

    /**
     * Minimum order value for free delivery (null = no free delivery)
     */
    @Column({
        name: 'free_delivery_minimum',
        type: 'decimal',
        precision: 10,
        scale: 3,
        nullable: true,
        transformer: new DecimalTransformer(),
    })
    freeDeliveryMinimum: number;

    /**
     * Minimum order value to place a delivery order
     */
    @Column({
        name: 'minimum_order_value',
        type: 'decimal',
        precision: 10,
        scale: 3,
        nullable: true,
        transformer: new DecimalTransformer(),
    })
    minimumOrderValue: number;

    /**
     * Estimated delivery time in minutes (e.g., 30, 45, 60)
     */
    @Column({ name: 'estimated_delivery_minutes', nullable: true })
    estimatedDeliveryMinutes: number;

    /**
     * Polygon coordinates for map-based zone selection (optional)
     */
    @Column({ type: 'jsonb', nullable: true })
    polygon: { lat: number; lng: number }[];

    /**
     * Display order in UI
     */
    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    /**
     * Zone color for UI display
     */
    @Column({ nullable: true })
    color: string;

    /**
     * Whether this zone is currently active
     */
    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    /**
     * Store ID this zone belongs to
     */
    @Column({ name: 'store_id' })
    storeId: string;
}
