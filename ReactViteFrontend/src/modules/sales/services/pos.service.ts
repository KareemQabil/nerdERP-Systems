import { apiClient } from '@/shared/lib/api';
import type { Product, Category, Customer, Warehouse, Discount } from '../types/pos.types';

/**
 * Core POS Service
 * Handles API calls for products, categories, customers, and warehouses
 */
export class POSService {
    /**
     * Get all product categories
     */
    static async getCategories(): Promise<Category[]> {
        try {
            const data = await apiClient.get<any, any>('/categories');

            // Add "All" category
            const categories: Category[] = [
                { id: 'all', name: 'الكل', nameEn: 'All', count: 0 }
            ];

            // Transform API response
            if (Array.isArray(data)) {
                categories.push(...data.map((cat: any) => ({
                    id: cat.id,
                    name: cat.name || cat.nameAr || 'غير معروف',
                    nameEn: cat.nameEn || cat.name,
                    count: cat.productCount || 0,
                    parentId: cat.parentId || null,
                })));
            }

            return categories;
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            // Return fallback data
            return [
                { id: 'all', name: 'الكل', nameEn: 'All', count: 0 },
                { id: 'hot', name: 'ساخن', nameEn: 'Hot', count: 0 },
                { id: 'cold', name: 'بارد', nameEn: 'Cold', count: 0 },
            ];
        }
    }

    /**
     * Get products (optionally filtered by category)
     */
    static async getProducts(categoryId?: string): Promise<Product[]> {
        try {
            let url = '/products';
            if (categoryId && categoryId !== 'all') {
                url += `?categoryId=${categoryId}`;
            }

            const data = await apiClient.get<any, any>(url);

            // Transform API response
            const products: Product[] = [];
            if (Array.isArray(data)) {
                products.push(...data.map((prod: any) => ({
                    id: prod.id,
                    name: prod.name || prod.nameAr || 'منتج',
                    nameEn: prod.nameEn || prod.name,
                    price: parseFloat(prod.salePrice || prod.price || '0'),
                    salePrice: prod.salePrice,
                    category: prod.categoryId || 'general',
                    imageUrl: prod.imageUrl,
                    barcode: prod.barcode,
                    isAvailable: prod.hasStock !== false && prod.isActive !== false,
                    stock: prod.stock || prod.quantity || 100,
                    isCustomizable: prod.hasModifiers || prod.modifiers?.length > 0,
                    modifiers: prod.modifiers || [],
                    trackInventory: prod.trackInventory !== false,
                    isPrepared: prod.isPrepared || false,
                })));
            }

            return products;
        } catch (error) {
            console.error('Failed to fetch products:', error);
            return [];
        }
    }
}

/**
 * Customer Service
 * Handles customer-related API calls
 */
export class CustomerService {
    static async getCustomers(): Promise<Customer[]> {
        try {
            const data = await apiClient.get<any, any>('/customers');

            const customers: Customer[] = [];
            if (Array.isArray(data)) {
                customers.push(...data.map((cust: any) => ({
                    id: cust.id,
                    name: cust.name,
                    phone: cust.phone || '',
                    email: cust.email,
                    totalOrders: cust.totalOrders || 0,
                    totalSpent: parseFloat(cust.totalSpent || '0'),
                    joinedDate: new Date(cust.createdAt || Date.now()),
                    loyaltyPoints: cust.loyaltyPoints || 0,
                    tier: cust.tier || 'bronze',
                })));
            }

            return customers;
        } catch (error) {
            console.error('Failed to fetch customers:', error);
            // Return mock data for development
            return [
                {
                    id: '1',
                    name: 'أحمد محمد',
                    phone: '0501234567',
                    email: 'ahmed@example.com',
                    totalOrders: 15,
                    totalSpent: 1500,
                    joinedDate: new Date(),
                    loyaltyPoints: 250,
                    tier: 'gold',
                },
                {
                    id: '2',
                    name: 'فاطمة علي',
                    phone: '0557654321',
                    totalOrders: 8,
                    totalSpent: 800,
                    joinedDate: new Date(),
                    loyaltyPoints: 120,
                    tier: 'silver',
                },
            ];
        }
    }
}

/**
 * Discount Service
 * Handles discount/promotion operations
 */
export class DiscountService {
    static async getDiscounts(): Promise<Discount[]> {
        try {
            // TODO: Replace with actual API call when available
            // const data = await apiClient.get<any, any>('/discounts');

            // Mock data for now
            return [
                { id: 'd1', name: '5%', nameEn: '5%', type: 'percentage', value: 5, isActive: true },
                { id: 'd2', name: '10%', nameEn: '10%', type: 'percentage', value: 10, isActive: true },
                { id: 'd3', name: '15%', nameEn: '15%', type: 'percentage', value: 15, isActive: true },
                { id: 'd4', name: '20%', nameEn: '20%', type: 'percentage', value: 20, isActive: true },
                { id: 'd5', name: '25%', nameEn: '25%', type: 'percentage', value: 25, isActive: true },
                { id: 'd6', name: '50%', nameEn: '50%', type: 'percentage', value: 50, isActive: true },
                { id: 'd7', name: '10 ر.س', nameEn: '10 SAR', type: 'fixed', value: 10, isActive: true },
                { id: 'd8', name: '20 ر.س', nameEn: '20 SAR', type: 'fixed', value: 20, isActive: true },
                { id: 'd9', name: '50 ر.س', nameEn: '50 SAR', type: 'fixed', value: 50, isActive: true },
                { id: 'd10', name: 'خصم مخصص', nameEn: 'Custom Discount', type: 'percentage', value: 0, isActive: true },
            ];
        } catch (error) {
            console.error('Failed to fetch discounts:', error);
            return [];
        }
    }
}

/**
 * Warehouse Service
 */
export class WarehouseService {
    static async getWarehouses(): Promise<Warehouse[]> {
        try {
            const data = await apiClient.get<any, any>('/warehouses');

            const warehouses: Warehouse[] = [];
            if (Array.isArray(data)) {
                warehouses.push(...data.map((wh: any) => ({
                    id: wh.id,
                    name: wh.name || wh.nameAr,
                    nameEn: wh.nameEn || wh.name,
                    code: wh.code,
                    isActive: wh.isActive !== false,
                })));
            }

            return warehouses;
        } catch (error) {
            console.error('Failed to fetch warehouses:', error);
            return [
                { id: '1', name: 'المستودع الرئيسي', nameEn: 'Main Warehouse', code: 'WH001', isActive: true },
            ];
        }
    }
}
