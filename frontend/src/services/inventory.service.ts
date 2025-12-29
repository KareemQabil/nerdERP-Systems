/**
 * Inventory Service
 * API client for inventory management operations
 */
import { apiClient } from '@/lib/api-client';

// =============================================================================
// Types
// =============================================================================

export interface Warehouse {
    id: string;
    name: string;
    location?: string;
    isActive: boolean;
}

export interface InventoryBatch {
    id: string;
    productId: string;
    productName?: string;
    productSku?: string;
    warehouseId: string;
    warehouseName?: string;
    batchNumber?: string;
    qtyRemaining: string;
    costPerUnit: string;
    receivedDate: string;
    expiryDate?: string;
    qualityStatus: 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'QUARANTINE' | 'RETURNED';
    supplierId?: string;
    purchaseOrderId?: string;
}

export interface StockMove {
    id: string;
    productId: string;
    productName?: string;
    warehouseId: string;
    warehouseName?: string;
    batchId?: string;
    quantity: string;
    moveType: 'IN' | 'OUT' | 'ADJ';
    referenceType: 'SALE' | 'PO' | 'MANUAL' | 'WASTE' | 'RECIPE';
    referenceId?: string;
    costPerUnit?: string;
    createdAt: string;
}

export interface StockAlert {
    id: string;
    productId: string;
    productName?: string;
    warehouseId: string;
    alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
    threshold: string;
    currentQty: string;
    isAcknowledged: boolean;
    isResolved: boolean;
    createdAt: string;
}

export interface InventorySummary {
    productId: string;
    productName: string;
    productSku?: string;
    categoryName?: string;
    warehouseId: string;
    warehouseName: string;
    totalQty: string;
    avgCost: string;
    totalValue: string;
    batchCount: number;
    reorderLevel?: string;
    isLowStock: boolean;
    earliestExpiry?: string;
}

// DTOs
export interface AddStockDto {
    productId: string;
    warehouseId: string;
    quantity: number;
    costPrice: number;
    expiryDate?: string;
    batchNumber?: string;
    supplierId?: string;
    referenceType?: 'MANUAL' | 'PO';
    referenceId?: string;
}

export interface AdjustStockDto {
    productId: string;
    warehouseId: string;
    quantityChange: number; // Positive or negative
    reasonCode: string;
    notes?: string;
}

export interface StockAdjustmentLine {
    productId: string;
    systemQty: number;
    actualQty: number;
    reasonCode: string;
}

export interface CreateStockAdjustmentDto {
    warehouseId: string;
    lines: StockAdjustmentLine[];
    notes?: string;
}

export interface PurchaseInvoiceLine {
    productId: string;
    quantity: number;
    costPrice: number;
    expiryDate?: string;
}

export interface CreatePurchaseInvoiceDto {
    supplierId?: string;
    invoiceNumber: string;
    invoiceDate: string;
    warehouseId: string;
    lines: PurchaseInvoiceLine[];
    notes?: string;
}

// Filters
export interface BatchFilters {
    warehouseId?: string;
    productId?: string;
    qualityStatus?: string;
    expiringWithinDays?: number;
    page?: number;
    limit?: number;
}

export interface StockMoveFilters {
    warehouseId?: string;
    productId?: string;
    moveType?: 'IN' | 'OUT' | 'ADJ';
    referenceType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

// =============================================================================
// Service
// =============================================================================

class InventoryServiceClass {
    private readonly baseUrl = '/api/v1';

    // =========================================================================
    // Warehouses
    // =========================================================================

    async getWarehouses(): Promise<Warehouse[]> {
        const response = await apiClient.get(`${this.baseUrl}/warehouses`);
        return response.data?.data || response.data || [];
    }

    async getWarehouseById(id: string): Promise<Warehouse> {
        const response = await apiClient.get(`${this.baseUrl}/warehouses/${id}`);
        return response.data?.data || response.data;
    }

    // =========================================================================
    // Inventory Summary
    // =========================================================================

    async getInventorySummary(warehouseId?: string): Promise<InventorySummary[]> {
        const params = warehouseId ? { warehouseId } : {};
        const response = await apiClient.get(`${this.baseUrl}/inventory/summary`, { params });
        return response.data?.data || response.data || [];
    }

    // =========================================================================
    // Batches
    // =========================================================================

    async getBatches(filters: BatchFilters = {}): Promise<InventoryBatch[]> {
        const response = await apiClient.get(`${this.baseUrl}/inventory/batches`, { params: filters });
        return response.data?.data || response.data || [];
    }

    async getBatchById(id: string): Promise<InventoryBatch> {
        const response = await apiClient.get(`${this.baseUrl}/inventory/batches/${id}`);
        return response.data?.data || response.data;
    }

    // =========================================================================
    // Stock Moves
    // =========================================================================

    async getStockMoves(filters: StockMoveFilters = {}): Promise<StockMove[]> {
        const params: Record<string, string> = {};
        if (filters.warehouseId) params.warehouseId = filters.warehouseId;
        if (filters.productId) params.productId = filters.productId;

        const response = await apiClient.get(`${this.baseUrl}/stock-moves`, { params });
        return response.data?.data || response.data || [];
    }

    // =========================================================================
    // Stock Operations
    // =========================================================================

    async addStock(dto: AddStockDto): Promise<InventoryBatch> {
        const response = await apiClient.post(`${this.baseUrl}/inventory/add`, dto);
        return response.data?.data || response.data;
    }

    async deductStock(productId: string, warehouseId: string, quantity: number, referenceType?: string, referenceId?: string): Promise<StockMove[]> {
        const response = await apiClient.post(`${this.baseUrl}/inventory/deduct`, {
            productId,
            warehouseId,
            quantity,
            referenceType: referenceType || 'MANUAL',
            referenceId,
        });
        return response.data?.data || response.data || [];
    }

    // =========================================================================
    // Stock Alerts
    // =========================================================================

    async getActiveAlerts(): Promise<StockAlert[]> {
        const response = await apiClient.get(`${this.baseUrl}/inventory/alerts`);
        return response.data?.data || response.data || [];
    }

    async acknowledgeAlert(alertId: string, userId: string): Promise<StockAlert> {
        const response = await apiClient.post(`${this.baseUrl}/inventory/alerts/${alertId}/acknowledge`, { userId });
        return response.data?.data || response.data;
    }

    async resolveAlert(alertId: string): Promise<StockAlert> {
        const response = await apiClient.post(`${this.baseUrl}/inventory/alerts/${alertId}/resolve`);
        return response.data?.data || response.data;
    }

    // =========================================================================
    // Stock Adjustment
    // =========================================================================

    async createAdjustment(dto: CreateStockAdjustmentDto): Promise<void> {
        await apiClient.post(`${this.baseUrl}/inventory/adjustments`, dto);
    }

    // =========================================================================
    // Purchase Invoice
    // =========================================================================

    async createPurchaseInvoice(dto: CreatePurchaseInvoiceDto): Promise<{ id: string }> {
        const response = await apiClient.post(`${this.baseUrl}/purchases`, dto);
        return response.data?.data || response.data;
    }

    async receivePurchaseInvoice(invoiceId: string): Promise<void> {
        await apiClient.post(`${this.baseUrl}/purchases/${invoiceId}/receive`);
    }
}

// Export singleton instance
export const inventoryService = new InventoryServiceClass();
