import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';
import { useTranslation } from '@/hooks/useTranslation';
import { formatCurrency } from '@/lib/format';
import type { CalculationBreakdown, CalculationResult } from '@/types/pos.types';

/**
 * =============================================================================
 * CALCULATION BREAKDOWN DISPLAY COMPONENT
 * =============================================================================
 *
 * Displays detailed breakdown of order calculation showing each pipeline stage.
 * Shows how values were computed: subtotal, service charge, delivery fee, tax, discount, total.
 *
 * Features:
 * - Expandable/collapsible sections per stage
 * - Formula display for each calculation
 * - Bilingual support (English/Arabic)
 * - Color-coded by stage type
 * - Shows audit trail for transparency
 *
 * @example
 * <CalculationBreakdownDisplay
 *   result={calculationResult}
 *   pipelineVersion="1.0"
 *   showDetails={true}
 * />
 */

interface CalculationBreakdownDisplayProps {
    result: CalculationResult;
    pipelineVersion?: string;
    showDetails?: boolean;
    compact?: boolean;
    expandByDefault?: boolean;
    currency?: string;
}

/**
 * Stage type configuration for visual styling
 */
const STAGE_TYPE_CONFIG: Record<string, {
    icon: string;
    label: string;
    labelAr: string;
    color: string;
    bgColor: string;
}> = {
    ITEM_SUBTOTAL: {
        icon: '🛒',
        label: 'Items Subtotal',
        labelAr: 'مجموع الأصناف',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
    },
    SERVICE_CHARGE: {
        icon: '🍽️',
        label: 'Service Charge',
        labelAr: 'رسوم الخدمة',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
    },
    DELIVERY_FEE: {
        icon: '🚗',
        label: 'Delivery Fee',
        labelAr: 'رسوم التوصيل',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
    },
    SUBTOTAL_BEFORE_TAX: {
        icon: '📊',
        label: 'Subtotal (Before Tax)',
        labelAr: 'المجموع الفرعي',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/20',
    },
    TAX: {
        icon: '📋',
        label: 'VAT/Tax',
        labelAr: 'ضريبة القيمة المضافة',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
    },
    DISCOUNT: {
        icon: '🏷️',
        label: 'Discount',
        labelAr: 'الخصم',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
    },
    SURCHARGE: {
        icon: '➕',
        label: 'Surcharge',
        labelAr: 'رسوم إضافية',
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/20',
    },
    TOTAL: {
        icon: '💰',
        label: 'Total',
        labelAr: 'الإجمالي',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
    },
};

