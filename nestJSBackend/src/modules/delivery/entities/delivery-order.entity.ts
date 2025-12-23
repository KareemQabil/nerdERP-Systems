import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * Delivery Provider Entity
 * Integration configuration for platforms (Hungerstation, Careem, Jahez)
 */
@Entity('delivery_providers')
export class DeliveryProvider extends AbstractEntity {
    @Column({ name: 'provider_name' })
    providerName: string;

    @Column({ name: 'provider_code', unique: true })
    providerCode: string; // 'HUNGERSTATION', 'CAREEM', 'JAHEZ'

    @Column({ type: 'jsonb', name: 'api_config' })
    apiConfig: {
        base_url: string;
        api_key?: string;
        api_secret?: string;
        webhook_secret?: string;
    };

    @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
    commissionRate: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'store_id' })
    storeId: string;
}

export enum DeliveryOrderStatus {
    RECEIVED = 'RECEIVED',
    ACCEPTED = 'ACCEPTED',
    PREPARING = 'PREPARING',
    READY_FOR_PICKUP = 'READY_FOR_PICKUP',
    PICKED_UP = 'PICKED_UP',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

/**
 * Delivery Order Entity
 * External delivery orders from platforms
 */
@Entity('delivery_orders')
export class DeliveryOrder extends AbstractEntity {
    @Column({ name: 'external_order_id', unique: true })
    externalOrderId: string;

    @Column({ name: 'provider_id' })
    providerId: string;

    @Column({ name: 'internal_order_id', nullable: true })
    internalOrderId: string; // Link to our SalesOrder

    @Column({ type: 'enum', enum: DeliveryOrderStatus, default: DeliveryOrderStatus.RECEIVED })
    status: DeliveryOrderStatus;

    @Column({ type: 'jsonb', name: 'customer_info' })
    customerInfo: {
        name: string;
        phone: string;
        address: string;
        coordinates?: { lat: number; lng: number };
    };

    @Column({ type: 'jsonb', name: 'order_data' })
    orderData: Record<string, any>; // Full order payload from provider

    @Column({ type: 'decimal', precision: 10, scale: 3, name: 'order_total' })
    orderTotal: number;

    @Column({ name: 'received_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
    receivedAt: Date;

    @Column({ name: 'accepted_at', type: 'timestamp with time zone', nullable: true })
    acceptedAt: Date;

    @Column({ name: 'delivered_at', type: 'timestamp with time zone', nullable: true })
    deliveredAt: Date;

    @Column({ name: 'store_id' })
    storeId: string;
}
