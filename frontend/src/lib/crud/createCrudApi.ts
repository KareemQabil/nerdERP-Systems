/**
 * Generic CRUD API Factory for RTK Query
 * Creates standardized CRUD endpoints for any entity type
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithErrorHandling } from '@/lib/api/baseQuery';
import type { PaginatedData, QueryParams } from '@/lib/api/types';

// =============================================================================
// TYPES
// =============================================================================

export interface CrudApiConfig {
    /**
     * Unique reducer path for this API
     * @example 'productsApi'
     */
    reducerPath: string;

    /**
     * Base API endpoint (without leading slash)
     * @example 'api/v1/products'
     */
    baseEndpoint: string;

    /**
     * Tag type for cache invalidation
     * @example 'Product'
     */
    tagType: string;
}

export interface EntityWithId {
    id: string;
}

// =============================================================================
// CRUD API FACTORY
// =============================================================================

/**
 * Creates a complete CRUD API with RTK Query
 *
 * @example
 * // Create products API
 * export const productsApi = createCrudApi<Product, CreateProductDto, UpdateProductDto>({
 *   reducerPath: 'productsApi',
 *   baseEndpoint: 'api/v1/products',
 *   tagType: 'Product',
 * });
 *
 * // Use in components
 * const { data, isLoading } = productsApi.useGetAllQuery({ page: 1, limit: 10 });
 * const [createProduct] = productsApi.useCreateMutation();
 */
export function createCrudApi<
    TEntity extends EntityWithId,
    TCreateDto = Omit<TEntity, 'id'>,
    TUpdateDto = Partial<TCreateDto>
>(config: CrudApiConfig) {
    const { reducerPath, baseEndpoint, tagType } = config;

    return createApi({
        reducerPath,
        baseQuery: baseQueryWithErrorHandling,
        tagTypes: [tagType, `${tagType}List`],
        endpoints: (builder) => ({
            // =================================================================
            // GET ALL (with pagination)
            // =================================================================
            getAll: builder.query<PaginatedData<TEntity>, QueryParams | void>({
                query: (params) => ({
                    url: baseEndpoint,
                    params: params || {},
                }),
                providesTags: (result) =>
                    result
                        ? [
                              // Tag each item individually
                              ...result.items.map(({ id }) => ({
                                  type: tagType,
                                  id,
                              })),
                              // Tag the list itself
                              { type: `${tagType}List`, id: 'LIST' },
                          ]
                        : [{ type: `${tagType}List`, id: 'LIST' }],
            }),

            // =================================================================
            // GET BY ID
            // =================================================================
            getById: builder.query<TEntity, string>({
                query: (id) => `${baseEndpoint}/${id}`,
                providesTags: (_result, _error, id) => [{ type: tagType, id }],
            }),

            // =================================================================
            // SEARCH
            // =================================================================
            search: builder.query<TEntity[], { query: string; limit?: number }>({
                query: ({ query, limit = 20 }) => ({
                    url: baseEndpoint,
                    params: { search: query, limit },
                }),
                providesTags: [{ type: `${tagType}List`, id: 'SEARCH' }],
            }),

            // =================================================================
            // CREATE
            // =================================================================
            create: builder.mutation<TEntity, TCreateDto>({
                query: (body) => ({
                    url: baseEndpoint,
                    method: 'POST',
                    body,
                }),
                invalidatesTags: [{ type: `${tagType}List`, id: 'LIST' }],
            }),

            // =================================================================
            // UPDATE
            // =================================================================
            update: builder.mutation<TEntity, { id: string; data: TUpdateDto }>({
                query: ({ id, data }) => ({
                    url: `${baseEndpoint}/${id}`,
                    method: 'PATCH',
                    body: data,
                }),
                invalidatesTags: (_result, _error, { id }) => [
                    { type: tagType, id },
                    { type: `${tagType}List`, id: 'LIST' },
                ],
            }),

            // =================================================================
            // DELETE
            // =================================================================
            delete: builder.mutation<void, string>({
                query: (id) => ({
                    url: `${baseEndpoint}/${id}`,
                    method: 'DELETE',
                }),
                invalidatesTags: (_result, _error, id) => [
                    { type: tagType, id },
                    { type: `${tagType}List`, id: 'LIST' },
                ],
            }),

            // =================================================================
            // BULK CREATE
            // =================================================================
            createBulk: builder.mutation<TEntity[], TCreateDto[]>({
                query: (items) => ({
                    url: `${baseEndpoint}/bulk`,
                    method: 'POST',
                    body: { items },
                }),
                invalidatesTags: [{ type: `${tagType}List`, id: 'LIST' }],
            }),

            // =================================================================
            // BULK DELETE
            // =================================================================
            deleteBulk: builder.mutation<void, string[]>({
                query: (ids) => ({
                    url: `${baseEndpoint}/bulk`,
                    method: 'DELETE',
                    body: { ids },
                }),
                invalidatesTags: [{ type: `${tagType}List`, id: 'LIST' }],
            }),
        }),
    });
}

// =============================================================================
// HOOK HELPERS
// =============================================================================

/**
 * Type for the API returned by createCrudApi
 */
export type CrudApi<
    TEntity extends EntityWithId,
    TCreateDto = Omit<TEntity, 'id'>,
    TUpdateDto = Partial<TCreateDto>
> = ReturnType<typeof createCrudApi<TEntity, TCreateDto, TUpdateDto>>;

/**
 * Extract hook types from a CRUD API
 */
export type CrudApiHooks<T extends ReturnType<typeof createCrudApi>> = {
    useGetAllQuery: T['useGetAllQuery'];
    useGetByIdQuery: T['useGetByIdQuery'];
    useSearchQuery: T['useSearchQuery'];
    useCreateMutation: T['useCreateMutation'];
    useUpdateMutation: T['useUpdateMutation'];
    useDeleteMutation: T['useDeleteMutation'];
    useCreateBulkMutation: T['useCreateBulkMutation'];
    useDeleteBulkMutation: T['useDeleteBulkMutation'];
};

// =============================================================================
// EXTEND API HELPER
// =============================================================================

/**
 * Helper to extend a base CRUD API with additional endpoints
 *
 * @example
 * const extendedApi = productsApi.injectEndpoints({
 *   endpoints: (builder) => ({
 *     getByBarcode: builder.query<Product, string>({
 *       query: (barcode) => `${baseEndpoint}/barcode/${barcode}`,
 *     }),
 *   }),
 * });
 */
export type ExtendableApi<T extends ReturnType<typeof createCrudApi>> = T;
