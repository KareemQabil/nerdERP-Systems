import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Check } from 'lucide-react';
import type { CartItem, PaymentMethod } from '../types/pos.types';

interface ReceiptPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment?: {
        method: PaymentMethod;
        amount: number;
        change?: number;
        orderNumber: string;
    } | null;
    items: CartItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
}

export function ReceiptPreviewModal({
    isOpen,
    onClose,
    payment,
    items,
    subtotal,
    tax,
    discount,
    total,
}: ReceiptPreviewModalProps) {
    const [isPrinting, setIsPrinting] = useState(false);
    const [printComplete, setPrintComplete] = useState(false);

    if (!isOpen || !payment) return null;

    const { orderNumber, method, amount, change: paymentChange } = payment;

    const handlePrint = async () => {
        setIsPrinting(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsPrinting(false);
        setPrintComplete(true);

        setTimeout(() => {
            setPrintComplete(false);
            onClose();
        }, 1500);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-[var(--surface)] w-full max-w-md max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden border border-[var(--outline-variant)] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[var(--outline-variant)]">
                        <div>
                            <h2 className="text-xl font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                معاينة الفاتورة
                            </h2>
                            <p className="text-sm text-[var(--on-surface-variant)] font-['Almarai'] mt-1" dir="auto">
                                فاتورة رقم {orderNumber}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-lg bg-[var(--surface-variant)] hover:bg-[var(--outline-variant)] flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-[var(--on-surface-variant)]" />
                        </button>
                    </div>

                    {/* Receipt Preview */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="bg-white text-black p-6 rounded-xl border-2 border-gray-200 font-mono text-sm">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <h1 className="font-bold text-xl mb-2">نظام نيرد POS</h1>
                                <p className="text-sm">Nerd POS System</p>
                                <div className="border-t-2 border-dashed border-gray-300 my-3" />
                            </div>

                            {/* Order Info */}
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between">
                                    <span>Invoice #:</span>
                                    <span className="font-bold">{orderNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Date:</span>
                                    <span>{new Date().toLocaleString('ar-SA')}</span>
                                </div>
                                <div className="border-t border-gray-300 my-2" />
                            </div>

                            {/* Items */}
                            <div className="space-y-2 mb-4">
                                {items.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between">
                                            <span>
                                                {item.quantity}x {item.product.name}
                                            </span>
                                            <span>{item.total.toFixed(2)}</span>
                                        </div>
                                        {item.modifiers?.map((mod, modIdx) => (
                                            <div key={modIdx} className="text-xs text-gray-600 ml-4">
                                                + {mod.name} (+{mod.price.toFixed(2)})
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                <div className="border-t border-gray-300 my-2" />
                            </div>

                            {/* Totals */}
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{subtotal.toFixed(2)} SAR</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax (15%):</span>
                                    <span>{tax.toFixed(2)} SAR</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount:</span>
                                        <span>-{discount.toFixed(2)} SAR</span>
                                    </div>
                                )}
                                <div className="border-t-2 border-gray-300 my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>TOTAL:</span>
                                    <span>{total.toFixed(2)} SAR</span>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="space-y-1 mb-4">
                                <div className="border-t border-gray-300 my-2" />
                                <div className="flex justify-between">
                                    <span>Payment Method:</span>
                                    <span className="uppercase">{method}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Paid:</span>
                                    <span>{amount.toFixed(2)} SAR</span>
                                </div>
                                {paymentChange && paymentChange > 0 && (
                                    <div className="flex justify-between font-bold">
                                        <span>Change:</span>
                                        <span>{paymentChange.toFixed(2)} SAR</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="text-center mt-6 border-t-2 border-dashed border-gray-300 pt-3">
                                <p className="font-bold">Thank you! شكراً لك</p>
                                <p className="text-xs mt-2">Powered by NerdPOS</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 border-t border-[var(--outline-variant)] flex gap-3">
                        <button
                            onClick={handlePrint}
                            disabled={isPrinting || printComplete}
                            className="flex-1 h-14 rounded-xl font-['Almarai'] font-bold text-white transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            style={{
                                background: printComplete
                                    ? 'linear-gradient(to bottom, #10b981, #059669)'
                                    : 'linear-gradient(to bottom, #22d3ee, #0891b2)',
                            }}
                        >
                            {printComplete ? (
                                <>
                                    <Check className="w-5 h-5" />
                                    <span dir="auto">تم الطباعة</span>
                                </>
                            ) : isPrinting ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <Printer className="w-5 h-5" />
                                    </motion.div>
                                    <span dir="auto">جاري الطباعة...</span>
                                </>
                            ) : (
                                <>
                                    <Printer className="w-5 h-5" />
                                    <span dir="auto">طباعة</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isPrinting}
                            className="flex-1 h-14 rounded-xl bg-[var(--surface-variant)] hover:bg-[var(--outline-variant)] text-[var(--on-surface)] font-['Almarai'] font-bold transition-colors disabled:opacity-50"
                        >
                            <span dir="auto">إغلاق</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
