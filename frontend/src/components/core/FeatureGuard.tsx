import { useConfigStore } from '@/modules/config/store/configStore';

interface FeatureGuardProps {
    feature: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Feature Guard Component
 * Conditionally renders children based on feature flag
 *
 * @example
 * <FeatureGuard feature="kitchen">
 *   <KitchenLink />
 * </FeatureGuard>
 */
export function FeatureGuard({ feature, children, fallback = null }: FeatureGuardProps) {
    const getFeature = useConfigStore((state) => state.getFeature);
    const isEnabled = getFeature(feature);

    if (!isEnabled) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Hook version for conditional logic
 *
 * @example
 * const showKitchen = useFeature('kitchen');
 * if (showKitchen) {
 *   // do something
 * }
 */
export function useFeature(feature: string): boolean {
    return useConfigStore((state) => state.getFeature(feature));
}
