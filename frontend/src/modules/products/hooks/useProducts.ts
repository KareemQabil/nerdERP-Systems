/**
 * Products Hooks
 * TanStack Query v5 hooks for product data
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';
import type { Product, ProductQueryParams } from '../types/product.types';

// ═══════════════════════════════════════════════════════════
// QUERY KEYS (for cache invalidation)
// ═══════════════════════════════════════════════════════════

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: ProductQueryParams) => [...productKeys.lists(), filters] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (id: string) => [...productKeys.details(), id] as const,
};

// ═══════════════════════════════════════════════════════════
// QUERY HOOKS (Read)
// ═══════════════════════════════════════════════════════════

/**
 * Fetch products with filtering and pagination
 */
export function useProducts(params?: ProductQueryParams) {
    return useQuery({
        queryKey: productKeys.list(params || {}),
        queryFn: () => productsApi.getProducts(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Fetch a single product by ID
 */
export function useProduct(id: string) {
    return useQuery({
        queryKey: productKeys.detail(id),
        queryFn: () => productsApi.getProduct(id),
        staleTime: 5 * 60 * 1000,
        enabled: !!id, // Only fetch if ID is provided
    });
}

// ═══════════════════════════════════════════════════════════
// MUTATION HOOKS (Write)
// ═══════════════════════════════════════════════════════════

/**
 * Create a new product
 */
export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Product>) => productsApi.createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
}

/**
 * Update an existing product
 */
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
            productsApi.updateProduct(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
}

/**
 * Delete a product
 */
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => productsApi.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: productKeys.lists() });
        },
    });
}

/**
 * Sync modifiers for a product
 */
export function useSyncModifiers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ productId, modifierIds }: { productId: string; modifierIds: string[] }) =>
            productsApi.syncModifiers(productId, modifierIds),
        onSuccess: (_, { productId }) => {
            queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
        },
    });
}
