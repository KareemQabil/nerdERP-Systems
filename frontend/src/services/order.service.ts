/**
 * Order Service
 * Handles order creation, management, and payment operations
 * with offline queuing support
 */
import { apiClient } from '@/lib/api-client';
import { ApiService } from '@/lib/api-service';
import type { ApiResponse, PaginatedResult, QueryParams } from '@/types/api.types';
import { offlineStorage } from '@/lib/offline-storage';

// =============================================================================
// TYPES - Single Source of Truth from @/types/pos.types.ts
// =============================================================================

// Import and re-export common types from the centralized type definitions
import type { OrderType, OrderStatus, PaymentStatus, PaymentMethod } from '@/types/pos.types';
export type { OrderType, OrderStatus, PaymentStatus, PaymentMethod };

export interface Order {
    id: string;
    orderNumber: string;
    invoiceNumber?: string;
    orderType: OrderType;
    status: OrderStatus;
    paymentStatus: PaymentStatus;

    // Customer
    customerId?: string;
    customerName?: string;

    // Table (for dine-in)
    tableId?: string;
    tableName?: string;

    // Items
    items: OrderItem[];

    // Totals
    subtotal: string;
    discountTotal: string;
    taxTotal: string;
    total: string;

    // Payments
    payments: Payment[];
    amountPaid: string;
    amountDue: string;

    // Discount
    discount?: OrderDiscount;

    // Notes
    notes?: string;

    // Metadata
    registerSessionId?: string;
    createdBy: string;
    createdAt: string;
    completedAt?: string;

    // ZATCA
    invoiceHash?: string;
    previousHash?: string;
    zatcaQrCode?: string;
    zatcaUuid?: string;
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    productNameAr?: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
    modifiers?: OrderItemModifier[];
    notes?: string;
    kitchenStatus?: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
}

export interface OrderItemModifier {
    id: string;
    modifierId: string;
    modifierName: string;
    modifierNameAr?: string;
    price: string;
    quantity: number;
}

export interface Payment {
    id: string;
    orderId: string;
    method: PaymentMethod;
    amount: string;
    reference?: string;
    processedAt: string;
}

export interface OrderDiscount {
    type: 'PERCENT' | 'FIXED';
    value: string;
    reason?: string;
    authorizedBy?: string;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CreateOrderDto {
    orderType: OrderType;
    customerId?: string;
    tableId?: string;
    items: CreateOrderItemDto[];
    notes?: string;
    discount?: OrderDiscount;
}

export interface CreateOrderItemDto {
    productId: string;
    quantity: string;
    modifiers?: { modifierId: string; quantity: number }[];
    notes?: string;
}

export interface AddPaymentDto {
    method: PaymentMethod;
    amount: string;
    reference?: string;
}

export interface UpdateOrderDto {
    orderType?: OrderType;
    customerId?: string;
    tableId?: string;
    notes?: string;
    discount?: OrderDiscount;
}

// =============================================================================
// ORDER SERVICE
// =============================================================================

class OrderService extends ApiService<Order, CreateOrderDto, UpdateOrderDto> {
    private isOnline: boolean = true;

    constructor() {
        super({ endpoint: '/api/v1/sales/orders', cacheKey: 'orders' });
        this.initializeNetworkMonitoring();
    }

    // ========================================================================
    // NETWORK MONITORING
    // ========================================================================

    private initializeNetworkMonitoring() {
        if (typeof window === 'undefined') return;

        this.isOnline = navigator.onLine;
        window.addEventListener('online', () => { this.isOnline = true; });
        window.addEventListener('offline', () => { this.isOnline = false; });
    }

    /**
     * Get orders with filters
     */
    async getOrders(params?: QueryParams & {
        status?: OrderStatus;
        paymentStatus?: PaymentStatus;
        orderType?: OrderType;
        fromDate?: string;
        toDate?: string;
    }): Promise<PaginatedResult<Order>> {
        return this.findAll(params);
    }

    /**
     * Get today's orders
     */
    async getTodayOrders(): Promise<Order[]> {
        const today = new Date().toISOString().split('T')[0];
        const result = await this.getOrders({
            fromDate: today,
            limit: 100,
            order: 'DESC'
        });
        return result.data;
    }

