import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * Organization Entity
 * Represents the top-level business entity (replaces multi-tenant concept)
 * Single-tenant installation will have one organization
 */
@Entity('organizations')
export class Organization extends AbstractEntity {
    @Column({ name: 'legal_name' })
    legalName: string;

    @Column({ name: 'tax_id' })
    taxId: string;

    @Column({ name: 'country_code', length: 2 })
    countryCode: string; // ISO 3166-1 (SA, US, AE, etc.)

    @Column({ name: 'base_currency', length: 3, default: 'SAR' })
    baseCurrency: string; // ISO 4217 (SAR, USD, EUR, etc.)

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
}
