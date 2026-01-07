import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Truck,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    Package,
    MapPin,
    RefreshCw,
    Filter,
    Search,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import { DeliveryOrderCard } from '../components/DeliveryOrderCard';
import { DriverSelector } from '../components/DriverSelector';
import { DeliveryStatsRow } from '../components/DeliveryStatsRow';
import { useDeliverySocket } from '@/hooks/useDeliverySocket';
import type {
    DashboardSummary,
    DeliveryOrderCard as DeliveryOrderCardType,
    DriverCard,
} from '@/types/pos.types';

// =============================================================================
// DELIVERY DASHBOARD PAGE
// =============================================================================

interface DeliveryDashboardPageProps {
    storeId: string;
    onFetchDashboard: (storeId: string) => Promise<{
        summary: DashboardSummary;
        pendingOrders: DeliveryOrderCardType[];
        assignedOrders: DeliveryOrderCardType[];
        outForDeliveryOrders: DeliveryOrderCardType[];
        readyForPickupOrders: DeliveryOrderCardType[];
        completedOrders: DeliveryOrderCardType[];
        availableDrivers: DriverCard[];
        busyDrivers: DriverCard[];
        offDutyDrivers: DriverCard[];
        zoneStats: Array<{
            zoneId: string;
            zoneCode: string;
            zoneName: string;
            deliveryFee: number;
            estimatedMinutes: number;
            activeOrders: number;
            completedToday: number;
            availableDrivers: number;
        }>;
    }>;
    onAssignDriver: (orderId: string, driverId: string) => Promise<void>;
    onUpdateStatus: (params: {
        orderId: string;
        status: string;
        note?: string;
    }) => Promise<void>;
    onRefresh?: () => void;
}

type TabKey = 'pending' | 'assigned' | 'out_for_delivery' | 'ready' | 'completed';

/**
 * DeliveryDashboardPage
 *
 * Comprehensive delivery operations dashboard showing:
 * - Summary statistics
 * - Orders by delivery status (tabbed view)
 * - Driver availability and status
 * - Zone statistics
 * - Real-time updates via WebSocket
 */
