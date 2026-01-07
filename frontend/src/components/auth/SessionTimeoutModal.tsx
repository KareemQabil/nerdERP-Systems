/**
 * SessionTimeoutModal Component
 *
 * Modal displayed when user session is about to expire.
 * Shows a countdown and allows extending session with PIN verification.
 *
 * Features:
 * - Displays warning 2 minutes before expiry (configurable)
 * - Countdown timer with visual progress ring
 * - Extend session with PIN verification
 * - Auto-logout when timer reaches zero
 * - Bilingual support (English/Arabic)
 * - Theme-aware styling
 *
 * @example
 * ```tsx
 * <SessionTimeoutModal
 *   isOpen={showTimeout}
 *   remainingSeconds={120}
 *   onExtend={handleExtendSession}
 *   onLogout={handleLogout}
 *   warningSeconds={120} // Show warning 2 minutes before expiry
 * />
 * ```
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';
import { PinInput, type PinInputRef } from './PinInput';

export interface SessionTimeoutModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Remaining seconds before session expires */
    remainingSeconds: number;
    /** Callback to extend session (receives PIN as parameter) */
    onExtend: (pin: string) => Promise<boolean>;
    /** Callback to log out immediately */
    onLogout: () => void | Promise<void>;
    /** Show warning this many seconds before expiry (default: 120) */
    warningSeconds?: number;
    /** User ID for PIN verification (optional) */
    userId?: string;
    /** Device ID for lockout tracking (optional) */
    deviceId?: string;
    /** Current attempt count (optional) */
    attempts?: number;
    /** Maximum attempts before lockout (optional) */
    maxAttempts?: number;
    /** Lockout remaining seconds (optional) */
    lockoutRemaining?: number;
}

/**
 * Session Timeout Modal
 *
 * Shows a countdown and allows extending session via PIN verification.
 */
