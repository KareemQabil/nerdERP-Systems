/**
 * Sales API Layer
 * Handles all order-related API calls
 */
import { apiClient } from '@/lib/api-client';
import type { CreateOrderPayload, SalesOrder, OrderQueryParams, PaginatedResult } from '../types/order.types';

export const ordersApi = {
    /**
     * Create a new order (checkout)
     */
    createOrder: async (payload: CreateOrderPayload): Promise<SalesOrder> => {
        const response = await apiClient.post('/sales/orders', payload);
        return response.data.data;
    },

    /**
     * Get orders with pagination
     */
    getOrders: async (params?: OrderQueryParams): Promise<PaginatedResult<SalesOrder>> => {
        const response = await apiClient.get('/sales/orders', { params });
        return response.data;
    },

    /**
     * Get a single order by ID
     */
    getOrder: async (id: string): Promise<SalesOrder> => {
        const response = await apiClient.get(`/sales/orders/${id}`);
        return response.data.data;
    },

    /**
     * Void an order
     */
    voidOrder: async (id: string, reason: string): Promise<SalesOrder> => {
        const response = await apiClient.post(`/sales/orders/${id}/void`, { reason });
        return response.data.data;
    },
};

/**
 * Inventory reservation API (for checkout flow)
 */
export const inventoryApi = {
    /**
     * Reserve stock before checkout
     */
    reserveStock: async (items: { productId: string; quantity: number }[], warehouseId: string): Promise<string> => {
        const response = await apiClient.post('/inventory/reserve', { items, warehouseId });
        return response.data.data.reservationId;
    },

    /**
     * Release stock reservation (on cancel/error)
     */
    releaseReservation: async (reservationId: string): Promise<void> => {
        await apiClient.post('/inventory/release', { reservationId });
    },
};
