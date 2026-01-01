/**
 * Auth Redux Slice
 * Manages authentication, users, permissions, and authorization
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { PinAuthorizationRequest, PinAuthorizationResult, VoidReason } from '@/types/pos.types';
import type { Role, Permission as ConfigPermission } from '@/types/config.types';

// =============================================================================
// TYPES
// =============================================================================

export interface User {
    id: string;
    username: string;
    fullName: string;
    fullNameAr?: string | null;
    email?: string;
    role: UserRole;
    pin?: string;
    isActive: boolean;
    permissions: Permission[];
}

export type UserRole = 'CASHIER' | 'SHIFT_SUPERVISOR' | 'MANAGER' | 'ADMIN';

export type Permission =
    | 'POS_ACCESS'
    | 'APPLY_DISCOUNT'
    | 'VOID_ITEM'
    | 'VOID_ORDER'
    | 'PRICE_OVERRIDE'
    | 'OPEN_DRAWER'
    | 'VIEW_REPORTS'
    | 'MANAGE_INVENTORY'
    | 'MANAGE_STAFF'
    | 'MANAGE_SETTINGS';

export interface Manager {
    id: string;
    name: string;
    pin: string;
}

export interface AuthorizationLog {
    id: string;
    action: PinAuthorizationRequest['action'];
    authorizedBy: string;
    authorizedByName: string;
    requestedBy: string;
    timestamp: string;
    itemId?: string;
    itemName?: string;
    reason?: VoidReason | string;
    success: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    CASHIER: ['POS_ACCESS'],
    SHIFT_SUPERVISOR: ['POS_ACCESS', 'APPLY_DISCOUNT', 'VOID_ITEM', 'OPEN_DRAWER'],
    MANAGER: [
        'POS_ACCESS',
        'APPLY_DISCOUNT',
        'VOID_ITEM',
        'VOID_ORDER',
        'PRICE_OVERRIDE',
        'OPEN_DRAWER',
        'VIEW_REPORTS',
        'MANAGE_INVENTORY',
    ],
    ADMIN: [
        'POS_ACCESS',
        'APPLY_DISCOUNT',
        'VOID_ITEM',
        'VOID_ORDER',
        'PRICE_OVERRIDE',
        'OPEN_DRAWER',
        'VIEW_REPORTS',
        'MANAGE_INVENTORY',
        'MANAGE_STAFF',
        'MANAGE_SETTINGS',
    ],
};

const ACTIONS_REQUIRING_AUTH: PinAuthorizationRequest['action'][] = [
    'VOID_ITEM',
    'APPLY_DISCOUNT',
    'PRICE_OVERRIDE',
    'REFUND',
    'OPEN_DRAWER',
    'DELETE_ORDER',
];

const DEFAULT_MANAGERS: Manager[] = [
    { id: 'mgr-1', name: 'Mohammed (Manager)', pin: '1234' },
    { id: 'mgr-2', name: 'Sarah (Supervisor)', pin: '5678' },
    { id: 'admin', name: 'Admin', pin: '0000' },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapUserRoleToConfigPermissions(role: UserRole): ConfigPermission[] {
    switch (role) {
        case 'ADMIN':
            return ['admin.all'];
        case 'MANAGER':
            return [
                'pos.*',
                'customers.*',
                'products.view',
                'products.edit',
                'inventory.*',
                'reports.*',
                'cash.*',
                'settings.view',
            ];
        case 'SHIFT_SUPERVISOR':
            return [
                'pos.view',
                'pos.create_order',
                'pos.modify_order',
                'pos.apply_discount',
                'pos.void_item',
                'pos.hold_order',
                'pos.recall_order',
                'pos.split_payment',
                'customers.view',
                'customers.create',
                'cash.open_session',
                'cash.close_session',
                'cash.drop',
            ];
        case 'CASHIER':
        default:
            return [
                'pos.view',
                'pos.create_order',
                'pos.modify_order',
                'pos.hold_order',
                'pos.recall_order',
                'customers.view',
                'customers.create',
                'cash.open_session',
                'cash.close_session',
            ];
    }
}

function getRoleNameAr(role: UserRole): string {
    switch (role) {
        case 'ADMIN':
            return 'المسؤول';
        case 'MANAGER':
            return 'مدير';
        case 'SHIFT_SUPERVISOR':
            return 'مشرف الوردية';
        case 'CASHIER':
        default:
            return 'كاشير';
    }
}

function getRoleLimits(role: UserRole): { maxDiscountPercent?: number } | undefined {
    switch (role) {
        case 'ADMIN':
        case 'MANAGER':
            return { maxDiscountPercent: 100 };
        case 'SHIFT_SUPERVISOR':
            return { maxDiscountPercent: 25 };
        case 'CASHIER':
        default:
            return { maxDiscountPercent: 10 };
    }
}

// =============================================================================
// STATE INTERFACE
// =============================================================================

export interface AuthState {
    currentUser: User | null;
    permissions: ConfigPermission[];
    role: Role | null;
    isLoggedIn: boolean;
    loginTime: string | null;
    managers: Manager[];
    authorizationLogs: AuthorizationLog[];
    pendingAuth: PinAuthorizationRequest | null;
    isVerifyingPin: boolean;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: AuthState = {
    currentUser: null,
    permissions: [],
    role: null,
    isLoggedIn: false,
    loginTime: null,
    managers: DEFAULT_MANAGERS,
    authorizationLogs: [],
    pendingAuth: null,
    isVerifyingPin: false,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Extended result type for internal use
 */
interface VerifyPinResult extends PinAuthorizationResult {
    log: AuthorizationLog;
}

