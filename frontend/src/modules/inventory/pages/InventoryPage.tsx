/**
 * Inventory Page
 * Main inventory management dashboard with tabs for overview, batches, movements, and alerts
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Boxes,
    History,
    AlertTriangle,
    Plus,
    FileDown,
    ClipboardCheck,
    Search,
    Filter,
    Warehouse,
    TrendingDown,
    TrendingUp,
    ChevronDown,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventoryStore } from '@/stores/inventory.store';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/decimal';

// Import modals
import { ItemMasterModal } from '../components/modals/ItemMasterModal';
import { PurchaseInvoiceModal } from '../components/modals/PurchaseInvoiceModal';
import { StockAdjustmentModal } from '../components/modals/StockAdjustmentModal';

// =============================================================================
// Types
// =============================================================================

type TabType = 'overview' | 'batches' | 'movements' | 'alerts';

interface Tab {
    id: TabType;
    labelKey: string;
    icon: React.ElementType;
    count?: number;
}

// =============================================================================
// Component
// =============================================================================

export function InventoryPage() {
    const { t } = useTranslation('inventory');
    const { theme, language } = useSettingsStore();
    const isRTL = language === 'ar';

    // Store
    const {
        warehouses,
        selectedWarehouseId,
        inventorySummary,
        batches,
        stockMoves,
        alerts,
        isLoadingSummary,
        isLoadingBatches,
        isLoadingMoves,
        isLoadingAlerts,
        activeTab,
        error,
        fetchWarehouses,
        setSelectedWarehouse,
        fetchInventorySummary,
        setActiveTab,
        clearError,
    } = useInventoryStore();

    // Local state for modals
    const [isItemMasterOpen, setIsItemMasterOpen] = useState(false);
    const [isPurchaseInvoiceOpen, setIsPurchaseInvoiceOpen] = useState(false);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Tabs configuration
    const tabs: Tab[] = [
        { id: 'overview', labelKey: 'tabs.overview', icon: Package },
        { id: 'batches', labelKey: 'tabs.batches', icon: Boxes },
        { id: 'movements', labelKey: 'tabs.movements', icon: History },
        { id: 'alerts', labelKey: 'tabs.alerts', icon: AlertTriangle, count: (alerts || []).filter(a => !a.isAcknowledged).length },
    ];

    // Initialize data
    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    useEffect(() => {
        if (selectedWarehouseId) {
            fetchInventorySummary();
        }
    }, [selectedWarehouseId, fetchInventorySummary]);

    // Ensure arrays are valid (API could return null/undefined on error)
    const safeInventorySummary = Array.isArray(inventorySummary) ? inventorySummary : [];
    const safeAlerts = Array.isArray(alerts) ? alerts : [];

    // Calculate summary stats
    const totalProducts = safeInventorySummary.length;
    const totalValue = safeInventorySummary.reduce((sum, item) => sum + parseFloat(item.totalValue || '0'), 0);
    const lowStockCount = safeInventorySummary.filter(item => item.isLowStock).length;
    const activeAlerts = safeAlerts.filter(a => !a.isResolved).length;

    // Selected warehouse
    const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

    // Filter inventory summary based on search
    const filteredSummary = safeInventorySummary.filter(item =>
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.productSku && item.productSku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div
            data-theme={theme}
            className={cn(
                'min-h-screen bg-gradient-to-br p-4 md:p-6',
                'data-[theme=dark]:from-[#0a0c0f] data-[theme=dark]:via-[#12151a] data-[theme=dark]:to-[#1a1f25]',
                'data-[theme=light]:from-slate-50 data-[theme=light]:via-white data-[theme=light]:to-slate-100',
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            {/* Header */}
            <header className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className={cn(
                            'text-2xl md:text-3xl font-bold',
                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-800'
                        )} data-theme={theme}>
                            {t('title', 'Inventory Management')}
                        </h1>
                        <p className={cn(
                            'text-sm mt-1',
                            'data-[theme=dark]:text-gray-400 data-[theme=light]:text-slate-500'
                        )} data-theme={theme}>
                            {t('subtitle', 'Track stock levels, batches, and movements')}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Warehouse Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setIsWarehouseDropdownOpen(!isWarehouseDropdownOpen)}
                                data-theme={theme}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                                    'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-700',
                                    'hover:border-emerald-500/50'
                                )}
                            >
                                <Warehouse className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {selectedWarehouse?.name || t('selectWarehouse', 'Select Warehouse')}
                                </span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                                {isWarehouseDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        data-theme={theme}
                                        className={cn(
                                            'absolute top-full mt-2 z-50 min-w-[200px] rounded-lg border shadow-xl',
                                            'data-[theme=dark]:bg-[#1a1f25] data-[theme=dark]:border-white/10',
                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                                            isRTL ? 'right-0' : 'left-0'
                                        )}
                                    >
                                        {warehouses.map(warehouse => (
                                            <button
                                                key={warehouse.id}
                                                onClick={() => {
                                                    setSelectedWarehouse(warehouse.id);
                                                    setIsWarehouseDropdownOpen(false);
                                                }}
                                                data-theme={theme}
                                                className={cn(
                                                    'w-full px-4 py-2.5 text-start text-sm transition-colors',
                                                    'data-[theme=dark]:text-gray-300 data-[theme=dark]:hover:bg-white/10',
                                                    'data-[theme=light]:text-slate-700 data-[theme=light]:hover:bg-slate-50',
                                                    warehouse.id === selectedWarehouseId && 'bg-emerald-500/20 text-emerald-400'
                                                )}
                                            >
                                                {warehouse.name}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Quick Actions */}
                        <Button
                            variant="ghost"
                            onClick={() => setIsPurchaseInvoiceOpen(true)}
                            className="gap-2"
                        >
                            <FileDown className="w-4 h-4" />
                            <span className="hidden md:inline">{t('actions.receive', 'Receive Stock')}</span>
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={() => setIsAdjustmentOpen(true)}
                            className="gap-2"
                        >
                            <ClipboardCheck className="w-4 h-4" />
                            <span className="hidden md:inline">{t('actions.adjust', 'Adjust')}</span>
                        </Button>

                        <Button
                            variant="primary"
                            onClick={() => setIsItemMasterOpen(true)}
                            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden md:inline">{t('actions.newItem', 'New Item')}</span>
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-6 overflow-x-auto pb-2" data-theme={theme}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            data-theme={theme}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap',
                                activeTab === tab.id
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                    : cn(
                                        'data-[theme=dark]:text-gray-400 data-[theme=dark]:hover:bg-white/10',
                                        'data-[theme=light]:text-slate-600 data-[theme=light]:hover:bg-slate-100'
                                    )
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {t(tab.labelKey, tab.id)}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-xs font-bold',
                                    activeTab === tab.id
                                        ? 'bg-white/20'
                                        : 'bg-red-500 text-white'
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <SummaryCard
                    icon={Package}
                    label={t('summary.totalProducts', 'Total Products')}
                    value={totalProducts.toString()}
                    theme={theme}
                />
                <SummaryCard
                    icon={TrendingUp}
                    label={t('summary.totalValue', 'Total Value')}
                    value={formatCurrency(totalValue, 'SAR', language === 'ar' ? 'ar-SA' : 'en-SA')}
                    theme={theme}
                    accent="emerald"
                />
                <SummaryCard
                    icon={TrendingDown}
                    label={t('summary.lowStock', 'Low Stock')}
                    value={lowStockCount.toString()}
                    theme={theme}
                    accent={lowStockCount > 0 ? 'amber' : undefined}
                />
                <SummaryCard
                    icon={AlertTriangle}
                    label={t('summary.alerts', 'Active Alerts')}
                    value={activeAlerts.toString()}
                    theme={theme}
                    accent={activeAlerts > 0 ? 'red' : undefined}
                />
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                    <Search className={cn(
                        'absolute w-4 h-4 top-1/2 -translate-y-1/2',
                        isRTL ? 'right-3' : 'left-3',
                        'text-gray-400'
                    )} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('search.placeholder', 'Search products...')}
                        data-theme={theme}
                        className={cn(
                            'w-full py-2.5 rounded-lg border transition-colors',
                            isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4',
                            'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                            'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                        )}
                    />
                </div>

                <Button variant="ghost" className="gap-2">
                    <Filter className="w-4 h-4" />
                    {t('filter', 'Filter')}
                </Button>

                <Button
                    variant="ghost"
                    onClick={() => fetchInventorySummary()}
                    className="gap-2"
                >
                    <RefreshCw className={cn('w-4 h-4', isLoadingSummary && 'animate-spin')} />
                </Button>
            </div>

            {/* Error Alert */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-between"
                >
                    <span className="text-red-400">{error}</span>
                    <button onClick={clearError} className="text-red-400 hover:text-red-300">✕</button>
                </motion.div>
            )}

            {/* Content Area */}
            <div
                data-theme={theme}
                className={cn(
                    'rounded-xl border overflow-hidden',
                    'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10',
                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200'
                )}
            >
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <OverviewTab
                            key="overview"
                            data={filteredSummary}
                            isLoading={isLoadingSummary}
                            theme={theme}
                            isRTL={isRTL}
                            language={language}
                        />
                    )}
                    {activeTab === 'batches' && (
                        <BatchesTab
                            key="batches"
                            data={batches}
                            isLoading={isLoadingBatches}
                            theme={theme}
                            isRTL={isRTL}
                        />
                    )}
                    {activeTab === 'movements' && (
                        <MovementsTab
                            key="movements"
                            data={stockMoves}
                            isLoading={isLoadingMoves}
                            theme={theme}
                            isRTL={isRTL}
                        />
                    )}
                    {activeTab === 'alerts' && (
                        <AlertsTab
                            key="alerts"
                            data={alerts}
                            isLoading={isLoadingAlerts}
                            theme={theme}
                            isRTL={isRTL}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <ItemMasterModal
                isOpen={isItemMasterOpen}
                onClose={() => setIsItemMasterOpen(false)}
            />
            <PurchaseInvoiceModal
                isOpen={isPurchaseInvoiceOpen}
                onClose={() => setIsPurchaseInvoiceOpen(false)}
            />
            <StockAdjustmentModal
                isOpen={isAdjustmentOpen}
                onClose={() => setIsAdjustmentOpen(false)}
            />
        </div>
    );
}

