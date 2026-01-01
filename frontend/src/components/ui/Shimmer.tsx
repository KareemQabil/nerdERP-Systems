import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';

export interface ShimmerProps {
    /** Shimmer shape type */
    type?: 'text' | 'image' | 'circle' | 'custom';
    /** Width (for text/custom) */
    width?: string;
    /** Height (for text/custom) */
    height?: string;
    /** Number of text lines */
    lines?: number;
    /** Additional className */
    className?: string;
}

/**
 * Skeleton shimmer loading animation
 * Used for image loading and placeholder states
 */
export function Shimmer({
    type = 'custom',
    width = '100%',
    height = '1rem',
    lines = 1,
    className,
}: ShimmerProps) {
    const { theme } = useAppSelector(selectSettings);

    const baseClasses = cn(
        'animate-shimmer rounded',
        // Theme-aware shimmer background
        'bg-gradient-to-r',
        'from-slate-700/50 via-slate-600/50 to-slate-700/50',
        'data-[theme=light]:from-slate-200 data-[theme=light]:via-slate-100 data-[theme=light]:to-slate-200',
        'data-[theme=luxury]:from-amber-500/10 data-[theme=luxury]:via-amber-500/20 data-[theme=luxury]:to-amber-500/10',
    );

    if (type === 'text') {
        return (
            <div className={cn('space-y-2', className)} data-theme={theme}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        data-theme={theme}
                        className={cn(baseClasses, 'h-4 rounded')}
                        style={{
                            width: i === lines - 1 && lines > 1 ? '70%' : width,
                        }}
                    />
                ))}
            </div>
        );
    }

    if (type === 'image') {
        return (
            <div
                data-theme={theme}
                className={cn(
                    baseClasses,
                    'aspect-square rounded-xl',
                    className
                )}
            />
        );
    }

    if (type === 'circle') {
        return (
            <div
                data-theme={theme}
                className={cn(
                    baseClasses,
                    'rounded-full',
                    className
                )}
                style={{ width, height }}
            />
        );
    }

    // Custom
    return (
        <div
            data-theme={theme}
            className={cn(baseClasses, className)}
            style={{ width, height }}
        />
    );
}

/**
 * Image with shimmer loading state
 */
export interface ShimmerImageProps {
    src: string;
    alt: string;
    className?: string;
    onLoad?: () => void;
}

export function ShimmerImage({ src, alt, className, onLoad }: ShimmerImageProps) {
    const { theme } = useAppSelector(selectSettings);

    return (
        <div className={cn('relative overflow-hidden', className)} data-theme={theme}>
            {/* Shimmer placeholder - visible until image loads */}
            <div
                data-theme={theme}
                className={cn(
                    'absolute inset-0 animate-shimmer',
                    'bg-gradient-to-r',
                    'from-slate-700/50 via-slate-600/30 to-slate-700/50',
                    'data-[theme=light]:from-slate-200 data-[theme=light]:via-white data-[theme=light]:to-slate-200',
                    'data-[theme=luxury]:from-amber-500/10 data-[theme=luxury]:via-amber-500/5 data-[theme=luxury]:to-amber-500/10',
                )}
            />
            {/* Actual image */}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                onLoad={onLoad}
                className="w-full h-full object-cover relative z-10"
            />
        </div>
    );
}
