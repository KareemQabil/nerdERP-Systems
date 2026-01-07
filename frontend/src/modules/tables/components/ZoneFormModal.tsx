/**
 * ZoneFormModal Component
 *
 * Modal for creating table zones
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Layers,
    Palette,
    Hash,
    Save,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { tablesService, type TableZone, type CreateTableZoneDto } from '@/services/tables.service';

// =============================================================================
// TYPES
// =============================================================================

interface ZoneFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (zone: TableZone) => void;
    storeId: string;
}

// Predefined color palette
const COLOR_PALETTE = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ZoneFormModal({
    isOpen,
    onClose,
    onSuccess,
    storeId,
}: ZoneFormModalProps) {
    const { language } = useSettingsStore();
    const isRTL = language === 'ar';

    const [zoneName, setZoneName] = useState('');
    const [color, setColor] = useState(COLOR_PALETTE[4]); // Default cyan
    const [displayOrder, setDisplayOrder] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (!zoneName.trim()) {
                throw new Error(isRTL ? 'اسم المنطقة مطلوب' : 'Zone name is required');
            }

            const dto: CreateTableZoneDto = {
                zoneName: zoneName.trim(),
                color,
                displayOrder,
                storeId,
            };

            const result = await tablesService.createZone(dto);
            onSuccess(result);

            // Reset form
            setZoneName('');
            setColor(COLOR_PALETTE[4]);
            setDisplayOrder(1);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create zone');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-md bg-gradient-to-b from-[#1a1c1e] to-[#2a2f35] rounded-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {isRTL ? 'إضافة منطقة' : 'Add Zone'}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {isRTL ? 'إنشاء منطقة جديدة للطاولات' : 'Create a new table zone'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Zone Name */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                {isRTL ? 'اسم المنطقة' : 'Zone Name'}
                            </label>
                            <input
                                type="text"
                                value={zoneName}
                                onChange={(e) => setZoneName(e.target.value)}
                                placeholder={isRTL ? 'مثال: الصالة الرئيسية' : 'e.g. Main Dining'}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                                autoFocus
                            />
                        </div>

                        {/* Color */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                {isRTL ? 'اللون' : 'Color'}
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {COLOR_PALETTE.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={cn(
                                            'w-10 h-10 rounded-lg transition-all',
                                            color === c
                                                ? 'ring-2 ring-white ring-offset-2 ring-offset-[#2a2f35] scale-110'
                                                : 'hover:scale-105'
                                        )}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Display Order */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                {isRTL ? 'ترتيب العرض' : 'Display Order'}
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={displayOrder}
                                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                className="flex-1"
                            >
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {isRTL ? 'إضافة' : 'Add Zone'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ZoneFormModal;
