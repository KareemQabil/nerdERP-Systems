/**
 * Customers RTK Query API
 * Handles customer search, creation, loyalty, and store credit operations
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithErrorHandling } from '@/lib/api/baseQuery';
import type { PaginatedData, QueryParams } from '@/lib/api/types';

// =============================================================================
// TYPES
// =============================================================================

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Customer {
    id: string;
    name: string;
    nameAr?: string;
    phone: string;
    email?: string;
    address?: string;

    // Loyalty
    loyaltyTier?: LoyaltyTier;
    loyaltyPoints: number;
    totalSpent: string;
    totalOrders: number;

    // Credit
    storeCredit: string;

    // Metadata
    notes?: string;
    tags?: string[];
    createdAt: string;
    lastVisitAt?: string;
}

export interface CustomerOrder {
    id: string;
    orderNumber: string;
    total: string;
    status: string;
    createdAt: string;
}

export interface LoyaltySummary {
    tier: LoyaltyTier;
    currentPoints: number;
    lifetimePoints: number;
    pointsToNextTier?: number;
    tierProgress: number;
    recentTransactions: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
    id: string;
    type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
    points: number;
    reason: string;
    orderId?: string;
    createdAt: string;
}

export interface CreditTransaction {
    id: string;
    type: 'ADD' | 'USE' | 'EXPIRE' | 'REFUND';
    amount: string;
    reason: string;
    orderId?: string;
    createdAt: string;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CreateCustomerDto {
    name: string;
    nameAr?: string;
    phone: string;
    email?: string;
    address?: string;
    notes?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
    tags?: string[];
}

export interface CustomerQueryParams extends QueryParams {
    search?: string;
    loyaltyTier?: LoyaltyTier;
    hasStoreCredit?: boolean;
}

// =============================================================================
// API DEFINITION
// =============================================================================

export const customersApi = createApi({
    reducerPath: 'customersApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Customer', 'CustomerList', 'CustomerLoyalty', 'CustomerCredit', 'CustomerOrders'],
    endpoints: (builder) => ({
        // =====================================================================
        // CUSTOMER CRUD ENDPOINTS
        // =====================================================================

        /**
         * Get all customers with pagination
         */
        getCustomers: builder.query<PaginatedData<Customer>, CustomerQueryParams | void>({
            query: (params) => ({
                url: '/api/v1/customers',
                params: params || {},
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.items.map(({ id }) => ({ type: 'Customer' as const, id })),
                          { type: 'CustomerList', id: 'LIST' },
                      ]
                    : [{ type: 'CustomerList', id: 'LIST' }],
        }),

        /**
         * Search customers by name or phone
         */
        searchCustomers: builder.query<Customer[], string>({
            query: (query) => ({
                url: '/api/v1/customers',
                params: { search: query, limit: 20 },
            }),
            transformResponse: (response: PaginatedData<Customer>) => response.items,
            providesTags: [{ type: 'CustomerList', id: 'SEARCH' }],
        }),

        /**
         * Get customer by ID
         */
        getCustomerById: builder.query<Customer, string>({
            query: (id) => `/api/v1/customers/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Customer', id }],
        }),

        /**
         * Get customer by phone number
         */
        getCustomerByPhone: builder.query<Customer | null, string>({
            query: (phone) => `/api/v1/customers/phone/${phone}`,
            providesTags: (_result, _error, phone) => [{ type: 'Customer', id: `phone-${phone}` }],
        }),

        /**
         * Create customer
         */
        createCustomer: builder.mutation<Customer, CreateCustomerDto>({
            query: (body) => ({
                url: '/api/v1/customers',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'CustomerList', id: 'LIST' }],
        }),

        /**
         * Quick create customer with minimal info
         */
        quickCreateCustomer: builder.mutation<Customer, { name: string; phone: string }>({
            query: ({ name, phone }) => ({
                url: '/api/v1/customers',
                method: 'POST',
                body: { name, phone },
            }),
            invalidatesTags: [{ type: 'CustomerList', id: 'LIST' }],
        }),

        /**
         * Update customer
         */
        updateCustomer: builder.mutation<Customer, { id: string; data: UpdateCustomerDto }>({
            query: ({ id, data }) => ({
                url: `/api/v1/customers/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Customer', id },
                { type: 'CustomerList', id: 'LIST' },
            ],
        }),

        /**
         * Delete customer
         */
        deleteCustomer: builder.mutation<void, string>({
            query: (id) => ({
                url: `/api/v1/customers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'Customer', id },
                { type: 'CustomerList', id: 'LIST' },
            ],
        }),

        // =====================================================================
        // ORDER HISTORY
        // =====================================================================

        /**
         * Get customer order history
         */
        getCustomerOrders: builder.query<PaginatedData<CustomerOrder>, { customerId: string; params?: QueryParams }>({
            query: ({ customerId, params }) => ({
                url: `/api/v1/customers/${customerId}/orders`,
                params: params || {},
            }),
            providesTags: (_result, _error, { customerId }) => [
                { type: 'CustomerOrders', id: customerId },
            ],
        }),

        // =====================================================================
        // LOYALTY OPERATIONS
        // =====================================================================

        /**
         * Get customer loyalty summary
         */
        getLoyaltySummary: builder.query<LoyaltySummary, string>({
            query: (customerId) => `/api/v1/customers/${customerId}/loyalty`,
            providesTags: (_result, _error, customerId) => [
                { type: 'CustomerLoyalty', id: customerId },
            ],
        }),

        /**
         * Award loyalty points
         */
        awardPoints: builder.mutation<Customer, { customerId: string; points: number; reason: string }>({
            query: ({ customerId, points, reason }) => ({
                url: `/api/v1/customers/${customerId}/loyalty/award`,
                method: 'POST',
                body: { points, reason },
            }),
            invalidatesTags: (_result, _error, { customerId }) => [
                { type: 'Customer', id: customerId },
                { type: 'CustomerLoyalty', id: customerId },
            ],
        }),

        /**
         * Redeem loyalty points
         */
        redeemPoints: builder.mutation<Customer, { customerId: string; points: number }>({
            query: ({ customerId, points }) => ({
                url: `/api/v1/customers/${customerId}/loyalty/redeem`,
                method: 'POST',
                body: { points },
            }),
            invalidatesTags: (_result, _error, { customerId }) => [
                { type: 'Customer', id: customerId },
                { type: 'CustomerLoyalty', id: customerId },
            ],
        }),

        // =====================================================================
        // STORE CREDIT OPERATIONS
        // =====================================================================

        /**
         * Add store credit
         */
        addCredit: builder.mutation<Customer, { customerId: string; amount: string; reason: string }>({
            query: ({ customerId, amount, reason }) => ({
                url: `/api/v1/customers/${customerId}/credit/add`,
                method: 'POST',
                body: { amount, reason },
            }),
            invalidatesTags: (_result, _error, { customerId }) => [
                { type: 'Customer', id: customerId },
                { type: 'CustomerCredit', id: customerId },
            ],
        }),

        /**
         * Use store credit
         */
        useCredit: builder.mutation<Customer, { customerId: string; amount: string; orderId: string }>({
            query: ({ customerId, amount, orderId }) => ({
                url: `/api/v1/customers/${customerId}/credit/use`,
                method: 'POST',
                body: { amount, orderId },
            }),
            invalidatesTags: (_result, _error, { customerId }) => [
                { type: 'Customer', id: customerId },
                { type: 'CustomerCredit', id: customerId },
            ],
        }),

        /**
         * Get credit history
         */
        getCreditHistory: builder.query<CreditTransaction[], string>({
            query: (customerId) => `/api/v1/customers/${customerId}/credit/history`,
            providesTags: (_result, _error, customerId) => [
                { type: 'CustomerCredit', id: customerId },
            ],
        }),
    }),
});

// =============================================================================
// EXPORT HOOKS
// =============================================================================

export const {
    // Query hooks
    useGetCustomersQuery,
    useSearchCustomersQuery,
    useGetCustomerByIdQuery,
    useGetCustomerByPhoneQuery,
    useGetCustomerOrdersQuery,
    useGetLoyaltySummaryQuery,
    useGetCreditHistoryQuery,
    // Mutation hooks
    useCreateCustomerMutation,
    useQuickCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
    useAwardPointsMutation,
    useRedeemPointsMutation,
    useAddCreditMutation,
    useUseCreditMutation,
    // Lazy hooks
    useLazyGetCustomersQuery,
    useLazySearchCustomersQuery,
    useLazyGetCustomerByIdQuery,
    useLazyGetCustomerByPhoneQuery,
} = customersApi;
