/**
 * Orders RTK Query API
 * Handles order creation, management, payments, and kitchen operations
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithErrorHandling } from '@/lib/api/baseQuery';
import type { PaginatedData, QueryParams } from '@/lib/api/types';

// =============================================================================
// TYPES
// =============================================================================

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'PICKUP' | 'DRIVE_THRU';
export type OrderStatus = 'DRAFT' | 'PLACED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'VOIDED' | 'HELD';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'GIFT_CARD' | 'LOYALTY_POINTS' | 'STORE_CREDIT';
export type KitchenStatus = 'PENDING' | 'FIRED' | 'PREPARING' | 'READY' | 'SERVED';

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
    kitchenStatus?: KitchenStatus;
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

export interface OrderQueryParams extends QueryParams {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    orderType?: OrderType;
    fromDate?: string;
    toDate?: string;
}

// =============================================================================
// API DEFINITION
// =============================================================================

export const ordersApi = createApi({
    reducerPath: 'ordersApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Order', 'OrderList', 'HeldOrders', 'TodayOrders'],
    endpoints: (builder) => ({
        // =====================================================================
        // ORDER CRUD ENDPOINTS
        // =====================================================================

        /**
         * Get all orders with pagination and filters
         */
        getOrders: builder.query<PaginatedData<Order>, OrderQueryParams | void>({
            query: (params) => ({
                url: '/api/v1/sales/orders',
                params: params || {},
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.items.map(({ id }) => ({ type: 'Order' as const, id })),
                          { type: 'OrderList', id: 'LIST' },
                      ]
                    : [{ type: 'OrderList', id: 'LIST' }],
        }),

        /**
         * Get today's orders
         */
        getTodayOrders: builder.query<Order[], void>({
            query: () => {
                const today = new Date().toISOString().split('T')[0];
                return {
                    url: '/api/v1/sales/orders',
                    params: {
                        fromDate: today,
                        limit: 100,
                        order: 'DESC',
                    },
                };
            },
            transformResponse: (response: PaginatedData<Order>) => response.items,
            providesTags: [{ type: 'TodayOrders', id: 'TODAY' }],
        }),

        /**
         * Get single order by ID
         */
        getOrderById: builder.query<Order, string>({
            query: (id) => `/api/v1/sales/orders/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Order', id }],
        }),

        /**
         * Get order with full details
         */
        getOrderDetails: builder.query<Order, string>({
            query: (id) => ({
                url: `/api/v1/sales/orders/${id}`,
                params: { include: 'items,payments,customer' },
            }),
            providesTags: (_result, _error, id) => [{ type: 'Order', id }],
        }),

        /**
         * Create new order
         */
        createOrder: builder.mutation<Order, CreateOrderDto>({
            query: (body) => ({
                url: '/api/v1/sales/orders',
                method: 'POST',
                body,
            }),
            invalidatesTags: [
                { type: 'OrderList', id: 'LIST' },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        /**
         * Update order
         */
        updateOrder: builder.mutation<Order, { id: string; data: UpdateOrderDto }>({
            query: ({ id, data }) => ({
                url: `/api/v1/sales/orders/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Order', id },
                { type: 'OrderList', id: 'LIST' },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        /**
         * Delete order (soft delete)
         */
        deleteOrder: builder.mutation<void, string>({
            query: (id) => ({
                url: `/api/v1/sales/orders/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'Order', id },
                { type: 'OrderList', id: 'LIST' },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        // =====================================================================
        // ORDER ITEM OPERATIONS
        // =====================================================================

        /**
         * Add item to order
         */
        addOrderItem: builder.mutation<Order, { orderId: string; item: CreateOrderItemDto }>({
            query: ({ orderId, item }) => ({
                url: `/api/v1/sales/orders/${orderId}/items`,
                method: 'POST',
                body: item,
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        /**
         * Update item quantity
         */
        updateOrderItem: builder.mutation<Order, { orderId: string; itemId: string; quantity: string }>({
            query: ({ orderId, itemId, quantity }) => ({
                url: `/api/v1/sales/orders/${orderId}/items/${itemId}`,
                method: 'PATCH',
                body: { quantity },
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
            ],
        }),

        /**
         * Remove item from order
         */
        removeOrderItem: builder.mutation<Order, { orderId: string; itemId: string; reason?: string }>({
            query: ({ orderId, itemId, reason }) => ({
                url: `/api/v1/sales/orders/${orderId}/items/${itemId}`,
                method: 'DELETE',
                body: reason ? { reason } : undefined,
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
            ],
        }),

        /**
         * Void item (requires authorization)
         */
        voidOrderItem: builder.mutation<Order, { orderId: string; itemId: string; reason: string; authorizedBy: string }>({
            query: ({ orderId, itemId, reason, authorizedBy }) => ({
                url: `/api/v1/sales/orders/${orderId}/items/${itemId}/void`,
                method: 'POST',
                body: { reason, authorizedBy },
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        // =====================================================================
        // PAYMENT OPERATIONS
        // =====================================================================

        /**
         * Add payment to order
         */
        addPayment: builder.mutation<Order, { orderId: string; payment: AddPaymentDto }>({
            query: ({ orderId, payment }) => ({
                url: `/api/v1/sales/orders/${orderId}/payments`,
                method: 'POST',
                body: payment,
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        /**
         * Remove payment from order
         */
        removePayment: builder.mutation<Order, { orderId: string; paymentId: string }>({
            query: ({ orderId, paymentId }) => ({
                url: `/api/v1/sales/orders/${orderId}/payments/${paymentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
            ],
        }),

        // =====================================================================
        // ORDER STATUS OPERATIONS
        // =====================================================================

        /**
         * Complete order (finalize and generate invoice)
         */
        completeOrder: builder.mutation<Order, string>({
            query: (orderId) => ({
                url: `/api/v1/sales/orders/${orderId}/complete`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, orderId) => [
                { type: 'Order', id: orderId },
                { type: 'OrderList', id: 'LIST' },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        /**
         * Cancel order
         */
        cancelOrder: builder.mutation<Order, { orderId: string; reason: string }>({
            query: ({ orderId, reason }) => ({
                url: `/api/v1/sales/orders/${orderId}/cancel`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
                { type: 'OrderList', id: 'LIST' },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        /**
         * Void order (requires authorization)
         */
        voidOrder: builder.mutation<Order, { orderId: string; reason: string; authorizedBy: string }>({
            query: ({ orderId, reason, authorizedBy }) => ({
                url: `/api/v1/sales/orders/${orderId}/void`,
                method: 'POST',
                body: { reason, authorizedBy },
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
                { type: 'OrderList', id: 'LIST' },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        // =====================================================================
        // DISCOUNT OPERATIONS
        // =====================================================================

        /**
         * Apply discount to order
         */
        applyDiscount: builder.mutation<Order, { orderId: string; discount: OrderDiscount }>({
            query: ({ orderId, discount }) => ({
                url: `/api/v1/sales/orders/${orderId}/discount`,
                method: 'POST',
                body: discount,
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
            ],
        }),

        /**
         * Remove discount from order
         */
        removeDiscount: builder.mutation<Order, string>({
            query: (orderId) => ({
                url: `/api/v1/sales/orders/${orderId}/discount`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, orderId) => [
                { type: 'Order', id: orderId },
            ],
        }),

        // =====================================================================
        // HOLD/RECALL OPERATIONS
        // =====================================================================

        /**
         * Hold/Park an order
         */
        holdOrder: builder.mutation<Order, { orderId: string; note?: string }>({
            query: ({ orderId, note }) => ({
                url: `/api/v1/sales/orders/${orderId}/hold`,
                method: 'POST',
                body: note ? { note } : undefined,
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
                { type: 'HeldOrders', id: 'HELD' },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        /**
         * Get held orders
         */
        getHeldOrders: builder.query<Order[], void>({
            query: () => ({
                url: '/api/v1/sales/orders',
                params: {
                    status: 'DRAFT',
                    limit: 50,
                },
            }),
            transformResponse: (response: PaginatedData<Order>) => response.items,
            providesTags: [{ type: 'HeldOrders', id: 'HELD' }],
        }),

        /**
         * Recall held order
         */
        recallOrder: builder.mutation<Order, string>({
            query: (orderId) => ({
                url: `/api/v1/sales/orders/${orderId}/recall`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, orderId) => [
                { type: 'Order', id: orderId },
                { type: 'HeldOrders', id: 'HELD' },
            ],
        }),

        // =====================================================================
        // REFUND
        // =====================================================================

        /**
         * Process refund for an order
         */
        processRefund: builder.mutation<Order, { orderId: string; amount: string; reason: string; authorizedBy: string }>({
            query: ({ orderId, amount, reason, authorizedBy }) => ({
                url: `/api/v1/sales/orders/${orderId}/refund`,
                method: 'POST',
                body: { amount, reason, authorizedBy },
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
                { type: 'OrderList', id: 'LIST' },
                { type: 'TodayOrders', id: 'TODAY' },
            ],
        }),

        // =====================================================================
        // KITCHEN OPERATIONS
        // =====================================================================

        /**
         * Fire items to kitchen
         */
        fireToKitchen: builder.mutation<Order, { orderId: string; itemIds?: string[] }>({
            query: ({ orderId, itemIds }) => ({
                url: `/api/v1/sales/orders/${orderId}/fire`,
                method: 'POST',
                body: itemIds ? { itemIds } : undefined,
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
            ],
        }),

        /**
         * Update kitchen status for item
         */
        updateKitchenStatus: builder.mutation<Order, { orderId: string; itemId: string; status: KitchenStatus }>({
            query: ({ orderId, itemId, status }) => ({
                url: `/api/v1/sales/orders/${orderId}/items/${itemId}/kitchen-status`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                { type: 'Order', id: orderId },
            ],
        }),
    }),
});

// =============================================================================
// EXPORT HOOKS
// =============================================================================

export const {
    // Query hooks
    useGetOrdersQuery,
    useGetTodayOrdersQuery,
    useGetOrderByIdQuery,
    useGetOrderDetailsQuery,
    useGetHeldOrdersQuery,
    // Mutation hooks - CRUD
    useCreateOrderMutation,
    useUpdateOrderMutation,
    useDeleteOrderMutation,
    // Mutation hooks - Items
    useAddOrderItemMutation,
    useUpdateOrderItemMutation,
    useRemoveOrderItemMutation,
    useVoidOrderItemMutation,
    // Mutation hooks - Payments
    useAddPaymentMutation,
    useRemovePaymentMutation,
    // Mutation hooks - Status
    useCompleteOrderMutation,
    useCancelOrderMutation,
    useVoidOrderMutation,
    // Mutation hooks - Discount
    useApplyDiscountMutation,
    useRemoveDiscountMutation,
    // Mutation hooks - Hold/Recall
    useHoldOrderMutation,
    useRecallOrderMutation,
    // Mutation hooks - Refund
    useProcessRefundMutation,
    // Mutation hooks - Kitchen
    useFireToKitchenMutation,
    useUpdateKitchenStatusMutation,
    // Lazy hooks
    useLazyGetOrdersQuery,
    useLazyGetOrderByIdQuery,
    useLazyGetOrderDetailsQuery,
    useLazyGetHeldOrdersQuery,
} = ordersApi;
