import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsApiService } from '../services/products-api.service';
import { queryKeys } from '@/core/lib/query-client';
import type { Product, ProductCategory, ProductFilterDto, CreateProductDto, UpdateProductDto } from '../types/product.types';
import type { PaginatedResponse, StandardResponse } from '@/core/types/api.types';

/**
 * Hook: Get paginated products list
 * @param filters - Optional filters (category, type, search, etc.)
 * 
 * @example
 * const { data, isLoading, error, refetch } = useProducts({ categoryId: 'cat-001' });
 */
export function useProducts(filters?: ProductFilterDto) {
    return useQuery<PaginatedResponse<Product>>({
        queryKey: queryKeys.products.list(filters),
        queryFn: () => ProductsApiService.getProducts(filters),
        // Keep previous data while fetching new filtered results
        placeholderData: (previousData) => previousData,
        // Stale time: 30 seconds (from query-client config)
    });
}

/**
 * Hook: Get single product by ID
 * @param id - Product ID
 * 
 * @example
 * const { data, isLoading } = useProduct('prod-001');
 */
export function useProduct(id: string) {
    return useQuery<StandardResponse<Product>>({
        queryKey: queryKeys.products.detail(id),
        queryFn: () => ProductsApiService.getProductById(id),
        enabled: !!id, // Only fetch if ID is provided
    });
}

/**
 * Hook: Get all product categories
 * Used for category filter tabs
 * 
 * @example
 * const { data: categories } = useCategories();
 */
export function useCategories() {
    return useQuery<StandardResponse<ProductCategory[]>>({
        queryKey: queryKeys.categories.lists(),
        queryFn: () => ProductsApiService.getCategories(),
        // Categories change rarely, cache for longer
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook: Create new product
 * Invalidates products list on success
 * 
 * @example
 * const { mutate, isPending } = useCreateProduct();
 * mutate(productData);
 */
export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateProductDto) => ProductsApiService.createProduct(dto),
        onSuccess: () => {
            // Invalidate and refetch products list
            queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
            console.log('[Products] Product created successfully');
        },
        onError: (error) => {
            console.error('[Products] Failed to create product:', error);
        },
    });
}

/**
 * Hook: Update existing product
 * Invalidates both list and detail queries
 * 
 * @example
 * const { mutate } = useUpdateProduct();
 * mutate({ id: 'prod-001', name: 'New Name' });
 */
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: UpdateProductDto) => ProductsApiService.updateProduct(dto),
        onSuccess: (data, variables) => {
            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
            // Invalidate specific product detail
            queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
            console.log('[Products] Product updated successfully');
        },
    });
}

/**
 * Hook: Delete product
 * Invalidates products list
 * 
 * @example
 * const { mutate } = useDeleteProduct();
 * mutate('prod-001');
 */
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => ProductsApiService.deleteProduct(id),
        onSuccess: () => {
            // Invalidate products list
            queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
            console.log('[Products] Product deleted successfully');
        },
    });
}

/**
 * Combined hook for product mutations
 * Provides create, update, delete in one hook
 * 
 * @example
 * const { createProduct, updateProduct, deleteProduct, isLoading } = useProductMutations();
 */
export function useProductMutations() {
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();

    return {
        createProduct,
        updateProduct,
        deleteProduct,
        // Computed loading state
        isLoading: createProduct.isPending || updateProduct.isPending || deleteProduct.isPending,
    };
}
