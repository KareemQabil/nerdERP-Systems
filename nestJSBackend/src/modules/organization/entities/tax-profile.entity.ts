import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * Tax Profile Entity
 * Groups tax definitions for application to products/orders
 */
@Entity('tax_profiles')
export class TaxProfile extends AbstractEntity {
    @Column({ name: 'profile_name' })
    profileName: string;

    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { name: string }>;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ type: 'jsonb', nullable: true, name: 'applies_to_stores' })
    appliesToStores: string[];

    @OneToMany(() => TaxDefinition, (def) => def.taxProfile, { cascade: true })
    taxDefinitions: TaxDefinition[];
}

export enum TaxCalculationType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED',
    COMPOUND = 'COMPOUND', // Tax on tax
}

/**
 * Tax Definition Entity
 * Individual tax rates within a profile (VAT, CGST, SGST, etc.)
 */
@Entity('tax_definitions')
export class TaxDefinition extends AbstractEntity {
    @Column({ name: 'tax_profile_id' })
    taxProfileId: string;

    taxProfile: TaxProfile;

    @Column({ name: 'tax_name' })
    taxName: string;

    @Column({ name: 'tax_code' })
    taxCode: string; // 'VAT', 'CGST', 'SGST', 'STATE_TAX'

    @Column({ type: 'enum', enum: TaxCalculationType, name: 'calculation_type' })
    calculationType: TaxCalculationType;

    @Column({
        name: 'tax_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    taxRate: number;

    @Column({ name: 'is_inclusive', default: false })
    isInclusive: boolean;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    /**
     * For compound taxes - which tax to calculate on
     */
    @Column({ name: 'compound_on_tax_id', nullable: true })
    compoundOnTaxId: string;

    @Column({ name: 'jurisdiction_code', nullable: true })
    jurisdictionCode: string;
}
