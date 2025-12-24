import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    /** Visual style variant */
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
    /** Size of the badge */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge component for status indicators and labels
 * Contrast-optimized for all themes
 */
export function Badge({
    className,
    variant = 'default',
    size = 'md',
    children,
    ...props
}: BadgeProps) {
    const baseStyles = cn(
        'inline-flex items-center justify-center font-semibold rounded-full',
        'transition-colors duration-200',
    );

    const variantStyles = {
        default: cn(
            // Dark theme
            'bg-slate-700 text-slate-200',
            // Light theme - subtle gray with dark text
            'data-[theme=light]:bg-slate-100 data-[theme=light]:text-slate-700',
            // Luxury theme
            'data-[theme=luxury]:bg-slate-800 data-[theme=luxury]:text-amber-400',
        ),
        primary: cn(
            // Dark theme
            'bg-cyan-400/20 text-cyan-400',
            // Light theme - stronger contrast
            'data-[theme=light]:bg-cyan-100 data-[theme=light]:text-cyan-700',
            // Luxury theme
            'data-[theme=luxury]:bg-amber-400/20 data-[theme=luxury]:text-amber-400',
        ),
        success: cn(
            // Dark theme
            'bg-emerald-400/20 text-emerald-400',
            // Light theme
            'data-[theme=light]:bg-emerald-100 data-[theme=light]:text-emerald-700',
            // Luxury theme
            'data-[theme=luxury]:bg-emerald-400/20 data-[theme=luxury]:text-emerald-400',
        ),
        warning: cn(
            // Dark theme
            'bg-amber-400/20 text-amber-400',
            // Light theme
            'data-[theme=light]:bg-amber-100 data-[theme=light]:text-amber-700',
            // Luxury theme
            'data-[theme=luxury]:bg-amber-400/20 data-[theme=luxury]:text-amber-300',
        ),
        error: cn(
            // Dark theme
            'bg-red-400/20 text-red-400',
            // Light theme
            'data-[theme=light]:bg-red-100 data-[theme=light]:text-red-700',
            // Luxury theme
            'data-[theme=luxury]:bg-red-400/20 data-[theme=luxury]:text-red-400',
        ),
        outline: cn(
            'bg-transparent border',
            // Dark theme
            'border-slate-600 text-slate-300',
            // Light theme
            'data-[theme=light]:border-slate-300 data-[theme=light]:text-slate-600',
            // Luxury theme
            'data-[theme=luxury]:border-amber-600 data-[theme=luxury]:text-amber-400',
        ),
    };

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
    };

    return (
        <span
            className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
            {...props}
        >
            {children}
        </span>
    );
}

// Dot badge for simple status indicators
export function DotBadge({
    className,
    color = 'default',
    pulse = false,
    ...props
}: HTMLAttributes<HTMLSpanElement> & {
    color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
    pulse?: boolean;
}) {
    const colorStyles = {
        default: 'bg-slate-500',
        primary: 'bg-cyan-400 data-[theme=luxury]:bg-amber-400',
        success: 'bg-emerald-400',
        warning: 'bg-amber-400',
        error: 'bg-red-400',
    };

    return (
        <span
            className={cn(
                'inline-block w-2 h-2 rounded-full',
                colorStyles[color],
                pulse && 'animate-pulse',
                className
            )}
            {...props}
        />
    );
}
