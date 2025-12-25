/**
 * Customer Service
 * Handles customer search, creation, and loyalty operations
 */
import { apiClient } from '@/lib/api-client';
import { ApiService } from '@/lib/api-service';
import type { ApiResponse, PaginatedResult, QueryParams } from '@/types/api.types';

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

// =============================================================================
// CUSTOMER SERVICE
// =============================================================================

class CustomerService extends ApiService<Customer, CreateCustomerDto, UpdateCustomerDto> {
    constructor() {
        super({ endpoint: '/api/v1/customers', cacheKey: 'customers' });
    }

    /**
     * Search customers by name or phone
     */
    async searchCustomers(query: string): Promise<Customer[]> {
        const result = await this.findAll({
            search: query,
            limit: 20
        });
        return result.data;
    }

    /**
     * Get customer by phone number
     */
    async getByPhone(phone: string): Promise<Customer | null> {
        try {
            const response = await apiClient.get<ApiResponse<Customer>>(
                `${this.endpoint}/phone/${phone}`
            );
            return response.data.data;
        } catch {
            return null;
        }
    }

    /**
     * Quick create customer with minimal info
     */
    async quickCreate(name: string, phone: string): Promise<Customer> {
        return this.create({ name, phone });
    }

    /**
     * Get customer order history
     */
    async getOrderHistory(customerId: string, params?: QueryParams): Promise<PaginatedResult<CustomerOrder>> {
        const response = await apiClient.get<ApiResponse<PaginatedResult<CustomerOrder>>>(
            `${this.endpoint}/${customerId}/orders`,
            { params }
        );
        return response.data.data;
    }

    // =========================================================================
    // LOYALTY OPERATIONS
    // =========================================================================

    /**
     * Get customer loyalty summary
     */
    async getLoyaltySummary(customerId: string): Promise<LoyaltySummary> {
        const response = await apiClient.get<ApiResponse<LoyaltySummary>>(
            `${this.endpoint}/${customerId}/loyalty`
        );
        return response.data.data;
    }

    /**
     * Award loyalty points
     */
    async awardPoints(customerId: string, points: number, reason: string): Promise<Customer> {
        const response = await apiClient.post<ApiResponse<Customer>>(
            `${this.endpoint}/${customerId}/loyalty/award`,
            { points, reason }
        );
        return response.data.data;
    }

    /**
     * Redeem loyalty points
     */
    async redeemPoints(customerId: string, points: number): Promise<Customer> {
        const response = await apiClient.post<ApiResponse<Customer>>(
            `${this.endpoint}/${customerId}/loyalty/redeem`,
            { points }
        );
        return response.data.data;
    }

    // =========================================================================
    // STORE CREDIT OPERATIONS
    // =========================================================================

    /**
     * Add store credit
     */
    async addCredit(customerId: string, amount: string, reason: string): Promise<Customer> {
        const response = await apiClient.post<ApiResponse<Customer>>(
            `${this.endpoint}/${customerId}/credit/add`,
            { amount, reason }
        );
        return response.data.data;
    }

    /**
     * Use store credit
     */
    async useCredit(customerId: string, amount: string, orderId: string): Promise<Customer> {
        const response = await apiClient.post<ApiResponse<Customer>>(
            `${this.endpoint}/${customerId}/credit/use`,
            { amount, orderId }
        );
        return response.data.data;
    }

    /**
     * Get credit history
     */
    async getCreditHistory(customerId: string): Promise<CreditTransaction[]> {
        const response = await apiClient.get<ApiResponse<CreditTransaction[]>>(
            `${this.endpoint}/${customerId}/credit/history`
        );
        return response.data.data;
    }
}

// =============================================================================
// ADDITIONAL TYPES
// =============================================================================

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
// SINGLETON INSTANCE
// =============================================================================

export const customerService = new CustomerService();
