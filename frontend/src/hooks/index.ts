/**
 * Hooks Index
 * Re-export all custom hooks for convenient importing
 */

// Feature flags
export {
    useFeature,
    useFeatureWithState,
    useFeatures,
    useAnyFeature,
    useAllFeatures,
    useFeatureToggle,
} from './useFeature';

// Permissions
export {
    usePermission,
    usePermissions,
    useAnyPermission,
    usePermissionWithLimit,
    useIsManager,
    useIsAdmin,
    useAllPermissions,
    useAuthorizedAction,
    checkPermission,
    requiresManagerAuth,
} from './usePermission';
