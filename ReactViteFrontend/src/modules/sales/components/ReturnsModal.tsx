import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Search, DollarSign } from 'lucide-react';
import { useState } from 'react';
import type { PaymentMethod } from '../types/pos.types';

interface ReturnItem {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

interface ReturnsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProcessReturn: (
        orderNumber: string,
        items: ReturnItem[],
        refundMethod: PaymentMethod,
        reason: string
    ) => void;
}

export function ReturnsModal({
    isOpen,
    onClose,
    onProcessReturn,
}: ReturnsModalProps) {
    const [orderNumber, setOrderNumber] = useState('');
    const [reason, setReason] = useState('');
    const [refundMethod, setRefundMethod] = useState<PaymentMethod>('cash');
    const [searchedOrder, setSearchedOrder] = useState<any>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const handleSearch = async () => {
        // Mock search - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setSearchedOrder({
            id: '1',
            orderNumber: orderNumber,
            items: [
                { id: '1', productName: 'برجر دجاج', quantity: 2, price: 25, total: 50 },
                { id: '2', productName: 'بطاطس مقلية', quantity: 1, price: 15, total: 15 },
            ],
            total: 65,
            paymentMethod: 'cash',
        });
    };

    const toggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const calculateRefund = () => {
        if (!searchedOrder) return 0;
        return searchedOrder.items
            .filter((item: any) => selectedItems.has(item.id))
            .reduce((sum: number, item: any) => sum + item.total, 0);
    };

    const handleProcess = async () => {
        if (!searchedOrder || selectedItems.size === 0) return;

        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        const returnItems: ReturnItem[] = searchedOrder.items
            .filter((item: any) => selectedItems.has(item.id))
            .map((item: any) => ({
                id: item.id,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                total: item.total,
            }));

        onProcessReturn(orderNumber, returnItems, refundMethod, reason);
        setIsProcessing(false);
        onClose();
    };

    const refundAmount = calculateRefund();

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[85vh] bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--outline-variant)] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[var(--surface-variant)] border-b border-[var(--outline-variant)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-400 flex items-center justify-center">
                                <RotateCcw className="w-5 h-5 text-[#00373a]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                    إرجاع المنتجات
                                </h2>
                                <p className="text-sm text-[var(--on-surface-variant)]">
                                    استرداد المبالغ والمرتجعات
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="w-10 h-10 rounded-xl hover:bg-[var(--surface)] transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-[var(--on-surface-variant)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Order Search */}
                        <div className="space-y-3">
                            <label className="block text-sm font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                رقم الفاتورة
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    disabled={isProcessing}
                                    placeholder="ORD-123456"
                                    className="flex-1 px-4 py-3 bg-[var(--surface-variant)] border border-[var(--outline-variant)] rounded-xl text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] font-['Arial'] focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
                                    dir="ltr"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={!orderNumber || isProcessing}
                                    className="px-6 py-3 rounded-xl bg-cyan-400 text-[#00373a] font-['Almarai'] font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    <Search className="w-5 h-5" />
                                    <span dir="auto">بحث</span>
                                </button>
                            </div>
                        </div>

                        {/* Order Items */}
                        {searchedOrder && (
                            <div className="space-y-4">
                                <h3 className="text-base font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                    عناصر الفاتورة
                                </h3>
                                <div className="space-y-2">
                                    {searchedOrder.items.map((item: any) => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(item.id)}
                                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedItems.has(item.id)
                                                    ? 'bg-orange-400/10 border-orange-400'
                                                    : 'bg-[var(--surface-variant)] border-[var(--outline-variant)] hover:border-orange-400/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-xs text-[var(--on-surface-variant)]">
                                                        الكمية: {item.quantity} × {item.price.toFixed(2)} ر.س
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-['Arial'] font-bold text-[var(--on-surface)]">
                                                        {item.total.toFixed(2)} ر.س
                                                    </p>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.has(item.id)}
                                                        onChange={() => toggleItem(item.id)}
                                                        className="mt-1 w-5 h-5 rounded accent-orange-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Refund Method */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                        طريقة الاسترداد
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['cash', 'mada', 'visa'] as PaymentMethod[]).map((method) => (
                                            <button
                                                key={method}
                                                onClick={() => setRefundMethod(method)}
                                                className={`py-3 rounded-xl font-['Almarai'] font-bold transition-all ${refundMethod === method
                                                        ? 'bg-orange-400 text-[#00373a]'
                                                        : 'bg-[var(--surface-variant)] border border-[var(--outline-variant)] text-[var(--on-surface)]'
                                                    }`}
                                            >
                                                {method === 'cash' ? 'نقدي' : method === 'mada' ? 'مدى' : 'فيزا'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                        سبب الإرجاع
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        disabled={isProcessing}
                                        placeholder="اذكر سبب الإرجاع..."
                                        className="w-full px-4 py-3 bg-[var(--surface-variant)] border border-[var(--outline-variant)] rounded-xl text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] font-['Almarai'] focus:outline-none focus:border-orange-400 resize-none transition-colors disabled:opacity-50"
                                        rows={3}
                                        dir="rtl"
                                    />
                                </div>

                                {/* Refund Amount */}
                                {refundAmount > 0 && (
                                    <div className="bg-gradient-to-r from-orange-400/10 to-red-600/10 border border-orange-400/30 rounded-2xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-5 h-5 text-orange-400" />
                                                <span className="text-sm font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                                    المبلغ المسترد
                                                </span>
                                            </div>
                                            <span className="text-2xl font-['Arial'] font-bold text-orange-400">
                                                {refundAmount.toFixed(2)} ر.س
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {searchedOrder && selectedItems.size > 0 && (
                        <div className="px-6 py-4 border-t border-[var(--outline-variant)] flex gap-3">
                            <button
                                onClick={handleProcess}
                                disabled={!reason || isProcessing}
                                className="flex-1 h-14 rounded-xl bg-gradient-to-b from-orange-400 to-red-600 text-[#00373a] font-['Almarai'] font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                <RotateCcw className="w-5 h-5" />
                                <span dir="auto">{isProcessing ? 'جاري المعالجة...' : 'إتمام الإرجاع'}</span>
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="px-6 h-14 rounded-xl bg-[var(--surface-variant)] hover:bg-[var(--outline-variant)] text-[var(--on-surface)] font-['Almarai'] font-bold transition-colors disabled:opacity-50"
                            >
                                <span dir="auto">إلغاء</span>
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
