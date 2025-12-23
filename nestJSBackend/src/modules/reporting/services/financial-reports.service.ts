import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SalesOrder, OrderStatus } from '../../sales/entities/sales-order.entity';
import { RegisterSession } from '../../cash/entities/register-session.entity';
import Decimal from 'decimal.js';

@Injectable()
export class FinancialReportsService {
    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(RegisterSession)
        private readonly sessionRepo: Repository<RegisterSession>,
    ) { }

    /**
     * Get revenue summary for date range
     */
    async getRevenueSummary(startDate: Date, endDate: Date) {
        const orders = await this.orderRepo.find({
            where: {
                createdAt: Between(startDate, endDate),
                status: OrderStatus.PAID,
            },
        });

        let totalRevenue = new Decimal(0);
        let totalTax = new Decimal(0);
        let totalNet = new Decimal(0);
        let totalDiscounts = new Decimal(0);

        for (const order of orders) {
            totalRevenue = totalRevenue.plus(order.totalGross);
            totalTax = totalTax.plus(order.totalTax);
            totalNet = totalNet.plus(order.totalNet);
            totalDiscounts = totalDiscounts.plus(order.discountAmount || 0);
        }

        return {
            period: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
            },
            totalOrders: orders.length,
            totalRevenue: totalRevenue.toFixed(3),
            totalTax: totalTax.toFixed(3),
            totalNet: totalNet.toFixed(3),
            totalDiscounts: totalDiscounts.toFixed(3),
            averageOrderValue: orders.length > 0 ? totalRevenue.dividedBy(orders.length).toFixed(3) : '0.000',
        };
    }

    /**
     * Get tax collected report
     */
    async getTaxCollected(startDate: Date, endDate: Date) {
        const orders = await this.orderRepo.find({
            where: {
                createdAt: Between(startDate, endDate),
                status: OrderStatus.PAID,
            },
        });

        let totalTax = new Decimal(0);
        let totalTaxableAmount = new Decimal(0);

        for (const order of orders) {
            totalTax = totalTax.plus(order.totalTax);
            totalTaxableAmount = totalTaxableAmount.plus(order.totalNet);
        }

        return {
            period: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
            },
            totalTaxCollected: totalTax.toFixed(3),
            totalTaxableAmount: totalTaxableAmount.toFixed(3),
            taxRate: '15.00', // Saudi VAT rate
            transactionCount: orders.length,
        };
    }

    /**
     * Get register session summary
     */
    async getRegisterSummary(sessionId: string) {
        const session = await this.sessionRepo.findOne({
            where: { id: sessionId },
        });

        if (!session) {
            return null;
        }

        // Get payments for this session from orders
        const orders = await this.orderRepo.find({
            where: { registerSession: { id: sessionId } },
            relations: ['payments'],
        });

        // Calculate totals
        let totalSales = new Decimal(0);
        const paymentBreakdown: Record<string, string> = {};

        for (const order of orders) {
            if (order.payments) {
                for (const payment of order.payments) {
                    totalSales = totalSales.plus(payment.amount);
                    const method = payment.method || 'UNKNOWN';
                    paymentBreakdown[method] = new Decimal(paymentBreakdown[method] || 0)
                        .plus(payment.amount)
                        .toFixed(3);
                }
            }
        }

        return {
            sessionId: session.id,
            deviceId: session.deviceId,
            openedAt: session.openedAt,
            closedAt: session.closedAt,
            isOpen: session.isOpen,
            openingBalance: session.openingBalance,
            expectedBalance: session.expectedBalance,
            actualBalance: session.actualBalance,
            discrepancy: session.discrepancy,
            totalSales: totalSales.toFixed(3),
            paymentBreakdown,
        };
    }

    /**
     * Get profit margin analysis (simplified - needs COGS tracking)
     */
    async getProfitMargin(startDate: Date, endDate: Date) {
        const orders = await this.orderRepo.find({
            where: {
                createdAt: Between(startDate, endDate),
                status: OrderStatus.PAID,
            },
            relations: ['items'],
        });

        let totalRevenue = new Decimal(0);
        let totalCost = new Decimal(0);

        for (const order of orders) {
            totalRevenue = totalRevenue.plus(order.totalGross);

            // Sum up cost from order items
            for (const item of order.items) {
                totalCost = totalCost.plus(new Decimal(item.costAtSale).times(item.quantity));
            }
        }

        const grossProfit = totalRevenue.minus(totalCost);
        const profitMargin = totalRevenue.isZero()
            ? new Decimal(0)
            : grossProfit.dividedBy(totalRevenue).times(100);

        return {
            period: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
            },
            totalRevenue: totalRevenue.toFixed(3),
            totalCost: totalCost.toFixed(3),
            grossProfit: grossProfit.toFixed(3),
            profitMarginPercentage: profitMargin.toFixed(2),
        };
    }
}
