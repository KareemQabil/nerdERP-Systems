import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Decimal } from 'decimal.js';
import { Payment, PaymentMethod } from '../../sales/entities/payment.entity';
import { Refund, RefundStatus } from '../../sales/entities/refund.entity';
import { SalesOrder, OrderStatus, PaymentStatus } from '../../sales/entities/sales-order.entity';
import { PaymentGatewayService } from './payment-gateway.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

/**
 * Payment Processing Service
 *
 * Handles:
 * - Single payment processing
 * - Split payments (multiple payment methods)
 * - Refund processing with manager approval
 * - Payment status tracking
 *
 * Error codes:
 * - PAYMENT_001: Amount exceeds order total
 * - PAYMENT_002: Payment gateway error
 * - PAYMENT_003: Order already paid
 * - PAYMENT_004: Refund amount exceeds payment
 */
@Injectable()
export class PaymentProcessingService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    @InjectRepository(SalesOrder)
    private readonly orderRepo: Repository<SalesOrder>,
    private readonly gatewayService: PaymentGatewayService,
    private readonly auditLogService: AuditLogService,
  ) { }

  /**
   * Process a single payment for an order
   *
   * @param params Payment parameters
   * @returns The created payment
   */
  @Transactional()
  async processPayment(params: {
    orderId: string;
    method: PaymentMethod;
    amount: Decimal | number;
    reference?: string;
    tipAmount?: Decimal | number;
    processedBy: string;
    processedByUserName?: string;
  }): Promise<Payment> {
    // Fetch order
    const order = await this.orderRepo.findOne({
      where: { id: params.orderId },
      relations: ['payments'],
    });

    if (!order) {
      throw new NotFoundException({
        code: 'PAYMENT_005',
        messageKey: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    // Convert amounts to Decimal
    const amount = params.amount instanceof Decimal ? params.amount : new Decimal(params.amount);
    const tipAmount = params.tipAmount instanceof Decimal
      ? params.tipAmount
      : new Decimal(params.tipAmount || 0);

    // Calculate current paid amount
    const currentPaid = order.payments.reduce(
      (sum, p) => sum.plus(new Decimal(p.amount)),
      new Decimal(0),
    );

    // Calculate order total (with tip if applicable)
    const orderTotal = new Decimal(order.totalGross || 0);

    // Check if payment exceeds total
    if (currentPaid.plus(amount).greaterThan(orderTotal.plus(tipAmount))) {
      throw new BadRequestException({
        code: 'PAYMENT_001',
        messageKey: 'AMOUNT_EXCEEDS_TOTAL',
        message: `Payment amount ${amount} exceeds remaining balance ${orderTotal.minus(currentPaid)}`,
        data: {
          currentPaid: currentPaid.toNumber(),
          orderTotal: orderTotal.toNumber(),
          remaining: orderTotal.minus(currentPaid).toNumber(),
        },
      });
    }

    // Process card payment via gateway
    let gatewayResult;
    if (params.method === PaymentMethod.CARD || params.method === PaymentMethod.MADA) {
      gatewayResult = await this.gatewayService.processCardPayment({
        amount: amount.plus(tipAmount),
        terminalId: params.reference || 'DEFAULT',
        orderId: order.id,
      });

      if (!gatewayResult.success) {
        throw new BadRequestException({
          code: 'PAYMENT_002',
          messageKey: 'GATEWAY_ERROR',
          message: gatewayResult.error || 'Payment gateway error',
        });
      }
    }

    // Create payment record
    const payment = this.paymentRepo.create({
      order,
      amount: amount.toNumber(),
      method: params.method,
      reference: params.reference || gatewayResult?.transactionId,
    });

    const savedPayment = await this.paymentRepo.save(payment);

    // Update order payment status
    await this.updateOrderPaymentStatus(order.id);

    // Log payment
    await this.auditLogService.logAction({
      entityName: 'PAYMENT',
      entityId: savedPayment.id,
      action: 'PROCESS_PAYMENT',
      userId: params.processedBy,
      userName: params.processedByUserName || params.processedBy,
      oldValues: undefined,
      newValues: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: amount.toNumber(),
        method: params.method,
        gatewayTransactionId: gatewayResult?.transactionId,
      },
    });

    return savedPayment;
  }

  /**
   * Process split payment (multiple payment methods for one order)
   *
   * @param params Split payment parameters
   * @returns Array of created payments
   */
  @Transactional()
  async processSplitPayment(params: {
    orderId: string;
    payments: Array<{
      method: PaymentMethod;
      amount: Decimal | number;
      reference?: string;
    }>;
    processedBy: string;
    processedByUserName?: string;
  }): Promise<Payment[]> {
    // Fetch order
    const order = await this.orderRepo.findOne({
      where: { id: params.orderId },
      relations: ['payments'],
    });

    if (!order) {
      throw new NotFoundException({
        code: 'PAYMENT_005',
        messageKey: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    // Calculate total of split payments
    const splitTotal = params.payments.reduce(
      (sum, p) => sum.plus(p.amount instanceof Decimal ? p.amount : new Decimal(p.amount)),
      new Decimal(0),
    );

    // Calculate current paid amount
    const currentPaid = order.payments.reduce(
      (sum, p) => sum.plus(new Decimal(p.amount)),
      new Decimal(0),
    );

    const orderTotal = new Decimal(order.totalGross || 0);
    const remaining = orderTotal.minus(currentPaid);

    // Validate split total doesn't exceed remaining
    if (splitTotal.greaterThan(remaining)) {
      throw new BadRequestException({
        code: 'PAYMENT_001',
        messageKey: 'SPLIT_EXCEEDS_TOTAL',
        message: `Split payment total ${splitTotal} exceeds remaining balance ${remaining}`,
      });
    }

    // Process each payment
    const processedPayments: Payment[] = [];

    for (const paymentData of params.payments) {
      const payment = await this.processPayment({
        orderId: params.orderId,
        method: paymentData.method,
        amount: paymentData.amount,
        reference: paymentData.reference,
        processedBy: params.processedBy,
        processedByUserName: params.processedByUserName,
      });

      processedPayments.push(payment);
    }

    return processedPayments;
  }

  /**
   * Process refund for a payment
   *
   * @param params Refund parameters
   * @returns The created refund
   */
  @Transactional()
  async processRefund(params: {
    paymentId: string;
    amount: Decimal | number;
    reason: string;
    authorizedBy: string;
    authorizedByUserName?: string;
    processedBy: string;
    processedByUserName?: string;
  }): Promise<Refund> {
    // Fetch payment with order
    const payment = await this.paymentRepo.findOne({
      where: { id: params.paymentId },
      relations: ['order', 'order.payments'],
    });

    if (!payment) {
      throw new NotFoundException({
        code: 'PAYMENT_006',
        messageKey: 'PAYMENT_NOT_FOUND',
        message: 'Payment not found',
      });
    }

    // Convert amount to Decimal
    const refundAmount = params.amount instanceof Decimal ? params.amount : new Decimal(params.amount);
    const paymentAmount = new Decimal(payment.amount);

    // Validate refund amount
    if (refundAmount.greaterThan(paymentAmount)) {
      throw new BadRequestException({
        code: 'PAYMENT_004',
        messageKey: 'REFUND_EXCEEDS_PAYMENT',
        message: `Refund amount ${refundAmount} exceeds payment amount ${paymentAmount}`,
      });
    }

    // Check if payment is from card/MADA - process via gateway
    let gatewayResult;
    if (payment.method === PaymentMethod.CARD || payment.method === PaymentMethod.MADA) {
      gatewayResult = await this.gatewayService.refundPayment({
        transactionId: payment.reference || payment.id,
        amount: refundAmount,
        reason: params.reason,
      });

      if (!gatewayResult.success) {
        throw new BadRequestException({
          code: 'PAYMENT_002',
          messageKey: 'GATEWAY_REFUND_ERROR',
          message: gatewayResult.error || 'Payment gateway refund error',
        });
      }
    }

    // Generate refund number
    const refundNumber = await this.generateRefundNumber();

    // Create refund record
    const refund = this.refundRepo.create({
      order: payment.order,
      refundNumber,
      status: RefundStatus.COMPLETED,
      refundAmount: refundAmount.toNumber(),
      refundReason: params.reason as any,
      requestedByUserId: params.processedBy,
      requestedByUserName: params.processedByUserName || params.processedBy,
      approvedByUserId: params.authorizedBy,
      approvedByUserName: params.authorizedByUserName || params.authorizedBy,
      originalPaymentMethod: payment.method,
      processedAt: new Date(),
    });

    const savedRefund = await this.refundRepo.save(refund);

    // Update order payment status
    await this.updateOrderPaymentStatus(payment.order.id);

    // Log refund
    await this.auditLogService.logRefundOperation({
      paymentId: payment.id,
      orderId: payment.order.id,
      refundAmount: refundAmount.toNumber(),
      reason: params.reason,
      processedBy: {
        id: params.processedBy,
        name: params.processedByUserName || params.processedBy,
      },
      authorizedBy: {
        id: params.authorizedBy,
        name: params.authorizedByUserName || params.authorizedBy,
      },
    });

    return savedRefund;
  }

  /**
   * Update order payment status based on payments
   * - PENDING: No payments
   * - PARTIAL: Some payments but not full
   * - PAID: Full amount paid
   * - REFUNDED: Fully refunded
   *
   * @param orderId The order ID to update
   */
  private async updateOrderPaymentStatus(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) return;

    const totalPaid = order.payments.reduce(
      (sum, p) => sum.plus(new Decimal(p.amount)),
      new Decimal(0),
    );

    const orderTotal = new Decimal(order.totalGross || 0);

    // Check for refunds
    const totalRefunded = await this.refundRepo
      .createQueryBuilder('refund')
      .select('COALESCE(SUM(refund.refundAmount), 0)', 'total')
      .where('refund.orderId = :orderId', { orderId })
      .andWhere('refund.status IN (:...statuses)', { statuses: [RefundStatus.APPROVED, RefundStatus.COMPLETED] })
      .getRawOne();

    const refundedAmount = new Decimal(totalRefunded.total || 0);

    if (refundedAmount.greaterThanOrEqualTo(orderTotal)) {
      order.paymentStatus = PaymentStatus.REFUNDED;
    } else if (totalPaid.greaterThanOrEqualTo(orderTotal)) {
      order.paymentStatus = PaymentStatus.PAID;
      // Update order status to PAID if it was still pending
      if (order.status === OrderStatus.DRAFT || order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.PAID;
      }
    } else if (totalPaid.greaterThan(0)) {
      order.paymentStatus = PaymentStatus.PARTIAL;
    } else {
      order.paymentStatus = PaymentStatus.PENDING;
    }

    await this.orderRepo.save(order);
  }

  /**
   * Generate unique refund number
   */
  private async generateRefundNumber(): Promise<string> {
    const prefix = 'REF';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Get payment status for an order
   *
   * @param orderId The order ID
   * @returns Payment status summary
   */
  async getPaymentStatus(orderId: string): Promise<{
    orderId: string;
    orderTotal: number;
    totalPaid: number;
    totalRefunded: number;
    paymentStatus: PaymentStatus;
    payments: Payment[];
    refunds: Refund[];
  }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) {
      throw new NotFoundException({
        code: 'PAYMENT_005',
        messageKey: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    const refunds = await this.refundRepo.find({
      where: { order: { id: orderId } },
    });

    const totalPaid = order.payments.reduce(
      (sum, p) => sum.plus(new Decimal(p.amount)),
      new Decimal(0),
    );

    const totalRefunded = refunds
      .filter(r => r.status === RefundStatus.COMPLETED || r.status === RefundStatus.APPROVED)
      .reduce((sum, r) => sum.plus(new Decimal(r.refundAmount)), new Decimal(0));

    return {
      orderId: order.id,
      orderTotal: order.totalGross || 0,
      totalPaid: totalPaid.toNumber(),
      totalRefunded: totalRefunded.toNumber(),
      paymentStatus: order.paymentStatus,
      payments: order.payments,
      refunds,
    };
  }
}
