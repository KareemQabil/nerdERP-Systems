/**
 * Payment Controller
 * H-POS: REST endpoints for payment processing and split bills
 */
import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentService, ProcessPaymentDto, SplitByAmountDto } from '../services/payment.service';
import { Payment } from '../entities/payment.entity';

@ApiTags('Payments')
@Controller('api/v1/payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    /**
     * Process a single payment for an order
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Process a single payment' })
    @ApiResponse({ status: 201, description: 'Payment processed successfully' })
    async processPayment(@Body() dto: ProcessPaymentDto) {
        const payment = await this.paymentService.processPayment(dto);
        return {
            success: true,
            data: payment,
            messageKey: 'PAYMENT_PROCESSED',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Split payment by amount
     * Multiple payments for same order with different methods
     */
    @Post('split-by-amount')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Split payment by amount' })
    @ApiResponse({ status: 201, description: 'Split payments processed successfully' })
    async splitByAmount(@Body() dto: SplitByAmountDto) {
        const payments = await this.paymentService.splitByAmount(dto);
        return {
            success: true,
            data: payments,
            messageKey: 'SPLIT_PAYMENT_PROCESSED',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get remaining balance on an order
     */
    @Get('balance/:orderId')
    @ApiOperation({ summary: 'Get remaining balance on an order' })
    @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
    async getRemainingBalance(@Param('orderId') orderId: string) {
        const balance = await this.paymentService.getRemainingBalance(orderId);
        return {
            success: true,
            data: balance,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Void a specific payment
     */
    @Post(':paymentId/void')
    @ApiOperation({ summary: 'Void a payment' })
    @ApiResponse({ status: 200, description: 'Payment voided successfully' })
    async voidPayment(
        @Param('paymentId') paymentId: string,
        @Body() dto: { reason: string; voidedByUserId: string },
    ) {
        const payment = await this.paymentService.voidPayment(
            paymentId,
            dto.reason,
            dto.voidedByUserId,
        );
        return {
            success: true,
            data: payment,
            messageKey: 'PAYMENT_VOIDED',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get available payment methods
     */
    @Get('methods')
    @ApiOperation({ summary: 'Get available payment methods' })
    @ApiResponse({ status: 200, description: 'Payment methods retrieved' })
    async getPaymentMethods() {
        const methods = this.paymentService.getAvailablePaymentMethods();
        return {
            success: true,
            data: methods,
            timestamp: new Date().toISOString(),
        };
    }
}
