/**
 * Product Service
 * Handles product, category, and modifier operations
 * with offline caching support
 */
import { ApiService } from '@/lib/api-service';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse, PaginatedResult, QueryParams } from '@/types/api.types';
import { offlineStorage } from '@/lib/offline-storage';

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
    variants?: ProductVariant[];
}

export interface ProductVariant {
    id: string;
    productId: string;
    name: string;
    nameAr?: string;
    sku: string;
    salePrice: string;
    costPrice?: string;
    stockQuantity?: string;
    isActive: boolean;
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

// =============================================================================
// CATEGORY SERVICE
// =============================================================================

class CategoryService extends ApiService<Category> {
    constructor() {
        super({ endpoint: '/api/v1/categories', cacheKey: 'categories' });
    }

    /**
     * Get categories as a tree structure
     */
    async getTree(): Promise<Category[]> {
        const response = await apiClient.get<ApiResponse<Category[]>>(
            `${this.endpoint}/tree`
        );
        return response.data.data;
    }

    /**
     * Get active categories only (for POS display)
     */
    async getActive(): Promise<Category[]> {
        const response = await apiClient.get<ApiResponse<Category[]>>(
            this.endpoint,
            { params: { isActive: true } }
        );
        return response.data.data;
    }
}

// =============================================================================
// PRODUCT SERVICE
// =============================================================================

class ProductService extends ApiService<Product> {
    constructor() {
        super({ endpoint: '/api/v1/products', cacheKey: 'products' });
    }

    /**
     * Get products by category
     */
    async getByCategory(categoryId: string, params?: QueryParams): Promise<PaginatedResult<Product>> {
        return this.findAll({ ...params, categoryId });
    }

    /**
     * Get all products for inventory management (no filtering)
     */
    async getAllProducts(limit = 200): Promise<Product[]> {
        const response = await apiClient.get<ApiResponse<any[]>>(
            this.endpoint,
            { params: { limit } }
        );

        // Handle both array and paginated response formats
        const rawData = response.data.data;
        const products = Array.isArray(rawData) ? rawData : (rawData as any)?.data || [];

        return products.map((p: any) => ({
            ...p,
            imageUrl: p.imageUrl || p.metadata?.imageUrl || undefined,
            trackInventory: p.trackInventory ?? false,
            salePrice: String(p.salePrice),
        }));
    }

    /**
     * Get active products for POS
     * Maps backend product data including extracting imageUrl from metadata
     */
    async getForPOS(categoryId?: string, search?: string): Promise<Product[]> {
        const params: QueryParams = { isActive: true, limit: 100 };
        if (categoryId) params.categoryId = categoryId;
        if (search) params.search = search;

        const response = await apiClient.get<ApiResponse<any[]>>(
            this.endpoint,
            { params }
        );

        // Map products and extract imageUrl from metadata
        return response.data.data.map(p => ({
            ...p,
            // Extract imageUrl from metadata if not directly on product
            imageUrl: p.imageUrl || p.metadata?.imageUrl || undefined,
            // Ensure trackInventory is boolean
            trackInventory: p.trackInventory ?? false,
            // Format salePrice as string
            salePrice: String(p.salePrice),
        }));
    }

    /**
     * Get product with modifier groups
     */
    async getWithModifiers(productId: string): Promise<Product> {
        const response = await apiClient.get<ApiResponse<Product>>(
            `${this.endpoint}/${productId}`,
            { params: { include: 'modifierGroups' } }
        );
        return response.data.data;
    }

    /**
     * Search products by name, SKU, or barcode
     */
    async quickSearch(query: string): Promise<Product[]> {
        const result = await this.findAll({
            search: query,
            limit: 20,
            isActive: true
        });
        return result.data;
    }

    /**
     * Get product by barcode (for scanner)
     */
    async getByBarcode(barcode: string): Promise<Product | null> {
        try {
            const response = await apiClient.get<ApiResponse<Product>>(
                `${this.endpoint}/barcode/${barcode}`
            );
            return response.data.data;
        } catch {
            return null;
        }
    }

