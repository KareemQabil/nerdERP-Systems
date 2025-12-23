import { Entity, Column, Unique } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

export enum EntityType {
    PRODUCT = 'PRODUCT',
    ORDER = 'ORDER',
    CUSTOMER = 'CUSTOMER',
    EMPLOYEE = 'EMPLOYEE',
    INVENTORY_BATCH = 'INVENTORY_BATCH',
}

export enum FieldType {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    DATE = 'DATE',
    BOOLEAN = 'BOOLEAN',
    SELECT = 'SELECT',
    MULTI_SELECT = 'MULTI_SELECT',
    FILE = 'FILE',
}

/**
 * Custom Field Definition Entity
 * Allows tenants to extend entity schemas without code changes
 * Power users can add custom fields via UI
 * 
 * Example: Add "Spice Level" field to products:
 * {
 *   entityType: 'PRODUCT',
 *   fieldKey: 'spice_level',
 *   fieldLabel: { en: 'Spice Level', ar: 'مستوى الحار' },
 *   fieldType: 'SELECT',
 *   fieldOptions: ['Mild', 'Medium', 'Hot'],
 *   validationRules: { required: true }
 * }
 */
@Entity('custom_field_definitions')
@Unique(['entityType', 'fieldKey'])
export class CustomFieldDefinition extends AbstractEntity {
    @Column({ type: 'enum', enum: EntityType, name: 'entity_type' })
    entityType: EntityType;

    /**
     * Unique key for this field (used in metadata storage)
     * Example: 'spice_level', 'allergens', 'origin_country'
     */
    @Column({ name: 'field_key' })
    fieldKey: string;

    /**
     * Multi-language labels
     * Example: { en: 'Spice Level', ar: 'مستوى الحار', fr: 'Niveau de piment' }
     */
    @Column({ type: 'jsonb', name: 'field_label' })
    fieldLabel: Record<string, string>;

    @Column({ type: 'enum', enum: FieldType, name: 'field_type' })
    fieldType: FieldType;

    /**
     * Options for SELECT and MULTI_SELECT types
     * Example: ['Mild', 'Medium', 'Hot', 'Extra Hot']
     */
    @Column({ type: 'jsonb', nullable: true, name: 'field_options' })
    fieldOptions: string[];

    /**
     * Validation rules (JSON schema-like)
     * Example: { required: true, min: 1, max: 5, pattern: '^[A-Z]{2}$' }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'validation_rules' })
    validationRules: {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: string;
        [key: string]: any;
    };

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    /**
     * Store IDs where this field applies (null = all stores)
     * Example: ['store-uuid-1', 'store-uuid-2']
     */
    @Column({ type: 'jsonb', nullable: true, name: 'applies_to_stores' })
    appliesToStores: string[];
}
