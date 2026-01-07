/**
 * Reports Store
 * State management for reports and analytics
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { reportsService } from '@/services/reports.service';
import type {
    SalesReport,
    VoidReport,
    EmployeePerformance,
    TopSellingItem,
    SalesReportQuery,
    VoidReportQuery,
    EmployeePerformanceQuery,
} from '@/services/reports.service';

// =============================================================================
// TYPES
// =============================================================================

interface ReportsState {
    // Sales report
    salesReport: SalesReport | null;
    salesReportLoading: boolean;
    salesReportError: string | null;
    topSellingItems: TopSellingItem[];
    topItemsLoading: boolean;

    // Void report
    voidReport: VoidReport | null;
    voidReportLoading: boolean;
    voidReportError: string | null;

    // Employee performance
    employeePerformance: EmployeePerformance[];
    employeePerformanceLoading: boolean;
    employeePerformanceError: string | null;

    // Current query
    currentQuery: {
        sales: SalesReportQuery;
        voids: VoidReportQuery;
        employees: EmployeePerformanceQuery;
    };

    // Actions
    fetchSalesReport: (query: SalesReportQuery) => Promise<void>;
    fetchTopSellingItems: (query: SalesReportQuery & { limit?: number }) => Promise<void>;
    fetchVoidReport: (query: VoidReportQuery) => Promise<void>;
    fetchEmployeePerformance: (query: EmployeePerformanceQuery) => Promise<void>;
    clearReports: () => void;
}

// =============================================================================
// DEFAULT QUERIES
// =============================================================================

const getDefaultSalesQuery = (): SalesReportQuery => ({
    period: 'daily',
    // Default to last 30 days - set by caller
});

const getDefaultVoidQuery = (): VoidReportQuery => ({
    // Default to last 7 days - set by caller
});

const getDefaultEmployeeQuery = (): EmployeePerformanceQuery => ({
    // Default to last 7 days - set by caller
});

// =============================================================================
// STORE
// =============================================================================

export const useReportsStore = create<ReportsState>()(
    devtools((set, get) => ({
        // Initial state
        salesReport: null,
        salesReportLoading: false,
        salesReportError: null,
        topSellingItems: [],
        topItemsLoading: false,
        voidReport: null,
        voidReportLoading: false,
        voidReportError: null,
        employeePerformance: [],
        employeePerformanceLoading: false,
        employeePerformanceError: null,
        currentQuery: {
            sales: getDefaultSalesQuery(),
            voids: getDefaultVoidQuery(),
            employees: getDefaultEmployeeQuery(),
        },

        // =====================================================================
        // SALES REPORT
        // =====================================================================

        fetchSalesReport: async (query) => {
            set({ salesReportLoading: true, salesReportError: null });
            try {
                const report = await reportsService.getSalesReport(query);
                set({
                    salesReport: report,
                    salesReportLoading: false,
                    currentQuery: { ...get().currentQuery, sales: query },
                });
            } catch (error) {
                set({
                    salesReportLoading: false,
                    salesReportError: error instanceof Error ? error.message : 'Failed to fetch sales report',
                });
            }
        },

        fetchTopSellingItems: async (query) => {
            set({ topItemsLoading: true });
            try {
                const items = await reportsService.getTopSellingItems(query);
                set({ topSellingItems: items, topItemsLoading: false });
            } catch (error) {
                console.error('[ReportsStore] Failed to fetch top items:', error);
                set({ topItemsLoading: false });
            }
        },

        // =====================================================================
        // VOID REPORT
        // =====================================================================

        fetchVoidReport: async (query) => {
            set({ voidReportLoading: true, voidReportError: null });
            try {
                const report = await reportsService.getVoidReport(query);
                set({
                    voidReport: report,
                    voidReportLoading: false,
                    currentQuery: { ...get().currentQuery, voids: query },
                });
            } catch (error) {
                set({
                    voidReportLoading: false,
                    voidReportError: error instanceof Error ? error.message : 'Failed to fetch void report',
                });
            }
        },

        // =====================================================================
        // EMPLOYEE PERFORMANCE
        // =====================================================================

        fetchEmployeePerformance: async (query) => {
            set({ employeePerformanceLoading: true, employeePerformanceError: null });
            try {
                const performance = await reportsService.getEmployeePerformance(query);
                set({
                    employeePerformance: performance,
                    employeePerformanceLoading: false,
                    currentQuery: { ...get().currentQuery, employees: query },
                });
            } catch (error) {
                set({
                    employeePerformanceLoading: false,
                    employeePerformanceError: error instanceof Error ? error.message : 'Failed to fetch employee performance',
                });
            }
        },

        // =====================================================================
        // CLEAR
        // =====================================================================

        clearReports: () => {
            set({
                salesReport: null,
                salesReportError: null,
                voidReport: null,
                voidReportError: null,
                employeePerformance: [],
                employeePerformanceError: null,
            });
        },
    }))
);
