import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Minus, Plus, Trash2, ShoppingCart, ChefHat, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cart.store';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { PriceDisplay, PriceRow } from '@/components/shared';

export interface CartPanelProps {
    /** Whether cart is expanded */
    isExpanded: boolean;
    /** Callback to close cart */
    onClose: () => void;
}

/**
 * Premium Cart Panel for POS - Compact design
 * Fixed position that pushes content - NOT overlay
 */
export function CartPanel({ isExpanded, onClose }: CartPanelProps) {
    const { t } = useTranslation(['pos', 'common']);
    const { language, theme } = useSettingsStore();
    const {
        items,
        updateQuantity,
        removeItem,
        getSubtotal,
        getTaxAmount,
        getTotal,
        getItemCount,
        clearCart,
    } = useCartStore();

    const itemCount = getItemCount();

    return (
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    data-theme={theme}
                    initial={{ x: language === 'ar' ? -420 : 420 }}
                    animate={{ x: 0 }}
                    exit={{ x: language === 'ar' ? -420 : 420 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={cn(
                        'fixed top-0 end-0 h-screen w-[380px] z-40',
                        'border-s shadow-2xl',
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
                    {/* Compact Header */}
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

                    {/* Cart Items - Compact */}
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
                                <CompactCartItem
                                    key={item.id}
                                    item={item}
                                    language={language}
                                    theme={theme}
                                    onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                                    onRemove={() => removeItem(item.id)}
                                    index={index}
                                />
                            ))
                        )}
                    </div>

                    {/* Compact Summary Footer */}
                    {items.length > 0 && (
                        <div data-theme={theme} className={cn(
                            'px-4 py-3 border-t space-y-2',
                            'bg-slate-800/50 border-slate-700',
                            'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-300',
                            'data-[theme=luxury]:bg-black/50 data-[theme=luxury]:border-amber-500/30',
                        )}>
                            <div className="flex justify-between text-sm">
                                <span data-theme={theme} className={cn(
                                    'text-slate-400',
                                    'data-[theme=light]:text-slate-600',
                                )}>{t('summary.subtotal')}</span>
                                <PriceDisplay value={getSubtotal()} size="sm" />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span data-theme={theme} className={cn(
                                    'text-slate-500',
                                    'data-[theme=light]:text-slate-500',
                                )}>{t('summary.tax')}</span>
                                <PriceDisplay value={getTaxAmount()} size="sm" variant="muted" />
                            </div>
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

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    variant="success"
                                    className={cn(
                                        'w-full mt-2',
                                        'bg-gradient-to-r from-emerald-500 to-emerald-600',
                                        'hover:from-emerald-400 hover:to-emerald-500',
                                        'shadow-lg shadow-emerald-500/30',
                                        'text-white font-bold',
                                    )}
                                    size="default"
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
 * Compact cart item with editable quantity input
 */
interface CompactCartItemProps {
    item: {
        id: string;
        product: { name: string; nameAr: string | null; imageUrl?: string };
        quantity: string;
        unitPrice: string;
        lineTotal: string;
        specialInstructions?: string | null;
    };
    language: string;
    theme: string;
    onUpdateQuantity: (qty: number) => void;
    onRemove: () => void;
    index: number;
}

function CompactCartItem({ item, language, theme, onUpdateQuantity, onRemove, index }: CompactCartItemProps) {
    const qty = parseFloat(item.quantity);
    const [inputValue, setInputValue] = useState(String(qty));
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const productName = language === 'ar' && item.product.nameAr ? item.product.nameAr : item.product.name;

    // Sync input with external quantity changes
    useEffect(() => {
        if (!isEditing) {
            setInputValue(String(qty));
        }
    }, [qty, isEditing]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow only numbers
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
                'rounded-lg p-2 border flex items-center gap-2',
                'bg-slate-800 border-slate-700',
                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                'data-[theme=light]:shadow-sm',
                'data-[theme=luxury]:bg-slate-900 data-[theme=luxury]:border-amber-500/30',
            )}
        >
            {/* Small Thumbnail */}
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
                            'w-4 h-4',
                            'text-slate-500',
                            'data-[theme=light]:text-slate-400',
                            'data-[theme=luxury]:text-amber-500/50',
                        )} />
                    </div>
                )}
            </div>

            {/* Product Info - Compact */}
            <div className="flex-1 min-w-0">
                <p data-theme={theme} className={cn(
                    'font-semibold text-xs truncate',
                    'text-white',
                    'data-[theme=light]:text-slate-900',
                )}>
                    {productName}
                </p>
                <p data-theme={theme} className={cn(
                    'text-xs font-medium',
                    'text-cyan-400',
                    'data-[theme=light]:text-cyan-700',
                    'data-[theme=luxury]:text-amber-400',
                )}>
                    <PriceDisplay value={item.lineTotal} size="sm" variant="primary" />
                </p>
            </div>

            {/* Quantity Controls - Editable */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
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

                {/* Editable Quantity Input */}
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
                        'data-[theme=luxury]:bg-amber-500/30 data-[theme=luxury]:hover:bg-amber-500/50 data-[theme=luxury]:text-amber-400',
                    )}
                >
                    <Plus className="w-3 h-3" />
                </motion.button>
            </div>

            {/* Remove Button - Compact */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onRemove}
                data-theme={theme}
                className={cn(
                    'w-6 h-6 rounded flex items-center justify-center transition-colors flex-shrink-0',
                    'hover:bg-red-500/20 text-red-400',
                    'data-[theme=light]:hover:bg-red-100 data-[theme=light]:text-red-500',
                )}
            >
                <X className="w-3.5 h-3.5" />
            </motion.button>
        </motion.div>
    );
}
