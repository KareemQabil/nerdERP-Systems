import { useState } from 'react';
import { X, ShoppingBag, Utensils, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/modules/sales/store/cartStore';
import { TableSelectorModal } from '@/modules/tables/components/TableSelectorModal/TableSelectorModal';

export interface OrderTypeModalProps {
    onClose: () => void;
}

/**
 * OrderTypeModal Component
 * First-step modal to choose order type (Takeaway or Dine-In)
 * 
 * Flow:
 * - سفري (Takeaway) → Sets orderType, closes modal
 * - محلي (Dine-In) → Opens TableSelectorModal
 */
export function OrderTypeModal({ onClose }: OrderTypeModalProps) {
    const { setOrderType, setTable } = useCartStore();
    const [showTableSelector, setShowTableSelector] = useState(false);

    const handleTakeaway = () => {
        setOrderType('TAKEAWAY');
        setTable(null); // Clear any table selection
        console.log('✅ Order type: TAKEAWAY');
        onClose();
    };

    const handleDineIn = () => {
        // Open table selector
        setShowTableSelector(true);
    };

    const handleUberEats = () => {
        setOrderType('DELIVERY_UBEREATS');
        setTable(null);
        console.log('✅ Order type: DELIVERY_UBEREATS');
        onClose();
    };

    const handleTableSelected = () => {
        // Table selector will set the table and close itself
        setShowTableSelector(false);
        onClose(); // Close the order type modal too
    };

    if (showTableSelector) {
        return <TableSelectorModal onClose={handleTableSelected} />;
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

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white font-['Almarai']">
                                    نوع الطلب
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">Order Type</p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"
                            >
                                <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Body - Three Options */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Takeaway Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleTakeaway}
                                className="group relative h-56 rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 border-2 border-orange-400/30 hover:border-orange-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(251,146,60,0.2)] hover:shadow-[0_0_40px_rgba(251,146,60,0.3)] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                                    <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <ShoppingBag className="w-8 h-8 text-orange-400" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold text-white font-['Almarai'] mb-1">
                                            سفري
                                        </h3>
                                        <p className="text-orange-400 font-semibold text-sm">
                                            Takeaway
                                        </p>
                                    </div>
                                </div>
                            </motion.button>

                            {/* Dine-In Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDineIn}
                                className="group relative h-56 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Utensils className="w-8 h-8 text-cyan-400" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold text-white font-['Almarai'] mb-1">
                                            محلي
                                        </h3>
                                        <p className="text-cyan-400 font-semibold text-sm">
                                            Dine-In
                                        </p>
                                    </div>
                                </div>
                            </motion.button>

                            {/* UberEats Delivery Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleUberEats}
                                className="group relative h-56 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-2 border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Truck className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold text-white font-['Almarai'] mb-1">
                                            أوبر إيتس
                                        </h3>
                                        <p className="text-emerald-400 font-semibold text-sm">
                                            UberEats
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