// =============================================================================
// Summary Card Component
// =============================================================================

interface SummaryCardProps {
    icon: React.ElementType;
    label: string;
    value: string;
    theme: string;
    accent?: 'emerald' | 'amber' | 'red';
}

function SummaryCard({ icon: Icon, label, value, theme, accent }: SummaryCardProps) {
    const accentColors = {
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        red: 'text-red-400',
    };

    return (
        <div
            data-theme={theme}
            className={cn(
                'p-4 rounded-xl border',
                'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10',
                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200'
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    accent
                        ? `bg-${accent}-500/20`
                        : 'data-[theme=dark]:bg-white/10 data-[theme=light]:bg-slate-100'
                )} data-theme={theme}>
                    <Icon className={cn('w-5 h-5', accent ? accentColors[accent] : 'text-gray-400')} />
                </div>
                <div>
                    <p className={cn(
                        'text-xs',
                        'data-[theme=dark]:text-gray-400 data-[theme=light]:text-slate-500'
                    )} data-theme={theme}>
                        {label}
                    </p>
                    <p className={cn(
                        'text-xl font-bold',
                        accent ? accentColors[accent] : '',
                        !accent && 'data-[theme=dark]:text-white data-[theme=light]:text-slate-800'
                    )} data-theme={theme}>
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Tab Components
// =============================================================================

import type { InventorySummary, InventoryBatch, StockMove, StockAlert } from '@/services/inventory.service';

interface TabProps<T> {
    data: T[];
    isLoading: boolean;
    theme: string;
    isRTL: boolean;
    language?: string;
}

function OverviewTab({ data, isLoading, theme, language }: TabProps<InventorySummary> & { language: string }) {
    const { t } = useTranslation('inventory');

    if (isLoading) {
        return <LoadingState />;
    }

    if (data.length === 0) {
        return <EmptyState message={t('empty.products', 'No products found')} />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <table className="w-full">
                <thead>
                    <tr data-theme={theme} className="data-[theme=dark]:bg-white/5 data-[theme=light]:bg-slate-50">
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase">
                            {t('table.product', 'Product')}
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase">
                            {t('table.sku', 'SKU')}
                        </th>
                        <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase">
                            {t('table.quantity', 'Qty')}
                        </th>
                        <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase">
                            {t('table.avgCost', 'Avg Cost')}
                        </th>
                        <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase">
                            {t('table.value', 'Value')}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                            {t('table.status', 'Status')}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                            {t('table.actions', 'Actions')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr
                            key={item.productId}
                            data-theme={theme}
                            className={cn(
                                'border-t transition-colors',
                                'data-[theme=dark]:border-white/5 data-[theme=dark]:hover:bg-white/5',
                                'data-[theme=light]:border-slate-100 data-[theme=light]:hover:bg-slate-50'
                            )}
                        >
                            <td className="px-4 py-3">
                                <span className={cn(
                                    'font-medium',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-800'
                                )} data-theme={theme}>
                                    {item.productName}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                                {item.productSku || '-'}
                            </td>
                            <td className={cn(
                                'px-4 py-3 text-end font-mono font-medium',
                                'data-[theme=dark]:text-white data-[theme=light]:text-slate-800'
                            )} data-theme={theme}>
                                {parseFloat(item.totalQty).toFixed(0)}
                            </td>
                            <td className="px-4 py-3 text-end font-mono text-gray-400">
                                {formatCurrency(parseFloat(item.avgCost), 'SAR', language === 'ar' ? 'ar-SA' : 'en-SA')}
                            </td>
                            <td className={cn(
                                'px-4 py-3 text-end font-mono font-medium',
                                'data-[theme=dark]:text-emerald-400 data-[theme=light]:text-emerald-600'
                            )} data-theme={theme}>
                                {formatCurrency(parseFloat(item.totalValue), 'SAR', language === 'ar' ? 'ar-SA' : 'en-SA')}
                            </td>
                            <td className="px-4 py-3 text-center">
                                {item.isLowStock ? (
                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                                        {t('status.lowStock', 'Low Stock')}
                                    </span>
                                ) : (
                                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                                        {t('status.inStock', 'In Stock')}
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <button className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                                        <TrendingDown className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </motion.div>
    );
}

function BatchesTab({ data, isLoading }: TabProps<InventoryBatch>) {
    const { t } = useTranslation('inventory');

    if (isLoading) return <LoadingState />;
    if (data.length === 0) return <EmptyState message={t('empty.batches', 'No batches found')} />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="p-8 text-center text-gray-400">
                {t('comingSoon', 'Batches view coming soon...')}
            </div>
        </motion.div>
    );
}

function MovementsTab({ data, isLoading }: TabProps<StockMove>) {
    const { t } = useTranslation('inventory');

    if (isLoading) return <LoadingState />;
    if (data.length === 0) return <EmptyState message={t('empty.movements', 'No stock movements found')} />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="p-8 text-center text-gray-400">
                {t('comingSoon', 'Movements view coming soon...')}
            </div>
        </motion.div>
    );
}

function AlertsTab({ data, isLoading }: TabProps<StockAlert>) {
    const { t } = useTranslation('inventory');

    if (isLoading) return <LoadingState />;
    if (data.length === 0) return <EmptyState message={t('empty.alerts', 'No active alerts')} />;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="p-8 text-center text-gray-400">
                {t('comingSoon', 'Alerts view coming soon...')}
            </div>
        </motion.div>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="w-12 h-12 mb-4 opacity-50" />
            <p>{message}</p>
        </div>
    );
}

export default InventoryPage;
