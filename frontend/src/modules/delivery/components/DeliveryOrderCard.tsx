import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Clock,
    User,
    Phone,
    AlertCircle,
    Check,
    ChevronDown,
    ChevronUp,
    Truck,
    Package,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { PriceDisplay } from '@/components/shared';
import { DriverSelector } from './DriverSelector';
import type {
    DeliveryOrderCard as DeliveryOrderCardType,
    DriverCard,
} from '@/types/pos.types';

// =============================================================================
// DELIVERY ORDER CARD COMPONENT
// =============================================================================

interface DeliveryOrderCardProps {
    order: DeliveryOrderCardType;
    drivers: DriverCard[];
    onAssignDriver: (orderId: string, driverId: string) => Promise<void>;
    onUpdateStatus: (params: { orderId: string; status: string; note?: string }) => Promise<void>;
    expanded?: boolean;
    onToggleExpand?: () => void;
}

/**
 * DeliveryOrderCard
 *
 * Displays a delivery order with:
 * - Order details (number, customer, address)
 * - Delivery zone and fee info
 * - Time tracking (time in current status, estimated delivery time)
 * - Driver assignment (via DriverSelector)
 * - Status update actions
 * - Expandable details
 */
export function DeliveryOrderCard({
    order,
    drivers,
    onAssignDriver,
    onUpdateStatus,
    expanded = false,
    onToggleExpand,
}: DeliveryOrderCardProps) {
    const { t } = useTranslation('delivery');
    const { theme, language } = useSettingsStore();

    const [assigningDriver, setAssigningDriver] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Get status color and label
    const getStatusInfo = () => {
        switch (order.status) {
            case 'PENDING':
                return {
                    color: 'text-yellow-400',
                    bg: 'bg-yellow-500/20 border-yellow-500/30',
                    label: t('status.pending', 'Pending'),
                    labelAr: 'قيد الانتظار',
                };
            case 'ASSIGNED':
                return {
                    color: 'text-blue-400',
                    bg: 'bg-blue-500/20 border-blue-500/30',
                    label: t('status.assigned', 'Assigned'),
                    labelAr: 'معين',
                };
            case 'ACCEPTED':
            case 'PICKED_UP':
                return {
                    color: 'text-purple-400',
                    bg: 'bg-purple-500/20 border-purple-500/30',
                    label: t('status.inProgress', 'In Progress'),
                    labelAr: 'قيد التنفيذ',
                };
            case 'OUT_FOR_DELIVERY':
                return {
                    color: 'text-purple-400',
                    bg: 'bg-purple-500/20 border-purple-500/30',
                    label: t('status.outForDelivery', 'Out for Delivery'),
                    labelAr: 'خارج للتوصيل',
                };
            case 'COMPLETED':
                return {
                    color: 'text-green-400',
                    bg: 'bg-green-500/20 border-green-500/30',
                    label: t('status.delivered', 'Delivered'),
                    labelAr: 'تم التوصيل',
                };
            default:
                return {
                    color: 'text-slate-400',
                    bg: 'bg-slate-500/20 border-slate-500/30',
                    label: order.status,
                    labelAr: order.status,
                };
        }
    };

    const statusInfo = getStatusInfo();

    // Format time in status
    const formatTimeInStatus = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes}${language === 'ar' ? 'د' : 'm'}`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return language === 'ar'
            ? `${hours}س ${mins}د`
            : `${hours}h ${mins}m`;
    };

    // Check if order is rush/overdue
    const isOverdue = order.timeInStatus > order.estimatedDeliveryMinutes;
    const isRushOrder = order.isRushOrder;

    // Handle driver assignment
    const handleAssignDriver = async (driverId: string) => {
        setAssigningDriver(true);
        try {
            await onAssignDriver(order.orderId, driverId);
        } finally {
            setAssigningDriver(false);
        }
    };

    // Handle status update
    const handleStatusUpdate = async (status: string) => {
        setUpdatingStatus(true);
        try {
            await onUpdateStatus({ orderId: order.orderId, status });
        } finally {
            setUpdatingStatus(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            data-theme={theme}
            className={cn(
                'rounded-xl border-2 overflow-hidden transition-all',
                'bg-slate-800/50 border-slate-700/50',
                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                expanded && 'border-cyan-500/50',
            )}
        >
            {/* Main Card */}
            <div className="p-3">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3
                                data-theme={theme}
                                className={cn(
                                    'font-bold text-base truncate',
                                    'text-white',
                                    'data-[theme=light]:text-slate-900',
                                )}
                            >
                                #{order.orderNumber}
                            </h3>
                            {isRushOrder && (
                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400 flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    {t('rush', 'Rush')}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-400 truncate">
                            {order.customerName || t('walkIn', 'Walk-in')}
                        </p>
                    </div>

                    {/* Status Badge */}
                    <div className={cn(
                        'px-2 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 flex-shrink-0',
                        statusInfo.bg,
                    )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusInfo.color.replace('text-', 'bg-'))} />
                        <span className={statusInfo.color}>
                            {language === 'ar' ? statusInfo.labelAr : statusInfo.label}
                        </span>
                    </div>
                </div>

                {/* Address */}
                {order.deliveryAddress && (
                    <div className="flex items-start gap-2 mb-2 text-sm">
                        <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-400 line-clamp-2">
                            {order.deliveryAddress.address || '-'}
                        </span>
                    </div>
                )}

                {/* Zone & Fee */}
                <div className="flex items-center gap-3 mb-2 text-sm">
                    {order.zoneCode && (
                        <div className="flex items-center gap-1">
                            <span className="text-slate-500">{t('zone', 'Zone')}:</span>
                            <span className="font-medium text-cyan-400">{order.zoneCode}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">{t('fee', 'Fee')}:</span>
                        <PriceDisplay value={order.deliveryFee.toString()} size="xs" variant="muted" />
                    </div>
                </div>

                {/* Time Info */}
                <div className="flex items-center gap-3 mb-2 text-sm">
                    <div className="flex items-center gap-1">
                        <Clock className={cn(
                            'w-4 h-4',
                            isOverdue ? 'text-red-400' : 'text-slate-400',
                        )} />
                        <span className={cn(
                            isOverdue ? 'text-red-400' : 'text-slate-400',
                        )}>
                            {formatTimeInStatus(order.timeInStatus)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">
                            {t('est', 'Est')}:
                        </span>
                        <span className="text-slate-400">
                            {order.estimatedDeliveryMinutes}{language === 'ar' ? 'د' : 'm'}
                        </span>
                    </div>
                    {order.driverInfo && (
                        <div className="flex items-center gap-1 ml-auto">
                            <Truck className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400 text-xs font-medium">
                                {order.driverInfo.driverName.split(' ')[0]}
                            </span>
                        </div>
                    )}
                </div>

                {/* Warning if overdue */}
                {isOverdue && (
                    <div className={cn(
                        'rounded-lg p-2 flex items-center gap-2 mb-2',
                        'bg-red-500/20 border border-red-500/30',
                    )}>
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-xs text-red-400">
                            {t('overdueBy', 'Overdue by {{minutes}}m', {
                                minutes: order.timeInStatus - order.estimatedDeliveryMinutes,
                            })}
                        </span>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <PriceDisplay
                        value={order.orderTotal.toString()}
                        size="md"
                        variant="primary"
                    />

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleExpand}
                        className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                    >
                        {expanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div
                            data-theme={theme}
                            className={cn(
                                'p-3 border-t border-slate-700/50 space-y-3',
                                'data-[theme=light]:border-slate-200',
                            )}
                        >
                            {/* Customer Phone */}
                            {order.customerPhone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <a
                                        href={`tel:${order.customerPhone}`}
                                        className="text-cyan-400 hover:underline"
                                    >
                                        {order.customerPhone}
                                    </a>
                                </div>
                            )}

                            {/* Driver Assignment */}
                            {!order.driverInfo && order.status === 'PENDING' && (
                                <div>
                                    <p className="text-xs text-slate-400 mb-2">
                                        {t('assignDriver', 'Assign Driver')}
                                    </p>
                                    <DriverSelector
                                        drivers={drivers}
                                        selectedDriverId={null}
                                        onSelectDriver={(driverId) => handleAssignDriver(driverId)}
                                        disabled={assigningDriver}
                                    />
                                </div>
                            )}

                            {/* Current Driver Info */}
                            {order.driverInfo && (
                                <div
                                    data-theme={theme}
                                    className={cn(
                                        'rounded-lg p-2 flex items-center gap-3',
                                        'bg-blue-500/10 border border-blue-500/20',
                                    )}
                                >
                                    <div className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center',
                                        'bg-blue-500/20 text-blue-400',
                                    )}>
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-blue-400 truncate">
                                            {order.driverInfo.driverName}
                                        </p>
                                        <p className="text-xs text-blue-400/70">
                                            {order.driverInfo.driverStatus}
                                        </p>
                                    </div>
                                    {order.driverInfo.currentLocation && (
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">
                                                {t('lastUpdate', 'Last update')}:{' '}
                                                {order.driverInfo.currentLocation.lastUpdate
                                                    ? new Date(order.driverInfo.currentLocation.lastUpdate).toLocaleTimeString()
                                                    : '-'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Status Actions */}
                            {order.status === 'ASSIGNED' && (
                                <div className="flex gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleStatusUpdate('OUT_FOR_DELIVERY')}
                                        disabled={updatingStatus}
                                        className={cn(
                                            'flex-1 px-3 py-2 rounded-lg text-sm font-medium',
                                            'bg-purple-500 hover:bg-purple-600 text-white',
                                            'disabled:opacity-50 disabled:cursor-not-allowed',
                                        )}
                                    >
                                        <Truck className="w-4 h-4 inline mr-1" />
                                        {t('markOutForDelivery', 'Out for Delivery')}
                                    </motion.button>
                                </div>
                            )}

                            {order.status === 'OUT_FOR_DELIVERY' && (
                                <div className="flex gap-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleStatusUpdate('COMPLETED')}
                                        disabled={updatingStatus}
                                        className={cn(
                                            'flex-1 px-3 py-2 rounded-lg text-sm font-medium',
                                            'bg-green-500 hover:bg-green-600 text-white',
                                            'disabled:opacity-50 disabled:cursor-not-allowed',
                                        )}
                                    >
                                        <Check className="w-4 h-4 inline mr-1" />
                                        {t('markDelivered', 'Mark Delivered')}
                                    </motion.button>
                                </div>
                            )}

                            {/* Order Items (if available) */}
                            {order.items && order.items.length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-400 mb-2">
                                        {t('orderItems', 'Order Items')}
                                    </p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {order.items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                data-theme={theme}
                                                className={cn(
                                                    'text-sm flex justify-between',
                                                    'text-slate-300',
                                                    'data-[theme=light]:text-slate-700',
                                                )}
                                            >
                                                <span className="truncate flex-1">
                                                    {item.quantity}x {item.productName}
                                                </span>
                                                <span className="ml-2 flex-shrink-0">
                                                    {item.totalPrice}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default DeliveryOrderCard;
