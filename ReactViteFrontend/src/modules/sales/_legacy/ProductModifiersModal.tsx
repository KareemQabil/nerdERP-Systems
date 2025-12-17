import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';
import type { ModifierGroup, ProductModifier } from '../types/pos.types';
import { useState, useEffect } from 'react';
import { ModifierService } from '@/modules/products/services/modifier.service';

interface ProductModifiersModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    onConfirm: (selectedModifiers: ProductModifier[], specialInstructions: string) => void;
}

export function ProductModifiersModal({
    isOpen,
    onClose,
    productId,
    productName,
    onConfirm,
}: ProductModifiersModalProps) {
    const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
    const [selectedModifiers, setSelectedModifiers] = useState<Map<string, ProductModifier>>(new Map());
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadModifiers();
            setSelectedModifiers(new Map());
            setSpecialInstructions('');
        }
    }, [isOpen, productId]);

    const loadModifiers = async () => {
        setIsLoading(true);
        try {
            const groups = await ModifierService.getModifierGroups(productId);
            setModifierGroups(groups);
        } catch (error) {
            console.error('Error loading modifiers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const toggleModifier = (groupId: string, modifier: ProductModifier, group: ModifierGroup) => {
        const newSelected = new Map(selectedModifiers);
        const key = `${groupId}-${modifier.id}`;

        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            // Check max selection for group
            const groupSelections = Array.from(newSelected.keys()).filter(k => k.startsWith(`${groupId}-`));
            if (groupSelections.length >= group.maxSelection) {
                // Remove oldest selection if at max
                const oldestKey = groupSelections[0];
                newSelected.delete(oldestKey);
            }
            newSelected.set(key, modifier);
        }

        setSelectedModifiers(newSelected);
    };

    const isGroupValid = (group: ModifierGroup): boolean => {
        const groupSelections = Array.from(selectedModifiers.keys()).filter(k =>
            k.startsWith(`${group.id}-`)
        );
        return groupSelections.length >= group.minSelection;
    };

    const canConfirm = modifierGroups.every(group => !group.isRequired || isGroupValid(group));

    const handleConfirm = () => {
        const modifiers = Array.from(selectedModifiers.values());
        onConfirm(modifiers, specialInstructions);
        onClose();
    };

    const totalModifierPrice = Array.from(selectedModifiers.values()).reduce(
        (sum, mod) => sum + mod.price,
        0
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[85vh] bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--outline-variant)] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[var(--surface-variant)] border-b border-[var(--outline-variant)] flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                تخصيص الطلب
                            </h2>
                            <p className="text-sm text-[var(--on-surface-variant)] font-['Almarai']" dir="auto">
                                {productName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl hover:bg-[var(--surface)] transition-colors flex items-center justify-center"
                        >
                            <X className="w-5 h-5 text-[var(--on-surface-variant)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent" />
                            </div>
                        ) : modifierGroups.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-[var(--on-surface-variant)] font-['Almarai']" dir="auto">
                                    لا توجد خيارات تخصيص لهذا المنتج
                                </p>
                            </div>
                        ) : (
                            modifierGroups.map((group) => {
                                const groupSelections = Array.from(selectedModifiers.keys()).filter(k =>
                                    k.startsWith(`${group.id}-`)
                                );

                                return (
                                    <div key={group.id} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-base font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                                    {group.name}
                                                    {group.isRequired && <span className="text-red-500 mr-1">*</span>}
                                                </h3>
                                                <p className="text-xs text-[var(--on-surface-variant)] font-['Almarai']" dir="auto">
                                                    {group.minSelection === group.maxSelection
                                                        ? `اختر ${group.minSelection}`
                                                        : `اختر ${group.minSelection} - ${group.maxSelection}`}
                                                </p>
                                            </div>
                                            <span className="text-xs text-cyan-400 font-['Arial']">
                                                {groupSelections.length}/{group.maxSelection}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {group.options.map((modifier) => {
                                                const key = `${group.id}-${modifier.id}`;
                                                const isSelected = selectedModifiers.has(key);

                                                return (
                                                    <motion.button
                                                        key={modifier.id}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => toggleModifier(group.id, modifier, group)}
                                                        className={`p-4 rounded-xl border-2 transition-all ${isSelected
                                                            ? 'bg-cyan-400/10 border-cyan-400 shadow-lg'
                                                            : 'bg-[var(--surface-variant)] border-[var(--outline-variant)] hover:border-cyan-400/50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                                                {modifier.name}
                                                            </span>
                                                            <div
                                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected
                                                                    ? 'bg-cyan-400 border-cyan-400'
                                                                    : 'border-[var(--outline-variant)]'
                                                                    }`}
                                                            >
                                                                {isSelected && <Check className="w-3 h-3 text-[#00373a]" />}
                                                            </div>
                                                        </div>
                                                        {modifier.price > 0 && (
                                                            <p className="text-xs text-cyan-400 font-['Arial']">
                                                                +{modifier.price.toFixed(2)} ر.س
                                                            </p>
                                                        )}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Special Instructions */}
                        <div>
                            <label className="block text-sm font-['Almarai'] font-bold text-[var(--on-surface)] mb-2" dir="auto">
                                ملاحظات خاصة (اختياري)
                            </label>
                            <textarea
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                placeholder="مثال: بدون ملح، استعجال، إلخ..."
                                className="w-full px-4 py-3 bg-[var(--surface-variant)] border border-[var(--outline-variant)] rounded-xl text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] font-['Almarai'] focus:outline-none focus:border-cyan-400 resize-none transition-colors"
                                rows={3}
                                dir="rtl"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-[var(--outline-variant)] flex-shrink-0 space-y-3">
                        {totalModifierPrice > 0 && (
                            <div className="flex items-center justify-between bg-cyan-400/10 rounded-xl p-3">
                                <span className="text-sm font-['Almarai'] text-[var(--on-surface)]" dir="auto">
                                    إجمالي الإضافات
                                </span>
                                <span className="text-lg font-['Arial'] font-bold text-cyan-400">
                                    +{totalModifierPrice.toFixed(2)} ر.س
                                </span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirm}
                                disabled={!canConfirm}
                                className="flex-1 h-14 rounded-xl bg-gradient-to-b from-cyan-400 to-blue-600 text-[#00373a] font-['Almarai'] font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                                <span dir="auto">إضافة للطلب</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 h-14 rounded-xl bg-[var(--surface-variant)] hover:bg-[var(--outline-variant)] text-[var(--on-surface)] font-['Almarai'] font-bold transition-colors"
                            >
                                <span dir="auto">إلغاء</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
