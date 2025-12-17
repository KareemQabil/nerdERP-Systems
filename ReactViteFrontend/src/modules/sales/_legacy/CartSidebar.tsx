import { useCartStore } from '@/modules/sales/store/cartStore';
import { Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Decimal from 'decimal.js';

export const CartSidebar = () => {
    const { t } = useTranslation();
    const { items, removeItem, clearCart, total } = useCartStore();

    const taxAmount = new Decimal(total).times(0.15).toFixed(2);
    const grandTotal = new Decimal(total).plus(taxAmount).toFixed(2);

    return (
        <aside className="w-full h-full bg-[#1A2332]/50 backdrop-blur-xl border-l border-white/5 flex flex-col">
            {/* Cart Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/5 bg-surface-dark/30">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white leading-none mb-0.5">
                            {t('cart.title', 'السلة')}
                        </h2>
                        <span className="text-[10px] text-muted-foreground">
                            {items.length} {t('cart.items', 'عناصر')}
                        </span>
                    </div>
                </div>

                {items.length > 0 && (
                    <button
                        onClick={clearCart}
                        className="text-error hover:text-error-dark transition-colors p-2 rounded-lg hover:bg-error/10"
                        aria-label="Clear cart"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-hide">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <ShoppingCart className="w-12 h-12 opacity-30" />
                        <p className="text-xs opacity-50">{t('cart.empty', 'السلة فارغة')}</p>
                    </div>
                ) : (
                    items.map((item) => {
                        const itemTotal = new Decimal(item.salePrice).times(item.quantity).toFixed(2);

                        return (
                            <div
                                key={item.id}
                                className="bg-surface-dark/40 rounded-lg p-3 border border-white/5 flex gap-3 group hover:border-primary/20 transition-all"
                            >
                                {/* Product Image Thumbnail */}
                                <div className="w-12 h-12 rounded-md overflow-hidden bg-surface-light/30 flex-shrink-0">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">No Img</div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-sm font-medium text-white truncate pr-2 leading-tight">
                                            {item.name}
                                        </h4>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="opacity-0 group-hover:opacity-100 text-error hover:text-error-dark transition-all flex-shrink-0"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Quantity & Price Row */}
                                    <div className="flex items-center justify-between mt-auto">
                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-1.5 bg-surface-light/30 rounded-md px-1.5 py-1">
                                            <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors">
                                                <Minus className="w-3 h-3 text-muted-foreground" />
                                            </button>
                                            <span className="text-xs font-bold text-white w-6 text-center">{item.quantity}</span>
                                            <button className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors">
                                                <Plus className="w-3 h-3 text-muted-foreground" />
                                            </button>
                                        </div>

                                        {/* Item Total */}
                                        <span className="text-sm font-bold text-primary font-latin">
                                            {itemTotal}
                                        </span>
                                    </div>

                                    {/* Modifiers */}
                                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground truncate mt-1">
                                            {item.selectedModifiers.map((m: any) => m.name).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Cart Footer */}
            <div className="mt-auto bg-surface-dark/60 border-t border-white/5 backdrop-blur-md">
                {/* Summary */}
                <div className="px-4 py-3 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                        <span>{t('cart.subtotal', 'المجموع الفرعي')}</span>
                        <span className="font-latin font-medium">{total} ر.س</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>{t('cart.tax', 'الضريبة (15%)')}</span>
                        <span className="font-latin font-medium">{taxAmount} ر.س</span>
                    </div>
                </div>

                {/* Total */}
                <div className="px-4 py-3 border-t border-white/10 flex justify-between items-center">
                    <span className="text-sm font-bold text-white">{t('cart.total', 'الإجمالي')}</span>
                    <div className="text-left">
                        <span className="text-lg font-bold text-primary font-latin block leading-none">
                            {grandTotal}
                        </span>
                        <span className="text-[9px] text-muted-foreground">ر.س</span>
                    </div>
                </div>

                {/* Pay Button */}
                <div className="px-4 pb-4">
                    <button
                        className="w-full h-12 rounded-lg font-bold text-sm bg-primary hover:bg-primary-dark text-surface-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                        disabled={items.length === 0}
                    >
                        {t('cart.pay', 'دفع')}
                    </button>
                </div>
            </div>
        </aside>
    );
};
