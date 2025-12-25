/**
 * Feature Component
 * Conditionally render children based on feature flag status
 */
import type { ReactNode } from 'react';
import { useFeature, useFeatures, useAnyFeature } from '@/hooks/useFeature';

// =============================================================================
// FEATURE COMPONENT
// =============================================================================

interface FeatureProps {
    /**
     * Feature flag path (e.g., 'pos.holdOrders', 'modules.kitchen')
     * Can be a single path or array of paths
     */
    flag: string | string[];

    /**
     * When multiple flags provided, how to combine them
     * 'all' = AND logic (all must be enabled)
     * 'any' = OR logic (at least one must be enabled)
     * @default 'all'
     */
    mode?: 'all' | 'any';

    /**
     * Content to render when feature is disabled
     * Can be null, a component, or a message
     */
    fallback?: ReactNode;

    /**
     * Children to render when feature is enabled
     */
    children: ReactNode;
}

/**
 * Conditionally render content based on feature flags
 *
 * @example
 * // Single feature
 * <Feature flag="pos.holdOrders">
 *     <HoldOrderButton />
 * </Feature>
 *
 * @example
 * // Multiple features (all must be enabled)
 * <Feature flag={['pos.dineIn', 'modules.pos']}>
 *     <TableSelector />
 * </Feature>
 *
 * @example
 * // Multiple features (any must be enabled)
 * <Feature flag={['customers.loyaltyProgram', 'customers.giftCards']} mode="any">
 *     <RewardsSection />
 * </Feature>
 *
 * @example
 * // With fallback
 * <Feature flag="customers.loyaltyProgram" fallback={<BasicCustomerView />}>
 *     <LoyaltyCustomerView />
 * </Feature>
 */
export function Feature({
    flag,
    mode = 'all',
    fallback = null,
    children,
}: FeatureProps): ReactNode {
    const flags = Array.isArray(flag) ? flag : [flag];

    // Use appropriate hook based on mode
    const checkFn = mode === 'all' ? useFeatures : useAnyFeature;
    const enabled = checkFn(...flags);

    return enabled ? children : fallback;
}

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

/**
 * Only render when feature is DISABLED
 * Useful for showing upgrade prompts or alternative UIs
 *
 * @example
 * <FeatureDisabled flag="customers.loyaltyProgram">
 *     <UpgradeToPremiumBanner />
 * </FeatureDisabled>
 */
export function FeatureDisabled({
    flag,
    children,
}: {
    flag: string;
    children: ReactNode;
}): ReactNode {
    const enabled = useFeature(flag);
    return enabled ? null : children;
}

/**
 * Render different content based on feature status
 * More explicit than using fallback prop
 *
 * @example
 * <FeatureSwitch
 *     flag="pos.kitchenRouting"
 *     enabled={<KitchenRoutePanel />}
 *     disabled={<SimpleCheckout />}
 * />
 */
export function FeatureSwitch({
    flag,
    enabled: enabledContent,
    disabled: disabledContent,
}: {
    flag: string;
    enabled: ReactNode;
    disabled: ReactNode;
}): ReactNode {
    const enabled = useFeature(flag);
    return enabled ? enabledContent : disabledContent;
}

export default Feature;
