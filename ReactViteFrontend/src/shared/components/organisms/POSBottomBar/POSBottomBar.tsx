import { ShoppingCart, Printer, ChefHat, Pause, RotateCcw, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/atoms/Button';
import { useCartStore } from '@/modules/sales/store/cartStore';

export interface POSBottomBarProps {
    onPay?: () => void;
    onPrint?: () => void;
    onKitchen?: () => void;
    onHold?: () => void;
    onRefund?: () => void;
    onCartToggle?: () => void; // NEW: Cart toggle handler
    isCartOpen?: boolean; // NEW: Cart open state
    userName?: string;
    shiftStatus?: string;
    className?: string;
}

/**
 * POSBottomBar Organism
 * Floating action bar with cart toggle functionality
 * 
 * Features (per spec):
 * - Fixed position: bottom-0, left-0, right-80 (exclude sidebar)
 * - Z-index: 60 (above all panels)
 * - Background: rgba(26,28,30,0.98) with backdrop-blur-xl
 * - Gradient buttons per spec
 * - Real-time total from useCartStore
 * - Cart toggle button (NEW)
 * - Hover animations: scale(1.05) / tap: scale(0.95)
 * 
 * @example
 * <POSBottomBar 
 *   onPay={handlePayment} 
 *   onCartToggle={toggleCart}
 *   isCartOpen={isCartOpen}
 * />
 */
export function POSBottomBar({
    onPay,
    onPrint,
    onKitchen,
    onHold,
    onRefund,
    onCartToggle,
    isCartOpen = false,
    userName = 'Cashier',
    shiftStatus = 'Morning Shift',
    className,
}: POSBottomBarProps) {
    const { getTotals } = useCartStore();
    const totals = getTotals();
    const hasItems = parseFloat(totals.total) > 0;

    return (
        <div
            className={cn(
                // Fixed positioning per spec (z-60)
                'fixed bottom-0 left-0 right-20',
                // Glass bar styling per spec
                'bg-[rgba(26,28,30,0.98)] backdrop-blur-xl',
                'border-t border-[rgba(255,255,255,0.1)]',
                'shadow-2xl z-60',
                className
            )}
        >
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-2">

                    {/* Left: Quick Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Print Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onPrint}
                            className="h-14 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] hover:border-cyan-400/50"
                        >
                            <Printer className="w-5 h-5" />
                            <span className="text-[10px] font-['Almarai'] font-bold">طباعة</span>
                        </motion.button>

                        {/* Kitchen Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onKitchen}
                            className="h-14 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] hover:border-cyan-400/50"
                        >
                            <ChefHat className="w-5 h-5" />
                            <span className="text-[10px] font-['Almarai'] font-bold">المطبخ</span>
                        </motion.button>

                        {/* Hold Button - Warning gradient per spec */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onHold}
                            className="h-14 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-white hover:opacity-90 shadow-lg"
                        >
                            <Pause className="w-5 h-5" />
                            <span className="text-[10px] font-['Almarai'] font-bold">تعليق</span>
                        </motion.button>

                        {/* Refund Button - Error color per spec */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onRefund}
                            className="h-14 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400 hover:bg-[rgba(239,68,68,0.2)]"
                        >
                            <RotateCcw className="w-5 h-5" />
                            <span className="text-[10px] font-['Almarai'] font-bold">إرجاع</span>
                        </motion.button>
                    </div>

                    {/* Vertical Divider per spec */}
                    <div className="h-8 w-px bg-[rgba(255,255,255,0.1)]" />

                    {/* Right: Cart & Checkout Section */}
                    <div className="flex items-center gap-3">
                        {/* Cart Toggle Button - Primary gradient with visual feedback */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onCartToggle}
                            className={cn(
                                'relative h-14 px-6 rounded-xl flex items-center gap-2 transition-all shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]',
                                isCartOpen
                                    ? 'bg-gradient-to-b from-[#0891b2] to-[#006399] text-white' // Darker when open
                                    : 'bg-gradient-to-b from-[#22d3ee] to-[#006399] text-[#00373a] hover:opacity-90'
                            )}
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span className="font-['Almarai'] font-bold">السلة</span>
                            {/* Cart Badge */}
                            {totals.itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#fb2c36] text-white rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center text-[10px] font-['Arial'] font-bold border-2 border-[#023047]">
                                    {totals.itemCount}
                                </span>
                            )}
                        </motion.button>

                        {/* Large Checkout Button with Real Total */}
                        <motion.button
                            whileHover={{ scale: hasItems ? 1.05 : 1 }}
                            whileTap={{ scale: hasItems ? 0.95 : 1 }}
                            onClick={onPay}
                            disabled={!hasItems}
                            className={cn(
                                'h-14 px-8 rounded-xl font-["Almarai"] font-bold text-base flex items-center gap-3 transition-all',
                                hasItems
                                    ? 'bg-gradient-to-b from-[#22d3ee] to-[#006399] text-[#00373a] hover:opacity-90 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]'
                                    : 'bg-[rgba(255,255,255,0.05)] text-[#c2c7ce] opacity-50 cursor-not-allowed'
                            )}
                        >
                            <span>إنهاء الطلب</span>
                            <span className="mx-2 opacity-50">•</span>
                            <span className="font-['Inter']">{totals.total} SAR</span>
                        </motion.button>

                        {/* User Info Section */}
                        <div className="flex items-center gap-3 px-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                            <div className="text-left hidden md:block">
                                <p className="text-xs text-[#c2c7ce]">الوردية</p>
                                <p className="text-sm font-bold text-[#e2e2e6]">{shiftStatus}</p>
                            </div>
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600">
                                <User className="w-5 h-5 text-[#023047]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
