import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, MessageSquare, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Decimal from 'decimal.js';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';
import { addItem, type ProductInfo, type CartItemModifier } from '@/features/pos/slices/cartSlice';
import type { ModifierGroup, Modifier } from '@/features/pos/types';

interface ModifierModalProps {
    product: ProductInfo;
    isOpen: boolean;
    onClose: () => void;
}

interface SelectedModifiers {
    [groupId: string]: string[]; // Array of modifier IDs
}

export function ModifierModal({ product, isOpen, onClose }: ModifierModalProps) {
    const { t, i18n } = useTranslation('pos');
    const dispatch = useAppDispatch();
    const { theme } = useAppSelector(selectSettings);
    const isRTL = i18n.dir() === 'rtl';

    const [quantity, setQuantity] = useState(1);
    const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifiers>(() => {
        // Initialize with default selections
        const initial: SelectedModifiers = {};
        product.modifierGroups.forEach((group) => {
            const defaults = group.modifiers
                .filter((m) => m.isDefault)
                .map((m) => m.id);
            if (defaults.length > 0) {
                initial[group.id] = defaults;
            } else {
                initial[group.id] = [];
            }
        });
        return initial;
    });
    const [instructions, setInstructions] = useState('');

    // Calculate if all required modifiers are selected
    const validationErrors = useMemo(() => {
        const errors: string[] = [];
        product.modifierGroups.forEach((group) => {
            if (group.isRequired) {
                const selected = selectedModifiers[group.id] || [];
                if (selected.length < group.minSelections) {
                    errors.push(
                        `${isRTL && group.nameAr ? group.nameAr : group.name}: Select at least ${group.minSelections}`
                    );
                }
            }
        });
        return errors;
    }, [selectedModifiers, product.modifierGroups, isRTL]);

    const isValid = validationErrors.length === 0;

    // Calculate total price
    const priceBreakdown = useMemo(() => {
        const basePrice = new Decimal(product.salePrice);
        let modifiersTotal = new Decimal(0);

        Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
            const group = product.modifierGroups.find((g) => g.id === groupId);
            if (!group) return;

            modifierIds.forEach((modId) => {
                const modifier = group.modifiers.find((m) => m.id === modId);
                if (modifier && !modifier.isNegative) {
                    modifiersTotal = modifiersTotal.plus(modifier.priceAdjustment);
                }
            });
        });

        const unitPrice = basePrice.plus(modifiersTotal);
        const lineTotal = unitPrice.times(quantity);

        return {
            basePrice: basePrice.toFixed(3),
            modifiersTotal: modifiersTotal.toFixed(3),
            unitPrice: unitPrice.toFixed(3),
            lineTotal: lineTotal.toFixed(3),
        };
    }, [product, selectedModifiers, quantity]);

    // Toggle modifier selection
    const toggleModifier = useCallback((group: ModifierGroup, modifier: Modifier) => {
        setSelectedModifiers((prev) => {
            const current = prev[group.id] || [];

            if (group.selectionType === 'SINGLE') {
                // Single select - replace
                return { ...prev, [group.id]: [modifier.id] };
            } else {
                // Multiple select - toggle
                if (current.includes(modifier.id)) {
                    return { ...prev, [group.id]: current.filter((id) => id !== modifier.id) };
                } else {
                    // Check max selections
                    if (group.maxSelections > 0 && current.length >= group.maxSelections) {
                        return prev; // Max reached
                    }
                    return { ...prev, [group.id]: [...current, modifier.id] };
                }
            }
        });
    }, []);

    // Handle add to cart
    const handleAddToCart = useCallback(() => {
        if (!isValid) return;

        // Build CartItemModifier array
        const cartModifiers: CartItemModifier[] = [];
        Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
            const group = product.modifierGroups.find((g) => g.id === groupId);
            if (!group) return;

            modifierIds.forEach((modId) => {
                const modifier = group.modifiers.find((m) => m.id === modId);
                if (modifier) {
                    cartModifiers.push({
                        modifierId: modifier.id,
                        modifierName: modifier.name,
                        modifierNameAr: modifier.nameAr,
                        modifierGroupId: group.id,
                        modifierGroupName: group.name,
                        priceAdjustment: modifier.priceAdjustment,
                        isNegative: modifier.isNegative,
                    });
                }
            });
        });

        dispatch(addItem({ product, quantity, modifiers: cartModifiers, instructions: instructions || undefined }));
        onClose();
    }, [isValid, selectedModifiers, product, quantity, instructions, dispatch, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                data-theme={theme}
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={cn(
                        'relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl',
                        'flex flex-col',
                        // Dark theme
                        'bg-slate-900/95 border border-slate-700/50',
                        // Light theme
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                        // Luxury theme
                        'data-[theme=luxury]:bg-slate-950/95 data-[theme=luxury]:border-amber-800/30'
                    )}
                >
                    {/* Header */}
                    <div
                        className={cn(
                            'flex items-center justify-between p-4 border-b',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200',
                            'data-[theme=luxury]:border-amber-800/30'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            {product.imageUrl && (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                            )}
                            <div>
                                <h2
                                    className={cn(
                                        'text-lg font-semibold',
                                        'text-white',
                                        'data-[theme=light]:text-slate-900',
                                        'data-[theme=luxury]:text-amber-50'
                                    )}
                                >
                                    {isRTL && product.nameAr ? product.nameAr : product.name}
                                </h2>
                                <p
                                    className={cn(
                                        'text-sm',
                                        'text-cyan-400',
                                        'data-[theme=light]:text-cyan-600',
                                        'data-[theme=luxury]:text-amber-400'
                                    )}
                                >
                                    {t('currency')} {product.salePrice}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                'hover:bg-slate-700 text-slate-400 hover:text-white',
                                'data-[theme=light]:hover:bg-slate-100 data-[theme=light]:text-slate-500',
                                'data-[theme=light]:hover:text-slate-900'
                            )}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modifier Groups - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {product.modifierGroups.map((group) => (
                            <ModifierGroupSection
                                key={group.id}
                                group={group}
                                selectedModifiers={selectedModifiers[group.id] || []}
                                onToggle={(modifier) => toggleModifier(group, modifier)}
                                theme={theme}
                                isRTL={isRTL}
                            />
                        ))}

                        {/* Special Instructions */}
                        <div className="space-y-2">
                            <label
                                className={cn(
                                    'flex items-center gap-2 text-sm font-medium',
                                    'text-slate-300',
                                    'data-[theme=light]:text-slate-700'
                                )}
                            >
                                <MessageSquare className="w-4 h-4" />
                                {t('modifiers.specialInstructions', 'Special Instructions')}
                            </label>
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder={t('modifiers.instructionsPlaceholder', 'E.g., Extra hot, no ice...')}
                                rows={2}
                                className={cn(
                                    'w-full px-3 py-2 rounded-lg border resize-none',
                                    'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500',
                                    'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500',
                                    'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                    'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder-slate-400',
                                    'data-[theme=light]:focus:ring-cyan-500/30'
                                )}
                            />
                        </div>
                    </div>

                    {/* Footer - Quantity & Add to Cart */}
                    <div
                        className={cn(
                            'p-4 border-t',
                            'border-slate-700/50 bg-slate-800/50',
                            'data-[theme=light]:border-slate-200 data-[theme=light]:bg-slate-50'
                        )}
                    >
                        {/* Price Breakdown */}
                        <div
                            className={cn(
                                'flex justify-between text-sm mb-3',
                                'text-slate-400',
                                'data-[theme=light]:text-slate-600'
                            )}
                        >
                            <span>
                                {t('cart.base', 'Base')}: {t('currency')} {priceBreakdown.basePrice}
                                {parseFloat(priceBreakdown.modifiersTotal) > 0 && (
                                    <span className="text-cyan-400 data-[theme=light]:text-cyan-600">
                                        {' '}
                                        + {t('currency')} {priceBreakdown.modifiersTotal}
                                    </span>
                                )}
                            </span>
                            <span className="font-medium text-white data-[theme=light]:text-slate-900">
                                = {t('currency')} {priceBreakdown.unitPrice} × {quantity}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Quantity Controls */}
                            <div
                                className={cn(
                                    'flex items-center gap-2 rounded-lg border px-2 py-1',
                                    'border-slate-700 bg-slate-800',
                                    'data-[theme=light]:border-slate-200 data-[theme=light]:bg-white'
                                )}
                            >
                                <button
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                    className={cn(
                                        'p-1.5 rounded-md transition-colors',
                                        'hover:bg-slate-700 disabled:opacity-50',
                                        'data-[theme=light]:hover:bg-slate-100'
                                    )}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span
                                    className={cn(
                                        'w-8 text-center font-semibold',
                                        'text-white',
                                        'data-[theme=light]:text-slate-900'
                                    )}
                                >
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className={cn(
                                        'p-1.5 rounded-md transition-colors',
                                        'hover:bg-slate-700',
                                        'data-[theme=light]:hover:bg-slate-100'
                                    )}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={handleAddToCart}
                                disabled={!isValid}
                                className={cn(
                                    'flex-1 py-3 rounded-xl font-semibold transition-all',
                                    'flex items-center justify-center gap-2',
                                    isValid
                                        ? cn(
                                            'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white',
                                            'hover:from-cyan-400 hover:to-cyan-500',
                                            'shadow-lg shadow-cyan-500/25',
                                            'data-[theme=luxury]:from-amber-500 data-[theme=luxury]:to-amber-600',
                                            'data-[theme=luxury]:shadow-amber-500/25'
                                        )
                                        : 'bg-slate-700 text-slate-400 cursor-not-allowed data-[theme=light]:bg-slate-200'
                                )}
                            >
                                <span>{t('modifiers.addToCart', 'Add to Cart')}</span>
                                <span className="font-bold">
                                    {t('currency')} {priceBreakdown.lineTotal}
                                </span>
                            </button>
                        </div>

                        {/* Validation Errors */}
                        {validationErrors.length > 0 && (
                            <div className="mt-2 text-xs text-red-400">
                                {validationErrors.join(' • ')}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ============= Modifier Group Section =============

interface ModifierGroupSectionProps {
    group: ModifierGroup;
    selectedModifiers: string[];
    onToggle: (modifier: Modifier) => void;
    theme: string;
    isRTL: boolean;
}

function ModifierGroupSection({
    group,
    selectedModifiers,
    onToggle,
    theme,
    isRTL,
}: ModifierGroupSectionProps) {
    const { t } = useTranslation('pos');

    const groupName = isRTL && group.nameAr ? group.nameAr : group.name;
    const selectionHint =
        group.selectionType === 'SINGLE'
            ? t('modifiers.selectOne', 'Select one')
            : group.maxSelections > 0
                ? t('modifiers.selectUpTo', { count: group.maxSelections, defaultValue: `Select up to ${group.maxSelections}` })
                : t('modifiers.selectMultiple', 'Select any');

    return (
        <div className="space-y-2" data-theme={theme}>
            {/* Group Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3
                        className={cn(
                            'font-semibold',
                            'text-white',
                            'data-[theme=light]:text-slate-900'
                        )}
                    >
                        {groupName}
                    </h3>
                    {group.isRequired && (
                        <span
                            className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                'bg-red-500/20 text-red-400',
                                'data-[theme=light]:bg-red-100 data-[theme=light]:text-red-600'
                            )}
                        >
                            {t('modifiers.required', 'Required')}
                        </span>
                    )}
                </div>
                <span
                    className={cn(
                        'text-xs',
                        'text-slate-500',
                        'data-[theme=light]:text-slate-400'
                    )}
                >
                    {selectionHint}
                </span>
            </div>

            {/* Modifier Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.modifiers.map((modifier) => {
                    const isSelected = selectedModifiers.includes(modifier.id);
                    const modifierName = isRTL && modifier.nameAr ? modifier.nameAr : modifier.name;
                    const priceNum = parseFloat(modifier.priceAdjustment);

                    return (
                        <button
                            key={modifier.id}
                            onClick={() => onToggle(modifier)}
                            disabled={!modifier.isAvailable}
                            className={cn(
                                'flex items-center justify-between p-3 rounded-lg border transition-all',
                                'text-start',
                                isSelected
                                    ? cn(
                                        'border-cyan-500 bg-cyan-500/10',
                                        'data-[theme=light]:border-cyan-500 data-[theme=light]:bg-cyan-50',
                                        'data-[theme=luxury]:border-amber-500 data-[theme=luxury]:bg-amber-500/10'
                                    )
                                    : cn(
                                        'border-slate-700 bg-slate-800/50 hover:border-slate-600',
                                        'data-[theme=light]:border-slate-200 data-[theme=light]:bg-white',
                                        'data-[theme=light]:hover:border-slate-300'
                                    ),
                                !modifier.isAvailable && 'opacity-50 cursor-not-allowed'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {/* Selection Indicator */}
                                <div
                                    className={cn(
                                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                                        isSelected
                                            ? cn(
                                                'border-cyan-500 bg-cyan-500',
                                                'data-[theme=luxury]:border-amber-500 data-[theme=luxury]:bg-amber-500'
                                            )
                                            : cn(
                                                'border-slate-600',
                                                'data-[theme=light]:border-slate-300'
                                            )
                                    )}
                                >
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>

                                <span
                                    className={cn(
                                        modifier.isNegative && 'line-through opacity-75',
                                        'text-white',
                                        'data-[theme=light]:text-slate-900'
                                    )}
                                >
                                    {modifier.isNegative && 'No '}
                                    {modifierName}
                                </span>
                            </div>

                            {/* Price Adjustment */}
                            {priceNum !== 0 && !modifier.isNegative && (
                                <span
                                    className={cn(
                                        'text-sm font-medium',
                                        priceNum > 0
                                            ? 'text-cyan-400 data-[theme=light]:text-cyan-600'
                                            : 'text-green-400'
                                    )}
                                >
                                    {priceNum > 0 ? '+' : ''}
                                    {modifier.priceAdjustment}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default ModifierModal;
