import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

import { SalesOrder, OrderStatus } from '../../sales/entities/sales-order.entity';
import { OrderItem } from '../../sales/entities/order-item.entity';
import { Payment } from '../../sales/entities/payment.entity';

// =============================================================================
// DTOs
// =============================================================================

export interface SalesReportQuery {
    storeId?: string;
    warehouseId?: string;
    fromDate?: string;
    toDate?: string;
    period?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface SalesReport {
    period: string;
    grossSales: number;
    netSales: number;
    discounts: number;
    taxes: number;
    refunds: number;
    orderCount: number;
    avgTicketSize: number;
    paymentBreakdown: PaymentBreakdown;
    orderTypeBreakdown: OrderTypeBreakdown;
    hourlyData?: HourlySalesData[];
    dailyData?: DailySalesData[];
}

export interface PaymentBreakdown {
    CASH: number;
    CARD: number;
    MOBILE: number;
    BANK_TRANSFER: number;
    GIFT_CARD: number;
}

export interface OrderTypeBreakdown {
    DINE_IN: number;
    TAKEAWAY: number;
    DELIVERY: number;
    PICKUP: number;
    DRIVE_THRU: number;
}

export interface HourlySalesData {
    hour: number;
    sales: number;
    orders: number;
}

export interface DailySalesData {
    date: string;
    sales: number;
    orders: number;
}

export interface VoidReportQuery {
    storeId?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
}

export interface VoidReport {
    voidedItems: VoidedItemSummary[];
    voidedOrders: VoidedOrderSummary[];
    totalVoidValue: number;
    byReason: Record<string, number>;
    byUser: Array<{ userId: string; userName: string; voidCount: number; voidValue: number }>;
}

export interface VoidedItemSummary {
    id: string;
    orderId: string;
    orderNumber: string;
    itemId: string;
    productName: string;
    quantity: number;
    lineTotal: number;
    reason: string;
    voidedBy: string;
    voidedAt: Date;
}

export interface VoidedOrderSummary {
    id: string;
    orderNumber: string;
    total: number;
    reason: string;
    voidedBy: string;
    voidedAt: Date;
}

export interface EmployeePerformanceQuery {
    storeId?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
}

export interface EmployeePerformance {
    userId: string;
    userName: string;
    role: string;
    ordersProcessed: number;
    avgOrderValue: number;
    totalSales: number;
    voidCount: number;
    voidRate: number;
    discountCount: number;
    discountTotal: number;
    hoursWorked: number; // If tracking shift data
}

// =============================================================================
// SERVICE
// =============================================================================

@Injectable()
export class SalesReportService {
    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepository: Repository<SalesOrder>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
    ) { }

    // ==========================================================================
    // SALES REPORT
    // ==========================================================================

    async getSalesReport(query: SalesReportQuery): Promise<SalesReport> {
        const { fromDate, toDate, period = 'daily', storeId } = query;

        const startDate = fromDate
            ? startOfDay(new Date(fromDate))
            : startOfDay(subDays(new Date(), 30));
        const endDate = toDate ? endOfDay(new Date(toDate)) : endOfDay(new Date());

        // Get orders in date range
        const orders = await this.orderRepository.find({
            where: {
                ...(storeId && { storeId: { id: storeId } }),
                status: In(['COMPLETED', 'READY']),
                createdAt: Between(startDate, endDate),
            },
            relations: ['items', 'payments', 'createdBy'],
        });

        // Calculate totals
        const grossSales = orders.reduce((sum, o) => sum + parseFloat(String(o.totalGross)), 0);
        const discounts = orders.reduce((sum, o) => sum + parseFloat(String(o.discountAmount || 0)), 0);
        const taxes = orders.reduce((sum, o) => sum + parseFloat(String(o.totalTax)), 0);
        const netSales = grossSales - discounts + taxes;

        // Calculate refunds
        const refunds = orders
            .filter((o) => o.status === 'VOID')
            .reduce((sum, o) => sum + parseFloat(String(o.totalNet)), 0);

        const orderCount = orders.length;
        const avgTicketSize = orderCount > 0 ? netSales / orderCount : 0;

        // Payment breakdown
        const paymentBreakdown = this.calculatePaymentBreakdown(orders);

        // Order type breakdown
        const orderTypeBreakdown = this.calculateOrderTypeBreakdown(orders);

        // Time-based data
        let hourlyData: HourlySalesData[] | undefined;
        let dailyData: DailySalesData[] | undefined;

        if (period === 'hourly' && fromDate === toDate) {
            hourlyData = await this.calculateHourlyData(orders, startDate);
        } else {
            dailyData = await this.calculateDailyData(orders, startDate, endDate);
        }

        return {
            period: `${format(startDate, 'yyyy-MM-dd')} - ${format(endDate, 'yyyy-MM-dd')}`,
            grossSales,
            netSales,
            discounts,
            taxes,
            refunds,
            orderCount,
            avgTicketSize,
            paymentBreakdown,
            orderTypeBreakdown,
            hourlyData,
            dailyData,
        };
    }