export function CalculationBreakdownDisplay({
    result,
    pipelineVersion,
    showDetails = true,
    compact = false,
    expandByDefault = false,
    currency = 'SAR',
}: CalculationBreakdownDisplayProps) {
    const { language, theme } = useSettingsStore();
    const { t } = useTranslation();
    const [expandedStages, setExpandedStages] = useState<Set<string>>(
        expandByDefault ? new Set(result.breakdown.map(b => b.stage)) : new Set()
    );

    const toggleStage = (stageId: string) => {
        const newExpanded = new Set(expandedStages);
        if (newExpanded.has(stageId)) {
            newExpanded.delete(stageId);
        } else {
            newExpanded.add(stageId);
        }
        setExpandedStages(newExpanded);
    };

    const expandAll = () => {
        setExpandedStages(new Set(result.breakdown.map(b => b.stage)));
    };

    const collapseAll = () => {
        setExpandedStages(new Set());
    };

    const isRTL = language === 'ar';

    return (
        <div
            className={cn(
                'rounded-xl border',
                'bg-slate-900/50 border-slate-500/20',
                compact ? 'p-3' : 'p-4',
            )}
            data-theme={theme}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🧮</span>
                    <div>
                        <h3 className={cn(
                            'font-semibold text-sm',
                            language === 'ar' ? 'font-arabic' : '',
                        )}>
                            {t('calculation.breakdown', 'Calculation Breakdown')}
                        </h3>
                        {pipelineVersion && (
                            <span className="text-xs text-slate-500 ml-2">
                                v{pipelineVersion}
                            </span>
                        )}
                    </div>
                </div>

                {showDetails && result.breakdown.length > 0 && (
                    <div className="flex gap-1">
                        <button
                            onClick={expandAll}
                            className={cn(
                                'text-xs px-2 py-1 rounded',
                                'bg-slate-500/20 text-slate-400',
                                'hover:bg-slate-500/30 transition-colors',
                            )}
                        >
                            {t('common.expandAll', 'Expand All')}
                        </button>
                        <button
                            onClick={collapseAll}
                            className={cn(
                                'text-xs px-2 py-1 rounded',
                                'bg-slate-500/20 text-slate-400',
                                'hover:bg-slate-500/30 transition-colors',
                            )}
                        >
                            {t('common.collapseAll', 'Collapse All')}
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Row (compact or full) */}
            <div className={cn(
                'grid gap-2 mb-3',
                compact ? 'grid-cols-2' : 'grid-cols-4',
            )}>
                <SummaryItem
                    label={t('calculation.subtotal', 'Subtotal')}
                    value={result.subtotal}
                    currency={currency}
                    color="text-blue-400"
                />
                <SummaryItem
                    label={t('calculation.tax', 'VAT')}
                    value={result.taxAmount}
                    currency={currency}
                    color="text-amber-400"
                />
                <SummaryItem
                    label={t('calculation.discount', 'Discount')}
                    value={-result.discountAmount}
                    currency={currency}
                    color="text-red-400"
                    showNegative={false}
                />
                <SummaryItem
                    label={t('calculation.total', 'Total')}
                    value={result.total}
                    currency={currency}
                    color="text-green-400"
                    highlight
                />
            </div>

            {/* Detailed Breakdown */}
            {showDetails && result.breakdown.length > 0 && (
                <div className="space-y-2">
                    {result.breakdown.map((breakdown, index) => {
                        const config = STAGE_TYPE_CONFIG[breakdown.stageType] || STAGE_TYPE_CONFIG.TOTAL;
                        const isExpanded = expandedStages.has(breakdown.stage);
                        const isTotal = breakdown.stageType === 'TOTAL';
                        const isDiscount = breakdown.stageType === 'DISCOUNT';
                        const value = isDiscount ? -breakdown.value : breakdown.value;

                        return (
                            <motion.div
                                key={breakdown.stage}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn(
                                    'rounded-lg border overflow-hidden transition-colors',
                                    isTotal
                                        ? 'bg-green-500/20 border-green-500/30'
                                        : isDiscount
                                            ? 'bg-red-500/20 border-red-500/30'
                                            : 'bg-slate-500/10 border-slate-500/20',
                                )}
                            >
                                {/* Stage Header (clickable to expand/collapse) */}
                                <button
                                    onClick={() => toggleStage(breakdown.stage)}
                                    className={cn(
                                        'w-full flex items-center justify-between px-3 py-2',
                                        'hover:bg-slate-500/10 transition-colors',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{config.icon}</span>
                                        <span className={cn(
                                            'text-sm font-medium',
                                            language === 'ar' ? 'font-arabic' : '',
                                        )}>
                                            {isRTL ? config.labelAr : config.label}
                                        </span>
                                        {breakdown.formula && (
                                            <span className={cn(
                                                'text-xs px-1.5 py-0.5 rounded',
                                                'bg-slate-500/20 text-slate-400',
                                            )}>
                                                {breakdown.formula}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            'text-sm font-semibold',
                                            isTotal
                                                ? 'text-green-400'
                                                : isDiscount
                                                    ? 'text-red-400'
                                                    : config.color,
                                        )}>
                                            {formatCurrency(value, currency)}
                                        </span>
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {isRTL ? (
                                                <ChevronLeft className="w-4 h-4 text-slate-500" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-slate-500" />
                                            )}
                                        </motion.div>
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-3 pb-3 space-y-2">
                                                {/* Description */}
                                                <p className="text-xs text-slate-500">
                                                    {breakdown.description}
                                                </p>

                                                {/* Additional Details */}
                                                {breakdown.stageType === 'TAX' && (
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Tax Base:</span>
                                                            <span className="text-slate-300">
                                                                {formatCurrency(result.subtotal + result.serviceCharge, currency)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Tax Rate:</span>
                                                            <span className="text-slate-300">
                                                                {((result.taxAmount / (result.subtotal + result.serviceCharge)) * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {breakdown.stageType === 'SERVICE_CHARGE' && (
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Service Charge Rate:</span>
                                                            <span className="text-slate-300">
                                                                {((result.serviceCharge / result.subtotal) * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {breakdown.stageType === 'DELIVERY_FEE' && result.deliveryFee > 0 && (
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Delivery Fee:</span>
                                                            <span className="text-slate-300">
                                                                {formatCurrency(result.deliveryFee, currency)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {breakdown.stageType === 'DISCOUNT' && result.discountAmount > 0 && (
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Discount Amount:</span>
                                                            <span className="text-red-400">
                                                                -{formatCurrency(result.discountAmount, currency)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Subtotal after Discount:</span>
                                                            <span className="text-slate-300">
                                                                {formatCurrency(result.subtotal - result.discountAmount, currency)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Footer Note */}
            <div className="mt-3 pt-3 border-t border-slate-500/20">
                <div className="flex items-start gap-2 text-xs text-slate-500">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <p>
                        {t('calculation.breakdownNote', 'Prices calculated based on current configuration. Service charge applies to dine-in orders only. VAT is calculated on subtotal including service charge.')}
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Summary Item Component
 */
interface SummaryItemProps {
    label: string;
    value: number;
    currency: string;
    color: string;
    highlight?: boolean;
    showNegative?: boolean;
}

function SummaryItem({
    label,
    value,
    currency,
    color,
    highlight = false,
    showNegative = true,
}: SummaryItemProps) {
    const isNegative = value < 0 && showNegative;

    return (
        <div className={cn(
            'flex flex-col p-2 rounded-lg',
            highlight
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-slate-500/10 border border-slate-500/20',
        )}>
            <span className="text-xs text-slate-500 mb-1">{label}</span>
            <span className={cn(
                'text-sm font-bold',
                isNegative ? 'text-red-400' : color,
            )}>
                {formatCurrency(value, currency)}
            </span>
        </div>
    );
}

/**
 * Mini Calculation Breakdown (for inline use)
 */
interface CalculationBreakdownMiniProps {
    result: CalculationResult;
    currency?: string;
}

export function CalculationBreakdownMini({
    result,
    currency = 'SAR',
}: CalculationBreakdownMiniProps) {
    const { theme } = useSettingsStore();

    return (
        <div
            className={cn(
                'flex items-center gap-2 text-xs',
                'bg-slate-900/50 px-2 py-1 rounded-full border border-slate-500/20',
            )}
            data-theme={theme}
        >
            <span className="text-slate-500">
                Subtotal: {formatCurrency(result.subtotal, currency)}
            </span>
            {result.serviceCharge > 0 && (
                <span className="text-purple-400">
                    +{formatCurrency(result.serviceCharge, currency)} SC
                </span>
            )}
            {result.deliveryFee > 0 && (
                <span className="text-orange-400">
                    +{formatCurrency(result.deliveryFee, currency)} Del
                </span>
            )}
            {result.taxAmount > 0 && (
                <span className="text-amber-400">
                    +{formatCurrency(result.taxAmount, currency)} VAT
                </span>
            )}
            {result.discountAmount > 0 && (
                <span className="text-red-400">
                    -{formatCurrency(result.discountAmount, currency)}
                </span>
            )}
            <span className="text-green-400 font-semibold">
                = {formatCurrency(result.total, currency)}
            </span>
        </div>
    );
}

export default CalculationBreakdownDisplay;
