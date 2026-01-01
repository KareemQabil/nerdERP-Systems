/**
 * Feature Flag Hook
 * Access feature flags from config store with convenient API
 * Migrated to Redux from Zustand
 */
import { useAppSelector } from '@/app/hooks';
import {
    selectFeature,
    selectFeatures,
    selectIsLoaded,
    setFeature,
} from '@/features/pos/slices/configSlice';
import { useAppDispatch } from '@/app/hooks';

/**
 * Check if a feature is enabled
 * @param path Dot-notation path to feature (e.g., 'pos.holdOrders')
 * @returns boolean indicating if feature is enabled
 *
 * @example
 * const canHoldOrders = useFeature('pos.holdOrders');
 * const hasKitchen = useFeature('modules.kitchen');
 */
export function useFeature(path: string): boolean {
    return useAppSelector(selectFeature(path));
}

/**
 * Check if a feature is enabled with loading state
 * Useful when you need to show skeleton while config is loading
 *
 * @example
 * const { enabled, isLoading } = useFeatureWithState('pos.kitchenRouting');
 * if (isLoading) return <Skeleton />;
 * if (!enabled) return null;
 */
export function useFeatureWithState(path: string) {
    const isLoaded = useAppSelector(selectIsLoaded);
    const enabled = useAppSelector(selectFeature(path));

    return {
        enabled,
        isLoading: !isLoaded,
    };
}

/**
 * Check if ALL features are enabled (AND logic)
 * @param paths Array of feature paths
 * @returns true only if all features are enabled
 *
 * @example
 * const canShowTableSelector = useFeatures('pos.dineIn', 'modules.pos');
 */
export function useFeatures(...paths: string[]): boolean {
    const features = useAppSelector(selectFeatures);
    return paths.every((path) => {
        const value = getNestedValue(features, path);
        return value === true;
    });
}

/**
 * Check if ANY feature is enabled (OR logic)
 * @param paths Array of feature paths
 * @returns true if at least one feature is enabled
 *
 * @example
 * const hasAnyPaymentOptions = useAnyFeature('customers.loyaltyProgram', 'customers.giftCards');
 */
export function useAnyFeature(...paths: string[]): boolean {
    const features = useAppSelector(selectFeatures);
    return paths.some((path) => {
        const value = getNestedValue(features, path);
        return value === true;
    });
}

/**
 * Get all features as an object
 * Useful for debugging or displaying feature matrix
 */
export function useAllFeatures() {
    return useAppSelector(selectFeatures);
}

/**
 * Toggle a feature (for settings UI)
 */
export function useFeatureToggle(path: string) {
    const dispatch = useAppDispatch();
    const enabled = useFeature(path);

    return {
        enabled,
        toggle: () => dispatch(setFeature({ path, enabled: !enabled })),
        enable: () => dispatch(setFeature({ path, enabled: true })),
        disable: () => dispatch(setFeature({ path, enabled: false })),
    };
}

// =============================================================================
// HELPER
// =============================================================================

function getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
        if (current && typeof current === 'object' && key in current) {
            return (current as Record<string, unknown>)[key];
        }
        return undefined;
    }, obj);
}
