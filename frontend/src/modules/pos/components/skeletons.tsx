/**
 * Loading Skeletons for POS Components
 * Provides visual feedback during data loading
 */
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';

// =============================================================================
// BASE SKELETON
// =============================================================================

interface SkeletonProps {
    className?: string;
}

function Skeleton({ className }: SkeletonProps) {
    const theme = useSettingsStore((s) => s.theme);

    return (
        <div
            data-theme={theme}
            className={cn(
                'animate-pulse rounded-lg',
                'bg-slate-700/50',
                'data-[theme=light]:bg-slate-200',
                'data-[theme=luxury]:bg-slate-800/50',
                className
            )}
        />
    );
}

// =============================================================================
// PRODUCT GRID SKELETON
// =============================================================================

interface ProductGridSkeletonProps {
    /** Number of skeleton cards to show */
    count?: number;
}

export function ProductGridSkeleton({ count = 12 }: ProductGridSkeletonProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} index={i} />
            ))}
        </div>
    );
}

interface ProductCardSkeletonProps {
    index?: number;
}

function ProductCardSkeleton({ index = 0 }: ProductCardSkeletonProps) {
    const theme = useSettingsStore((s) => s.theme);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.02 }}
            data-theme={theme}
            className={cn(
                'rounded-2xl overflow-hidden border p-3',
                'bg-slate-800/50 border-slate-700/50',
                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                'data-[theme=luxury]:bg-slate-900/50 data-[theme=luxury]:border-amber-500/20',
            )}
        >
            {/* Image skeleton */}
            <Skeleton className="aspect-square w-full rounded-xl mb-3" />

            {/* Title skeleton */}
            <Skeleton className="h-4 w-3/4 mb-2" />

            {/* Price skeleton */}
            <Skeleton className="h-5 w-1/2" />
        </motion.div>
    );
}

// =============================================================================
// CATEGORY PILLS SKELETON
// =============================================================================

interface CategoryPillsSkeletonProps {
    count?: number;
}

export function CategoryPillsSkeleton({ count = 6 }: CategoryPillsSkeletonProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: count }).map((_, i) => (
                <CategoryPillSkeleton key={i} index={i} />
            ))}
        </div>
    );
}

function CategoryPillSkeleton({ index = 0 }: { index?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
        >
            <Skeleton className="h-10 w-24 rounded-full flex-shrink-0" />
        </motion.div>
    );
}

// =============================================================================
// CART SKELETON
// =============================================================================

export function CartSkeleton() {
    const theme = useSettingsStore((s) => s.theme);

    return (
        <div className="p-4 space-y-4">
            {/* Cart items */}
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                    <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                </div>
            ))}

            {/* Totals */}
            <div
                data-theme={theme}
                className={cn(
                    'pt-4 border-t space-y-2',
                    'border-slate-700/50',
                    'data-[theme=light]:border-slate-200',
                )}
            >
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-14" />
                </div>
                <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20" />
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// MODIFIER MODAL SKELETON
// =============================================================================

export function ModifierModalSkeleton() {
    return (
        <div className="p-4 space-y-6">
            {/* Modifier groups */}
            {Array.from({ length: 2 }).map((_, groupIndex) => (
                <div key={groupIndex} className="space-y-3">
                    {/* Group header */}
                    <Skeleton className="h-5 w-32" />

                    {/* Modifier options */}
                    <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 rounded-xl" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { Skeleton };
