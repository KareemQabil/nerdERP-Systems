/**
 * RTK Query Base Query Configuration
 * Custom base query with auth, language headers, and error handling
 */

import {
    fetchBaseQuery,
    type FetchBaseQueryError,
    type BaseQueryFn,
    type FetchArgs,
} from '@reduxjs/toolkit/query/react';
import type { ApiErrorDetails } from './types';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

/**
 * Base fetch query with auth headers
 */
const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    timeout: API_TIMEOUT,
    credentials: 'include',
    prepareHeaders: (headers) => {
        // Set content type
        headers.set('Content-Type', 'application/json');

        // Add auth token from localStorage
        const token = localStorage.getItem('auth_token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        // Get language from localStorage (most reliable during early loading)
        let language = 'ar'; // Default to Arabic

        try {
            // First try the redux-persist format
            const persistedRaw = localStorage.getItem('persist:nerdpos');
            if (persistedRaw) {
                const parsed = JSON.parse(persistedRaw);
                const settings = JSON.parse(parsed.settings || '{}');
                language = settings?.language || 'ar';
            } else {
                // Fallback to the old zustand settings format (during migration)
                const settingsRaw = localStorage.getItem('nerdpos-settings');
                if (settingsRaw) {
                    const settings = JSON.parse(settingsRaw);
                    language = settings?.state?.language || 'ar';
                }
            }
        } catch {
            // Ignore parse errors
        }

        headers.set('Accept-Language', language);

        return headers;
    },
});

/**
 * Custom base query with error handling and response transformation
 * Handles the {data, error} response format
 */
export const baseQueryWithErrorHandling: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    // Handle 401 Unauthorized - redirect to login
    if (result.error?.status === 401) {
        localStorage.removeItem('auth_token');
        // Dispatch logout action if needed
        // api.dispatch(logout());
        window.location.href = '/login';
        return result;
    }

    // Handle successful response with new {data, error} format
    if (result.data) {
        const response = result.data as { data: unknown; error: null } | { data: null; error: ApiErrorDetails };

        // If backend returns error in the response body (success false)
        if (response.error !== null) {
            return {
                error: {
                    status: 'CUSTOM_ERROR',
                    data: response.error,
                } as FetchBaseQueryError,
            };
        }

        // Return unwrapped data
        return { data: response.data };
    }

    // Handle network or other errors
    if (result.error) {
        // Transform to consistent error format
        const errorData = result.error.data as { error?: ApiErrorDetails } | undefined;

        if (errorData?.error) {
            return {
                error: {
                    status: result.error.status,
                    data: errorData.error,
                } as FetchBaseQueryError,
            };
        }

        // Network error or unknown error
        return {
            error: {
                status: result.error.status || 'FETCH_ERROR',
                data: {
                    code: 'NETWORK_ERROR',
                    message: 'Network error occurred',
                    messageKey: 'errors.network',
                } as ApiErrorDetails,
            } as FetchBaseQueryError,
        };
    }

    return result;
};

/**
 * Extract error details from RTK Query error
 */
export function extractErrorDetails(error: unknown): ApiErrorDetails {
    if (error && typeof error === 'object') {
        const fetchError = error as FetchBaseQueryError;

        if (fetchError.data && typeof fetchError.data === 'object') {
            const data = fetchError.data as ApiErrorDetails;
            if (data.code && data.message) {
                return data;
            }
        }
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        messageKey: 'errors.unknown',
    };
}

export { API_BASE_URL, API_TIMEOUT };
