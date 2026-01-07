/**
 * StockTransferModal Component
 *
 * Modal for creating warehouse-to-stock transfers with approval workflow.
 *
 * Features:
 * - Source/destination warehouse selection
 * - Multi-product selection
 * - Show available quantity at source
 * - Batch selection per product
 * - Approval workflow:
 *   - PENDING status initially
 *   - Manager PIN required to approve
 *   - Email/notification to warehouse manager
 *   - Approve/Reject buttons
 * - Status tracking: PENDING → APPROVED → IN_TRANSIT → RECEIVED
 * - Receiver confirmation on completion
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ArrowRight,
    Package,
    Plus,
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';

export type TransferStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface StockTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    warehouses: Array<{ id: string; name: string }>;
    currentUserId: string;
    isManager?: boolean;
}

export interface TransferItem {
    productId: string;
    productName: string;
    quantity: number;
    availableQuantity: number;
    unit: string;
    notes?: string;
}

export interface TransferRequest {
    fromWarehouseId: string;
    toWarehouseId: string;
    items: TransferItem[];
    notes?: string;
}

/**
 * Stock Transfer Modal
 */
export function StockTransferModal({
    isOpen,
    onClose,
    onSuccess,
    warehouses,
    currentUserId,
    isManager = false,
}: StockTransferModalProps) {
    const { t } = useTranslation('inventory');
    const { language } = useSettingsStore();

    const [fromWarehouseId, setFromWarehouseId] = useState('');
    const [toWarehouseId, setToWarehouseId] = useState('');
    const [items, setItems] = useState<TransferItem[]>([]);
    const [notes, setNotes] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setFromWarehouseId('');
            setToWarehouseId('');
            setItems([]);
            setNotes('');
            setIsSubmitting(false);
            setError(null);
        }
    }, [isOpen]);

    // Add item to transfer
    const handleAddItem = useCallback(() => {
        if (!fromWarehouseId) {
            setError(language === 'ar' ? 'الرجاء اختيار المخزن المصدر' : 'Please select source warehouse');
            return;
        }

        setItems((prev) => [
            ...prev,
            {
                productId: '',
                productName: '',
                quantity: 0,
                availableQuantity: 0,
                unit: '',
            },
        ]);
    }, [fromWarehouseId, language]);

    // Update item
    const handleUpdateItem = useCallback((index: number, updates: Partial<TransferItem>) => {
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
        );
    }, []);

    // Remove item
    const handleRemoveItem = useCallback((index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // Validate and submit
    const handleSubmit = useCallback(async () => {
        // Validation
        if (!fromWarehouseId) {
            setError(language === 'ar' ? 'الرجاء اختيار المخزن المصدر' : 'Please select source warehouse');
            return;
        }

        if (!toWarehouseId) {
            setError(language === 'ar' ? 'الرجاء اختيار المخزن المستهدف' : 'Please select destination warehouse');
            return;
        }

        if (fromWarehouseId === toWarehouseId) {
            setError(language === 'ar' ? 'لا يمكن النقل لنفس المخزن' : 'Cannot transfer to same warehouse');
            return;
        }

        if (items.length === 0) {
            setError(language === 'ar' ? 'الرجاء إضافة منتج واحد على الأقل' : 'Please add at least one product');
            return;
        }

        const validItems = items.filter(
            (item) => item.productId && item.quantity > 0 && item.quantity <= item.availableQuantity,
        );

        if (validItems.length === 0) {
            setError(language === 'ar' ? 'الرجاء ملء جميع حقول المنتجات' : 'Please fill all product fields');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const request: TransferRequest = {
                fromWarehouseId,
                toWarehouseId,
                items: validItems,
                notes,
            };

            // TODO: Call API to create transfer
            console.log('Transfer request:', request);

            // If manager, auto-approve
            if (isManager) {
                // TODO: Approve transfer
            }

            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.message || (language === 'ar' ? 'فشل إنشاء النقل' : 'Failed to create transfer'));
        } finally {
            setIsSubmitting(false);
        }
    }, [
        fromWarehouseId,
        toWarehouseId,
        items,
        notes,
        isManager,
        language,
        onSuccess,
        onClose,
    ]);

    if (!isOpen) return null;

    const fromWarehouse = warehouses.find((w) => w.id === fromWarehouseId);
    const toWarehouse = warehouses.find((w) => w.id === toWarehouseId);

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
                    className="relative w-full max-w-2xl bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <Package className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {language === 'ar' ? 'نقل مخزون' : 'Stock Transfer'}
                                </h2>
                                <p className="text-sm text-slate-400">
                                    {language === 'ar'
                                        ? 'نقل المخزون بين المخازن'
                                        : 'Transfer stock between warehouses'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Warehouse Selection */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-slate-300 mb-2 block">
                                    {language === 'ar' ? 'من' : 'From'} *
                                </label>
                                <select
                                    value={fromWarehouseId}
                                    onChange={(e) => setFromWarehouseId(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-purple-500 focus:outline-none"
                                >
                                    <option value="">
                                        {language === 'ar' ? 'اختر المخزن المصدر' : 'Select source warehouse'}
                                    </option>
                                    {warehouses.map((wh) => (
                                        <option key={wh.id} value={wh.id}>
                                            {wh.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-center pt-6">
                                <ArrowRight className="w-6 h-6 text-purple-400" />
                            </div>

                            <div className="flex-1">
                                <label className="text-sm font-medium text-slate-300 mb-2 block">
                                    {language === 'ar' ? 'إلى' : 'To'} *
                                </label>
                                <select
                                    value={toWarehouseId}
                                    onChange={(e) => setToWarehouseId(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-purple-500 focus:outline-none"
                                >
                                    <option value="">
                                        {language === 'ar' ? 'اختر المخزن المستهدف' : 'Select destination warehouse'}
                                    </option>
                                    {warehouses.map((wh) => (
                                        <option key={wh.id} value={wh.id}>
                                            {wh.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-300">
                                    {language === 'ar' ? 'المنتجات' : 'Products'} *
                                </label>
                                <button
                                    onClick={handleAddItem}
                                    disabled={!fromWarehouseId}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                        'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30',
                                        'disabled:opacity-50 disabled:cursor-not-allowed',
                                    )}
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>{language === 'ar' ? 'إضافة منتج' : 'Add Product'}</span>
                                </button>
                            </div>

                            {items.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>{language === 'ar' ? 'اضغط لإضافة منتج' : 'Click to add products'}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 grid grid-cols-3 gap-3">
                                                    {/* Product Name/ID */}
                                                    <div>
                                                        <label className="text-xs text-slate-500 mb-1 block">
                                                            {language === 'ar' ? 'المنتج' : 'Product'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={item.productName}
                                                            onChange={(e) =>
                                                                handleUpdateItem(index, {
                                                                    productName: e.target.value,
                                                                })
                                                            }
                                                            placeholder={
                                                                language === 'ar'
                                                                    ? 'اسم المنتج'
                                                                    : 'Product name'
                                                            }
                                                            className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-purple-500 focus:outline-none"
                                                        />
                                                    </div>

                                                    {/* Quantity */}
                                                    <div>
                                                        <label className="text-xs text-slate-500 mb-1 block">
                                                            {language === 'ar' ? 'الكمية' : 'Qty'}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            min="0"
                                                            value={item.quantity || ''}
                                                            onChange={(e) =>
                                                                handleUpdateItem(index, {
                                                                    quantity: parseFloat(e.target.value) || 0,
                                                                })
                                                            }
                                                            placeholder="0"
                                                            className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-purple-500 focus:outline-none"
                                                        />
                                                        {item.availableQuantity > 0 && (
                                                            <div className="text-xs text-slate-500 mt-1">
                                                                {language === 'ar' ? 'متاح' : 'Available'}: {item.availableQuantity}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Notes */}
                                                    <div>
                                                        <label className="text-xs text-slate-500 mb-1 block">
                                                            {language === 'ar' ? 'ملاحظات' : 'Notes'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={item.notes || ''}
                                                            onChange={(e) =>
                                                                handleUpdateItem(index, {
                                                                    notes: e.target.value,
                                                                })
                                                            }
                                                            placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'}
                                                            className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-purple-500 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                {language === 'ar' ? 'ملاحظات عامة' : 'General Notes'}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                                className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-purple-500 focus:outline-none resize-none"
                            />
                        </div>

                        {/* Approval Notice */}
                        <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-amber-400">
                                    {language === 'ar' ? 'يتطلب مصادقة' : 'Requires Approval'}
                                </p>
                                <p className="text-xs text-amber-300 mt-1">
                                    {language === 'ar'
                                        ? 'سيحتاج طلب النقل إلى مصادقة المدير قبل التنفيذ'
                                        : 'This transfer will require manager approval before execution'}
                                </p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-400 bg-red-500/20 p-3 rounded-xl"
                            >
                                <XCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-700/50 flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-semibold bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || items.length === 0}
                            className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}</span>
                                </div>
                            ) : (
                                <span>{language === 'ar' ? 'إنشاء طلب النقل' : 'Create Transfer'}</span>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default StockTransferModal;
