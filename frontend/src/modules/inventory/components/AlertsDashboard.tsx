/**
 * AlertsDashboard Component
 *
 * Overview of inventory alerts with filtering and actions
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    Filter,
    ChevronDown,
    Bell,
    ShoppingBag,
    TrendingDown,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';
import { AlertCard } from './AlertCard';
import type { StockAlert } from '@/services/inventory.service';

// =============================================================================
// TYPES
// =============================================================================

interface AlertsDashboardProps {
    alerts: StockAlert[];
    loading?: boolean;
    onRefresh?: () => void;
    onAcknowledge?: (alertId: string) => Promise<void>;
    onResolve?: (alertId: string) => Promise<void>;
    onSnooze?: (alertId: string, minutes: number) => Promise<void>;
}

type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
type ViewMode = 'all' | 'unacknowledged' | 'resolved';

// =============================================================================
// ALERT TYPE CONFIG
// =============================================================================

const ALERT_TYPE_CONFIG: Record<
    AlertType,
    { label: string; labelAr: string; icon: typeof AlertTriangle; color: string; bgColor: string }
> = {
    LOW_STOCK: {
        label: 'Low Stock',
        labelAr: 'مخزون منخفض',
        icon: TrendingDown,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500/30',
    },
    OUT_OF_STOCK: {
        label: 'Out of Stock',
        labelAr: 'نفذ المخزون',
        icon: XCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20 border-red-500/30',
    },
    EXPIRING_SOON: {
        label: 'Expiring Soon',
        labelAr: 'ينتهي قريباً',
        icon: Clock,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20 border-orange-500/30',
    },
    EXPIRED: {
        label: 'Expired',
        labelAr: 'منتهي الصلاحية',
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-600/20 border-red-600/30',
    },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function AlertsDashboard({
    alerts,
    loading,
    onRefresh,
    onAcknowledge,
    onResolve,
    onSnooze,
}: AlertsDashboardProps) {
    const { language } = useSettingsStore();
    const [viewMode, setViewMode] = useState<ViewMode>('unacknowledged');
    const [filterType, setFilterType] = useState<AlertType | 'all'>('all');

    // Filter and sort alerts
    const filteredAlerts = useMemo(() => {
        let filtered = [...alerts];

        // View mode filter
        if (viewMode === 'unacknowledged') {
            filtered = filtered.filter((a) => !a.isAcknowledged);
        } else if (viewMode === 'resolved') {
            filtered = filtered.filter((a) => a.isResolved);
        }

        // Type filter
        if (filterType !== 'all') {
            filtered = filtered.filter((a) => a.alertType === filterType);
        }

        // Sort: unacknowledged first, then by date
        filtered.sort((a, b) => {
            if (a.isAcknowledged !== b.isAcknowledged) {
                return a.isAcknowledged ? 1 : -1;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return filtered;
    }, [alerts, viewMode, filterType]);

    // Calculate stats
    const stats = useMemo(() => {
        return {
            total: alerts.length,
            unacknowledged: alerts.filter((a) => !a.isAcknowledged).length,
            resolved: alerts.filter((a) => a.isResolved).length,
            byType: {
                LOW_STOCK: alerts.filter((a) => a.alertType === 'LOW_STOCK' && !a.isAcknowledged).length,
                OUT_OF_STOCK: alerts.filter((a) => a.alertType === 'OUT_OF_STOCK' && !a.isAcknowledged).length,
                EXPIRING_SOON: alerts.filter((a) => a.alertType === 'EXPIRING_SOON' && !a.isAcknowledged).length,
                EXPIRED: alerts.filter((a) => a.alertType === 'EXPIRED' && !a.isAcknowledged).length,
            },
        };
    }, [alerts]);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Bell}
                    label={language === 'ar' ? 'إجمالي التنبيهات' : 'Total Alerts'}
                    value={stats.total}
                    color="text-slate-400"
                    bgColor="bg-slate-500/20"
                />
                <StatCard
                    icon={AlertTriangle}
                    label={language === 'ar' ? 'غير معترف بها' : 'Unacknowledged'}
                    value={stats.unacknowledged}
                    color="text-yellow-400"
                    bgColor="bg-yellow-500/20"
                />
                <StatCard
                    icon={CheckCircle}
                    label={language === 'ar' ? 'تم الحل' : 'Resolved'}
                    value={stats.resolved}
                    color="text-emerald-400"
                    bgColor="bg-emerald-500/20"
                />
                <StatCard
                    icon={Package}
                    label={language === 'ar' ? 'منتجات متأثرة' : 'Products Affected'}
                    value={new Set(alerts.map((a) => a.productId)).size}
                    color="text-blue-400"
                    bgColor="bg-blue-500/20"
                />
            </div>

            {/* Type Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(ALERT_TYPE_CONFIG).map(([type, config]) => {
                    const Icon = config.icon;
                    const count = stats.byType[type as AlertType];
                    return (
                        <motion.button
                            key={type}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFilterType(filterType === type ? 'all' : type as AlertType)}
                            className={cn(
                                'p-4 rounded-xl border-2 transition-all',
                                config.bgColor,
                                filterType === type ? 'border-current' : 'border-transparent opacity-60 hover:opacity-100',
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={cn('w-6 h-6', config.color)} />
                                <div className="text-start">
                                    <p className={cn('text-2xl font-bold', config.color)}>{count}</p>
                                    <p className={cn('text-xs', config.color)}>
                                        {language === 'ar' ? config.labelAr : config.label}
                                    </p>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <div className="flex gap-1">
                        {[
                            { key: 'all' as ViewMode, label: language === 'ar' ? 'الكل' : 'All' },
                            { key: 'unacknowledged' as ViewMode, label: language === 'ar' ? 'غير معترف بها' : 'Unacknowledged' },
                            { key: 'resolved' as ViewMode, label: language === 'ar' ? 'تم الحل' : 'Resolved' },
                        ].map((mode) => (
                            <button
                                key={mode.key}
                                onClick={() => setViewMode(mode.key)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                    viewMode === mode.key
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
                                )}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={onRefresh}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                >
                    {language === 'ar' ? 'تحديث' : 'Refresh'}
                </button>
            </div>

            {/* Alerts List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
                </div>
            ) : filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                    <CheckCircle className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                        {language === 'ar' ? 'لا توجد تنبيهات' : 'No alerts'}
                    </p>
                    <p className="text-sm mt-2">
                        {language === 'ar' ? 'كل شيء تحت السيطرة!' : 'Everything is under control!'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAlerts.map((alert) => (
                        <AlertCard
                            key={alert.id}
                            alert={alert}
                            onAcknowledge={onAcknowledge}
                            onResolve={onResolve}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: number;
    color: string;
    bgColor: string;
}

function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
    return (
        <div className={cn('p-4 rounded-xl border', bgColor, 'border-current')}>
            <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', bgColor)}>
                    <Icon className={cn('w-5 h-5', color)} />
                </div>
                <div>
                    <p className={cn('text-xl font-bold', color)}>{value}</p>
                    <p className={cn('text-xs', color)}>{label}</p>
                </div>
            </div>
        </div>
    );
}

export default AlertsDashboard;
