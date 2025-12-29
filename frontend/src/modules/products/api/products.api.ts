/**
 * Products API Layer
 * Handles all product-related API calls
 */
import { apiClient } from '@/lib/api-client';
import type { Product, ProductQueryParams, PaginatedResult } from '../types/product.types';

export const productsApi = {
    /**
     * Get products with filtering and pagination
     */
    getProducts: async (params?: ProductQueryParams): Promise<PaginatedResult<Product>> => {
        const response = await apiClient.get('/products', { params });
        return response.data;
    },

    /**
     * Get a single product by ID with modifiers
     */
    getProduct: async (id: string): Promise<Product> => {
        const response = await apiClient.get(`/products/${id}`);
        return response.data.data;
    },

    /**
     * Create a new product
     */
    createProduct: async (data: Partial<Product>): Promise<Product> => {
        const response = await apiClient.post('/products', data);
        return response.data.data;
    },

    /**
     * Update an existing product
     */
    updateProduct: async (id: string, data: Partial<Product>): Promise<Product> => {
        const response = await apiClient.put(`/products/${id}`, data);
        return response.data.data;
    },

    /**
     * Delete a product (soft delete)
     */
    deleteProduct: async (id: string): Promise<void> => {
        await apiClient.delete(`/products/${id}`);
    },

    /**
     * Bulk create products
     */
    bulkCreate: async (products: Partial<Product>[]): Promise<Product[]> => {
        const response = await apiClient.post('/products/bulk', { products });
        return response.data.data;
    },

    /**
     * Sync modifiers for a product
     */
    syncModifiers: async (productId: string, modifierIds: string[]): Promise<void> => {
        await apiClient.put(`/products/${productId}/modifiers`, { modifierIds });
    },
};
