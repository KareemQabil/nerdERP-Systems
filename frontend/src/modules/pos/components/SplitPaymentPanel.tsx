import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard,
    Banknote,
    Smartphone,
    Building,
    Gift,
    Star,
    Plus,
    Trash2,
    Check,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import Decimal from 'decimal.js';
import type { PaymentMethod } from '@/types/pos.types';

export interface SplitPaymentEntry {
    id: string;
    method: PaymentMethod;
    amount: string;
    reference?: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

interface SplitPaymentPanelProps {
    /** Total amount to be paid */
    orderTotal: string;
    /** Current payment entries */
    payments: SplitPaymentEntry[];
    /** Callback when payment is added */
    onAddPayment: (method: PaymentMethod, amount: string, reference?: string) => void;
    /** Callback when payment is removed */
    onRemovePayment: (paymentId: string) => void;
    /** Callback when all payments are confirmed */
    onConfirm: () => void;
    /** Whether the panel is in processing state */
    isProcessing?: boolean;
    /** Available payment methods */
    availableMethods?: PaymentMethod[];
}

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, {
    icon: typeof CreditCard;
    labelEn: string;
    labelAr: string;
    color: string;
    gradient: string;
}> = {
    CASH: {
        icon: Banknote,
        labelEn: 'Cash',
        labelAr: 'نقدي',
        color: 'text-green-400',
        gradient: 'from-green-500 to-emerald-600',
    },
    CARD: {
        icon: CreditCard,
        labelEn: 'Card',
        labelAr: 'بطاقة',
        color: 'text-blue-400',
        gradient: 'from-blue-500 to-indigo-600',
    },
    GIFT_CARD: {
        icon: Gift,
        labelEn: 'Gift Card',
        labelAr: 'بطاقة هدية',
        color: 'text-purple-400',
        gradient: 'from-purple-500 to-violet-600',
    },
    LOYALTY_POINTS: {
        icon: Star,
        labelEn: 'Loyalty Points',
        labelAr: 'نقاط الولاء',
        color: 'text-amber-400',
        gradient: 'from-amber-500 to-orange-600',
    },
    STORE_CREDIT: {
        icon: Building,
        labelEn: 'Store Credit',
        labelAr: 'رصيد المتجر',
        color: 'text-slate-400',
        gradient: 'from-slate-500 to-slate-600',
    },
};

const DEFAULT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'GIFT_CARD', 'LOYALTY_POINTS'];

/**
 * Split Payment Panel
 * Allows customers to pay with multiple payment methods
 */
