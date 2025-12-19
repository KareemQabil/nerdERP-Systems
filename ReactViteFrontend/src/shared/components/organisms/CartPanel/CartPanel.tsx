import { useState, useRef } from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useCartStore } from '@/modules/sales/store/cartStore';
import { useSalesStore } from '@/modules/sales/store/salesStore';
import { CartItem } from '@/modules/sales/components/CartItem/CartItem';
import { PaymentModal } from '@/modules/sales/components/PaymentModal/PaymentModal';
import { ReceiptTemplate } from '@/modules/sales/components/Receipt/ReceiptTemplate';
import type { PaymentMethod } from '@/modules/sales/types/pos.types';
import type { Order } from '@/modules/sales/types/pos.types';

/**
 * CartPanel Component (WITH CHECKOUT INTEGRATION)
 * High-contrast, darker cart panel with payment flow
 */
export function CartPanel() {
    const { items, clearCart, updateItemQuantity, voidItem, getTotals } = useCartStore();
    const { addSale } = useSalesStore();
    const totals = getTotals();

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [lastOrder, setLastOrder] = useState<Order | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Handle item removal/void - smart logic based on status
    const handleRemoveItem = (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        // For SENT items, ask for void reason
        if (item.status === 'SENT') {
            const reason = prompt('Void reason (SPOILAGE/CUSTOMER_REQUEST/INPUT_ERROR)?') || 'OTHER';
            voidItem(itemId, reason.toUpperCase());
        } else {
            voidItem(itemId); // Removes NEW items directly
        }
    };

    // Print handler
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
    });

    // Payment confirmation handler
    const handlePaymentConfirm = (paymentMethod: PaymentMethod, cashTendered?: string) => {
        if (items.length === 0) return;

        // Create sale in store
        const order = addSale(
            items,
            totals.subtotal,
            totals.tax,
            totals.discount,
            totals.total,
            paymentMethod,
            cashTendered
        );

        setLastOrder(order);
        setShowPaymentModal(false);

        // Print receipt
        setTimeout(() => {
            if (receiptRef.current) {
                handlePrint();
            }
        }, 500);

        // Clear cart
        setTimeout(() => {
            clearCart();
        }, 1000);

        console.log('✅ Payment completed:', order.invoiceNumber);
    };

    return (
        <>
            <div className="h-full flex flex-col bg-[#0f172a]/90 backdrop-blur-2xl border-r border-white/10 shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white font-['Almarai']">السلة</h2>
                                <p className="text-xs text-gray-400">
                                    {totals.itemCount} {totals.itemCount === 1 ? 'منتج' : 'منتجات'}
                                </p>
                            </div>
                        </div>

                        {items.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 transition-colors group"
                                title="Clear All"
                            >
                                <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Body - Cart Items */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                <ShoppingCart className="w-12 h-12 text-gray-600" />
                            </div>
                            <p className="text-gray-400 font-['Almarai'] text-sm">
                                السلة فارغة
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                                أضف منتجات لبدء الطلب
                            </p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                onUpdateQuantity={updateItemQuantity}
                                onRemove={handleRemoveItem}
                            />
                        ))
                    )}
                </div>

                {/* Footer - Totals & Checkout */}
                {items.length > 0 && (
                    <div className="border-t border-white/10 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm">
                        {/* Summary */}
                        <div className="p-4 space-y-2">
                            {/* Subtotal */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 font-['Almarai']">المجموع الفرعي</span>
                                <span className="text-white font-mono font-semibold">
                                    {parseFloat(totals.subtotal).toFixed(2)} SAR
                                </span>
                            </div>

                            {/* Discount */}
                            {parseFloat(totals.discount) > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-orange-400 font-['Almarai']">الخصم</span>
                                    <span className="text-orange-400 font-mono font-semibold">
                                        -{parseFloat(totals.discount).toFixed(2)} SAR
                                    </span>
                                </div>
                            )}

                            {/* Service Charge (NEW - for DINE_IN) */}
                            {parseFloat(totals.serviceCharge) > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-cyan-400 font-['Almarai']">رسوم الخدمة (15%)</span>
                                    <span className="text-cyan-400 font-mono font-semibold">
                                        +{parseFloat(totals.serviceCharge).toFixed(2)} SAR
                                    </span>
                                </div>
                            )}

                            {/* Tax */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400 font-['Almarai']">الضريبة (15%)</span>
                                <span className="text-gray-300 font-mono font-semibold">
                                    {parseFloat(totals.tax).toFixed(2)} SAR
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/10 my-2" />

                            {/* Total */}
                            <div className="flex items-center justify-between">
                                <span className="text-base font-bold text-white font-['Almarai']">
                                    الإجمالي
                                </span>
                                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
                                    {parseFloat(totals.total).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Checkout Button */}
                        <div className="p-4 pt-0">
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg font-['Almarai'] transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span>إتمام الطلب</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Custom Scrollbar Styles */}
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.02);
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(6, 182, 212, 0.3);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(6, 182, 212, 0.5);
                    }
                `}</style>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    total={totals.total}
                    onConfirm={handlePaymentConfirm}
                    onClose={() => setShowPaymentModal(false)}
                />
            )}

            {/* Hidden Receipt Template */}
            {lastOrder && (
                <div style={{ display: 'none' }}>
                    <ReceiptTemplate ref={receiptRef} order={lastOrder} />
                </div>
            )}
        </>
    );
}
