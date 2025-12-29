/**
 * Skeleton Components for Loading States
 */

interface SkeletonProps {
    count?: number;
}

export function ProductGridSkeleton({ count = 8 }: SkeletonProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-slate-200 dark:bg-slate-700 rounded-lg h-32 animate-pulse"
                />
            ))}
        </div>
    );
}

export function CategoryPillsSkeleton({ count = 6 }: SkeletonProps) {
    return (
        <div className="flex gap-2 overflow-x-auto">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-slate-200 dark:bg-slate-700 rounded-full h-8 w-20 animate-pulse"
                />
            ))}
        </div>
    );
}
