import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ErrorResponse } from '@/core/types/api.types';
import { ErrorCode, isCriticalError } from '@/core/types/error.types';

/**
 * Base API URL from environment
 * Falls back to localhost:3000 if not set
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Axios API Client Instance
 * Configured with base URL, headers, and timeout
 */
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

/**
 * Request Interceptor
 * Automatically attaches JWT token from localStorage to all requests
 */
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Attach JWT token if available
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in mock mode
        if (IS_MOCK_MODE) {
            console.log('[API Request]', config.method?.toUpperCase(), config.url);
        }

        return config;
    },
    (error: AxiosError) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Handles errors, token expiration, and critical system errors
 */
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Log successful response in mock mode
        if (IS_MOCK_MODE) {
            console.log('[API Response]', response.status, response.config.url);
        }
        return response;
    },
    async (error: AxiosError<ErrorResponse>) => {
        // Handle network errors (no response from server)
        if (!error.response) {
            console.error('[Network Error]', error.message);
            return Promise.reject({
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    messageKey: 'error.network',
                    message: 'Network connection failed. Please check your internet connection.',
                },
            });
        }

        const { status, data } = error.response;
        const apiError = data?.error;

        // Log error in development
        if (import.meta.env.DEV) {
            console.error('[API Error]', {
                status,
                url: error.config?.url,
                code: apiError?.code,
                message: apiError?.message,
            });
        }

        // Handle 401 Unauthorized - Token expired/invalid
        if (status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');

            // Redirect to login only if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }

            return Promise.reject(error);
        }

        // Handle critical system errors (ZATCA hash chain broken, etc.)
        if (apiError?.code && isCriticalError(apiError.code as ErrorCode)) {
            console.error('🚨 CRITICAL SYSTEM ERROR:', apiError);

            // TODO: Trigger global modal/lock UI
            // This should prevent any further operations until resolved
            alert(`CRITICAL ERROR: ${apiError.message}\n\nPlease contact system administrator immediately.`);

            return Promise.reject(error);
        }

        // Handle 403 Forbidden - Insufficient permissions
        if (status === 403) {
            console.warn('[Permission Denied]', apiError?.message);
            // TODO: Show permission denied toast/modal
        }

        // Handle 404 Not Found
        if (status === 404) {
            console.warn('[Resource Not Found]', error.config?.url);
        }

        // Handle 500 Internal Server Error
        if (status >= 500) {
            console.error('[Server Error]', apiError?.message);
            // TODO: Show server error toast
        }

        return Promise.reject(error);
    }
);
