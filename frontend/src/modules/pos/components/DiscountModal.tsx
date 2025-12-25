import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Percent, DollarSign, Tag, Calculator, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Button, Input } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import Decimal from 'decimal.js';

export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type DiscountScope = 'ORDER' | 'ITEM';

export interface DiscountConfig {
    type: DiscountType;
    value: string;
    reason?: string;
    scope: DiscountScope;
    itemId?: string;
}

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (discount: DiscountConfig) => void;
    orderSubtotal: string;
    itemName?: string;
    itemPrice?: string;
    scope: DiscountScope;
    itemId?: string;
    maxPercentage?: number;
    maxFixed?: string;
}

const QUICK_PERCENTAGES = [5, 10, 15, 20, 25, 50];

const DISCOUNT_REASONS = [
    { value: 'LOYALTY', labelEn: 'Loyalty Customer', labelAr: 'عميل مميز' },
    { value: 'COMPLAINT', labelEn: 'Customer Complaint', labelAr: 'شكوى عميل' },
    { value: 'PROMO', labelEn: 'Promotional', labelAr: 'عرض ترويجي' },
    { value: 'EMPLOYEE', labelEn: 'Employee Discount', labelAr: 'خصم موظف' },
    { value: 'MANAGER', labelEn: 'Manager Discretion', labelAr: 'تقدير المدير' },
    { value: 'OTHER', labelEn: 'Other', labelAr: 'أخرى' },
];

/**
 * Discount Modal
 * Apply percentage or fixed discounts to order or individual items
 */