export function SessionTimeoutModal({
    isOpen,
    remainingSeconds,
    onExtend,
    onLogout,
    warningSeconds = 120,
    userId,
    deviceId,
    attempts = 0,
    maxAttempts = 5,
    lockoutRemaining = 0,
}: SessionTimeoutModalProps) {
    const { theme, language } = useSettingsStore();
    const [pin, setPin] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [localCountdown, setLocalCountdown] = useState(remainingSeconds);
    const pinInputRef = useRef<PinInputRef>(null);

    // Update local countdown when remainingSeconds changes
    useEffect(() => {
        setLocalCountdown(remainingSeconds);
    }, [remainingSeconds]);

    // Local countdown timer
    useEffect(() => {
        if (!isOpen || localCountdown <= 0) return;

        const interval = setInterval(() => {
            setLocalCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, localCountdown]);

    // Auto-logout when countdown reaches zero
    useEffect(() => {
        if (localCountdown === 0 && isOpen) {
            onLogout();
        }
    }, [localCountdown, isOpen, onLogout]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPin('');
            setIsVerifying(false);
            setError(null);
            // Auto-focus PIN input after a short delay
            setTimeout(() => {
                pinInputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Handle extend session with PIN
    const handleExtend = useCallback(async (pinCode: string) => {
        if (pinCode.length < 4) return;

        setIsVerifying(true);
        setError(null);

        try {
            const success = await onExtend(pinCode);
            if (success) {
                setPin('');
                // Modal will close automatically when remainingSeconds is updated
            } else {
                setError(language === 'ar' ? 'رمز PIN غير صحيح' : 'Invalid PIN');
                setPin('');
                pinInputRef.current?.shake();
            }
        } catch (err) {
            setError(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
            setPin('');
            pinInputRef.current?.shake();
        } finally {
            setIsVerifying(false);
        }
    }, [onExtend, language]);

    // Format time as MM:SS
    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Calculate progress for circular indicator
    const progress = useMemo(() => {
        return Math.max(0, localCountdown / warningSeconds);
    }, [localCountdown, warningSeconds]);

    // Determine if we're in critical time (less than 30 seconds)
    const isCritical = localCountdown < 30;
    const isLocked = lockoutRemaining > 0;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    data-theme={theme}
                    className={cn(
                        'relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden',
                        'bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                        'data-[theme=luxury]:bg-slate-950/95 data-[theme=luxury]:border-amber-800/30',
                    )}
                >
                    {/* Header */}
                    <div className={cn(
                        'p-6 border-b text-center',
                        'border-slate-700/50',
                        'data-[theme=light]:border-slate-200',
                    )} data-theme={theme}>
                        {/* Circular Progress Timer */}
                        <div className="relative w-24 h-24 mx-auto mb-4">
                            {/* SVG Progress Ring */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* Background circle */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke={theme === 'light' ? 'rgb(226, 232, 240)' : 'rgb(51, 65, 85)'}
                                    strokeWidth="8"
                                />
                                {/* Progress circle */}
                                <motion.circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke={isCritical
                                        ? 'rgb(248, 113, 113)' // red-400
                                        : theme === 'luxury'
                                            ? 'rgb(251, 191, 36)' // amber-400
                                            : 'rgb(34, 211, 238)' // cyan-400
                                    }
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={283} // 2 * PI * 45
                                    strokeDashoffset={283 * (1 - progress)}
                                    animate={{ strokeDashoffset: 283 * (1 - progress) }}
                                    transition={{ duration: 1, ease: 'linear' }}
                                />
                            </svg>

                            {/* Icon and Time in center */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                {isLocked ? (
                                    <Shield className={cn(
                                        'w-8 h-8',
                                        isCritical ? 'text-red-400' : 'text-amber-400',
                                    )} />
                                ) : (
                                    <Clock className={cn(
                                        'w-8 h-8',
                                        isCritical ? 'text-red-400' : theme === 'luxury' ? 'text-amber-400' : 'text-cyan-400',
                                    )} />
                                )}
                                <span className={cn(
                                    'text-lg font-bold mt-1',
                                    isCritical ? 'text-red-400' : theme === 'luxury' ? 'text-amber-400' : 'text-cyan-400',
                                )}>
                                    {formatTime(localCountdown)}
                                </span>
                            </div>
                        </div>

                        <h2 className={cn(
                            'text-xl font-bold mb-2',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )} data-theme={theme}>
                            {isLocked
                                ? (language === 'ar' ? 'الحساب مغلق' : 'Account Locked')
                                : (language === 'ar' ? 'جلستك تنتهي قريباً' : 'Session Expiring Soon')
                            }
                        </h2>

                        <p className={cn(
                            'text-sm',
                            'text-slate-400',
                            'data-[theme=light]:text-slate-500',
                        )} data-theme={theme}>
                            {isLocked
                                ? (language === 'ar'
                                    ? `حاول مرة أخرى في ${formatTime(lockoutRemaining)}`
                                    : `Try again in ${formatTime(lockoutRemaining)}`
                                )
                                : (language === 'ar'
                                    ? 'أدخل رمز PIN لتمديد جلستك'
                                    : 'Enter your PIN to extend your session'
                                )
                            }
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Message based on remaining time */}
                        {!isLocked && (
                            <div className={cn(
                                'p-4 rounded-xl text-center',
                                isCritical
                                    ? 'bg-red-500/20 border border-red-500/30'
                                    : 'bg-amber-500/20 border border-amber-500/30',
                            )}>
                                <p className={cn(
                                    'text-sm font-medium',
                                    isCritical ? 'text-red-400' : 'text-amber-400',
                                )}>
                                    {isCritical
                                        ? (language === 'ar'
                                            ? 'سينتهي وقتك قريباً جداً!'
                                            : 'Your time is running out!'
                                        )
                                        : (language === 'ar'
                                            ? 'سيتم تسجيل الخروج تلقائياً عند انتهاء الوقت'
                                            : 'You will be logged out automatically when time expires'
                                        )
                                    }
                                </p>
                            </div>
                        )}

                        {/* PIN Input */}
                        {!isLocked && (
                            <PinInput
                                ref={pinInputRef}
                                length={4}
                                value={pin}
                                onChange={setPin}
                                onSubmit={handleExtend}
                                error={error}
                                attempts={attempts}
                                maxAttempts={maxAttempts}
                                disabled={isVerifying || isCritical}
                                showAttempts={true}
                                label={language === 'ar' ? 'أدخل رمز PIN' : 'Enter PIN'}
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <div className={cn(
                        'p-4 border-t flex gap-2',
                        'border-slate-700/50',
                        'data-[theme=light]:border-slate-200',
                    )} data-theme={theme}>
                        <motion.button
                            whileHover={{ scale: isVerifying ? 1 : 1.02 }}
                            whileTap={{ scale: isVerifying ? 1 : 0.98 }}
                            onClick={onLogout}
                            disabled={isVerifying}
                            className={cn(
                                'flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2',
                                'bg-red-500/20 text-red-400 hover:bg-red-500/30',
                                'disabled:opacity-50',
                            )}
                        >
                            <LogOut className="w-5 h-5" />
                            <span>{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                        </motion.button>

                        {!isLocked && (
                            <motion.button
                                whileHover={{ scale: isVerifying || pin.length < 4 ? 1 : 1.02 }}
                                whileTap={{ scale: isVerifying || pin.length < 4 ? 1 : 0.98 }}
                                onClick={() => handleExtend(pin)}
                                disabled={isVerifying || pin.length < 4 || isCritical}
                                className={cn(
                                    'flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2',
                                    'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white',
                                    'hover:from-cyan-400 hover:to-cyan-500',
                                    'shadow-lg shadow-cyan-500/25',
                                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
                                    'data-[theme=luxury]:from-amber-500 data-[theme=luxury]:to-amber-600',
                                    'data-[theme=luxury]:shadow-amber-500/25',
                                )}
                                data-theme={theme}
                            >
                                {isVerifying ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                    />
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        <span>{language === 'ar' ? 'تمديد الجلسة' : 'Extend Session'}</span>
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default SessionTimeoutModal;
