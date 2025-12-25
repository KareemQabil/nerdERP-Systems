/**
 * Authorized Component
 * Conditionally render children based on user permissions
 */
import type { ReactNode } from 'react';
import { usePermission, usePermissions, useAnyPermission } from '@/hooks/usePermission';
import type { Permission } from '@/types/config.types';

// =============================================================================
// AUTHORIZED COMPONENT
// =============================================================================

interface AuthorizedProps {
    /**
     * Permission(s) required to view the content
     * Can be a single permission or array of permissions
     */
    permission: Permission | Permission[];

    /**
     * When multiple permissions provided, how to combine them
     * 'all' = AND logic (user must have all permissions)
     * 'any' = OR logic (user must have at least one permission)
     * @default 'all'
     */
    mode?: 'all' | 'any';

    /**
     * Content to render when not authorized
     * Can be null, a component, or a message
     */
    fallback?: ReactNode;

    /**
     * Children to render when authorized
     */
    children: ReactNode;
}

/**
 * Conditionally render content based on user permissions
 *
 * @example
 * // Single permission
 * <Authorized permission="pos.void_item">
 *     <VoidButton />
 * </Authorized>
 *
 * @example
 * // Multiple permissions (all required)
 * <Authorized permission={['inventory.view', 'inventory.adjust']}>
 *     <StockAdjustmentForm />
 * </Authorized>
 *
 * @example
 * // Multiple permissions (any required)
 * <Authorized permission={['pos.apply_discount', 'pos.price_override']} mode="any">
 *     <PriceModificationPanel />
 * </Authorized>
 *
 * @example
 * // With fallback
 * <Authorized permission="reports.view_sales" fallback={<AccessDeniedMessage />}>
 *     <SalesReport />
 * </Authorized>
 */
export function Authorized({
    permission,
    mode = 'all',
    fallback = null,
    children,
}: AuthorizedProps): ReactNode {
    const permissions = Array.isArray(permission) ? permission : [permission];

    // Use single permission hook for single permission
    // (avoids creating unnecessary arrays in common case)
    if (permissions.length === 1) {
        const allowed = usePermission(permissions[0]);
        return allowed ? children : fallback;
    }

    // Use appropriate hook based on mode for multiple permissions
    const checkFn = mode === 'all' ? usePermissions : useAnyPermission;
    const allowed = checkFn(...permissions);

    return allowed ? children : fallback;
}

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

/**
 * Only render when user does NOT have permission
 * Useful for showing "request access" or upgrade prompts
 *
 * @example
 * <NotAuthorized permission="reports.export">
 *     <RequestExportAccessButton />
 * </NotAuthorized>
 */
export function NotAuthorized({
    permission,
    children,
}: {
    permission: Permission;
    children: ReactNode;
}): ReactNode {
    const allowed = usePermission(permission);
    return allowed ? null : children;
}

/**
 * Render different content based on permission status
 * More explicit than using fallback prop
 *
 * @example
 * <PermissionSwitch
 *     permission="pos.apply_discount_above_limit"
 *     allowed={<UnlimitedDiscountSlider />}
 *     denied={<LimitedDiscountSlider />}
 * />
 */
export function PermissionSwitch({
    permission,
    allowed: allowedContent,
    denied: deniedContent,
}: {
    permission: Permission;
    allowed: ReactNode;
    denied: ReactNode;
}): ReactNode {
    const allowed = usePermission(permission);
    return allowed ? allowedContent : deniedContent;
}

/**
 * Manager-only content
 * Shortcut for common manager-level authorization
 *
 * @example
 * <ManagerOnly>
 *     <ShiftReportButton />
 * </ManagerOnly>
 */
export function ManagerOnly({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}): ReactNode {
    // Check for manager-level permissions
    const isManager = useAnyPermission('admin.all', 'pos.*', 'cash.*');
    return isManager ? children : fallback;
}

/**
 * Admin-only content
 * Shortcut for admin-level authorization
 *
 * @example
 * <AdminOnly>
 *     <SystemSettingsLink />
 * </AdminOnly>
 */
export function AdminOnly({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}): ReactNode {
    const isAdmin = usePermission('admin.all');
    return isAdmin ? children : fallback;
}

export default Authorized;
