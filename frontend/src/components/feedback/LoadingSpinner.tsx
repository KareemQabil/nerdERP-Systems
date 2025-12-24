import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
    /** Size of the spinner */
    size?: 'sm' | 'md' | 'lg';
    /** Optional label text */
    label?: string;
    /** Center in container */
    centered?: boolean;
}

/**
 * Loading spinner component
 * Uses theme-aware colors
 */
export function LoadingSpinner({
    size = 'md',
    label,
    centered = false,
}: LoadingSpinnerProps) {
    const sizeStyles = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    const spinner = (
        <div className={cn('flex flex-col items-center gap-3', centered && 'justify-center')}>
            <div
                className={cn(
                    'rounded-full animate-spin',
                    sizeStyles[size],
                    // Dark theme
                    'border-cyan-400 border-t-transparent',
                    // Light theme
                    'data-[theme=light]:border-cyan-600 data-[theme=light]:border-t-transparent',
                    // Luxury theme
                    'data-[theme=luxury]:border-amber-400 data-[theme=luxury]:border-t-transparent',
                )}
            />
            {label && (
                <span
                    className={cn(
                        'text-sm font-medium',
                        'text-slate-400',
                        'data-[theme=light]:text-slate-600',
                        'data-[theme=luxury]:text-amber-400',
                    )}
                >
                    {label}
                </span>
            )}
        </div>
    );

    if (centered) {
        return (
            <div className="flex items-center justify-center w-full h-full min-h-[200px]">
                {spinner}
            </div>
        );
    }

    return spinner;
}
