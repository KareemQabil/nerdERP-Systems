import { Injectable, Logger } from '@nestjs/common';
import { ReceiptGeneratorService } from './receipt-generator.service';
import { PrintQueueService } from './print-queue.service';
import { GenerateReceiptDto, GenerateKitchenTicketDto, TestPrintDto } from '../dto/print-job.dto';

/**
 * Printing Service
 *
 * Main service for handling all printing operations.
 * Coordinates receipt generation and print queue management.
 */
@Injectable()
export class PrintingService {
    private readonly logger = new Logger(PrintingService.name);

    constructor(
        private readonly receiptGenerator: ReceiptGeneratorService,
        private readonly printQueue: PrintQueueService,
    ) {}

    /**
     * Generate and queue a customer receipt
     */
    async printReceipt(dto: GenerateReceiptDto, printerId: string): Promise<{
        success: boolean;
        jobId?: string;
        receiptData?: any;
        error?: string;
    }> {
        try {
            // Generate receipt data
            const receiptData = await this.receiptGenerator.generateReceipt(
                dto.orderId,
                dto.format === 'A4' ? 'A4' : 'THERMAL_80MM',
            );

            // If preview only, return data without queuing
            if (dto.previewOnly) {
                return {
                    success: true,
                    receiptData,
                };
            }

            // Queue print job
            const job = await this.printQueue.queuePrintJob({
                printerId,
                orderId: dto.orderId,
                type: 'RECEIPT',
                printData: receiptData,
            });

            this.logger.log(`Receipt queued for order ${dto.orderId}, job ${job.id}`);

            return {
                success: true,
                jobId: job.id,
                receiptData,
            };
        } catch (error) {
            this.logger.error(`Failed to generate receipt: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Generate and queue a kitchen ticket
     */
    async printKitchenTicket(
        dto: GenerateKitchenTicketDto,
        printerId: string,
    ): Promise<{
        success: boolean;
        jobId?: string;
        ticketData?: any;
        error?: string;
    }> {
        try {
            // Generate ticket data
            const ticketData = await this.receiptGenerator.generateKitchenTicket(
                dto.orderId,
                dto.station,
            );

            // Queue print job
            const job = await this.printQueue.queuePrintJob({
                printerId,
                orderId: dto.orderId,
                type: 'KITCHEN_TICKET',
                printData: ticketData,
            });

            this.logger.log(
                `Kitchen ticket queued for order ${dto.orderId}, station ${dto.station}, job ${job.id}`,
            );

            return {
                success: true,
                jobId: job.id,
                ticketData,
            };
        } catch (error) {
            this.logger.error(`Failed to generate kitchen ticket: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Print a test page
     */
    async printTestPrint(
        dto: TestPrintDto,
        storeId?: string,
        deviceId?: string,
    ): Promise<{
        success: boolean;
        jobId?: string;
        error?: string;
    }> {
        try {
            const testData = {
                storeName: 'Test Store',
                testDate: new Date().toISOString(),
                format: dto.format,
            };

            const job = await this.printQueue.queuePrintJob({
                printerId: dto.printerId,
                type: 'TEST',
                printData: testData,
                storeId,
                deviceId,
            });

            this.logger.log(`Test print queued for printer ${dto.printerId}, job ${job.id}`);

            return {
                success: true,
                jobId: job.id,
            };
        } catch (error) {
            this.logger.error(`Failed to queue test print: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get print job status
     */
    async getJobStatus(jobId: string) {
        return await this.printQueue.getJobStatus(jobId);
    }

    /**
     * Get all jobs for an order
     */
    async getOrderJobs(orderId: string) {
        return await this.printQueue.getOrderJobs(orderId);
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(printerId?: string) {
        return await this.printQueue.getQueueStats(printerId);
    }

    /**
     * Cancel a print job
     */
    async cancelJob(jobId: string): Promise<void> {
        await this.printQueue.cancelJob(jobId);
    }

    /**
     * Reprint a receipt for an order
     */
    async reprintReceipt(orderId: string, printerId: string): Promise<{
        success: boolean;
        jobId?: string;
        error?: string;
    }> {
        return await this.printReceipt(
            { orderId, format: 'THERMAL_80MM' },
            printerId,
        );
    }
}
