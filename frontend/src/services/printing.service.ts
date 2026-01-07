/**
 * Printing Service
 * Handles receipt printing and kitchen ticket dispatch
 */
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';

// =============================================================================
// TYPES
// =============================================================================

export type PrintJobType = 'RECEIPT' | 'KITCHEN_TICKET' | 'INVOICE' | 'TEST';
export type PrintJobStatus = 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface PrintJob {
    id: string;
    printerId: string;
    orderId?: string;
    type: PrintJobType;
    status: PrintJobStatus;
    retryCount: number;
    errorMessage?: string;
    createdAt: string;
    completedAt?: string;
}

export interface ReceiptData {
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    vatNumber?: string;
    orderNumber: string;
    orderDate: string;
    orderTime: string;
    cashierName: string;
    items: ReceiptItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    total: number;
    paymentMethod: string;
    amountPaid: number;
    change?: number;
    zatcaQrData?: string;
}

export interface ReceiptItem {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers?: Array<{ name: string; price: number }>;
}

export interface PrinterInfo {
    id: string;
    name: string;
    type: 'THERMAL_80MM' | 'THERMAL_58MM' | 'A4_LASER' | 'A4_INKJET';
    isDefault: boolean;
    isOnline: boolean;
}

// =============================================================================
// PRINTING SERVICE
// =============================================================================

class PrintingService {
    private readonly endpoint = '/api/v1/printing';

    /**
     * Print a receipt for an order
     */
    async printReceipt(orderId: string, printerId?: string): Promise<PrintJob> {
        const response = await apiClient.post<ApiResponse<PrintJob>>(
            `${this.endpoint}/receipt/${orderId}`,
            { printerId }
        );
        return response.data.data;
    }

    /**
     * Print a kitchen ticket for an order
     */
    async printKitchenTicket(
        orderId: string,
        station: 'KITCHEN' | 'BAR' | 'DESSERT',
        printerId?: string
    ): Promise<PrintJob> {
        const response = await apiClient.post<ApiResponse<PrintJob>>(
            `${this.endpoint}/kitchen-ticket/${orderId}`,
            { station, printerId }
        );
        return response.data.data;
    }

    /**
     * Print a test page
     */
    async printTestPage(printerId: string): Promise<PrintJob> {
        const response = await apiClient.post<ApiResponse<PrintJob>>(
            `${this.endpoint}/test`,
            { printerId }
        );
        return response.data.data;
    }

    /**
     * Get receipt data for an order (for preview or custom printing)
     */
    async getReceiptData(orderId: string): Promise<ReceiptData> {
        const response = await apiClient.get<ApiResponse<ReceiptData>>(
            `${this.endpoint}/receipt-data/${orderId}`
        );
        return response.data.data;
    }

    /**
     * Get print job status
     */
    async getJobStatus(jobId: string): Promise<PrintJob> {
        const response = await apiClient.get<ApiResponse<PrintJob>>(
            `${this.endpoint}/jobs/${jobId}`
        );
        return response.data.data;
    }

    /**
     * Get all print jobs for an order
     */
    async getOrderJobs(orderId: string): Promise<PrintJob[]> {
        const response = await apiClient.get<ApiResponse<PrintJob[]>>(
            `${this.endpoint}/orders/${orderId}/jobs`
        );
        return response.data.data;
    }

    /**
     * Cancel a print job
     */
    async cancelJob(jobId: string): Promise<void> {
        await apiClient.post(`${this.endpoint}/jobs/${jobId}/cancel`);
    }

    /**
     * Retry a failed print job
     */
    async retryJob(jobId: string): Promise<PrintJob> {
        const response = await apiClient.post<ApiResponse<PrintJob>>(
            `${this.endpoint}/jobs/${jobId}/retry`
        );
        return response.data.data;
    }

    /**
     * Get available printers
     */
    async getPrinters(): Promise<PrinterInfo[]> {
        const response = await apiClient.get<ApiResponse<PrinterInfo[]>>(
            `${this.endpoint}/printers`
        );
        return response.data.data;
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(printerId?: string): Promise<{
        queued: number;
        printing: number;
        completed: number;
        failed: number;
    }> {
        const response = await apiClient.get<ApiResponse<{
            queued: number;
            printing: number;
            completed: number;
            failed: number;
        }>>(`${this.endpoint}/stats`, { params: { printerId } });
        return response.data.data;
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const printingService = new PrintingService();
