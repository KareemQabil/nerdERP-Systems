/**
 * Base API Service
 * Generic service class with common CRUD operations and caching
 */
import { apiClient, isApiError, getErrorMessage } from '@/lib/api-client';
import type { ApiResponse, PaginatedResult, QueryParams } from '@/types/api.types';

// =============================================================================
// SERVICE OPTIONS
// =============================================================================

export interface ServiceOptions {
    /** Base endpoint path (e.g., '/products', '/orders') */
    endpoint: string;
    /** Cache key prefix for this service */
    cacheKey?: string;
    /** Default query params to include in all requests */
    defaultParams?: QueryParams;
}

// =============================================================================
// BASE SERVICE CLASS
// =============================================================================

export abstract class ApiService<
    TEntity,
    TCreateDto = Partial<TEntity>,
    TUpdateDto = Partial<TEntity>
> {
    protected endpoint: string;
    protected cacheKey: string;
    protected defaultParams: QueryParams;

    constructor(options: ServiceOptions) {
        this.endpoint = options.endpoint;
        this.cacheKey = options.cacheKey ?? options.endpoint;
        this.defaultParams = options.defaultParams ?? {};
    }

    // =========================================================================
    // READ OPERATIONS
    // =========================================================================

    /**
     * Get all entities with optional pagination and filtering
     */
    async findAll(params?: QueryParams): Promise<PaginatedResult<TEntity>> {
        try {
            const response = await apiClient.get<ApiResponse<PaginatedResult<TEntity>>>(
                this.endpoint,
                { params: { ...this.defaultParams, ...params } }
            );
            return response.data.data;
        } catch (error) {
            console.error(`[${this.cacheKey}] findAll error:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Get a single entity by ID
     */
    async findById(id: string): Promise<TEntity> {
        try {
            const response = await apiClient.get<ApiResponse<TEntity>>(
                `${this.endpoint}/${id}`
            );
            return response.data.data;
        } catch (error) {
            console.error(`[${this.cacheKey}] findById error:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Search entities by query
     */
    async search(query: string, params?: QueryParams): Promise<PaginatedResult<TEntity>> {
        return this.findAll({ ...params, search: query });
    }

    // =========================================================================
    // WRITE OPERATIONS
    // =========================================================================

    /**
     * Create a new entity
     */
    async create(dto: TCreateDto): Promise<TEntity> {
        try {
            const response = await apiClient.post<ApiResponse<TEntity>>(
                this.endpoint,
                dto
            );
            return response.data.data;
        } catch (error) {
            console.error(`[${this.cacheKey}] create error:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Update an existing entity
     */
    async update(id: string, dto: TUpdateDto): Promise<TEntity> {
        try {
            const response = await apiClient.patch<ApiResponse<TEntity>>(
                `${this.endpoint}/${id}`,
                dto
            );
            return response.data.data;
        } catch (error) {
            console.error(`[${this.cacheKey}] update error:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Delete an entity
     */
    async delete(id: string): Promise<void> {
        try {
            await apiClient.delete(`${this.endpoint}/${id}`);
        } catch (error) {
            console.error(`[${this.cacheKey}] delete error:`, error);
            throw this.handleError(error);
        }
    }

    // =========================================================================
    // BULK OPERATIONS
    // =========================================================================

    /**
     * Create multiple entities
     */
    async createBulk(dtos: TCreateDto[]): Promise<TEntity[]> {
        try {
            const response = await apiClient.post<ApiResponse<TEntity[]>>(
                `${this.endpoint}/bulk`,
                { items: dtos }
            );
            return response.data.data;
        } catch (error) {
            console.error(`[${this.cacheKey}] createBulk error:`, error);
            throw this.handleError(error);
        }
    }

    /**
     * Delete multiple entities
     */
    async deleteBulk(ids: string[]): Promise<void> {
        try {
            await apiClient.delete(`${this.endpoint}/bulk`, {
                data: { ids }
            });
        } catch (error) {
            console.error(`[${this.cacheKey}] deleteBulk error:`, error);
            throw this.handleError(error);
        }
    }

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    protected handleError(error: unknown): Error {
        if (isApiError(error)) {
            return new ApiServiceError(
                error.error.message,
                error.error.code,
                error.error.details
            );
        }
        return new Error(getErrorMessage(error));
    }
}

// =============================================================================
// CUSTOM ERROR CLASS
// =============================================================================

export class ApiServiceError extends Error {
    public readonly code: string;
    public readonly details?: Record<string, unknown>;

    constructor(message: string, code: string, details?: Record<string, unknown>) {
        super(message);
        this.name = 'ApiServiceError';
        this.code = code;
        this.details = details;
    }
}

// =============================================================================
// SERVICE FACTORY
// =============================================================================

/**
 * Create a simple API service for an entity type
 * Use this for quick service creation without extending the base class
 */
export function createApiService<TEntity, TCreate = Partial<TEntity>, TUpdate = Partial<TEntity>>(
    endpoint: string
) {
    return new (class extends ApiService<TEntity, TCreate, TUpdate> {
        constructor() {
            super({ endpoint });
        }
    })();
}
