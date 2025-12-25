import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Minus, Plus, Trash2, ShoppingCart, Package, Edit2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore, type CartItem as CartItemType, type CartItemModifier } from '@/stores/cart.store';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import type { KitchenStatus } from '@/types/pos.types';

export interface CartPanelProps {
    /** Whether cart is expanded */
    isExpanded: boolean;
    /** Callback to close cart */
    onClose: () => void;
    /** Callback to edit item modifiers */
    onEditItem?: (item: CartItemType) => void;
    /** Callback to trigger checkout */
    onCheckout?: () => void;
}

// Kitchen status config
const KITCHEN_STATUS_CONFIG: Record<KitchenStatus, { icon: string; color: string; bgColor: string }> = {
    PENDING: { icon: '⏳', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
    FIRED: { icon: '🔥', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    PREPARING: { icon: '🍳', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    READY: { icon: '✅', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    SERVED: { icon: '✓', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
};

/**
 * Premium Cart Panel for POS - With Modifier Display
 * Fixed position that pushes content - NOT overlay
 */
export function CartPanel({ isExpanded, onClose, onEditItem, onCheckout }: CartPanelProps) {
    const { t } = useTranslation(['pos', 'common']);
    const { language, theme } = useSettingsStore();
    const {
        getActiveItems,
        updateQuantity,
        removeItem,
        getSubtotal,
        getTaxAmount,
        getTotal,
        getItemCount,
        getDeliveryFee,
        getDiscountAmount,
        clearCart,
        canCheckout,
        getCheckoutBlockers,
    } = useCartStore();

    const items = getActiveItems();
    const itemCount = getItemCount();
    const blockers = getCheckoutBlockers();
    const deliveryFee = getDeliveryFee();
    const discountAmount = getDiscountAmount();

    // Cart is ALWAYS on LEFT side (since nav is on right)
    // Slide from left: negative x means off-screen to left
    const slideOffset = -420;

    return (
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    data-theme={theme}
                    initial={{ x: slideOffset }}
                    animate={{ x: 0 }}
                    exit={{ x: slideOffset }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={cn(
                        // ALWAYS on LEFT side - nav is on right
                        'fixed top-0 left-0 h-screen w-[400px] z-40',
                        'border-r shadow-2xl',
                        'flex flex-col overflow-hidden',
                        // Dark theme
                        'bg-slate-900 border-slate-700',
                        // Light theme - HIGH CONTRAST
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                        'data-[theme=light]:shadow-xl data-[theme=light]:shadow-slate-400/30',
                        // Luxury theme
                        'data-[theme=luxury]:bg-black data-[theme=luxury]:border-amber-500/50',
                    )}
                >
                    {/* Header */}
                    <div data-theme={theme} className={cn(
                        'flex items-center justify-between px-4 py-3 border-b',
                        'bg-slate-800/50 border-slate-700',
                        'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-300',
                        'data-[theme=luxury]:bg-black/50 data-[theme=luxury]:border-amber-500/30',
                    )}>
                        <div className="flex items-center gap-2">
                            <div data-theme={theme} className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                'bg-gradient-to-br from-cyan-500 to-cyan-600',
                                'data-[theme=light]:from-cyan-600 data-[theme=light]:to-cyan-700',
                                'data-[theme=luxury]:from-amber-500 data-[theme=luxury]:to-amber-600',
                            )}>
                                <ShoppingCart className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h2 data-theme={theme} className={cn(
                                    'text-base font-bold leading-tight',
                                    'text-white',
                                    'data-[theme=light]:text-slate-900',
                                    'data-[theme=luxury]:text-amber-400',
                                )}>
                                    {t('cart')} ({itemCount})
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearCart}
                                disabled={itemCount === 0}
                                className={cn(
                                    'w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-500/20',
                                    'data-[theme=light]:text-red-600 data-[theme=light]:hover:bg-red-100',
                                )}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="w-8 h-8 data-[theme=light]:text-slate-700 data-[theme=light]:hover:bg-slate-200"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3">
                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    data-theme={theme}
                                    className={cn(
                                        'w-16 h-16 rounded-full flex items-center justify-center',
                                        'bg-slate-800',
                                        'data-[theme=light]:bg-slate-200',
                                        'data-[theme=luxury]:bg-amber-500/10',
                                    )}
                                >
                                    <ShoppingCart data-theme={theme} className={cn(
                                        'w-8 h-8',
                                        'text-slate-600',
                                        'data-[theme=light]:text-slate-400',
                                        'data-[theme=luxury]:text-amber-500/50',
                                    )} />
                                </motion.div>
                                <p data-theme={theme} className={cn(
                                    'text-sm',
                                    'text-slate-400',
                                    'data-[theme=light]:text-slate-500',
                                )}>
                                    {t('cartEmpty')}
                                </p>
                            </div>
                        ) : (
                            items.map((item, index) => (
                                <CartItemCard
                                    key={item.id}
                                    item={item}
                                    language={language}
                                    theme={theme}
                                    onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                                    onRemove={() => removeItem(item.id)}
                                    onEdit={onEditItem ? () => onEditItem(item) : undefined}
                                    index={index}
                                />
                            ))
                        )}
                    </div>

                    {/* Summary Footer */}
                    {items.length > 0 && (
                        <div data-theme={theme} className={cn(
                            'px-4 py-3 border-t space-y-2',
                            'bg-slate-800/50 border-slate-700',
                            'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-300',
                            'data-[theme=luxury]:bg-black/50 data-[theme=luxury]:border-amber-500/30',
                        )}>
                            {/* Subtotal */}
                            <div className="flex justify-between text-sm">
                                <span data-theme={theme} className={cn(
                                    'font-medium text-slate-400',
                                    'data-[theme=light]:text-slate-700',
                                )}>{t('summary.subtotal')}</span>
                                <PriceDisplay value={getSubtotal()} size="sm" />
                            </div>

                            {/* Discount (if any) */}
                            {parseFloat(discountAmount) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-400">{t('summary.discount')}</span>
                                    <span className="text-green-400">-<PriceDisplay value={discountAmount} size="sm" /></span>
                                </div>
                            )}

                            {/* Tax */}
                            <div className="flex justify-between text-sm">
                                <span data-theme={theme} className={cn(
                                    'text-slate-500',
                                    'data-[theme=light]:text-slate-600',
                                )}>{t('summary.tax')} (15%)</span>
                                <PriceDisplay value={getTaxAmount()} size="sm" variant="muted" />
                            </div>

                            {/* Delivery Fee (if any) */}
                            {parseFloat(deliveryFee) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span data-theme={theme} className={cn(
                                        'text-slate-500',
                                        'data-[theme=light]:text-slate-600',
                                    )}>{t('summary.deliveryFee', 'Delivery')}</span>
                                    <PriceDisplay value={deliveryFee} size="sm" variant="muted" />
                                </div>
                            )}

                            {/* Total */}
                            <div data-theme={theme} className={cn(
                                'pt-2 border-t flex justify-between',
                                'border-slate-700',
                                'data-[theme=light]:border-slate-300',
                            )}>
                                <span data-theme={theme} className={cn(
                                    'font-bold',
                                    'text-white',
                                    'data-[theme=light]:text-slate-900',
                                )}>{t('summary.total')}</span>
                                <PriceDisplay value={getTotal()} size="lg" variant="primary" />
                            </div>

                            {/* Checkout Blockers */}
                            {blockers.length > 0 && (
                                <div data-theme={theme} className={cn(
                                    'text-xs p-2 rounded-lg',
                                    'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400',
                                    'data-[theme=light]:bg-yellow-50 data-[theme=light]:border-yellow-200',
                                    'data-[theme=light]:text-yellow-700',
                                )}>
                                    {blockers.slice(0, 2).map((blocker, i) => (
                                        <div key={i}>• {blocker}</div>
                                    ))}
                                    {blockers.length > 2 && (
                                        <div>• +{blockers.length - 2} more...</div>
                                    )}
                                </div>
                            )}

                            {/* Checkout Button */}
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    variant="success"
                                    disabled={!canCheckout()}
                                    onClick={onCheckout}
                                    className={cn(
                                        'w-full mt-2',
                                        'bg-gradient-to-r from-emerald-500 to-emerald-600',
                                        'hover:from-emerald-400 hover:to-emerald-500',
                                        'shadow-lg shadow-emerald-500/30',
                                        'text-white font-bold',
                                        'disabled:opacity-50 disabled:cursor-not-allowed',
                                    )}
                                    size="md"
                                >
                                    {t('checkout')}
                                </Button>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Cart Item Card with Modifiers Display
 */
interface CartItemCardProps {
    item: CartItemType;
    language: string;
    theme: string;
    onUpdateQuantity: (qty: number) => void;
    onRemove: () => void;
    onEdit?: () => void;
    index: number;
}

function CartItemCard({ item, language, theme, onUpdateQuantity, onRemove, onEdit, index }: CartItemCardProps) {
    const { t } = useTranslation('pos');
    const qty = parseFloat(item.quantity);
    const [inputValue, setInputValue] = useState(String(qty));
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const productName = language === 'ar' && item.product.nameAr ? item.product.nameAr : item.product.name;
    const hasModifiers = item.modifiers.length > 0;
    const hasInstructions = !!item.specialInstructions;
    const kitchenConfig = KITCHEN_STATUS_CONFIG[item.kitchenStatus];

    // Sync input with external quantity changes
    useEffect(() => {
        if (!isEditing) {
            setInputValue(String(qty));
        }
    }, [qty, isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) {
            setInputValue(val);
        }
    };

    const handleInputBlur = () => {
        setIsEditing(false);
        const newQty = parseInt(inputValue, 10);
        if (isNaN(newQty) || newQty < 1) {
            setInputValue(String(qty));
        } else if (newQty !== qty) {
            onUpdateQuantity(newQty);
        }
    };

    const handleInputFocus = () => {
        setIsEditing(true);
        inputRef.current?.select();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            setInputValue(String(qty));
            inputRef.current?.blur();
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: language === 'ar' ? -50 : 50 }}
            transition={{ delay: index * 0.03 }}
            data-theme={theme}
            className={cn(
                'rounded-lg p-2 border',
                'bg-slate-800/80 border-slate-700/50',
                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                'data-[theme=light]:shadow-sm',
                'data-[theme=luxury]:bg-slate-900 data-[theme=luxury]:border-amber-500/30',
            )}
        >
            {/* Main Row */}
            <div className="flex items-center gap-2">
                {/* Thumbnail - Smaller */}
                <div data-theme={theme} className={cn(
                    'w-10 h-10 rounded-md overflow-hidden flex-shrink-0',
                    'bg-slate-700',
                    'data-[theme=light]:bg-slate-100',
                    'data-[theme=luxury]:bg-amber-500/10',
                )}>
                    {item.product.imageUrl ? (
                        <img
                            src={item.product.imageUrl}
                            alt={productName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package data-theme={theme} className={cn(
                                'w-5 h-5',
                                'text-slate-500',
                                'data-[theme=light]:text-slate-400',
                                'data-[theme=luxury]:text-amber-500/50',
                            )} />
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p data-theme={theme} className={cn(
                                'font-semibold text-xs truncate',
                                'text-white',
                                'data-[theme=light]:text-slate-900',
                            )}>
                                {productName}
                            </p>

                            {/* Kitchen Status Badge (if kitchen item) */}
                            {item.product.requiresKitchen && (
                                <span className={cn(
                                    'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded mt-1',
                                    kitchenConfig.bgColor,
                                    kitchenConfig.color,
                                )}>
                                    <span>{kitchenConfig.icon}</span>
                                    <span className="capitalize">{item.kitchenStatus.toLowerCase()}</span>
                                </span>
                            )}
                        </div>

                        {/* Price - Show quantity x unit price = subtotal */}
                        <div className="text-end flex-shrink-0">
                            <p data-theme={theme} className={cn(
                                'text-xs font-bold',
                                'text-cyan-400',
                                'data-[theme=light]:text-cyan-700',
                                'data-[theme=luxury]:text-amber-400',
                            )}>
                                <PriceDisplay value={item.lineTotal} size="sm" variant="primary" />
                            </p>
                            {/* Show qty x price breakdown */}
                            <p data-theme={theme} className={cn(
                                'text-[10px]',
                                'text-slate-500',
                                'data-[theme=light]:text-slate-400',
                            )}>
                                {qty} × {item.product.salePrice}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Price Breakdown Section (when has modifiers) */}
            {hasModifiers && (
                <div data-theme={theme} className={cn(
                    'mt-2 ms-12 rounded-md p-2 text-xs space-y-1',
                    'bg-slate-800/50 border border-slate-700/30',
                    'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                )}>
                    {/* Base Price */}
                    <div className="flex justify-between">
                        <span className={cn(
                            'text-slate-400',
                            theme === 'light' && 'text-slate-500',
                        )}>
                            {language === 'ar' ? 'السعر الأساسي' : 'Base price'}
                        </span>
                        <span className={cn(
                            'text-slate-300',
                            theme === 'light' && 'text-slate-600',
                        )}>
                            {item.product.salePrice}
                        </span>
                    </div>

                    {/* Modifiers with prices */}
                    {item.modifiers.map((mod, i) => {
                        const modName = language === 'ar' && mod.modifierNameAr
                            ? mod.modifierNameAr
                            : mod.modifierName;
                        const priceNum = parseFloat(mod.priceAdjustment);
                        return (
                            <div key={i} className="flex justify-between">
                                <span className={cn(
                                    mod.isNegative
                                        ? 'text-slate-500 line-through'
                                        : 'text-slate-400',
                                    theme === 'light' && !mod.isNegative && 'text-slate-500',
                                )}>
                                    {mod.isNegative ? 'No ' : '+ '}{modName}
                                </span>
                                {priceNum > 0 && !mod.isNegative && (
                                    <span className={cn(
                                        'font-medium',
                                        'text-green-400',
                                        theme === 'light' && 'text-green-600',
                                    )}>
                                        +{mod.priceAdjustment}
                                    </span>
                                )}
                            </div>
                        );
                    })}

                    {/* Unit Total */}
                    <div data-theme={theme} className={cn(
                        'flex justify-between pt-1 mt-1 border-t font-semibold',
                        'border-slate-700/50',
                        'data-[theme=light]:border-slate-200',
                    )}>
                        <span className={cn(
                            'text-slate-300',
                            theme === 'light' && 'text-slate-700',
                        )}>
                            {language === 'ar' ? 'سعر الوحدة' : 'Unit price'}
                        </span>
                        <span className={cn(
                            'text-cyan-400',
                            theme === 'light' && 'text-cyan-600',
                        )}>
                            {item.unitPrice}
                        </span>
                    </div>

                    {/* Quantity x Unit total = Subtotal */}
                    {qty > 1 && (
                        <div data-theme={theme} className={cn(
                            'flex justify-between font-bold',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}>
                            <span>
                                {qty} × {item.unitPrice}
                            </span>
                            <span className={cn(
                                'text-cyan-400',
                                theme === 'light' && 'text-cyan-700',
                            )}>
                                = {item.lineTotal}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Special Instructions */}
            {hasInstructions && (
                <div data-theme={theme} className={cn(
                    'mt-2 ms-15 flex items-start gap-1.5 text-xs',
                    'text-slate-400',
                    'data-[theme=light]:text-slate-500',
                )}>
                    <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="italic">"{item.specialInstructions}"</span>
                </div>
            )}

            {/* Bottom Controls - Compact */}
            <div className="mt-1.5 flex items-center justify-end gap-1.5">
                {/* Edit Button (if has modifiers) */}
                {(hasModifiers || item.product.hasRequiredModifiers) && onEdit && (
                    <button
                        onClick={onEdit}
                        data-theme={theme}
                        className={cn(
                            'flex items-center gap-1 text-xs px-2 py-1 rounded',
                            'text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50',
                            'data-[theme=light]:text-slate-500 data-[theme=light]:hover:text-cyan-600',
                            'data-[theme=light]:hover:bg-slate-100',
                        )}
                    >
                        <Edit2 className="w-3 h-3" />
                        <span>{t('edit', 'Edit')}</span>
                    </button>
                )}

                {/* Quantity Controls */}
                <div className="flex items-center gap-1">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onUpdateQuantity(Math.max(1, qty - 1))}
                        data-theme={theme}
                        className={cn(
                            'w-6 h-6 rounded flex items-center justify-center transition-colors',
                            'bg-slate-700 hover:bg-slate-600 text-white',
                            'data-[theme=light]:bg-slate-200 data-[theme=light]:hover:bg-slate-300',
                            'data-[theme=light]:text-slate-700',
                        )}
                    >
                        <Minus className="w-3 h-3" />
                    </motion.button>

                    <input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                        data-theme={theme}
                        className={cn(
                            'w-8 h-6 text-center font-bold text-xs rounded border-0',
                            'bg-transparent focus:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500',
                            'text-white',
                            'data-[theme=light]:text-slate-900 data-[theme=light]:focus:bg-slate-100',
                            'data-[theme=luxury]:focus:ring-amber-500',
                        )}
                    />

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onUpdateQuantity(qty + 1)}
                        data-theme={theme}
                        className={cn(
                            'w-6 h-6 rounded flex items-center justify-center transition-colors',
                            'bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-400',
                            'data-[theme=light]:bg-cyan-600 data-[theme=light]:hover:bg-cyan-700',
                            'data-[theme=light]:text-white',
                            'data-[theme=luxury]:bg-amber-500/30 data-[theme=luxury]:hover:bg-amber-500/50',
                            'data-[theme=luxury]:text-amber-400',
                        )}
                    >
                        <Plus className="w-3 h-3" />
                    </motion.button>
                </div>

                {/* Remove Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onRemove}
                    data-theme={theme}
                    className={cn(
                        'w-6 h-6 rounded flex items-center justify-center transition-colors',
                        'hover:bg-red-500/20 text-red-400',
                        'data-[theme=light]:hover:bg-red-100 data-[theme=light]:text-red-500',
                    )}
                >
                    <X className="w-3.5 h-3.5" />
                </motion.button>
            </div>
        </motion.div>
    );
}

/**
 * Single Modifier Line in Cart
 */
interface ModifierLineProps {
    modifier: CartItemModifier;
    language: string;
    theme: string;
}

function ModifierLine({ modifier, language, theme }: ModifierLineProps) {
    const modName = language === 'ar' && modifier.modifierNameAr
        ? modifier.modifierNameAr
        : modifier.modifierName;
    const priceNum = parseFloat(modifier.priceAdjustment);

    return (
        <div
            data-theme={theme}
            className={cn(
                'flex items-center justify-between text-xs',
                modifier.isNegative
                    ? 'text-slate-500 line-through'
                    : 'text-slate-400 data-[theme=light]:text-slate-600',
            )}
        >
            <span className="flex items-center gap-1">
                <span className={modifier.isNegative ? '' : 'text-cyan-500 data-[theme=light]:text-cyan-600'}>+</span>
                {modifier.isNegative ? 'No ' : ''}{modName}
            </span>
            {priceNum > 0 && !modifier.isNegative && (
                <span className="text-cyan-400 data-[theme=light]:text-cyan-600 font-medium">
                    +{modifier.priceAdjustment}
                </span>
            )}
        </div>
    );
}
