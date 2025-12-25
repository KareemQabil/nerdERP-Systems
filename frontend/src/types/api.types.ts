/**
 * API Types
 * Type definitions for API responses and requests
 */

// =============================================================================
// STANDARD API RESPONSE
// =============================================================================

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    messageKey?: string;
    timestamp: string;
}

export interface ApiError {
    success: false;
    error: {
        code: string;
        messageKey: string;
        message: string;
        details?: Record<string, unknown>;
    };
    timestamp: string;
    path: string;
}

// =============================================================================
// PAGINATION
// =============================================================================

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
    search?: string;
}

// =============================================================================
// QUERY PARAMS
// =============================================================================

export interface QueryParams extends PaginationParams {
    [key: string]: string | number | boolean | undefined;
}
