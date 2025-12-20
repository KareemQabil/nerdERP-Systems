import { useState } from 'react';
import { X, ShoppingBag, Utensils, Truck, Car, Bike, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/modules/sales/store/cartStore';
import { TableSelectorModal } from '@/modules/tables/components/TableSelectorModal/TableSelectorModal';
import type { OrderType } from '@/modules/sales/types/order.types';

export interface OrderTypeModalProps {
    onClose: () => void;
}

/**
 * OrderTypeModal - The Order Decision Hub (Phase 4)
 * 
 * ENHANCED WORKFLOW:
 * 1. Dine-In → Opens TableSelectorModal
 * 2. Takeaway → Instant selection (1 tap)
 * 3. Delivery → Expands to show provider grid (4 options)
 * 
 * VISUAL REQUIREMENTS:
 * - Large, distinct cards (150px+ height)
 * - High-contrast colors for each provider
 * - Icons for instant visual recognition
 * 
 * DELIVERY PROVIDERS:
 * - Internal (In-house driver) - Green
 * - Talabat - Orange
 * - UberEats - Black/White
 * - Jahez - Purple (Saudi delivery app)
 */
export function OrderTypeModal({ onClose }: OrderTypeModalProps) {
    const { setOrderType, setTable } = useCartStore();
    const [showTableSelector, setShowTableSelector] = useState(false);
    const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);

    // ============================================
    // HANDLERS: Primary Order Types
    // ============================================

    const handleTakeaway = () => {
        setOrderType('TAKEAWAY');
        setTable(null);
        toast.success('📦 Takeaway Order Selected');
        console.log('✅ Order type: TAKEAWAY');
        onClose();
    };

    const handleDineIn = () => {
        // Open table selector (will set DINE_IN + table ID)
        setShowTableSelector(true);
    };

    const handleTableSelected = () => {
        // TableSelector will handle setOrderType('DINE_IN') and setTable()
        setShowTableSelector(false);
        toast.success('🍽️ Table Selected');
        onClose();
    };

    const handleDeliveryClick = () => {
        // Expand to show provider sub-options
        setShowDeliveryOptions(true);
    };

    // ============================================
    // HANDLERS: Delivery Providers
    // ============================================

    const handleDeliveryProvider = (type: OrderType, providerName: string, icon: string) => {
        setOrderType(type);
        setTable(null);
        toast.success(`${icon} ${providerName} Delivery Selected`);
        console.log(`✅ Order type: ${type}`);
        onClose();
    };

    // ============================================
    // CONDITIONAL RENDERING
    // ============================================

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
                    className="relative w-full max-w-4xl bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white font-['Almarai']">
                                    {showDeliveryOptions ? 'اختر خدمة التوصيل' : 'نوع الطلب'}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    {showDeliveryOptions ? 'Select Delivery Provider' : 'Order Type'}
                                </p>
                            </div>

                            <button
                                onClick={showDeliveryOptions ? () => setShowDeliveryOptions(false) : onClose}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"
                            >
                                <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            {!showDeliveryOptions ? (
                                // ============================================
                                // PRIMARY GRID: Dine-In, Takeaway, Delivery
                                // ============================================
                                <motion.div
                                    key="primary"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                                >
                                    {/* Dine-In Card */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleDineIn}
                                        className="group relative h-56 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                                            <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <Utensils className="w-10 h-10 text-cyan-400" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-3xl font-bold text-white font-['Almarai'] mb-1">
                                                    🍽️ محلي
                                                </h3>
                                                <p className="text-cyan-400 font-semibold text-sm">
                                                    Dine-In Table Service
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* Takeaway Card */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleTakeaway}
                                        className="group relative h-56 rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 border-2 border-orange-400/30 hover:border-orange-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(251,146,60,0.2)] hover:shadow-[0_0_40px_rgba(251,146,60,0.3)] overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                                            <div className="w-20 h-20 rounded-2xl bg-orange-500/20 border border-orange-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <ShoppingBag className="w-10 h-10 text-orange-400" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-3xl font-bold text-white font-['Almarai'] mb-1">
                                                    📦 سفري
                                                </h3>
                                                <p className="text-orange-400 font-semibold text-sm">
                                                    Takeaway Pickup
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* Delivery Card (Expandable) */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleDeliveryClick}
                                        className="group relative h-56 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-2 border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                                            <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <Truck className="w-10 h-10 text-emerald-400" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-3xl font-bold text-white font-['Almarai'] mb-1">
                                                    🚗 توصيل
                                                </h3>
                                                <p className="text-emerald-400 font-semibold text-sm">
                                                    Delivery Service
                                                </p>
                                                <p className="text-emerald-500/70 text-xs mt-1">
                                                    Click to choose provider →
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>
                                </motion.div>
                            ) : (
                                // ============================================
                                // DELIVERY PROVIDER GRID (4 Options)
                                // ============================================
                                <motion.div
                                    key="delivery"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                >
                                    {/* Internal Delivery */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleDeliveryProvider('DELIVERY_INTERNAL', 'Internal Driver', '🚗')}
                                        className="group relative h-48 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-2 border-green-400/30 hover:border-green-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:shadow-[0_0_40px_rgba(34,197,94,0.3)] overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="relative h-full flex items-center gap-4 p-6">
                                            <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                                                <Car className="w-8 h-8 text-green-400" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-2xl font-bold text-white font-['Almarai'] mb-1">
                                                    سائق خاص
                                                </h3>
                                                <p className="text-green-400 font-semibold text-sm">
                                                    Internal Driver
                                                </p>
                                                <p className="text-green-500/70 text-xs mt-1">
                                                    In-house delivery team
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* Talabat */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleDeliveryProvider('DELIVERY_TALABAT', 'Talabat', '🛵')}
                                        className="group relative h-48 rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border-2 border-orange-400/30 hover:border-orange-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(251,146,60,0.2)] hover:shadow-[0_0_40px_rgba(251,146,60,0.3)] overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="relative h-full flex items-center gap-4 p-6">
                                            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                                                <Bike className="w-8 h-8 text-orange-400" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-2xl font-bold text-white font-['Almarai'] mb-1">
                                                    طلبات
                                                </h3>
                                                <p className="text-orange-400 font-semibold text-sm">
                                                    Talabat
                                                </p>
                                                <p className="text-orange-500/70 text-xs mt-1">
                                                    Platform integration
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* UberEats */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleDeliveryProvider('DELIVERY_UBER', 'UberEats', '🚚')}
                                        className="group relative h-48 rounded-3xl bg-gradient-to-br from-gray-700/40 to-black/40 border-2 border-gray-500/30 hover:border-gray-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(107,114,128,0.2)] hover:shadow-[0_0_40px_rgba(107,114,128,0.3)] overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="relative h-full flex items-center gap-4 p-6">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-700/40 border border-gray-500/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                                                <Truck className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-2xl font-bold text-white font-['Almarai'] mb-1">
                                                    أوبر إيتس
                                                </h3>
                                                <p className="text-gray-300 font-semibold text-sm">
                                                    UberEats
                                                </p>
                                                <p className="text-gray-500/70 text-xs mt-1">
                                                    Global delivery platform
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* Jahez */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleDeliveryProvider('DELIVERY_JAHEZ', 'Jahez', '🏍️')}
                                        className="group relative h-48 rounded-3xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 border-2 border-purple-400/30 hover:border-purple-400/50 transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="relative h-full flex items-center gap-4 p-6">
                                            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                                                <Home className="w-8 h-8 text-purple-400" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-2xl font-bold text-white font-['Almarai'] mb-1">
                                                    جاهز
                                                </h3>
                                                <p className="text-purple-400 font-semibold text-sm">
                                                    Jahez
                                                </p>
                                                <p className="text-purple-500/70 text-xs mt-1">
                                                    Saudi delivery leader
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