export function DiscountModal({
    isOpen,
    onClose,
    onApply,
    orderSubtotal,
    itemName,
    itemPrice,
    scope,
    itemId,
    maxPercentage = 100,
    maxFixed,
}: DiscountModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();

    const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
    const [value, setValue] = useState('');
    const [reason, setReason] = useState('LOYALTY');
    const [customReason, setCustomReason] = useState('');

    // Calculate discount amount and final price
    const calculations = useMemo(() => {
        const baseAmount = new Decimal(scope === 'ITEM' && itemPrice ? itemPrice : orderSubtotal);
        const inputValue = new Decimal(value || '0');

        let discountAmount: Decimal;
        if (discountType === 'PERCENTAGE') {
            discountAmount = baseAmount.times(inputValue).dividedBy(100);
        } else {
            discountAmount = inputValue;
        }

        // Cap at max
        if (maxFixed && discountAmount.greaterThan(maxFixed)) {
            discountAmount = new Decimal(maxFixed);
        }
        if (discountAmount.greaterThan(baseAmount)) {
            discountAmount = baseAmount;
        }

        const finalAmount = baseAmount.minus(discountAmount);

        return {
            baseAmount: baseAmount.toFixed(3),
            discountAmount: discountAmount.toFixed(3),
            finalAmount: finalAmount.toFixed(3),
            percentageEquivalent: discountType === 'FIXED'
                ? discountAmount.dividedBy(baseAmount).times(100).toFixed(1)
                : value,
        };
    }, [value, discountType, orderSubtotal, itemPrice, scope, maxFixed]);

    // Validate input
    const isValid = useMemo(() => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) return false;
        if (discountType === 'PERCENTAGE' && numValue > maxPercentage) return false;
        if (reason === 'OTHER' && !customReason.trim()) return false;
        return true;
    }, [value, discountType, maxPercentage, reason, customReason]);

    const handleApply = () => {
        if (!isValid) return;

        onApply({
            type: discountType,
            value,
            reason: reason === 'OTHER' ? customReason : reason,
            scope,
            itemId,
        });

        // Reset
        setValue('');
        setReason('LOYALTY');
        setCustomReason('');
        onClose();
    };

    const handleQuickPercentage = (pct: number) => {
        setDiscountType('PERCENTAGE');
        setValue(String(pct));
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
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    data-theme={theme}
                    className={cn(
                        'relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden',
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
                                data-theme={theme}
                                className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center',
                                    'bg-gradient-to-br from-green-500 to-emerald-600',
                                    'data-[theme=luxury]:from-amber-500 data-[theme=luxury]:to-amber-600',
                                )}
                            >
                                <Tag className="w-5 h-5 text-white" />
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
                                    {t('discount.title', 'Apply Discount')}
                                </h2>
                                {scope === 'ITEM' && itemName && (
                                    <p className="text-xs text-slate-400">{itemName}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Discount Type Toggle */}
                        <div
                            data-theme={theme}
                            className={cn(
                                'flex rounded-xl p-1',
                                'bg-slate-800',
                                'data-[theme=light]:bg-slate-100',
                            )}
                        >
                            <button
                                onClick={() => setDiscountType('PERCENTAGE')}
                                data-theme={theme}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all',
                                    discountType === 'PERCENTAGE'
                                        ? 'bg-green-500 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white data-[theme=light]:text-slate-600',
                                )}
                            >
                                <Percent className="w-4 h-4" />
                                <span>{t('discount.percentage', 'Percentage')}</span>
                            </button>
                            <button
                                onClick={() => setDiscountType('FIXED')}
                                data-theme={theme}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all',
                                    discountType === 'FIXED'
                                        ? 'bg-green-500 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white data-[theme=light]:text-slate-600',
                                )}
                            >
                                <DollarSign className="w-4 h-4" />
                                <span>{t('discount.fixed', 'Fixed')}</span>
                            </button>
                        </div>

                        {/* Quick Percentage Buttons */}
                        {discountType === 'PERCENTAGE' && (
                            <div className="flex flex-wrap gap-2">
                                {QUICK_PERCENTAGES.map((pct) => (
                                    <motion.button
                                        key={pct}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleQuickPercentage(pct)}
                                        disabled={pct > maxPercentage}
                                        data-theme={theme}
                                        className={cn(
                                            'px-3 py-2 rounded-lg font-bold text-sm transition-all',
                                            value === String(pct)
                                                ? 'bg-green-500 text-white'
                                                : cn(
                                                    'bg-slate-700 text-slate-300 hover:bg-slate-600',
                                                    'data-[theme=light]:bg-slate-200 data-[theme=light]:text-slate-700',
                                                    'data-[theme=light]:hover:bg-slate-300',
                                                ),
                                            pct > maxPercentage && 'opacity-50 cursor-not-allowed',
                                        )}
                                    >
                                        {pct}%
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Value Input */}
                        <div className="relative">
                            <Input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={
                                    discountType === 'PERCENTAGE'
                                        ? t('discount.enterPercentage', 'Enter percentage')
                                        : t('discount.enterAmount', 'Enter amount')
                                }
                                leftIcon={
                                    discountType === 'PERCENTAGE' ? (
                                        <Percent className="w-4 h-4" />
                                    ) : (
                                        <Calculator className="w-4 h-4" />
                                    )
                                }
                                fullWidth
                            />
                        </div>

                        {/* Reason Selector */}
                        <div className="space-y-2">
                            <label
                                data-theme={theme}
                                className={cn(
                                    'text-sm font-medium',
                                    'text-slate-300',
                                    'data-[theme=light]:text-slate-700',
                                )}
                            >
                                {t('discount.reason', 'Reason')}
                            </label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                data-theme={theme}
                                className={cn(
                                    'w-full px-3 py-2 rounded-lg border',
                                    'bg-slate-800 border-slate-700 text-white',
                                    'focus:outline-none focus:ring-2 focus:ring-green-500/50',
                                    'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                    'data-[theme=light]:text-slate-900',
                                )}
                            >
                                {DISCOUNT_REASONS.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {language === 'ar' ? r.labelAr : r.labelEn}
                                    </option>
                                ))}
                            </select>

                            {reason === 'OTHER' && (
                                <Input
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    placeholder={t('discount.customReason', 'Enter reason...')}
                                    fullWidth
                                />
                            )}
                        </div>

                        {/* Calculation Preview */}
                        {value && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                data-theme={theme}
                                className={cn(
                                    'rounded-xl p-3 space-y-2',
                                    'bg-slate-800/50 border border-slate-700/50',
                                    'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                )}
                            >
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">
                                        {scope === 'ITEM'
                                            ? t('discount.itemPrice', 'Item Price')
                                            : t('discount.subtotal', 'Subtotal')}
                                    </span>
                                    <PriceDisplay value={calculations.baseAmount} size="sm" />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-400">
                                        {t('discount.discount', 'Discount')} (
                                        {calculations.percentageEquivalent}%)
                                    </span>
                                    <span className="text-green-400">
                                        -<PriceDisplay value={calculations.discountAmount} size="sm" />
                                    </span>
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
                                        {t('discount.finalPrice', 'Final')}
                                    </span>
                                    <PriceDisplay
                                        value={calculations.finalAmount}
                                        size="md"
                                        variant="primary"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        data-theme={theme}
                        className={cn(
                            'p-4 border-t flex gap-2',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200',
                        )}
                    >
                        <Button variant="secondary" className="flex-1" onClick={onClose}>
                            {t('cancel', 'Cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            className={cn(
                                'flex-1',
                                'bg-gradient-to-r from-green-500 to-emerald-600',
                                'hover:from-green-400 hover:to-emerald-500',
                            )}
                            onClick={handleApply}
                            disabled={!isValid}
                        >
                            <Check className="w-4 h-4 me-2" />
                            {t('discount.apply', 'Apply Discount')}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default DiscountModal;
