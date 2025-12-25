import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PinAuthorizationRequest, PinAuthorizationResult, VoidReason } from '@/types/pos.types';
import type { Role, Permission as ConfigPermission } from '@/types/config.types';

// =============================================================================
// USER TYPES
// =============================================================================

export interface User {
    id: string;
    username: string;
    fullName: string;
    fullNameAr?: string | null;
    email?: string;
    role: UserRole;
    pin?: string;                    // Hashed PIN for managers
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

// Role-based default permissions
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

// =============================================================================
// AUTHORIZATION LOG
// =============================================================================

export interface AuthorizationLog {
    id: string;
    action: PinAuthorizationRequest['action'];
    authorizedBy: string;           // Manager user ID
    authorizedByName: string;
    requestedBy: string;            // Cashier user ID
    timestamp: string;
    itemId?: string;
    itemName?: string;
    reason?: VoidReason | string;
    success: boolean;
}

// =============================================================================
// STORE STATE
// =============================================================================

interface AuthState {
    // Current user (logged-in cashier)
    currentUser: User | null;

    // Derived permissions (for RBAC hooks compatibility)
    permissions: ConfigPermission[];
    role: Role | null;

    // Session info
    isLoggedIn: boolean;
    loginTime: string | null;

    // PIN verification (mock manager database)
    managers: Map<string, { id: string; name: string; pin: string }>;

    // Authorization log
    authorizationLogs: AuthorizationLog[];

    // Pending authorization request
    pendingAuth: PinAuthorizationRequest | null;

    // =========================================================================
    // LOGIN/LOGOUT ACTIONS
    // =========================================================================

    login: (user: User) => void;
    logout: () => void;

    // =========================================================================
    // PERMISSION CHECKS
    // =========================================================================

    hasPermission: (permission: Permission) => boolean;
    requiresManagerAuth: (action: PinAuthorizationRequest['action']) => boolean;

    // =========================================================================
    // PIN VERIFICATION
    // =========================================================================

    verifyPin: (pin: string, action: PinAuthorizationRequest['action'], reason?: VoidReason | string) => Promise<PinAuthorizationResult>;

    /**
     * Request manager authentication for a specific permission
     * Opens PIN modal and returns true if authorized
     */
    requestManagerAuth: (requiredPermission: ConfigPermission) => Promise<boolean>;

    // =========================================================================
    // AUTHORIZATION REQUEST MANAGEMENT
    // =========================================================================

    requestAuthorization: (request: PinAuthorizationRequest) => void;
    clearPendingAuth: () => void;

    // =========================================================================
    // AUTHORIZATION LOG
    // =========================================================================

    getAuthorizationLogs: (limit?: number) => AuthorizationLog[];

    // =========================================================================
    // MANAGER MANAGEMENT (for demo/testing)
    // =========================================================================

