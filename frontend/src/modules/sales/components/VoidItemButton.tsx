import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import type { CartItem } from '@/stores/cart.store';
import type { KitchenStatus, VoidReason, PinAuthorizationRequest } from '@/types/pos.types';

interface VoidItemButtonProps {
    item: CartItem;
    onVoid: (itemId: string, reason?: VoidReason) => void;
    onRequestAuthorization: (request: PinAuthorizationRequest) => void;
    isManagerMode?: boolean;
    size?: 'sm' | 'md';
}

/**
 * Context-aware void/remove button
 * - Simple items: Direct remove
 * - Kitchen items: Requires manager PIN after FIRED status
 * - Shows appropriate icon and confirmation behavior
 */
export function VoidItemButton({
    item,
    onVoid,
    onRequestAuthorization,
    isManagerMode = false,
    size = 'sm',
}: VoidItemButtonProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();
    const [isConfirming, setIsConfirming] = useState(false);

    const kitchenStatus = item.kitchenStatus as KitchenStatus;
    const requiresKitchen = item.product.requiresKitchen;

    // Determine if manager authorization is needed
    const requiresAuth = requiresKitchen && ['FIRED', 'PREPARING', 'READY'].includes(kitchenStatus);


    const handleClick = () => {
        // If already served, cannot void
        if (kitchenStatus === 'SERVED') {
            return;
        }

        // If manager mode or no auth required, proceed directly
        if (isManagerMode || !requiresAuth) {
            if (isConfirming) {
                onVoid(item.id);
                setIsConfirming(false);
            } else {
                setIsConfirming(true);
                // Auto-reset after 3 seconds
                setTimeout(() => setIsConfirming(false), 3000);
            }
            return;
        }

        // Requires manager authorization
        onRequestAuthorization({
            action: 'VOID_ITEM',
            itemId: item.id,
            itemName: language === 'ar' && item.product.nameAr ? item.product.nameAr : item.product.name,
        });
    };

    const isDisabled = kitchenStatus === 'SERVED';

    const sizeClasses = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
    const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

    return (
        <motion.button
            whileHover={{ scale: isDisabled ? 1 : 1.1 }}
            whileTap={{ scale: isDisabled ? 1 : 0.9 }}
            onClick={handleClick}
            disabled={isDisabled}
            title={
                requiresAuth
                    ? t('void.requiresAuth', 'Requires manager authorization')
                    : isConfirming
                        ? t('void.clickToConfirm', 'Click again to confirm')
                        : t('void.remove', 'Remove item')
            }
            data-theme={theme}
            className={cn(
                sizeClasses,
                'rounded flex items-center justify-center transition-all relative',
                isDisabled && 'opacity-30 cursor-not-allowed',
                isConfirming
                    ? 'bg-red-500 text-white animate-pulse'
                    : cn(
                        'hover:bg-red-500/20 text-red-400',
                        'data-[theme=light]:hover:bg-red-100 data-[theme=light]:text-red-500',
                    ),
            )}
        >
            {/* Icon */}
            {requiresAuth ? (
                <Lock className={iconSize} />
            ) : (
                <Trash2 className={iconSize} />
            )}

            {/* Warning indicator for kitchen items */}
            {requiresAuth && !isConfirming && (
                <span className="absolute -top-1 -end-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            )}

            {/* Confirmation pulse ring */}
            {isConfirming && (
                <motion.span
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute inset-0 rounded bg-red-500"
                />
            )}
        </motion.button>
    );
}

/**
 * Void confirmation dialog (inline version)
 */
interface VoidConfirmationProps {
    isOpen: boolean;
    itemName: string;
    statusMessage?: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export function VoidConfirmation({
    isOpen,
    itemName,
    statusMessage,
    onConfirm,
    onCancel,
}: VoidConfirmationProps) {
    const { t } = useTranslation('pos');
    const { theme } = useSettingsStore();

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            data-theme={theme}
            className={cn(
                'absolute inset-0 z-10 rounded-lg flex flex-col items-center justify-center p-2',
                'bg-red-500/95 backdrop-blur-sm',
            )}
        >
            <AlertTriangle className="w-5 h-5 text-white mb-1" />
            <p className="text-xs text-white font-medium text-center mb-1">
                {t('void.confirmRemove', 'Remove')} "{itemName}"?
            </p>
            {statusMessage && (
                <p className="text-xs text-red-200 text-center mb-2">{statusMessage}</p>
            )}
            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    className="px-2 py-1 text-xs rounded bg-white/20 text-white hover:bg-white/30"
                >
                    {t('cancel', 'Cancel')}
                </button>
                <button
                    onClick={onConfirm}
                    className="px-2 py-1 text-xs rounded bg-white text-red-500 font-bold hover:bg-red-100"
                >
                    {t('void.confirm', 'Remove')}
                </button>
            </div>
        </motion.div>
    );
}

export default VoidItemButton;
