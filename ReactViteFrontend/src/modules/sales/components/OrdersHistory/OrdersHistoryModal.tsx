import { useState } from 'react';
import { X, Search, ClipboardList, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useOrdersStore } from '../../store/ordersStore';
import { RefundModal } from '../Refunds/RefundModal';
import type { OrderWithRefunds } from '../../types/refund.types';

export interface OrdersHistoryModalProps {
    onClose: () => void;
}

export function OrdersHistoryModal({ onClose }: OrdersHistoryModalProps) {
    const { orders, searchOrders } = useOrdersStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<OrderWithRefunds | null>(null);

    const displayOrders = searchQuery ? searchOrders(searchQuery) : orders;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-500/20 text-green-400 border-green-400/30';
            case 'PARTIAL_REFUND':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
            case 'REFUNDED':
                return 'bg-red-500/20 text-red-400 border-red-400/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'مكتمل';
            case 'PARTIAL_REFUND':
                return 'مسترجع جزئياً';
            case 'REFUNDED':
                return 'مسترجع كلياً';
            default:
                return status;
        }
    };

    if (selectedOrder) {
        return (
            <RefundModal
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onConfirm={() => {
                    setSelectedOrder(null);
                    // Optional: Show success message
                }}
            />
        );
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-4xl max-h-[85vh] bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                                    <ClipboardList className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white font-['Almarai']">سجل الطلبات</h2>
                                    <p className="text-sm text-gray-400">Orders History</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"
                            >
                                <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث برقم الطلب... (e.g., ORD-001 or 1001)"
                                className="w-full h-14 pr-12 pl-4 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-cyan-400/50 focus:bg-white/10 text-white placeholder-gray-500 text-lg font-['Almarai'] transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {displayOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <AlertCircle className="w-16 h-16 text-gray-600 mb-4" />
                                <p className="text-gray-400 text-lg font-['Almarai']">لا توجد طلبات</p>
                                <p className="text-gray-500 text-sm">No orders found</p>
                            </div>
                        ) : (
                            displayOrders.map((order) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 p-6 transition-all duration-300"
                                >
                                    {/* Order Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-white font-mono">{order.orderNumber}</h3>
                                                <span
                                                    className={cn(
                                                        'px-3 py-1 rounded-full text-xs font-bold border',
                                                        getStatusColor(order.status)
                                                    )}
                                                >
                                                    {getStatusText(order.status)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                {new Date(order.createdAt).toLocaleString('ar-SA')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-cyan-400 font-mono">
                                                {parseFloat(order.total).toFixed(2)} SAR
                                            </p>
                                            {parseFloat(order.refundedAmount) > 0 && (
                                                <p className="text-sm text-red-400">
                                                    مسترجع: {parseFloat(order.refundedAmount).toFixed(2)} SAR
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-2 mb-4">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span className="text-gray-300">
                                                    {item.productName} x{parseFloat(item.quantity)}
                                                </span>
                                                <span className="text-gray-400 font-mono">
                                                    {parseFloat(item.lineTotal).toFixed(2)} SAR
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Payment Method Badge */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="px-2 py-1 rounded-lg bg-gray-700/50 text-xs text-gray-300">
                                            {order.paymentMethod === 'CASH' ? '💵 نقدي' : '💳 بطاقة'}
                                        </span>
                                    </div>

                                    {/* Refund Button */}
                                    {order.status !== 'REFUNDED' && order.status !== 'VOID' && (
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="w-full h-12 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border-2 border-red-400/30 hover:border-red-400/50 text-red-400 font-bold font-['Almarai'] transition-all duration-300 flex items-center justify-center gap-2"
                                        >
                                            <span>↩️</span>
                                            <span>استرجاع / Refund</span>
                                        </button>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
