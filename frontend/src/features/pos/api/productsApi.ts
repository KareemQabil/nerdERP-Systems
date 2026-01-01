/**
 * Products RTK Query API
 * Handles product-related API calls with caching and invalidation
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithErrorHandling } from '@/lib/api/baseQuery';
import type { PaginatedData, QueryParams } from '@/lib/api/types';

// =============================================================================
// TYPES
// =============================================================================

export interface Category {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    parentId?: string;
    imageUrl?: string;
    sortOrder: number;
    isActive: boolean;
    productCount?: number;
}

export interface Product {
    id: string;
    name: string;
    nameAr?: string;
    sku: string;
    barcode?: string;
    description?: string;
    descriptionAr?: string;
    categoryId?: string;
    category?: Category;
    salePrice: string;
    costPrice?: string;
    taxable: boolean;
    taxRate?: string;
    imageUrl?: string;
    isActive: boolean;
    isPrepared: boolean;
    trackInventory: boolean;
    stockQuantity?: string;
    lowStockThreshold?: number;
    modifierGroups?: ModifierGroup[];
}

export interface ModifierGroup {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    selectionType: 'SINGLE' | 'MULTIPLE';
    isRequired: boolean;
    minSelections: number;
    maxSelections: number;
    modifiers: Modifier[];
}

export interface Modifier {
    id: string;
    groupId: string;
    name: string;
    nameAr?: string;
    price: string;
    isDefault: boolean;
    isActive: boolean;
    sortOrder: number;
}

export interface StockInfo {
    available: string;
    reserved: string;
}

// =============================================================================
// API DEFINITION
// =============================================================================

export const productsApi = createApi({
    reducerPath: 'productsApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Product', 'ProductList', 'Category', 'CategoryList', 'ModifierGroup'],
    endpoints: (builder) => ({
        // =====================================================================
        // PRODUCT ENDPOINTS
        // =====================================================================

        /**
         * Get all products with pagination
         */
        getProducts: builder.query<PaginatedData<Product>, QueryParams | void>({
            query: (params) => ({
                url: '/api/v1/products',
                params: params || {},
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.items.map(({ id }) => ({ type: 'Product' as const, id })),
                          { type: 'ProductList', id: 'LIST' },
                      ]
                    : [{ type: 'ProductList', id: 'LIST' }],
        }),

        /**
         * Get products for POS display (active only, optimized)
         */
        getProductsForPOS: builder.query<Product[], { categoryId?: string; search?: string }>({
            query: ({ categoryId, search }) => ({
                url: '/api/v1/products',
                params: {
                    isActive: true,
                    limit: 100,
                    ...(categoryId && { categoryId }),
                    ...(search && { search }),
                },
            }),
            transformResponse: (response: Product[]) => {
                // Transform products to ensure proper formatting
                return response.map((p) => ({
                    ...p,
                    imageUrl: p.imageUrl || undefined,
                    trackInventory: p.trackInventory ?? false,
                    salePrice: String(p.salePrice),
                }));
            },
            providesTags: [{ type: 'ProductList', id: 'POS' }],
        }),

        /**
         * Get single product by ID
         */
        getProductById: builder.query<Product, string>({
            query: (id) => `/api/v1/products/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Product', id }],
        }),

        /**
         * Get product with modifier groups
         */
        getProductWithModifiers: builder.query<Product, string>({
            query: (id) => ({
                url: `/api/v1/products/${id}`,
                params: { include: 'modifierGroups' },
            }),
            providesTags: (_result, _error, id) => [
                { type: 'Product', id },
                { type: 'ModifierGroup', id: `product-${id}` },
            ],
        }),

        /**
         * Get product by barcode
         */
        getProductByBarcode: builder.query<Product | null, string>({
            query: (barcode) => `/api/v1/products/barcode/${barcode}`,
            providesTags: (_result, _error, barcode) => [{ type: 'Product', id: `barcode-${barcode}` }],
        }),

        /**
         * Search products
         */
        searchProducts: builder.query<Product[], string>({
            query: (query) => ({
                url: '/api/v1/products',
                params: { search: query, limit: 20, isActive: true },
            }),
            providesTags: [{ type: 'ProductList', id: 'SEARCH' }],
        }),

        /**
         * Check product stock
         */
        checkProductStock: builder.query<StockInfo, { productId: string; warehouseId: string }>({
            query: ({ productId, warehouseId }) => ({
                url: `/api/v1/products/${productId}/stock`,
                params: { warehouseId },
            }),
        }),

        /**
         * Create product
         */
        createProduct: builder.mutation<Product, Partial<Product>>({
            query: (body) => ({
                url: '/api/v1/products',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'ProductList', id: 'LIST' }, { type: 'ProductList', id: 'POS' }],
        }),

        /**
         * Update product
         */
        updateProduct: builder.mutation<Product, { id: string; data: Partial<Product> }>({
            query: ({ id, data }) => ({
                url: `/api/v1/products/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'Product', id },
                { type: 'ProductList', id: 'LIST' },
                { type: 'ProductList', id: 'POS' },
            ],
        }),

        /**
         * Delete product
         */
        deleteProduct: builder.mutation<void, string>({
            query: (id) => ({
                url: `/api/v1/products/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'Product', id },
                { type: 'ProductList', id: 'LIST' },
                { type: 'ProductList', id: 'POS' },
            ],
        }),

        // =====================================================================
        // CATEGORY ENDPOINTS
        // =====================================================================

        /**
         * Get all categories
         */
        getCategories: builder.query<Category[], QueryParams | void>({
            query: (params) => ({
                url: '/api/v1/categories',
                params: params || {},
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.map(({ id }) => ({ type: 'Category' as const, id })),
                          { type: 'CategoryList', id: 'LIST' },
                      ]
                    : [{ type: 'CategoryList', id: 'LIST' }],
        }),

        /**
         * Get active categories for POS
         */
        getActiveCategories: builder.query<Category[], void>({
            query: () => ({
                url: '/api/v1/categories',
                params: { isActive: true },
            }),
            providesTags: [{ type: 'CategoryList', id: 'ACTIVE' }],
        }),

        /**
         * Get category tree
         */
        getCategoryTree: builder.query<Category[], void>({
            query: () => '/api/v1/categories/tree',
            providesTags: [{ type: 'CategoryList', id: 'TREE' }],
        }),

        /**
         * Get single category
         */
        getCategoryById: builder.query<Category, string>({
            query: (id) => `/api/v1/categories/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Category', id }],
        }),

        // =====================================================================
        // MODIFIER ENDPOINTS
        // =====================================================================

        /**
         * Get modifier groups for a product
         */
        getModifierGroupsForProduct: builder.query<ModifierGroup[], string>({
            query: (productId) => `/api/v1/products/${productId}/modifier-groups`,
            providesTags: (_result, _error, productId) => [
                { type: 'ModifierGroup', id: `product-${productId}` },
            ],
        }),

        /**
         * Get all modifier groups
         */
        getAllModifierGroups: builder.query<ModifierGroup[], void>({
            query: () => ({
                url: '/api/v1/modifiers',
                params: { limit: 100 },
            }),
            providesTags: [{ type: 'ModifierGroup', id: 'LIST' }],
        }),
    }),
});

// =============================================================================
// EXPORT HOOKS
// =============================================================================

export const {
    // Product hooks
    useGetProductsQuery,
    useGetProductsForPOSQuery,
    useGetProductByIdQuery,
    useGetProductWithModifiersQuery,
    useGetProductByBarcodeQuery,
    useSearchProductsQuery,
    useCheckProductStockQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
    // Category hooks
    useGetCategoriesQuery,
    useGetActiveCategoriesQuery,
    useGetCategoryTreeQuery,
    useGetCategoryByIdQuery,
    // Modifier hooks
    useGetModifierGroupsForProductQuery,
    useGetAllModifierGroupsQuery,
    // Lazy hooks
    useLazyGetProductsQuery,
    useLazySearchProductsQuery,
    useLazyGetProductByBarcodeQuery,
} = productsApi;
