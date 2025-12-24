import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';

export interface TooltipProps {
    /** Tooltip content */
    children: ReactNode;
    /** Position relative to trigger */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Additional className */
    className?: string;
}

/**
 * Glassmorphic tooltip component
 * Used for action bar hints and keyboard shortcuts
 */
export function Tooltip({ children, position = 'top', className }: TooltipProps) {
    const theme = useSettingsStore((state) => state.theme);

    const positionStyles = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 me-2',
        right: 'left-full top-1/2 -translate-y-1/2 ms-2',
    };

    const arrowStyles = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--glass-strong)]',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--glass-strong)]',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--glass-strong)]',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--glass-strong)]',
    };

    return (
        <div
            data-theme={theme}
            className={cn(
                'absolute z-50 px-3 py-1.5 rounded-lg',
                'backdrop-blur-xl border shadow-lg',
                'text-xs font-medium whitespace-nowrap',
                'opacity-0 group-hover:opacity-100',
                'scale-95 group-hover:scale-100',
                'transition-all duration-200 pointer-events-none',
                // Theme styles
                'bg-slate-900/90 border-slate-700/50 text-white',
                'data-[theme=light]:bg-white/95 data-[theme=light]:border-slate-200',
                'data-[theme=light]:text-slate-900 data-[theme=light]:shadow-slate-200/50',
                'data-[theme=luxury]:bg-black/95 data-[theme=luxury]:border-amber-500/30',
                'data-[theme=luxury]:text-amber-100',
                positionStyles[position],
                className
            )}
        >
            {children}
            {/* Arrow */}
            <div
                className={cn(
                    'absolute w-0 h-0 border-4 border-transparent',
                    arrowStyles[position]
                )}
            />
        </div>
    );
}

export interface TooltipTriggerProps {
    /** Trigger element */
    children: ReactNode;
    /** Tooltip content */
    tooltip: ReactNode;
    /** Tooltip position */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Additional className for wrapper */
    className?: string;
}

/**
 * Wrapper that provides tooltip functionality
 */
export function TooltipTrigger({
    children,
    tooltip,
    position = 'top',
    className
}: TooltipTriggerProps) {
    return (
        <div className={cn('relative group inline-flex', className)}>
            {children}
            <Tooltip position={position}>{tooltip}</Tooltip>
        </div>
    );
}