    private calculatePaymentBreakdown(orders: SalesOrder[]): PaymentBreakdown {
        const breakdown: PaymentBreakdown = {
            CASH: 0,
            CARD: 0,
            MOBILE: 0,
            BANK_TRANSFER: 0,
            GIFT_CARD: 0,
        };

        for (const order of orders) {
            for (const payment of order.payments) {
                const amount = parseFloat(String(payment.amount));
                breakdown[payment.method] = (breakdown[payment.method] || 0) + amount;
            }
        }

        return breakdown;
    }

    private calculateOrderTypeBreakdown(orders: SalesOrder[]): OrderTypeBreakdown {
        const breakdown: OrderTypeBreakdown = {
            DINE_IN: 0,
            TAKEAWAY: 0,
            DELIVERY: 0,
            PICKUP: 0,
            DRIVE_THRU: 0,
        };

        for (const order of orders) {
            const total = parseFloat(String(order.totalNet));
            breakdown[order.orderType] = (breakdown[order.orderType] || 0) + total;
        }

        return breakdown;
    }

    private async calculateHourlyData(orders: SalesOrder[], date: Date): Promise<HourlySalesData[]> {
        const hourlyData: HourlySalesData[] = [];

        for (let hour = 0; hour < 24; hour++) {
            const hourOrders = orders.filter((o) => {
                const orderHour = new Date(o.createdAt).getHours();
                return orderHour === hour;
            });

            hourlyData.push({
                hour,
                sales: hourOrders.reduce((sum, o) => sum + parseFloat(String(o.totalNet)), 0),
                orders: hourOrders.length,
            });
        }

        return hourlyData;
    }

