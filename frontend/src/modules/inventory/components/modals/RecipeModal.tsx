/**
 * Recipe Modal
 * Modal for Bill of Materials (BOM) management with ingredient search and cost calculation
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChefHat,
    Search,
    Trash2,
    Plus,
    AlertTriangle,
    Calculator,
    Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useSettingsStore } from '@/stores/settings.store';
import { formatCurrency } from '@/lib/decimal';
import Decimal from 'decimal.js';

// =============================================================================
// Types
// =============================================================================

interface RecipeIngredient {
    id: string;
    productId: string;
    productName: string;
    quantity: string;
    unitName: string;
    costPerUnit: number;
    lineCost: number;
}

interface RecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId?: string;
    productName?: string;
    salePrice?: number;
    onSave?: (ingredients: RecipeIngredient[]) => Promise<void>;
}

// Mock products for ingredient search (in real app, fetch from API)
const MOCK_INGREDIENTS = [
    { id: 'ing-1', name: 'Chicken Breast', unit: 'kg', costPerUnit: 35.00 },
    { id: 'ing-2', name: 'Beef Patty', unit: 'pc', costPerUnit: 8.50 },
    { id: 'ing-3', name: 'Burger Bun', unit: 'pc', costPerUnit: 2.00 },
    { id: 'ing-4', name: 'Lettuce', unit: 'kg', costPerUnit: 12.00 },
    { id: 'ing-5', name: 'Tomato', unit: 'kg', costPerUnit: 8.00 },
    { id: 'ing-6', name: 'Cheese Slice', unit: 'pc', costPerUnit: 1.50 },
    { id: 'ing-7', name: 'French Fries', unit: 'kg', costPerUnit: 15.00 },
    { id: 'ing-8', name: 'Cooking Oil', unit: 'L', costPerUnit: 18.00 },
    { id: 'ing-9', name: 'Spice Mix', unit: 'kg', costPerUnit: 45.00 },
    { id: 'ing-10', name: 'Mayonnaise', unit: 'kg', costPerUnit: 25.00 },
];

// =============================================================================
// Component
// =============================================================================

export function RecipeModal({ isOpen, onClose, productId: _productId, productName, salePrice = 0, onSave }: RecipeModalProps) {
    const { t } = useTranslation('inventory');
    const { theme, language } = useSettingsStore();
    const isRTL = language === 'ar';

    // State
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setIngredients([]);
            setSearchQuery('');
            setShowSearch(false);
        }
    }, [isOpen]);

    // Filter ingredients by search
    const filteredSearchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        return MOCK_INGREDIENTS.filter(ing =>
            ing.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !ingredients.find(i => i.productId === ing.id)
        );
    }, [searchQuery, ingredients]);

    // Add ingredient
    const addIngredient = (ing: typeof MOCK_INGREDIENTS[0]) => {
        const newIngredient: RecipeIngredient = {
            id: `recipe-ing-${Date.now()}`,
            productId: ing.id,
            productName: ing.name,
            quantity: '1',
            unitName: ing.unit,
            costPerUnit: ing.costPerUnit,
            lineCost: ing.costPerUnit,
        };
        setIngredients([...ingredients, newIngredient]);
        setSearchQuery('');
        setShowSearch(false);
    };

    // Update ingredient quantity
    const updateQuantity = (id: string, quantity: string) => {
        setIngredients(ingredients.map(ing => {
            if (ing.id === id) {
                const qty = parseFloat(quantity) || 0;
                return {
                    ...ing,
                    quantity,
                    lineCost: qty * ing.costPerUnit,
                };
            }
            return ing;
        }));
    };

    // Remove ingredient
    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
    };

    // Calculate totals
    const totalCost = useMemo(() => {
        return ingredients.reduce((sum, ing) => sum.plus(ing.lineCost), new Decimal(0));
    }, [ingredients]);

    const margin = useMemo(() => {
        if (salePrice === 0) return new Decimal(0);
        return new Decimal(salePrice).minus(totalCost).dividedBy(salePrice).times(100);
    }, [salePrice, totalCost]);

    const isLowMargin = margin.lessThan(20);
    const isNegativeMargin = margin.lessThan(0);

    // Handle submit
    const handleSubmit = async () => {
        if (ingredients.length === 0) return;

        setIsSubmitting(true);
        try {
            await onSave?.(ingredients);
            onClose();
        } catch (error) {
            console.error('Failed to save recipe:', error);
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
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    data-theme={theme}
                    className={cn(
                        'w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl',
                        'data-[theme=dark]:bg-[#1a1f25] data-[theme=dark]:border data-[theme=dark]:border-white/10',
                        'data-[theme=light]:bg-white',
                    )}
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    {/* Header */}
                    <div className={cn(
                        'flex items-center justify-between px-6 py-4 border-b',
                        'data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200'
                    )} data-theme={theme}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                <ChefHat className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className={cn(
                                    'text-lg font-bold',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-800'
                                )} data-theme={theme}>
                                    {t('recipe.title', 'Recipe / Bill of Materials')}
                                </h2>
                                {productName && (
                                    <p className="text-sm text-gray-400">{productName}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
                        {/* Add Ingredient */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={cn(
                                    'text-sm font-semibold',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                )} data-theme={theme}>
                                    {t('recipe.ingredients', 'Ingredients')}
                                </h3>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowSearch(true)}
                                    className="gap-2 text-purple-400"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('recipe.addIngredient', 'Add Ingredient')}
                                </Button>
                            </div>

                            {/* Search Dropdown */}
                            {showSearch && (
                                <div className="relative mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoFocus
                                            placeholder={t('recipe.searchIngredient', 'Search raw materials...')}
                                            data-theme={theme}
                                            className={cn(
                                                'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm',
                                                'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                'focus:outline-none focus:ring-2 focus:ring-purple-500'
                                            )}
                                        />
                                    </div>

                                    {filteredSearchResults.length > 0 && (
                                        <div
                                            data-theme={theme}
                                            className={cn(
                                                'absolute top-full left-0 right-0 mt-1 z-10 rounded-lg border shadow-xl max-h-48 overflow-y-auto',
                                                'data-[theme=dark]:bg-[#1a1f25] data-[theme=dark]:border-white/10',
                                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200'
                                            )}
                                        >
                                            {filteredSearchResults.map(ing => (
                                                <button
                                                    key={ing.id}
                                                    onClick={() => addIngredient(ing)}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'w-full px-4 py-2.5 text-start text-sm flex items-center justify-between',
                                                        'data-[theme=dark]:text-white data-[theme=dark]:hover:bg-white/10',
                                                        'data-[theme=light]:text-slate-700 data-[theme=light]:hover:bg-slate-50'
                                                    )}
                                                >
                                                    <span>{ing.name}</span>
                                                    <span className="text-gray-400 text-xs">
                                                        {formatCurrency(ing.costPerUnit, 'SAR', isRTL ? 'ar-SA' : 'en-SA')}/{ing.unit}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Ingredients Table */}
                            <div
                                data-theme={theme}
                                className={cn(
                                    'rounded-lg border overflow-hidden',
                                    'data-[theme=dark]:border-white/10',
                                    'data-[theme=light]:border-slate-200'
                                )}
                            >
                                <table className="w-full">
                                    <thead>
                                        <tr data-theme={theme} className="data-[theme=dark]:bg-white/5 data-[theme=light]:bg-slate-50">
                                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase">
                                                {t('table.ingredient', 'Ingredient')}
                                            </th>
                                            <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase w-24">
                                                {t('table.quantity', 'Qty')}
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase w-20">
                                                {t('table.unit', 'Unit')}
                                            </th>
                                            <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase w-28">
                                                {t('table.cost', 'Cost/Unit')}
                                            </th>
                                            <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase w-28">
                                                {t('table.lineCost', 'Line Cost')}
                                            </th>
                                            <th className="px-4 py-3 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ingredients.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                                    {t('recipe.noIngredients', 'No ingredients added yet. Click "Add Ingredient" to start.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            ingredients.map((ing) => (
                                                <tr
                                                    key={ing.id}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'border-t',
                                                        'data-[theme=dark]:border-white/5',
                                                        'data-[theme=light]:border-slate-100'
                                                    )}
                                                >
                                                    <td className="px-4 py-2">
                                                        <span className={cn(
                                                            'text-sm',
                                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                                        )} data-theme={theme}>
                                                            {ing.productName}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            value={ing.quantity}
                                                            onChange={(e) => updateQuantity(ing.id, e.target.value)}
                                                            data-theme={theme}
                                                            className={cn(
                                                                'w-full px-3 py-1.5 rounded border text-sm text-end font-mono',
                                                                'data-[theme=dark]:bg-transparent data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                                'focus:outline-none focus:ring-2 focus:ring-purple-500'
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-center text-sm text-gray-400">
                                                        {ing.unitName}
                                                    </td>
                                                    <td className="px-4 py-2 text-end font-mono text-sm text-gray-400">
                                                        {formatCurrency(ing.costPerUnit, 'SAR', isRTL ? 'ar-SA' : 'en-SA')}
                                                    </td>
                                                    <td className={cn(
                                                        'px-4 py-2 text-end font-mono text-sm font-medium',
                                                        'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                                    )} data-theme={theme}>
                                                        {formatCurrency(ing.lineCost, 'SAR', isRTL ? 'ar-SA' : 'en-SA')}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <button
                                                            onClick={() => removeIngredient(ing.id)}
                                                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Cost Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cost Breakdown */}
                            <div className={cn(
                                'p-4 rounded-xl border',
                                'data-[theme=dark]:border-white/10 data-[theme=dark]:bg-white/5',
                                'data-[theme=light]:border-slate-200 data-[theme=light]:bg-slate-50'
                            )} data-theme={theme}>
                                <h4 className={cn(
                                    'text-sm font-semibold mb-3 flex items-center gap-2',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                )} data-theme={theme}>
                                    <Calculator className="w-4 h-4 text-purple-400" />
                                    {t('recipe.costBreakdown', 'Cost Breakdown')}
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('recipe.ingredientCount', 'Ingredients')}</span>
                                        <span className={cn(
                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                        )} data-theme={theme}>
                                            {ingredients.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200" data-theme={theme}>
                                        <span className="font-bold data-[theme=dark]:text-white data-[theme=light]:text-slate-800" data-theme={theme}>
                                            {t('recipe.totalCost', 'Total Cost')}
                                        </span>
                                        <span className="font-bold text-purple-400">
                                            {formatCurrency(totalCost.toNumber(), 'SAR', isRTL ? 'ar-SA' : 'en-SA')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Margin Analysis */}
                            <div className={cn(
                                'p-4 rounded-xl border',
                                isNegativeMargin
                                    ? 'border-red-500/50 bg-red-500/10'
                                    : isLowMargin
                                        ? 'border-amber-500/50 bg-amber-500/10'
                                        : 'data-[theme=dark]:border-white/10 data-[theme=dark]:bg-white/5 data-[theme=light]:border-slate-200 data-[theme=light]:bg-slate-50'
                            )} data-theme={theme}>
                                <h4 className={cn(
                                    'text-sm font-semibold mb-3',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                )} data-theme={theme}>
                                    {t('recipe.marginAnalysis', 'Margin Analysis')}
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('recipe.salePrice', 'Sale Price')}</span>
                                        <span className={cn(
                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                        )} data-theme={theme}>
                                            {formatCurrency(salePrice, 'SAR', isRTL ? 'ar-SA' : 'en-SA')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('recipe.profit', 'Profit')}</span>
                                        <span className={cn(
                                            new Decimal(salePrice).minus(totalCost).isNegative() ? 'text-red-400' : 'text-emerald-400'
                                        )}>
                                            {formatCurrency(new Decimal(salePrice).minus(totalCost).toNumber(), 'SAR', isRTL ? 'ar-SA' : 'en-SA')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200" data-theme={theme}>
                                        <span className="font-bold data-[theme=dark]:text-white data-[theme=light]:text-slate-800" data-theme={theme}>
                                            {t('recipe.margin', 'Margin')}
                                        </span>
                                        <span className={cn(
                                            'font-bold',
                                            isNegativeMargin ? 'text-red-400' : isLowMargin ? 'text-amber-400' : 'text-emerald-400'
                                        )}>
                                            {margin.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                {(isLowMargin || isNegativeMargin) && (
                                    <div className={cn(
                                        'mt-3 p-2 rounded-lg flex items-center gap-2',
                                        isNegativeMargin ? 'bg-red-500/20' : 'bg-amber-500/20'
                                    )}>
                                        <AlertTriangle className={cn(
                                            'w-4 h-4',
                                            isNegativeMargin ? 'text-red-400' : 'text-amber-400'
                                        )} />
                                        <span className={cn(
                                            'text-xs',
                                            isNegativeMargin ? 'text-red-400' : 'text-amber-400'
                                        )}>
                                            {isNegativeMargin
                                                ? t('recipe.negativeMaginWarning', 'Negative margin! You will lose money on this item.')
                                                : t('recipe.lowMarginWarning', 'Low margin warning. Consider adjusting pricing.')
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={cn(
                        'flex items-center justify-between px-6 py-4 border-t',
                        'data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200'
                    )} data-theme={theme}>
                        <Button variant="ghost" onClick={onClose}>
                            {t('common.cancel', 'Cancel')}
                        </Button>

                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting || ingredients.length === 0}
                            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-600"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('common.saving', 'Saving...')}
                                </>
                            ) : (
                                <>
                                    <ChefHat className="w-4 h-4" />
                                    {t('recipe.saveRecipe', 'Save Recipe')}
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default RecipeModal;
