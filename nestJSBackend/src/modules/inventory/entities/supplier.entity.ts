import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * Supplier Entity
 * Manages vendor/supplier information for procurement
 */
@Entity('suppliers')
export class Supplier extends AbstractEntity {
    @Column({ name: 'supplier_code', unique: true })
    supplierCode: string;

    @Column({ name: 'supplier_name' })
    supplierName: string;

    @Column({ name: 'contact_person', nullable: true })
    contactPerson: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ type: 'jsonb', nullable: true })
    address: {
        street: string;
        city: string;
        postalCode?: string;
        country: string;
    };

    @Column({ name: 'tax_id', nullable: true })
    taxId: string;

    @Column({ name: 'payment_terms', nullable: true })
    paymentTerms: string; // 'NET30', 'NET60', 'COD'

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
}
