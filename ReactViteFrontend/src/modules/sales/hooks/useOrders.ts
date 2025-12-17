import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SalesApiService } from '../services/sales-api.service';
import { queryKeys } from '@/core/lib/query-client';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/order.store';
import { useRegisterStore } from '@/modules/cash/store/register.store';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import type { SalesOrder, CreateOrderDto, OrderFilterDto } from '../types/order.types';
import type { PaginatedResponse, StandardResponse } from '@/core/types/api.types';

/**
 * Hook: Get paginated orders list
 * @param filters - Optional filters (session, customer, status, dates)
 * 
 * @example
 * const { data, isLoading } = useOrders({ orderStatus: 'COMPLETED' });
 */
export function useOrders(filters?: OrderFilterDto) {
    return useQuery<PaginatedResponse<SalesOrder>>({
        queryKey: queryKeys.orders.list(filters),
        queryFn: () => SalesApiService.getOrders(filters),
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Hook: Get single order by ID
 * @param id - Order ID
 * 
 * @example
 * const { data: order } = useOrder('order-001');
 */
export function useOrder(id: string) {
    return useQuery<StandardResponse<SalesOrder>>({
        queryKey: queryKeys.orders.detail(id),
        queryFn: () => SalesApiService.getOrderById(id),
        enabled: !!id,
    });
}

/**
 * Hook: Create new order
 * CRITICAL: Validates Auth and Register stores before creation
 * Updates cart and order stores on success
 * 
 * @example
 * const { mutate, isPending } = useCreateOrder();
 * mutate(orderData);
 */
export function useCreateOrder() {
    const queryClient = useQueryClient();
    const { getTotals, clearCart } = useCartStore();
    const { createDraftOrder } = useOrderStore();
    const { isSessionOpen, updateSessionBalance } = useRegisterStore();
    const { user, isAuthenticated } = useAuthStore();

    return useMutation({
        mutationFn: async (dto: CreateOrderDto) => {
            // CRITICAL VALIDATIONS
            if (!isAuthenticated || !user) {
                throw new Error('No cashier logged in. Please login first.');
            }

            if (!isSessionOpen) {
                throw new Error('Register session not open. Please open a session first.');
            }

            // Call API service
            return await SalesApiService.createOrder(dto);
        },
        onSuccess: (response) => {
            const order = response.data;

            // Update order store
            createDraftOrder(order);

            // Update register session balance
            const totals = getTotals();
            // Assuming cash payment for now (in real app, get from payment data)
            updateSessionBalance(totals.total, 'cash');

            // Clear cart after successful order creation
            clearCart();

            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });

            console.log('[Sales] Order created successfully:', order.orderNumber);
        },
        onError: (error: any) => {
            console.error('[Sales] Failed to create order:', error.message);
        },
    });
}

/**
 * Hook: Complete order
 * Finalizes order and triggers receipt printing
 * 
 * @example
 * const { mutate } = useCompleteOrder();
 * mutate('order-001');
 */
export function useCompleteOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (orderId: string) => SalesApiService.completeOrder(orderId),
        onSuccess: (response, orderId) => {
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
            // Invalidate specific order
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });

            console.log('[Sales] Order completed:', response.data.orderNumber);

            // TODO: Trigger receipt printing
            // PrintService.printReceipt(receiptData);
        },
    });
}

/**
 * Combined hook for order mutations
 * 
 * @example
 * const { createOrder, completeOrder, isLoading } = useOrderMutations();
 */
export function useOrderMutations() {
    const createOrder = useCreateOrder();
    const completeOrder = useCompleteOrder();

    return {
        createOrder,
        completeOrder,
        isLoading: createOrder.isPending || completeOrder.isPending,
    };
}
