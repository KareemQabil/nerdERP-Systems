/**
 * Payment Service
 * H-POS: Payment processing and split bill functionality
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';
import { Payment, PaymentMethod, PaymentTransactionStatus } from '../entities/payment.entity';
import { SalesOrder, PaymentStatus } from '../entities/sales-order.entity';
import { RegisterSession } from '../../cash/entities/register-session.entity';

/**
 * DTO for processing a single payment
 */
export interface ProcessPaymentDto {
    orderId: string;
    method: PaymentMethod;
    amount: number;
    tipAmount?: number;
    tenderedAmount?: number;  // For cash (amount given by customer)
    reference?: string;
    cardLastFour?: string;
    terminalId?: string;
    approvalCode?: string;
    processedByUserId?: string;
}

/**
 * DTO for split payment by amount
 */
export interface SplitByAmountDto {
    orderId: string;
    payments: Array<{
        method: PaymentMethod;
        amount: number;
        tipAmount?: number;
        reference?: string;
    }>;
    processedByUserId?: string;
}

/**
 * DTO for split payment by items
 */
export interface SplitByItemsDto {
    orderId: string;
    splits: Array<{
        itemIds: string[];
        payments: Array<{
            method: PaymentMethod;
            amount: number;
        }>;
    }>;
    processedByUserId?: string;
}

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(RegisterSession)
        private readonly sessionRepo: Repository<RegisterSession>,
    ) { }

    /**
     * Process a single payment for an order
     */
    @Transactional()
    async processPayment(dto: ProcessPaymentDto): Promise<Payment> {
        const order = await this.orderRepo.findOne({
            where: { id: dto.orderId },
            relations: ['payments', 'registerSession'],
        });

        if (!order) {
            throw new BadRequestException({ code: 'SALES_001', message: 'Order not found' });
        }

        if (order.paymentStatus === PaymentStatus.PAID) {
            throw new BadRequestException({ code: 'SALES_003', message: 'Order already paid' });
        }

        // Calculate change for cash payments
        let changeAmount: number | undefined;
        if (dto.method === PaymentMethod.CASH && dto.tenderedAmount) {
            const tendered = new Decimal(dto.tenderedAmount);
            const paymentAmount = new Decimal(dto.amount);
            if (tendered.greaterThan(paymentAmount)) {
                changeAmount = tendered.minus(paymentAmount).toNumber();
            }
        }

        // Create payment
        const payment = this.paymentRepo.create({
            order,
            method: dto.method,
            amount: dto.amount,
            status: PaymentTransactionStatus.APPROVED,
            tipAmount: dto.tipAmount,
            tenderedAmount: dto.tenderedAmount,
            changeAmount,
            reference: dto.reference,
            cardLastFour: dto.cardLastFour,
            terminalId: dto.terminalId,
            approvalCode: dto.approvalCode,
            processedByUserId: dto.processedByUserId,
            processedAt: new Date(),
        });

        const savedPayment = await this.paymentRepo.save(payment);

        // Update order payment status
        await this.updateOrderPaymentStatus(order.id);

        // Update register session for cash payments
        if (dto.method === PaymentMethod.CASH) {
            await this.updateRegisterSessionCash(order.registerSession?.id, dto.amount, changeAmount);
        }

        return savedPayment;
    }

    /**
     * Split payment by amount
     * Multiple payments for same order, each with different method/amount
     */
    @Transactional()
    async splitByAmount(dto: SplitByAmountDto): Promise<Payment[]> {
        const order = await this.orderRepo.findOne({
            where: { id: dto.orderId },
            relations: ['payments', 'registerSession'],
        });

        if (!order) {
            throw new BadRequestException({ code: 'SALES_001', message: 'Order not found' });
        }

        if (order.paymentStatus === PaymentStatus.PAID) {
            throw new BadRequestException({ code: 'SALES_003', message: 'Order already paid' });
        }

        // Validate total payments match order total
        const totalPayments = dto.payments.reduce(
            (sum, p) => sum.plus(p.amount),
            new Decimal(0)
        );
        const orderTotal = new Decimal(order.totalNet);
        const existingPayments = order.payments.reduce(
            (sum, p) => sum.plus(p.amount),
            new Decimal(0)
        );
        const remainingDue = orderTotal.minus(existingPayments);

        if (totalPayments.lessThan(remainingDue.minus('0.01'))) {
            throw new BadRequestException({
                code: 'SALES_012',
                message: `Split payment incomplete. Due: ${remainingDue.toFixed(2)}, Paid: ${totalPayments.toFixed(2)}`,
            });
        }

        const savedPayments: Payment[] = [];
        let totalCash = new Decimal(0);

        // Process each split payment
        for (const payDto of dto.payments) {
            const payment = this.paymentRepo.create({
                order,
                method: payDto.method,
                amount: payDto.amount,
                status: PaymentTransactionStatus.APPROVED,
                tipAmount: payDto.tipAmount,
                reference: payDto.reference,
                processedByUserId: dto.processedByUserId,
                processedAt: new Date(),
            });
            savedPayments.push(await this.paymentRepo.save(payment));

            if (payDto.method === PaymentMethod.CASH) {
                totalCash = totalCash.plus(payDto.amount);
            }
        }

        // Update order payment status
        await this.updateOrderPaymentStatus(order.id);

        // Update register session for total cash
        if (totalCash.greaterThan(0)) {
            await this.updateRegisterSessionCash(order.registerSession?.id, totalCash.toNumber());
        }

        return savedPayments;
    }

    /**
     * Get remaining balance due on an order
     */
    async getRemainingBalance(orderId: string): Promise<{
        orderTotal: number;
        paidAmount: number;
        remainingDue: number;
        payments: Payment[];
    }> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['payments'],
        });

        if (!order) {
            throw new BadRequestException({ code: 'SALES_001', message: 'Order not found' });
        }

        const orderTotal = new Decimal(order.totalNet);
        const paidAmount = order.payments
            .filter(p => p.status === PaymentTransactionStatus.APPROVED)
            .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
        const remainingDue = Decimal.max(orderTotal.minus(paidAmount), new Decimal(0));

        return {
            orderTotal: orderTotal.toNumber(),
            paidAmount: paidAmount.toNumber(),
            remainingDue: remainingDue.toNumber(),
            payments: order.payments,
        };
    }

    /**
     * Void a specific payment
     */
    @Transactional()
    async voidPayment(paymentId: string, reason: string, voidedByUserId: string): Promise<Payment> {
        const payment = await this.paymentRepo.findOne({
            where: { id: paymentId },
            relations: ['order'],
        });

        if (!payment) {
            throw new BadRequestException({ code: 'PAY_001', message: 'Payment not found' });
        }

        if (payment.status === PaymentTransactionStatus.VOIDED) {
            throw new BadRequestException({ code: 'PAY_002', message: 'Payment already voided' });
        }

        payment.status = PaymentTransactionStatus.VOIDED;
        // Store void info in reference
        payment.reference = `${payment.reference || ''} [VOIDED: ${reason} by ${voidedByUserId}]`;

        const savedPayment = await this.paymentRepo.save(payment);

        // Recalculate order payment status
        await this.updateOrderPaymentStatus(payment.order.id);

        return savedPayment;
    }

    /**
     * Update order payment status based on payments
     */
    private async updateOrderPaymentStatus(orderId: string): Promise<void> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['payments'],
        });

        if (!order) return;

        const orderTotal = new Decimal(order.totalNet);
        const paidAmount = order.payments
            .filter(p => p.status === PaymentTransactionStatus.APPROVED)
            .reduce((sum, p) => sum.plus(p.amount), new Decimal(0));

        if (paidAmount.greaterThanOrEqualTo(orderTotal.minus('0.01'))) {
            order.paymentStatus = PaymentStatus.PAID;
        } else if (paidAmount.greaterThan(0)) {
            order.paymentStatus = PaymentStatus.PARTIAL;
        } else {
            order.paymentStatus = PaymentStatus.PENDING;
        }

        await this.orderRepo.save(order);
    }

    /**
     * Update register session cash balance
     */
    private async updateRegisterSessionCash(
        sessionId: string | undefined,
        cashIn: number,
        changeOut?: number,
    ): Promise<void> {
        if (!sessionId) return;

        const session = await this.sessionRepo.findOneBy({ id: sessionId });
        if (!session) return;

        // Update totalCashSales and expectedBalance
        const currentCashSales = new Decimal(session.totalCashSales || 0);
        const currentExpected = new Decimal(session.expectedBalance || 0);
        const netCash = new Decimal(cashIn).minus(new Decimal(changeOut || 0));

        session.totalCashSales = currentCashSales.plus(netCash).toNumber();
        session.expectedBalance = currentExpected.plus(netCash).toNumber();
        await this.sessionRepo.save(session);
    }

    /**
     * Get payment methods available for a store
     */
    getAvailablePaymentMethods(): Array<{ method: PaymentMethod; label: string; icon: string }> {
        return [
            { method: PaymentMethod.CASH, label: 'Cash', icon: 'banknote' },
            { method: PaymentMethod.VISA, label: 'Visa', icon: 'credit-card' },
            { method: PaymentMethod.MASTERCARD, label: 'Mastercard', icon: 'credit-card' },
            { method: PaymentMethod.MADA, label: 'Mada', icon: 'credit-card' },
            { method: PaymentMethod.MEEZA, label: 'Meeza', icon: 'credit-card' },
            { method: PaymentMethod.EPT, label: 'EPT', icon: 'square' },
            { method: PaymentMethod.APPLE_PAY, label: 'Apple Pay', icon: 'apple' },
            { method: PaymentMethod.GOOGLE_PAY, label: 'Google Pay', icon: 'smartphone' },
            { method: PaymentMethod.TALABAT, label: 'Talabat', icon: 'truck' },
            { method: PaymentMethod.MARSOOL, label: 'Marsool', icon: 'truck' },
            { method: PaymentMethod.INSTASHOP, label: 'InstaShop', icon: 'shopping-bag' },
        ];
    }
}
