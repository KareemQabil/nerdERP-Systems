/**
 * ============================================
 * RESTAURANT POS - AUTH & IAM TYPES
 * ============================================
 * Phase 1: Core Security Foundation
 * Zero Tolerance Security Layer
 */

// ============================================
// USER ROLES (Hierarchy)
// ============================================

/**
 * User Role Enum
 * Defines the authentication hierarchy
 * 
 * Hierarchy (Ascending Authority):
 * CASHIER < SHIFT_MANAGER < GM < ADMIN
 */
export enum UserRole {
    CASHIER = 'CASHIER',                // Standard POS operator
    SHIFT_MANAGER = 'SHIFT_MANAGER',    // Can approve voids/refunds
    GM = 'GM',                          // General Manager - Full access
    ADMIN = 'ADMIN',                    // System administrator
}

// ============================================
// PERMISSIONS (Granular)
// ============================================

/**
 * Permission Enum
 * Granular permission system per SOP requirements
 * 
 * Security Levels:
 * 🟢 Low: POS_ACCESS
 * 🟡 Medium: VOID_ORDER, APPLY_DISCOUNT
 * 🔴 High: VOID_SENT_ITEM, REFUND_PAYMENT
 * ⚫ Critical: CLOSE_SHIFT, VIEW_REPORTS
 */
export enum Permission {
    // Basic Access
    POS_ACCESS = 'POS_ACCESS',

    // Financial Operations
    VOID_ORDER = 'VOID_ORDER',              // 🟡 Pre-kitchen void (no inventory impact)
    VOID_SENT_ITEM = 'VOID_SENT_ITEM',      // 🔴 Post-kitchen void (HIGH SECURITY - SOP Red Line)
    REFUND_PAYMENT = 'REFUND_PAYMENT',      // 🔴 Issue refund to customer
    APPLY_DISCOUNT = 'APPLY_DISCOUNT',       // 🟡 Apply discounts >10%

    // Cash Management
    OPEN_DRAWER = 'OPEN_DRAWER',            // Open cash drawer (no-sale)
    CLOSE_SHIFT = 'CLOSE_SHIFT',            // ⚫ Close shift & blind count

    // Reporting
    VIEW_REPORTS = 'VIEW_REPORTS',          // ⚫ Access audit logs & reports
}

// ============================================
// ROLE-PERMISSION MAPPING
// ============================================

/**
 * Role-Permission Matrix
 * Defines which permissions each role has
 * 
 * Per SOP:
 * - CASHIER: POS access only
 * - SHIFT_MANAGER: Approves voids, refunds, discounts
 * - GM: Full system access
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.CASHIER]: [
        Permission.POS_ACCESS,
    ],

    [UserRole.SHIFT_MANAGER]: [
        Permission.POS_ACCESS,
        Permission.VOID_ORDER,
        Permission.VOID_SENT_ITEM,          // ⚠️ Red Line - Manager PIN Required
        Permission.REFUND_PAYMENT,
        Permission.APPLY_DISCOUNT,
        Permission.OPEN_DRAWER,
    ],

    [UserRole.GM]: Object.values(Permission),       // All permissions
    [UserRole.ADMIN]: Object.values(Permission),    // All permissions
};

// ============================================
// USER INTERFACE (Simplified)
// ============================================

/**
 * User Interface
 * Simplified for POS terminal authentication
 * 
 * Security:
 * - pinCode is 4-digit numeric
 * - Role determines permissions automatically
 */
export interface User {
    id: string;
    username: string;
    fullName: string;
    role: UserRole;                 // Enum-based role
    pinCode: string;                // 4-digit PIN (hashed in production)
    isActive: boolean;

    // Optional metadata
    email?: string;
    lastLogin?: string;             // ISO 8601
}

// ============================================
// AUTHORIZATION REQUEST
// ============================================

/**
 * Authorization Request
 * Used when requesting manager override
 */
export interface AuthorizationRequest {
    action: string;                 // Human-readable action (e.g., "Void Sent Item")
    permission: Permission;         // Required permission
    context?: {
        orderId?: string;
        itemName?: string;
        amount?: string;
    };
}

/**
 * Authorization Result
 * Result of PIN validation
 */
export interface AuthorizationResult {
    success: boolean;
    authorizer?: User;              // Manager who approved
    error?: string;                 // Error message if failed
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions.includes(permission);
}

/**
 * Check if a user's role is at least the required role
 * Example: isRoleAtLeast(user, UserRole.SHIFT_MANAGER)
 */
export function isRoleAtLeast(user: User | null, requiredRole: UserRole): boolean {
    if (!user) return false;

    const roleHierarchy = {
        [UserRole.CASHIER]: 0,
        [UserRole.SHIFT_MANAGER]: 1,
        [UserRole.GM]: 2,
        [UserRole.ADMIN]: 3,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Get display name for permission (for UI)
 */
export function getPermissionDisplayName(permission: Permission): string {
    const displayNames: Record<Permission, string> = {
        [Permission.POS_ACCESS]: 'POS Access',
        [Permission.VOID_ORDER]: 'Void Order',
        [Permission.VOID_SENT_ITEM]: 'Void Sent Item (Manager)',
        [Permission.REFUND_PAYMENT]: 'Issue Refund',
        [Permission.APPLY_DISCOUNT]: 'Apply Discount',
        [Permission.OPEN_DRAWER]: 'Open Cash Drawer',
        [Permission.CLOSE_SHIFT]: 'Close Shift',
        [Permission.VIEW_REPORTS]: 'View Reports',
    };

    return displayNames[permission] || permission;
}
