import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SalesOrder, OrderStatus } from '../../sales/entities/sales-order.entity';
import { OrderItem } from '../../sales/entities/order-item.entity';
import { VoidOperationService } from '../../sales/services/void-operation.service';

/**
 * Daily Tax Summary
 * Aggregated tax data for a single day
 */
export interface DailyTaxSummary {
    date: string;
    grossSales: number;
    vatAmount: number;
    netSales: number;
    orderCount: number;
    averageOrderValue: number;
    voidCount: number;
    voidAmount: number;
    vatRate: number;
}

/**
 * Monthly Tax Report
 * Aggregated tax data for a month
 */
export interface MonthlyTaxReport {
    year: number;
    month: number;
    grossSales: number;
    vatAmount: number;
    netSales: number;
    orderCount: number;
    voidCount: number;
    voidAmount: number;
    dailyBreakdown: DailyTaxSummary[];
}

/**
 * Tax Report Export Data
 * Format for ZATCA export
 */
export interface TaxExportData {
    vatNumber: string;
    companyName: string;
    periodStart: string;
    periodEnd: string;
    grossSales: number;
    vatAmount: number;
    netSales: number;
    invoiceCount: number;
    voidCount: number;
    generatedAt: string;
}

/**
 * Void Report Data
 * Tracks all void operations for audit
 */
export interface VoidReportData {
    date: string;
    voidCount: number;
    voidAmount: number;
    reasons: { reason: string; count: number; amount: number }[];
    voidedBy: { userId: string; userName: string; count: number }[];
}

/**
 * ZATCA Reporting Service
 *
 * Generates tax reports for Saudi Arabian tax compliance.
 *
 * Reports:
 * - Daily Tax Summary
 * - Monthly Tax Report
 * - Void Report
 * - ZATCA Export Format
 */
@Injectable()
export class ReportingService {
    private readonly STANDARD_VAT_RATE = 0.15; // 15% VAT in Saudi Arabia

    constructor(
        @InjectRepository(SalesOrder)
        private salesOrderRepo: Repository<SalesOrder>,
        @InjectRepository(OrderItem)
        private orderItemRepo: Repository<OrderItem>,
        private voidOperationService: VoidOperationService,
    ) { }

    /**
     * Generate daily tax summary
     *
     * @param date Date to generate summary for (defaults to today)
     * @returns Daily tax summary
     */
    async getDailyTaxSummary(date: Date = new Date()): Promise<DailyTaxSummary> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get completed orders for the day
        const completedOrders = await this.salesOrderRepo.find({
            where: {
                status: OrderStatus.COMPLETED,
                createdAt: Between(startOfDay, endOfDay),
            },
            relations: ['items'],
        });

        // Get voided orders for the day
        const voidedOrders = await this.salesOrderRepo.find({
            where: {
                status: OrderStatus.VOID,
                createdAt: Between(startOfDay, endOfDay),
            },
        });

        // Calculate totals
        const grossSales = completedOrders.reduce(
            (sum, order) => sum + order.totalNet,
            0,
        );
        const vatAmount = completedOrders.reduce(
            (sum, order) => sum + (order.totalTax || 0),
            0,
        );
        const netSales = grossSales - vatAmount;
        const orderCount = completedOrders.length;
        const averageOrderValue = orderCount > 0 ? grossSales / orderCount : 0;

        // Void calculations
        const voidCount = voidedOrders.length;
        const voidAmount = voidedOrders.reduce(
            (sum, order) => sum + order.totalNet,
            0,
        );

