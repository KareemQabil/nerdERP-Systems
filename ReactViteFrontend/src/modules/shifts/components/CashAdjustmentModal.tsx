import { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CashAdjustmentModalProps {
    type: 'PAY_IN' | 'PAY_OUT';
    onConfirm: (amount: string, reason: string) => void;
    onClose: () => void;
}

/**
 * CashAdjustmentModal - Mini modal for Pay In/Out
 * Simple form with amount + reason inputs
 */
export function CashAdjustmentModal({ type, onConfirm, onClose }: CashAdjustmentModalProps) {
    const [amount, setAmount] = useState('0.00');
    const [reason, setReason] = useState('');

    const handleConfirm = () => {
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!reason.trim()) {
            alert('Please enter a reason');
            return;
        }

        onConfirm(amt.toFixed(3), reason.trim());
    };

    const isPayIn = type === 'PAY_IN';

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold font-['Almarai'] ${isPayIn ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPayIn ? 'إضافة نقدية' : 'سحب نقدية'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <p className="text-sm text-gray-400">
                    {isPayIn ? 'Pay In (Add cash to drawer)' : 'Pay Out (Remove cash from drawer)'}
                </p>

                {/* Amount Input */}
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 font-['Almarai']">
                        المبلغ
                    </label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            className="w-full h-12 pl-10 pr-16 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 text-white font-mono text-lg"
                            placeholder="0.00"
                            autoFocus
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">SAR</span>
                    </div>
                </div>

                {/* Reason Input */}
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2 font-['Almarai']">
                        السبب
                    </label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 text-white"
                        placeholder={isPayIn ? 'e.g., Extra change from bank' : 'e.g., Office supplies'}
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white font-['Almarai'] font-bold transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 h-11 rounded-xl text-white font-['Almarai'] font-bold transition-all ${isPayIn
                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600'
                                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600'
                            }`}
                    >
                        تأكيد
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