export function SplitPaymentPanel({
    orderTotal,
    payments,
    onAddPayment,
    onRemovePayment,
    onConfirm,
    isProcessing = false,
    availableMethods = DEFAULT_METHODS,
}: SplitPaymentPanelProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();

    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
    const [inputAmount, setInputAmount] = useState('');
    const [inputReference, setInputReference] = useState('');

    // Calculate totals
    const calculations = useMemo(() => {
        const total = new Decimal(orderTotal);
        const paid = payments.reduce(
            (sum, p) => sum.plus(p.amount),
            new Decimal(0)
        );
        const remaining = total.minus(paid);

        return {
            total: total.toFixed(3),
            paid: paid.toFixed(3),
            remaining: remaining.greaterThan(0) ? remaining.toFixed(3) : '0.000',
            remainingNum: remaining.toNumber(),
            isFullyPaid: remaining.lessThanOrEqualTo(0),
            percentage: paid.dividedBy(total).times(100).toNumber(),
        };
    }, [orderTotal, payments]);

    // Add payment handler
    const handleAddPayment = () => {
        const amount = inputAmount || calculations.remaining;
        if (parseFloat(amount) <= 0) return;

        onAddPayment(selectedMethod, amount, inputReference || undefined);
        setInputAmount('');
        setInputReference('');
    };

    // Quick amount buttons
    const quickAmounts = useMemo(() => {
        const remaining = parseFloat(calculations.remaining);
        if (remaining <= 0) return [];

        // Generate sensible quick amounts
        const amounts: string[] = [];
        const roundedUp = Math.ceil(remaining / 10) * 10;

        if (remaining <= 100) {
            amounts.push('10', '20', '50');
        } else if (remaining <= 500) {
            amounts.push('50', '100', '200');
        } else {
            amounts.push('100', '200', '500');
        }

        // Add rounded-up amount if different from exact
        if (roundedUp !== remaining && !amounts.includes(roundedUp.toString())) {
            amounts.push(roundedUp.toString());
        }

        return amounts.filter((a) => parseFloat(a) >= remaining || parseFloat(a) <= remaining);
    }, [calculations.remaining]);

    return (
        <div
            data-theme={theme}
            className={cn(
                'rounded-2xl overflow-hidden',
                'bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl',
                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                'data-[theme=luxury]:bg-slate-950/95 data-[theme=luxury]:border-amber-800/30',
            )}
        >
            {/* Header with Progress */}
            <div
                data-theme={theme}
                className={cn(
                    'p-4 border-b',
                    'border-slate-700/50',
                    'data-[theme=light]:border-slate-200',
                )}
            >
                <div className="flex items-center justify-between mb-3">
                    <h3
                        data-theme={theme}
                        className={cn(
                            'text-lg font-bold',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    >
                        {t('splitPayment.title', 'Split Payment')}
                    </h3>
                    <div className="text-end">
                        <p className="text-xs text-slate-400">
                            {t('splitPayment.remaining', 'Remaining')}
                        </p>
                        <PriceDisplay
                            value={calculations.remaining}
                            size="lg"
                            variant={calculations.isFullyPaid ? 'muted' : 'primary'}
                        />
                    </div>
                </div>

                {/* Progress Bar */}
                <div
                    data-theme={theme}
                    className={cn(
                        'h-2 rounded-full overflow-hidden',
                        'bg-slate-700/50',
                        'data-[theme=light]:bg-slate-200',
                    )}
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(calculations.percentage, 100)}%` }}
                        className={cn(
                            'h-full rounded-full',
                            calculations.isFullyPaid
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                : 'bg-gradient-to-r from-cyan-500 to-cyan-400',
                        )}
                    />
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-400">
                    <span>
                        {t('splitPayment.paid', 'Paid')}: <PriceDisplay value={calculations.paid} size="sm" />
                    </span>
                    <span>
                        {t('splitPayment.total', 'Total')}: <PriceDisplay value={calculations.total} size="sm" />
                    </span>
                </div>
            </div>

            {/* Payment Entries */}
            <div className="p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                    {payments.map((payment) => {
                        const config = PAYMENT_METHOD_CONFIG[payment.method];
                        const Icon = config.icon;

                        return (
                            <motion.div
                                key={payment.id}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                                data-theme={theme}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-xl',
                                    'bg-slate-800/50 border',
                                    payment.status === 'COMPLETED'
                                        ? 'border-green-500/30'
                                        : payment.status === 'FAILED'
                                            ? 'border-red-500/30'
                                            : 'border-slate-700/50',
                                    'data-[theme=light]:bg-slate-50',
                                    'data-[theme=light]:border-slate-200',
                                )}
                            >
                                {/* Method Icon */}
                                <div
                                    className={cn(
                                        'w-10 h-10 rounded-lg flex items-center justify-center',
                                        `bg-gradient-to-br ${config.gradient}`,
                                    )}
                                >
                                    <Icon className="w-5 h-5 text-white" />
                                </div>

                                {/* Payment Info */}
                                <div className="flex-1 min-w-0">
                                    <p
                                        data-theme={theme}
                                        className={cn(
                                            'font-medium',
                                            'text-white',
                                            'data-[theme=light]:text-slate-900',
                                        )}
                                    >
                                        {language === 'ar' ? config.labelAr : config.labelEn}
                                    </p>
                                    {payment.reference && (
                                        <p className="text-xs text-slate-400 truncate">
                                            {payment.reference}
                                        </p>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="text-end">
                                    <PriceDisplay value={payment.amount} size="md" />
                                    {payment.status === 'COMPLETED' && (
                                        <span className="text-xs text-green-400 flex items-center gap-1 justify-end">
                                            <Check className="w-3 h-3" />
                                            {t('splitPayment.completed', 'Completed')}
                                        </span>
                                    )}
                                    {payment.status === 'FAILED' && (
                                        <span className="text-xs text-red-400 flex items-center gap-1 justify-end">
                                            <AlertCircle className="w-3 h-3" />
                                            {t('splitPayment.failed', 'Failed')}
                                        </span>
                                    )}
                                </div>

                                {/* Remove Button */}
                                {payment.status === 'PENDING' && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onRemovePayment(payment.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Empty State */}
                {payments.length === 0 && (
                    <div
                        data-theme={theme}
                        className={cn(
                            'text-center py-8 rounded-xl border-2 border-dashed',
                            'border-slate-700/50 text-slate-500',
                            'data-[theme=light]:border-slate-300 data-[theme=light]:text-slate-400',
                        )}
                    >
                        <Smartphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>{t('splitPayment.noPayments', 'No payments added yet')}</p>
                        <p className="text-sm">
                            {t('splitPayment.selectMethod', 'Select a payment method below')}
                        </p>
                    </div>
                )}
            </div>

            {/* Add Payment Section */}
            {!calculations.isFullyPaid && (
                <div
                    data-theme={theme}
                    className={cn(
                        'p-4 border-t space-y-4',
                        'border-slate-700/50',
                        'data-[theme=light]:border-slate-200',
                    )}
                >
                    {/* Method Selector */}
                    <div className="flex flex-wrap gap-2">
                        {availableMethods.map((method) => {
                            const config = PAYMENT_METHOD_CONFIG[method];
                            const Icon = config.icon;
                            const isSelected = selectedMethod === method;

                            return (
                                <motion.button
                                    key={method}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedMethod(method)}
                                    data-theme={theme}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all',
                                        isSelected
                                            ? `bg-gradient-to-r ${config.gradient} border-transparent text-white`
                                            : cn(
                                                'border-slate-700 hover:border-slate-600',
                                                'data-[theme=light]:border-slate-300 data-[theme=light]:hover:border-slate-400',
                                            ),
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {language === 'ar' ? config.labelAr : config.labelEn}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Amount Input */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <input
                                type="number"
                                value={inputAmount}
                                onChange={(e) => setInputAmount(e.target.value)}
                                placeholder={calculations.remaining}
                                data-theme={theme}
                                className={cn(
                                    'w-full px-4 py-3 rounded-xl text-lg font-bold',
                                    'bg-slate-800/50 border border-slate-700/50',
                                    'text-white placeholder-slate-500',
                                    'focus:outline-none focus:border-cyan-500/50',
                                    'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                    'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder-slate-400',
                                )}
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleAddPayment}
                            className="px-6"
                            disabled={isProcessing}
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Quick Amounts */}
                    <div className="flex flex-wrap gap-2">
                        {quickAmounts.map((amount) => (
                            <motion.button
                                key={amount}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setInputAmount(amount)}
                                data-theme={theme}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-bold',
                                    inputAmount === amount
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
                            onClick={() => setInputAmount(calculations.remaining)}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        >
                            {t('splitPayment.exact', 'Exact')}
                        </motion.button>
                    </div>

                    {/* Reference Input (for card/gift card) */}
                    {(selectedMethod === 'CARD' || selectedMethod === 'GIFT_CARD') && (
                        <input
                            type="text"
                            value={inputReference}
                            onChange={(e) => setInputReference(e.target.value)}
                            placeholder={
                                selectedMethod === 'CARD'
                                    ? t('splitPayment.cardLast4', 'Card last 4 digits')
                                    : t('splitPayment.giftCardNumber', 'Gift card number')
                            }
                            data-theme={theme}
                            className={cn(
                                'w-full px-4 py-2 rounded-xl text-sm',
                                'bg-slate-800/50 border border-slate-700/50',
                                'text-white placeholder-slate-500',
                                'focus:outline-none focus:border-cyan-500/50',
                                'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                'data-[theme=light]:text-slate-900',
                            )}
                        />
                    )}
                </div>
            )}

            {/* Confirm Button */}
            <div
                data-theme={theme}
                className={cn(
                    'p-4 border-t',
                    'border-slate-700/50',
                    'data-[theme=light]:border-slate-200',
                )}
            >
                <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={onConfirm}
                    disabled={!calculations.isFullyPaid || isProcessing}
                >
                    {isProcessing ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                    ) : calculations.isFullyPaid ? (
                        <>
                            <Check className="w-5 h-5 me-2" />
                            {t('splitPayment.confirm', 'Confirm Payment')}
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-5 h-5 me-2" />
                            {t('splitPayment.addMore', 'Add More Payment')} ({' '}
                            <PriceDisplay value={calculations.remaining} size="sm" />{' '}
                            {t('splitPayment.remainingLabel', 'remaining')})
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

export default SplitPaymentPanel;
