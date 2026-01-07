/**
 * PinInput Component
 *
 * Reusable PIN input with numeric keypad for POS applications.
 * Supports configurable length, masked display, attempt tracking,
 * lockout display, and shake animation on error.
 *
 * Features:
 * - Configurable PIN length (4-6 digits)
 * - Numeric keypad with large touch targets
 * - Masked display with animated dots
 * - Shake animation on error
 * - Attempt counter with visual feedback
 * - Lockout display with countdown
 * - Keyboard support (0-9, Backspace, Enter)
 * - Accessibility support (ARIA labels, keyboard navigation)
 *
 * @example
 * ```tsx
 * <PinInput
 *   length={4}
 *   value={pin}
 *   onChange={setPin}
 *   onSubmit={handleSubmit}
 *   error={error}
 *   attempts={attempts}
 *   maxAttempts={5}
 *   lockoutRemaining={lockoutSeconds}
 *   disabled={isLocked}
 *   showAttempts={true}
 *   autoFocus={true}
 * />
 * ```
 */

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';

export interface PinInputProps {
    /** PIN length (4-6 digits) */
    length?: 4 | 5 | 6;
    /** Current PIN value */
    value: string;
    /** Callback when PIN changes */
    onChange: (pin: string) => void;
    /** Callback when PIN is complete (optional) */
    onSubmit?: (pin: string) => void | Promise<void>;
    /** Error message to display */
    error?: string | null;
    /** Number of failed attempts */
    attempts?: number;
    /** Maximum attempts before lockout */
    maxAttempts?: number;
    /** Remaining lockout seconds */
    lockoutRemaining?: number;
    /** Whether input is disabled (e.g., during lockout) */
    disabled?: boolean;
    /** Show attempt counter */
    showAttempts?: boolean;
    /** Auto-focus input on mount */
    autoFocus?: boolean;
    /** Label for accessibility */
    label?: string;
    /** Custom class name */
    className?: string;
    /** Hide keypad (use physical keyboard only) */
    hideKeypad?: boolean;
}

export interface PinInputRef {
    /** Clear the PIN input */
    clear: () => void;
    /** Focus the PIN input */
    focus: () => void;
    /** Shake the input (for error feedback) */
    shake: () => void;
}

