import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style variant */
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'ghost';
    /** Size of the button */
    size?: 'sm' | 'md' | 'lg' | 'icon';
    /** Show loading spinner */
    isLoading?: boolean;
    /** Icon to show before text */
    leftIcon?: ReactNode;
    /** Icon to show after text */
    rightIcon?: ReactNode;
    /** Enable motion animations */
    animate?: boolean;
}

/**
 * Button component with multiple variants and sizes
 * Supports loading states, icons, and Framer Motion animations
 * 
 * Contrast-optimized for light, dark, and luxury themes
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            animate = true,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || isLoading;

        // Base styles
        const baseStyles = cn(
            'inline-flex items-center justify-center gap-2 rounded-xl font-bold',
            'transition-all duration-200 ease-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        );

        // Variant styles with proper contrast for all themes
        const variantStyles = {
            primary: cn(
                // Dark theme (default)
                'bg-gradient-to-b from-cyan-400 to-cyan-600 text-slate-900 shadow-lg shadow-cyan-500/25',
                'hover:from-cyan-300 hover:to-cyan-500 hover:shadow-cyan-500/40',
                'focus-visible:ring-cyan-400',
                // Light theme overrides
                'data-[theme=light]:from-cyan-600 data-[theme=light]:to-cyan-700 data-[theme=light]:text-white',
                'data-[theme=light]:shadow-cyan-600/20 data-[theme=light]:hover:from-cyan-500 data-[theme=light]:hover:to-cyan-600',
                // Luxury theme overrides  
                'data-[theme=luxury]:from-amber-400 data-[theme=luxury]:to-amber-600 data-[theme=luxury]:text-black',
            ),
            secondary: cn(
                'bg-transparent border-2',
                // Dark theme
                'border-slate-600 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400',
                'focus-visible:ring-cyan-400',
                // Light theme - darker border and text for contrast
                'data-[theme=light]:border-slate-400 data-[theme=light]:text-cyan-700 data-[theme=light]:hover:bg-cyan-50 data-[theme=light]:hover:border-cyan-600',
                // Luxury theme
                'data-[theme=luxury]:border-amber-600 data-[theme=luxury]:text-amber-400 data-[theme=luxury]:hover:bg-amber-400/10',
            ),
            success: cn(
                'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/25',
                'hover:from-emerald-300 hover:to-emerald-500',
                'focus-visible:ring-emerald-400',
                // Light theme - darker green for contrast
                'data-[theme=light]:from-emerald-600 data-[theme=light]:to-emerald-700',
            ),
            warning: cn(
                'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-900 shadow-lg shadow-amber-500/25',
                'hover:from-amber-300 hover:to-amber-500',
                'focus-visible:ring-amber-400',
                // Light theme
                'data-[theme=light]:from-amber-500 data-[theme=light]:to-amber-600 data-[theme=light]:text-white',
            ),
            destructive: cn(
                'bg-gradient-to-b from-red-400 to-red-600 text-white shadow-lg shadow-red-500/25',
                'hover:from-red-300 hover:to-red-500',
                'focus-visible:ring-red-400',
                // Light theme
                'data-[theme=light]:from-red-600 data-[theme=light]:to-red-700',
            ),
            ghost: cn(
                'bg-transparent hover:bg-white/10',
                // Dark theme
                'text-slate-300 hover:text-white',
                // Light theme - dark text for contrast
                'data-[theme=light]:text-slate-700 data-[theme=light]:hover:bg-slate-100 data-[theme=light]:hover:text-slate-900',
                // Luxury theme
                'data-[theme=luxury]:text-amber-400 data-[theme=luxury]:hover:bg-amber-400/10',
            ),
        };

        // Size styles
        const sizeStyles = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-6 text-base',
            icon: 'h-10 w-10 p-0',
        };

        const buttonContent = (
            <>
                {isLoading && (
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {!isLoading && leftIcon}
                {children}
                {!isLoading && rightIcon}
            </>
        );

        // Motion wrapper for animations
        if (animate && !isDisabled) {
            return (
                <motion.button
                    ref={ref as React.Ref<HTMLButtonElement>}
                    className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
                    disabled={isDisabled}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    {...(props as HTMLMotionProps<'button'>)}
                >
                    {buttonContent}
                </motion.button>
            );
        }

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
                disabled={isDisabled}
                {...props}
            >
                {buttonContent}
            </button>
        );
    }
);

Button.displayName = 'Button';
