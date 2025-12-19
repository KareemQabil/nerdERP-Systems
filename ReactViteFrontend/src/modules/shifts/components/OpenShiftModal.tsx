import { useState } from 'react';
import { Clock, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { useShiftStore } from '../store/shiftStore';

export interface OpenShiftModalProps {
    onShiftOpened: () => void;
}

/**
 * OpenShiftModal - MANDATORY NON-DISMISSIBLE
 * 
 * Forces user to open a shift before using POS.
 * Cannot be closed or skipped - enforces cash control procedures.
 * 
 * Features:
 * - No close button (X disabled)
 * - No backdrop dismiss
 * - Shake animation on backdrop click
 * - Quick amount buttons
 * - Input validation (≥ 0)
 */
export function OpenShiftModal({ onShiftOpened }: OpenShiftModalProps) {
    const { openShift } = useShiftStore();
    const [startingCash, setStartingCash] = useState('0.00');
    const [shake, setShake] = useState(false);

    const handleBackdropClick = () => {
        // Shake animation - cannot dismiss!
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleQuickAmount = (amount: number) => {
        setStartingCash(amount.toFixed(2));
    };

    const handleStartShift = () => {
        const amount = parseFloat(startingCash);

        if (isNaN(amount) || amount < 0) {
            alert('Please enter a valid amount');
            return;
        }

        // Convert to decimal string with 3 decimals
        const amountStr = amount.toFixed(3);

        // Open shift (cashier name can be from auth context in production)
        openShift('Cashier', amountStr);

        // Callback to parent
        onShiftOpened();
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{
                    scale: shake ? [1, 1.05, 0.95, 1.02, 1] : 1,
                    opacity: 1
                }}
                transition={{
                    scale: { duration: 0.5 },
                    opacity: { duration: 0.3 }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white font-['Almarai']">
                                فتح وردية
                            </h2>
                            <p className="text-sm text-gray-400 font-['Almarai']">
                                Open Shift
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Info Message */}
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm text-blue-200 font-['Almarai']">
                            أدخل المبلغ النقدي الموجود في الدرج عند بداية الوردية
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Enter the starting cash amount in the drawer
                        </p>
                    </div>

                    {/* Input Field */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2 font-['Almarai']">
                            المبلغ الافتتاحي
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <DollarSign className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                                type="number"
                                value={startingCash}
                                onChange={(e) => setStartingCash(e.target.value)}
                                step="0.01"
                                min="0"
                                className="w-full h-14 pl-12 pr-20 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 text-white text-lg font-mono transition-all"
                                placeholder="0.00"
                                autoFocus
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                <span className="text-gray-400 font-['Arial']">SAR</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {[0, 100, 500, 1000].map((amount) => (
                            <button
                                key={amount}
                                onClick={() => handleQuickAmount(amount)}
                                className="h-12 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/30 text-white font-mono transition-all"
                            >
                                {amount}
                            </button>
                        ))}
                    </div>

                    {/* Warning */}
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-200 font-['Almarai']">
                            ⚠️ يجب فتح الوردية للمتابعة إلى نظام نقطة البيع
                        </p>
                    </div>

                    {/* Start Shift Button */}
                    <button
                        onClick={handleStartShift}
                        className="w-full h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-['Almarai'] font-bold text-lg shadow-lg shadow-cyan-500/20 transition-all"
                    >
                        بدء الوردية
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
