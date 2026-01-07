/**
 * Reports Service
 * Handles sales, void, and employee performance reports
 */
import { apiClient } from '@/lib/api-client';
import { ApiService } from '@/lib/api-service';
import type { ApiResponse, QueryParams } from '@/types/api.types';

// =============================================================================
// TYPES
// =============================================================================

export type ReportPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'PICKUP' | 'DRIVE_THRU';
export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE' | 'BANK_TRANSFER' | 'GIFT_CARD';

export interface SalesReportQuery extends QueryParams {
    storeId?: string;
    warehouseId?: string;
    fromDate?: string;
    toDate?: string;
    period?: ReportPeriod;
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
    paymentBreakdown: Record<PaymentMethod, number>;
    orderTypeBreakdown: Record<OrderType, number>;
    hourlyData?: HourlySalesData[];
    dailyData?: DailySalesData[];
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

export interface VoidReportQuery extends QueryParams {
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
    byUser: Array<{
        userId: string;
        userName: string;
        voidCount: number;
        voidValue: number;
    }>;
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
    voidedAt: string;
}

export interface VoidedOrderSummary {
    id: string;
    orderNumber: string;
    total: number;
    reason: string;
    voidedBy: string;
    voidedAt: string;
}

export interface EmployeePerformanceQuery extends QueryParams {
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
    hoursWorked: number;
}

export interface TopSellingItem {
    productId: string;
    productName: string;
    categoryName?: string;
    quantitySold: number;
    revenue: number;
}

// =============================================================================
// SERVICE
// =============================================================================

class ReportsService {
    private readonly baseUrl = '/api/v1/reports';

    // ==========================================================================
    // SALES REPORTS
    // ==========================================================================

    async getSalesReport(query: SalesReportQuery): Promise<SalesReport> {
        const response = await apiClient.get<ApiResponse<SalesReport>>(
            `${this.baseUrl}/sales`,
            { params: query }
        );
        return response.data.data;
    }

    async getTopSellingItems(
        query: SalesReportQuery & { limit?: number }
    ): Promise<TopSellingItem[]> {
        const response = await apiClient.get<ApiResponse<TopSellingItem[]>>(
            `${this.baseUrl}/sales/top-items`,
            { params: query }
        );
        return response.data.data;
    }

    // ==========================================================================
    // VOID REPORTS
    // ==========================================================================

    async getVoidReport(query: VoidReportQuery): Promise<VoidReport> {
        const response = await apiClient.get<ApiResponse<VoidReport>>(
            `${this.baseUrl}/voids`,
            { params: query }
        );
        return response.data.data;
    }

    // ==========================================================================
    // EMPLOYEE PERFORMANCE
    // ==========================================================================

    async getEmployeePerformance(query: EmployeePerformanceQuery): Promise<EmployeePerformance[]> {
        const response = await apiClient.get<ApiResponse<EmployeePerformance[]>>(
            `${this.baseUrl}/employees`,
            { params: query }
        );
        return response.data.data;
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const reportsService = new ReportsService();