    /**
     * Get order with full details
     */
    async getOrderDetails(orderId: string): Promise<Order> {
        const response = await apiClient.get<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}`,
            { params: { include: 'items,payments,customer' } }
        );
        return response.data.data;
    }

    // =========================================================================
    // ORDER ITEM OPERATIONS
    // =========================================================================

    /**
     * Add item to order
     */
    async addItem(orderId: string, item: CreateOrderItemDto): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/items`,
            item
        );
        return response.data.data;
    }

    /**
     * Update item quantity
     */
    async updateItem(orderId: string, itemId: string, quantity: string): Promise<Order> {
        const response = await apiClient.patch<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/items/${itemId}`,
            { quantity }
        );
        return response.data.data;
    }

    /**
     * Remove item from order
     */
    async removeItem(orderId: string, itemId: string, reason?: string): Promise<Order> {
        const response = await apiClient.delete<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/items/${itemId}`,
            { data: { reason } }
        );
        return response.data.data;
    }

    /**
     * Void item (requires manager PIN authorization)
     *
     * Backend validates PIN via PinAuthorizationGuard
     * Inventory is automatically restored for products that track inventory
     *
     * @param orderId - The order ID
     * @param itemId - The item ID to void
     * @param pin - Manager PIN for authorization
     * @param reason - Reason for voiding (required for audit trail)
     */
    async voidItem(orderId: string, itemId: string, pin: string, reason: string): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/items/${itemId}/void`,
            { pin, reason }
        );
        return response.data.data;
    }

    // =========================================================================
    // PAYMENT OPERATIONS
    // =========================================================================

    /**
     * Add payment to order
     */
    async addPayment(orderId: string, payment: AddPaymentDto): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/payments`,
            payment
        );
        return response.data.data;
    }

    /**
     * Remove payment from order
     */
    async removePayment(orderId: string, paymentId: string): Promise<Order> {
        const response = await apiClient.delete<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/payments/${paymentId}`
        );
        return response.data.data;
    }

    // =========================================================================
    // ORDER STATUS OPERATIONS
    // =========================================================================

    /**
     * Complete order (finalize and generate invoice)
     */
    async completeOrder(orderId: string): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/complete`
        );
        return response.data.data;
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId: string, reason: string): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/cancel`,
            { reason }
        );
        return response.data.data;
    }

    /**
     * Void order (requires manager PIN authorization)
     *
     * Voids all non-voided items in the order, restores inventory,
     * and processes refunds if the order was already paid.
     *
     * @param orderId - The order ID to void
     * @param pin - Manager PIN for authorization
     * @param reason - Reason for voiding (required for audit trail)
     */
    async voidOrder(orderId: string, pin: string, reason: string): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/void`,
            { pin, reason }
        );
        return response.data.data;
    }

    // =========================================================================
    // DISCOUNT OPERATIONS
    // =========================================================================

    /**
     * Apply discount to order
     */
    async applyDiscount(orderId: string, discount: OrderDiscount): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/discount`,
            discount
        );
        return response.data.data;
    }

    /**
     * Remove discount from order
     */
    async removeDiscount(orderId: string): Promise<Order> {
        const response = await apiClient.delete<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/discount`
        );
        return response.data.data;
    }

    // =========================================================================
    // HOLD/RECALL OPERATIONS
    // =========================================================================

    /**
     * Hold/Park an order
     */
    async holdOrder(orderId: string, note?: string): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/hold`,
            { note }
        );
        return response.data.data;
    }

    /**
     * Get held orders
     */
    async getHeldOrders(): Promise<Order[]> {
        const result = await this.getOrders({
            status: 'DRAFT',
            limit: 50
        });
        return result.data;
    }

    // =========================================================================
    // REFUND
    // =========================================================================

    /**
     * Process refund for an order
     */
    async processRefund(
        orderId: string,
        amount: string,
        reason: string,
        authorizedBy: string
    ): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/refund`,
            { amount, reason, authorizedBy }
        );
        return response.data.data;
    }

    // =========================================================================
    // OFFLINE SUPPORT
    // =========================================================================

    /**
     * Create order with offline fallback
     * If offline, queues the order for later sync
     */
    async createWithOffline(orderData: CreateOrderDto): Promise<{ order: Order; offline: boolean }> {
        if (this.isOnline) {
            // Try to create online
            try {
                const order = await this.create(orderData);
                return { order, offline: false };
            } catch (error) {
                // If network error, fall through to offline
                if ((error as any).code !== 'NETWORK_ERROR') {
                    throw error;
                }
            }
        }

        // Queue for offline sync
        const offlineId = await offlineStorage.saveOrder(orderData);
        console.log('[OrderService] Order queued for offline sync:', offlineId);

        // Return a pseudo-order with the offline ID
        const pseudoOrder: Order = {
            id: offlineId,
            orderNumber: `OFFLINE-${offlineId.slice(0, 8)}`,
            orderType: orderData.orderType,
            status: 'DRAFT',
            paymentStatus: 'UNPAID',
            items: [],
            subtotal: '0',
            discountTotal: '0',
            taxTotal: '0',
            total: '0',
            payments: [],
            amountPaid: '0',
            amountDue: '0',
            notes: orderData.notes,
            createdBy: 'offline',
            createdAt: new Date().toISOString(),
            ...(orderData.customerId && { customerId: orderData.customerId }),
            ...(orderData.tableId && { tableId: orderData.tableId }),
            ...(orderData.discount && { discount: orderData.discount }),
        };

        return { order: pseudoOrder, offline: true };
    }

    /**
     * Get pending offline orders
     */
    async getPendingOrders(): Promise<Array<{ id: string; payload: CreateOrderDto; timestamp: number; retryCount: number }>> {
        return await offlineStorage.getPendingOrders();
    }

    /**
     * Sync pending orders to server
     */
    async syncPendingOrders(): Promise<{ synced: number; failed: number; errors: string[] }> {
        const pendingOrders = await this.getPendingOrders();

        if (pendingOrders.length === 0) {
            return { synced: 0, failed: 0, errors: [] };
        }

        let synced = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const pendingOrder of pendingOrders) {
            // Skip if exceeded retry limit
            if (pendingOrder.retryCount >= 3) {
                errors.push(`Order ${pendingOrder.id} exceeded retry limit`);
                failed++;
                continue;
            }

            try {
                const order = await this.create(pendingOrder.payload);
                await offlineStorage.markOrderSynced(pendingOrder.id, order.id);
                synced++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                await offlineStorage.markOrderFailed(pendingOrder.id, errorMessage);
                await offlineStorage.updateRetryCount(pendingOrder.id);
                errors.push(`${pendingOrder.id}: ${errorMessage}`);
                failed++;
            }
        }

        return { synced, failed, errors };
    }

    /**
     * Check if there are pending orders
     */
    async hasPendingOrders(): Promise<boolean> {
        const orders = await this.getPendingOrders();
        return orders.length > 0;
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const orderService = new OrderService();
