import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import type { User, LoginDto, AuthContextType } from '../types/auth.types';

/**
 * Core authentication logic hook
 * Manages user state, login, logout, and session initialization
 */
export const useProvideAuth = (): AuthContextType => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Initialize auth state on mount
     */
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Step 1: Check for user in cookie (fast)
                const userFromCookie = authService.getUserFromCookie();

                if (userFromCookie) {
                    setUser(userFromCookie);
                    setLoading(false);
                    return;
                }

                // Step 2: Try silent refresh (session check)
                try {
                    await authService.refreshToken();
                    const profile = await authService.getProfile();
                    setUser(profile);
                } catch (refreshError) {
                    // Silent refresh failed, user is not authenticated
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    /**
     * Listen for logout events from axios interceptor
     */
    useEffect(() => {
        const handleLogout = () => {
            setUser(null);
            setError(null);
        };

        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    /**
     * Sign in user
     */
    const signIn = useCallback(async (credentials: LoginDto): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            await authService.login(credentials);

            // Get user profile after successful login
            const profile = await authService.getProfile();
            setUser(profile);
        } catch (err: any) {
            const errorMessage = err.message || 'Login failed';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Sign out user
     */
    const signOut = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            await authService.logout();
            setUser(null);
            setError(null);
        } catch (err: any) {
            console.error('Logout error:', err);
            // Even if logout fails, clear local state
            setUser(null);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Silent refresh
     */
    const silentRefresh = useCallback(async (): Promise<void> => {
        try {
            await authService.refreshToken();
            const profile = await authService.getProfile();
            setUser(profile);
        } catch (err) {
            setUser(null);
            throw err;
        }
    }, []);

    return {
        user,
        loading,
        error,
        signIn,
        signOut,
        silentRefresh,
    };
};