    addManager: (id: string, name: string, pin: string) => void;
    removeManager: (id: string) => void;
}

// =============================================================================
// DEFAULT DEMO MANAGERS
// =============================================================================

const DEFAULT_MANAGERS: Map<string, { id: string; name: string; pin: string }> = new Map([
    ['mgr-1', { id: 'mgr-1', name: 'Mohammed (Manager)', pin: '1234' }],
    ['mgr-2', { id: 'mgr-2', name: 'Sarah (Supervisor)', pin: '5678' }],
    ['admin', { id: 'admin', name: 'Admin', pin: '0000' }],
]);

// Actions that require manager PIN
const ACTIONS_REQUIRING_AUTH: PinAuthorizationRequest['action'][] = [
    'VOID_ITEM',
    'APPLY_DISCOUNT',
    'PRICE_OVERRIDE',
    'REFUND',
    'OPEN_DRAWER',
    'DELETE_ORDER',
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
// STORE IMPLEMENTATION
// =============================================================================

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set, get) => ({
                currentUser: null,
                permissions: [],
                role: null,
                isLoggedIn: false,
                loginTime: null,
                managers: DEFAULT_MANAGERS,
                authorizationLogs: [],
                pendingAuth: null,

                // =====================================================================
                // LOGIN/LOGOUT
                // =====================================================================

                login: (user) => {
                    // Map user role to RBAC role with permissions
                    const roleId = user.role.toLowerCase();
                    const configPermissions = mapUserRoleToConfigPermissions(user.role);

                    set({
                        currentUser: user,
                        isLoggedIn: true,
                        loginTime: new Date().toISOString(),
                        permissions: configPermissions,
                        role: {
                            id: roleId,
                            name: user.role,
                            nameAr: getRoleNameAr(user.role),
                            permissions: configPermissions,
                            isSystem: true,
                            limits: getRoleLimits(user.role),
                        },
                    });
                },

                logout: () => {
                    set({
                        currentUser: null,
                        isLoggedIn: false,
                        loginTime: null,
                        pendingAuth: null,
                        permissions: [],
                        role: null,
                    });
                },

                // =====================================================================
                // PERMISSION CHECKS
                // =====================================================================

                hasPermission: (permission) => {
                    const user = get().currentUser;
                    if (!user) return false;

                    // Check explicit permissions
                    if (user.permissions.includes(permission)) return true;

                    // Check role-based permissions
                    const rolePerms = ROLE_PERMISSIONS[user.role];
                    return rolePerms.includes(permission);
                },

                requiresManagerAuth: (action) => {
                    const user = get().currentUser;
                    if (!user) return true;

                    // Admins and Managers don't need additional auth
                    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
                        return false;
                    }

                    // Check if action requires auth
                    return ACTIONS_REQUIRING_AUTH.includes(action);
                },

                // =====================================================================
                // PIN VERIFICATION
                // =====================================================================

                verifyPin: async (pin, action, reason) => {
                    // Simulate network delay
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    const managers = get().managers;
                    const currentUser = get().currentUser;

                    // Find manager with matching PIN
                    let authorizedManager: { id: string; name: string } | null = null;

                    for (const [, manager] of managers) {
                        if (manager.pin === pin) {
                            authorizedManager = manager;
                            break;
                        }
                    }

                    const success = authorizedManager !== null;

                    // Log the authorization attempt
                    const log: AuthorizationLog = {
                        id: crypto.randomUUID(),
                        action,
                        authorizedBy: authorizedManager?.id ?? 'unknown',
                        authorizedByName: authorizedManager?.name ?? 'Unknown',
                        requestedBy: currentUser?.id ?? 'unknown',
                        timestamp: new Date().toISOString(),
                        reason,
                        success,
                    };

                    // Add pending auth details to log
                    const pending = get().pendingAuth;
                    if (pending) {
                        log.itemId = pending.itemId;
                        log.itemName = pending.itemName;
                    }

                    set((state) => ({
                        authorizationLogs: [log, ...state.authorizationLogs].slice(0, 100), // Keep last 100
                        pendingAuth: success ? null : state.pendingAuth,
                    }));

                    return {
                        authorized: success,
                        managerId: authorizedManager?.id,
                        managerName: authorizedManager?.name,
                        timestamp: log.timestamp,
                    };
                },

                // =====================================================================
                // AUTHORIZATION REQUEST MANAGEMENT
                // =====================================================================

                requestAuthorization: (request) => {
                    set({ pendingAuth: request });
                },

                clearPendingAuth: () => {
                    set({ pendingAuth: null });
                },

                /**
                 * Request manager authentication for a specific permission
                 * This will open the PIN modal and return when authorized or cancelled
                 */
                requestManagerAuth: async (_requiredPermission: ConfigPermission): Promise<boolean> => {
                    // For now, this is a simplified implementation
                    // In a full implementation, this would:
                    // 1. Open the ManagerPinModal via ui.store
                    // 2. Wait for PIN entry
                    // 3. Verify the PIN
                    // 4. Return the result

                    // For the MVP, we'll use a simpler approach where the component
                    // that needs auth opens the modal directly with a callback
                    return new Promise((resolve) => {
                        // This would be connected to the UI modal in a real implementation
                        // For now, check if user is manager or higher
                        const user = get().currentUser;
                        if (user && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
                            resolve(true);
                        } else {
                            // Would open PIN modal here
                            resolve(false);
                        }
                    });
                },


                // =====================================================================
                // AUTHORIZATION LOG
                // =====================================================================

                getAuthorizationLogs: (limit = 20) => {
                    return get().authorizationLogs.slice(0, limit);
                },

                // =====================================================================
                // MANAGER MANAGEMENT
                // =====================================================================

                addManager: (id, name, pin) => {
                    const managers = new Map(get().managers);
                    managers.set(id, { id, name, pin });
                    set({ managers });
                },

                removeManager: (id) => {
                    const managers = new Map(get().managers);
                    managers.delete(id);
                    set({ managers });
                },
            }),
            {
                name: 'nerdpos-auth',
                partialize: (state) => ({
                    // Only persist current user and login state
                    currentUser: state.currentUser,
                    isLoggedIn: state.isLoggedIn,
                    loginTime: state.loginTime,
                    // Don't persist logs or managers (managed per session)
                }),
            }
        ),
        { name: 'AuthStore' }
    )
);

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook to check if the current user can perform an action
 */
export function useCanPerformAction(action: PinAuthorizationRequest['action']): boolean {
    const { currentUser, hasPermission } = useAuthStore();

    if (!currentUser) return false;

    const permissionMap: Record<PinAuthorizationRequest['action'], Permission> = {
        VOID_ITEM: 'VOID_ITEM',
        APPLY_DISCOUNT: 'APPLY_DISCOUNT',
        PRICE_OVERRIDE: 'PRICE_OVERRIDE',
        REFUND: 'VOID_ORDER', // Refunds require void permission
        OPEN_DRAWER: 'OPEN_DRAWER',
        DELETE_ORDER: 'VOID_ORDER',
    };

    return hasPermission(permissionMap[action]);
}
