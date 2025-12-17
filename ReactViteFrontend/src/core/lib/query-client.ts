import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query Client Configuration
 * Global configuration for React Query
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Stale time: Data considered fresh for 30 seconds
            staleTime: 30000,

            // Cache time: Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,

            // Retry failed requests 3 times
            retry: 3,

            // Retry delay increases exponentially
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Don't refetch on window focus in development
            refetchOnWindowFocus: import.meta.env.PROD,

            // Refetch on reconnect
            refetchOnReconnect: true,

            // Don't refetch on mount if data is fresh
            refetchOnMount: true,
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,

            // Retry delay for mutations
            retryDelay: 1000,
        },
    },
});

/**
 * Query Keys
 * Centralized query key factory for type safety and consistency
 */
export const queryKeys = {
    // Products
    products: {
        all: ['products'] as const,
        lists: () => [...queryKeys.products.all, 'list'] as const,
        list: (filters?: Record<string, any>) =>
            [...queryKeys.products.lists(), { filters }] as const,
        details: () => [...queryKeys.products.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.products.details(), id] as const,
    },

    // Categories
    categories: {
        all: ['categories'] as const,
        lists: () => [...queryKeys.categories.all, 'list'] as const,
    },

    // Customers
    customers: {
        all: ['customers'] as const,
        lists: () => [...queryKeys.customers.all, 'list'] as const,
        list: (filters?: Record<string, any>) =>
            [...queryKeys.customers.lists(), { filters }] as const,
        details: () => [...queryKeys.customers.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    },

    // Orders
    orders: {
        all: ['orders'] as const,
        lists: () => [...queryKeys.orders.all, 'list'] as const,
        list: (filters?: Record<string, any>) =>
            [...queryKeys.orders.lists(), { filters }] as const,
        details: () => [...queryKeys.orders.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    },
};
