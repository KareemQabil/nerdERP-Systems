/**
 * Close Session Modal
 * Modal for closing a cash register session with actual balance count
 * Shows discrepancy between expected and actual balance
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StopCircle, X, AlertCircle, Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import Decimal from 'decimal.js';

interface CloseSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (closingBalance: number, notes?: string) => Promise<void>;
    expectedBalance?: number; // Made optional for blind close
    isBlindClose?: boolean;   // Hide expected balance from cashier
    isLoading?: boolean;
    error?: string | null;
}

/**
 * Close Session Modal Component
 */
export function CloseSessionModal({
    isOpen,
    onClose,
    onConfirm,
    expectedBalance = 0,
    isBlindClose = false,
    isLoading = false,
    error,
}: CloseSessionModalProps) {
    const { t } = useTranslation('pos');
    const [actualBalance, setActualBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate discrepancy (only when not blind close)
    const discrepancy = !isBlindClose && actualBalance
        ? new Decimal(actualBalance).minus(expectedBalance).toNumber()
        : 0;
    const hasDiscrepancy = !isBlindClose && Math.abs(discrepancy) > 0.01; // Allow 1 cent tolerance

    const handleSubmit = async () => {
        const balance = parseFloat(actualBalance) || 0;

        if (balance < 0) {
            return; // Validation: no negative amounts
        }

        // Require notes if there's a large discrepancy (when not blind close)
        // For blind close, notes are always recommended
        if (!isBlindClose && Math.abs(discrepancy) > 5 && !notes.trim()) {
            return; // Validation failed - need notes for large discrepancy
        }

        setIsSubmitting(true);
        try {
            await onConfirm(balance, notes || undefined);
            // Reset form on success
            setActualBalance('');
            setNotes('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers and decimal point
        const value = e.target.value.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        if ((value.match(/\./g) || []).length <= 1) {
            setActualBalance(value);
        }
    };

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setActualBalance('');
            setNotes('');
        }
    }, [isOpen]);

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
                    className="w-full max-w-md bg-gradient-to-b from-[#1a1c1e] to-[#2a2f35] rounded-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <StopCircle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {t('session.closeSession', 'Close Session')}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {t('session.countCash', 'Count cash and close register')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                            disabled={isLoading || isSubmitting}
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5">
                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span className="text-sm text-red-300">{error}</span>
                            </div>
                        )}

                        {/* Expected Balance (Read-only) - Hidden in blind close mode */}
                        {!isBlindClose && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">
                                    {t('session.expectedBalance', 'Expected Balance')} (SAR)
                                </label>
                                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Coins className="w-5 h-5 text-gray-400" />
                                        <span className="text-2xl font-bold text-gray-300">
                                            {expectedBalance.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Blind Close Notice */}
                        {isBlindClose && (
                            <div className="flex items-center gap-3 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                                <Coins className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-blue-300">
                                        {t('session.blindCloseMode', 'Blind Close Mode')}
                                    </p>
                                    <p className="text-xs text-blue-400/80">
                                        {t('session.blindCloseHint', 'Count all cash in the drawer. Expected balance will be verified by manager.')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Actual Balance Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">
                                {t('session.actualBalance', 'Actual Balance')} (SAR) *
                            </label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={actualBalance}
                                onChange={handleAmountChange}
                                placeholder="0.00"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-2xl font-bold text-right focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                disabled={isLoading || isSubmitting}
                                autoFocus
                            />
                            <p className="text-xs text-gray-500">
                                {t('session.countHint', 'Count all cash in the drawer')}
                            </p>
                        </div>

                        {/* Discrepancy Warning - Hidden in blind close mode */}
                        {!isBlindClose && actualBalance && hasDiscrepancy && (
                            <div className={`flex items-center gap-3 p-3 rounded-lg border ${discrepancy > 0
                                ? 'bg-green-500/20 border-green-500/30'
                                : 'bg-red-500/20 border-red-500/30'
                                }`}>
                                {discrepancy > 0 ? (
                                    <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0" />
                                ) : (
                                    <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${discrepancy > 0 ? 'text-green-300' : 'text-red-300'
                                        }`}>
                                        {discrepancy > 0 ? t('session.cashOver', 'Cash Over') : t('session.cashShort', 'Cash Short')}
                                    </p>
                                    <p className={`text-lg font-bold ${discrepancy > 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {Math.abs(discrepancy).toFixed(2)} SAR
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Notes (Required if large discrepancy) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex justify-between">
                                <span>{t('session.notes', 'Notes')}</span>
                                {Math.abs(discrepancy) > 5 && (
                                    <span className="text-red-400 text-xs">{t('session.notesRequired', 'Required for large discrepancy')}</span>
                                )}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={t('session.notesPlaceholder', 'Explain any discrepancy...')}
                                rows={3}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                disabled={isLoading || isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/10 flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isLoading || isSubmitting}
                        >
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600"
                            disabled={
                                isLoading ||
                                isSubmitting ||
                                !actualBalance ||
                                (!isBlindClose && Math.abs(discrepancy) > 5 && !notes.trim())
                            }
                        >
                            {isLoading || isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    {t('common.loading', 'Closing...')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <StopCircle className="w-4 h-4" />
                                    {t('session.endShift', 'End Shift')}
                                </span>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
