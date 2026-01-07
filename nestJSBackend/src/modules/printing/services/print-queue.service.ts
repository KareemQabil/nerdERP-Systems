import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrintJob } from '../entities/print-job.entity';

/**
 * Print Queue Service
 *
 * Manages print job queue with automatic retry logic:
 * - Queued jobs are sent to printers
 * - Failed jobs are retried with exponential backoff
 * - Cron job processes pending retries
 * - Old completed jobs are cleaned up
 */
@Injectable()
export class PrintQueueService {
    private readonly logger = new Logger(PrintQueueService.name);

    constructor(
        @InjectRepository(PrintJob)
        private readonly printJobRepo: Repository<PrintJob>,
    ) { }

    /**
     * Add a print job to the queue
     */
    async queuePrintJob(data: {
        printerId: string;
        orderId?: string;
        type: 'RECEIPT' | 'KITCHEN_TICKET' | 'INVOICE' | 'TEST';
        printData?: Record<string, any>;
        renderedContent?: string;
        storeId?: string;
        deviceId?: string;
        userId?: string;
    }): Promise<PrintJob> {
        const job = this.printJobRepo.create({
            ...data,
            status: 'QUEUED',
            retryCount: 0,
            maxRetries: 3,
        });

        return await this.printJobRepo.save(job);
    }

    /**
     * Get next job in queue for a specific printer
     */
    async getNextJob(printerId: string): Promise<PrintJob | null> {
        return await this.printJobRepo.findOne({
            where: {
                printerId,
                status: 'QUEUED' as const,
            },
            order: { createdAt: 'ASC' },
        });
    }

    /**
     * Mark job as printing
     */
    async markPrinting(jobId: string): Promise<void> {
        await this.printJobRepo.update(jobId, { status: 'PRINTING' });
    }

    /**
     * Mark job as completed
     */
    async markCompleted(jobId: string): Promise<void> {
        await this.printJobRepo.update(jobId, {
            status: 'COMPLETED',
            completedAt: new Date(),
        });
    }

    /**
     * Mark job as failed and schedule retry if possible
     */
    async markFailed(jobId: string, errorMessage: string): Promise<PrintJob> {
        const job = await this.printJobRepo.findOne({ where: { id: jobId } });
        if (!job) {
            throw new Error(`Print job ${jobId} not found`);
        }

        job.retryCount++;
        job.errorMessage = errorMessage;

        if (job.canRetry()) {
            job.status = 'QUEUED';
            job.scheduleRetry();
            this.logger.warn(
                `Print job ${jobId} failed, scheduling retry ${job.retryCount}/${job.maxRetries}`,
            );
        } else {
            job.status = 'FAILED';
            this.logger.error(`Print job ${jobId} failed permanently after ${job.retryCount} attempts`);
        }

        return await this.printJobRepo.save(job);
    }

    /**
     * Cancel a print job
     */
    async cancelJob(jobId: string): Promise<void> {
        await this.printJobRepo.update(jobId, { status: 'CANCELLED' });
    }

    /**
     * Get job status
     */
    async getJobStatus(jobId: string): Promise<PrintJob | null> {
        return await this.printJobRepo.findOne({ where: { id: jobId } });
    }

    /**
     * Get jobs for an order
     */
    async getOrderJobs(orderId: string): Promise<PrintJob[]> {
        return await this.printJobRepo.find({
            where: { orderId },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Get failed jobs for retry
     */
    async getJobsReadyForRetry(): Promise<PrintJob[]> {
        return await this.printJobRepo.find({
            where: {
                status: 'QUEUED' as const,
                retryAt: LessThan(new Date()),
            },
            order: { retryAt: 'ASC' },
        });
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(printerId?: string): Promise<{
        queued: number;
        printing: number;
        completed: number;
        failed: number;
    }> {
        const where = printerId ? { printerId } : {};

        const [queued, printing, completed, failed] = await Promise.all([
            this.printJobRepo.count({ where: { ...where, status: 'QUEUED' as const } }),
            this.printJobRepo.count({ where: { ...where, status: 'PRINTING' as const } }),
            this.printJobRepo.count({ where: { ...where, status: 'COMPLETED' as const } }),
            this.printJobRepo.count({ where: { ...where, status: 'FAILED' as const } }),
        ]);

        return { queued, printing, completed, failed };
    }

    /**
     * Cron job: Process pending retries every minute
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async processRetries(): Promise<void> {
        const jobs = await this.getJobsReadyForRetry();

        if (jobs.length > 0) {
            this.logger.log(`Processing ${jobs.length} print job retries`);
        }

        for (const job of jobs) {
            // In a real implementation, this would trigger the print again
            // For now, we just log it
            this.logger.log(`Retry job ${job.id} for printer ${job.printerId}`);
        }
    }

    /**
     * Cron job: Clean up old completed jobs (daily at 2 AM)
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async cleanupOldJobs(): Promise<void> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await this.printJobRepo.delete({
            status: 'COMPLETED' as const,
            completedAt: LessThan(thirtyDaysAgo),
        });

        if (result.affected && result.affected > 0) {
            this.logger.log(`Cleaned up ${result.affected} old print jobs`);
        }
    }
}
