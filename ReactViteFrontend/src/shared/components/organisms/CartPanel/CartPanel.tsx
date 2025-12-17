import { Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/components/atoms/Button';
import { CartItem } from '@/shared/components/molecules/CartItem';
import { OrderSummaryRow } from '@/shared/components/molecules/OrderSummaryRow';
import { useCartStore } from '@/modules/sales/store/cartStore';

/**
 * CartPanel Organism
 * Smart component with LEGACY_POS_SPEC animations and FIXED bottom padding
 * 
 * Features (per spec):
 * - Fixed position: left-0 top-0 bottom-0, width 380px, z-40 (CORRECTED)
 * - Background: #1a1c1e with glass effects
 * - Spring physics: damping 30, stiffness 300
 * - Slide animation: x: '-100%' -> 0
 * - Item animations: stagger 20ms, collapse on exit
 * - Fixed footer with summary
 * - PADDING FIX: pb-32 on items list to prevent overlap with POSBottomBar
 * 
 * @example
 * <CartPanel />
 */
export function CartPanel() {
    const { items, clearCart, removeItem, updateItemQuantity, getTotals } = useCartStore();
    const totals = getTotals();

    return (
        <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{
                type: 'spring',
                damping: 30,      // Spring physics per LEGACY_POS_SPEC
                stiffness: 300
            }}
            className="fixed left-0 top-0 bottom-0 w-[380px] bg-[#1a1c1e] border-r border-[rgba(255,255,255,0.1)] shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-40 flex flex-col"
        >
            {/* Header - Glass effect per spec */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] flex-shrink-0">
                <h2 className="text-lg font-['Almarai'] font-bold text-[#e2e2e6] flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <ShoppingCart className="w-5 h-5" />
                    </span>
                    السلة
                    <span className="text-xs font-normal text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                        {totals.itemCount} منتجات
                    </span>
                </h2>
                {items.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCart}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <Trash2 className="h-4 w-4 ml-2" />
                        مسح الكل
                    </Button>
                )}
            </div>

            {/* Body - Cart Items with AnimatePresence + PADDING FIX */}
            <div className="flex-1 overflow-y-auto p-4 pb-32 custom-scrollbar">
                {/* CRITICAL: pb-32 ensures last item is visible above POSBottomBar */}

                {items.length === 0 ? (
                    // Empty State
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5 mx-auto">
                            <ShoppingCart className="w-10 h-10 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-['Almarai'] font-bold text-slate-200 mb-2">
                                السلة فارغة
                            </h3>
                            <p className="text-sm text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                                اختر منتجات من القائمة لإضافتها هنا
                            </p>
                        </div>
                    </div>
                ) : (
                    // Cart Items List with stagger animation
                    <AnimatePresence mode="popLayout">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{
                                    opacity: 0,
                                    x: -20,
                                    height: 0,
                                    marginBottom: 0
                                }}
                                transition={{ delay: index * 0.02 }} // Stagger: 20ms per item
                                className="mb-3"
                            >
                                <CartItem
                                    name={item.product.name}
                                    quantity={parseFloat(item.quantity)}
                                    price={parseFloat(item.lineTotal)}
                                    modifiers={item.selectedModifiers?.map(
                                        (mod) => `${mod.optionName} +${mod.price} SAR`
                                    )}
                                    onRemove={() => removeItem(item.id)}
                                    onIncrement={() => {
                                        const newQty = (parseFloat(item.quantity) + 1).toFixed(3);
                                        updateItemQuantity(item.id, newQty);
                                    }}
                                    onDecrement={() => {
                                        const currentQty = parseFloat(item.quantity);
                                        if (currentQty > 1) {
                                            const newQty = (currentQty - 1).toFixed(3);
                                            updateItemQuantity(item.id, newQty);
                                        }
                                    }}
                                    className="bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)] p-2.5 hover:border-cyan-400/30 transition-colors"
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Fixed Footer - Summary & Checkout */}
            {items.length > 0 && (
                <div className="border-t border-[rgba(255,255,255,0.1)] bg-[#1a1c1e] px-4 py-3 space-y-4 flex-shrink-0">
                    {/* Order Summary - Glass container */}
                    <div className="space-y-2 p-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]">
                        <OrderSummaryRow
                            label="المجموع الفرعي"
                            value={totals.subtotal}
                            className="text-slate-400"
                        />
                        {parseFloat(totals.discount) > 0 && (
                            <OrderSummaryRow
                                label="الخصم"
                                value={`-${totals.discount}`}
                                className="text-green-400"
                            />
                        )}
                        <OrderSummaryRow
                            label="الضريبة (15%)"
                            value={totals.tax}
                            className="text-slate-400"
                        />
                        <div className="pt-2 mt-2 border-t border-white/10">
                            <OrderSummaryRow
                                label="الإجمالي"
                                value={totals.total}
                                variant="highlight"
                            />
                        </div>
                    </div>

                    {/* Checkout Button - Gradient per spec */}
                    <Button
                        size="xl"
                        className="w-full h-14 text-lg font-['Almarai'] font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20 border-0"
                        onClick={() => {
                            // TODO: Navigate to checkout or open payment modal
                            console.log('Proceed to checkout');
                        }}
                    >
                        إتمام الطلب
                        <span className="mr-2 ml-2 opacity-50">|</span>
                        <span className="font-['Inter']">{totals.total} SAR</span>
                    </Button>
                </div>
            )}
        </motion.div>
    );
}
