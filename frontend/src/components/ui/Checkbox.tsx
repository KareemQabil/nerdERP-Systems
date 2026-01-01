import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** Label text */
    label?: string;
    /** Error message */
    error?: string;
}

/**
 * Checkbox component with label support
 * Contrast-optimized for all themes
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    (
        {
            className,
            label,
            error,
            disabled,
            id,
            ...props
        },
        ref
    ) => {
        const { theme } = useAppSelector(selectSettings);
        const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

        return (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    {/* Hidden native checkbox for accessibility */}
                    <input
                        ref={ref}
                        type="checkbox"
                        id={checkboxId}
                        disabled={disabled}
                        className="sr-only peer"
                        {...props}
                    />

                    {/* Custom checkbox */}
                    <label
                        htmlFor={checkboxId}
                        className={cn(
                            'relative flex items-center justify-center w-5 h-5 rounded-md cursor-pointer transition-all duration-200',
                            'border-2',
                            // Theme-based styling
                            theme === 'light' ? cn(
                                'border-slate-400 bg-slate-100',
                                'peer-checked:bg-cyan-600 peer-checked:border-cyan-600',
                                'peer-focus:ring-2 peer-focus:ring-cyan-600/20',
                                'hover:border-slate-500'
                            ) : theme === 'luxury' ? cn(
                                'border-amber-600/50 bg-black/50',
                                'peer-checked:bg-amber-500 peer-checked:border-amber-500',
                                'peer-focus:ring-2 peer-focus:ring-amber-400/20',
                                'hover:border-amber-500'
                            ) : cn(
                                // Dark theme (default)
                                'border-slate-600 bg-slate-800/50',
                                'peer-checked:bg-cyan-400 peer-checked:border-cyan-400',
                                'peer-focus:ring-2 peer-focus:ring-cyan-400/20',
                                'hover:border-slate-500'
                            ),
                            // Disabled state
                            disabled && 'opacity-50 cursor-not-allowed',
                            className
                        )}
                    >
                        {/* Checkmark icon */}
                        <Check
                            size={14}
                            className={cn(
                                'opacity-0 transition-opacity duration-200',
                                'peer-checked:opacity-100',
                                theme === 'light' ? 'text-white' : 'text-slate-900'
                            )}
                            strokeWidth={3}
                        />
                    </label>

                    {/* Label */}
                    {label && (
                        <label
                            htmlFor={checkboxId}
                            className={cn(
                                'text-sm font-medium cursor-pointer select-none',
                                theme === 'light' ? 'text-slate-700' : 'text-slate-300',
                                theme === 'luxury' && 'text-amber-300',
                                disabled && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            {label}
                        </label>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <p className="text-xs font-medium text-red-500 ps-7">{error}</p>
                )}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';
