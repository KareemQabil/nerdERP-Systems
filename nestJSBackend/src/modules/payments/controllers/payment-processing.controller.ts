import { Controller, Post, Get, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentProcessingService } from '../services/payment-processing.service';
import { PaymentGatewayService } from '../services/payment-gateway.service';
import { ProcessPaymentDto, ProcessSplitPaymentDto, ProcessRefundDto } from '../dto/payment-processing.dto';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface';

@ApiTags('Payments')
@Controller('payments')
export class PaymentProcessingController {
  constructor(
    private readonly paymentService: PaymentProcessingService,
    private readonly gatewayService: PaymentGatewayService,
  ) { }

  // ==========================================================================
  // PAYMENT PROCESSING
  // ==========================================================================

  /**
   * Process single payment for an order
   *
   * Creates a payment record and updates order payment status
   * For card/MADA payments, processes via payment gateway
   *
   * Error codes:
   * - PAYMENT_001: Amount exceeds order total
   * - PAYMENT_002: Payment gateway error
   * - PAYMENT_005: Order not found
   */
  @Post('process')
  @ApiOperation({ summary: 'Process payment for order' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - amount exceeds total or gateway error' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async processPayment(@Body() dto: ProcessPaymentDto, @Req() req: AuthenticatedRequest) {
    const user = req.user!;

    const payment = await this.paymentService.processPayment({
      orderId: dto.orderId,
      method: dto.method,
      amount: dto.amount,
      reference: dto.reference,
      tipAmount: dto.tipAmount,
      processedBy: user.id,
      processedByUserName: `${user.firstName} ${user.lastName}`,
    });

    return {
      success: true,
      data: payment,
      messageKey: 'PAYMENT_PROCESSED',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Process split payment (multiple payment methods)
   *
   * Allows customers to pay using multiple methods (e.g., cash + card)
   * Validates total matches or is less than remaining balance
   */
  @Post('split')
  @ApiOperation({ summary: 'Process split payment for order' })
  @ApiResponse({ status: 201, description: 'Split payment processed successfully', type: [Object] })
  @ApiResponse({ status: 400, description: 'Bad request - split total exceeds remaining' })
  async processSplitPayment(@Body() dto: ProcessSplitPaymentDto, @Req() req: AuthenticatedRequest) {
    const user = req.user!;

    const payments = await this.paymentService.processSplitPayment({
      orderId: dto.orderId,
      payments: dto.payments,
      processedBy: user.id,
      processedByUserName: `${user.firstName} ${user.lastName}`,
    });

    return {
      success: true,
      data: payments,
      messageKey: 'SPLIT_PAYMENT_PROCESSED',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get payment status for an order
   *
   * Returns summary of all payments, refunds, and current status
   */
  @Get('orders/:orderId/status')
  @ApiOperation({ summary: 'Get payment status for order' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getPaymentStatus(@Param('orderId') orderId: string) {
    const status = await this.paymentService.getPaymentStatus(orderId);

    return {
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // REFUNDS
  // ==========================================================================

  /**
   * Process refund for a payment
   *
   * Creates refund record and processes via gateway for card/MADA
   * Requires manager authorization (handled by guard)
   *
   * Error codes:
   * - PAYMENT_004: Refund amount exceeds payment
   * - PAYMENT_006: Payment not found
   */
  @Post('refund')
  @ApiOperation({ summary: 'Process refund for payment' })
  @ApiResponse({ status: 201, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - refund amount exceeds payment' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async processRefund(@Body() dto: ProcessRefundDto, @Req() req: AuthenticatedRequest) {
    const user = req.user!;
    const authorizingUser = req.authorizingUser!;

    const refund = await this.paymentService.processRefund({
      paymentId: dto.paymentId,
      amount: dto.amount,
      reason: dto.reason,
      authorizedBy: authorizingUser.id,
      authorizedByUserName: `${authorizingUser.firstName} ${authorizingUser.lastName}`,
      processedBy: user.id,
      processedByUserName: `${user.firstName} ${user.lastName}`,
    });

    return {
      success: true,
      data: refund,
      messageKey: 'REFUND_PROCESSED',
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // GATEWAY OPERATIONS
  // ==========================================================================

  /**
   * Verify payment status from gateway
   *
   * Queries payment gateway for current transaction status
   */
  @Get('verify/:transactionId')
  @ApiOperation({ summary: 'Verify payment status from gateway' })
  @ApiResponse({ status: 200, description: 'Payment status verified' })
  async verifyPayment(@Param('transactionId') transactionId: string) {
    const status = await this.gatewayService.verifyPayment(transactionId);

    return {
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate card number
   *
   * Uses Luhn algorithm to validate card number
   */
  @Post('validate-card')
  @ApiOperation({ summary: 'Validate card number' })
  @ApiResponse({ status: 200, description: 'Card validation result' })
  async validateCardNumber(@Body() dto: { cardNumber: string }) {
    const isValid = this.gatewayService.validateCardNumber(dto.cardNumber);
    const cardType = this.gatewayService.detectCardType(dto.cardNumber);

    return {
      success: true,
      data: {
        isValid,
        cardType,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