        return {
            date: startOfDay.toISOString().slice(0, 10),
            grossSales: this.roundToDecimals(grossSales, 2),
            vatAmount: this.roundToDecimals(vatAmount, 2),
            netSales: this.roundToDecimals(netSales, 2),
            orderCount,
            averageOrderValue: this.roundToDecimals(averageOrderValue, 2),
            voidCount,
            voidAmount: this.roundToDecimals(voidAmount, 2),
            vatRate: this.STANDARD_VAT_RATE,
        };
    }

    /**
     * Generate monthly tax report (OPTIMIZED)
     *
     * Uses a single aggregation query with GROUP BY instead of looping
     * through each day separately. Reduces query count from 62 to 2.
     *
     * @param year Year to generate report for
     * @param month Month (1-12)
     * @returns Monthly tax report with daily breakdown
     */
    async getMonthlyTaxReport(
        year: number,
        month: number,
    ): Promise<MonthlyTaxReport> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // OPTIMIZED: Single query with aggregation instead of 31 separate queries
        // This uses the composite index on (status, createdAt) for optimal performance
        const completedOrdersByDay = await this.salesOrderRepo
            .createQueryBuilder('order')
            .select('DATE(order.createdAt)', 'date')
            .addSelect('SUM(order.totalNet)', 'grossSales')
            .addSelect('SUM(order.totalTax)', 'vatAmount')
            .addSelect('COUNT(order.id)', 'orderCount')
            .where('order.status = :status', { status: OrderStatus.COMPLETED })
            .andWhere('order.createdAt >= :startDate', { startDate })
            .andWhere('order.createdAt <= :endDate', { endDate })
            .groupBy('DATE(order.createdAt)')
            .orderBy('DATE(order.createdAt)', 'ASC')
            .getRawMany();

        // Single query for voided orders with aggregation
        const voidedOrdersByDay = await this.salesOrderRepo
            .createQueryBuilder('order')
            .select('DATE(order.createdAt)', 'date')
            .addSelect('COUNT(order.id)', 'voidCount')
            .addSelect('SUM(order.totalNet)', 'voidAmount')
            .where('order.status = :status', { status: OrderStatus.VOID })
            .andWhere('order.createdAt >= :startDate', { startDate })
            .andWhere('order.createdAt <= :endDate', { endDate })
            .groupBy('DATE(order.createdAt)')
            .orderBy('DATE(order.createdAt)', 'ASC')
            .getRawMany();

        // Create a map for quick lookup
        const voidMap = new Map(
            voidedOrdersByDay.map(v => [v.date.slice(0, 10), { voidCount: parseInt(v.voidCount), voidAmount: parseFloat(v.voidAmount) }])
        );

        // Build daily breakdown combining both result sets
        const dailyBreakdown: DailyTaxSummary[] = [];
        let totalGrossSales = 0;
        let totalVatAmount = 0;
        let totalNetSales = 0;
        let totalOrderCount = 0;
        let totalVoidCount = 0;
        let totalVoidAmount = 0;

        // Fill in all days of the month (including days with no sales)
        const daysInMonth = endDate.getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const completedData = completedOrdersByDay.find(d => d.date.slice(0, 10) === dateStr);
            const voidData = voidMap.get(dateStr);

            const grossSales = completedData ? parseFloat(completedData.grossSales) : 0;
            const vatAmount = completedData ? parseFloat(completedData.vatAmount) : 0;
            const netSales = grossSales - vatAmount;
            const orderCount = completedData ? parseInt(completedData.orderCount) : 0;
            const averageOrderValue = orderCount > 0 ? grossSales / orderCount : 0;
            const voidCount = voidData?.voidCount || 0;
            const voidAmount = voidData?.voidAmount || 0;

            dailyBreakdown.push({
                date: dateStr,
                grossSales: this.roundToDecimals(grossSales, 2),
                vatAmount: this.roundToDecimals(vatAmount, 2),
                netSales: this.roundToDecimals(netSales, 2),
                orderCount,
                averageOrderValue: this.roundToDecimals(averageOrderValue, 2),
                voidCount,
                voidAmount: this.roundToDecimals(voidAmount, 2),
                vatRate: this.STANDARD_VAT_RATE,
            });

            totalGrossSales += grossSales;
            totalVatAmount += vatAmount;
            totalNetSales += netSales;
            totalOrderCount += orderCount;
            totalVoidCount += voidCount;
            totalVoidAmount += voidAmount;
        }

        return {
            year,
            month,
            grossSales: this.roundToDecimals(totalGrossSales, 2),
            vatAmount: this.roundToDecimals(totalVatAmount, 2),
            netSales: this.roundToDecimals(totalNetSales, 2),
            orderCount: totalOrderCount,
            voidCount: totalVoidCount,
            voidAmount: this.roundToDecimals(totalVoidAmount, 2),
            dailyBreakdown,
        };
    }

    /**
     * Generate void report
     *
     * @param startDate Start date
     * @param endDate End date
     * @returns Void report with breakdown by reason and user
     */
    async getVoidReport(
        startDate: Date,
        endDate: Date,
    ): Promise<VoidReportData[]> {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get voided orders
        const voidedOrders = await this.salesOrderRepo.find({
            where: {
                status: OrderStatus.VOID,
                createdAt: Between(startOfDay, endOfDay),
            },
        });

        // Group by date
        const voidByDate: Map<string, VoidReportData> = new Map();

        for (const order of voidedOrders) {
            const dateKey = order.createdAt.toISOString().slice(0, 10);

            if (!voidByDate.has(dateKey)) {
                voidByDate.set(dateKey, {
                    date: dateKey,
                    voidCount: 0,
                    voidAmount: 0,
                    reasons: [],
                    voidedBy: [],
                });
            }

            const report = voidByDate.get(dateKey)!;
            report.voidCount++;
            report.voidAmount += order.totalNet;

            // Group by reason
            const voidReason = order.voidReason || 'Unknown';
            const reasonEntry = report.reasons.find((r) => r.reason === voidReason);

            if (reasonEntry) {
                reasonEntry.count++;
                reasonEntry.amount += order.totalNet;
            } else {
                report.reasons.push({
                    reason: voidReason,
                    count: 1,
                    amount: order.totalNet,
                });
            }
        }

        return Array.from(voidByDate.values()).sort((a, b) =>
            a.date.localeCompare(b.date),
        );
    }

    /**
     * Generate ZATCA export data
     *
     * @param startDate Start date
     * @param endDate End date
     * @param vatNumber VAT registration number
     * @param companyName Company name
     * @returns Export data in ZATCA format
     */
    async getZatcaExportData(
        startDate: Date,
        endDate: Date,
        vatNumber: string,
        companyName: string,
    ): Promise<TaxExportData> {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get completed orders
        const completedOrders = await this.salesOrderRepo.find({
            where: {
                status: OrderStatus.COMPLETED,
                createdAt: Between(startOfDay, endOfDay),
            },
        });

        // Get voided orders
        const voidedOrders = await this.salesOrderRepo.find({
            where: {
                status: OrderStatus.VOID,
                createdAt: Between(startOfDay, endOfDay),
            },
        });

        // Calculate totals
        const grossSales = completedOrders.reduce(
            (sum, order) => sum + order.totalNet,
            0,
        );
        const vatAmount = completedOrders.reduce(
            (sum, order) => sum + (order.totalTax || 0),
            0,
        );
        const netSales = grossSales - vatAmount;
        const invoiceCount = completedOrders.length;
        const voidCount = voidedOrders.length;

        return {
            vatNumber,
            companyName,
            periodStart: startOfDay.toISOString().slice(0, 10),
            periodEnd: endOfDay.toISOString().slice(0, 10),
            grossSales: this.roundToDecimals(grossSales, 2),
            vatAmount: this.roundToDecimals(vatAmount, 2),
            netSales: this.roundToDecimals(netSales, 2),
            invoiceCount,
            voidCount,
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Get tax report by VAT rate
     * Useful for businesses with multiple VAT rates
     *
     * @param startDate Start date
     * @param endDate End date
     * @returns Tax breakdown by VAT rate
     */
    async getTaxByRate(
        startDate: Date,
        endDate: Date,
    ): Promise<{ vatRate: number; netSales: number; vatAmount: number }[]> {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        const completedOrders = await this.salesOrderRepo.find({
            where: {
                status: OrderStatus.COMPLETED,
                createdAt: Between(startOfDay, endOfDay),
            },
        });

        // Group by tax rate
        const taxByRate: Map<number, { netSales: number; vatAmount: number }> =
            new Map();

        for (const order of completedOrders) {
            const taxRate = this.STANDARD_VAT_RATE;
            const vatAmountVal = order.totalTax || 0;
            const netSales = order.totalNet - vatAmountVal;

            if (!taxByRate.has(taxRate)) {
                taxByRate.set(taxRate, { netSales: 0, vatAmount: 0 });
            }

            const entry = taxByRate.get(taxRate)!;
            entry.netSales += netSales;
            entry.vatAmount += vatAmountVal;
        }

        return Array.from(taxByRate.entries()).map(([vatRate, data]) => ({
            vatRate,
            netSales: this.roundToDecimals(data.netSales, 2),
            vatAmount: this.roundToDecimals(data.vatAmount, 2),
        }));
    }

    /**
     * Get item sales summary
     * Top-selling items for a period
     *
     * @param startDate Start date
     * @param endDate End date
     * @param limit Number of top items to return
     * @returns Top-selling items
     */
    async getTopItems(
        startDate: Date,
        endDate: Date,
        limit: number = 10,
    ): Promise<
        Array<{ productName: string; quantity: number; revenue: number }>
    > {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        const completedOrders = await this.salesOrderRepo.find({
            where: {
                status: OrderStatus.COMPLETED,
                createdAt: Between(startOfDay, endOfDay),
            },
            relations: ['items'],
        });

        // Aggregate by product
        const itemSales: Map<
            string,
            { quantity: number; revenue: number }
        > = new Map();

        for (const order of completedOrders) {
            for (const item of order.items) {
                const name = item.productName;
                if (!itemSales.has(name)) {
                    itemSales.set(name, { quantity: 0, revenue: 0 });
                }
                const entry = itemSales.get(name)!;
                entry.quantity += item.quantity;
                entry.revenue += item.total;
            }
        }

        // Sort by revenue and return top N
        return Array.from(itemSales.entries())
            .map(([productName, data]) => ({
                productName,
                quantity: data.quantity,
                revenue: this.roundToDecimals(data.revenue, 2),
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }

    /**
     * Round to specified decimal places
     */
    private roundToDecimals(value: number, decimals: number): number {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    /**
     * Validate date range
     */
    validateDateRange(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
        if (startDate > endDate) {
            return { valid: false, error: 'Start date must be before end date' };
        }

        const maxDays = 365; // Limit to 1 year
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > maxDays) {
            return { valid: false, error: `Date range cannot exceed ${maxDays} days` };
        }

        return { valid: true };
    }
}
