import { Entity, Column, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * =============================================================================
 * PRINT JOB ENTITY (ENHANCED)
 * =============================================================================
 *
 * Tracks print jobs sent to network printers with status,
 * retry logic, priority queue handling, and error tracking.
 *
 * Features:
 * - Priority-based queue ordering
 * - Station-to-printer routing
 * - Automatic fallover to backup printers
 * - Auto-escalation for long-waiting jobs
 * - Comprehensive error tracking
 *
 * Priority Levels:
 * - 1: EMERGENCY (highest priority)
 * - 2: EXPEDITE (rush orders)
 * - 3: NORMAL (default)
 * - 4: REPRINT
 * - 5: TEST (lowest priority)
 */
@Entity('print_jobs')
@Index(['printerId', 'status'])
@Index(['priorityLevel', 'createdAt'])
@Index(['orderId'])
@Index(['stationId'])
export class PrintJob extends AbstractEntity {

    @Column({ name: 'printer_id' })
    printerId: string;

    /**
     * Printer IP address (for network printing)
     * Denormalized from printer configuration for quick access
     */
    @Column({ name: 'printer_ip', nullable: true })
    printerIp: string;

    @Column({ name: 'order_id', nullable: true })
    orderId: string;

    /**
     * Print job type
     */
    @Column({
        type: 'enum',
        enum: ['RECEIPT', 'KITCHEN_TICKET', 'INVOICE', 'TEST'],
        default: 'RECEIPT',
    })
    type: 'RECEIPT' | 'KITCHEN_TICKET' | 'INVOICE' | 'TEST';

    /**
     * Print job status
     */
    @Column({
        type: 'enum',
        enum: ['QUEUED', 'PRINTING', 'COMPLETED', 'FAILED', 'CANCELLED'],
        default: 'QUEUED',
    })
    status: 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

    // =========================================================================
    // NEW: PRIORITY QUEUE FIELDS
    // =========================================================================

    /**
     * Priority level (1-5, 1=highest)
     */
    @Column({ name: 'priority_level', default: 3 })
    priorityLevel: number;

    /**
     * Priority name (for filtering)
     */
    @Column({
        name: 'priority_name',
        type: 'enum',
        enum: ['EMERGENCY', 'EXPEDITE', 'NORMAL', 'REPRINT', 'TEST'],
        default: 'NORMAL',
    })
    priorityName: 'EMERGENCY' | 'EXPEDITE' | 'NORMAL' | 'REPRINT' | 'TEST';

    // =========================================================================
    // NEW: STATION ROUTING FIELDS
    // =========================================================================

    /**
     * Kitchen Station ID (for kitchen tickets)
     * Links to KitchenStation entity
     */
    @Column({ name: 'station_id', nullable: true })
    stationId: string;

    /**
     * Station code (denormalized for quick reference)
     */
    @Column({ name: 'station_code', nullable: true })
    stationCode: string;

    // =========================================================================
    // NEW: FALLOVER FIELDS
    // =========================================================================

    /**
     * If this is a retry from a failed printer
     */
    @Column({ name: 'is_fallback', default: false })
    isFallback: boolean;

    /**
     * Original printer ID (before fallback)
     */
    @Column({ name: 'original_printer_id', nullable: true })
    originalPrinterId: string;

    /**
     * Fallback attempt number
     */
    @Column({ name: 'fallback_attempt', default: 0 })
    fallbackAttempt: number;

    // =========================================================================
    // NEW: TEMPLATE FIELDS
    // =========================================================================

    /**
     * Print template ID used
     */
    @Column({ name: 'template_id', nullable: true })
    templateId: string;

    /**
     * Associated order items (for split printing)
     */
    @Column({ type: 'jsonb', nullable: true, name: 'order_item_ids' })
    orderItemIds: string[];

    // =========================================================================
    // EXISTING FIELDS
    // =========================================================================

    /**
     * Print data (JSON template data for rendering)
     */
    @Column({ type: 'json', nullable: true })
    printData: Record<string, any>;

    /**
     * Rendered HTML/CSS for printing
     */
    @Column({ type: 'text', nullable: true })
    renderedContent: string;

    /**
     * Number of retry attempts
     */
    @Column({ name: 'retry_count', default: 0 })
    retryCount: number;

    /**
     * Maximum retry attempts
     */
    @Column({ name: 'max_retries', default: 3 })
    maxRetries: number;

    /**
     * Next retry timestamp
     */
    @Column({ name: 'retry_at', type: 'timestamp with time zone', nullable: true })
    retryAt: Date | null;

    /**
     * Error message if failed
     */
    @Column({ type: 'text', nullable: true })
    errorMessage: string | null;

    /**
     * Store ID
     */
    @Column({ name: 'store_id', nullable: true })
    storeId: string;

    /**
     * Device/terminal that initiated the print
     */
    @Column({ name: 'device_id', nullable: true })
    deviceId: string;

    /**
     * User who initiated the print
     */
    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
    completedAt: Date | null;

    // =========================================================================
    // METHODS
    // =========================================================================

    /**
     * Check if job can be retried
     */
    canRetry(): boolean {
        return this.status === 'FAILED' && this.retryCount < this.maxRetries;
    }

    /**
     * Calculate next retry time with exponential backoff
     */
    scheduleRetry(): void {
        const backoffMs = Math.pow(2, this.retryCount) * 1000; // 1s, 2s, 4s, etc.
        this.retryAt = new Date(Date.now() + backoffMs);
    }

    /**
     * Check if job should be expedited based on wait time
     */
    shouldExpedite(thresholdMinutes: number): boolean {
        if (this.priorityLevel <= 2) return false; // Already high priority
        const waitMinutes = (Date.now() - this.createdAt.getTime()) / 60000;
        return waitMinutes >= thresholdMinutes;
    }

    /**
     * Increment priority for long-waiting jobs
     */
    escalatePriority(): void {
        if (this.priorityLevel > 1) {
            this.priorityLevel--;
            this.priorityName = this.getPriorityName(this.priorityLevel);
        }
    }

    /**
     * Get priority name from level
     */
    private getPriorityName(level: number): 'EMERGENCY' | 'EXPEDITE' | 'NORMAL' | 'REPRINT' | 'TEST' {
        const names: Record<number, 'EMERGENCY' | 'EXPEDITE' | 'NORMAL' | 'REPRINT' | 'TEST'> = {
            1: 'EMERGENCY',
            2: 'EXPEDITE',
            3: 'NORMAL',
            4: 'REPRINT',
            5: 'TEST',
        };
        return names[level] || 'NORMAL';
    }

    /**
     * Mark as fallback print
     */
    markAsFallback(originalPrinterId: string): void {
        this.isFallback = true;
        this.originalPrinterId = originalPrinterId;
        this.fallbackAttempt++;
    }

    /**
     * Get wait time in minutes
     */
    getWaitMinutes(): number {
        return (Date.now() - this.createdAt.getTime()) / 60000;
    }

    /**
     * Check if job is stuck (waiting too long)
     */
    isStuck(thresholdMinutes: number): boolean {
        return this.status === 'QUEUED' && this.getWaitMinutes() > thresholdMinutes;
    }
}
