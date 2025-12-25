import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, Users, ShoppingBag, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useCartStore } from '@/stores/cart.store';
import { Button } from '@/components/ui';
import { KitchenStatusBadge } from './KitchenStatusBadge';

interface CheckoutBlockersProps {
    onCheckoutReady?: () => void;
}

/**
 * Checkout Blockers Component
 * Displays reasons why checkout is blocked and offers partial checkout option
 */
export function CheckoutBlockers({ onCheckoutReady }: CheckoutBlockersProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();
    const {
        getCheckoutBlockers,
        canPartialCheckout,
        getReadyItems,
        getPendingKitchenItems,
        orderType,
    } = useCartStore();

    const blockers = getCheckoutBlockers();
    const readyItems = getReadyItems();
    const pendingItems = getPendingKitchenItems();
    const canPartial = canPartialCheckout();

    if (blockers.length === 0) return null;

    // Calculate ready items total
    const readyTotal = readyItems.reduce(
        (sum, item) => sum + parseFloat(item.lineTotal),
        0
    ).toFixed(2);

    // Get blocker icon
    const getBlockerIcon = (blocker: string) => {
        if (blocker.toLowerCase().includes('table')) return <Users className="w-4 h-4" />;
        if (blocker.toLowerCase().includes('address') || blocker.toLowerCase().includes('delivery'))
            return <MapPin className="w-4 h-4" />;
        if (blocker.toLowerCase().includes('empty')) return <ShoppingBag className="w-4 h-4" />;
        if (blocker.toLowerCase().includes('preparing') || blocker.toLowerCase().includes('fired'))
            return <ChefHat className="w-4 h-4" />;
        return <AlertTriangle className="w-4 h-4" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            data-theme={theme}
            className={cn(
                'rounded-xl border p-3 space-y-3',
                'bg-yellow-500/5 border-yellow-500/20',
                'data-[theme=light]:bg-yellow-50 data-[theme=light]:border-yellow-200',
            )}
        >
            {/* Header */}
            <div className="flex items-center gap-2">
                <AlertTriangle className={cn(
                    'w-5 h-5',
                    'text-yellow-400',
                    'data-[theme=light]:text-yellow-600',
                )} />
                <span className={cn(
                    'font-semibold text-sm',
                    'text-yellow-400',
                    'data-[theme=light]:text-yellow-700',
                )}>
                    {t('checkout.blockers', 'Cannot Checkout Yet')}
                </span>
            </div>

            {/* Blocker List */}
            <div className="space-y-2">
                {blockers.map((blocker, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                            'flex items-center gap-2 text-sm',
                            'text-slate-300',
                            'data-[theme=light]:text-slate-600',
                        )}
                        data-theme={theme}
                    >
                        {getBlockerIcon(blocker)}
                        <span>{blocker}</span>
                    </motion.div>
                ))}
            </div>

            {/* Pending Kitchen Items Preview */}
            {pendingItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-yellow-500/20">
                    <p className={cn(
                        'text-xs font-medium',
                        'text-slate-400',
                        'data-[theme=light]:text-slate-500',
                    )}>
                        {t('checkout.pendingItems', 'Items in kitchen')}:
                    </p>
                    <div className="space-y-1">
                        {pendingItems.slice(0, 3).map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between text-xs"
                            >
                                <span className={cn(
                                    'text-slate-300',
                                    'data-[theme=light]:text-slate-600',
                                )} data-theme={theme}>
                                    {language === 'ar' && item.product.nameAr
                                        ? item.product.nameAr
                                        : item.product.name}
                                </span>
                                <KitchenStatusBadge
                                    status={item.kitchenStatus}
                                    size="sm"
                                    showLabel={false}
                                />
                            </div>
                        ))}
                        {pendingItems.length > 3 && (
                            <p className="text-xs text-slate-500">
                                +{pendingItems.length - 3} {t('more', 'more')}...
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Partial Checkout Option */}
            {canPartial && readyItems.length > 0 && orderType === 'DINE_IN' && (
                <div className="pt-2 border-t border-yellow-500/20">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onCheckoutReady}
                        className={cn(
                            'w-full',
                            'bg-green-500/20 text-green-400 hover:bg-green-500/30',
                            'data-[theme=light]:bg-green-100 data-[theme=light]:text-green-700',
                            'data-[theme=light]:hover:bg-green-200',
                        )}
                    >
                        <Clock className="w-4 h-4 me-2" />
                        {t('checkout.checkoutReady', 'Checkout Ready Items')} ({readyItems.length}) - {t('currency')} {readyTotal}
                    </Button>
                </div>
            )}
        </motion.div>
    );
}

export default CheckoutBlockers;
