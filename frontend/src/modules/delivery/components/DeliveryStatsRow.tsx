import { motion } from 'framer-motion';
import {
    Truck,
    Clock,
    CheckCircle2,
    TrendingUp,
    AlertCircle,
    Package,
    Users,
    MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { PriceDisplay } from '@/components/shared';
import type { DashboardSummary } from '@/types/pos.types';

// =============================================================================
// DELIVERY STATS ROW COMPONENT
// =============================================================================

interface DeliveryStatsRowProps {
    summary: DashboardSummary;
    zoneStats?: Array<{
        zoneId: string;
        zoneCode: string;
        zoneName: string;
        deliveryFee: number;
        estimatedMinutes: number;
        activeOrders: number;
        completedToday: number;
        availableDrivers: number;
    }>;
}

/**
 * DeliveryStatsRow
 *
 * Displays delivery dashboard summary statistics:
 * - Active orders breakdown (pending, assigned, out for delivery, ready)
 * - Driver availability
 * - Performance metrics (avg time, on-time rate)
 * - Zone breakdown (if provided)
 */
export function DeliveryStatsRow({ summary, zoneStats = [] }: DeliveryStatsRowProps) {
    const { t } = useTranslation('delivery');
    const { theme, language } = useSettingsStore();

    const stats = [
        {
            label: t('stats.pending', 'Pending'),
            labelAr: 'قيد الانتظار',
            value: summary.totalPendingOrders,
            icon: Clock,
            color: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-500/20',
            borderColor: 'border-yellow-500/30',
        },
        {
            label: t('stats.assigned', 'Assigned'),
            labelAr: 'معين',
            value: summary.totalAssignedOrders,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/20',
            borderColor: 'border-blue-500/30',
        },
        {
            label: t('stats.outForDelivery', 'Out for Delivery'),
            labelAr: 'خارج للتوصيل',
            value: summary.totalOutForDelivery,
            icon: Truck,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-500/20',
            borderColor: 'border-purple-500/30',
        },
        {
            label: t('stats.ready', 'Ready'),
            labelAr: 'جاهز',
            value: summary.totalReadyForPickup,
            icon: Package,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-500/20',
            borderColor: 'border-green-500/30',
        },
        {
            label: t('stats.activeDrivers', 'Available'),
            labelAr: 'سائقون متاحون',
            value: summary.availableDrivers,
            icon: CheckCircle2,
            color: 'from-cyan-500 to-cyan-600',
            bgColor: 'bg-cyan-500/20',
            borderColor: 'border-cyan-500/30',
        },
    ];

    return (
        <div className="space-y-3">
            {/* Main Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            data-theme={theme}
                            className={cn(
                                'rounded-xl p-3 border-2',
                                stat.bgColor,
                                stat.borderColor,
                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                            )}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center',
                                    `bg-gradient-to-br ${stat.color}`,
                                )}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <span
                                    data-theme={theme}
                                    className={cn(
                                        'text-xs font-medium',
                                        'text-white',
                                        'data-[theme=light]:text-slate-700',
                                    )}
                                >
                                    {language === 'ar' ? stat.labelAr : stat.label}
                                </span>
                            </div>
                            <p
                                data-theme={theme}
                                className={cn(
                                    'text-2xl font-bold',
                                    'text-white',
                                    'data-[theme=light]:text-slate-900',
                                )}
                            >
                                {stat.value}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Total Active */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    data-theme={theme}
                    className={cn(
                        'rounded-xl p-3 border-2',
                        'bg-slate-800/50 border-slate-700/50',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                    )}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            'bg-gradient-to-br from-indigo-500 to-indigo-600',
                        )}>
                            <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                        <span
                            data-theme={theme}
                            className={cn(
                                'text-xs font-medium',
                                'text-white',
                                'data-[theme=light]:text-slate-700',
                            )}
                        >
                            {t('stats.totalActive', 'Total Active')}
                        </span>
                    </div>
                    <p
                        data-theme={theme}
                        className={cn(
                            'text-2xl font-bold',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    >
                        {summary.totalActiveOrders}
                    </p>
                </motion.div>

                {/* Average Delivery Time */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    data-theme={theme}
                    className={cn(
                        'rounded-xl p-3 border-2',
                        'bg-slate-800/50 border-slate-700/50',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                    )}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            'bg-gradient-to-br from-orange-500 to-orange-600',
                        )}>
                            <Clock className="w-4 h-4 text-white" />
                        </div>
                        <span
                            data-theme={theme}
                            className={cn(
                                'text-xs font-medium',
                                'text-white',
                                'data-[theme=light]:text-slate-700',
                            )}
                        >
                            {t('stats.avgTime', 'Avg Time')}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <p
                            data-theme={theme}
                            className={cn(
                                'text-2xl font-bold',
                                'text-white',
                                'data-[theme=light]:text-slate-900',
                            )}
                        >
                            {summary.avgDeliveryTimeMinutes}
                        </p>
                        <span className="text-sm text-slate-400">
                            {language === 'ar' ? 'دقيقة' : 'min'}
                        </span>
                    </div>
                </motion.div>

                {/* On-Time Rate */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    data-theme={theme}
                    className={cn(
                        'rounded-xl p-3 border-2',
                        'bg-slate-800/50 border-slate-700/50',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                    )}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            'bg-gradient-to-br from-green-500 to-green-600',
                        )}>
                            <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <span
                            data-theme={theme}
                            className={cn(
                                'text-xs font-medium',
                                'text-white',
                                'data-[theme=light]:text-slate-700',
                            )}
                        >
                            {t('stats.onTimeRate', 'On-Time')}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <p
                            data-theme={theme}
                            className={cn(
                                'text-2xl font-bold',
                                'text-white',
                                'data-[theme=light]:text-slate-900',
                            )}
                        >
                            {summary.onTimeDeliveryPercentage}
                        </p>
                        <span className="text-sm text-slate-400">%</span>
                    </div>
                </motion.div>

                {/* Total Drivers */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    data-theme={theme}
                    className={cn(
                        'rounded-xl p-3 border-2',
                        'bg-slate-800/50 border-slate-700/50',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                    )}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            'bg-gradient-to-br from-slate-500 to-slate-600',
                        )}>
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <span
                            data-theme={theme}
                            className={cn(
                                'text-xs font-medium',
                                'text-white',
                                'data-[theme=light]:text-slate-700',
                            )}
                        >
                            {t('stats.totalDrivers', 'Total Drivers')}
                        </span>
                    </div>
                    <p
                        data-theme={theme}
                        className={cn(
                            'text-2xl font-bold',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    >
                        {summary.totalDrivers}
                    </p>
                </motion.div>
            </div>

            {/* Zone Stats (if provided) */}
            {zoneStats.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    data-theme={theme}
                    className={cn(
                        'rounded-xl p-4 border-2',
                        'bg-slate-800/50 border-slate-700/50',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                    )}
                >
                    <h3
                        data-theme={theme}
                        className={cn(
                            'font-bold text-sm mb-3 flex items-center gap-2',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    >
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        {t('stats.zoneBreakdown', 'Zone Breakdown')}
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {zoneStats.map((zone) => (
                            <div
                                key={zone.zoneId}
                                data-theme={theme}
                                className={cn(
                                    'rounded-lg p-2',
                                    'bg-slate-700/30',
                                    'data-[theme=light]:bg-slate-100',
                                )}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-cyan-400">
                                        {zone.zoneCode}
                                    </span>
                                    <PriceDisplay
                                        value={zone.deliveryFee.toString()}
                                        size="xs"
                                        variant="muted"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">
                                        {t('active', 'Active')}: {zone.activeOrders}
                                    </span>
                                    <span className="text-slate-400">
                                        {t('completed', 'Done')}: {zone.completedToday}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default DeliveryStatsRow;
