import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Check, ChevronDown, Search, XCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import type { DriverCard, DriverStatus } from '@/types/pos.types';

// =============================================================================
// DRIVER SELECTOR COMPONENT
// =============================================================================

interface DriverSelectorProps {
    drivers: DriverCard[];
    selectedDriverId: string | null;
    onSelectDriver: (driverId: string) => void | Promise<void>;
    disabled?: boolean;
    showAvailability?: boolean;
    filterStatus?: DriverStatus[];
}

/**
 * DriverSelector
 *
 * Dropdown component for selecting a delivery driver.
 * Shows driver availability, current orders count, and location.
 */
export function DriverSelector({
    drivers,
    selectedDriverId,
    onSelectDriver,
    disabled = false,
    showAvailability = true,
    filterStatus,
}: DriverSelectorProps) {
    const { t } = useTranslation('delivery');
    const { theme, language } = useSettingsStore();

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter drivers by status and search query
    const filteredDrivers = drivers.filter((driver) => {
        // Status filter
        if (filterStatus && !filterStatus.includes(driver.status)) {
            return false;
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                driver.driverName.toLowerCase().includes(query) ||
                driver.driverPhone?.includes(query)
            );
        }

        return true;
    });

    // Get selected driver
    const selectedDriver = drivers.find((d) => d.driverId === selectedDriverId);

    // Get status color
    const getStatusColor = (status: DriverStatus) => {
        switch (status) {
            case 'AVAILABLE':
                return 'text-green-400 bg-green-500/20 border-green-500/30';
            case 'BUSY':
                return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
            case 'OFF_DUTY':
                return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
            case 'ON_BREAK':
                return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
            default:
                return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
        }
    };

    const handleSelect = async (driverId: string) => {
        setIsOpen(false);
        await onSelectDriver(driverId);
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: disabled ? 1 : 1.01 }}
                whileTap={{ scale: disabled ? 1 : 0.99 }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                data-theme={theme}
                className={cn(
                    'w-full px-3 py-2 rounded-xl border-2 text-left transition-all flex items-center justify-between',
                    'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                    disabled && 'opacity-50 cursor-not-allowed',
                )}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {selectedDriver ? (
                        <>
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                'bg-cyan-500/20 text-cyan-400',
                            )}>
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p
                                    data-theme={theme}
                                    className={cn(
                                        'font-medium text-sm truncate',
                                        'text-white',
                                        'data-[theme=light]:text-slate-900',
                                    )}
                                >
                                    {selectedDriver.driverName}
                                </p>
                                {showAvailability && (
                                    <p className="text-xs text-slate-400">
                                        {t('orders', 'Orders')}: {selectedDriver.currentOrdersCount}/{selectedDriver.maxConcurrentOrders}
                                    </p>
                                )}
                            </div>
                            <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full border',
                                getStatusColor(selectedDriver.status),
                            )}>
                                {selectedDriver.status}
                            </span>
                        </>
                    ) : (
                        <>
                            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span
                                data-theme={theme}
                                className={cn(
                                    'text-sm',
                                    'text-slate-400',
                                    'data-[theme=light]:text-slate-500',
                                )}
                            >
                                {t('selectDriver', 'Select Driver')}
                            </span>
                        </>
                    )}
                </div>
                <ChevronDown className={cn(
                    'w-4 h-4 text-slate-400 transition-transform',
                    isOpen && 'rotate-180',
                )} />
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            data-theme={theme}
                            className={cn(
                                'absolute z-20 w-full mt-2 rounded-xl border-2 shadow-xl overflow-hidden',
                                'bg-slate-900 border-slate-700',
                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                            )}
                        >
                            {/* Search */}
                            <div className="p-2 border-b border-slate-700">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('searchDrivers', 'Search drivers...')}
                                        data-theme={theme}
                                        className={cn(
                                            'w-full pl-9 pr-8 py-2 rounded-lg border text-sm',
                                            'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                                            'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-300',
                                            'text-white placeholder:text-slate-500',
                                            'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder:text-slate-400',
                                        )}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Driver List */}
                            <div className="max-h-64 overflow-y-auto">
                                {filteredDrivers.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 text-sm">
                                        {searchQuery
                                            ? t('noDriversFound', 'No drivers found')
                                            : t('noDriversAvailable', 'No drivers available')}
                                    </div>
                                ) : (
                                    filteredDrivers.map((driver) => (
                                        <motion.button
                                            key={driver.driverId}
                                            whileHover={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                                            onClick={() => handleSelect(driver.driverId)}
                                            data-theme={theme}
                                            className={cn(
                                                'w-full p-3 flex items-center gap-3 text-left border-b border-slate-700/50 last:border-b-0',
                                                'transition-colors',
                                                selectedDriverId === driver.driverId && 'bg-cyan-500/10',
                                            )}
                                        >
                                            {/* Avatar */}
                                            <div className={cn(
                                                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                                                driver.status === 'AVAILABLE'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : driver.status === 'BUSY'
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-slate-500/20 text-slate-400',
                                            )}>
                                                <User className="w-5 h-5" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p
                                                        data-theme={theme}
                                                        className={cn(
                                                            'font-medium text-sm',
                                                            'text-white',
                                                            'data-[theme=light]:text-slate-900',
                                                        )}
                                                    >
                                                        {driver.driverName}
                                                    </p>
                                                    <span className={cn(
                                                        'text-xs px-1.5 py-0.5 rounded-full border',
                                                        getStatusColor(driver.status),
                                                    )}>
                                                        {driver.status}
                                                    </span>
                                                </div>

                                                {/* Metrics */}
                                                {showAvailability && (
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                        <span>
                                                            {t('orders', 'Orders')}: {driver.currentOrdersCount}/{driver.maxConcurrentOrders}
                                                        </span>
                                                        {driver.metrics && (
                                                            <>
                                                                <span>•</span>
                                                                <span>
                                                                    {t('onTime', 'On-time')}: {driver.metrics.onTimeRate}%
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Active Orders */}
                                                {driver.activeOrders.length > 0 && (
                                                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>
                                                            {driver.activeOrders.length} {language === 'ar' ? 'طلب نشط' : 'active order(s)'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selection Indicator */}
                                            {selectedDriverId === driver.driverId && (
                                                <div className={cn(
                                                    'w-6 h-6 rounded-full flex items-center justify-center',
                                                    'bg-cyan-500',
                                                )}>
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default DriverSelector;
