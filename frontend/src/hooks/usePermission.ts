/**
 * Permission Hook
 * Access user permissions from auth store with convenient API
 */
import { useAuthStore } from '@/stores/auth.store';
import type { Permission } from '@/types/config.types';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if user has a specific permission
 * Handles wildcard permissions like 'pos.*' and 'admin.all'
 */
function hasPermission(userPermissions: Permission[], required: Permission): boolean {
    // Admin bypass
    if (userPermissions.includes('admin.all')) {
        return true;
    }

    // Direct match
    if (userPermissions.includes(required)) {
        return true;
    }

    // Check wildcard permissions (e.g., 'pos.*' matches 'pos.view')
    const [domain] = required.split('.');
    const wildcardPermission = `${domain}.*` as Permission;
    if (userPermissions.includes(wildcardPermission)) {
        return true;
    }

    return false;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Check if current user has a specific permission
 * @param permission The permission to check
 * @returns boolean indicating if user has permission
 *
 * @example
 * const canVoid = usePermission('pos.void_item');
 * const canManageUsers = usePermission('settings.manage_users');
 */
export function usePermission(permission: Permission): boolean {
    const permissions = useAuthStore((s) => s.permissions);
    return hasPermission(permissions, permission);
}

/**
 * Check if user has ALL of the specified permissions (AND logic)
 * @param permissions Array of permissions
 * @returns true only if user has all permissions
 *
 * @example
 * const canManageInventory = usePermissions('inventory.view', 'inventory.adjust');
 */
export function usePermissions(...permissions: Permission[]): boolean {
    const userPerms = useAuthStore((s) => s.permissions);
    return permissions.every((p) => hasPermission(userPerms, p));
}

/**
 * Check if user has ANY of the specified permissions (OR logic)
 * @param permissions Array of permissions
 * @returns true if user has at least one permission
 *
 * @example
 * const canEditOrCreate = useAnyPermission('products.edit', 'products.create');
 */
export function useAnyPermission(...permissions: Permission[]): boolean {
    const userPerms = useAuthStore((s) => s.permissions);
    return permissions.some((p) => hasPermission(userPerms, p));
}

/**
 * Get permission with associated limit
 * Useful for permissions that have numeric limits (e.g., max discount %)
 *
 * @example
 * const { allowed, limit } = usePermissionWithLimit('pos.apply_discount', 'maxDiscountPercent');
 * if (allowed && discountPercent <= (limit ?? 0)) { applyDiscount(); }
 */
export function usePermissionWithLimit(
    permission: Permission,
    limitKey: 'maxDiscountPercent' | 'maxRefundAmount' | 'maxVoidAmount' | 'maxCashDrop'
) {
    const { permissions, role } = useAuthStore((s) => ({
        permissions: s.permissions,
        role: s.role,
    }));

    return {
        allowed: hasPermission(permissions, permission),
        limit: role?.limits?.[limitKey] ?? null,
    };
}

/**
 * Check if user is a manager or higher
 * Shortcut for common authorization checks
 */
export function useIsManager(): boolean {
    const role = useAuthStore((s) => s.role);
    return role?.id === 'owner' || role?.id === 'manager';
}

/**
 * Check if user is admin/owner
 */
export function useIsAdmin(): boolean {
    const permissions = useAuthStore((s) => s.permissions);
    return permissions.includes('admin.all');
}

/**
 * Get all user permissions
 */
export function useAllPermissions(): Permission[] {
    return useAuthStore((s) => s.permissions);
}

/**
 * Check permission and request manager override if needed
 * Returns a function that will either allow the action or trigger PIN modal
 */
export function useAuthorizedAction(
    permission: Permission,
    onNotAuthorized?: () => void
) {
    const allowed = usePermission(permission);
    const requestManagerAuth = useAuthStore((s) => s.requestManagerAuth);

    return {
        allowed,
        execute: async (action: () => void | Promise<void>) => {
            if (allowed) {
                await action();
                return true;
            }

            // Request manager override
            const authorized = await requestManagerAuth(permission);
            if (authorized) {
                await action();
                return true;
            }

            // Not authorized
            onNotAuthorized?.();
            return false;
        },
    };
}

// =============================================================================
// STANDALONE HELPER (for use outside React components)
// =============================================================================

/**
 * Check permission outside of React component
 * Use sparingly - prefer hooks in components
 */
export function checkPermission(permission: Permission): boolean {
    const state = useAuthStore.getState();
    return hasPermission(state.permissions, permission);
}

/**
 * Check if action requires manager authorization
 * Based on config store settings
 */
export function requiresManagerAuth(action: 'DISCOUNT' | 'VOID' | 'REFUND' | 'CASH_DROP'): boolean {
    // Import here to avoid circular dependency
    const { useConfigStore } = require('@/stores/config.store');
    const requirePinFor = useConfigStore.getState().posConfig.requirePinFor;
    return requirePinFor.includes(action);
}
