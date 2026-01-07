/**
 * BatchDetailsModal Component
 *
 * Modal for viewing and editing batch details
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import type { InventoryBatch } from '@/services/inventory.service';

// =============================================================================
// TYPES
// =============================================================================

type QualityStatus = 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'QUARANTINE' | 'RETURNED';

interface BatchDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    batch: InventoryBatch | null;
    onSave?: (batchId: string, updates: Partial<InventoryBatch>) => Promise<void>;
}

interface FormData {
    quantity: string;
    costPerUnit: string;
    expiryDate: string;
    qualityStatus: QualityStatus;
    notes?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BatchDetailsModal({ isOpen, onClose, batch, onSave }: BatchDetailsModalProps) {
    const { language } = useSettingsStore();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        quantity: batch?.qtyRemaining || '0',
        costPerUnit: batch?.costPerUnit || '0',
        expiryDate: batch?.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '',
        qualityStatus: (batch?.qualityStatus as QualityStatus) || 'GOOD',
        notes: '',
    });

    // Reset form when batch changes
    useEffect(() => {
        if (batch && isOpen) {
            setFormData({
                quantity: batch.qtyRemaining,
                costPerUnit: batch.costPerUnit,
                expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '',
                qualityStatus: batch.qualityStatus as QualityStatus,
                notes: '',
            });
        }
    }, [batch, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!batch || !onSave) return;

        setIsSaving(true);
        try {
            await onSave(batch.id, {
                qtyRemaining: formData.quantity,
                costPerUnit: formData.costPerUnit,
                expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
                qualityStatus: formData.qualityStatus,
            });
            onClose();
        } catch (error) {
            console.error('[BatchDetailsModal] Failed to save batch:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    // Check if batch is expired
    const isExpired = batch?.expiryDate && new Date(batch.expiryDate) < new Date();

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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {language === 'ar' ? 'تفاصيل الدفعة' : 'Batch Details'}
                                </h2>
                                <p className="text-xs text-slate-400">{batch?.productName}</p>
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
                    <div className="p-4">
                        {/* Warning for expired batches */}
                        {isExpired && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-red-400 text-sm">
                                            {language === 'ar' ? 'هذه الدفعة منتهية الصلاحية' : 'This batch is expired'}
                                        </p>
                                        <p className="text-red-300 text-xs mt-1">
                                            {language === 'ar' ? 'يجب التخلص منها' : 'Should be disposed of'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Product Info (Read-only) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        {language === 'ar' ? 'المنتج' : 'Product'}
                                    </label>
                                    <div className="px-3 py-2 rounded-lg bg-slate-800 text-white">
                                        {batch?.productName}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        {language === 'ar' ? 'رقم الدفعة' : 'Batch #'}
                                    </label>
                                    <div className="px-3 py-2 rounded-lg bg-slate-800 text-white font-mono text-sm">
                                        {batch?.batchNumber || '-'}
                                    </div>
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    {language === 'ar' ? 'الكمية المتبقية' : 'Remaining Quantity'}
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>

                            {/* Cost */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    {language === 'ar' ? 'التكلفة للوحدة' : 'Cost Per Unit'}
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.costPerUnit}
                                        onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    {language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Quality Status */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    {language === 'ar' ? 'حالة الجودة' : 'Quality Status'}
                                </label>
                                <select
                                    value={formData.qualityStatus}
                                    onChange={(e) => setFormData({ ...formData, qualityStatus: e.target.value as QualityStatus })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                                >
                                    <option value="GOOD">{language === 'ar' ? 'جيد' : 'Good'}</option>
                                    <option value="DAMAGED">{language === 'ar' ? 'تالف' : 'Damaged'}</option>
                                    <option value="EXPIRED">{language === 'ar' ? 'منتهي الصلاحية' : 'Expired'}</option>
                                    <option value="QUARANTINE">{language === 'ar' ? 'حجر صحي' : 'Quarantine'}</option>
                                    <option value="RETURNED">{language === 'ar' ? 'مسترجع' : 'Returned'}</option>
                                </select>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-4 border-t border-slate-700/50">
                        <Button variant="secondary" onClick={onClose}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                />
                            ) : (
                                language === 'ar' ? 'حفظ' : 'Save'
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default BatchDetailsModal;