export function DeliveryDashboardPage({
    storeId,
    onFetchDashboard,
    onAssignDriver,
    onUpdateStatus,
    onRefresh,
}: DeliveryDashboardPageProps) {
    const { t } = useTranslation('delivery');
    const { theme, language } = useSettingsStore();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    const [dashboardData, setDashboardData] = useState<{
        summary: DashboardSummary;
        pendingOrders: DeliveryOrderCardType[];
        assignedOrders: DeliveryOrderCardType[];
        outForDeliveryOrders: DeliveryOrderCardType[];
        readyForPickupOrders: DeliveryOrderCardType[];
        completedOrders: DeliveryOrderCardType[];
        availableDrivers: DriverCard[];
        busyDrivers: DriverCard[];
        offDutyDrivers: DriverCard[];
        zoneStats: Array<{
            zoneId: string;
            zoneCode: string;
            zoneName: string;
            deliveryFee: number;
            estimatedMinutes: number;
            activeOrders: number;
            completedToday: number;
            availableDrivers: number;
        }>;
    } | null>(null);

    // Real-time updates via WebSocket
    const { isConnected, lastMessage } = useDeliverySocket(storeId);

    // Fetch dashboard data
    const fetchDashboard = async (showRefreshing = false) => {
        if (showRefreshing) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const data = await onFetchDashboard(storeId);
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to fetch delivery dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchDashboard();
    }, [storeId]);

    // Handle real-time updates
    useEffect(() => {
        if (lastMessage) {
            // Refresh dashboard when receiving WebSocket updates
            fetchDashboard(true);
        }
    }, [lastMessage]);

    // Handle driver assignment
    const handleAssignDriver = async (orderId: string, driverId: string) => {
        try {
            await onAssignDriver(orderId, driverId);
            await fetchDashboard(true);
        } catch (error) {
            console.error('Failed to assign driver:', error);
        }
    };

    // Handle status update
    const handleStatusUpdate = async (params: {
        orderId: string;
        status: string;
        note?: string;
    }) => {
        try {
            await onUpdateStatus(params);
            await fetchDashboard(true);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    // Get orders for active tab
    const getTabOrders = (): DeliveryOrderCardType[] => {
        if (!dashboardData) return [];

        const tabOrderMap: Record<TabKey, DeliveryOrderCardType[]> = {
            pending: dashboardData.pendingOrders,
            assigned: dashboardData.assignedOrders,
            out_for_delivery: dashboardData.outForDeliveryOrders,
            ready: dashboardData.readyForPickupOrders,
            completed: dashboardData.completedOrders,
        };

        let orders = tabOrderMap[activeTab] || [];

        // Filter by search query
        if (searchQuery) {
            orders = orders.filter(
                (order) =>
                    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    order.zoneCode?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return orders;
    };

    // Tab configuration
    const tabs: Array<{
        key: TabKey;
        label: string;
        labelAr: string;
        icon: typeof Package;
        color: string;
        count: number;
    }> = [
            {
                key: 'pending',
                label: 'Pending',
                labelAr: 'قيد الانتظار',
                icon: Clock,
                color: 'from-yellow-500 to-yellow-600',
                count: dashboardData?.summary.totalPendingOrders || 0,
            },
            {
                key: 'assigned',
                label: 'Assigned',
                labelAr: 'معين',
                icon: Users,
                color: 'from-blue-500 to-blue-600',
                count: dashboardData?.summary.totalAssignedOrders || 0,
            },
            {
                key: 'out_for_delivery',
                label: 'Out for Delivery',
                labelAr: 'خارج للتوصيل',
                icon: Truck,
                color: 'from-purple-500 to-purple-600',
                count: dashboardData?.summary.totalOutForDelivery || 0,
            },
            {
                key: 'ready',
                label: 'Ready for Pickup',
                labelAr: 'جاهز للاستلام',
                icon: Package,
                color: 'from-green-500 to-green-600',
                count: dashboardData?.summary.totalReadyForPickup || 0,
            },
            {
                key: 'completed',
                label: 'Completed',
                labelAr: 'مكتمل',
                icon: CheckCircle2,
                color: 'from-slate-500 to-slate-600',
                count: 0, // Don't show count for completed
            },
        ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
                />
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <AlertCircle className="w-12 h-12 mb-3" />
                <p>{t('failedToLoad', 'Failed to load dashboard data')}</p>
                <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => fetchDashboard()}
                >
                    {t('retry', 'Retry')}
                </Button>
            </div>
        );
    }

    const tabOrders = getTabOrders();

    return (
        <div className="space-y-4" data-testid="delivery-dashboard">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1
                        data-theme={theme}
                        className={cn(
                            'text-2xl font-bold',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    >
                        {t('dashboard.title', 'Delivery Dashboard')}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {isConnected
                            ? t('dashboard.connected', 'Connected - Live updates')
                            : t('dashboard.disconnected', 'Disconnected - Refreshing...')
                        }
                    </p>
                </div>
                <Button
                    variant="secondary"
                    onClick={() => {
                        fetchDashboard(true);
                        onRefresh?.();
                    }}
                    disabled={refreshing}
                >
                    <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
                </Button>
            </div>

            {/* Summary Stats */}
            <DeliveryStatsRow
                summary={dashboardData.summary}
                zoneStats={dashboardData.zoneStats}
            />

            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;

                    return (
                        <motion.button
                            key={tab.key}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(tab.key)}
                            data-theme={theme}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all flex-shrink-0',
                                isActive
                                    ? `bg-gradient-to-r ${tab.color} border-transparent text-white`
                                    : cn(
                                        'border-slate-700 hover:border-slate-600',
                                        'data-[theme=light]:border-slate-300',
                                    ),
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium text-sm">
                                {language === 'ar' ? tab.labelAr : tab.label}
                            </span>
                            {tab.count > 0 && (
                                <span className={cn(
                                    'text-xs px-1.5 py-0.5 rounded',
                                    isActive ? 'bg-white/20' : 'bg-slate-700',
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('dashboard.searchPlaceholder', 'Search by order number, customer, or zone...')}
                    data-theme={theme}
                    className={cn(
                        'w-full pl-10 pr-4 py-2 rounded-xl border-2',
                        'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                        'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-300',
                        'text-white placeholder:text-slate-500',
                        'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder:text-slate-400',
                    )}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Orders Grid */}
            {tabOrders.length === 0 ? (
                <div
                    data-theme={theme}
                    className={cn(
                        'rounded-xl p-8 text-center',
                        'bg-slate-800/50',
                        'data-[theme=light]:bg-slate-50',
                    )}
                >
                    <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p
                        data-theme={theme}
                        className={cn(
                            'text-slate-400',
                            'data-[theme=light]:text-slate-500',
                        )}
                    >
                        {searchQuery
                            ? t('dashboard.noSearchResults', 'No orders found matching your search')
                            : t('dashboard.noOrders', 'No orders in this category')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {tabOrders.map((order) => (
                        <DeliveryOrderCard
                            key={order.orderId}
                            order={order}
                            drivers={[...dashboardData.availableDrivers, ...dashboardData.busyDrivers]}
                            onAssignDriver={handleAssignDriver}
                            onUpdateStatus={handleStatusUpdate}
                            expanded={selectedOrderId === order.orderId}
                            onToggleExpand={() =>
                                setSelectedOrderId(
                                    selectedOrderId === order.orderId ? null : order.orderId
                                )
                            }
                        />
                    ))}
                </div>
            )}

            {/* Driver Availability Panel */}
            <div
                data-theme={theme}
                className={cn(
                    'rounded-xl p-4',
                    'bg-slate-800/50 border border-slate-700/50',
                    'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-200',
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
                    <Users className="w-4 h-4" />
                    {t('dashboard.driverStatus', 'Driver Status')}
                </h3>

                <div className="grid grid-cols-3 gap-3">
                    {/* Available */}
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">
                            {dashboardData.summary.availableDrivers}
                        </p>
                        <p className="text-xs text-slate-400">{t('dashboard.available', 'Available')}</p>
                    </div>

                    {/* Busy */}
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">
                            {dashboardData.summary.busyDrivers}
                        </p>
                        <p className="text-xs text-slate-400">{t('dashboard.busy', 'On Delivery')}</p>
                    </div>

                    {/* Off Duty */}
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-400">
                            {(dashboardData.summary.totalDrivers - dashboardData.summary.availableDrivers - dashboardData.summary.busyDrivers) || 0}
                        </p>
                        <p className="text-xs text-slate-400">{t('dashboard.offDuty', 'Off Duty')}</p>
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-400">{t('dashboard.avgTime', 'Avg Time')}</span>
                        <span
                            data-theme={theme}
                            className={cn('font-medium', 'text-white', 'data-[theme=light]:text-slate-900')}
                        >
                            {dashboardData.summary.avgDeliveryTimeMinutes}m
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-400">{t('dashboard.onTime', 'On-Time Rate')}</span>
                        <span
                            data-theme={theme}
                            className={cn('font-medium', 'text-white', 'data-[theme=light]:text-slate-900')}
                        >
                            {dashboardData.summary.onTimeDeliveryPercentage}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeliveryDashboardPage;
