import { apiClient } from '@/core/services/api/api-client';
import type { PaginatedResponse, StandardResponse } from '@/core/types/api.types';
import type { Product, CreateProductDto, UpdateProductDto, ProductFilterDto } from '../types/product.types';
import { MOCK_PRODUCTS, createMockStandardResponse, createMockPaginatedResponse } from '@/core/services/mock/mock-products';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export class ProductsApiService {
    private static readonly BASE_PATH = '/products';

    /**
     * Get paginated products with filters
     */
    static async getProducts(filters?: ProductFilterDto): Promise<PaginatedResponse<Product>> {
        if (IS_MOCK_MODE) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            let filtered = [...MOCK_PRODUCTS];

            if (filters?.search) {
                const query = filters.search.toLowerCase();
                filtered = filtered.filter(p =>
                    p.name.toLowerCase().includes(query) ||
                    p.sku.toLowerCase().includes(query)
                );
            }

            if (filters?.categoryId) {
                filtered = filtered.filter(p => p.categoryId === filters.categoryId);
            }

            if (filters?.isActive !== undefined) {
                filtered = filtered.filter(p => p.isActive === filters.isActive);
            }

            return createMockPaginatedResponse(filtered, filters?.page, filters?.limit);
        }

        const response = await apiClient.get<PaginatedResponse<Product>>(
            this.BASE_PATH,
            { params: filters }
        );
        return response.data;
    }

    /**
     * Get single product
     */
    static async getProductById(id: string): Promise<StandardResponse<Product>> {
        if (IS_MOCK_MODE) {
            const product = MOCK_PRODUCTS.find((p) => p.id === id);
            if (!product) throw new Error('Product not found');
            return createMockStandardResponse(product);
        }

        const response = await apiClient.get<StandardResponse<Product>>(`${this.BASE_PATH}/${id}`);
        return response.data;
    }

    /**
     * Create Product
     */
    static async createProduct(dto: CreateProductDto): Promise<StandardResponse<Product>> {
        if (IS_MOCK_MODE) {
            const newProduct: Product = {
                id: `new-${Date.now()}`,
                ...dto,
                taxRate: dto.taxRate || '15.00',
                isTaxInclusive: dto.isTaxInclusive ?? true,
                isStockManaged: dto.isStockManaged ?? true,
                isTaxExempt: false,
                isActive: true,
                isFeatured: false,
                displayOrder: dto.displayOrder ?? 0, // Fix: Added missing default
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            return createMockStandardResponse(newProduct);
        }

        const response = await apiClient.post<StandardResponse<Product>>(this.BASE_PATH, dto);
        return response.data;
    }

    /**
     * Update Product
     */
    static async updateProduct(id: string, dto: UpdateProductDto): Promise<StandardResponse<Product>> {
        if (IS_MOCK_MODE) {
            const product = MOCK_PRODUCTS.find(p => p.id === id);
            if (!product) throw new Error('Not found');

            const updated = { ...product, ...dto };
            return createMockStandardResponse(updated);
        }

        const response = await apiClient.put<StandardResponse<Product>>(`${this.BASE_PATH}/${id}`, dto);
        return response.data;
    }

    /**
     * Delete Product
     */
    static async deleteProduct(id: string): Promise<StandardResponse<void>> {
        if (IS_MOCK_MODE) {
            return createMockStandardResponse(undefined as any);
        }

        const response = await apiClient.delete<StandardResponse<void>>(`${this.BASE_PATH}/${id}`);
        return response.data;
    }

    /**
     * Get Categories
     */
    static async getCategories(): Promise<StandardResponse<any[]>> {
        if (IS_MOCK_MODE) {
            const categories = [
                { id: 'cat-hot', name: 'مشروبات ساخنة' },
                { id: 'cat-cold', name: 'مشروبات باردة' },
                { id: 'cat-bakery', name: 'مخبوزات' },
                { id: 'cat-dessert', name: 'حلويات' }
            ];
            return createMockStandardResponse(categories);
        }

        const response = await apiClient.get<StandardResponse<any[]>>('/categories');
        return response.data;
    }
}
