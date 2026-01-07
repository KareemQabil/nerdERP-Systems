import { apiClient } from '@/lib/api-client';

/**
 * ZATCA QR Code Data Structure
 */
export interface ZatcaQRData {
    seller: string;
    vatNo: string;
    timestamp: string;
    total: string;
    vat: string;
    encoded: string;
}

/**
 * Invoice Hash Entry
 */
export interface InvoiceHashEntry {
    id: string;
    orderId: string;
    invoiceHash: string;
    previousHash: string;
    invoiceNumber: string;
    createdAt: string;
}

/**
 * Daily Tax Summary
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
 * Void Report Data
 */
export interface VoidReportData {
    date: string;
    voidCount: number;
    voidAmount: number;
    reasons: { reason: string; count: number; amount: number }[];
    voidedBy: { userId: string; userName: string; count: number }[];
}

/**
 * Tax Export Data (ZATCA format)
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
 * Hash Chain Statistics
 */
export interface HashChainStats {
    totalInvoices: number;
    latestHash: string | null;
    oldestEntry: string | null;
    newestEntry: string | null;
}

/**
 * ZATCA Service
 *
 * Client for ZATCA compliance features.
 *
 * Features:
 * - QR code generation
 * - Invoice hash chain management
 * - Tax reports
 * - ZATCA export
 */
class ZatcaService {
    private readonly basePath = '/zatca';

    /**
     * Generate QR code for an invoice
     */
    async generateQRCode(data: {
        seller: string;
        vatNo: string;
        timestamp: string;
        total: string;
        vat: string;
    }): Promise<{ success: boolean; data?: ZatcaQRData; errors?: string[] }> {
        return apiClient.post(`${this.basePath}/qr`, data);
    }

    /**
     * Parse QR code
     */
    async parseQRCode(base64Data: string): Promise<{
        success: boolean;
        data?: ZatcaQRData;
        error?: string;
    }> {
        return apiClient.post(`${this.basePath}/qr/parse`, { base64Data });
    }

    /**
     * Create invoice hash entry
     */
    async createInvoiceHash(data: {
        orderId: string;
        invoiceNumber: string;
        timestamp: string;
        totalWithVat: string;
        vatAmount: string;
        vatNumber: string;
    }): Promise<{ success: boolean; data?: InvoiceHashEntry; errors?: string[] }> {
        return apiClient.post(`${this.basePath}/invoice-hash`, data);
    }

    /**
     * Get invoice hash by order ID
     */
    async getInvoiceHash(orderId: string): Promise<{
        success: boolean;
        data?: InvoiceHashEntry;
        error?: string;
    }> {
        return apiClient.get(`${this.basePath}/invoice-hash/${orderId}`);
    }

    /**
     * Verify hash chain integrity
     */
    async verifyHashChain(orderId: string): Promise<{
        success: boolean;
        data?: { valid: boolean; errors: string[] };
    }> {
        return apiClient.get(`${this.basePath}/verify-hash/${orderId}`);
    }

    /**
     * Get latest hash in chain
     */
    async getLatestHash(): Promise<{ success: boolean; data?: { latestHash: string } }> {
        return apiClient.get(`${this.basePath}/latest-hash`);
    }

    /**
     * Get hash chain statistics
     */
    async getHashChainStats(): Promise<{ success: boolean; data?: HashChainStats }> {
        return apiClient.get(`${this.basePath}/hash-stats`);
    }

    /**
     * Get daily tax summary
     */
    async getDailyReport(date?: string): Promise<{
        success: boolean;
        data?: DailyTaxSummary;
    }> {
        const params = date ? { date } : {};
        return apiClient.get(`${this.basePath}/daily-report`, { params });
    }

    /**
     * Get monthly tax report
     */
    async getMonthlyReport(
        year?: number,
        month?: number,
    ): Promise<{ success: boolean; data?: MonthlyTaxReport }> {
        const params: Record<string, number> = {};
        if (year !== undefined) params.year = year;
        if (month !== undefined) params.month = month;

        return apiClient.get(`${this.basePath}/monthly-report`, { params });
    }

    /**
     * Get void report
     */
    async getVoidReport(
        startDate: string,
        endDate: string,
    ): Promise<{ success: boolean; data?: VoidReportData[]; error?: string }> {
        return apiClient.get(`${this.basePath}/void-report`, {
            params: { startDate, endDate },
        });
    }

    /**
     * Get ZATCA export data
     */
    async getZatcaExport(
        startDate: string,
        endDate: string,
        vatNumber: string,
        companyName: string,
    ): Promise<{ success: boolean; data?: TaxExportData; error?: string }> {
        return apiClient.get(`${this.basePath}/export`, {
            params: { startDate, endDate, vatNumber, companyName },
        });
    }

    /**
     * Get tax by rate
     */
    async getTaxByRate(
        startDate: string,
        endDate: string,
    ): Promise<{ success: boolean; data?: Array<{ vatRate: number; netSales: number; vatAmount: number }> }> {
        return apiClient.get(`${this.basePath}/tax-by-rate`, {
            params: { startDate, endDate },
        });
    }

    /**
     * Get top items
     */
    async getTopItems(
        startDate: string,
        endDate: string,
        limit?: number,
    ): Promise<{
        success: boolean;
        data?: Array<{ productName: string; quantity: number; revenue: number }>;
    }> {
        const params: Record<string, string | number> = { startDate, endDate };
        if (limit !== undefined) params.limit = limit;

        return apiClient.get(`${this.basePath}/top-items`, { params });
    }

    /**
     * Generate invoice number
     */
    async generateInvoiceNumber(sequence?: number, date?: string): Promise<{
        success: boolean;
        data?: { invoiceNumber: string };
    }> {
        const body: Record<string, number | string> = {};
        if (sequence !== undefined) body.sequence = sequence;
        if (date !== undefined) body.date = date;

        return apiClient.post(`${this.basePath}/invoice-number`, body);
    }

    /**
     * Decode Base64 TLV string to readable format
     * Frontend utility for debugging QR codes
     */
    decodeTLV(base64Data: string): ZatcaQRData | null {
        try {
            const tlvString = atob(base64Data);
            const result: any = {};
            let index = 0;

            const tags: Record<string, string> = {
                '01': 'seller',
                '02': 'vatNo',
                '03': 'timestamp',
                '04': 'total',
                '05': 'vat',
            };

            while (index < tlvString.length) {
                const tag = tlvString.substring(index, index + 2);
                index += 2;

                const length = parseInt(tlvString.substring(index, index + 2));
                index += 2;

                const value = tlvString.substring(index, index + length);
                index += length;

                if (tags[tag]) {
                    result[tags[tag]] = value;
                }
            }

            return result as ZatcaQRData;
        } catch (error) {
            console.error('[ZatcaService] Failed to decode TLV:', error);
            return null;
        }
    }

    /**
     * Format currency for ZATCA reports (SAR)
     */
    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 2,
        }).format(amount);
    }

    /**
     * Format date for ZATCA reports
     */
    formatDate(date: string | Date): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return new Intl.DateTimeFormat('en-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(d);
    }

    /**
     * Export report data to CSV
     */
    exportToCSV(
        data: Record<string, any>[],
        filename: string,
    ): void {
        if (data.length === 0) {
            console.warn('[ZatcaService] No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map((row) =>
                headers.map((header) => {
                    const value = row[header];
                    // Escape values containing commas or quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value ?? '';
                }).join(','),
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const zatcaService = new ZatcaService();
export default zatcaService;
