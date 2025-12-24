import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    /** Animation style */
    animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Skeleton loading placeholder component
 */
export function Skeleton({
    className,
    animation = 'pulse',
    ...props
}: SkeletonProps) {
    const animationStyles = {
        pulse: 'animate-pulse',
        shimmer: 'animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%]',
        none: '',
    };

    return (
        <div
            className={cn(
                'rounded-lg',
                // Dark theme
                'bg-slate-700/50',
                // Light theme
                'data-[theme=light]:bg-slate-200',
                // Luxury theme
                'data-[theme=luxury]:bg-slate-800',
                animationStyles[animation],
                className
            )}
            {...props}
        />
    );
}

// Common skeleton patterns

/** Text line skeleton */
export function SkeletonText({
    lines = 1,
    className,
}: {
    lines?: number;
    className?: string;
}) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        'h-4',
                        i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
                    )}
                />
            ))}
        </div>
    );
}

/** Avatar skeleton */
export function SkeletonAvatar({
    size = 'md',
    className,
}: {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizeStyles = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    return (
        <Skeleton className={cn('rounded-full', sizeStyles[size], className)} />
    );
}

/** Card skeleton */
export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div className={cn(
            'rounded-2xl p-4 space-y-4',
            'bg-slate-800/50 border border-slate-700',
            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
            className
        )}>
            <Skeleton className="h-32 w-full rounded-xl" />
            <SkeletonText lines={2} />
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
            </div>
        </div>
    );
}

/** Product card skeleton for POS */
export function SkeletonProductCard({ className }: { className?: string }) {
    return (
        <div className={cn(
            'rounded-2xl p-4 space-y-3',
            'bg-slate-800/50 border border-slate-700',
            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:shadow-sm',
            className
        )}>
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between items-center pt-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
            </div>
        </div>
    );
}

/** Table row skeleton */
export function SkeletonTableRow({
    columns = 4,
    className,
}: {
    columns?: number;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center gap-4 p-4', className)}>
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="h-4 flex-1"
                    style={{ maxWidth: i === 0 ? '30%' : undefined }}
                />
            ))}
        </div>
    );
}
