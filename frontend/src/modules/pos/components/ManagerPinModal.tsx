import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, AlertCircle, Check, Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import type { VoidReason, PinAuthorizationRequest } from '@/types/pos.types';

interface ManagerPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthorize: (pin: string, reason?: VoidReason | string) => Promise<boolean>;
    request: PinAuthorizationRequest;
}

const VOID_REASONS: { value: VoidReason; labelEn: string; labelAr: string }[] = [
    { value: 'CUSTOMER_CHANGED_MIND', labelEn: 'Customer Changed Mind', labelAr: 'تغير رأي العميل' },
    { value: 'WRONG_ITEM', labelEn: 'Wrong Item Ordered', labelAr: 'طلب خاطئ' },
    { value: 'QUALITY_ISSUE', labelEn: 'Quality Issue', labelAr: 'مشكلة في الجودة' },
    { value: 'DUPLICATE_ORDER', labelEn: 'Duplicate Order', labelAr: 'طلب مكرر' },
    { value: 'OUT_OF_STOCK', labelEn: 'Out of Stock', labelAr: 'نفذ من المخزون' },
    { value: 'OTHER', labelEn: 'Other', labelAr: 'أخرى' },
];

/**
 * Manager PIN Authorization Modal
 * Glassmorphic modal with numeric keypad for manager authorization
 */
