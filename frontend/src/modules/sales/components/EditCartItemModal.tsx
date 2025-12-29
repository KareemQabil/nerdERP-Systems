/**
 * EditCartItemModal - The "Koshary Scenario" Solution
 * 
 * Allows adding/editing modifiers on an EXISTING cart item
 * Displays as child modifiers (not standalone items) for accurate reporting
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, MessageSquare, Save, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Decimal from 'decimal.js';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings.store';
import { useCartStore, type CartItem, type CartItemModifier } from '@/stores/cart.store';
import type { ModifierGroup, Modifier } from '@/types/pos.types';

interface EditCartItemModalProps {
    cartItem: CartItem | null;
    isOpen: boolean;
    onClose: () => void;
}

interface SelectedModifiers {
    [groupId: string]: string[]; // Array of modifier IDs per group
}

export function EditCartItemModal({ cartItem, isOpen, onClose }: EditCartItemModalProps) {
    const { t, i18n } = useTranslation('pos');
    const theme = useSettingsStore((s) => s.theme);
    const updateModifiers = useCartStore((s) => s.updateModifiers);
    const updateInstructions = useCartStore((s) => s.updateInstructions);
    const isRTL = i18n.dir() === 'rtl';

    const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifiers>({});
    const [instructions, setInstructions] = useState('');

    // Initialize with current cart item's modifiers when opening
    useEffect(() => {
        if (isOpen && cartItem) {
            // Build selected modifiers from current cart item
            const initial: SelectedModifiers = {};

            // Initialize empty arrays for all groups
            cartItem.product.modifierGroups.forEach((group) => {
                initial[group.id] = [];
            });

            // Populate with currently selected modifiers
            cartItem.modifiers.forEach((mod) => {
                if (!initial[mod.modifierGroupId]) {
                    initial[mod.modifierGroupId] = [];
                }
                initial[mod.modifierGroupId].push(mod.modifierId);
            });

            setSelectedModifiers(initial);
            setInstructions(cartItem.specialInstructions || '');
        }
    }, [isOpen, cartItem]);

    // Validation
    const validationErrors = useMemo(() => {
        if (!cartItem) return [];
        const errors: string[] = [];
        cartItem.product.modifierGroups.forEach((group) => {
            if (group.isRequired) {
                const selected = selectedModifiers[group.id] || [];
                if (selected.length < group.minSelections) {
                    const groupName = isRTL && group.nameAr ? group.nameAr : group.name;
                    errors.push(`${groupName}: ${t('modifiers.selectAtLeast', { count: group.minSelections })}`);
                }
            }
        });
        return errors;
    }, [selectedModifiers, cartItem, isRTL, t]);

    const isValid = validationErrors.length === 0;

    // Calculate new price
    const priceBreakdown = useMemo(() => {
        if (!cartItem) return { basePrice: '0', modifiersTotal: '0', unitPrice: '0', lineTotal: '0' };

        const basePrice = new Decimal(cartItem.basePrice);
        let modifiersTotal = new Decimal(0);

        Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
            const group = cartItem.product.modifierGroups.find((g) => g.id === groupId);
            if (!group) return;

            modifierIds.forEach((modId) => {
                const modifier = group.modifiers.find((m) => m.id === modId);
                if (modifier && !modifier.isNegative) {
                    modifiersTotal = modifiersTotal.plus(modifier.priceAdjustment);
                }
            });
        });

        const unitPrice = basePrice.plus(modifiersTotal);
        const lineTotal = unitPrice.times(cartItem.quantity);

        return {
            basePrice: basePrice.toFixed(3),
            modifiersTotal: modifiersTotal.toFixed(3),
            unitPrice: unitPrice.toFixed(3),
            lineTotal: lineTotal.toFixed(3),
        };
    }, [cartItem, selectedModifiers]);

    // Toggle modifier selection
    const toggleModifier = useCallback((group: ModifierGroup, modifier: Modifier) => {
        setSelectedModifiers((prev) => {
            const current = prev[group.id] || [];

            if (group.selectionType === 'SINGLE') {
                return { ...prev, [group.id]: [modifier.id] };
            } else {
                if (current.includes(modifier.id)) {
                    return { ...prev, [group.id]: current.filter((id) => id !== modifier.id) };
                } else {
                    if (group.maxSelections > 0 && current.length >= group.maxSelections) {
                        return prev;
                    }
                    return { ...prev, [group.id]: [...current, modifier.id] };
                }
            }
        });
    }, []);

    // Save changes
    const handleSave = useCallback(() => {
        if (!isValid || !cartItem) return;

        // Build new CartItemModifier array
        const newModifiers: CartItemModifier[] = [];
        Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
            const group = cartItem.product.modifierGroups.find((g) => g.id === groupId);
            if (!group) return;

            modifierIds.forEach((modId) => {
                const modifier = group.modifiers.find((m) => m.id === modId);
                if (modifier) {
                    newModifiers.push({
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

        // Update cart store
        updateModifiers(cartItem.id, newModifiers);

        // Update instructions if changed
        if (instructions !== (cartItem.specialInstructions || '')) {
            updateInstructions(cartItem.id, instructions || '');
        }

        onClose();
    }, [isValid, cartItem, selectedModifiers, instructions, updateModifiers, updateInstructions, onClose]);

    if (!isOpen || !cartItem) return null;

    const productName = isRTL && cartItem.product.nameAr ? cartItem.product.nameAr : cartItem.product.name;

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
                        'bg-slate-900/95 border border-slate-700/50',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                        'data-[theme=luxury]:bg-slate-950/95 data-[theme=luxury]:border-amber-800/30'
                    )}
                >
                    {/* Header */}
                    <div
                        className={cn(
                            'flex items-center justify-between p-4 border-b',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                <Edit3 className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className={cn(
                                    'text-lg font-semibold',
                                    'text-white',
                                    'data-[theme=light]:text-slate-900'
                                )}>
                                    {t('cart.editItem', 'تعديل العنصر')}
                                </h2>
                                <p className={cn(
                                    'text-sm',
                                    'text-cyan-400',
                                    'data-[theme=light]:text-cyan-600'
                                )}>
                                    {productName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                'hover:bg-slate-700 text-slate-400 hover:text-white',
                                'data-[theme=light]:hover:bg-slate-100 data-[theme=light]:text-slate-500'
                            )}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Modifier Groups - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {cartItem.product.modifierGroups.length === 0 ? (
                            <div className="text-center py-8 text-white/50">
                                {t('modifiers.noModifiers', 'لا توجد إضافات متاحة لهذا المنتج')}
                            </div>
                        ) : (
                            cartItem.product.modifierGroups.map((group) => (
                                <ModifierGroupSection
                                    key={group.id}
                                    group={group}
                                    selectedModifiers={selectedModifiers[group.id] || []}
                                    onToggle={(modifier) => toggleModifier(group, modifier)}
                                    theme={theme}
                                    isRTL={isRTL}
                                />
                            ))
                        )}

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
                                {t('modifiers.specialInstructions', 'تعليمات خاصة')}
                            </label>
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder={t('modifiers.instructionsPlaceholder', 'مثال: حار جداً، بدون ثلج...')}
                                rows={2}
                                className={cn(
                                    'w-full px-3 py-2 rounded-lg border resize-none',
                                    'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500',
                                    'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500',
                                    'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                    'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder-slate-400'
                                )}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        className={cn(
                            'p-4 border-t',
                            'border-slate-700/50 bg-slate-800/50',
                            'data-[theme=light]:border-slate-200 data-[theme=light]:bg-slate-50'
                        )}
                    >
                        {/* Price Display */}
                        <div className={cn(
                            'flex justify-between text-sm mb-3',
                            'text-slate-400',
                            'data-[theme=light]:text-slate-600'
                        )}>
                            <span>
                                {t('cart.base', 'الأساسي')}: {t('currency')} {priceBreakdown.basePrice}
                                {parseFloat(priceBreakdown.modifiersTotal) > 0 && (
                                    <span className="text-cyan-400 data-[theme=light]:text-cyan-600">
                                        {' '}+ {t('currency')} {priceBreakdown.modifiersTotal}
                                    </span>
                                )}
                            </span>
                            <span className="font-medium text-white data-[theme=light]:text-slate-900">
                                = {t('currency')} {priceBreakdown.unitPrice} × {cartItem.quantity}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className={cn(
                                    'flex-1 py-3 rounded-xl font-medium transition-colors',
                                    'border border-slate-600 text-slate-300',
                                    'hover:bg-slate-800',
                                    'data-[theme=light]:border-slate-300 data-[theme=light]:text-slate-600',
                                    'data-[theme=light]:hover:bg-slate-100'
                                )}
                            >
                                {t('common.cancel', 'إلغاء')}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!isValid}
                                className={cn(
                                    'flex-1 py-3 rounded-xl font-semibold transition-all',
                                    'flex items-center justify-center gap-2',
                                    isValid
                                        ? cn(
                                            'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white',
                                            'hover:from-cyan-400 hover:to-cyan-500',
                                            'shadow-lg shadow-cyan-500/25',
                                            'data-[theme=luxury]:from-amber-500 data-[theme=luxury]:to-amber-600'
                                        )
                                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                )}
                            >
                                <Save className="w-4 h-4" />
                                <span>{t('common.save', 'حفظ')}</span>
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

