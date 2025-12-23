import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * Webhook Entity
 * Outbound webhook configurations
 */
@Entity('webhooks')
export class Webhook extends AbstractEntity {
    @Column()
    name: string;

    @Column()
    url: string;

    @Column({ type: 'jsonb', nullable: true })
    headers: Record<string, string>;

    @Column({ name: 'hmac_secret', nullable: true })
    hmacSecret: string;

    /**
     * Events that trigger this webhook
     * Example: ['order.created', 'order.completed', 'payment.received']
     */
    @Column({ type: 'jsonb' })
    events: string[];

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'retry_count', default: 3 })
    retryCount: number;

    @Column({ name: 'store_id', nullable: true })
    storeId: string; // null = all stores

    @OneToMany(() => WebhookLog, (log) => log.webhook)
    logs: WebhookLog[];
}

export enum WebhookLogStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    RETRYING = 'RETRYING',
}

/**
 * Webhook Log Entity
 * Tracks all webhook delivery attempts
 */
@Entity('webhook_logs')
export class WebhookLog extends AbstractEntity {
    @Column({ name: 'webhook_id' })
    webhookId: string;

    webhook: Webhook;

    @Column({ name: 'event_type' })
    eventType: string;

    @Column({ type: 'jsonb' })
    payload: Record<string, any>;

    @Column({ type: 'enum', enum: WebhookLogStatus, default: WebhookLogStatus.PENDING })
    status: WebhookLogStatus;

    @Column({ name: 'http_status', nullable: true })
    httpStatus: number;

    @Column({ type: 'text', nullable: true })
    response: string;

    @Column({ name: 'attempt_count', default: 0 })
    attemptCount: number;

    @Column({ name: 'last_attempt_at', type: 'timestamp with time zone', nullable: true })
    lastAttemptAt: Date;

    @Column({ name: 'next_retry_at', type: 'timestamp with time zone', nullable: true })
    nextRetryAt: Date;
}
