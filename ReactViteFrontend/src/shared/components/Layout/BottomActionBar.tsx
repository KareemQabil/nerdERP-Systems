import React from 'react';
import {
    ShoppingCart, Receipt, Printer, Clock, User,
    RotateCcw, FileText, Tag, ChefHat
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/modules/sales/store/cartStore';

interface POSActionBarProps {
    onOpenCart?: () => void;
    onCheckout?: () => void;
    onApplyDiscount?: () => void;
    onSelectCustomer?: () => void;
    onHoldOrder?: () => void;
    onRetrieveOrder?: () => void;
    onPrintReceipt?: () => void;
    onViewOrders?: () => void;
    onSendToKitchen?: () => void;
}

const ActionButton = ({
    icon,
    label,
    onClick,
    disabled = false,
    variant = 'default',
    badge,
}: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'default' | 'primary' | 'success' | 'warning';
    badge?: number;
}) => {
    const getVariantClasses = () => {
        if (disabled) {
            return 'bg-[rgba(255,255,255,0.05)] text-[#c2c7ce] opacity-50 cursor-not-allowed';
        }

        switch (variant) {
            case 'primary':
                return 'bg-gradient-to-b from-[#22d3ee] to-[#006399] text-[#00373a] hover:opacity-90 shadow-lg';
            case 'success':
                return 'bg-gradient-to-b from-[#10b981] to-[#059669] text-white hover:opacity-90 shadow-lg';
            case 'warning':
                return 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-white hover:opacity-90 shadow-lg';
            default:
                return 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] hover:border-cyan-400/50';
        }
    };

    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            onClick={onClick}
            disabled={disabled}
            className={`relative h-14 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${getVariantClasses()}`}
        >
            {icon}
            <span className="text-[10px] font-['Almarai'] font-bold leading-tight whitespace-nowrap" dir="auto">
                {label}
            </span>

            {badge !== undefined && badge > 0 && (
                <div className="absolute -top-1 -right-1 bg-[#fb2c36] text-white rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center text-[10px] font-['Arial'] font-bold border-2 border-[#023047]">
                    {badge}
                </div>
            )}
        </motion.button>
    );
};

export function BottomActionBar({
    onOpenCart,
    onCheckout,
    onApplyDiscount,
    onSelectCustomer,
    onHoldOrder,
    onRetrieveOrder,
    onPrintReceipt,
    onViewOrders,
    onSendToKitchen,
}: POSActionBarProps) {
    const { items, toggleCart } = useCartStore();
    const cartItemsCount = items.length;
    const hasItems = items.length > 0;

    const handleOpenCart = () => {
        toggleCart();
        onOpenCart?.();
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[rgba(26,28,30,0.98)] backdrop-blur-xl border-t border-[rgba(255,255,255,0.1)] shadow-2xl z-[60]">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                    {/* Left Side - Cart (Top Priority) */}
                    <div className="flex items-center gap-2">
                        <ActionButton
                            icon={<ShoppingCart className="w-5 h-5" />}
                            label="السلة"
                            onClick={handleOpenCart}
                            variant="primary"
                            badge={cartItemsCount}
                        />

                        <div className="h-8 w-px bg-[rgba(255,255,255,0.1)]" />

                        <ActionButton
                            icon={<User className="w-5 h-5" />}
                            label="العميل"
                            onClick={onSelectCustomer}
                        />

                        <ActionButton
                            icon={<Tag className="w-5 h-5" />}
                            label="خصم"
                            onClick={onApplyDiscount}
                            disabled={!hasItems}
                        />
                    </div>

                    {/* Center - Quick Actions */}
                    <div className="flex items-center gap-2">
                        <ActionButton
                            icon={<Clock className="w-5 h-5" />}
                            label="تعليق"
                            onClick={onHoldOrder}
                            disabled={!hasItems}
                            variant="warning"
                        />

                        <ActionButton
                            icon={<RotateCcw className="w-5 h-5" />}
                            label="المعلقة"
                            onClick={onRetrieveOrder}
                        />

                        <ActionButton
                            icon={<ChefHat className="w-4 h-4" />}
                            label="مطبخ"
                            onClick={onSendToKitchen}
                            disabled={!hasItems}
                        />

                        <ActionButton
                            icon={<FileText className="w-5 h-5" />}
                            label="الطلبات"
                            onClick={onViewOrders}
                        />
                    </div>

                    {/* Right Side - Payment Actions */}
                    <div className="flex items-center gap-2">
                        <ActionButton
                            icon={<Printer className="w-5 h-5" />}
                            label="طباعة"
                            onClick={onPrintReceipt}
                            disabled={!hasItems}
                        />

                        <div className="h-8 w-px bg-[rgba(255,255,255,0.1)]" />

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onCheckout}
                            disabled={!hasItems}
                            className={`h-14 px-8 rounded-xl font-['Almarai'] font-bold text-base flex items-center gap-3 transition-all ${hasItems
                                    ? 'bg-gradient-to-b from-[#22d3ee] to-[#006399] text-[#00373a] hover:opacity-90 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]'
                                    : 'bg-[rgba(255,255,255,0.05)] text-[#c2c7ce] opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <Receipt className="w-6 h-6" />
                            <span dir="auto">دفع</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
