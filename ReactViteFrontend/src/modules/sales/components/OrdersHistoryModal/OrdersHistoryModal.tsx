import { useState, useEffect } from 'react';
import { X, Search, Printer, RotateCcw, Clock, DollarSign, CreditCard, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface OrdersHistoryModalProps {
    onClose: () => void;
}

const STORAGE_KEY = 'NerdPOS_OrdersHistory';

export function OrdersHistoryModal({ onClose }: OrdersHistoryModalProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            setOrders(parsed);
            if (parsed.length > 0) setSelectedOrderId(parsed[0].id);
        }
    }, []);

    const filteredOrders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOrder = orders.find(o => o.id === selectedOrderId);

    const getStatusColors = (status: string) => {
        const colors = {
            COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            REFUNDED: 'bg-red-500/10 text-red-400 border-red-500/20',
            PARTIALLY_REFUNDED: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        };
        const labels = {
            COMPLETED: 'مكتمل',
            REFUNDED: 'مسترجع',
            PARTIALLY_REFUNDED: 'استرجاع جزئي',
        };
        return { color: colors[status as keyof typeof colors] || colors.COMPLETED, label: labels[status as keyof typeof labels] || status };
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur */}
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
                className="relative w-full max-w-7xl h-[85vh] bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 group"
                >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>

                {/* LEFT PANEL: Glass Orders List (30%) */}
                <div className="w-[30%] bg-black/20 backdrop-blur-sm border-r border-white/5 flex flex-col">

                    {/* Header Glass */}
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                                <Clock className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white font-['Almarai']">سجل الطلبات</h2>
                                <p className="text-sm text-cyan-400/80">{filteredOrders.length} طلب</p>
                            </div>
                        </div>

                        {/* Glass Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="رقم الطلب..."
                                className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 focus:border-cyan-400/30 focus:bg-white/10 text-white placeholder-gray-500 transition-all duration-300 outline-none"
                            />
                        </div>
                    </div>

                    {/* Orders List Glass Cards */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {filteredOrders.map((order, index) => {
                                const { color, label } = getStatusColors(order.status);
                                const isSelected = selectedOrderId === order.id;

                                return (
                                    <motion.button
                                        key={order.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setSelectedOrderId(order.id)}
                                        className={cn(
                                            'w-full p-4 rounded-2xl transition-all duration-300 text-right border group',
                                            isSelected
                                                ? 'bg-cyan-500/10 border-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-white font-mono text-lg group-hover:text-cyan-400 transition-colors">
                                                    {order.orderNumber}
                                                </p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <span className={cn('px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm', color)}>
                                                {label}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                                {parseFloat(order.totalAmount).toFixed(2)}
                                            </span>
                                            <span className="text-xs text-gray-400">SAR</span>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* RIGHT PANEL: Glass Order Details (70%) */}
                <div className="flex-1 flex flex-col">
                    {selectedOrder ? (
                        <>
                            {/* Details Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6">

                                {/* Header Glass Card */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-3">
                                            {selectedOrder.orderNumber}
                                        </h1>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(selectedOrder.createdAt).toLocaleDateString('ar-SA')}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {new Date(selectedOrder.createdAt).toLocaleTimeString('ar-SA')}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedOrder.paymentMethod === 'CASH' ? <DollarSign className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                                {selectedOrder.paymentMethod}
                                            </div>
                                        </div>
                                    </div>
                                    {(() => {
                                        const { color, label } = getStatusColors(selectedOrder.status);
                                        return (
                                            <span className={cn('px-4 py-2 rounded-2xl text-sm font-bold border backdrop-blur-sm', color)}>
                                                {label}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Items Glass Table */}
                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                                    <div className="bg-gradient-to-r from-white/5 to-transparent p-4 border-b border-white/5">
                                        <h3 className="text-lg font-bold text-white font-['Almarai']">تفاصيل الطلب</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-white/5">
                                                <tr className="border-b border-white/5">
                                                    <th className="text-right p-4 text-sm font-bold text-gray-300 font-['Almarai']">المنتج</th>
                                                    <th className="text-center p-4 text-sm font-bold text-gray-300">الكمية</th>
                                                    <th className="text-right p-4 text-sm font-bold text-gray-300">السعر</th>
                                                    <th className="text-right p-4 text-sm font-bold text-gray-300">الإجمالي</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items?.map((item: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-4">
                                                            <div className="text-white font-medium">{item.productName || item.name}</div>
                                                            {item.modifiers?.length > 0 && (
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {item.modifiers.map((m: any) => m.name || m.optionName).join(', ')}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-center text-white font-mono">{parseFloat(item.quantity).toFixed(0)}</td>
                                                        <td className="p-4 text-white font-mono">{parseFloat(item.unitPrice).toFixed(2)}</td>
                                                        <td className="p-4 text-white font-mono font-bold">{parseFloat(item.lineTotal || item.totalPrice).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Totals Glass Cards */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
                                        <p className="text-xs text-gray-400 mb-2 font-['Almarai']">المجموع الفرعي</p>
                                        <p className="text-2xl font-bold text-white">{parseFloat(selectedOrder.subtotal).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
                                        <p className="text-xs text-gray-400 mb-2 font-['Almarai']">الضريبة (15%)</p>
                                        <p className="text-2xl font-bold text-white">{parseFloat(selectedOrder.taxAmount).toFixed(2)}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-cyan-400/20 p-4 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                                        <p className="text-xs text-cyan-400 mb-2 font-['Almarai']">الإجمالي</p>
                                        <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                            {parseFloat(selectedOrder.totalAmount).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-cyan-400/60 mt-1">SAR</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Glass Actions */}
                            <div className="p-6 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm border-t border-white/5">
                                <div className="flex gap-4">
                                    <button className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-gray-700/40 to-gray-800/40 hover:from-gray-600/50 hover:to-gray-700/50 border border-white/10 text-white font-bold font-['Almarai'] flex items-center justify-center gap-3 transition-all duration-300 group shadow-lg">
                                        <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        <span>طباعة الفاتورة</span>
                                    </button>
                                    <button
                                        disabled={selectedOrder.status === 'REFUNDED'}
                                        className={cn(
                                            'flex-1 h-14 rounded-2xl font-bold font-[\'Almarai\'] flex items-center justify-center gap-3 transition-all duration-300 group shadow-lg',
                                            selectedOrder.status === 'REFUNDED'
                                                ? 'bg-gray-700/40 border border-gray-600/30 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                                        )}
                                    >
                                        <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                        <span>{selectedOrder.status === 'REFUNDED' ? 'تم الاسترجاع' : 'استرجاع الطلب'}</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                                    <Clock className="w-12 h-12 text-gray-500" />
                                </div>
                                <p className="text-xl text-gray-400 font-['Almarai']">اختر طلباً لعرض التفاصيل</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Custom Scrollbar Styles */}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
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
    );
}