export function ManagerPinModal({ isOpen, onClose, onAuthorize, request }: ManagerPinModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();

    const [pin, setPin] = useState<string[]>(['', '', '', '']);
    const [reason, setReason] = useState<VoidReason | string>('CUSTOMER_CHANGED_MIND');
    const [currentDigit, setCurrentDigit] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attempts, setAttempts] = useState(0);

    const MAX_ATTEMPTS = 3;

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPin(['', '', '', '']);
            setCurrentDigit(0);
            setIsVerifying(false);
            setError(null);
        }
    }, [isOpen]);

    // Handle digit input
    const handleDigit = useCallback((digit: string) => {
        if (currentDigit >= 4) return;

        const newPin = [...pin];
        newPin[currentDigit] = digit;
        setPin(newPin);
        setCurrentDigit((prev) => Math.min(prev + 1, 4));
        setError(null);
    }, [currentDigit, pin]);

    // Handle backspace
    const handleBackspace = useCallback(() => {
        if (currentDigit === 0) return;

        const newPin = [...pin];
        newPin[currentDigit - 1] = '';
        setPin(newPin);
        setCurrentDigit((prev) => prev - 1);
        setError(null);
    }, [currentDigit, pin]);

    // Handle clear
    const handleClear = useCallback(() => {
        setPin(['', '', '', '']);
        setCurrentDigit(0);
        setError(null);
    }, []);

    // Handle submit
    const handleSubmit = useCallback(async () => {
        const pinString = pin.join('');
        if (pinString.length !== 4) {
            setError(language === 'ar' ? 'أدخل 4 أرقام' : 'Enter 4 digits');
            return;
        }

        setIsVerifying(true);
        setError(null);

        try {
            const success = await onAuthorize(pinString, reason);
            if (success) {
                onClose();
            } else {
                setAttempts((prev) => prev + 1);
                if (attempts + 1 >= MAX_ATTEMPTS) {
                    setError(language === 'ar' ? 'تم تجاوز الحد الأقصى للمحاولات' : 'Max attempts exceeded');
                } else {
                    setError(language === 'ar' ? 'رمز PIN غير صحيح' : 'Invalid PIN');
                    handleClear();
                }
            }
        } catch (err) {
            setError(language === 'ar' ? 'حدث خطأ' : 'An error occurred');
        } finally {
            setIsVerifying(false);
        }
    }, [pin, reason, onAuthorize, onClose, language, attempts, handleClear]);

    // Auto-submit when 4 digits entered
    useEffect(() => {
        if (currentDigit === 4 && !isVerifying) {
            handleSubmit();
        }
    }, [currentDigit, isVerifying, handleSubmit]);

    if (!isOpen) return null;

    const actionLabel = {
        VOID_ITEM: language === 'ar' ? 'حذف عنصر' : 'Void Item',
        APPLY_DISCOUNT: language === 'ar' ? 'تطبيق خصم' : 'Apply Discount',
        PRICE_OVERRIDE: language === 'ar' ? 'تعديل السعر' : 'Price Override',
        REFUND: language === 'ar' ? 'استرداد' : 'Refund',
        OPEN_DRAWER: language === 'ar' ? 'فتح الدرج' : 'Open Drawer',
        DELETE_ORDER: language === 'ar' ? 'حذف الطلب' : 'Delete Order',
    }[request.action] || request.action;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    data-theme={theme}
                    className={cn(
                        'relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden',
                        'bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                        'data-[theme=luxury]:bg-slate-950/95 data-[theme=luxury]:border-amber-800/30',
                    )}
                >
                    {/* Header */}
                    <div className={cn(
                        'p-4 border-b text-center',
                        'border-slate-700/50',
                        'data-[theme=light]:border-slate-200',
                    )} data-theme={theme}>
                        <div className={cn(
                            'w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center',
                            'bg-gradient-to-br from-cyan-500 to-cyan-600',
                            'data-[theme=luxury]:from-amber-500 data-[theme=luxury]:to-amber-600',
                        )} data-theme={theme}>
                            <Lock className="w-7 h-7 text-white" />
                        </div>
                        <h2 className={cn(
                            'text-lg font-bold',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )} data-theme={theme}>
                            {t('pin.title', 'Manager Authorization')}
                        </h2>
                        <p className={cn(
                            'text-sm mt-1',
                            'text-slate-400',
                            'data-[theme=light]:text-slate-500',
                        )} data-theme={theme}>
                            {actionLabel}
                            {request.itemName && ` - ${request.itemName}`}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Reason Selector (for void actions) */}
                        {request.action === 'VOID_ITEM' && (
                            <div className="space-y-2">
                                <label className={cn(
                                    'text-sm font-medium',
                                    'text-slate-300',
                                    'data-[theme=light]:text-slate-700',
                                )} data-theme={theme}>
                                    {t('pin.reason', 'Reason')}
                                </label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value as VoidReason)}
                                    className={cn(
                                        'w-full px-3 py-2 rounded-lg border',
                                        'bg-slate-800 border-slate-700 text-white',
                                        'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                                        'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                        'data-[theme=light]:text-slate-900',
                                    )}
                                    data-theme={theme}
                                >
                                    {VOID_REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {language === 'ar' ? r.labelAr : r.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* PIN Display */}
                        <div className="flex justify-center gap-3">
                            {pin.map((digit, index) => (
                                <motion.div
                                    key={index}
                                    animate={{
                                        scale: index === currentDigit ? 1.1 : 1,
                                        borderColor: index === currentDigit
                                            ? 'rgb(34, 211, 238)' // cyan-400
                                            : 'rgb(71, 85, 105)', // slate-600
                                    }}
                                    className={cn(
                                        'w-12 h-14 rounded-xl border-2 flex items-center justify-center',
                                        'bg-slate-800',
                                        'data-[theme=light]:bg-slate-100',
                                    )}
                                    data-theme={theme}
                                >
                                    {digit ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className={cn(
                                                'w-4 h-4 rounded-full',
                                                'bg-cyan-400',
                                                'data-[theme=luxury]:bg-amber-400',
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
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-center gap-2 text-red-400"
                            >
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{error}</span>
                            </motion.div>
                        )}

                        {/* Attempts Counter */}
                        {attempts > 0 && (
                            <p className="text-center text-xs text-slate-500">
                                {MAX_ATTEMPTS - attempts} {language === 'ar' ? 'محاولات متبقية' : 'attempts remaining'}
                            </p>
                        )}

                        {/* Numeric Keypad */}
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <motion.button
                                    key={num}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDigit(String(num))}
                                    disabled={isVerifying || attempts >= MAX_ATTEMPTS}
                                    className={cn(
                                        'h-14 rounded-xl font-bold text-xl transition-colors',
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
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClear}
                                disabled={isVerifying}
                                className={cn(
                                    'h-14 rounded-xl font-bold transition-colors',
                                    'bg-red-500/20 text-red-400 hover:bg-red-500/30',
                                    'disabled:opacity-50',
                                )}
                            >
                                <X className="w-5 h-5 mx-auto" />
                            </motion.button>

                            {/* Zero */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDigit('0')}
                                disabled={isVerifying || attempts >= MAX_ATTEMPTS}
                                className={cn(
                                    'h-14 rounded-xl font-bold text-xl transition-colors',
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
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBackspace}
                                disabled={isVerifying}
                                className={cn(
                                    'h-14 rounded-xl font-bold transition-colors',
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
                    </div>

                    {/* Footer */}
                    <div className={cn(
                        'p-4 border-t flex gap-2',
                        'border-slate-700/50',
                        'data-[theme=light]:border-slate-200',
                    )} data-theme={theme}>
                        <button
                            onClick={onClose}
                            className={cn(
                                'flex-1 py-3 rounded-xl font-semibold transition-colors',
                                'bg-slate-700 text-slate-300 hover:bg-slate-600',
                                'data-[theme=light]:bg-slate-100 data-[theme=light]:text-slate-600',
                                'data-[theme=light]:hover:bg-slate-200',
                            )}
                            data-theme={theme}
                        >
                            {t('cancel', 'Cancel')}
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={currentDigit < 4 || isVerifying || attempts >= MAX_ATTEMPTS}
                            className={cn(
                                'flex-1 py-3 rounded-xl font-semibold transition-colors',
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
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
                                />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Check className="w-5 h-5" />
                                    {t('authorize', 'Authorize')}
                                </span>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ManagerPinModal;