export const PinInput = forwardRef<PinInputRef, PinInputProps>(({
    length = 4,
    value,
    onChange,
    onSubmit,
    error,
    attempts = 0,
    maxAttempts = 5,
    lockoutRemaining = 0,
    disabled = false,
    showAttempts = true,
    autoFocus = true,
    label,
    className,
    hideKeypad = false,
}, ref) => {
    const { theme, language } = useSettingsStore();
    const [isShaking, setIsShaking] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        clear: () => onChange(''),
        focus: () => containerRef.current?.focus(),
        shake: () => {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        },
    }));

    // Update focused index based on current value length
    useEffect(() => {
        setFocusedIndex(Math.min(value.length, length - 1));
    }, [value, length]);

    // Handle digit input
    const handleDigit = useCallback((digit: string) => {
        if (disabled || value.length >= length) return;

        const newValue = value + digit;
        onChange(newValue);

        // Auto-submit when PIN is complete
        if (newValue.length === length && onSubmit) {
            onSubmit(newValue);
        }
    }, [disabled, value, length, onChange, onSubmit]);

    // Handle backspace
    const handleBackspace = useCallback(() => {
        if (disabled || value.length === 0) return;

        const newValue = value.slice(0, -1);
        onChange(newValue);
    }, [disabled, value, onChange]);

    // Handle clear
    const handleClear = useCallback(() => {
        if (disabled) return;
        onChange('');
    }, [disabled, onChange]);

    // Handle keyboard input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabled) return;

            // Handle digits
            if (/^\d$/.test(e.key)) {
                e.preventDefault();
                handleDigit(e.key);
            }
            // Handle backspace
            else if (e.key === 'Backspace') {
                e.preventDefault();
                handleBackspace();
            }
            // Handle enter
            else if (e.key === 'Enter' && value.length === length && onSubmit) {
                e.preventDefault();
                onSubmit(value);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [disabled, handleDigit, handleBackspace, value, length, onSubmit]);

    // Shake animation on error
    useEffect(() => {
        if (error) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        }
    }, [error]);

    // Auto-focus on mount
    useEffect(() => {
        if (autoFocus && !disabled) {
            containerRef.current?.focus();
        }
    }, [autoFocus, disabled]);

    // Format lockout time
    const formatLockoutTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return language === 'ar'
            ? `${mins}:${secs.toString().padStart(2, '0')}`
            : `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate remaining attempts
    const remainingAttempts = maxAttempts - attempts;

    return (
        <div
            ref={containerRef}
            className={cn('flex flex-col gap-4', className)}
            tabIndex={disabled ? -1 : 0}
            role="application"
            aria-label={label || (language === 'ar' ? 'إدخال رمز PIN' : 'PIN input')}
        >
            {/* Lockout Banner */}
            <AnimatePresence>
                {lockoutRemaining > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl"
                    >
                        <Lock className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div className="text-center">
                            <p className="text-sm font-medium text-red-400">
                                {language === 'ar' ? 'الحساب مغلق مؤقتاً' : 'Account temporarily locked'}
                            </p>
                            <p className="text-xs text-red-300">
                                {language === 'ar'
                                    ? `حاول مرة أخرى في ${formatLockoutTime(lockoutRemaining)}`
                                    : `Try again in ${formatLockoutTime(lockoutRemaining)}`
                                }
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PIN Display */}
            <motion.div
                animate={isShaking ? {
                    x: [0, -10, 10, -10, 10, -5, 5, 0]
                } : {}}
                transition={{ duration: 0.5 }}
                className="flex justify-center gap-3"
            >
                {Array.from({ length }).map((_, index) => {
                    const isActive = index === focusedIndex && !disabled;
                    const hasValue = index < value.length;

                    return (
                        <motion.div
                            key={index}
                            animate={{
                                scale: isActive ? 1.1 : 1,
                                borderColor: isActive
                                    ? theme === 'luxury' ? 'rgb(251, 191, 36)' // amber-400
                                    : 'rgb(34, 211, 238)' // cyan-400
                                    : theme === 'light'
                                        ? 'rgb(203, 213, 225)' // slate-300
                                        : 'rgb(71, 85, 105)', // slate-600
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className={cn(
                                'w-14 h-16 sm:w-16 sm:h-18 rounded-xl border-2 flex items-center justify-center transition-colors',
                                'bg-slate-800',
                                'data-[theme=light]:bg-slate-100',
                            )}
                            data-theme={theme}
                        >
                            {hasValue ? (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={cn(
                                        'w-4 h-4 rounded-full',
                                        theme === 'luxury' ? 'bg-amber-400' : 'bg-cyan-400',
                                    )}
                                    data-theme={theme}
                                />
                            ) : (
                                <div className={cn(
                                    'w-2 h-2 rounded-full',
                                    'bg-slate-600',
                                    'data-[theme=light]:bg-slate-300',
                                )} data-theme={theme} />
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2 text-red-400"
                    >
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm text-center">{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attempts Counter */}
            {showAttempts && attempts > 0 && lockoutRemaining === 0 && (
                <div className="text-center">
                    <p className={cn(
                        'text-xs',
                        remainingAttempts <= 1 ? 'text-red-400' : 'text-slate-500',
                    )}>
                        {language === 'ar'
                            ? `${remainingAttempts} محاولات متبقية`
                            : `${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining`
                        }
                    </p>
                </div>
            )}

            {/* Numeric Keypad */}
            {!hideKeypad && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xs mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <motion.button
                            key={num}
                            type="button"
                            whileHover={{ scale: disabled ? 1 : 1.05 }}
                            whileTap={{ scale: disabled ? 1 : 0.95 }}
                            onClick={() => handleDigit(String(num))}
                            disabled={disabled || value.length >= length}
                            className={cn(
                                'h-14 sm:h-16 rounded-xl font-bold text-xl transition-colors',
                                'bg-slate-800 text-white hover:bg-slate-700',
                                'data-[theme=light]:bg-slate-100 data-[theme=light]:text-slate-900',
                                'data-[theme=light]:hover:bg-slate-200',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                            )}
                            data-theme={theme}
                        >
                            {num}
                        </motion.button>
                    ))}

                    {/* Clear Button */}
                    <motion.button
                        type="button"
                        whileHover={{ scale: disabled ? 1 : 1.05 }}
                        whileTap={{ scale: disabled ? 1 : 0.95 }}
                        onClick={handleClear}
                        disabled={disabled || value.length === 0}
                        className={cn(
                            'h-14 sm:h-16 rounded-xl font-bold transition-colors',
                            'bg-red-500/20 text-red-400 hover:bg-red-500/30',
                            'disabled:opacity-50',
                        )}
                    >
                        <Delete className="w-5 h-5 mx-auto" />
                    </motion.button>

                    {/* Zero */}
                    <motion.button
                        type="button"
                        whileHover={{ scale: disabled ? 1 : 1.05 }}
                        whileTap={{ scale: disabled ? 1 : 0.95 }}
                        onClick={() => handleDigit('0')}
                        disabled={disabled || value.length >= length}
                        className={cn(
                            'h-14 sm:h-16 rounded-xl font-bold text-xl transition-colors',
                            'bg-slate-800 text-white hover:bg-slate-700',
                            'data-[theme=light]:bg-slate-100 data-[theme=light]:text-slate-900',
                            'data-[theme=light]:hover:bg-slate-200',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                        )}
                        data-theme={theme}
                    >
                        0
                    </motion.button>

                    {/* Backspace */}
                    <motion.button
                        type="button"
                        whileHover={{ scale: disabled ? 1 : 1.05 }}
                        whileTap={{ scale: disabled ? 1 : 0.95 }}
                        onClick={handleBackspace}
                        disabled={disabled || value.length === 0}
                        className={cn(
                            'h-14 sm:h-16 rounded-xl font-bold transition-colors',
                            'bg-slate-700 text-slate-300 hover:bg-slate-600',
                            'data-[theme=light]:bg-slate-200 data-[theme=light]:text-slate-600',
                            'data-[theme=light]:hover:bg-slate-300',
                            'disabled:opacity-50',
                        )}
                        data-theme={theme}
                    >
                        <Delete className="w-5 h-5 mx-auto" />
                    </motion.button>
                </div>
            )}
        </div>
    );
});

PinInput.displayName = 'PinInput';

export default PinInput;
