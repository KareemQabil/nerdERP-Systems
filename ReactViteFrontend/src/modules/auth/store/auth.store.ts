import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * User Interface (from SYSTEM.users in nerdjson.md)
 */
export interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    roleId: string;
    role?: {
        id: string;
        name: string;
        permissions: string[]; // JSON array of permission strings
    };
    isActive: boolean;
    pinCode?: string;
    lastLogin?: string; // ISO 8601
}

/**
 * Auth Store Interface
 * Manages authentication state and user session
 */
interface AuthStore {
    // State
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    login: (username: string, password: string) => Promise<void>;
    loginWithPin: (pinCode: string) => Promise<void>;
    logout: () => void;
    refreshAccessToken: () => Promise<void>;
    setUser: (user: User) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;

    // Permission checks
    hasPermission: (permission: string) => boolean;
    hasRole: (roleName: string) => boolean;
}

/**
 * Auth Store
 * Handles user authentication and authorization
 * Persists tokens to localStorage
 */
export const useAuthStore = create<AuthStore>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,

                // Login with username/password
                login: async (username, password) => {
                    set({ isLoading: true });

                    try {
                        // Mock implementation
                        // In production, call AuthService.login(username, password)

                        // Simulate API call
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Mock user data
                        const mockUser: User = {
                            id: 'user-001',
                            username,
                            email: `${username}@nerdpos.com`,
                            fullName: 'Ahmed Mohammed',
                            roleId: 'role-001',
                            role: {
                                id: 'role-001',
                                name: 'Cashier',
                                permissions: [
                                    'pos:create',
                                    'pos:read',
                                    'pos:update',
                                    'orders:read',
                                    'products:read',
                                    'customers:read',
                                ],
                            },
                            isActive: true,
                            lastLogin: new Date().toISOString(),
                        };

                        const mockAccessToken = 'mock-access-token-' + Date.now();
                        const mockRefreshToken = 'mock-refresh-token-' + Date.now();

                        set({
                            user: mockUser,
                            accessToken: mockAccessToken,
                            refreshToken: mockRefreshToken,
                            isAuthenticated: true,
                            isLoading: false,
                        });

                        // Persist to localStorage
                        localStorage.setItem('access_token', mockAccessToken);
                        localStorage.setItem('refresh_token', mockRefreshToken);
                    } catch (error) {
                        set({ isLoading: false });
                        throw error;
                    }
                },

                // Login with PIN code (quick switch)
                loginWithPin: async (pinCode) => {
                    set({ isLoading: true });

                    try {
                        // Mock implementation
                        await new Promise(resolve => setTimeout(resolve, 300));

                        // Mock user lookup by PIN
                        const mockUser: User = {
                            id: 'user-002',
                            username: 'cashier2',
                            email: 'cashier2@nerdpos.com',
                            fullName: 'Fatima Ali',
                            roleId: 'role-001',
                            role: {
                                id: 'role-001',
                                name: 'Cashier',
                                permissions: ['pos:create', 'pos:read', 'orders:read'],
                            },
                            isActive: true,
                            pinCode,
                            lastLogin: new Date().toISOString(),
                        };

                        set({
                            user: mockUser,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    } catch (error) {
                        set({ isLoading: false });
                        throw error;
                    }
                },

                // Logout
                logout: () => {
                    // Clear localStorage
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');

                    // Clear state
                    set({
                        user: null,
                        accessToken: null,
                        refreshToken: null,
                        isAuthenticated: false,
                    });
                },

                // Refresh access token
                refreshAccessToken: async () => {
                    const { refreshToken } = get();
                    if (!refreshToken) {
                        throw new Error('No refresh token available');
                    }

                    try {
                        // Mock implementation
                        const newAccessToken = 'mock-access-token-refreshed-' + Date.now();

                        set({ accessToken: newAccessToken });
                        localStorage.setItem('access_token', newAccessToken);
                    } catch (error) {
                        // If refresh fails, logout
                        get().logout();
                        throw error;
                    }
                },

                // Set user manually
                setUser: (user) => {
                    set({ user, isAuthenticated: true });
                },

                // Set tokens manually
                setTokens: (accessToken, refreshToken) => {
                    set({ accessToken, refreshToken });
                    localStorage.setItem('access_token', accessToken);
                    localStorage.setItem('refresh_token', refreshToken);
                },

                // Check if user has specific permission
                hasPermission: (permission) => {
                    const { user } = get();
                    if (!user || !user.role) return false;
                    return user.role.permissions.includes(permission);
                },

                // Check if user has specific role
                hasRole: (roleName) => {
                    const { user } = get();
                    if (!user || !user.role) return false;
                    return user.role.name === roleName;
                },
            }),
            {
                name: 'auth-storage',
                // Only persist tokens, not the full user object
                partialize: (state) => ({
                    accessToken: state.accessToken,
                    refreshToken: state.refreshToken,
                }),
            }
        ),
        { name: 'auth-store' }
    )
);
