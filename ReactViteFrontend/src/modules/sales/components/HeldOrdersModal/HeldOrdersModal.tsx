import { useState, useEffect } from 'react';
import { X, Clock, DollarSign, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HeldOrdersService, type HeldOrder } from '../../services/held-orders.service';

export interface HeldOrdersModalProps {
    onClose: () => void;
    onRestore: (order: HeldOrder) => void;
}

export function HeldOrdersModal({ onClose, onRestore }: HeldOrdersModalProps) {
    const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);

    useEffect(() => {
        loadHeldOrders();
    }, []);

    const loadHeldOrders = () => {
        const orders = HeldOrdersService.getHeldOrders();
        setHeldOrders(orders);
    };

    const handleRestore = (order: HeldOrder) => {
        onRestore(order);
        HeldOrdersService.deleteOrder(order.id);
        onClose();
    };

    const handleDelete = (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('هل تريد حذف هذا الطلب المعلق؟')) {
            HeldOrdersService.deleteOrder(orderId);
            loadHeldOrders();
        }
    };

    const getTimeElapsed = (heldAt: string): string => {
        const now = new Date().getTime();
        const held = new Date(heldAt).getTime();
        const diffMinutes = Math.floor((now - held) / 1000 / 60);

        if (diffMinutes < 1) return 'الآن';
        if (diffMinutes < 60) return `${diffMinutes} دقيقة`;
        const diffHours = Math.floor(diffMinutes / 60);
        return `${diffHours} ساعة`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Main Glass Modal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-6xl max-h-[85vh] bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(251,146,60,0.15)]">
                                <Clock className="w-6 h-6 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white font-['Almarai']">الطلبات المعلقة</h2>
                                <p className="text-sm text-orange-400/80">{heldOrders.length} طلب معلق</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 group"
                        >
                            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {heldOrders.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                                    <Clock className="w-12 h-12 text-gray-500" />
                                </div>
                                <p className="text-xl text-gray-400 font-['Almarai']">لا توجد طلبات معلقة</p>
                                <p className="text-sm text-gray-500 mt-2">استخدم زر "تعليق" من الشاشة الرئيسية</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {heldOrders.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-orange-400/30 transition-all duration-300 group"
                                >
                                    {/* Card Header */}
                                    <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4 border-b border-white/5">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white font-['Almarai'] mb-1">
                                                    {order.referenceNote || 'طلب بدون عنوان'}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <Clock className="w-4 h-4" />
                                                    <span>معلق منذ {getTimeElapsed(order.heldAt)}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(order.id, e)}
                                                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-colors"
                                            >
                                                <X className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4">
                                        {/* Items Summary */}
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 mb-2 font-['Almarai']">المنتجات:</p>
                                            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-300">{item.product.name}</span>
                                                        <span className="text-gray-400">×{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Totals */}
                                        <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">المجموع الفرعي:</span>
                                                <span className="text-white font-mono">{order.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">الضريبة:</span>
                                                <span className="text-white font-mono">{order.taxAmount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
                                                <span className="text-white">الإجمالي:</span>
                                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
                                                    {order.totalAmount.toFixed(2)} SAR
                                                </span>
                                            </div>
                                        </div>

                                        {/* Restore Button */}
                                        <button
                                            onClick={() => handleRestore(order)}
                                            className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-400/30 text-orange-400 font-bold font-['Almarai'] flex items-center justify-center gap-2 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(251,146,60,0.2)]"
                                        >
                                            <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                            <span>استعادة الطلب</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Custom Scrollbar */}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 146, 60, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 146, 60, 0.5);
        }
      `}</style>
        </div>
    );
}
