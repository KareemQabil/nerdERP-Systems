import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { queryKeys } from '@/core/lib/query-client';

/**
 * Login Credentials DTO
 */
export interface LoginCredentials {
    username: string;
    password: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: any; // User type from auth.store.ts
}

/**
 * Hook: Login with username/password
 * Updates authStore on success
 */
export function useLogin() {
    const queryClient = useQueryClient();
    const { setUser, setTokens } = useAuthStore();

    return useMutation({
        mutationFn: async (credentials: LoginCredentials) => {
            // Call authStore.login which handles the API call
            await useAuthStore.getState().login(credentials.username, credentials.password);

            // Return user from store
            const user = useAuthStore.getState().user;
            const accessToken = useAuthStore.getState().accessToken;
            const refreshToken = useAuthStore.getState().refreshToken;

            return { user, accessToken, refreshToken };
        },
        onSuccess: (data) => {
            // Invalidate all queries on login (fresh start)
            queryClient.invalidateQueries();

            // Store is already updated by authStore.login()
            console.log('[Auth] Login successful:', data.user?.username);
        },
        onError: (error) => {
            console.error('[Auth] Login failed:', error);
        },
    });
}

/**
 * Hook: Login with PIN code
 * Quick cashier switch
 */
export function useLoginWithPin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (pinCode: string) => {
            await useAuthStore.getState().loginWithPin(pinCode);
            const user = useAuthStore.getState().user;
            return { user };
        },
        onSuccess: (data) => {
            console.log('[Auth] PIN login successful:', data.user?.username);
        },
    });
}

/**
 * Hook: Logout
 * Clears auth state and invalidates queries
 */
export function useLogout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            useAuthStore.getState().logout();
        },
        onSuccess: () => {
            // Clear all cached queries on logout
            queryClient.clear();
            console.log('[Auth] Logout successful');
        },
    });
}
