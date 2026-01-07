import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrintingService } from '../services/printing.service';
import {
    GenerateReceiptDto,
    GenerateKitchenTicketDto,
    TestPrintDto,
} from '../dto/print-job.dto';

/**
 * Printing Controller
 *
 * API endpoints for all printing operations:
 * - Generate and print receipts
 * - Generate and print kitchen tickets
 * - Test printer connections
 * - Query print job status
 */
@ApiTags('Printing')
@Controller('api/v1/printing')
export class PrintingController {
    constructor(private readonly printingService: PrintingService) {}

    /**
     * Generate and print a receipt
     */
    @Post('receipt')
    @ApiOperation({ summary: 'Print customer receipt' })
    @ApiResponse({ status: 200, description: 'Receipt printed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid request' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async printReceipt(
        @Body() dto: GenerateReceiptDto,
        @Query('printerId') printerId: string,
    ) {
        if (!printerId) {
            return {
                success: false,
                error: 'Printer ID is required',
            };
        }

        return await this.printingService.printReceipt(dto, printerId);
    }

    /**
     * Generate and print a kitchen ticket
     */
    @Post('kitchen-ticket')
    @ApiOperation({ summary: 'Print kitchen ticket' })
    @ApiResponse({ status: 200, description: 'Kitchen ticket printed successfully' })
    async printKitchenTicket(
        @Body() dto: GenerateKitchenTicketDto,
        @Query('printerId') printerId: string,
    ) {
        if (!printerId) {
            return {
                success: false,
                error: 'Printer ID is required',
            };
        }

        return await this.printingService.printKitchenTicket(dto, printerId);
    }

    /**
     * Print a test page
     */
    @Post('test')
    @ApiOperation({ summary: 'Print test page' })
    @ApiResponse({ status: 200, description: 'Test page queued successfully' })
    async printTest(@Body() dto: TestPrintDto) {
        return await this.printingService.printTestPrint(dto);
    }

    /**
     * Reprint a receipt for an order
     */
    @Post('reprint/:orderId')
    @ApiOperation({ summary: 'Reprint receipt for order' })
    @ApiResponse({ status: 200, description: 'Reprint queued successfully' })
    async reprintReceipt(
        @Param('orderId') orderId: string,
        @Query('printerId') printerId: string,
    ) {
        if (!printerId) {
            return {
                success: false,
                error: 'Printer ID is required',
            };
        }

        return await this.printingService.reprintReceipt(orderId, printerId);
    }

    /**
     * Get print job status
     */
    @Get('jobs/:jobId')
    @ApiOperation({ summary: 'Get print job status' })
    @ApiResponse({ status: 200, description: 'Job status retrieved' })
    @ApiResponse({ status: 404, description: 'Job not found' })
    async getJobStatus(@Param('jobId') jobId: string) {
        const job = await this.printingService.getJobStatus(jobId);

        if (!job) {
            return {
                success: false,
                error: 'Job not found',
            };
        }

        return {
            success: true,
            data: job,
        };
    }

    /**
     * Get all print jobs for an order
     */
    @Get('orders/:orderId/jobs')
    @ApiOperation({ summary: 'Get all print jobs for an order' })
    @ApiResponse({ status: 200, description: 'Jobs retrieved' })
    async getOrderJobs(@Param('orderId') orderId: string) {
        const jobs = await this.printingService.getOrderJobs(orderId);

        return {
            success: true,
            data: jobs,
        };
    }

    /**
     * Get queue statistics
     */
    @Get('queue/stats')
    @ApiOperation({ summary: 'Get print queue statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved' })
    async getQueueStats(@Query('printerId') printerId?: string) {
        const stats = await this.printingService.getQueueStats(printerId);

        return {
            success: true,
            data: stats,
        };
    }

    /**
     * Cancel a print job
     */
    @Delete('jobs/:jobId')
    @ApiOperation({ summary: 'Cancel a print job' })
    @ApiResponse({ status: 200, description: 'Job cancelled' })
    async cancelJob(@Param('jobId') jobId: string) {
        await this.printingService.cancelJob(jobId);

        return {
            success: true,
            message: 'Job cancelled',
        };
    }
}
