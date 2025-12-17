import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, Banknote } from 'lucide-react';
import type { CartItem, PaymentMethod } from '../types/pos.types';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    onPaymentComplete: (method: PaymentMethod, amount: number, change?: number) => void;
}

const PAYMENT_METHODS: {
    id: PaymentMethod;
    nameAr: string;
    nameEn: string;
    icon: React.ReactNode;
    gradient: string;
    requiresCashInput: boolean;
}[] = [
        {
            id: 'cash',
            nameAr: 'نقدي',
            nameEn: 'Cash',
            icon: <Banknote className="w-7 h-7" />,
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            requiresCashInput: true,
        },
        {
            id: 'mada',
            nameAr: 'مدى',
            nameEn: 'Mada',
            icon: <CreditCard className="w-7 h-7" />,
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            requiresCashInput: false,
        },
        {
            id: 'visa',
            nameAr: 'فيزا / ماستركارد',
            nameEn: 'Visa / Mastercard',
            icon: <CreditCard className="w-7 h-7" />,
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            requiresCashInput: false,
        },
    ];

const QUICK_CASH_AMOUNTS = [50, 100, 200, 500];

export function PaymentModal({
    isOpen,
    onClose,
    items,
    subtotal,
    tax,
    discount,
    total,
    onPaymentComplete,
}: PaymentModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [cashInput, setCashInput] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedMethod(null);
            setCashInput('');
            setIsProcessing(false);
            setPaymentSuccess(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const selectedMethodData = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
    const cashAmount = parseFloat(cashInput) || 0;
    const change = Math.max(0, cashAmount - total);
    const canPay = selectedMethod && (!selectedMethodData?.requiresCashInput || cashAmount >= total);

    const handleMethodSelect = (method: PaymentMethod) => {
        setSelectedMethod(method);
        const methodData = PAYMENT_METHODS.find((m) => m.id === method);

        if (!methodData?.requiresCashInput) {
            setCashInput(total.toFixed(2));
        } else {
            setCashInput('');
        }
    };

    const handlePayment = async () => {
        if (!canPay) return;

        setIsProcessing(true);
        await new Promise((resolve) => setTimeout(resolve, 1800));
        setIsProcessing(false);
        setPaymentSuccess(true);

        setTimeout(() => {
            onPaymentComplete(selectedMethod!, cashAmount, selectedMethodData?.requiresCashInput ? change : undefined);
            onClose();
        }, 1200);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-28" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-xl max-h-full bg-[var(--surface)] border border-[var(--outline-variant)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--outline-variant)] flex-shrink-0">
                        <div>
                            <h2 className="text-lg font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                الدفع
                            </h2>
                            <p className="text-xs text-[var(--on-surface-variant)] font-['Almarai']" dir="auto">
                                {selectedMethod ? selectedMethodData?.nameAr : 'اختر طريقة الدفع'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isProcessing || paymentSuccess}
                            className="w-9 h-9 rounded-lg bg-[var(--surface-variant)] hover:bg-[var(--outline-variant)] border border-[var(--outline-variant)] flex items-center justify-center transition-all disabled:opacity-50"
                        >
                            <X className="w-4 h-4 text-[var(--on-surface-variant)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto overflow-x-hidden flex-1 p-5 space-y-6">
                        {/* Total Display */}
                        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 rounded-2xl p-6">
                            <div className="text-center">
                                <p className="text-sm font-['Almarai'] text-cyan-400 mb-2" dir="auto">
                                    المبلغ الإجمالي
                                </p>
                                <div className="text-5xl font-['Inter'] font-bold text-white mb-3">
                                    {total.toFixed(2)} <span className="text-2xl">ر.س</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        {!selectedMethod && (
                            <div>
                                <h3 className="text-base font-['Almarai'] font-bold text-[var(--on-surface)] mb-4" dir="auto">
                                    اختر طريقة الدفع
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {PAYMENT_METHODS.map((method) => (
                                        <motion.button
                                            key={method.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleMethodSelect(method.id)}
                                            className="relative h-28 rounded-xl overflow-hidden border border-[var(--outline-variant)] hover:border-cyan-400/50 transition-all"
                                        >
                                            <div
                                                className="absolute inset-0 opacity-20"
                                                style={{ background: method.gradient }}
                                            />
                                            <div className="relative h-full flex flex-col items-center justify-center gap-2 p-4">
                                                <div className="text-white">{method.icon}</div>
                                                <span className="text-sm font-['Almarai'] font-bold text-[var(--on-surface)] text-center leading-tight" dir="auto">
                                                    {method.nameAr}
                                                </span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cash Input */}
                        {selectedMethod && selectedMethodData?.requiresCashInput && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 gap-2">
                                    {QUICK_CASH_AMOUNTS.map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => setCashInput(amount.toString())}
                                            disabled={isProcessing || paymentSuccess}
                                            className="h-14 rounded-xl bg-[var(--surface-variant)] hover:bg-[var(--outline-variant)] border border-[var(--outline-variant)] transition-all disabled:opacity-50"
                                        >
                                            <span className="font-['Inter'] font-bold text-[var(--on-surface)]">{amount}</span>
                                        </button>
                                    ))}
                                </div>

                                <input
                                    type="number"
                                    value={cashInput}
                                    onChange={(e) => setCashInput(e.target.value)}
                                    disabled={isProcessing || paymentSuccess}
                                    placeholder={total.toFixed(2)}
                                    className="w-full h-20 px-6 rounded-2xl bg-[var(--surface-variant)] border-2 border-[var(--outline-variant)] text-[var(--on-surface)] focus:border-cyan-400 focus:outline-none font-['Inter'] font-bold text-3xl text-center disabled:opacity-50"
                                    dir="ltr"
                                />

                                {cashAmount >= total && (
                                    <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/30">
                                        <div className="flex items-center justify-between">
                                            <span className="font-['Almarai'] font-bold text-green-400" dir="auto">
                                                الباقي
                                            </span>
                                            <span className="text-2xl font-['Inter'] font-bold text-green-400">
                                                {change.toFixed(2)} ر.س
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment Button */}
                        {selectedMethod && (
                            <button
                                onClick={handlePayment}
                                disabled={!canPay || isProcessing || paymentSuccess}
                                className="w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-['Almarai'] font-bold text-white transition-all disabled:opacity-50"
                                style={{
                                    background: paymentSuccess
                                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                        : 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)',
                                }}
                            >
                                <Check className="w-6 h-6" />
                                <span dir="auto">
                                    {paymentSuccess ? 'تم الدفع بنجاح' : isProcessing ? 'جاري المعالجة...' : 'إتمام الدفع'}
                                </span>
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
