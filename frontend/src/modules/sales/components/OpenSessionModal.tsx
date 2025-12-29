/**
 * Open Session Modal
 * Prompts cashier to enter opening float before starting sales
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, PlayCircle, X, AlertCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

interface OpenSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (openingBalance: number) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
    /** When true, modal cannot be closed - user MUST open a session */
    required?: boolean;
}

const QUICK_AMOUNTS = [0, 100, 200, 500, 1000];

/**
 * Open Session Modal
 * Shown when POS needs to open a new cash register session
 * When required=true, user cannot dismiss the modal - enforces strict workflow
 */
export function OpenSessionModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    error,
    required = false,
}: OpenSessionModalProps) {
    const { t } = useTranslation('pos');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleQuickAmount = (value: number) => {
        setAmount(value.toString());
    };

    const handleSubmit = async () => {
        const balance = parseFloat(amount) || 0;
        setIsSubmitting(true);
        try {
            await onConfirm(balance);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeypadInput = (value: string) => {
        if (value === 'clear') {
            setAmount('');
        } else if (value === 'backspace') {
            setAmount((prev) => prev.slice(0, -1));
        } else if (value === '.') {
            if (!amount.includes('.')) {
                setAmount((prev) => prev + '.');
            }
        } else {
            setAmount((prev) => prev + value);
        }
    };

    // Handle backdrop click - only closeable if not required
    const handleBackdropClick = () => {
        if (!required) {
            onClose();
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
                onClick={handleBackdropClick}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-md bg-gradient-to-b from-[#1a1c1e] to-[#2a2f35] rounded-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                required ? "bg-amber-500/20" : "bg-cyan-500/20"
                            )}>
                                {required ? (
                                    <Lock className="w-5 h-5 text-amber-400" />
                                ) : (
                                    <PlayCircle className="w-5 h-5 text-cyan-400" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {t('session.openSession', 'Open Session')}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {required
                                        ? t('session.sessionRequired', 'A session is required to use POS')
                                        : t('session.enterFloat', 'Enter opening float')
                                    }
                                </p>
                            </div>
                        </div>
                        {/* Only show X button if not required */}
                        {!required && (
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Required Session Warning */}
                        {required && (
                            <div className="flex items-center gap-3 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                <span className="text-sm text-amber-300">
                                    {t('session.mustOpenSession', 'You must open a session before using the POS')}
                                </span>
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <span className="text-sm text-red-300">{error}</span>
                            </div>
                        )}

                        {/* Amount Display */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">
                                    {t('session.openingBalance', 'Opening Balance')}
                                </span>
                                <span className="text-sm text-gray-500">SAR</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <DollarSign className="w-6 h-6 text-cyan-400" />
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                    placeholder="0.00"
                                    className="flex-1 text-3xl font-bold text-white bg-transparent border-none outline-none text-right"
                                />
                            </div>
                        </div>

                        {/* Quick Amounts */}
                        <div className="grid grid-cols-5 gap-2">
                            {QUICK_AMOUNTS.map((value) => (
                                <button
                                    key={value}
                                    onClick={() => handleQuickAmount(value)}
                                    className={cn(
                                        'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                                        amount === value.toString()
                                            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                                            : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                                    )}
                                >
                                    {value === 0 ? t('session.noFloat', 'No Float') : value}
                                </button>
                            ))}
                        </div>

                        {/* Keypad */}
                        <div className="grid grid-cols-3 gap-2">
                            {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'backspace'].map((key) => (
                                <button
                                    key={key}
                                    onClick={() => handleKeypadInput(key)}
                                    className="h-12 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center"
                                >
                                    {key === 'backspace' ? '⌫' : key}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/10 flex gap-3">
                        {/* Only show Cancel button if not required */}
                        {!required && (
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="flex-1"
                                disabled={isLoading || isSubmitting}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            className={cn(
                                "bg-gradient-to-r from-cyan-500 to-cyan-600",
                                required ? "flex-1" : "flex-1"
                            )}
                            disabled={isLoading || isSubmitting}
                        >
                            {isLoading || isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    {t('common.loading', 'Loading...')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <PlayCircle className="w-4 h-4" />
                                    {t('session.startShift', 'Start Shift')}
                                </span>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
