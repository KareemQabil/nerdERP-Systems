import { useState } from 'react';
import { X, CreditCard, Banknote, ArrowLeftRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Decimal from 'decimal.js';
import { useShiftStore } from '@/modules/shifts/store/shiftStore';
import type { PaymentMethod } from '@/modules/sales/types/pos.types';

export interface PaymentModalProps {
    total: string;
    onConfirm: (paymentMethod: PaymentMethod, cashTendered?: string) => void;
    onClose: () => void;
}

/**
 * PaymentModal Component (PHASE 4: Integrated with Shift)
 * High-focus modal for processing payments
 * 
 * Features:
 * - Payment method selection (Cash, Card, Transfer)
 * - Cash input with numeric keypad
 * - Real-time change calculation
 * - Validation (tendered >= total)
 * - Heavy blur overlay for focus
 * - Shift transaction recording
 * - Max height constraint (max-h-[90vh])
 */
export function PaymentModal({ total, onConfirm, onClose }: PaymentModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
    const [cashTendered, setCashTendered] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { addTransaction } = useShiftStore();

    const totalDecimal = new Decimal(total);
    const tenderedDecimal = cashTendered ? new Decimal(cashTendered) : new Decimal(0);
    const change = tenderedDecimal.minus(totalDecimal);
    const isValidPayment = selectedMethod !== 'cash' || change.greaterThanOrEqualTo(0);

    const handleNumberPad = (value: string) => {
        if (value === 'C') {
            setCashTendered('');
        } else if (value === '←') {
            setCashTendered(prev => prev.slice(0, -1));
        } else {
            setCashTendered(prev => prev + value);
        }
    };

    const handleConfirm = () => {
        if (!isValidPayment) return;

        setIsProcessing(true);

        // Record transaction in shift
        addTransaction(total, selectedMethod === 'cash' ? 'CASH' : 'CARD');

        setTimeout(() => {
            onConfirm(selectedMethod, selectedMethod === 'cash' ? cashTendered : undefined);
        }, 500);
    };

    const paymentMethods = [
        { id: 'cash' as PaymentMethod, icon: Banknote, label: 'نقدي', labelEn: 'Cash', color: 'emerald' },
        { id: 'card' as PaymentMethod, icon: CreditCard, label: 'بطاقة', labelEn: 'Card', color: 'blue' },
        { id: 'transfer' as PaymentMethod, icon: ArrowLeftRight, label: 'تحويل', labelEn: 'Transfer', color: 'purple' },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Heavy Blur Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    onClick={!isProcessing ? onClose : undefined}
                />

                {/* Modal Container - MAX HEIGHT CONSTRAINT */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Close Button */}
                    {!isProcessing && (
                        <button
                            onClick={onClose}
                            className="absolute top-6 left-6 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"
                        >
                            <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </button>
                    )}

                    {/* Header: Total Amount */}
                    <div className="p-8 text-center border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                        <p className="text-sm text-gray-400 font-['Almarai'] mb-2">المبلغ المستحق</p>
                        <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 font-mono">
                            {parseFloat(total).toFixed(2)}
                        </h2>
                        <p className="text-sm text-amber-400/70 mt-1 uppercase tracking-wider">SAR</p>
                    </div>

                    {/* Body - SCROLLABLE */}
                    <div className="p-8 space-y-6 overflow-y-auto flex-1">
                        {/* ⚡ QUICK CASH BUTTON - One-click exact amount */}
                        <button
                            onClick={() => {
                                setIsProcessing(true);
                                addTransaction(total, 'CASH');
                                setTimeout(() => {
                                    onConfirm('cash', total); // Exact cash
                                }, 300);
                            }}
                            className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border-2 border-emerald-400/50 text-white font-bold text-lg transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] flex items-center justify-center gap-3"
                        >
                            <span className="text-2xl">⚡</span>
                            <div className="text-right">
                                <p className="font-['Almarai']">دفع نقدي سريع</p>
                                <p className="text-sm text-emerald-200">Quick Cash (Exact Amount)</p>
                            </div>
                        </button>

                        <div className="flex items-center gap-3 text-gray-400 text-sm">
                            <div className="flex-1 h-px bg-white/10" />
                            <span>أو اختر طريقة دفع</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Payment Methods Grid */}
                        <div>
                            <label className="text-sm font-bold text-white font-['Almarai'] mb-3 block">
                                طريقة الدفع
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {paymentMethods.map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = selectedMethod === method.id;

                                    return (
                                        <motion.button
                                            key={method.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedMethod(method.id)}
                                            disabled={isProcessing}
                                            className={cn(
                                                'relative p-6 rounded-2xl border-2 transition-all duration-300',
                                                isSelected
                                                    ? 'bg-emerald-500/20 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                            )}
                                        >
                                            <Icon className={cn(
                                                'w-8 h-8 mx-auto mb-2',
                                                isSelected ? 'text-emerald-400' : 'text-gray-400'
                                            )} />
                                            <p className={cn(
                                                'text-sm font-bold font-[\'Almarai\']',
                                                isSelected ? 'text-emerald-400' : 'text-gray-400'
                                            )}>
                                                {method.label}
                                            </p>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cash Input (Conditional) */}
                        {selectedMethod === 'cash' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4"
                            >
                                {/* Tendered Amount Display */}
                                <div className="bg-black/40 rounded-2xl p-6 border border-white/10">
                                    <p className="text-xs text-gray-400 font-['Almarai'] mb-2">المبلغ المستلم</p>
                                    <div className="text-4xl font-bold text-white font-mono h-12 flex items-center">
                                        {cashTendered || '0.00'}
                                    </div>
                                </div>

                                {/* Change Display */}
                                <div className={cn(
                                    'rounded-2xl p-4 border-2 transition-all',
                                    change.greaterThanOrEqualTo(0)
                                        ? 'bg-emerald-500/10 border-emerald-400/30'
                                        : 'bg-red-500/10 border-red-400/30'
                                )}>
                                    <p className="text-xs font-['Almarai'] mb-1" style={{ color: change.greaterThanOrEqualTo(0) ? '#10b981' : '#ef4444' }}>
                                        {change.greaterThanOrEqualTo(0) ? 'الباقي' : 'غير كافٍ'}
                                    </p>
                                    <p className="text-2xl font-bold font-mono" style={{ color: change.greaterThanOrEqualTo(0) ? '#10b981' : '#ef4444' }}>
                                        {change.abs().toFixed(2)} SAR
                                    </p>
                                </div>

                                {/* Numeric Keypad */}
                                <div className="grid grid-cols-4 gap-2">
                                    {['1', '2', '3', 'C', '4', '5', '6', '←', '7', '8', '9', '.', '0', '00'].map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => handleNumberPad(key)}
                                            disabled={isProcessing}
                                            className="h-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-colors"
                                        >
                                            {key}
                                        </button>
                                    ))}
                                    {/* Quick Amount Buttons */}
                                    <button
                                        onClick={() => setCashTendered(total)}
                                        disabled={isProcessing}
                                        className="h-14 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-400 font-bold text-xs transition-colors"
                                    >
                                        مضبوط
                                    </button>
                                    <button
                                        onClick={() => setCashTendered((Math.ceil(parseFloat(total) / 10) * 10).toString())}
                                        disabled={isProcessing}
                                        className="h-14 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-400 font-bold text-xs transition-colors"
                                    >
                                        تقريب
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer: Actions */}
                    <div className="p-6 bg-gradient-to-t from-black/40 to-transparent border-t border-white/10 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold font-['Almarai'] transition-colors disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!isValidPayment || isProcessing}
                            className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-emerald-600/20 to-green-600/20 hover:from-emerald-600/30 hover:to-green-600/30 border border-emerald-400/30 text-emerald-400 font-bold font-['Almarai'] transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                    <span>جاري المعالجة...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    <span>تأكيد الدفع</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div >
            </div >
        </AnimatePresence >
    );
}
