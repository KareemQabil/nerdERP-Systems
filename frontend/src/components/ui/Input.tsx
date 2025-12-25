import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';

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
        const theme = useSettingsStore((s) => s.theme);
        const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

        return (
            <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
                {/* Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className={cn(
                            'text-sm font-medium',
                            theme === 'light' ? 'text-slate-700' : 'text-slate-300',
                            theme === 'luxury' && 'text-amber-300',
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
                        <div className={cn(
                            'absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none',
                            theme === 'light' ? 'text-slate-500' : 'text-slate-400',
                        )}>
                            {leftIcon}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        id={inputId}
                        disabled={disabled}
                        className={cn(
                            'w-full h-11 px-4 rounded-xl text-sm font-medium transition-all duration-200',
                            'focus:outline-none focus:ring-2 focus:ring-offset-0',
                            // Left/right icon padding
                            leftIcon && 'ps-10',
                            rightIcon && 'pe-10',
                            // Theme-based styling
                            theme === 'light' ? cn(
                                // Light theme - lighter grey, not white
                                'bg-slate-100 border border-slate-300 text-slate-900',
                                'placeholder:text-slate-500',
                                'hover:border-slate-400 focus:border-cyan-600 focus:ring-cyan-600/20',
                            ) : theme === 'luxury' ? cn(
                                // Luxury theme
                                'bg-black/50 border border-amber-600/50 text-white',
                                'placeholder:text-slate-500',
                                'focus:border-amber-400 focus:ring-amber-400/20',
                            ) : cn(
                                // Dark theme (default)
                                'bg-slate-800/50 border border-slate-600 text-white',
                                'placeholder:text-slate-500',
                                'hover:border-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20',
                            ),
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