    private async calculateDailyData(orders: SalesOrder[], startDate: Date, endDate: Date): Promise<DailySalesData[]> {
        const dailyMap = new Map<string, { sales: number; orders: number }>();

        for (const order of orders) {
            const dateKey = format(new Date(order.createdAt), 'yyyy-MM-dd');
            const current = dailyMap.get(dateKey) || { sales: 0, orders: 0 };
            current.sales += parseFloat(String(order.totalNet));
            current.orders += 1;
            dailyMap.set(dateKey, current);
        }

        // Fill in missing dates
        const dailyData: DailySalesData[] = [];
        let currentDate = startDate;
        while (currentDate <= endDate) {
            const dateKey = format(currentDate, 'yyyy-MM-dd');
            const data = dailyMap.get(dateKey) || { sales: 0, orders: 0 };
            dailyData.push({
                date: dateKey,
                sales: data.sales,
                orders: data.orders,
            });
            currentDate = new Date(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dailyData;
    }

    // ==========================================================================
    // VOID REPORT
    // ==========================================================================

    async getVoidReport(query: VoidReportQuery): Promise<VoidReport> {
        const { fromDate, toDate, storeId, userId } = query;

        const startDate = fromDate
            ? startOfDay(new Date(fromDate))
            : startOfDay(subDays(new Date(), 7));
        const endDate = toDate ? endOfDay(new Date(toDate)) : endOfDay(new Date());

        // Get voided orders
        const voidedOrders = await this.orderRepository.find({
            where: {
                ...(storeId && { storeId: { id: storeId } }),
                ...(userId && { createdBy: { id: userId } }),
                status: OrderStatus.VOID,
                createdAt: Between(startDate, endDate),
            },
            relations: ['createdBy', 'items'],
        });

        // Get voided items from non-voided orders
        const voidedItems = await this.orderItemRepository
            .createQueryBuilder('item')
            .leftJoin('item.order', 'order')
            .leftJoin('order.createdBy', 'user')
            .where('item.isVoided = :isVoided', { isVoided: true })
            .andWhere('order.createdAt BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .andWhere(storeId ? 'order.storeId = :storeId' : '1=1', { storeId })
            .andWhere(userId ? 'order.createdBy = :userId' : '1=1', { userId })
            .select([
                'item.id',
                'item.orderId',
                'item.productId',
                'item.productName',
                'item.quantity',
                'item.lineTotal',
                'item.voidReason',
                'item.voidedAt',
                'order.orderNumber',
                'user.id',
                'user.fullName',
            ])
            .getMany();

        const totalVoidValue =
            voidedOrders.reduce((sum, o) => sum + parseFloat(String(o.totalNet)), 0) +
            voidedItems.reduce((sum, i) => sum + parseFloat(String((i as any).lineTotal || 0)), 0);

        // Group by reason
        const byReason: Record<string, number> = {};
        for (const order of voidedOrders) {
            const reason = order.voidReason || 'No reason';
            byReason[reason] = (byReason[reason] || 0) + parseFloat(String(order.totalNet));
        }
        for (const item of voidedItems) {
            const reason = (item as any).voidReason || 'No reason';
            byReason[reason] = (byReason[reason] || 0) + parseFloat(String((item as any).lineTotal || 0));
        }

        // Group by user
        const byUserMap = new Map<
            string,
            { userId: string; userName: string; voidCount: number; voidValue: number }
        >();

        for (const order of voidedOrders) {
            const userId = (order as any).createdBy?.id || 'unknown';
            const userName = (order as any).createdBy?.fullName || 'Unknown';
            const current = byUserMap.get(userId) || {
                userId,
                userName,
                voidCount: 0,
                voidValue: 0,
            };
            current.voidCount += 1;
            current.voidValue += parseFloat(String(order.totalNet));
            byUserMap.set(userId, current);
        }

        const byUser = Array.from(byUserMap.values());

        return {
            voidedItems: voidedItems.map((item) => ({
                id: item.id,
                orderId: (item as any).orderId || item.order?.id || '',
                orderNumber: (item as any).orderNumber || 'N/A',
                itemId: (item as any).productId || item.product?.id || '',
                productName: (item as any).productName || item.product?.name || 'Unknown',
                quantity: parseFloat(String(item.quantity)),
                lineTotal: parseFloat(String((item as any).lineTotal || 0)),
                reason: (item as any).voidReason || 'No reason',
                voidedBy: (item as any).user?.fullName || 'Unknown',
                voidedAt: item.voidedAt || new Date(),
            })),
            voidedOrders: voidedOrders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                total: parseFloat(String(order.totalNet)),
                reason: order.voidReason || 'No reason',
                voidedBy: (order as any).createdBy?.fullName || 'Unknown',
                voidedAt: order.updatedAt,
            })),
            totalVoidValue,
            byReason,
            byUser,
        };
    }

    // ==========================================================================
    // EMPLOYEE PERFORMANCE
    // ==========================================================================

