import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DecimalTransformer } from '../../../common/transformers/decimal.transformer';

/**
 * Customer Entity
 * Customer profiles with loyalty integration
 */
@Entity('customers')
export class Customer extends AbstractEntity {
    @Column({ name: 'customer_code', unique: true, nullable: true })
    customerCode: string;

    @Column({ name: 'first_name' })
    firstName: string;

    @Column({ name: 'last_name', nullable: true })
    lastName: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ name: 'date_of_birth', type: 'date', nullable: true })
    dateOfBirth: Date;

    @Column({ nullable: true })
    gender: string;

    @Column({ name: 'loyalty_tier_id', nullable: true })
    loyaltyTierId: string;

    @Column({ name: 'total_points', default: 0 })
    totalPoints: number;

    @Column({ name: 'available_points', default: 0 })
    availablePoints: number;

    @Column({
        name: 'lifetime_spend',
        type: 'decimal',
        precision: 10,
        scale: 3,
        transformer: new DecimalTransformer(),
        default: 0,
    })
    lifetimeSpend: number;

    @Column({ name: 'order_count', default: 0 })
    orderCount: number;

    @Column({ name: 'last_visit_date', type: 'timestamp with time zone', nullable: true })
    lastVisitDate: Date;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    tags: string[];

    @Column({ type: 'text', nullable: true })
    notes: string;

    @OneToMany(() => CustomerAddress, (address) => address.customer, { cascade: true })
    addresses: CustomerAddress[];
}

/**
 * Customer Address Entity
 * Delivery addresses for customers
 */
@Entity('customer_addresses')
export class CustomerAddress extends AbstractEntity {
    @Column({ name: 'customer_id' })
    customerId: string;

    customer: Customer;

    @Column({ name: 'address_label', nullable: true })
    addressLabel: string; // 'Home', 'Work', etc.

    @Column({ name: 'street_address' })
    streetAddress: string;

    @Column({ nullable: true })
    district: string;

    @Column()
    city: string;

    @Column({ name: 'postal_code', nullable: true })
    postalCode: string;

    @Column({ nullable: true })
    country: string;

    @Column({ type: 'jsonb', nullable: true })
    coordinates: { lat: number; lng: number };

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

    @Column({ name: 'delivery_instructions', type: 'text', nullable: true })
    deliveryInstructions: string;
}
