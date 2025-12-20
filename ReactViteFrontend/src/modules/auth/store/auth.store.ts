import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
    type User,
    UserRole,
    Permission,
    ROLE_PERMISSIONS,
    hasPermission,
    type AuthorizationRequest,
    type AuthorizationResult,
} from '../types/auth.types';

/**
 * ============================================
 * RESTAURANT POS - AUTH STORE (REFACTORED)
 * ============================================
 * Phase 1: Core Security Foundation
 * Manager PIN Authentication System
 */

// ============================================
// MOCK USERS (Testing Only)
// ============================================

/**
 * Mock Users for Development/Testing
 * 
 * ⚠️ PRODUCTION: Replace with API calls to backend
 */
const MOCK_USERS: User[] = [
    {
        id: 'user-001',
        username: 'cashier1',
        fullName: 'Sarah Ahmed',
        email: 'sarah@nerdpos.com',
        role: UserRole.CASHIER,
        pinCode: '1111',        // 🔴 NEVER store in plaintext in production
        isActive: true,
    },
    {
        id: 'user-002',
        username: 'manager1',
        fullName: 'Mohammed Ali',
        email: 'mohammed@nerdpos.com',
        role: UserRole.SHIFT_MANAGER,
        pinCode: '2222',
        isActive: true,
    },
    {
        id: 'user-003',
        username: 'owner',
        fullName: 'Owner (GM)',
        email: 'owner@nerdpos.com',
        role: UserRole.GM,
        pinCode: '9999',
        isActive: true,
    },
];

// ============================================
// AUTH STORE INTERFACE
// ============================================

/**
 * Auth Store State & Actions
 * 
 * Security Model:
 * - activeUser: The cashier currently operating the POS
 * - temporaryAuthorizer: Manager who entered PIN for a specific action
 */
interface AuthStore {
    // State
    activeUser: User | null;                // Current cashier logged in
    temporaryAuthorizer: User | null;       // Manager override for single action
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Core Auth Actions
    login: (username: string, password: string) => Promise<void>;
    loginWithPin: (pinCode: string) => Promise<void>;
    logout: () => void;
    refreshAccessToken: () => Promise<void>;
    setUser: (user: User) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;

    // ✅ NEW: Manager PIN Validation (SOP Compliance)
    validatePin: (pin: string, requiredPermission: Permission) => Promise<AuthorizationResult>;
    requestAuthorization: (request: AuthorizationRequest) => Promise<AuthorizationResult>;
    clearAuthorizer: () => void;

    // Permission Checks
    hasPermission: (permission: Permission) => boolean;
    hasRole: (roleName: string) => boolean;
    canAuthorize: (permission: Permission) => boolean; // Check if temporaryAuthorizer has permission
}

// ============================================
// AUTH STORE IMPLEMENTATION
// ============================================

/**
 * Auth Store
 * Handles user authentication, authorization, and manager PIN validation
 * 
 * Security Features:
 * - Dual-user system (active + authorizer)
 * - Permission-based access control
 * - Manager PIN validation
 * - Audit trail hooks
 */