    async getEmployeePerformance(query: EmployeePerformanceQuery): Promise<EmployeePerformance[]> {
        const { fromDate, toDate, storeId, userId } = query;

        const startDate = fromDate
            ? startOfDay(new Date(fromDate))
            : startOfDay(subDays(new Date(), 7));
        const endDate = toDate ? endOfDay(new Date(toDate)) : endOfDay(new Date());

        // Get all completed orders in period
        const orders = await this.orderRepository.find({
            where: {
                ...(storeId && { storeId: { id: storeId } }),
                ...(userId && { createdBy: { id: userId } }),
                status: In(['COMPLETED', 'READY', 'VOID']),
                createdAt: Between(startDate, endDate),
            },
            relations: ['createdBy', 'items', 'payments'],
        });

        // Group by user
        const userMap = new Map<
            string,
            {
                userId: string;
                userName: string;
                role: string;
                ordersProcessed: number;
                totalSales: number;
                voidCount: number;
                voidValue: number;
                discountCount: number;
                discountTotal: number;
            }
        >();

        for (const order of orders) {
            const userId = (order as any).createdBy?.id || 'unknown';
            const userName = (order as any).createdBy?.fullName || 'Unknown';
            const role = (order as any).createdBy?.role || 'STAFF';

            const current = userMap.get(userId) || {
                userId,
                userName,
                role,
                ordersProcessed: 0,
                totalSales: 0,
                voidCount: 0,
                voidValue: 0,
                discountCount: 0,
                discountTotal: 0,
            };

            current.ordersProcessed += 1;

            if (order.status === 'VOID') {
                current.voidCount += 1;
                current.voidValue += parseFloat(String(order.totalNet));
            } else {
                current.totalSales += parseFloat(String(order.totalNet));
            }

            if (order.discountAmount && parseFloat(String(order.discountAmount)) > 0) {
                current.discountCount += 1;
                current.discountTotal += parseFloat(String(order.discountAmount));
            }

            userMap.set(userId, current);
        }

        // Calculate averages
        return Array.from(userMap.values()).map((user) => ({
            userId: user.userId,
            userName: user.userName,
            role: user.role,
            ordersProcessed: user.ordersProcessed,
            totalSales: user.totalSales,
            avgOrderValue: user.ordersProcessed > 0 ? user.totalSales / user.ordersProcessed : 0,
            voidCount: user.voidCount,
            voidValue: user.voidValue,
            voidRate: user.ordersProcessed > 0 ? (user.voidCount / user.ordersProcessed) * 100 : 0,
            discountCount: user.discountCount,
            discountTotal: user.discountTotal,
            hoursWorked: 0, // Would need shift tracking data
        }));
    }

    // ==========================================================================
    // TOP SELLING ITEMS
    // ==========================================================================

    async getTopSellingItems(
        query: SalesReportQuery & { limit?: number }
    ): Promise<
        Array<{
            productId: string;
            productName: string;
            categoryName?: string;
            quantitySold: number;
            revenue: number;
        }>
    > {
        const { fromDate, toDate, storeId, limit = 20 } = query;

        const startDate = fromDate
            ? startOfDay(new Date(fromDate))
            : startOfDay(subDays(new Date(), 30));
        const endDate = toDate ? endOfDay(new Date(toDate)) : endOfDay(new Date());

        const items = await this.orderItemRepository
            .createQueryBuilder('item')
            .leftJoin('item.order', 'order')
            .where('order.status IN (:...statuses)', { statuses: ['COMPLETED', 'READY'] })
            .andWhere('order.createdAt BETWEEN :start AND :end', {
                start: startDate,
                end: endDate,
            })
            .andWhere(storeId ? 'order.storeId = :storeId' : '1=1', { storeId })
            .select([
                'item.productId',
                'item.productName',
                'SUM(item.quantity) as quantitySold',
                'SUM(item.lineTotal) as revenue',
            ])
            .groupBy('item.productId, item.productName')
            .orderBy('revenue', 'DESC')
            .limit(limit)
            .getRawMany();

        return items.map((item) => ({
            productId: item.item_productId,
            productName: item.item_productName,
            quantitySold: parseFloat(item.quantitySold),
            revenue: parseFloat(item.revenue),
        }));
    }
}
