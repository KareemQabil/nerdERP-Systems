import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Organization } from './organization.entity';

export enum StoreType {
    RESTAURANT = 'RESTAURANT',
    CAFE = 'CAFE',
    RETAIL = 'RETAIL',
    GROCERY = 'GROCERY',
    FOOD_TRUCK = 'FOOD_TRUCK',
    KIOSK = 'KIOSK',
    WAREHOUSE = 'WAREHOUSE',
    DARK_KITCHEN = 'DARK_KITCHEN',
}

/**
 * Store Entity
 * Represents physical or virtual locations under an organization
 * Supports hierarchical structure via parent_store_id
 */
@Entity('stores')
export class Store extends AbstractEntity {
    @ManyToOne(() => Organization)
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'store_code', unique: true })
    storeCode: string;

    @Column({ type: 'enum', enum: StoreType, name: 'store_type' })
    storeType: StoreType;

    /**
     * Multi-language translations
     * Example: { en: { name: 'Main Branch', description: 'Downtown location' }, ar: { name: 'الفرع الرئيسي' } }
     */
    @Column({ type: 'jsonb' })
    translations: Record<string, { name: string; description?: string }>;

    @Column({ default: 'Asia/Riyadh' })
    timezone: string;

    /**
     * Address information
     * Example: { street: '123 King Fahd Rd', city: 'Riyadh', country: 'SA', lat: 24.7136, lng: 46.6753 }
     */
    @Column({ type: 'jsonb' })
    address: {
        street: string;
        city: string;
        postalCode?: string;
        country: string;
        lat?: number;
        lng?: number;
    };

    @Column({ type: 'jsonb', nullable: true })
    contact: {
        phone?: string;
        email?: string;
        whatsapp?: string;
    };

    /**
     * Operating hours configuration
     * Example: { mon: ['09:00-22:00'], tue: ['09:00-22:00'], breaks: ['13:00-14:00'] }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'operating_hours' })
    operatingHours: {
        [key: string]: string[];
    };

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    /**
     * Hierarchical stores support
     * Allows creating parent-child store relationships
     */
    @ManyToOne(() => Store, { nullable: true })
    @JoinColumn({ name: 'parent_store_id' })
    parentStore: Store;

    /**
     * Custom fields storage
     * Can be used to store tenant-specific data defined via CustomFieldDefinition
     */
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
}
