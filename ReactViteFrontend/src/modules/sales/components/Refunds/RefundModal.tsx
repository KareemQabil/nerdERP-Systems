import { useState, useMemo } from 'react';
import { X, AlertTriangle, Check, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Decimal from 'decimal.js';
import { useOrdersStore } from '../../store/ordersStore';
import type { OrderWithRefunds, RefundItem, RefundTransaction } from '../../types/refund.types';

export interface RefundModalProps {
    order: OrderWithRefunds;
    onClose: () => void;
    onConfirm: () => void;
}

interface RefundItemState {
    orderItemId: string;
    refundQuantity: string;
    returnToStock: boolean;
}

export function RefundModal({ order, onClose, onConfirm }: RefundModalProps) {
    const { validateRefundQuantity, processRefund } = useOrdersStore();
    const [isProcessing, setIsProcessing] = useState(false);

    // Initialize refund state for each item
    const [refundItems, setRefundItems] = useState<RefundItemState[]>(
        order.items.map((item) => ({
            orderItemId: item.id,
            refundQuantity: '0',
            returnToStock: true,
        }))
    );

    // Calculate totals and validation
    const refundSummary = useMemo(() => {
        let totalRefund = new Decimal(0);
        const errors: string[] = [];
        const validItems: RefundItem[] = [];

        refundItems.forEach((refundState, index) => {
            const orderItem = order.items[index];
            const qty = refundState.refundQuantity;

            if (parseFloat(qty) > 0) {
                // Validate
                const validation = validateRefundQuantity(qty, orderItem.quantity, orderItem.refundedQuantity);

                if (!validation.valid) {
                    errors.push(`${orderItem.productName}: ${validation.error}`);
                } else {
                    // Calculate line total
                    const lineTotal = new Decimal(qty).times(orderItem.unitPrice);
                    totalRefund = totalRefund.plus(lineTotal);

                    validItems.push({
                        orderItemId: orderItem.id,
                        productId: orderItem.productId,
                        productName: orderItem.productName,
                        originalQuantity: orderItem.quantity,
                        refundQuantity: qty,
                        unitPrice: orderItem.unitPrice,
                        lineTotal: lineTotal.toFixed(3),
                        returnToStock: refundState.returnToStock,
                    });
                }
            }
        });

        return {
            total: totalRefund.toFixed(3),
            items: validItems,
            errors,
            isValid: errors.length === 0 && validItems.length > 0,
        };
    }, [refundItems, order.items, validateRefundQuantity]);

    const handleQuantityChange = (index: number, value: string) => {
        // Only allow numbers and decimals
        if (value && !/^\d*\.?\d*$/.test(value)) return;

        const newRefundItems = [...refundItems];
        newRefundItems[index].refundQuantity = value;
        setRefundItems(newRefundItems);
    };

    const handleToggleReturn = (index: number) => {
        const newRefundItems = [...refundItems];
        newRefundItems[index].returnToStock = !newRefundItems[index].returnToStock;
        setRefundItems(newRefundItems);
    };

    const handleSetMaxQty = (index: number) => {
        const orderItem = order.items[index];
        const maxQty = new Decimal(orderItem.quantity).minus(orderItem.refundedQuantity).toString();
        const newRefundItems = [...refundItems];
        newRefundItems[index].refundQuantity = maxQty;
        setRefundItems(newRefundItems);
    };

    const handleConfirm = async () => {
        if (!refundSummary.isValid) return;

        setIsProcessing(true);

        try {
            const refundTransaction: RefundTransaction = {
                id: `refund-${Date.now()}`,
                originalOrderId: order.id,
                originalOrderNumber: order.orderNumber,
                refundDate: new Date().toISOString(),
                refundMethod: order.paymentMethod === 'CASH' ? 'CASH' : 'CARD',
                totalRefundAmount: refundSummary.total,
                items: refundSummary.items,
                processedByUserId: 'user-1', // TODO: Get from auth
                registerSessionId: 'session-1', // TODO: Get from shift
                notes: '',
            };

            await processRefund(refundTransaction);

            alert(`✅ Refund processed successfully!\n\nAmount: ${parseFloat(refundSummary.total).toFixed(2)} SAR\nMethod: ${refundTransaction.refundMethod}`);

            onConfirm();
        } catch (error) {
            alert(`❌ Refund failed:\n${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    onClick={!isProcessing ? onClose : undefined}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-800/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-b from-red-500/10 to-transparent">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center">
                                        <RotateCw className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white font-['Almarai']">استرجاع الطلب</h2>
                                        <p className="text-sm text-gray-400">Refund Order</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-lg font-bold text-white font-mono">{order.orderNumber}</span>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-gray-300">
                                        {order.paymentMethod === 'CASH' ? '💵 نقدي' : '💳 بطاقة'}
                                    </span>
                                </div>
                            </div>
                            {!isProcessing && (
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"
                                >
                                    <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Body - Scrollable Items List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {order.items.map((item, index) => {
                            const refundState = refundItems[index];
                            const maxRefundable = new Decimal(item.quantity).minus(item.refundedQuantity);
                            const currentLineTotal = refundState.refundQuantity
                                ? new Decimal(refundState.refundQuantity).times(item.unitPrice)
                                : new Decimal(0);

                            return (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                                >
                                    {/* Product Name & Price */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{item.productName}</h3>
                                            <p className="text-sm text-gray-400">
                                                الكمية الأصلية: {parseFloat(item.quantity)} | مسترجع: {parseFloat(item.refundedQuantity)}
                                            </p>
                                        </div>
                                        <p className="text-lg font-bold text-cyan-400 font-mono">
                                            {parseFloat(item.unitPrice).toFixed(2)} SAR
                                        </p>
                                    </div>

                                    {/* Refund Quantity Input */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">كمية الاسترجاع</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={refundState.refundQuantity}
                                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                    disabled={isProcessing || maxRefundable.isZero()}
                                                    className="flex-1 h-10 px-3 rounded-xl bg-white/10 border border-white/20 focus:border-cyan-400/50 text-white font-mono text-center transition-all outline-none disabled:opacity-50"
                                                    placeholder="0"
                                                />
                                                <button
                                                    onClick={() => handleSetMaxQty(index)}
                                                    disabled={isProcessing || maxRefundable.isZero()}
                                                    className="px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-400 text-xs font-bold transition-all disabled:opacity-50"
                                                >
                                                    Max
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Max: {maxRefundable.toString()}</p>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">الإجمالي</label>
                                            <div className="h-10 px-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center">
                                                <span className="text-emerald-400 font-mono font-bold">
                                                    {currentLineTotal.toFixed(2)} SAR
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Return to Stock Toggle */}
                                    <button
                                        onClick={() => handleToggleReturn(index)}
                                        disabled={isProcessing}
                                        className={cn(
                                            'w-full h-10 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm',
                                            refundState.returnToStock
                                                ? 'bg-green-500/20 border-green-400/50 text-green-400'
                                                : 'bg-orange-500/20 border-orange-400/50 text-orange-400'
                                        )}
                                    >
                                        {refundState.returnToStock ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>إرجاع للمخزون / Return to Stock</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertTriangle className="w-4 h-4" />
                                                <span>تالف / Mark as Waste</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}

                        {/* Validation Errors */}
                        {refundSummary.errors.length > 0 && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-400/30">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                                    <div>
                                        {refundSummary.errors.map((error, i) => (
                                            <p key={i} className="text-sm text-red-400">
                                                {error}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer - Total & Actions */}
                    <div className="p-6 bg-gradient-to-t from-black/40 to-transparent border-t border-white/10">
                        <div className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 font-['Almarai']">إجمالي المبلغ المسترجع</span>
                                <span className="text-3xl font-bold text-emerald-400 font-mono">
                                    {parseFloat(refundSummary.total).toFixed(2)} SAR
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold font-['Almarai'] transition-all disabled:opacity-50"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!refundSummary.isValid || isProcessing}
                                className={cn(
                                    "flex-1 h-14 rounded-2xl font-bold font-['Almarai'] transition-all flex items-center justify-center gap-2",
                                    refundSummary.isValid && !isProcessing
                                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                                        : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                )}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>جاري المعالجة...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>تأكيد الاسترجاع</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
