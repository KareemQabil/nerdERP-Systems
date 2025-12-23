import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Store } from './store.entity';

export enum ConfigType {
    BOOLEAN = 'BOOLEAN',
    NUMBER = 'NUMBER',
    STRING = 'STRING',
    JSON = 'JSON',
    ENUM = 'ENUM',
}

/**
 * Store Configuration Entity
 * The Rules Engine: Per-store business logic configuration
 * Replaces hardcoded IF statements with UI-driven configuration
 * 
 * Example configurations:
 * - inventory.allow_negative_stock = { enabled: true, threshold: -10 }
 * - sales.require_customer_for_invoice = false
 * - kitchen.auto_print_tickets = true
 * - discounts.max_percentage = 30
 */
@Entity('store_configurations')
@Unique(['store', 'configKey'])
export class StoreConfiguration extends AbstractEntity {
    @ManyToOne(() => Store)
    @JoinColumn({ name: 'store_id' })
    store: Store;

    /**
     * Configuration key in dot notation
     * Examples: 'inventory.allow_negative_stock', 'sales.require_customer_for_invoice'
     */
    @Column({ name: 'config_key' })
    configKey: string;

    /**
     * Configuration value (can be any type based on config_type)
     * Examples:
     * - BOOLEAN: true/false or { enabled: true }
     * - NUMBER: 30 or { min: 0, max: 100 }
     * - JSON: { threshold: -10, alert_on_low: true }
     */
    @Column({ type: 'jsonb', name: 'config_value' })
    configValue: any;

    @Column({ type: 'enum', enum: ConfigType, name: 'config_type' })
    configType: ConfigType;

    /**
     * Category for grouping configurations
     * Examples: 'inventory', 'sales', 'kitchen', 'taxes', 'discounts'
     */
    @Column()
    category: string;

    @Column({ type: 'text', nullable: true })
    description: string;
}
