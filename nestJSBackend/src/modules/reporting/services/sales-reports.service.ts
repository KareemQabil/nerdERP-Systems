import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SalesOrder, OrderStatus } from '../../sales/entities/sales-order.entity';
import { OrderItem } from '../../sales/entities/order-item.entity';
import { Payment } from '../../sales/entities/payment.entity';
import Decimal from 'decimal.js';

@Injectable()
export class SalesReportsService {
    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(OrderItem)
        private readonly itemRepo: Repository<OrderItem>,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
    ) { }

    /**
     * Get daily sales summary for a specific date
     */
    async getDailySales(date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await this.orderRepo.find({
            where: {
                createdAt: Between(startOfDay, endOfDay),
                status: OrderStatus.PAID,
            },
            relations: ['payments'],
        });

        let totalRevenue = new Decimal(0);
        let totalTax = new Decimal(0);
        let totalOrders = orders.length;
        const paymentMethods: Record<string, number> = {};

        for (const order of orders) {
            totalRevenue = totalRevenue.plus(order.totalGross);
            totalTax = totalTax.plus(order.totalTax);

            for (const payment of order.payments) {
                const method = payment.method || 'UNKNOWN';
                paymentMethods[method] = (paymentMethods[method] || 0) + parseFloat(payment.amount.toString());
            }
        }

        return {
            date: date.toISOString().split('T')[0],
            totalOrders,
            totalRevenue: totalRevenue.toFixed(3),
            totalTax: totalTax.toFixed(3),
            averageOrderValue: totalOrders > 0 ? totalRevenue.dividedBy(totalOrders).toFixed(3) : '0.000',
            paymentMethods,
        };
    }

    /**
     * Get top selling products for a date range
     */
    async getTopProducts(startDate: Date, endDate: Date, limit: number = 10) {
        const result = await this.itemRepo
            .createQueryBuilder('item')
            .select('item.product_name', 'productName')
            .addSelect('SUM(item.quantity)', 'totalQuantity')
            .addSelect('SUM(item.total)', 'totalRevenue')
            .addSelect('COUNT(DISTINCT item.order_id)', 'orderCount')
            .innerJoin('item.order', 'order')
            .where('order.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
            .andWhere('order.status = :status', { status: OrderStatus.PAID })
            .groupBy('item.product_name')
            .orderBy('totalRevenue', 'DESC')
            .limit(limit)
            .getRawMany();

        return result.map(item => ({
            productName: item.productName,
            quantitySold: parseFloat(item.totalQuantity),
            revenue: parseFloat(item.totalRevenue).toFixed(3),
            orderCount: parseInt(item.orderCount),
        }));
    }

    /**
     * Get hourly sales breakdown for a day
     */
    async getHourlySales(date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await this.orderRepo.find({
            where: {
                createdAt: Between(startOfDay, endOfDay),
                status: OrderStatus.PAID,
            },
        });

        const hourlyData: Record<number, { orders: number; revenue: string }> = {};

        // Initialize all hours
        for (let hour = 0; hour < 24; hour++) {
            hourlyData[hour] = { orders: 0, revenue: '0.000' };
        }

        // Aggregate by hour
        for (const order of orders) {
            const hour = order.createdAt.getHours();
            hourlyData[hour].orders++;
            hourlyData[hour].revenue = new Decimal(hourlyData[hour].revenue)
                .plus(order.totalGross)
                .toFixed(3);
        }

        return Object.entries(hourlyData).map(([hour, data]) => ({
            hour: parseInt(hour),
            orders: data.orders,
            revenue: data.revenue,
        }));
    }

    /**
     * Get sales by payment method for date range
     */
    async getPaymentMethodBreakdown(startDate: Date, endDate: Date) {
        const result = await this.paymentRepo
            .createQueryBuilder('payment')
            .select('payment.method', 'method')
            .addSelect('COUNT(*)', 'count')
            .addSelect('SUM(payment.amount)', 'totalAmount')
            .innerJoin('payment.order', 'order')
            .where('order.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
            .andWhere('order.status = :status', { status: OrderStatus.PAID })
            .groupBy('payment.method')
            .getRawMany();

        return result.map(item => ({
            method: item.method || 'UNKNOWN',
            transactionCount: parseInt(item.count),
            totalAmount: parseFloat(item.totalAmount).toFixed(3),
        }));
    }
}
