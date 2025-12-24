import { forwardRef, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Visual style variant */
    variant?: 'default' | 'elevated' | 'glass' | 'outline';
    /** Enable hover effects */
    hoverable?: boolean;
    /** Enable click effect */
    clickable?: boolean;
    /** Padding size */
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Card component with multiple variants
 * Supports hover effects and Framer Motion animations
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            className,
            variant = 'default',
            hoverable = false,
            clickable = false,
            padding = 'md',
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles = cn(
            'rounded-2xl transition-all duration-200',
        );

        const variantStyles = {
            default: cn(
                'backdrop-blur-2xl border shadow-xl',
                // Dark theme
                'bg-slate-900/40 border-slate-700/50 shadow-black/10',
                // Light theme  
                'data-[theme=light]:bg-white/70 data-[theme=light]:border-slate-200/50 data-[theme=light]:shadow-slate-300/20',
                // Luxury theme
                'data-[theme=luxury]:bg-black/50 data-[theme=luxury]:border-amber-500/20 data-[theme=luxury]:shadow-amber-900/10',
            ),
            elevated: cn(
                'backdrop-blur-3xl border shadow-2xl',
                // Dark theme
                'bg-slate-900/60 border-slate-600/50 shadow-black/20',
                // Light theme
                'data-[theme=light]:bg-white/80 data-[theme=light]:border-slate-300/60 data-[theme=light]:shadow-slate-400/25',
                // Luxury theme
                'data-[theme=luxury]:bg-black/70 data-[theme=luxury]:border-amber-500/30 data-[theme=luxury]:shadow-amber-900/20',
            ),
            glass: cn(
                'backdrop-blur-xl',
                // Dark theme
                'bg-white/5 border border-white/10 shadow-lg shadow-white/5',
                // Light theme
                'data-[theme=light]:bg-slate-900/5 data-[theme=light]:border-slate-900/10 data-[theme=light]:shadow-slate-900/5',
                // Luxury theme
                'data-[theme=luxury]:bg-amber-400/5 data-[theme=luxury]:border-amber-400/15 data-[theme=luxury]:shadow-amber-400/10',
            ),
            outline: cn(
                'bg-transparent border-2 backdrop-blur-sm',
                // Dark theme
                'border-slate-600/60',
                // Light theme
                'data-[theme=light]:border-slate-300/60',
                // Luxury theme
                'data-[theme=luxury]:border-amber-500/60',
            ),
        };

        const paddingStyles = {
            none: '',
            sm: 'p-3',
            md: 'p-4',
            lg: 'p-6',
        };

        const hoverStyles = hoverable
            ? cn(
                'hover:border-cyan-400/60 hover:shadow-2xl hover:bg-white/[0.08]',
                'data-[theme=light]:hover:border-cyan-500/70 data-[theme=light]:hover:shadow-cyan-100/50 data-[theme=light]:hover:bg-white/90',
                'data-[theme=luxury]:hover:border-amber-400/60 data-[theme=luxury]:hover:shadow-amber-500/20',
            )
            : '';

        const clickableStyles = clickable
            ? 'cursor-pointer active:scale-[0.98]'
            : '';

        if (clickable) {
            return (
                <motion.div
                    ref={ref as React.Ref<HTMLDivElement>}
                    className={cn(
                        baseStyles,
                        variantStyles[variant],
                        paddingStyles[padding],
                        hoverStyles,
                        clickableStyles,
                        className
                    )}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    {...(props as HTMLMotionProps<'div'>)}
                >
                    {children}
                </motion.div>
            );
        }

        return (
            <div
                ref={ref}
                className={cn(
                    baseStyles,
                    variantStyles[variant],
                    paddingStyles[padding],
                    hoverStyles,
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

// Card Header subcomponent
export function CardHeader({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex items-center justify-between pb-4 border-b',
                'border-slate-700',
                'data-[theme=light]:border-slate-200',
                'data-[theme=luxury]:border-amber-600/30',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

// Card Title subcomponent
export function CardTitle({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn(
                'text-lg font-bold',
                'text-white',
                'data-[theme=light]:text-slate-900',
                'data-[theme=luxury]:text-amber-400',
                className
            )}
            {...props}
        >
            {children}
        </h3>
    );
}

// Card Content subcomponent
export function CardContent({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('pt-4', className)} {...props}>
            {children}
        </div>
    );
}

// Card Footer subcomponent
export function CardFooter({
    className,
    children,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex items-center gap-3 pt-4 mt-4 border-t',
                'border-slate-700',
                'data-[theme=light]:border-slate-200',
                'data-[theme=luxury]:border-amber-600/30',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
