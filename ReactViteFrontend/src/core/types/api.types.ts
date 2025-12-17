// Core API Response Types based on API_STANDARDS.md

/**
 * Standard success response wrapper
 * All API endpoints return data in this format
 */
export interface StandardResponse<T> {
    success: true;
    data: T;
    messageKey?: string;
    timestamp: string; // ISO 8601 format
}

/**
 * Paginated response structure
 * Used for list endpoints with pagination
 */
export interface PaginatedResponse<T> {
    success: true;
    data: {
        data: T[];
        meta: PaginationMeta;
    };
    timestamp: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Error response structure
 * Returned when API call fails
 */
export interface ErrorResponse {
    success: false;
    error: ApiError;
    timestamp: string;
    path: string;
}

export interface ApiError {
    code: string; // e.g., "SALES_003", "INV_002"
    messageKey: string; // For i18n
    message: string; // Human-readable error
    details?: Record<string, any>; // Additional context
}

/**
 * Base filter DTO for all paginated endpoints
 */
export interface BaseFilterDto {
    page?: number; // Default: 1
    limit?: number; // Default: 10, Max: 100
    sortBy?: string; // Default: 'created_at'
    sortOrder?: 'ASC' | 'DESC'; // Default: 'DESC'
}
