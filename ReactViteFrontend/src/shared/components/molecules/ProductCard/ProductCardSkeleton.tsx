import { cn } from '@/lib/utils';

export interface ProductCardSkeletonProps {
    className?: string;
}

/**
 * ProductCard Skeleton
 * Loading placeholder for ProductCard
 * 
 * @example
 * <ProductCardSkeleton />
 */
export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
    return (
        <div
            className={cn(
                'rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]',
                'overflow-hidden animate-pulse',
                className
            )}
        >
            {/* Image Skeleton */}
            <div className="aspect-square bg-[rgba(255,255,255,0.02)]" />

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
                {/* Title Lines */}
                <div className="space-y-2">
                    <div className="h-4 bg-[rgba(255,255,255,0.1)] rounded w-3/4" />
                    <div className="h-4 bg-[rgba(255,255,255,0.1)] rounded w-1/2" />
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                    <div className="h-6 bg-[rgba(255,255,255,0.1)] rounded w-20" />
                    <div className="h-4 bg-[rgba(255,255,255,0.1)] rounded w-12" />
                </div>
            </div>
        </div>
    );
}
