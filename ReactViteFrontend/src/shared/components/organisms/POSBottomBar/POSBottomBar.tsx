import { ShoppingCart, Printer, ChefHat, Pause, RotateCcw, User, Utensils, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/modules/sales/store/cartStore';
import { useShiftStore } from '@/modules/shifts/store/shiftStore';
import type { OrderType } from '@/modules/sales/types/order.types';

export interface POSBottomBarProps {
    onPay?: () => void;
    onPrint?: () => void;
    onKitchen?: () => void;
    onHold?: () => void;
    onRefund?: () => void;
    onTable?: () => void;
    onOrders?: () => void;
    onCycleOrderType?: () => void; // NEW
    onCartToggle?: () => void;
    isCartOpen?: boolean;
    userName?: string;
    shiftStatus?: string;
    className?: string;
    // NEW: Restaurant workflow props
    orderType?: OrderType;
    newItemsCount?: number;
}

/**
 * POSBottomBar Organism (ENHANCED with Restaurant Workflow)
 * Position-agnostic action bar - positioning controlled by parent
 * 
 * NEW Features:
 * - Order Mode indicator on Table button (shows current type)
 * - NEW items count badge on Kitchen button
 * - Smart Kitchen button state (glows when items ready)
 */
export function POSBottomBar({
    onPay,
    onPrint,
    onKitchen,
    onHold,
    onRefund,
    onTable,
    onOrders,
    onCycleOrderType,
    onCartToggle,
    isCartOpen = false,
    userName,
    className,
    orderType = 'TAKEAWAY',
    newItemsCount = 0,
}: POSBottomBarProps) {
    const { getTotals } = useCartStore();
    const { isShiftOpen } = useShiftStore();
    const totals = getTotals();

    // Order type icons
    const orderTypeIcons: Record<OrderType, string> = {
        TAKEAWAY: '📦',
        DINE_IN: '🍽️',
        DELIVERY: '🚗',
        DELIVERY_UBEREATS: '🚚',
        DRIVE_THRU: '🚙',
    };

    const hasNewItems = newItemsCount > 0;

    return (
        <div className={cn('h-full w-full', className)}>
            {/* Glassmorphic Container */}
            <div className="h-full rounded-t-3xl bg-gradient-to-r from-gray-900/80 via-gray-900/70 to-gray-800/80 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] px-4 flex items-center gap-3">

                {/* LEFT: Order-Related (Cart, Order Mode, Payment) */}
                <div className="flex items-center gap-2">
                    {/* Cart Toggle */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onCartToggle}
                        className={cn(
                            'relative h-14 w-14 rounded-2xl font-bold transition-all duration-300 border-2',
                            isCartOpen
                                ? 'bg-cyan-500/20 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                : 'bg-white/5 border-white/10 hover:border-cyan-400/30'
                        )}
                    >
                        <div className="flex flex-col items-center justify-center">
                            <ShoppingCart className={cn('w-6 h-6', isCartOpen ? 'text-cyan-400' : 'text-gray-400')} />
                            {totals.itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-gray-900">
                                    {totals.itemCount}
                                </span>
                            )}
                        </div>
                    </motion.button>

                    {/* Order Mode Cycler with TEXT */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onCycleOrderType || onTable}
                        className="relative h-14 px-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-400/30 text-blue-400 font-bold transition-all flex items-center gap-2"
                        title="Click to cycle order type"
                    >
                        <span className="text-xl">{orderTypeIcons[orderType]}</span>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] text-gray-400 font-['Almarai']">نوع الطلب</span>
                            <span className="text-sm font-['Almarai'] leading-tight">
                                {orderType === 'TAKEAWAY' && 'تيك أواي'}
                                {orderType === 'DINE_IN' && 'طاولة'}
                                {orderType === 'DELIVERY' && 'توصيل'}
                                {orderType === 'DELIVERY_UBEREATS' && 'أوبر إيتس'}
                                {orderType === 'DRIVE_THRU' && 'سيارة'}
                            </span>
                        </div>
                    </motion.button>

                    {/* Payment - GUARDED */}
                    <motion.button
                        whileHover={{ scale: isShiftOpen ? 1.05 : 1 }}
                        whileTap={{ scale: isShiftOpen ? 0.95 : 1 }}
                        onClick={onPay}
                        disabled={!isShiftOpen}
                        className={cn(
                            "h-14 px-6 rounded-2xl border font-bold font-['Almarai'] transition-all duration-300 flex items-center gap-2",
                            isShiftOpen
                                ? "bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border-cyan-400/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] cursor-pointer"
                                : "bg-white/5 border-white/10 text-gray-600 opacity-50 cursor-not-allowed"
                        )}
                    >
                        <span>💳</span>
                        <span>{isShiftOpen ? 'دفع' : 'افتح الوردية'}</span>
                    </motion.button>
                </div>

                {/* CENTER: Action Buttons (Kitchen, Hold, Print, Refund, Orders) */}
                <div className="flex-1 flex items-center justify-center gap-2">
                    {/* Kitchen - ENHANCED with NEW items badge */}
                    <motion.button
                        whileHover={{ scale: isShiftOpen ? 1.05 : 1 }}
                        whileTap={{ scale: isShiftOpen ? 0.95 : 1 }}
                        onClick={onKitchen}
                        disabled={!isShiftOpen}
                        className={cn(
                            "relative h-14 px-4 rounded-2xl border font-bold transition-all flex items-center justify-center",
                            isShiftOpen && hasNewItems
                                ? "bg-orange-500/20 hover:bg-orange-500/30 border-orange-400/50 text-orange-400 cursor-pointer shadow-lg shadow-orange-500/20 animate-pulse"
                                : isShiftOpen
                                    ? "bg-orange-500/10 hover:bg-orange-500/20 border-orange-400/30 text-orange-400 cursor-pointer"
                                    : "bg-white/5 border-white/10 text-gray-600 opacity-50 cursor-not-allowed"
                        )}
                        title={hasNewItems ? `Send ${newItemsCount} items to kitchen` : 'Kitchen'}
                    >
                        <ChefHat className="w-5 h-5" />
                        <AnimatePresence>
                            {hasNewItems && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center border-2 border-gray-900"
                                >
                                    {newItemsCount}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    {/* Orders History */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onOrders}
                        className="h-14 px-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 text-purple-400 font-bold transition-all flex items-center justify-center"
                        title="Orders History"
                    >
                        <ClipboardList className="w-5 h-5" />
                    </motion.button>

                    {/* Hold */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onHold}
                        className="h-14 px-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-400/30 text-purple-400 font-bold transition-all flex items-center justify-center"
                    >
                        <Pause className="w-5 h-5" />
                    </motion.button>

                    {/* Print */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onPrint}
                        className="h-14 px-4 rounded-2xl bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600/50 text-gray-300 font-bold transition-all flex items-center justify-center"
                    >
                        <Printer className="w-5 h-5" />
                    </motion.button>

                    {/* Refund */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRefund}
                        className="h-14 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 text-red-400 font-bold transition-all flex items-center justify-center"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </motion.button>
                </div>

                {/* RIGHT: Total & User */}
                <div className="flex items-center gap-3">
                    {/* Total Display */}
                    <div className="h-14 px-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-end justify-center">
                        <span className="text-xs text-gray-400 font-['Almarai']">الإجمالي</span>
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
                            {parseFloat(totals.total).toFixed(2)}
                        </span>
                    </div>

                    {/* User Badge */}
                    {userName && (
                        <div className="h-14 px-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
                            <User className="w-5 h-5 text-cyan-400" />
                            <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-400">مستخدم</span>
                                <span className="text-sm font-bold text-white">{userName}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
