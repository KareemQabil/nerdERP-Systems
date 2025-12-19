import { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Product } from '@/modules/products/types/product.types';
import { mockModifierGroups } from '@/modules/menu/data/mock-modifiers';
import Decimal from 'decimal.js';

export interface ProductDetailsModalProps {
    product: Product;
    onClose: () => void;
    onAddToCart: (product: Product, quantity: string, modifiers: any[], instructions: string) => void;
}

/**
 * ProductDetailsModal Component
 * Glassmorphic modal for selecting modifiers before adding to cart
 * 
 * Features:
 * - Radio buttons for single-select modifiers (Size, Milk)
 * - Checkboxes for multi-select modifiers (Add-ons)
 * - Quantity selector
 * - Real-time price calculation
 * - Clear price breakdown
 */
export function ProductDetailsModal({ product, onClose, onAddToCart }: ProductDetailsModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
    const [specialInstructions, setSpecialInstructions] = useState('');

    // Initialize default selections (first option for required single-select groups)
    useEffect(() => {
        const defaults: Record<string, string[]> = {};
        mockModifierGroups.forEach(group => {
            if (group.minSelection === 1 && group.maxSelection === 1) {
                // Auto-select first option for required radio groups
                defaults[group.id] = [group.options[0].id];
            }
        });
        setSelectedModifiers(defaults);
    }, []);

    // Handle radio button selection (single-select)
    const handleRadioSelect = (groupId: string, optionId: string) => {
        setSelectedModifiers(prev => ({
            ...prev,
            [groupId]: [optionId],
        }));
    };

    // Handle checkbox toggle (multi-select)
    const handleCheckboxToggle = (groupId: string, optionId: string, maxSelection: number) => {
        setSelectedModifiers(prev => {
            const current = prev[groupId] || [];
            const isSelected = current.includes(optionId);

            if (isSelected) {
                // Remove
                return {
                    ...prev,
                    [groupId]: current.filter(id => id !== optionId),
                };
            } else {
                // Add (check max limit)
                if (current.length < maxSelection) {
                    return {
                        ...prev,
                        [groupId]: [...current, optionId],
                    };
                }
                return prev; // Max reached
            }
        });
    };

    // Calculate total price
    const calculateTotal = () => {
        const basePrice = new Decimal(product.salePrice);
        let modifiersTotal = new Decimal(0);

        Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
            const group = mockModifierGroups.find(g => g.id === groupId);
            if (group) {
                optionIds.forEach(optionId => {
                    const option = group.options.find(opt => opt.id === optionId);
                    if (option) {
                        modifiersTotal = modifiersTotal.plus(option.price);
                    }
                });
            }
        });

        const priceWithModifiers = basePrice.plus(modifiersTotal);
        const total = priceWithModifiers.times(quantity);

        return {
            basePrice: basePrice.toFixed(2),
            modifiersTotal: modifiersTotal.toFixed(2),
            total: total.toFixed(2),
        };
    };

    const handleAddToCart = () => {
        // Convert selected modifiers to cart format
        const modifiersForCart: any[] = [];

        Object.entries(selectedModifiers).forEach(([groupId, optionIds]) => {
            const group = mockModifierGroups.find(g => g.id === groupId);
            if (group) {
                optionIds.forEach(optionId => {
                    const option = group.options.find(opt => opt.id === optionId);
                    if (option) {
                        modifiersForCart.push({
                            modifierId: group.id,
                            modifierName: group.nameAr,
                            optionId: option.id,
                            optionName: option.nameAr,
                            price: option.price,
                        });
                    }
                });
            }
        });

        onAddToCart(product, quantity.toFixed(3), modifiersForCart, specialInstructions);
        onClose();
    };

    const prices = calculateTotal();

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl max-h-[85vh] bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 left-6 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 group"
                >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>

                {/* Header */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">☕</div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white font-['Almarai'] mb-2">{product.name}</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-cyan-400 font-mono">{prices.basePrice} SAR</span>
                                <span className="text-xs text-gray-500">سعر أساسي</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {mockModifierGroups.map(group => (
                        <div key={group.id} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white font-['Almarai']">{group.nameAr}</h3>
                                {group.minSelection > 0 && (
                                    <span className="text-xs text-red-400">مطلوب</span>
                                )}
                            </div>

                            {/* Radio Buttons (Single Select) */}
                            {group.maxSelection === 1 && (
                                <div className="space-y-2">
                                    {group.options.map(option => {
                                        const isSelected = selectedModifiers[group.id]?.includes(option.id);
                                        const optionPrice = parseFloat(option.price);

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleRadioSelect(group.id, option.id)}
                                                className={cn(
                                                    'w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between',
                                                    isSelected
                                                        ? 'bg-cyan-500/20 border-cyan-400/50'
                                                        : 'bg-white/5 border-white/10 hover:border-cyan-400/30'
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                                        isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-gray-400'
                                                    )}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="text-sm text-white">{option.nameAr}</span>
                                                </div>
                                                {optionPrice > 0 && (
                                                    <span className="text-sm text-amber-400 font-mono">+{optionPrice.toFixed(2)}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Checkboxes (Multi Select) */}
                            {group.maxSelection > 1 && (
                                <div className="space-y-2">
                                    {group.options.map(option => {
                                        const isSelected = selectedModifiers[group.id]?.includes(option.id);
                                        const optionPrice = parseFloat(option.price);

                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => handleCheckboxToggle(group.id, option.id, group.maxSelection)}
                                                className={cn(
                                                    'w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between',
                                                    isSelected
                                                        ? 'bg-orange-500/20 border-orange-400/50'
                                                        : 'bg-white/5 border-white/10 hover:border-orange-400/30'
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        'w-5 h-5 rounded border-2 flex items-center justify-center',
                                                        isSelected ? 'border-orange-400 bg-orange-400' : 'border-gray-400'
                                                    )}>
                                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <span className="text-sm text-white">{option.nameAr}</span>
                                                </div>
                                                {optionPrice > 0 && (
                                                    <span className="text-sm text-amber-400 font-mono">+{optionPrice.toFixed(2)}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Special Instructions */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white font-['Almarai']">ملاحظات خاصة</label>
                        <textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="مثال: بدون سكر، ثلج قليل..."
                            className="w-full h-20 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400/50 font-['Almarai'] resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm border-t border-white/5">
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-400 font-['Almarai']">الكمية</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                            >
                                <Minus className="w-4 h-4 text-gray-400" />
                            </button>
                            <span className="text-xl font-bold text-white font-mono w-12 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 flex items-center justify-center transition-colors"
                            >
                                <Plus className="w-4 h-4 text-cyan-400" />
                            </button>
                        </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={handleAddToCart}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/30 text-white font-bold text-lg font-['Almarai'] transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                    >
                        أضف للسلة - {prices.total} SAR
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