/**
 * Verify manager PIN
 */
export const verifyPin = createAsyncThunk<
    VerifyPinResult,
    { pin: string; action: PinAuthorizationRequest['action']; reason?: VoidReason | string },
    { state: RootState }
>('auth/verifyPin', async ({ pin, action, reason }, { getState }) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const state = getState();
    const { managers, currentUser, pendingAuth } = state.auth;

    // Find manager with matching PIN
    const authorizedManager = managers.find((m) => m.pin === pin);
    const success = authorizedManager !== undefined;

    const timestamp = new Date().toISOString();

    // Create authorization log
    const log: AuthorizationLog = {
        id: crypto.randomUUID(),
        action,
        authorizedBy: authorizedManager?.id ?? 'unknown',
        authorizedByName: authorizedManager?.name ?? 'Unknown',
        requestedBy: currentUser?.id ?? 'unknown',
        timestamp,
        reason,
        success,
        itemId: pendingAuth?.itemId,
        itemName: pendingAuth?.itemName,
    };

    return {
        authorized: success,
        managerId: authorizedManager?.id,
        managerName: authorizedManager?.name,
        timestamp,
        log,
    };
});

// =============================================================================
// SLICE
// =============================================================================

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /**
         * Login user
         */
        login: (state, action: PayloadAction<User>) => {
            const user = action.payload;
            const roleId = user.role.toLowerCase();
            const configPermissions = mapUserRoleToConfigPermissions(user.role);

            state.currentUser = user;
            state.isLoggedIn = true;
            state.loginTime = new Date().toISOString();
            state.permissions = configPermissions;
            state.role = {
                id: roleId,
                name: user.role,
                nameAr: getRoleNameAr(user.role),
                permissions: configPermissions,
                isSystem: true,
                limits: getRoleLimits(user.role),
            };
        },

        /**
         * Logout user
         */
        logout: (state) => {
            state.currentUser = null;
            state.isLoggedIn = false;
            state.loginTime = null;
            state.pendingAuth = null;
            state.permissions = [];
            state.role = null;
        },

        /**
         * Request authorization (set pending auth)
         */
        requestAuthorization: (state, action: PayloadAction<PinAuthorizationRequest>) => {
            state.pendingAuth = action.payload;
        },

        /**
         * Clear pending authorization
         */
        clearPendingAuth: (state) => {
            state.pendingAuth = null;
        },

        /**
         * Add manager
         */
        addManager: (state, action: PayloadAction<Manager>) => {
            state.managers.push(action.payload);
        },

        /**
         * Remove manager
         */
        removeManager: (state, action: PayloadAction<string>) => {
            state.managers = state.managers.filter((m) => m.id !== action.payload);
        },

        /**
         * Add authorization log
         */
        addAuthorizationLog: (state, action: PayloadAction<AuthorizationLog>) => {
            state.authorizationLogs = [action.payload, ...state.authorizationLogs].slice(0, 100);
        },

        /**
         * Clear authorization logs
         */
        clearAuthorizationLogs: (state) => {
            state.authorizationLogs = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(verifyPin.pending, (state) => {
                state.isVerifyingPin = true;
            })
            .addCase(verifyPin.fulfilled, (state, action) => {
                state.isVerifyingPin = false;
                // Add to authorization log
                if (action.payload.log) {
                    state.authorizationLogs = [
                        action.payload.log,
                        ...state.authorizationLogs,
                    ].slice(0, 100);
                }
                // Clear pending auth if successful
                if (action.payload.authorized) {
                    state.pendingAuth = null;
                }
            })
            .addCase(verifyPin.rejected, (state) => {
                state.isVerifyingPin = false;
            });
    },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
    login,
    logout,
    requestAuthorization,
    clearPendingAuth,
    addManager,
    removeManager,
    addAuthorizationLog,
    clearAuthorizationLogs,
} = authSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectCurrentUser = (state: RootState) => state.auth.currentUser;
export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn;
export const selectLoginTime = (state: RootState) => state.auth.loginTime;
export const selectPermissions = (state: RootState) => state.auth.permissions;
export const selectRole = (state: RootState) => state.auth.role;
export const selectPendingAuth = (state: RootState) => state.auth.pendingAuth;
export const selectIsVerifyingPin = (state: RootState) => state.auth.isVerifyingPin;
export const selectManagers = (state: RootState) => state.auth.managers;
export const selectAuthorizationLogs = (state: RootState) => state.auth.authorizationLogs;

/**
 * Check if user has a specific permission
 */
export const selectHasPermission = (permission: Permission) => (state: RootState) => {
    const user = state.auth.currentUser;
    if (!user) return false;

    // Check explicit permissions
    if (user.permissions.includes(permission)) return true;

    // Check role-based permissions
    const rolePerms = ROLE_PERMISSIONS[user.role];
    return rolePerms.includes(permission);
};

/**
 * Check if action requires manager authorization
 */
export const selectRequiresManagerAuth =
    (action: PinAuthorizationRequest['action']) => (state: RootState) => {
        const user = state.auth.currentUser;
        if (!user) return true;

        // Admins and Managers don't need additional auth
        if (user.role === 'ADMIN' || user.role === 'MANAGER') {
            return false;
        }

        // Check if action requires auth
        return ACTIONS_REQUIRING_AUTH.includes(action);
    };

/**
 * Get authorization logs with optional limit
 */
export const selectAuthorizationLogsLimited = (limit: number) => (state: RootState) =>
    state.auth.authorizationLogs.slice(0, limit);

// =============================================================================
// REDUCER
// =============================================================================

export default authSlice.reducer;
