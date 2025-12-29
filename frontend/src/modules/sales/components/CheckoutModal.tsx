import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CreditCard,
    Banknote,
    Smartphone,
    Receipt,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import { DenominationInput } from './DenominationInput';
import Decimal from 'decimal.js';

export type PaymentMethod = 'CASH' | 'CARD' | 'MADA';

export interface PaymentEntry {
    method: PaymentMethod;
    amount: string;
    reference?: string;
}

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (payments: PaymentEntry[]) => void;
    orderTotal: string;
    orderDiscount?: string;
    orderTax: string;
    orderSubtotal: string;
    itemCount: number;
    /** Whether split payments are allowed (from feature flags) */
    canSplitPayment?: boolean;
    /** Whether the order is currently being submitted to the backend */
    isSubmitting?: boolean;
    /** Whether the order was successfully completed */
    isSuccess?: boolean;
}

const PAYMENT_METHODS: {
    id: PaymentMethod;
    icon: typeof CreditCard;
    labelEn: string;
    labelAr: string;
    color: string;
}[] = [
        { id: 'CASH', icon: Banknote, labelEn: 'Cash', labelAr: 'نقدي', color: 'from-green-500 to-emerald-600' },
        { id: 'CARD', icon: CreditCard, labelEn: 'Card', labelAr: 'بطاقة', color: 'from-blue-500 to-indigo-600' },
        { id: 'MADA', icon: Smartphone, labelEn: 'Mada', labelAr: 'مدى', color: 'from-teal-500 to-teal-600' },
    ];

const QUICK_CASH_AMOUNTS = ['10', '20', '50', '100', '200', '500'];

type CheckoutStep = 'PAYMENT' | 'REVIEW' | 'COMPLETE';

/**
 * Checkout Modal
 * Multi-step payment flow with split payment support
 */
