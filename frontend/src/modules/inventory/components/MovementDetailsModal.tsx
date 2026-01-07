/**
 * MovementDetailsModal Component
 *
 * Modal for viewing detailed information about a stock movement
 */
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Warehouse, Calendar, User, FileText, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import type { StockMove } from '@/services/inventory.service';
import { formatCurrency } from '@/lib/decimal';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface MovementDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    movement: StockMove | null;
}

// =============================================================================
// MOVE TYPE CONFIG
// =============================================================================

const MOVE_TYPE_CONFIG: Record<string, { label: string; labelAr: string; color: string; bgColor: string }> = {
    IN: { label: 'Stock In', labelAr: 'إدخال', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30' },
    OUT: { label: 'Stock Out', labelAr: 'إخراج', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30' },
    ADJ: { label: 'Adjustment', labelAr: 'تعديل', color: 'text-purple-400', bgColor: 'bg-purple-500/20 border-purple-500/30' },
    TRANSFER: { label: 'Transfer', labelAr: 'نقل', color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30' },
    RETURN: { label: 'Return', labelAr: 'مرتجع', color: 'text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30' },
};

const REFERENCE_TYPE_LABELS: Record<string, { label: string; labelAr: string; icon: string }> = {
    SALE: { label: 'Sale', labelAr: 'بيع', icon: '🛒' },
    PO: { label: 'Purchase Order', labelAr: 'أمر شراء', icon: '📦' },
    MANUAL: { label: 'Manual Entry', labelAr: 'إدخال يدوي', icon: '✏️' },
    WASTE: { label: 'Waste/Damage', labelAr: 'هالك/تالف', icon: '⚠️' },
    RECIPE: { label: 'Recipe Usage', labelAr: 'استخدام وصفة', icon: '🍳' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function MovementDetailsModal({ isOpen, onClose, movement }: MovementDetailsModalProps) {
    const { language } = useSettingsStore();

    if (!isOpen || !movement) return null;

    const typeConfig = MOVE_TYPE_CONFIG[movement.moveType] || MOVE_TYPE_CONFIG.ADJ;
    const refConfig = REFERENCE_TYPE_LABELS[movement.referenceType] || { label: movement.referenceType, labelAr: movement.referenceType, icon: '📄' };
    const qty = parseFloat(movement.quantity);
    const isPositive = movement.moveType === 'IN' || movement.moveType === 'TRANSFER';

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
                    className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-slate-900 border border-slate-700/50"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center',
                                typeConfig.bgColor,
                            )}>
                                <span className="text-xl">{refConfig.icon}</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {language === 'ar' ? 'تفاصيل الحركة' : 'Movement Details'}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {movement.productName}
                                </p>
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
                        {/* Movement Type Badge */}
                        <div className={cn(
                            'flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2',
                            typeConfig.bgColor,
                            'border-current',
                        )}>
                            <span className={cn('text-2xl font-bold', typeConfig.color)}>
                                {isPositive ? '+' : '-'}{Math.abs(qty).toLocaleString()}
                            </span>
                            <span className={cn('text-sm font-bold', typeConfig.color)}>
                                {language === 'ar' ? typeConfig.labelAr : typeConfig.label}
                            </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Product */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <Package className="w-3 h-3" />
                                    <span>{language === 'ar' ? 'المنتج' : 'Product'}</span>
                                </div>
                                <p className="text-white font-medium">{movement.productName || '-'}</p>
                            </div>

                            {/* Warehouse */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <Warehouse className="w-3 h-3" />
                                    <span>{language === 'ar' ? 'المستودع' : 'Warehouse'}</span>
                                </div>
                                <p className="text-white font-medium">{movement.warehouseName || '-'}</p>
                            </div>

                            {/* Date/Time */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <Calendar className="w-3 h-3" />
                                    <span>{language === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</span>
                                </div>
                                <p className="text-white text-sm">
                                    {new Date(movement.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-slate-400 text-xs">
                                    {new Date(movement.createdAt).toLocaleTimeString()}
                                </p>
                            </div>

                            {/* Cost Per Unit (if available) */}
                            {movement.costPerUnit && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                        <span>💰</span>
                                        <span>{language === 'ar' ? 'التكلفة للوحدة' : 'Cost Per Unit'}</span>
                                    </div>
                                    <p className="text-white font-medium">
                                        {formatCurrency(parseFloat(movement.costPerUnit))}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Reference Info */}
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                                <FileText className="w-3 h-3" />
                                <span>{language === 'ar' ? 'المرجع' : 'Reference'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-300">
                                        {language === 'ar' ? refConfig.labelAr : refConfig.label}
                                    </p>
                                    {movement.referenceId && (
                                        <p className="text-xs font-mono text-slate-500 mt-1">
                                            {movement.referenceId}
                                        </p>
                                    )}
                                </div>
                                <span className="text-2xl">{refConfig.icon}</span>
                            </div>
                        </div>

                        {/* Batch Info (if available) */}
                        {movement.batchId && (
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                                    <Package className="w-3 h-3" />
                                    <span>{language === 'ar' ? 'الدفعة' : 'Batch'}</span>
                                </div>
                                <p className="text-sm font-mono text-white">{movement.batchId}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end p-4 border-t border-slate-700/50">
                        <Button variant="secondary" onClick={onClose}>
                            {language === 'ar' ? 'إغلاق' : 'Close'}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default MovementDetailsModal;
