/**
 * Tables Page
 *
 * Table management and floor plan view
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useTablesStore } from '@/stores/tables.store';
import { FloorPlanView } from '../components/FloorPlanView';
import { TableDetailsModal } from '../components/TableDetailsModal';
import { TableFormModal } from '../components/TableFormModal';
import { ZoneFormModal } from '../components/ZoneFormModal';
import { cn } from '@/lib/utils';
import type { Table } from '@/services/tables.service';

// =============================================================================
// COMPONENT
// =============================================================================

export default function TablesPage() {
    const { t, i18n } = useTranslation('tables');
    const language = i18n.language;
    const { theme } = useSettingsStore();
    const isRTL = language === 'ar';

    const {
        zones,
        tables,
        isLoadingZones,
        isLoadingTables,
        error,
        fetchZones,
        fetchTables,
        clearError,
    } = useTablesStore();

    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isTableFormOpen, setIsTableFormOpen] = useState(false);
    const [isZoneFormOpen, setIsZoneFormOpen] = useState(false);
    const [storeId] = useState<string>('00000000-0000-0000-0000-000000000001'); // Default store UUID

    // Initialize data
    useEffect(() => {
        fetchZones(storeId);
        fetchTables(storeId);
    }, [fetchZones, fetchTables, storeId]);

    // Handle table click
    const handleTableClick = (table: Table) => {
        setSelectedTable(table);
    };

    // Handle table double-click - open details
    const handleTableDoubleClick = (table: Table) => {
        setSelectedTable(table);
        setIsDetailsOpen(true);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchZones(storeId);
        fetchTables(storeId);
    };

    // Handle table created
    const handleTableCreated = () => {
        handleRefresh();
        setIsTableFormOpen(false);
    };

    // Handle zone created
    const handleZoneCreated = () => {
        handleRefresh();
        setIsZoneFormOpen(false);
    };

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
                            {t('title', 'Table Management')}
                        </h1>
                        <p className={cn(
                            'text-sm mt-1',
                            'data-[theme=dark]:text-gray-400 data-[theme=light]:text-slate-500'
                        )} data-theme={theme}>
                            {t('subtitle', 'Manage tables and view floor plan')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            data-theme={theme}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                                'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-700',
                                'hover:border-cyan-500/50'
                            )}
                        >
                            <Map className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {t('refresh', 'Refresh')}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

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

            {/* Floor Plan */}
            <FloorPlanView
                tables={tables}
                zones={zones}
                loading={isLoadingZones || isLoadingTables}
                selectedTableId={selectedTable?.id}
                onTableClick={handleTableClick}
                onTableDoubleClick={handleTableDoubleClick}
                onRefresh={handleRefresh}
                onAddTable={() => setIsTableFormOpen(true)}
                onAddZone={() => setIsZoneFormOpen(true)}
            />

            {/* Table Details Modal */}
            <TableDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => {
                    setIsDetailsOpen(false);
                    setSelectedTable(null);
                }}
                table={selectedTable}
            />

            {/* Table Form Modal */}
            <TableFormModal
                isOpen={isTableFormOpen}
                onClose={() => setIsTableFormOpen(false)}
                onSuccess={handleTableCreated}
                zones={zones}
                storeId={storeId}
            />

            {/* Zone Form Modal */}
            <ZoneFormModal
                isOpen={isZoneFormOpen}
                onClose={() => setIsZoneFormOpen(false)}
                onSuccess={handleZoneCreated}
                storeId={storeId}
            />
        </div>
    );
}