export function CheckoutModal({
    isOpen,
    onClose,
    onComplete,
    orderTotal,
    orderDiscount = '0',
    orderTax,
    orderSubtotal,
    itemCount,
    isSubmitting,
    isSuccess,
}: CheckoutModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();

    const [step, setStep] = useState<CheckoutStep>('PAYMENT');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
    const [payments, setPayments] = useState<PaymentEntry[]>([]);
    const [cashReceived, setCashReceived] = useState('');
    const [showDenominations, setShowDenominations] = useState(false);

    // Watch for success to transition to COMPLETE step
    useEffect(() => {
        if (isSuccess) {
            setStep('COMPLETE');
        }
    }, [isSuccess]);

    // Calculate remaining and change
    const calculations = useMemo(() => {
        const total = new Decimal(orderTotal);
        const paid = payments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
        const remaining = total.minus(paid);
        const cashInput = new Decimal(cashReceived || '0');
        const change = selectedMethod === 'CASH' ? cashInput.minus(remaining) : new Decimal(0);

        return {
            total: total.toFixed(3),
            paid: paid.toFixed(3),
            remaining: remaining.toFixed(3),
            remainingNum: remaining.toNumber(),
            change: change.greaterThan(0) ? change.toFixed(3) : '0.000',
            changeNum: change.toNumber(),
            isFullyPaid: remaining.lessThanOrEqualTo(0),
        };
    }, [orderTotal, payments, cashReceived, selectedMethod]);




    // Complete checkout - now calls the parent handler
    const handleComplete = () => {
        // Collect current cash payment if not added yet
        let finalPayments = [...payments];

        // Calculate what's left to pay
        const alreadyPaid = payments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
        const remainingToPay = new Decimal(orderTotal).minus(alreadyPaid);

        // If there's still an amount to pay, add it
        if (remainingToPay.greaterThan(0)) {
            if (selectedMethod === 'CASH') {
                // For cash: use what user entered, or if nothing entered, use exact amount
                const cashInput = new Decimal(cashReceived || '0');
                // The payment amount is the minimum of (cash entered, remaining) or just remaining if no input
                const paymentAmount = cashInput.greaterThan(0)
                    ? Decimal.min(cashInput, remainingToPay)
                    : remainingToPay;
                finalPayments.push({ method: 'CASH', amount: paymentAmount.toFixed(3) });
            } else {
                // For card/MADA: pay the remaining amount
                finalPayments.push({ method: selectedMethod, amount: remainingToPay.toFixed(3) });
            }
        }

        onComplete(finalPayments);
    };

    // Finalize
    const handleFinalize = () => {
        // Reset state
        setStep('PAYMENT');
        setPayments([]);
        setCashReceived('');
        onClose();
    };

    // Reset on close
    const handleClose = () => {
        setStep('PAYMENT');
        setPayments([]);
        setCashReceived('');
        onClose();
    };

    if (!isOpen) return null;

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
                    onClick={handleClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    data-theme={theme}
                    className={cn(
                        'relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden',
                        'bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                        'data-[theme=luxury]:bg-slate-950/95 data-[theme=luxury]:border-amber-800/30',
                    )}
                >
                    {/* Header */}
                    <div
                        data-theme={theme}
                        className={cn(
                            'flex items-center justify-between p-4 border-b',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200',
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center',
                                    step === 'COMPLETE'
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        : 'bg-gradient-to-br from-cyan-500 to-cyan-600',
                                )}
                            >
                                {step === 'COMPLETE' ? (
                                    <CheckCircle className="w-5 h-5 text-white" />
                                ) : (
                                    <Receipt className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <div>
                                <h2
                                    data-theme={theme}
                                    className={cn(
                                        'text-lg font-bold',
                                        'text-white',
                                        'data-[theme=light]:text-slate-900',
                                    )}
                                >
                                    {step === 'COMPLETE'
                                        ? t('checkout.complete', 'Payment Complete')
                                        : t('checkout.title', 'Checkout')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {itemCount} {language === 'ar' ? 'عنصر' : 'items'}
                                </p>
                            </div>
                        </div>
                        {step !== 'COMPLETE' && (
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <AnimatePresence mode="wait">
                            {step === 'PAYMENT' && (
                                <motion.div
                                    key="payment"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    {/* Order Summary Mini */}
                                    <div
                                        data-theme={theme}
                                        className={cn(
                                            'rounded-xl p-3 space-y-1',
                                            'bg-slate-800/50',
                                            'data-[theme=light]:bg-slate-50',
                                        )}
                                    >
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">{t('summary.subtotal')}</span>
                                            <PriceDisplay value={orderSubtotal} size="sm" />
                                        </div>
                                        {parseFloat(orderDiscount) > 0 && (
                                            <div className="flex justify-between text-sm text-green-400">
                                                <span>{t('summary.discount')}</span>
                                                <span>-<PriceDisplay value={orderDiscount} size="sm" /></span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">{t('summary.tax')}</span>
                                            <PriceDisplay value={orderTax} size="sm" variant="muted" />
                                        </div>
                                        <div
                                            data-theme={theme}
                                            className={cn(
                                                'flex justify-between pt-2 border-t font-bold',
                                                'border-slate-700',
                                                'data-[theme=light]:border-slate-200',
                                            )}
                                        >
                                            <span
                                                data-theme={theme}
                                                className={cn(
                                                    'text-white',
                                                    'data-[theme=light]:text-slate-900',
                                                )}
                                            >
                                                {t('summary.total')}
                                            </span>
                                            <PriceDisplay value={orderTotal} size="lg" variant="primary" />
                                        </div>
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {PAYMENT_METHODS.map((method) => {
                                            const Icon = method.icon;
                                            const isSelected = selectedMethod === method.id;
                                            return (
                                                <motion.button
                                                    key={method.id}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedMethod(method.id)}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'p-3 rounded-xl border-2 transition-all flex items-center gap-2',
                                                        isSelected
                                                            ? `bg-gradient-to-r ${method.color} border-transparent text-white`
                                                            : cn(
                                                                'border-slate-700 hover:border-slate-600',
                                                                'data-[theme=light]:border-slate-300 data-[theme=light]:hover:border-slate-400',
                                                            ),
                                                    )}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span className="font-medium">
                                                        {language === 'ar' ? method.labelAr : method.labelEn}
                                                    </span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Cash Input */}
                                    {selectedMethod === 'CASH' && (
                                        <div className="space-y-4">
                                            {!showDenominations ? (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        {QUICK_CASH_AMOUNTS.map((amount) => (
                                                            <motion.button
                                                                key={amount}
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => setCashReceived(amount)}
                                                                data-theme={theme}
                                                                className={cn(
                                                                    'px-3 py-2 rounded-lg font-bold text-sm',
                                                                    cashReceived === amount
                                                                        ? 'bg-cyan-500 text-white'
                                                                        : cn(
                                                                            'bg-slate-700 text-slate-300 hover:bg-slate-600',
                                                                            'data-[theme=light]:bg-slate-200 data-[theme=light]:text-slate-700',
                                                                        ),
                                                                )}
                                                            >
                                                                {amount}
                                                            </motion.button>
                                                        ))}
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setCashReceived(calculations.remaining)}
                                                            data-theme={theme}
                                                            className={cn(
                                                                'px-3 py-2 rounded-lg font-bold text-sm',
                                                                'bg-green-500/20 text-green-400 hover:bg-green-500/30',
                                                            )}
                                                        >
                                                            {t('checkout.exact', 'Exact')}
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <DenominationInput onTotalChange={setCashReceived} />
                                            )}

                                            <button
                                                onClick={() => setShowDenominations(!showDenominations)}
                                                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors w-full text-center"
                                            >
                                                {showDenominations
                                                    ? t('checkout.showQuickCash', 'Show Quick Cash')
                                                    : t('checkout.showDetailedCash', 'Detailed Cash Breakdown')}
                                            </button>

                                            {/* Change Display */}
                                            {calculations.changeNum > 0 && (
                                                <div
                                                    data-theme={theme}
                                                    className={cn(
                                                        'rounded-xl p-3 text-center',
                                                        'bg-green-500/20 border border-green-500/30',
                                                    )}
                                                >
                                                    <p className="text-sm text-green-400">
                                                        {t('checkout.change', 'Change')}
                                                    </p>
                                                    <p className="text-2xl font-bold text-green-400">
                                                        <PriceDisplay value={calculations.change} size="lg" />
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Remaining Amount */}
                                    {payments.length > 0 && calculations.remainingNum > 0 && (
                                        <div
                                            data-theme={theme}
                                            className={cn(
                                                'rounded-xl p-3 text-center',
                                                'bg-yellow-500/20 border border-yellow-500/30',
                                            )}
                                        >
                                            <p className="text-sm text-yellow-400">
                                                {t('checkout.remaining', 'Remaining')}
                                            </p>
                                            <p className="text-xl font-bold text-yellow-400">
                                                <PriceDisplay value={calculations.remaining} size="lg" />
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 'COMPLETE' && (
                                <motion.div
                                    key="complete"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 10 }}
                                        className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-10 h-10 text-white" />
                                    </motion.div>
                                    <h3
                                        data-theme={theme}
                                        className={cn(
                                            'text-xl font-bold mb-2',
                                            'text-white',
                                            'data-[theme=light]:text-slate-900',
                                        )}
                                    >
                                        {t('checkout.success', 'Payment Successful!')}
                                    </h3>
                                    <p className="text-slate-400 mb-6">
                                        {t('checkout.receiptReady', 'Receipt is ready')}
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        <Button
                                            variant="secondary"
                                            onClick={handleFinalize}
                                            className="gap-2"
                                        >
                                            <Printer className="w-4 h-4" />
                                            {t('checkout.printReceipt', 'Print Receipt')}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={handleFinalize}
                                            className="gap-2"
                                        >
                                            {t('checkout.newOrder', 'New Order')}
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {step === 'PAYMENT' && (
                        <div
                            data-theme={theme}
                            className={cn(
                                'p-4 border-t flex gap-2',
                                'border-slate-700/50',
                                'data-[theme=light]:border-slate-200',
                            )}
                        >
                            <Button variant="secondary" onClick={handleClose}>
                                <ArrowLeft className="w-4 h-4 me-2" />
                                {t('cancel', 'Cancel')}
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={handleComplete}
                                disabled={
                                    isSubmitting ||
                                    (selectedMethod === 'CASH' && !cashReceived && !calculations.isFullyPaid)
                                }
                            >
                                {isSubmitting ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                    />
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 me-2" />
                                        {t('checkout.pay', 'Complete Payment')}
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default CheckoutModal;