export const useAuthStore = create<AuthStore>()(
    devtools(
        persist(
            (set, get) => ({
                // ============================================
                // INITIAL STATE
                // ============================================

                activeUser: null,
                temporaryAuthorizer: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,

                // ============================================
                // CORE AUTH ACTIONS
                // ============================================

                // Login with username/password
                login: async (username, password) => {
                    set({ isLoading: true });

                    try {
                        // 🔴 PRODUCTION: Replace with actual API call
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Mock user lookup
                        const mockUser = MOCK_USERS.find(u => u.username === username);

                        if (!mockUser) {
                            throw new Error('User not found');
                        }

                        const mockAccessToken = 'mock-access-token-' + Date.now();
                        const mockRefreshToken = 'mock-refresh-token-' + Date.now();

                        set({
                            activeUser: { ...mockUser, lastLogin: new Date().toISOString() },
                            accessToken: mockAccessToken,
                            refreshToken: mockRefreshToken,
                            isAuthenticated: true,
                            isLoading: false,
                        });

                        localStorage.setItem('access_token', mockAccessToken);
                        localStorage.setItem('refresh_token', mockRefreshToken);
                    } catch (error) {
                        set({ isLoading: false });
                        throw error;
                    }
                },

                // Login with PIN code (quick user switch)
                loginWithPin: async (pinCode) => {
                    set({ isLoading: true });

                    try {
                        await new Promise(resolve => setTimeout(resolve, 300));

                        // Mock user lookup by PIN
                        const mockUser = MOCK_USERS.find(u => u.pinCode === pinCode);

                        if (!mockUser) {
                            throw new Error('Invalid PIN');
                        }

                        if (!mockUser.isActive) {
                            throw new Error('User is not active');
                        }

                        set({
                            activeUser: { ...mockUser, lastLogin: new Date().toISOString() },
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
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');

                    set({
                        activeUser: null,
                        temporaryAuthorizer: null,
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
                        const newAccessToken = 'mock-access-token-refreshed-' + Date.now();
                        set({ accessToken: newAccessToken });
                        localStorage.setItem('access_token', newAccessToken);
                    } catch (error) {
                        get().logout();
                        throw error;
                    }
                },

                // Set user manually
                setUser: (user) => {
                    set({ activeUser: user, isAuthenticated: true });
                },

                // Set tokens manually
                setTokens: (accessToken, refreshToken) => {
                    set({ accessToken, refreshToken });
                    localStorage.setItem('access_token', accessToken);
                    localStorage.setItem('refresh_token', refreshToken);
                },

                // ============================================
                // ✅ NEW: MANAGER PIN VALIDATION (SOP)
                // ============================================

                /**
                 * Validate PIN and check permission
                 * 
                 * SOP Compliance:
                 * - Finds user by PIN
                 * - Checks if user has required permission
                 * - Sets temporaryAuthorizer if valid
                 * - Returns authorization result
                 * 
                 * @param pin - 4-digit PIN code
                 * @param requiredPermission - Permission required for action
                 * @returns Authorization result with success flag
                 */
                validatePin: async (pin, requiredPermission) => {
                    try {
                        // Simulate API delay
                        await new Promise(resolve => setTimeout(resolve, 300));

                        // Find user by PIN
                        const user = MOCK_USERS.find(u => u.pinCode === pin);

                        if (!user) {
                            return {
                                success: false,
                                error: 'Invalid PIN code',
                            };
                        }

                        if (!user.isActive) {
                            return {
                                success: false,
                                error: 'User account is inactive',
                            };
                        }

                        // Check if user has required permission
                        const userPermissions = ROLE_PERMISSIONS[user.role];
                        const hasRequiredPermission = userPermissions.includes(requiredPermission);

                        if (!hasRequiredPermission) {
                            return {
                                success: false,
                                error: `Insufficient permissions. ${user.role} role cannot authorize this action.`,
                            };
                        }

                        // Authorization successful - set temporary authorizer
                        set({ temporaryAuthorizer: user });

                        return {
                            success: true,
                            authorizer: user,
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: 'Failed to validate PIN',
                        };
                    }
                },

                /**
                 * Request authorization for an action
                 * 
                 * This is a wrapper around validatePin with context
                 * 
                 * @param request - Authorization request with action and permission
                 * @returns Authorization result
                 */
                requestAuthorization: async (request) => {
                    // This method is async to allow for future modal integration
                    // For now, it just validates permissions
                    const { activeUser } = get();

                    if (!activeUser) {
                        return {
                            success: false,
                            error: 'No user logged in',
                        };
                    }

                    // Check if active user already has permission
                    if (hasPermission(activeUser, request.permission)) {
                        return {
                            success: true,
                            authorizer: activeUser,
                        };
                    }

                    // Otherwise, require manager PIN (will be handled by modal)
                    return {
                        success: false,
                        error: 'Manager authorization required',
                    };
                },

                /**
                 * Clear temporary authorizer
                 * 
                 * SOP: Authorizer is only valid for a single action
                 * Must be cleared after authorization is used
                 */
                clearAuthorizer: () => {
                    set({ temporaryAuthorizer: null });
                },

                // ============================================
                // PERMISSION CHECKS
                // ============================================

                /**
                 * Check if active user has a specific permission
                 */
                hasPermission: (permission) => {
                    const { activeUser } = get();
                    return hasPermission(activeUser, permission);
                },

                /**
                 * Check if active user has a specific role
                 * @deprecated Use hasPermission instead for better security
                 */
                hasRole: (roleName) => {
                    const { activeUser } = get();
                    if (!activeUser) return false;
                    return activeUser.role === roleName;
                },

                /**
                 * Check if temporary authorizer can authorize a permission
                 */
                canAuthorize: (permission) => {
                    const { temporaryAuthorizer } = get();
                    return hasPermission(temporaryAuthorizer, permission);
                },
            }),
            {
                name: 'auth-storage',
                // Only persist tokens, not user objects (for security)
                partialize: (state) => ({
                    accessToken: state.accessToken,
                    refreshToken: state.refreshToken,
                }),
            }
        ),
        { name: 'auth-store' }
    )
);

// ============================================
// CONVENIENCE EXPORTS
// ============================================

/**
 * Get current user (for external use)
 */
export const getCurrentUser = () => useAuthStore.getState().activeUser;

/**
 * Get current authorizer (for external use)
 */
export const getCurrentAuthorizer = () => useAuthStore.getState().temporaryAuthorizer;

/**
 * Export mock users for testing
 */
export { MOCK_USERS };
