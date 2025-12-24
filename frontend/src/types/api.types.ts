/** Standard API response wrapper */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    messageKey?: string;
    timestamp: string;
}

/** Error response structure */
export interface ApiError {
    success: false;
    error: {
        code: string;        // e.g., 'SALES_003', 'INV_002'
        messageKey: string;  // i18n key
        message: string;     // Human-readable fallback
        details?: Record<string, unknown>;
    };
    timestamp: string;
    path: string;
}

/** Paginated response */
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/** Query params for paginated requests */
export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

/** Base entity fields (all entities have these) */
export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}
