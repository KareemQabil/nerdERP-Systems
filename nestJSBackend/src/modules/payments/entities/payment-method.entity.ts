import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

export enum PaymentMethodType {
    CASH = 'CASH',
    CARD = 'CARD',
    GIFT_CARD = 'GIFT_CARD',
    LOYALTY_POINTS = 'LOYALTY_POINTS',
    BANK_TRANSFER = 'BANK_TRANSFER',
    MADA = 'MADA',
    APPLE_PAY = 'APPLE_PAY',
    STCPAY = 'STCPAY',
}

/**
 * Payment Method Entity
 * Tenant-configurable payment types replacing hardcoded enums
 */
@Entity('payment_methods')
export class PaymentMethod extends AbstractEntity {
    @Column({ name: 'method_name' })
    methodName: string;

    @Column({ name: 'method_code', unique: true })
    methodCode: string;

    @Column({ type: 'enum', enum: PaymentMethodType, name: 'method_type' })
    methodType: PaymentMethodType;

    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { name: string }>;

    @Column({ nullable: true })
    icon: string;

    /**
     * Gateway config for card payments
     */
    @Column({ type: 'jsonb', nullable: true, name: 'gateway_config' })
    gatewayConfig: {
        provider?: string; // 'stripe', 'paytabs', 'hyperpay'
        api_key?: string;
        merchant_id?: string;
        test_mode?: boolean;
    };

    @Column({ name: 'requires_reference', default: false })
    requiresReference: boolean; // e.g., bank transfer needs ref number

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ type: 'jsonb', nullable: true, name: 'applies_to_stores' })
    appliesToStores: string[];
}
