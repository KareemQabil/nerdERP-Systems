import { useState, useMemo } from 'react';
import { X, RotateCcw, Package, DollarSign, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import Decimal from 'decimal.js';
import { OrdersApiService } from '../../services/orders-api.service';
import { useShiftStore } from '@/modules/shifts/store/shiftStore';

export interface RefundFlowProps {
    order: any;
    onCancel: () => void;
    onComplete: (refundedOrder: any) => void;
}

/**
 * RefundFlow - Refund Item Selection & Processing
 * 
 * Features:
 * - Item selection with checkboxes
 * - Return-to-stock option per item
 * - Refund payment method selector
 * - Real-time refund total calculation
 * - Shift synchronization on successful refund
 */
export function RefundFlow({ order, onCancel, onComplete }: RefundFlowProps) {
    // Get non-refunded items only
    const availableItems = order.items.filter((item: any) => !item.isRefunded);

    // Track selected items with return-to-stock flags
    const [selectedItems, setSelectedItems] = useState<Map<string, boolean>>(new Map());

    // Refund details
    const [refundReason, setRefundReason] = useState('');
    const [refundPaymentMethod, setRefundPaymentMethod] = useState<string>(order.paymentMethod);
    const [processing, setProcessing] = useState(false);

    // Select/Deselect all
    const allSelected = availableItems.length > 0 && selectedItems.size === availableItems.length;

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedItems(new Map());
        } else {
            const newMap = new Map<string, boolean>();
            availableItems.forEach((item: any) => {
                newMap.set(item.id, true); // Default: return to stock
            });
            setSelectedItems(newMap);
        }
    };

    const handleItemToggle = (itemId: string) => {
        const newMap = new Map(selectedItems);
        if (newMap.has(itemId)) {
            newMap.delete(itemId);
        } else {
            newMap.set(itemId, true); // Default: return to stock
        }
        setSelectedItems(newMap);
    };

    const handleReturnToStockToggle = (itemId: string) => {
        const newMap = new Map(selectedItems);
        const currentValue = newMap.get(itemId);
        if (currentValue !== undefined) {
            newMap.set(itemId, !currentValue);
            setSelectedItems(newMap);
        }
    };

    // Calculate refund total
    const refundCalculation = useMemo(() => {
        if (selectedItems.size === 0) {
            return {
                subtotal: '0.000',
                tax: '0.000',
                total: '0.000',
            };
        }

        let refundSubtotal = new Decimal(0);

        selectedItems.forEach((_, itemId) => {
            const item = order.items.find((i: any) => i.id === itemId);
            if (item) {
                refundSubtotal = refundSubtotal.plus(new Decimal(item.lineTotal));
            }
        });

        // Calculate prorated tax
        const originalSubtotal = new Decimal(order.subtotal);
        const taxRate = new Decimal(order.taxAmount).dividedBy(originalSubtotal);
        const refundTax = refundSubtotal.times(taxRate);
        const refundTotal = refundSubtotal.plus(refundTax);

        return {
            subtotal: refundSubtotal.toFixed(3),
            tax: refundTax.toFixed(3),
            total: refundTotal.toFixed(3),
        };
    }, [selectedItems, order]);

    const handleConfirmRefund = async () => {
        if (selectedItems.size === 0) {
            alert('الرجاء اختيار منتج واحد على الأقل');
            return;
        }

        setProcessing(true);

        try {
            // Prepare refund items DTO
            const itemsToRefund = Array.from(selectedItems.entries()).map(([itemId, returnToStock]) => ({
                itemId,
                returnToStock,
            }));

            // Call API to refund order
            const response = await OrdersApiService.refundOrder({
                orderId: order.id,
                itemsToRefund,
                refundReason: refundReason || undefined,
                refundPaymentMethod,
            });

            const refundedOrder = response.data;

            // ✅ CRITICAL INTEGRATION POINT: Sync with Shift Store
            // Immediately update shift cash tracking after successful refund
            const { addRefund } = useShiftStore.getState();
            addRefund(
                refundCalculation.total,
                refundPaymentMethod as any // Convert to TransactionType
            );

            console.log('✅ Refund complete - Shift synchronized:', {
                amount: refundCalculation.total,
                method: refundPaymentMethod,
            });

            // Notify parent to refresh and show success
            onComplete(refundedOrder);

            alert(`تم الاسترجاع بنجاح!\nالمبلغ: ${parseFloat(refundCalculation.total).toFixed(2)} SAR`);
        } catch (error: any) {
            console.error('Refund failed:', error);
            alert(`فشل الاسترجاع: ${error.message || 'حدث خطأ'}`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-500/10 to-orange-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white font-['Almarai']">استرجاع الطلب</h3>
                        <p className="text-sm text-gray-400">Refund Order {order.orderNumber}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Body: Item Selection */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Instructions */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                    <p className="text-sm text-orange-400 font-['Almarai']">
                        اختر المنتجات المراد استرجاعها. يمكنك اختيار إرجاع المنتجات للمخزون أو عدم إرجاعها.
                    </p>
                </div>

                {/* Select All */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-cyan-500 checked:border-cyan-500 cursor-pointer"
                    />
                    <label className="flex-1 text-white font-['Almarai'] font-bold cursor-pointer" onClick={handleSelectAll}>
                        تحديد الكل
                    </label>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                    {availableItems.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                            جميع المنتجات تم استرجاعها مسبقاً
                        </div>
                    ) : (
                        availableItems.map((item: any) => {
                            const isSelected = selectedItems.has(item.id);
                            const returnToStock = selectedItems.get(item.id) || false;

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl border-2 transition-all ${isSelected
                                            ? 'bg-cyan-500/10 border-cyan-400/50'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    {/* Item checkbox and name */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleItemToggle(item.id)}
                                            className="mt-1 w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-cyan-500 checked:border-cyan-500 cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <p className="text-white font-['Almarai'] font-bold mb-1">{item.productName}</p>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">
                                                    الكمية: <span className="font-mono text-white">{parseFloat(item.quantity).toFixed(0)}</span>
                                                </span>
                                                <span className="text-cyan-400 font-mono font-bold">
                                                    {parseFloat(item.lineTotal).toFixed(2)} SAR
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Return to Stock Option (only if selected) */}
                                    {isSelected && (
                                        <div className="flex items-center gap-3 p-3 mt-3 rounded-lg bg-white/5 border border-white/10">
                                            <input
                                                type="checkbox"
                                                checked={returnToStock}
                                                onChange={() => handleReturnToStockToggle(item.id)}
                                                className="w-4 h-4 rounded border-2 border-white/20 bg-white/5 checked:bg-emerald-500 checked:border-emerald-500 cursor-pointer"
                                            />
                                            <label
                                                className="flex items-center gap-2 text-sm text-gray-300 font-['Almarai'] cursor-pointer"
                                                onClick={() => handleReturnToStockToggle(item.id)}
                                            >
                                                <Package className="w-4 h-4" />
                                                <span>إرجاع للمخزون</span>
                                            </label>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Refund Summary */}
                {selectedItems.size > 0 && (
                    <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
                        <p className="text-sm font-bold text-white font-['Almarai'] mb-3">ملخص الاسترجاع</p>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400 font-['Almarai']">المجموع الفرعي:</span>
                            <span className="text-white font-mono">{parseFloat(refundCalculation.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400 font-['Almarai']">الضريبة (متناسبة):</span>
                            <span className="text-white font-mono">{parseFloat(refundCalculation.tax).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
                            <span className="text-white font-['Almarai']">إجمالي الاسترجاع:</span>
                            <span className="text-red-400 font-mono">{parseFloat(refundCalculation.total).toFixed(2)} SAR</span>
                        </div>
                    </div>
                )}

                {/* Refund Payment Method Selector */}
                {selectedItems.size > 0 && (
                    <div>
                        <label className="block text-sm font-bold text-white font-['Almarai'] mb-2">
                            طريقة الاسترجاع
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setRefundPaymentMethod('CASH')}
                                className={`p-4 rounded-xl border-2 transition-all ${refundPaymentMethod === 'CASH'
                                        ? 'bg-emerald-500/20 border-emerald-400/50'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <DollarSign className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                                <p className="text-white font-['Almarai'] font-bold">نقدي</p>
                                <p className="text-xs text-gray-400">Cash</p>
                            </button>
                            <button
                                onClick={() => setRefundPaymentMethod('CARD')}
                                className={`p-4 rounded-xl border-2 transition-all ${refundPaymentMethod === 'CARD'
                                        ? 'bg-blue-500/20 border-blue-400/50'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                <CreditCard className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                <p className="text-white font-['Almarai'] font-bold">بطاقة</p>
                                <p className="text-xs text-gray-400">Card</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Refund Reason (Optional) */}
                <div>
                    <label className="block text-sm font-bold text-white font-['Almarai'] mb-2">
                        سبب الاسترجاع (اختياري)
                    </label>
                    <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        rows={3}
                        placeholder="مثال: شكوى العميل، منتج معيب..."
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 text-white placeholder-gray-500 resize-none transition-all"
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/10 bg-slate-900/50 flex gap-3">
                <button
                    onClick={onCancel}
                    disabled={processing}
                    className="flex-1 h-14 rounded-xl bg-white/5 hover:bg-white/10 text-white font-['Almarai'] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    إلغاء
                </button>
                <button
                    onClick={handleConfirmRefund}
                    disabled={selectedItems.size === 0 || processing}
                    className="flex-1 h-14 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-['Almarai'] font-bold shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {processing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>جاري الاسترجاع...</span>
                        </>
                    ) : (
                        <>
                            <RotateCcw className="w-5 h-5" />
                            <span>تأكيد الاسترجاع</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
