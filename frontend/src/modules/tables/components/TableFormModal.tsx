/**
 * TableFormModal Component
 *
 * Modal for creating and editing tables
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Hash,
    Users,
    Layers,
    Square,
    Circle,
    Save,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { tablesService, type Table, type TableZone, type CreateTableDto, type FloorPosition } from '@/services/tables.service';

// =============================================================================
// TYPES
// =============================================================================

interface TableFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (table: Table) => void;
    table?: Table | null; // If editing
    zones: TableZone[];
    storeId: string;
}

type TableShape = 'rectangle' | 'circle' | 'oval';

interface FormData {
    tableNumber: string;
    minSeats: number;
    maxSeats: number;
    zoneId: string;
    shape: TableShape;
}

// =============================================================================
// SHAPE OPTIONS
// =============================================================================

const SHAPE_OPTIONS: Array<{ value: TableShape; label: string; labelAr: string; icon: typeof Square }> = [
    { value: 'rectangle', label: 'Rectangle', labelAr: 'مستطيل', icon: Square },
    { value: 'circle', label: 'Circle', labelAr: 'دائرة', icon: Circle },
    { value: 'oval', label: 'Oval', labelAr: 'بيضاوي', icon: Circle },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function TableFormModal({
    isOpen,
    onClose,
    onSuccess,
    table,
    zones,
    storeId,
}: TableFormModalProps) {
    const { language } = useSettingsStore();
    const isRTL = language === 'ar';
    const isEditing = !!table;

    const [formData, setFormData] = useState<FormData>({
        tableNumber: '',
        minSeats: 2,
        maxSeats: 4,
        zoneId: '',
        shape: 'rectangle',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Populate form when editing
    useEffect(() => {
        if (table) {
            setFormData({
                tableNumber: table.tableNumber,
                minSeats: table.minSeats,
                maxSeats: table.maxSeats,
                zoneId: table.zoneId || '',
                shape: table.floorPosition?.shape || 'rectangle',
            });
        } else {
            setFormData({
                tableNumber: '',
                minSeats: 2,
                maxSeats: 4,
                zoneId: zones[0]?.id || '',
                shape: 'rectangle',
            });
        }
    }, [table, zones, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Validation
            if (!formData.tableNumber.trim()) {
                throw new Error(isRTL ? 'رقم الطاولة مطلوب' : 'Table number is required');
            }

            if (formData.minSeats < 1) {
                throw new Error(isRTL ? 'الحد الأدنى للمقاعد يجب أن يكون 1 على الأقل' : 'Minimum seats must be at least 1');
            }

            if (formData.maxSeats < formData.minSeats) {
                throw new Error(isRTL ? 'الحد الأقصى يجب أن يكون أكبر من الحد الأدنى' : 'Max seats must be >= min seats');
            }

            const floorPosition: FloorPosition = {
                x: Math.random() * 400 + 100, // Random position for new tables
                y: Math.random() * 300 + 100,
                width: formData.shape === 'circle' ? 80 : 120,
                height: 80,
                shape: formData.shape,
            };

            const dto: CreateTableDto = {
                tableNumber: formData.tableNumber.trim(),
                minSeats: formData.minSeats,
                maxSeats: formData.maxSeats,
                zoneId: formData.zoneId || undefined,
                floorPosition,
                storeId,
            };

            // TODO: If editing, call updateTable instead
            const result = await tablesService.createTable(dto);
            onSuccess(result);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save table');
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
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                <Hash className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {isEditing
                                        ? (isRTL ? 'تعديل طاولة' : 'Edit Table')
                                        : (isRTL ? 'إضافة طاولة' : 'Add Table')}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {isRTL ? 'أدخل بيانات الطاولة' : 'Enter table details'}
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

                        {/* Table Number */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                {isRTL ? 'رقم الطاولة' : 'Table Number'}
                            </label>
                            <input
                                type="text"
                                value={formData.tableNumber}
                                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                                placeholder={isRTL ? 'مثال: 1، A1' : 'e.g. 1, A1'}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                            />
                        </div>

                        {/* Seats Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {isRTL ? 'الحد الأدنى' : 'Min Seats'}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={formData.minSeats}
                                    onChange={(e) => setFormData({ ...formData, minSeats: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    {isRTL ? 'الحد الأقصى' : 'Max Seats'}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={formData.maxSeats}
                                    onChange={(e) => setFormData({ ...formData, maxSeats: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Zone */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                {isRTL ? 'المنطقة' : 'Zone'}
                            </label>
                            <select
                                value={formData.zoneId}
                                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="">{isRTL ? 'بدون منطقة' : 'No Zone'}</option>
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>
                                        {zone.zoneName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Shape */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">
                                {isRTL ? 'الشكل' : 'Shape'}
                            </label>
                            <div className="flex gap-2">
                                {SHAPE_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, shape: option.value })}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all',
                                            formData.shape === option.value
                                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        )}
                                    >
                                        <option.icon className="w-4 h-4" />
                                        <span className="text-sm">{isRTL ? option.labelAr : option.label}</span>
                                    </button>
                                ))}
                            </div>
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
                                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {isEditing ? (isRTL ? 'حفظ' : 'Save') : (isRTL ? 'إضافة' : 'Add')}
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

export default TableFormModal;
