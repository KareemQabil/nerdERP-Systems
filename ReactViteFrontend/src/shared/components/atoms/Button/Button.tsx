import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Button variants using CVA (Class Variance Authority)
 * Following DESIGN_SYSTEM.md specifications
 */
const buttonVariants = cva(
    // Base styles - always applied
    'inline-flex items-center justify-center rounded-xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                // Primary: Cyan gradient (brand color)
                default: 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-[#00373a] hover:from-cyan-500 hover:to-cyan-600 shadow-lg',
                // Secondary: Purple accent
                secondary: 'bg-gradient-to-br from-purple-400 to-purple-500 text-white hover:from-purple-500 hover:to-purple-600 shadow-lg',
                // Destructive: Red for delete/void actions
                destructive: 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg',
                // Outline: Transparent with border
                outline: 'border-2 border-[rgba(255,255,255,0.2)] bg-transparent text-[#e2e2e6] hover:bg-[rgba(255,255,255,0.05)] hover:border-cyan-400',
                // Ghost: Minimal style
                ghost: 'text-cyan-400 hover:bg-[rgba(6,182,212,0.1)] hover:text-cyan-300',
            },
            size: {
                sm: 'h-9 px-4 py-2 text-sm',
                default: 'h-11 px-6 py-3 text-base',
                lg: 'h-14 px-8 py-4 text-lg',
                xl: 'h-16 px-10 py-5 text-xl', // Touch-friendly for POS
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    /** Show loading spinner */
    isLoading?: boolean;
    /** Icon to show before text */
    startIcon?: React.ReactNode;
    /** Icon to show after text */
    endIcon?: React.ReactNode;
}

/**
 * Button Component
 * Primary interactive element following DESIGN_SYSTEM.md
 * 
 * @example
 * <Button variant="default" size="lg">إضافة منتج</Button>
 * <Button variant="destructive" isLoading>حذف...</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading, startIcon, endIcon, children, disabled, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && startIcon && <span className="mr-2">{startIcon}</span>}
                {children}
                {!isLoading && endIcon && <span className="ml-2">{endIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
