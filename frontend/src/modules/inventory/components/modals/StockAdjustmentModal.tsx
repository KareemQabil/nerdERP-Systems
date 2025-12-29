/**
 * Stock Adjustment Modal
 * Modal for physical inventory count and adjustments with reason codes
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ClipboardCheck,
    Search,
    TrendingDown,
    TrendingUp,
    Loader2,
    Info,
    Bell,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useSettingsStore } from '@/stores/settings.store';
import { useInventoryStore } from '@/stores/inventory.store';
import { formatCurrency } from '@/lib/decimal';
import Decimal from 'decimal.js';

// =============================================================================
// Types
// =============================================================================

interface AdjustmentLine {
    id: string;
    productId: string;
    productName: string;
    systemQty: number;
    actualQty: string;
    reasonCode: string;
    avgCost: number;
}

const REASON_CODES = [
    { code: 'DAMAGED', labelKey: 'adjustment.reasons.damaged' },
    { code: 'THEFT', labelKey: 'adjustment.reasons.theft' },
    { code: 'EXPIRED', labelKey: 'adjustment.reasons.expired' },
    { code: 'STAFF_MEAL', labelKey: 'adjustment.reasons.staffMeal' },
    { code: 'COUNT_ERROR', labelKey: 'adjustment.reasons.countError' },
    { code: 'SPILLAGE', labelKey: 'adjustment.reasons.spillage' },
];

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function StockAdjustmentModal({ isOpen, onClose }: StockAdjustmentModalProps) {
    const { t } = useTranslation('inventory');
    const { theme, language } = useSettingsStore();
    const { warehouses, selectedWarehouseId, inventorySummary, createAdjustment, isSubmitting } = useInventoryStore();
    const isRTL = language === 'ar';

    // Form state
    const [warehouseId, setWarehouseId] = useState(selectedWarehouseId || '');
    const [lines, setLines] = useState<AdjustmentLine[]>([]);
    const [notes, setNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Initialize lines from inventory summary
    useEffect(() => {
        if (isOpen && inventorySummary.length > 0) {
            const initialLines: AdjustmentLine[] = inventorySummary.slice(0, 10).map(item => ({
                id: item.productId,
                productId: item.productId,
                productName: item.productName,
                systemQty: parseFloat(item.totalQty),
                actualQty: item.totalQty,
                reasonCode: '',
                avgCost: parseFloat(item.avgCost),
            }));
            setLines(initialLines);
            setWarehouseId(selectedWarehouseId || '');
            setNotes('');
        }
    }, [isOpen, inventorySummary, selectedWarehouseId]);

    // Update line
    const updateLine = (id: string, field: keyof AdjustmentLine, value: string) => {
        setLines(lines.map(line => {
            if (line.id === id) {
                return { ...line, [field]: value };
            }
            return line;
        }));
    };

    // Calculate totals
    const adjustedLines = lines.filter(line => {
        const diff = new Decimal(line.actualQty || 0).minus(line.systemQty);
        return !diff.isZero();
    });

    const totalVariance = adjustedLines.reduce((sum, line) => {
        const diff = new Decimal(line.actualQty || 0).minus(line.systemQty);
        return sum.plus(diff);
    }, new Decimal(0));

    const totalLoss = adjustedLines.reduce((sum, line) => {
        const diff = new Decimal(line.actualQty || 0).minus(line.systemQty);
        if (diff.isNegative()) {
            return sum.plus(diff.abs().times(line.avgCost));
        }
        return sum;
    }, new Decimal(0));

    // Check if loss exceeds threshold
    const lossThreshold = 500; // SAR
    const exceedsThreshold = totalLoss.greaterThan(lossThreshold);

    // Handle submit
    const handleSubmit = async () => {
        const linesToSubmit = adjustedLines.filter(line => line.reasonCode);

        if (linesToSubmit.length === 0) return;

        try {
            await createAdjustment({
                warehouseId,
                lines: linesToSubmit.map(line => ({
                    productId: line.productId,
                    systemQty: line.systemQty,
                    actualQty: parseFloat(line.actualQty),
                    reasonCode: line.reasonCode,
                })),
                notes: notes || undefined,
            });
            onClose();
        } catch (error) {
            console.error('Failed to create adjustment:', error);
        }
    };

    // Filter lines by search
    const filteredLines = lines.filter(line =>
        line.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    data-theme={theme}
                    className={cn(
                        'w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl',
                        'data-[theme=dark]:bg-[#1a1f25] data-[theme=dark]:border data-[theme=dark]:border-white/10',
                        'data-[theme=light]:bg-white',
                    )}
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    {/* Header */}
                    <div className={cn(
                        'flex items-center justify-between px-6 py-4 border-b',
                        'data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200'
                    )} data-theme={theme}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                <ClipboardCheck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className={cn(
                                    'text-lg font-bold',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-800'
                                )} data-theme={theme}>
                                    {t('adjustment.title', 'Stock Adjustment')}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
                        {/* Warehouse Selector */}
                        <div className="mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                        {t('adjustment.warehouse', 'Warehouse')}
                                    </label>
                                    <select
                                        value={warehouseId}
                                        onChange={(e) => setWarehouseId(e.target.value)}
                                        data-theme={theme}
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-lg border transition-colors',
                                            'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                            'focus:outline-none focus:ring-2 focus:ring-amber-500'
                                        )}
                                    >
                                        {warehouses.map(wh => (
                                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                        {t('search.placeholder', 'Search')}
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={t('adjustment.searchProduct', 'Search product...')}
                                            data-theme={theme}
                                            className={cn(
                                                'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm',
                                                'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                'focus:outline-none focus:ring-2 focus:ring-amber-500'
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Count Table */}
                        <div className="mb-6">
                            <h3 className={cn(
                                'text-sm font-semibold mb-4',
                                'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                            )} data-theme={theme}>
                                {t('adjustment.inventoryCount', 'Inventory Count')}
                            </h3>

                            <div
                                data-theme={theme}
                                className={cn(
                                    'rounded-lg border overflow-hidden',
                                    'data-[theme=dark]:border-white/10',
                                    'data-[theme=light]:border-slate-200'
                                )}
                            >
                                <table className="w-full">
                                    <thead>
                                        <tr data-theme={theme} className="data-[theme=dark]:bg-white/5 data-[theme=light]:bg-slate-50">
                                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase">
                                                {t('table.product', 'Product')}
                                            </th>
                                            <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase w-24">
                                                {t('adjustment.systemQty', 'System')}
                                            </th>
                                            <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase w-24">
                                                {t('adjustment.actualQty', 'Actual')}
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase w-20">
                                                {t('adjustment.diff', 'Diff')}
                                            </th>
                                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase w-40">
                                                {t('adjustment.reason', 'Reason')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLines.map((line) => {
                                            const diff = new Decimal(line.actualQty || 0).minus(line.systemQty);
                                            const hasDiff = !diff.isZero();

                                            return (
                                                <tr
                                                    key={line.id}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'border-t',
                                                        'data-[theme=dark]:border-white/5',
                                                        'data-[theme=light]:border-slate-100',
                                                        hasDiff && 'data-[theme=dark]:bg-amber-500/5 data-[theme=light]:bg-amber-50'
                                                    )}
                                                >
                                                    <td className="px-4 py-2">
                                                        <span className={cn(
                                                            'text-sm',
                                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                                        )} data-theme={theme}>
                                                            {line.productName}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-end font-mono text-sm text-gray-400">
                                                        {line.systemQty}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            value={line.actualQty}
                                                            onChange={(e) => updateLine(line.id, 'actualQty', e.target.value)}
                                                            data-theme={theme}
                                                            className={cn(
                                                                'w-full px-3 py-1.5 rounded border text-sm text-end font-mono',
                                                                'data-[theme=dark]:bg-transparent data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                                'focus:outline-none focus:ring-2 focus:ring-amber-500'
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {hasDiff && (
                                                            <span className={cn(
                                                                'inline-flex items-center gap-1 text-sm font-medium',
                                                                diff.isNegative() ? 'text-red-400' : 'text-emerald-400'
                                                            )}>
                                                                {diff.isNegative() ? (
                                                                    <TrendingDown className="w-3 h-3" />
                                                                ) : (
                                                                    <TrendingUp className="w-3 h-3" />
                                                                )}
                                                                {diff.toString()}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {hasDiff && (
                                                            <select
                                                                value={line.reasonCode}
                                                                onChange={(e) => updateLine(line.id, 'reasonCode', e.target.value)}
                                                                data-theme={theme}
                                                                className={cn(
                                                                    'w-full px-2 py-1.5 rounded border text-xs',
                                                                    !line.reasonCode ? 'border-red-500' : '',
                                                                    'data-[theme=dark]:bg-transparent data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                                    'focus:outline-none focus:ring-2 focus:ring-amber-500'
                                                                )}
                                                            >
                                                                <option value="">{t('adjustment.selectReason', 'Select...')}</option>
                                                                {REASON_CODES.map(reason => (
                                                                    <option key={reason.code} value={reason.code}>
                                                                        {t(reason.labelKey, reason.code)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Financial Impact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Summary */}
                            <div className={cn(
                                'p-4 rounded-xl border',
                                'data-[theme=dark]:border-white/10 data-[theme=dark]:bg-white/5',
                                'data-[theme=light]:border-slate-200 data-[theme=light]:bg-slate-50'
                            )} data-theme={theme}>
                                <h4 className={cn(
                                    'text-sm font-semibold mb-3',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                )} data-theme={theme}>
                                    {t('adjustment.financialImpact', 'Financial Impact')}
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('adjustment.totalAdjusted', 'Items Adjusted')}</span>
                                        <span className={cn(
                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                        )} data-theme={theme}>
                                            {adjustedLines.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('adjustment.quantityVariance', 'Qty Variance')}</span>
                                        <span className={cn(
                                            totalVariance.isNegative() ? 'text-red-400' : 'text-emerald-400'
                                        )}>
                                            {totalVariance.toString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200" data-theme={theme}>
                                        <span className="font-bold data-[theme=dark]:text-white data-[theme=light]:text-slate-800" data-theme={theme}>
                                            {t('adjustment.totalLoss', 'Total Loss')}
                                        </span>
                                        <span className="font-bold text-red-400">
                                            {formatCurrency(totalLoss.toNumber(), 'SAR', isRTL ? 'ar-SA' : 'en-SA')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Where it posts */}
                            <div className={cn(
                                'p-4 rounded-xl border',
                                'data-[theme=dark]:border-white/10 data-[theme=dark]:bg-white/5',
                                'data-[theme=light]:border-slate-200 data-[theme=light]:bg-slate-50'
                            )} data-theme={theme}>
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-400">
                                            {t('adjustment.postTo', 'This will be posted to: "Loss & Waste" P&L Account')}
                                        </p>
                                    </div>
                                </div>

                                {exceedsThreshold && (
                                    <div className={cn(
                                        'mt-3 p-3 rounded-lg flex items-center gap-3',
                                        'bg-amber-500/20 border border-amber-500/30'
                                    )}>
                                        <Bell className="w-5 h-5 text-amber-400" />
                                        <p className="text-sm text-amber-400">
                                            {t('adjustment.ownerNotification', 'Owner will receive notification: Loss exceeds threshold')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-6">
                            <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                {t('adjustment.notes', 'Notes')}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                data-theme={theme}
                                className={cn(
                                    'w-full px-4 py-2.5 rounded-lg border transition-colors resize-none',
                                    'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                    'focus:outline-none focus:ring-2 focus:ring-amber-500'
                                )}
                                placeholder={t('adjustment.notesPlaceholder', 'Add any notes about this adjustment...')}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={cn(
                        'flex items-center justify-between px-6 py-4 border-t',
                        'data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200'
                    )} data-theme={theme}>
                        <Button variant="ghost" onClick={onClose}>
                            {t('common.cancel', 'Cancel')}
                        </Button>

                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting || adjustedLines.length === 0 || adjustedLines.some(l => !l.reasonCode)}
                            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('common.processing', 'Processing...')}
                                </>
                            ) : (
                                <>
                                    <ClipboardCheck className="w-4 h-4" />
                                    {t('adjustment.postAdjustment', 'Post Adjustment')}
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default StockAdjustmentModal;
