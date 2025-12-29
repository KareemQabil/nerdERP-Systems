/**
 * Close Session Modal - Cashier View
 * 
 * BUSINESS LOGIC:
 * - Cashier counts cash in drawer
 * - Enters total amount
 * - Closes session WITHOUT seeing expected or discrepancy
 * - Discrepancy is recorded for manager EOD review
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut, X, AlertCircle, Calculator, Loader2, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import Decimal from 'decimal.js';

interface CloseSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (closingBalance: number, notes?: string) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
    /** Opening balance from session start - shown for reference */
    openingBalance: number;
}

const DENOMINATION_BUTTONS = [500, 200, 100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05];

/**
 * Close Session Modal
 * Cashier counts drawer and submits - NO expected/discrepancy shown
 */
export function CloseSessionModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    error,
    openingBalance,
}: CloseSessionModalProps) {
    const { t } = useTranslation('pos');

    // State
    const [countedAmount, setCountedAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCountedAmount('');
            setNotes('');
            setShowSuccess(false);
        }
    }, [isOpen]);

    const handleKeypadInput = (value: string) => {
        if (value === 'clear') {
            setCountedAmount('');
        } else if (value === 'backspace') {
            setCountedAmount((prev) => prev.slice(0, -1));
        } else if (value === '.') {
            if (!countedAmount.includes('.')) {
                setCountedAmount((prev) => prev + '.');
            }
        } else {
            setCountedAmount((prev) => prev + value);
        }
    };

    const handleDenominationAdd = (value: number) => {
        const current = new Decimal(countedAmount || 0);
        const newAmount = current.plus(value);
        setCountedAmount(newAmount.toFixed(2));
    };

    const handleConfirm = async () => {
        if (!countedAmount) return;

        const balance = parseFloat(countedAmount) || 0;
        setIsSubmitting(true);
        try {
            await onConfirm(balance, notes || undefined);
            setShowSuccess(true);
            // Modal will be closed by parent after successful close
        } catch (err) {
            // Error will be shown in error prop
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-xl bg-gradient-to-b from-[#1a1c1e] to-[#2a2f35] rounded-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/20">
                                <LogOut className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    {t('session.closeSession', 'إغلاق الوردية')}
                                </h2>
                                <p className="text-sm text-white/60">
                                    {t('session.countAndClose', 'عدّ النقد ثم أغلق الوردية')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Opening Balance Reference */}
                        <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Calculator className="w-5 h-5 text-cyan-400" />
                                <span className="text-white/60">
                                    {t('session.openingWas', 'كان رصيد الفتح')}
                                </span>
                            </div>
                            <span className="text-white font-mono font-semibold">
                                {openingBalance.toFixed(2)} SAR
                            </span>
                        </div>

                        {/* Counted Amount Display */}
                        <div className="bg-white/5 rounded-xl p-6 text-center">
                            <p className="text-sm text-white/60 mb-2">
                                {t('session.totalInDrawer', 'المبلغ الموجود في الدرج')}
                            </p>
                            <p className="text-4xl font-bold text-white font-mono">
                                {countedAmount || '0.00'}
                                <span className="text-xl text-white/60 mr-2">SAR</span>
                            </p>
                        </div>

                        {/* Quick Denomination Buttons */}
                        <div className="grid grid-cols-6 gap-2">
                            {DENOMINATION_BUTTONS.map((value) => (
                                <button
                                    key={value}
                                    onClick={() => handleDenominationAdd(value)}
                                    className="py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 text-sm font-medium transition-colors"
                                >
                                    +{value}
                                </button>
                            ))}
                        </div>

                        {/* Numeric Keypad */}
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '←'].map((key) => (
                                <button
                                    key={key}
                                    onClick={() =>
                                        handleKeypadInput(
                                            key === '←' ? 'backspace' : key.toString()
                                        )
                                    }
                                    className="py-3 text-xl font-medium text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    {key}
                                </button>
                            ))}
                        </div>

                        {/* Clear Button */}
                        <button
                            onClick={() => handleKeypadInput('clear')}
                            className="w-full py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            {t('common.clear', 'مسح')}
                        </button>

                        {/* Optional Notes */}
                        <div>
                            <label className="block text-sm text-white/60 mb-2">
                                {t('session.notes', 'ملاحظات')} ({t('common.optional', 'اختياري')})
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t('session.notesPlaceholder', 'أي ملاحظات عن الوردية...')}
                                className={cn(
                                    "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30",
                                    "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
                                )}
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mx-6 mb-4 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {showSuccess && (
                        <div className="mx-6 mb-4 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <p className="text-sm text-green-300">
                                {t('session.closedSuccess', 'تم إغلاق الوردية بنجاح')}
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/10 flex justify-between">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading || isSubmitting}
                        >
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isLoading || isSubmitting || !countedAmount}
                            className="bg-red-600 hover:bg-red-700 text-white gap-2"
                        >
                            {isLoading || isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('session.closing', 'جاري الإغلاق...')}
                                </>
                            ) : (
                                <>
                                    <LogOut className="w-4 h-4" />
                                    {t('session.close', 'إغلاق الوردية')}
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
