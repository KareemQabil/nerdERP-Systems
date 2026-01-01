/**
 * API Types for Redux Toolkit Query
 * Standard {data, error} response format
 */

// =============================================================================
// STANDARD API RESPONSE FORMAT
// =============================================================================

/**
 * Success response - data has value, error is null
 */
export interface ApiSuccessResponse<T> {
    data: T;
    error: null;
}

/**
 * Error response - data is null, error has value
 */
export interface ApiErrorResponse {
    data: null;
    error: ApiErrorDetails;
}

/**
 * Error details structure
 */
export interface ApiErrorDetails {
    code: string;
    message: string;
    messageKey: string;
    details?: Record<string, unknown>;
}

/**
 * Union type for all API responses
 */
export type ApiResult<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Check if response is a success
 */
export function isSuccess<T>(result: ApiResult<T>): result is ApiSuccessResponse<T> {
    return result.error === null && result.data !== null;
}

/**
 * Check if response is an error
 */
export function isError<T>(result: ApiResult<T>): result is ApiErrorResponse {
    return result.error !== null && result.data === null;
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

export interface PaginatedData<T> {
    items: T[];
    meta: PaginationMeta;
}

// =============================================================================
// QUERY PARAMS
// =============================================================================

export interface QueryParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
    search?: string;
    [key: string]: string | number | boolean | undefined;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a success response
 */
export function createSuccess<T>(data: T): ApiSuccessResponse<T> {
    return { data, error: null };
}

/**
 * Create an error response
 */
export function createError(
    code: string,
    message: string,
    messageKey: string,
    details?: Record<string, unknown>
): ApiErrorResponse {
    return {
        data: null,
        error: { code, message, messageKey, details },
    };
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
        if ('error' in error && (error as ApiErrorResponse).error) {
            return (error as ApiErrorResponse).error.message;
        }
        if ('message' in error) {
            return (error as Error).message;
        }
    }
    return 'An unknown error occurred';
}

/**
 * Extract error code from API error
 */
export function getErrorCode(error: unknown): string | null {
    if (error && typeof error === 'object' && 'error' in error) {
        return (error as ApiErrorResponse).error?.code ?? null;
    }
    return null;
}
