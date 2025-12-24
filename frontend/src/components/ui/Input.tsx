import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Label text */
    label?: string;
    /** Error message */
    error?: string;
    /** Helper text */
    helperText?: string;
    /** Icon to show at start of input */
    leftIcon?: ReactNode;
    /** Icon to show at end of input */
    rightIcon?: ReactNode;
    /** Full width */
    fullWidth?: boolean;
}

/**
 * Input component with label, error, and helper text support
 * Contrast-optimized for all themes
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = false,
            disabled,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className={cn(
                            'text-sm font-medium',
                            // Dark theme
                            'text-slate-300',
                            // Light theme - dark text for contrast
                            'data-[theme=light]:text-slate-700',
                            // Luxury theme
                            'data-[theme=luxury]:text-amber-300',
                            // Disabled state
                            disabled && 'opacity-50'
                        )}
                    >
                        {label}
                    </label>
                )}

                {/* Input wrapper */}
                <div className="relative">
                    {/* Left icon */}
                    {leftIcon && (
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none text-slate-400">
                            {leftIcon}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        id={inputId}
                        disabled={disabled}
                        className={cn(
                            'w-full h-10 px-4 rounded-xl text-sm font-medium transition-all duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0',
                            'placeholder:text-slate-500',
                            // Left/right icon padding
                            leftIcon && 'ps-10',
                            rightIcon && 'pe-10',
                            // Dark theme
                            'bg-slate-800/50 border border-slate-600 text-white',
                            'hover:border-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20',
                            // Light theme - proper contrast
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300 data-[theme=light]:text-slate-900',
                            'data-[theme=light]:hover:border-slate-400 data-[theme=light]:focus:border-cyan-600 data-[theme=light]:focus:ring-cyan-600/20',
                            'data-[theme=light]:placeholder:text-slate-400',
                            // Luxury theme
                            'data-[theme=luxury]:bg-black/50 data-[theme=luxury]:border-amber-600/50 data-[theme=luxury]:text-white',
                            'data-[theme=luxury]:focus:border-amber-400 data-[theme=luxury]:focus:ring-amber-400/20',
                            // Error state
                            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                            // Disabled state
                            disabled && 'opacity-50 cursor-not-allowed',
                            className
                        )}
                        {...props}
                    />

                    {/* Right icon */}
                    {rightIcon && (
                        <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none text-slate-400">
                            {rightIcon}
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <p className="text-xs font-medium text-red-500">{error}</p>
                )}

                {/* Helper text */}
                {helperText && !error && (
                    <p className={cn(
                        'text-xs',
                        'text-slate-500',
                        'data-[theme=light]:text-slate-500'
                    )}>
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
