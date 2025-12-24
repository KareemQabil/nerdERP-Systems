import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types/api.types';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

/**
 * Axios instance with interceptors for auth and error handling
 */
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'ar', // Default to Arabic
    },
});

/**
 * Request interceptor - Add auth token and language
 */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Add auth token from localStorage
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Get current language for Accept-Language header
        try {
            const settingsRaw = localStorage.getItem('nerdpos-settings');
            if (settingsRaw) {
                const settings = JSON.parse(settingsRaw);
                const language = settings?.state?.language || 'ar';
                config.headers['Accept-Language'] = language;
            }
        } catch {
            // Ignore parse errors
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response interceptor - Handle errors globally
 */
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            // Clear auth and redirect to login
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Transform error for consistent handling
        const apiError: ApiError = error.response?.data || {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                messageKey: 'errors.network',
                message: error.message || 'Network error',
            },
            timestamp: new Date().toISOString(),
            path: error.config?.url || '',
        };

        return Promise.reject(apiError);
    }
);

/**
 * Helper to check if error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'success' in error &&
        (error as ApiError).success === false &&
        'error' in error
    );
}

/**
 * Get error message from API error or generic error
 */
export function getErrorMessage(error: unknown): string {
    if (isApiError(error)) {
        return error.error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred';
}

/**
 * Get error code from API error
 */
export function getErrorCode(error: unknown): string | null {
    if (isApiError(error)) {
        return error.error.code;
    }
    return null;
}
