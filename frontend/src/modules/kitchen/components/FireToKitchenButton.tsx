import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { kitchenService } from '@/services/kitchen.service';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

interface FireToKitchenButtonProps {
    orderId: string;
    orderType: string;
    onFired?: () => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Fire to Kitchen Button
 *
 * Displays a button to fire an order to the kitchen.
 * Only shows for DINE_IN and TAKEOUT orders (not DELIVERY).
 *
 * After firing, the button disappears to prevent double-firing.
 */
export function FireToKitchenButton({
    orderId,
    orderType,
    onFired,
    disabled = false,
    className,
}: FireToKitchenButtonProps) {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [isFiring, setIsFiring] = useState(false);
    const [hasFired, setHasFired] = useState(false);

    const handleFire = async () => {
        if (!user?.id) {
            console.error('[FireToKitchen] No user logged in');
            return;
        }

        setIsFiring(true);
        try {
            await kitchenService.fireOrderToKitchen(orderId);

            setHasFired(true);
            onFired?.();

            // Play success sound
            try {
                const audio = new Audio('/sounds/success.mp3');
                await audio.play();
            } catch {
                // Ignore audio errors
            }
        } catch (error) {
            console.error('[FireToKitchen] Failed to fire order:', error);
        } finally {
            setIsFiring(false);
        }
    };

    // Only show for dine-in and takeout orders (not delivery)
    const isVisible = orderType === 'DINE_IN' || orderType === 'TAKEOUT';

    if (!isVisible || hasFired) {
        return null;
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFire}
            disabled={disabled || isFiring}
            className={cn(
                'flex items-center justify-center gap-2 px-6 py-4 rounded-xl',
                'bg-gradient-to-r from-orange-500 to-red-600',
                'text-white font-semibold shadow-lg',
                'hover:shadow-xl transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                className,
            )}
        >
            {isFiring ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('kitchen.firing', 'Firing...')}</span>
                </>
            ) : (
                <>
                    <Flame className="w-5 h-5" />
                    <span>{t('kitchen.fireToKitchen', 'Fire to Kitchen')}</span>
                </>
            )}
        </motion.button>
    );
}
