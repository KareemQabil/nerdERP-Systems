import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomersApiService } from '../services/customers-api.service';
import { queryKeys } from '@/core/lib/query-client';
import type { Customer, CustomerFilterDto, CreateCustomerDto, UpdateCustomerDto } from '../types/customer.types';
import type { PaginatedResponse, StandardResponse } from '@/core/types/api.types';

/**
 * Hook: Get customers with search/filter
 * @param filters - Optional search and filters
 * 
 * @example
 * const { data, isLoading } = useCustomers({ search: '0501234567' });
 */
export function useCustomers(filters?: CustomerFilterDto) {
    return useQuery<PaginatedResponse<Customer>>({
        queryKey: queryKeys.customers.list(filters),
        queryFn: () => CustomersApiService.getCustomers(filters),
        placeholderData: (previousData) => previousData,
        // Enable query only if there's a search term (avoid loading all customers)
        enabled: !filters?.search || filters.search.length >= 2,
    });
}

/**
 * Hook: Get single customer by ID
 * @param id - Customer ID
 * 
 * @example
 * const { data: customer } = useCustomer('cust-001');
 */
export function useCustomer(id: string) {
    return useQuery<StandardResponse<Customer>>({
        queryKey: queryKeys.customers.detail(id),
        queryFn: () => CustomersApiService.getCustomerById(id),
        enabled: !!id,
    });
}

/**
 * Hook: Search customers (optimized for autocomplete)
 * @param search - Search term (phone, name, email)
 * 
 * @example
 * const { data: customers } = useCustomerSearch('ahmed');
 */
export function useCustomerSearch(search: string) {
    return useQuery<PaginatedResponse<Customer>>({
        queryKey: ['customers', 'search', search],
        queryFn: () => CustomersApiService.getCustomers({ search, limit: 10 }),
        enabled: search.length >= 2, // Only search with 2+ characters
        staleTime: 60000, // 1 minute
    });
}

/**
 * Hook: Create new customer
 * Invalidates customers list
 * 
 * @example
 * const { mutate } = useCreateCustomer();
 * mutate({ name: 'Ahmed', phone: '+966501234567' });
 */
export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateCustomerDto) => CustomersApiService.createCustomer(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
            console.log('[Customers] Customer created successfully');
        },
    });
}

/**
 * Hook: Update customer
 * Invalidates both list and detail
 * 
 * @example
 * const { mutate } = useUpdateCustomer();
 * mutate({ id: 'cust-001', tier: 'GOLD' });
 */
export function useUpdateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: UpdateCustomerDto) => CustomersApiService.updateCustomer(dto),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
            queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.id) });
            console.log('[Customers] Customer updated successfully');
        },
    });
}

/**
 * Combined hook for customer mutations
 * 
 * @example
 * const { createCustomer, updateCustomer, isLoading } = useCustomerMutations();
 */
export function useCustomerMutations() {
    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();

    return {
        createCustomer,
        updateCustomer,
        isLoading: createCustomer.isPending || updateCustomer.isPending,
    };
}
