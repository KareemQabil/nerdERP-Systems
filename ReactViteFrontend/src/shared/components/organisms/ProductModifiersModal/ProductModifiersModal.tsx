import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Product, ModifierGroup, ProductModifier, SelectedModifier } from '@/modules/products/types/product.types';
import Decimal from 'decimal.js';

export interface ProductModifiersModalProps {
    product: Product;
    onConfirm: (modifiers: SelectedModifier[], specialInstructions: string) => void;
    onClose: () => void;
}

/**
 * ProductModifiersModal Component
 * Glassmorphism modal for selecting product modifiers
 * 
 * Features (LEGACY_POS_SPEC):
 * - Modal backdrop: rgba(0,0,0,0.6) with backdrop-blur
 * - Modal content: Glass effect with gradient border
 * - Entrance animation: scale 0.9 → 1 with spring physics
 * - Selection validation: Min/Max, Required groups
 * - Real-time price calculation
 * 
 * @example
 * <ProductModifiersModal
 *   product={selectedProduct}
 *   onConfirm={handleConfirm}
 *   onClose={handleClose}
 * />
 */
export function ProductModifiersModal({
    product,
    onConfirm,
    onClose,
}: ProductModifiersModalProps) {
    const [selectedModifiers, setSelectedModifiers] = useState<Map<string, Set<string>>>(new Map());
    const [specialInstructions, setSpecialInstructions] = useState('');

    // Calculate total price
    const calculateTotalPrice = (): string => {
        let total = new Decimal(product.salePrice);

        selectedModifiers.forEach((modifierIds, groupId) => {
            const group = product.modifierGroups?.find((g) => g.id === groupId);
            if (group) {
                modifierIds.forEach((modifierId) => {
                    const modifier = group.options.find((m) => m.id === modifierId);
                    if (modifier) {
                        total = total.plus(modifier.price);
                    }
                });
            }
        });

        return total.toFixed(3);
    };

    // Toggle modifier selection
    const toggleModifier = (group: ModifierGroup, modifier: ProductModifier) => {
        setSelectedModifiers((prev) => {
            const newMap = new Map(prev);
            const groupSelections = newMap.get(group.id) || new Set<string>();

            if (group.selectionType === 'SINGLE') {
                // Single selection: replace
                newMap.set(group.id, new Set([modifier.id]));
            } else {
                // Multiple selection: toggle
                if (groupSelections.has(modifier.id)) {
                    groupSelections.delete(modifier.id);
                    if (groupSelections.size === 0) {
                        newMap.delete(group.id);
                    } else {
                        newMap.set(group.id, groupSelections);
                    }
                } else if (groupSelections.size < group.maxSelection) {
                    groupSelections.add(modifier.id);
                    newMap.set(group.id, groupSelections);
                }
            }

            return newMap;
        });
    };

    // Validate selections
    const isValid = (): boolean => {
        if (!product.modifierGroups) return true;

        for (const group of product.modifierGroups) {
            const selections = selectedModifiers.get(group.id);
            const count = selections?.size || 0;

            if (group.isRequired && count < group.minSelection) {
                return false;
            }
        }

        return true;
    };

    // Handle confirm
    const handleConfirm = () => {
        if (!isValid()) return;

        const modifiers: SelectedModifier[] = [];

        selectedModifiers.forEach((modifierIds, groupId) => {
            const group = product.modifierGroups?.find((g) => g.id === groupId);
            if (group) {
                modifierIds.forEach((modifierId) => {
                    const modifier = group.options.find((m) => m.id === modifierId);
                    if (modifier) {
                        modifiers.push({
                            modifierId: modifier.id,
                            modifierGroupId: group.id,
                            optionName: modifier.name,
                            price: modifier.price.toString(), // Convert number to string
                        });
                    }
                });
            }
        });

        onConfirm(modifiers, specialInstructions);
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[90vh] bg-[#1a1c1e] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)]">
                        <div>
                            <h2 className="text-2xl font-['Almarai'] font-bold text-[#e2e2e6]">
                                {product.name}
                            </h2>
                            <p className="text-sm text-[#c2c7ce] mt-1">
                                قم بتخصيص طلبك
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-[#c2c7ce]" />
                        </button>
                    </div>

                    {/* Body - Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {product.modifierGroups?.map((group) => {
                            const selections = selectedModifiers.get(group.id);
                            const selectionCount = selections?.size || 0;

                            return (
                                <div key={group.id} className="space-y-3">
                                    {/* Group Header */}
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-['Almarai'] font-bold text-[#e2e2e6]">
                                            {group.name}
                                            {group.isRequired && (
                                                <span className="text-red-400 mr-1">*</span>
                                            )}
                                        </h3>
                                        <span className="text-sm text-[#c2c7ce]">
                                            {group.selectionType === 'SINGLE'
                                                ? 'اختر واحد'
                                                : `${selectionCount}/${group.maxSelection}`}
                                        </span>
                                    </div>

                                    {/* Group Options */}
                                    <div className="space-y-2">
                                        {group.options.map((modifier) => {
                                            const isSelected = selections?.has(modifier.id) || false;
                                            const price = modifier.price;

                                            return (
                                                <button
                                                    key={modifier.id}
                                                    onClick={() => toggleModifier(group, modifier)}
                                                    className={cn(
                                                        'w-full p-4 rounded-xl flex items-center justify-between transition-all',
                                                        isSelected
                                                            ? 'bg-cyan-500/10 border border-cyan-400/50'
                                                            : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:border-cyan-400/30'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                                                                isSelected
                                                                    ? 'bg-cyan-400 border-cyan-400'
                                                                    : 'border-[rgba(255,255,255,0.3)]'
                                                            )}
                                                        >
                                                            {isSelected && <Check className="w-4 h-4 text-[#023047]" />}
                                                        </div>
                                                        <span className="font-['Almarai'] text-[#e2e2e6]">
                                                            {modifier.name}
                                                        </span>
                                                    </div>
                                                    {price > 0 && (
                                                        <span className="text-cyan-400 font-['Arial'] font-bold">
                                                            +{price.toFixed(2)} ر.س
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Special Instructions */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-['Almarai'] font-bold text-[#e2e2e6]">
                                ملاحظات خاصة
                            </h3>
                            <textarea
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                placeholder="أضف أي ملاحظات للمطبخ..."
                                className="w-full h-24 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-[#e2e2e6] placeholder:text-[#c2c7ce] font-['Almarai'] resize-none focus:outline-none focus:border-cyan-400/50 transition-all"
                                dir="rtl"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] space-y-4">
                        {/* Price Display */}
                        <div className="flex items-center justify-between">
                            <span className="text-lg font-['Almarai'] font-bold text-[#c2c7ce]">
                                السعر الإجمالي
                            </span>
                            <span className="text-2xl font-['Arial'] font-bold text-cyan-400">
                                {parseFloat(calculateTotalPrice()).toFixed(2)} ر.س
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 h-14 rounded-xl font-['Almarai'] font-bold text-base bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#c2c7ce] hover:bg-[rgba(255,255,255,0.1)] transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!isValid()}
                                className={cn(
                                    'flex-1 h-14 rounded-xl font-["Almarai"] font-bold text-base transition-all',
                                    isValid()
                                        ? 'bg-gradient-to-b from-[#22d3ee] to-[#006399] text-[#00373a] hover:opacity-90 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]'
                                        : 'bg-[rgba(255,255,255,0.05)] text-[#6b7280] opacity-50 cursor-not-allowed'
                                )}
                            >
                                إضافة للسلة
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
