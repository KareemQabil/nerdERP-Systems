import { apiClient } from '@/core/services/api/api-client';
import type { Customer, CustomerFilterDto, CreateCustomerDto, UpdateCustomerDto } from '../types/customer.types';
import type { StandardResponse, PaginatedResponse } from '@/core/types/api.types';
import { MOCK_CUSTOMERS } from '@/core/services/mock/mock-customers';
import { createMockStandardResponse, createMockPaginatedResponse } from '@/core/services/mock/mock-products';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Customers API Service
 * Handles all customer-related API calls
 */
export class CustomersApiService {
    private static readonly BASE_PATH = '/api/v1/customers';

    /**
     * Get customers with optional search/filter
     */
    static async getCustomers(filters?: CustomerFilterDto): Promise<PaginatedResponse<Customer>> {
        if (IS_MOCK_MODE) {
            let filteredCustomers = [...MOCK_CUSTOMERS];

            // Filter by tier
            if (filters?.tier) {
                filteredCustomers = filteredCustomers.filter(c => c.tier === filters.tier);
            }

            // Filter by active status
            if (filters?.isActive !== undefined) {
                filteredCustomers = filteredCustomers.filter(c => c.isActive === filters.isActive);
            }

            // Search by name, phone, email
            if (filters?.search) {
                const searchLower = filters.search.toLowerCase();
                filteredCustomers = filteredCustomers.filter(
                    c =>
                        c.name.toLowerCase().includes(searchLower) ||
                        c.nameAr?.toLowerCase().includes(searchLower) ||
                        c.phone.includes(searchLower) ||
                        c.email?.toLowerCase().includes(searchLower)
                );
            }

            return createMockPaginatedResponse(filteredCustomers, filters?.page, filters?.limit);
        }

        const response = await apiClient.get<PaginatedResponse<Customer>>(
            this.BASE_PATH,
            { params: filters }
        );
        return response.data;
    }

    /**
     * Get customer by ID
     */
    static async getCustomerById(id: string): Promise<StandardResponse<Customer>> {
        if (IS_MOCK_MODE) {
            const customer = MOCK_CUSTOMERS.find(c => c.id === id);
            if (!customer) {
                throw new Error('Customer not found');
            }
            return createMockStandardResponse(customer);
        }

        const response = await apiClient.get<StandardResponse<Customer>>(`${this.BASE_PATH}/${id}`);
        return response.data;
    }

    /**
     * Create new customer
     */
    static async createCustomer(dto: CreateCustomerDto): Promise<StandardResponse<Customer>> {
        if (IS_MOCK_MODE) {
            const newCustomer: Customer = {
                id: `cust-${Date.now()}`,
                customerCode: `C-${String(MOCK_CUSTOMERS.length + 1).padStart(3, '0')}`,
                ...dto,
                creditLimit: dto.creditLimit || '0.000',
                creditBalance: '0.000',
                loyaltyPoints: 0,
                tier: dto.tier || 'REGULAR',
                isActive: true,
                createdAt: new Date().toISOString(),
            };
            return createMockStandardResponse(newCustomer);
        }

        const response = await apiClient.post<StandardResponse<Customer>>(this.BASE_PATH, dto);
        return response.data;
    }

    /**
     * Update customer
     */
    static async updateCustomer(dto: UpdateCustomerDto): Promise<StandardResponse<Customer>> {
        if (IS_MOCK_MODE) {
            const customer = MOCK_CUSTOMERS.find(c => c.id === dto.id);
            if (!customer) {
                throw new Error('Customer not found');
            }
            const updatedCustomer: Customer = { ...customer, ...dto };
            return createMockStandardResponse(updatedCustomer);
        }

        const response = await apiClient.put<StandardResponse<Customer>>(
            `${this.BASE_PATH}/${dto.id}`,
            dto
        );
        return response.data;
    }
}
