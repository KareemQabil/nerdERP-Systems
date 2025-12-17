import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ShoppingCart, DollarSign, Trash2, RotateCcw } from 'lucide-react';
import type { HeldOrder } from '../services/held-order.service';

interface HoldOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    heldOrders: HeldOrder[];
    onRetrieve: (orderId: string) => void;
    onDelete: (orderId: string) => void;
}

export function HoldOrdersModal({
    isOpen,
    onClose,
    heldOrders,
    onRetrieve,
    onDelete,
}: HoldOrdersModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-3xl max-h-[80vh] bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--outline-variant)]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[var(--surface-variant)] border-b border-[var(--outline-variant)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-[#00373a]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                    الفواتير المعلقة
                                </h2>
                                <p className="text-sm text-[var(--on-surface-variant)]">
                                    {heldOrders.length} فاتورة محفوظة
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl hover:bg-[var(--surface)] transition-colors flex items-center justify-center"
                        >
                            <X className="w-5 h-5 text-[var(--on-surface-variant)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
                        {heldOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-24 h-24 rounded-full bg-[var(--surface-variant)] flex items-center justify-center mb-4">
                                    <Clock className="w-12 h-12 text-[var(--on-surface-variant)] opacity-50" />
                                </div>
                                <h3 className="text-lg font-['Almarai'] font-bold text-[var(--on-surface)] mb-2" dir="auto">
                                    لا توجد فواتير معلقة
                                </h3>
                                <p className="text-sm font-['Almarai'] text-[var(--on-surface-variant)]" dir="auto">
                                    استخدم زر "تعليق الطلب" لحفظ الطلبات للعودة إليها لاحقاً
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {heldOrders.map((order, index) => (
                                        <motion.div
                                            key={order.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group bg-[var(--surface-variant)] border border-[var(--outline-variant)] rounded-xl p-4 hover:border-cyan-400 transition-all cursor-pointer"
                                            onClick={() => onRetrieve(order.id)}
                                        >
                                            {/* Order Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-['Arial'] font-bold text-cyan-400">
                                                            #{order.orderNumber}
                                                        </span>
                                                        {order.customerName && (
                                                            <span className="text-xs font-['Almarai'] text-[var(--on-surface-variant)] bg-[var(--surface)] px-2 py-0.5 rounded">
                                                                {order.customerName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[var(--on-surface-variant)]">
                                                        {order.timestamp.toLocaleTimeString('ar-SA', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(order.id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg hover:bg-red-500/20 hover:text-red-500 text-[var(--on-surface-variant)] transition-all flex items-center justify-center"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Order Stats */}
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div className="flex items-center gap-2 bg-[var(--surface)] rounded-lg px-3 py-2">
                                                    <ShoppingCart className="w-4 h-4 text-cyan-400" />
                                                    <div>
                                                        <p className="text-xs text-[var(--on-surface-variant)]" dir="auto">
                                                            العناصر
                                                        </p>
                                                        <p className="text-sm font-['Arial'] font-bold text-[var(--on-surface)]">
                                                            {order.itemsCount}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 bg-[var(--surface)] rounded-lg px-3 py-2">
                                                    <DollarSign className="w-4 h-4 text-cyan-400" />
                                                    <div>
                                                        <p className="text-xs text-[var(--on-surface-variant)]" dir="auto">
                                                            الإجمالي
                                                        </p>
                                                        <p className="text-sm font-['Arial'] font-bold text-[var(--on-surface)]">
                                                            {order.total.toFixed(2)} ر.س
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Retrieve Button */}
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => onRetrieve(order.id)}
                                                className="w-full py-2.5 rounded-lg bg-cyan-400 text-[#00373a] font-['Almarai'] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span dir="auto">استعادة الطلب</span>
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
