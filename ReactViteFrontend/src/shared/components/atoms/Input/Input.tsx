import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Input variants
 */
const inputVariants = cva(
    // Base styles from DESIGN_SYSTEM.md
    'w-full rounded-xl bg-[rgba(255,255,255,0.05)] border text-[#e2e2e6] placeholder:text-[#c2c7ce] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)]',
                error: 'border-red-500 focus-visible:ring-red-400',
            },
            inputSize: {
                sm: 'h-9 px-3 py-2 text-sm',
                default: 'h-11 px-4 py-3 text-base',
                lg: 'h-14 px-5 py-4 text-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            inputSize: 'default',
        },
    }
);

export interface InputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
    /** Icon to show at start of input */
    startIcon?: React.ReactNode;
    /** Icon to show at end of input */
    endIcon?: React.ReactNode;
    /** Error message to display */
    error?: string;
    /** Label for input */
    label?: string;
}

/**
 * Input Component
 * Text input field with icon support and error states
 * ForwardRef for React Hook Form integration
 * 
 * @example
 * <Input label="البحث" startIcon={<Search />} placeholder="ابحث عن منتج..." />
 * <Input error="رقم الهاتف مطلوب" variant="error" />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, variant, inputSize, startIcon, endIcon, error, label, type, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-sm font-medium text-[#e2e2e6]">
                        {label}
                    </label>
                )}

                <div className="relative">
                    {/* Start Icon */}
                    {startIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c2c7ce]">
                            {startIcon}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        type={type}
                        className={cn(
                            inputVariants({ variant: error ? 'error' : variant, inputSize }),
                            startIcon && 'pl-10',
                            endIcon && 'pr-10',
                            className
                        )}
                        ref={ref}
                        {...props}
                    />

                    {/* End Icon */}
                    {endIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c2c7ce]">
                            {endIcon}
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <p className="text-sm text-red-400 font-medium">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input, inputVariants };
