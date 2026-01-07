/**
 * Open Session Modal
 * Simplified modal for opening a cash register session
 * Allows selecting user (Admin/Cashier) and entering opening balance
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, X, AlertCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

interface OpenSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (openingBalance: number, userId?: string) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
}

// Fixed user IDs matching backend seed data
const ADMIN_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const CASHIER_USER_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

const USERS = [
    { id: CASHIER_USER_ID, name: 'Cashier (Ahmed)', role: 'CASHIER' },
    { id: ADMIN_USER_ID, name: 'Admin User', role: 'ADMIN' },
];

/**
 * Open Session Modal Component
 */
export function OpenSessionModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    error,
}: OpenSessionModalProps) {
    const { t } = useTranslation('pos');
    const [amount, setAmount] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(CASHIER_USER_ID);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        const balance = parseFloat(amount) || 0;

        if (balance < 0) {
            return; // Validation: no negative amounts
        }

        setIsSubmitting(true);
        try {
            await onConfirm(balance, selectedUserId);
            // Reset form on success
            setAmount('');
            setSelectedUserId(CASHIER_USER_ID);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers and decimal point
        const value = e.target.value.replace(/[^0-9.]/g, '');
        // Prevent multiple decimal points
        if ((value.match(/\./g) || []).length <= 1) {
            setAmount(value);
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
            // No onClick - user cannot dismiss, session is required
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    data-testid="open-session-modal"
                    className="w-full max-w-md bg-gradient-to-b from-[#1a1c1e] to-[#2a2f35] rounded-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                <PlayCircle className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {t('session.openSession', 'Open Session')}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {t('session.enterFloat', 'Enter opening float and select cashier')}
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

                        {/* User Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {t('session.selectUser', 'Select Cashier')}
                            </label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                data-testid="user-select"
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                disabled={isLoading || isSubmitting}
                            >
                                {USERS.map((user) => (
                                    <option key={user.id} value={user.id} className="bg-[#2a2f35] text-white">
                                        {user.name} ({user.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Opening Balance Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">
                                {t('session.openingBalance', 'Opening Balance')} (SAR)
                            </label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0.00"
                                data-testid="opening-balance-input"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-2xl font-bold text-right focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                disabled={isLoading || isSubmitting}
                                autoFocus
                            />
                            <p className="text-xs text-gray-500">
                                {t('session.balanceHint', 'Enter the cash amount in the drawer')}
                            </p>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            {[0, 100, 500, 1000].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => setAmount(value.toString())}
                                    className="py-2 px-3 rounded-lg text-sm font-medium bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
                                    disabled={isLoading || isSubmitting}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer - No cancel button since session is required */}
                    <div className="px-6 py-4 border-t border-white/10">
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            data-testid="open-session-btn"
                            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600"
                            disabled={isLoading || isSubmitting}
                        >
                            {isLoading || isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin">⏳</span>
                                    {t('common.loading', 'Opening...')}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
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
