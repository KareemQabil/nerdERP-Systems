/**
 * Order Service
 * Handles order creation, management, and payment operations
 */
import { apiClient } from '@/lib/api-client';
import { ApiService } from '@/lib/api-service';
import type { ApiResponse, PaginatedResult, QueryParams } from '@/types/api.types';

// =============================================================================
// TYPES
// =============================================================================

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'PICKUP' | 'DRIVE_THRU';
export type OrderStatus = 'DRAFT' | 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'VOIDED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'GIFT_CARD' | 'LOYALTY_POINTS' | 'STORE_CREDIT';

export interface Order {
    id: string;
    orderNumber: string;
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
    constructor() {
        super({ endpoint: '/api/v1/sales/orders', cacheKey: 'orders' });
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
     * Void item (requires authorization)
     */
    async voidItem(orderId: string, itemId: string, reason: string, authorizedBy: string): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/items/${itemId}/void`,
            { reason, authorizedBy }
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
     * Void order (requires authorization)
     */
    async voidOrder(orderId: string, reason: string, authorizedBy: string): Promise<Order> {
        const response = await apiClient.post<ApiResponse<Order>>(
            `${this.endpoint}/${orderId}/void`,
            { reason, authorizedBy }
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
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const orderService = new OrderService();
