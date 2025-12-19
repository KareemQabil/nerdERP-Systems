import { useRef } from 'react';
import { X, Printer, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import type { OrderResponse } from '@/modules/sales/services/orders-api.service';

export interface ReceiptModalProps {
    order: OrderResponse;
    onNewOrder: () => void;
    onClose: () => void;
}

/**
 * ReceiptModal Component - OPTIMIZED WITH react-to-print
 * Pixel-perfect receipt design for 80mm thermal printers
 * 
 * Features:
 * - Uses react-to-print for clean component-scoped printing
 * - Fixed 320px (80mm) width for standard thermal paper
 * - Monospaced font for perfect alignment
 * - Word wrapping for long product names
 * - Dashed separators (thermal receipt style)
 * - High contrast (black text on white background)
 * 
 * @example
 * <ReceiptModal
 *   order={orderData}
 *   onNewOrder={handleNewOrder}
 *   onClose={handleClose}
 * />
 */
export function ReceiptModal({ order, onNewOrder, onClose }: ReceiptModalProps) {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Receipt-${order.orderNumber}`,
    });

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('ar-SA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            >
                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-gray-100 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Success Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-emerald-50">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-['Almarai'] font-bold text-gray-900">
                                    تم الدفع بنجاح
                                </h2>
                                <p className="text-xs text-gray-600">رقم الطلب: {order.orderNumber}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* PRINTABLE RECEIPT AREA - 320px (80mm) WIDTH */}
                    <div className="flex justify-center p-4">
                        <div
                            ref={componentRef}
                            className="w-[320px] bg-white text-black p-4"
                        >
                            {/* Store Info */}
                            <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
                                <h1 className="text-xl font-bold text-gray-900 font-['Almarai']">
                                    NerdPOS
                                </h1>
                                <p className="text-xs text-gray-700 mt-1 font-['Almarai']">نظام نقاط البيع</p>
                                <p className="text-[10px] text-gray-600 mt-2">
                                    الرياض، المملكة العربية السعودية
                                </p>
                                <p className="text-[10px] text-gray-600">VAT: 123456789</p>
                            </div>

                            {/* Order Info */}
                            <div className="space-y-1 border-b border-dashed border-gray-400 pb-3 mb-3">
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-gray-900 font-['Almarai']">رقم الطلب:</span>
                                    <span className="font-mono text-gray-800">{order.orderNumber}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-gray-900 font-['Almarai']">التاريخ:</span>
                                    <span className="font-mono text-gray-800 text-[10px]">{formatDateTime(order.createdAt)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-gray-900 font-['Almarai']">نوع الطلب:</span>
                                    <span className="font-['Almarai'] text-gray-800">
                                        {order.orderType === 'TAKEAWAY' ? 'تيك أواي' : order.orderType === 'DINE_IN' ? 'داخل المحل' : 'توصيل'}
                                    </span>
                                </div>
                                {order.customerName && (
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold text-gray-900 font-['Almarai']">العميل:</span>
                                        <span className="font-['Almarai'] text-gray-800">{order.customerName}</span>
                                    </div>
                                )}
                            </div>

                            {/* Items List */}
                            {/* Items List - STRICT BASE + MODIFIERS TABLE */}
                            <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
                                <div className="text-xs font-bold text-gray-900 mb-2 font-['Almarai']">المنتجات:</div>
                                {order.items.map((item, index) => (
                                    <div key={index} className="mb-3">
                                        {/* Row: Product Name | Unit Price | Qty | Line Total */}
                                        <div className="flex justify-between items-start text-xs">
                                            <div className="flex-1 pr-2">
                                                <span className="font-['Almarai'] font-bold text-gray-900 break-words">
                                                    {item.productName}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 whitespace-nowrap">
                                                <span className="font-mono text-gray-700 w-12 text-right">
                                                    {parseFloat(item.unitPrice).toFixed(2)}
                                                </span>
                                                <span className="font-mono text-gray-700 w-8 text-center">
                                                    × {parseFloat(item.quantity).toFixed(0)}
                                                </span>
                                                <span className="font-mono font-bold text-gray-900 w-14 text-right">
                                                    {parseFloat(item.lineTotal).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Modifiers - Indented with Add-on Prices */}
                                        {item.modifiers && item.modifiers.length > 0 && (
                                            <div className="mr-4 mt-1 space-y-0.5">
                                                {item.modifiers.map((mod, modIndex) => (
                                                    <div key={modIndex} className="text-[10px] text-gray-600 font-['Almarai']">
                                                        <span>+ {mod.optionName}</span>
                                                        {parseFloat(mod.price) > 0 && (
                                                            <span className="font-mono"> (+{parseFloat(mod.price).toFixed(2)})</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Special Instructions */}
                                        {item.specialInstructions && (
                                            <div className="mr-4 mt-1 text-[10px] text-amber-700">
                                                <span className="font-['Almarai']">📝 {item.specialInstructions}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="space-y-1 mb-3">
                                <div className="flex justify-between text-xs">
                                    <span className="font-['Almarai'] text-gray-700">المجموع الفرعي:</span>
                                    <span className="font-mono text-gray-900">{parseFloat(order.subtotal).toFixed(2)}</span>
                                </div>
                                {parseFloat(order.discountAmount) > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="font-['Almarai'] text-emerald-600">الخصم:</span>
                                        <span className="font-mono text-emerald-600">-{parseFloat(order.discountAmount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs">
                                    <span className="font-['Almarai'] text-gray-700">ض.ق.م (15%):</span>
                                    <span className="font-mono text-gray-900">{parseFloat(order.taxAmount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold border-t-2 border-gray-900 pt-2 mt-2">
                                    <span className="text-gray-900 font-['Almarai']">الإجمالي:</span>
                                    <span className="font-mono text-gray-900">{parseFloat(order.totalAmount).toFixed(2)} ر.س</span>
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="space-y-1 border-t border-dashed border-gray-400 pt-3 mb-3">
                                <div className="flex justify-between text-xs">
                                    <span className="font-bold text-gray-900 font-['Almarai']">طريقة الدفع:</span>
                                    <span className="font-['Almarai'] text-gray-800">
                                        {order.paymentMethod === 'CASH' ? 'نقدي' :
                                            order.paymentMethod === 'CARD' ? 'بطاقة' :
                                                order.paymentMethod === 'MADA' ? 'مدى' :
                                                    order.paymentMethod}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="font-['Almarai'] text-gray-700">المبلغ المدفوع:</span>
                                    <span className="font-mono text-gray-900">{parseFloat(order.amountPaid).toFixed(2)}</span>
                                </div>
                                {parseFloat(order.changeAmount) > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="font-['Almarai'] text-gray-700">الباقي:</span>
                                        <span className="font-mono text-emerald-600 font-bold">{parseFloat(order.changeAmount).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer Message */}
                            <div className="text-center text-xs text-gray-600 border-t border-dashed border-gray-400 pt-3">
                                <p className="font-['Almarai'] font-bold">شكراً لزيارتك</p>
                                <p className="font-['Almarai'] mt-1">نسعد بخدمتك دائماً</p>
                                <p className="font-mono text-[10px] mt-2 text-gray-500">{order.orderNumber}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t border-gray-200 space-y-2 bg-white">
                        <button
                            onClick={handlePrint}
                            className="w-full h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-['Almarai'] font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Printer className="w-5 h-5" />
                            <span>طباعة الفاتورة</span>
                        </button>
                        <button
                            onClick={onNewOrder}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-['Almarai'] font-bold transition-all"
                        >
                            طلب جديد
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