    /**
     * Check stock availability
     */
    async checkStock(productId: string, warehouseId: string): Promise<{ available: string; reserved: string }> {
        const response = await apiClient.get<ApiResponse<{ available: string; reserved: string }>>(
            `${this.endpoint}/${productId}/stock`,
            { params: { warehouseId } }
        );
        return response.data.data;
    }

    // =========================================================================
    // OFFLINE SUPPORT
    // =========================================================================

    /**
     * Cache products and categories for offline use
     */
    async cacheForOffline(_storeId?: string): Promise<void> {
        try {
            const [products, categories] = await Promise.all([
                this.getAllProducts(500),
                categoryService.getActive(),
            ]);
            await offlineStorage.cacheProducts(products, categories);
            console.log(`[ProductService] Cached ${products.length} products and ${categories.length} categories`);
        } catch (error) {
            console.error('[ProductService] Failed to cache for offline:', error);
        }
    }

    /**
     * Get active products with offline fallback
     * Tries online first, falls back to cache if offline
     */
    async getForPOSWithOffline(categoryId?: string, search?: string): Promise<Product[]> {
        try {
            // Try online first
            return await this.getForPOS(categoryId, search);
        } catch (error) {
            // Fallback to cache
            console.log('[ProductService] Using cached products (offline mode)');
            const cached = await offlineStorage.getProductCache();

            if (!cached) {
                throw new Error('No cached products available and device is offline');
            }

            let products = cached.products;

            // Filter by category
            if (categoryId) {
                products = products.filter((p) => p.categoryId === categoryId);
            }

            // Filter by search
            if (search) {
                const searchLower = search.toLowerCase();
                products = products.filter(
                    (p) =>
                        p.name.toLowerCase().includes(searchLower) ||
                        p.sku.toLowerCase().includes(searchLower) ||
                        p.barcode?.includes(searchLower)
                );
            }

            // Only return active products
            return products.filter((p) => p.isActive);
        }
    }

    /**
     * Get product by ID with offline fallback
     */
    async getByIdWithOffline(productId: string): Promise<Product | null> {
        try {
            const response = await apiClient.get<ApiResponse<Product>>(`${this.endpoint}/${productId}`);
            return response.data.data;
        } catch (error) {
            // Try cache
            return await offlineStorage.getProductById(productId);
        }
    }

    /**
     * Quick search with offline fallback
     */
    async quickSearchWithOffline(query: string): Promise<Product[]> {
        try {
            return await this.quickSearch(query);
        } catch (error) {
            // Fallback to cache search
            const cached = await offlineStorage.getProductCache();
            if (!cached) {
                return [];
            }

            const searchLower = query.toLowerCase();
            return cached.products.filter(
                (p) =>
                    p.isActive &&
                    (p.name.toLowerCase().includes(searchLower) ||
                        p.sku.toLowerCase().includes(searchLower) ||
                        p.barcode?.includes(searchLower))
            );
        }
    }
}

// =============================================================================
// MODIFIER SERVICE
// =============================================================================

class ModifierService extends ApiService<ModifierGroup> {
    constructor() {
        super({ endpoint: '/api/v1/modifiers', cacheKey: 'modifiers' });
    }

    /**
     * Get modifier groups for a product
     */
    async getForProduct(productId: string): Promise<ModifierGroup[]> {
        const response = await apiClient.get<ApiResponse<ModifierGroup[]>>(
            `/api/v1/products/${productId}/modifier-groups`
        );
        return response.data.data;
    }

    /**
     * Get all modifier groups (for settings)
     */
    async getAllGroups(): Promise<ModifierGroup[]> {
        const result = await this.findAll({ limit: 100 });
        return result.data;
    }
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

export const categoryService = new CategoryService();
export const productService = new ProductService();
export const modifierService = new ModifierService();

// =============================================================================
// RE-EXPORT TYPES
// =============================================================================

export type { Category as CategoryType, Product as ProductType, ModifierGroup as ModifierGroupType, Modifier as ModifierType };