// ============= Modifier Group Section (reused from ModifierModal) =============

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
            ? t('modifiers.selectOne', 'اختر واحد')
            : group.maxSelections > 0
                ? t('modifiers.selectUpTo', { count: group.maxSelections, defaultValue: `اختر حتى ${group.maxSelections}` })
                : t('modifiers.selectMultiple', 'اختر متعدد');

    return (
        <div className="space-y-2" data-theme={theme}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className={cn(
                        'font-semibold',
                        'text-white',
                        'data-[theme=light]:text-slate-900'
                    )}>
                        {groupName}
                    </h3>
                    {group.isRequired && (
                        <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            'bg-red-500/20 text-red-400',
                            'data-[theme=light]:bg-red-100 data-[theme=light]:text-red-600'
                        )}>
                            {t('modifiers.required', 'مطلوب')}
                        </span>
                    )}
                </div>
                <span className={cn(
                    'text-xs',
                    'text-slate-500',
                    'data-[theme=light]:text-slate-400'
                )}>
                    {selectionHint}
                </span>
            </div>

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

                                <span className={cn(
                                    modifier.isNegative && 'line-through opacity-75',
                                    'text-white',
                                    'data-[theme=light]:text-slate-900'
                                )}>
                                    {modifier.isNegative && t('modifiers.no', 'بدون') + ' '}
                                    {modifierName}
                                </span>
                            </div>

                            {priceNum !== 0 && !modifier.isNegative && (
                                <span className={cn(
                                    'text-sm font-medium',
                                    priceNum > 0
                                        ? 'text-cyan-400 data-[theme=light]:text-cyan-600'
                                        : 'text-green-400'
                                )}>
                                    {priceNum > 0 ? '+' : ''}{modifier.priceAdjustment}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default EditCartItemModal;
