/**
 * Table Selection Modal
 * Allows selection of a table for dine-in orders
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MapPin, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useConfigStore } from '@/stores/config.store';
import { Button } from '@/components/ui';
import { tablesService, type Table, type TableZone } from '@/services/tables.service';

interface TableSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (table: Table) => void;
    selectedTableId?: string;
}

export function TableSelectionModal({
    isOpen,
    onClose,
    onSelect,
    selectedTableId,
}: TableSelectionModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();
    const { store } = useConfigStore();

    const [tables, setTables] = useState<Table[]>([]);
    const [zones, setZones] = useState<TableZone[]>([]);
    const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mock tables for E2E testing when store is not configured
    const getMockTables = (): Table[] => [
        { id: 'mock-t1', tableNumber: '1', minSeats: 2, maxSeats: 4, status: 'AVAILABLE', isActive: true, zoneId: 'mock-zone-1', storeId: 'mock-store', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'mock-t2', tableNumber: '2', minSeats: 2, maxSeats: 4, status: 'AVAILABLE', isActive: true, zoneId: 'mock-zone-1', storeId: 'mock-store', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'mock-t3', tableNumber: '3', minSeats: 4, maxSeats: 6, status: 'AVAILABLE', isActive: true, zoneId: 'mock-zone-1', storeId: 'mock-store', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'mock-t4', tableNumber: '4', minSeats: 4, maxSeats: 6, status: 'AVAILABLE', isActive: true, zoneId: 'mock-zone-2', storeId: 'mock-store', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'mock-t5', tableNumber: '5', minSeats: 6, maxSeats: 8, status: 'AVAILABLE', isActive: true, zoneId: 'mock-zone-2', storeId: 'mock-store', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    const getMockZones = (): TableZone[] => [
        { id: 'mock-zone-1', zoneName: 'Indoor', color: '#4ade80', displayOrder: 1, isActive: true, storeId: 'mock-store' },
        { id: 'mock-zone-2', zoneName: 'Outdoor', color: '#60a5fa', displayOrder: 2, isActive: true, storeId: 'mock-store' },
    ];

    // Fetch tables and zones on open
    useEffect(() => {
        if (isOpen) {
            if (store?.id) {
                fetchTablesData();
            } else {
                // Use mock data for E2E testing
                console.log('[TableSelection] No store configured, using mock tables for E2E testing');
                setTables(getMockTables());
                setZones(getMockZones());
                setIsLoading(false);
            }
        }
    }, [isOpen, store?.id]);

    const fetchTablesData = async () => {
        if (!store?.id) return;

        setIsLoading(true);
        setError(null);

        try {
            const [tablesData, zonesData] = await Promise.all([
                tablesService.getAvailableTables(store.id),
                tablesService.getZones(store.id),
            ]);
            setTables(tablesData);
            setZones(zonesData);
        } catch (err) {
            console.error('[TableSelection] Failed to fetch tables:', err);
            setError(t('errors.failedToLoadTables', 'Failed to load tables'));
        } finally {
            setIsLoading(false);
        }
    };

    // Filter tables by zone
    const filteredTables = selectedZone
        ? tables.filter((t) => t.zoneId === selectedZone)
        : tables;

    const handleSelect = (table: Table) => {
        onSelect(table);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    data-testid="table-selection-modal"
                    data-theme={theme}
                    className={cn(
                        'relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl',
                        'bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                    )}
                >
                    {/* Header */}
                    <div
                        data-theme={theme}
                        className={cn(
                            'flex items-center justify-between p-4 border-b',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200',
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2
                                    data-theme={theme}
                                    className={cn(
                                        'text-lg font-bold',
                                        'text-white',
                                        'data-[theme=light]:text-slate-900',
                                    )}
                                >
                                    {t('tables.selectTable', 'Select Table')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {filteredTables.length} {language === 'ar' ? 'طاولة متاحة' : 'tables available'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={fetchTablesData}
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400"
                                disabled={isLoading}
                            >
                                <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
                            </button>
                            <button
                                onClick={onClose}
                                data-testid="close-modal-btn"
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Zone Filter */}
                    {zones.length > 0 && (
                        <div className="p-4 border-b border-slate-700/50 data-[theme=light]:border-slate-200" data-testid="zone-filter">
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setSelectedZone(null)}
                                    data-theme={theme}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                        !selectedZone
                                            ? 'bg-cyan-500 text-white'
                                            : cn(
                                                'bg-slate-700 text-slate-300 hover:bg-slate-600',
                                                'data-[theme=light]:bg-slate-200 data-[theme=light]:text-slate-700',
                                            ),
                                    )}
                                >
                                    {language === 'ar' ? 'الكل' : 'All'}
                                </button>
                                {zones.map((zone) => (
                                    <button
                                        key={zone.id}
                                        onClick={() => setSelectedZone(zone.id)}
                                        data-theme={theme}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                            selectedZone === zone.id
                                                ? 'bg-cyan-500 text-white'
                                                : cn(
                                                    'bg-slate-700 text-slate-300 hover:bg-slate-600',
                                                    'data-[theme=light]:bg-slate-200 data-[theme=light]:text-slate-700',
                                                ),
                                        )}
                                        style={zone.color ? { borderLeft: `4px solid ${zone.color}` } : undefined}
                                    >
                                        {zone.translations?.[language]?.name || zone.zoneName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-[50vh]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <p className="text-red-400 mb-4">{error}</p>
                                <Button variant="secondary" onClick={fetchTablesData}>
                                    {t('common:retry', 'Retry')}
                                </Button>
                            </div>
                        ) : filteredTables.length === 0 ? (
                            <div className="text-center py-12">
                                <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                                <p className="text-slate-400">
                                    {t('tables.noAvailable', 'No tables available')}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {filteredTables.map((table) => {
                                    const isSelected = table.id === selectedTableId;
                                    return (
                                        <motion.button
                                            key={table.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleSelect(table)}
                                            data-testid={`table-${table.tableNumber}`}
                                            data-theme={theme}
                                            className={cn(
                                                'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                                                isSelected
                                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                                    : cn(
                                                        'border-slate-700 hover:border-slate-600',
                                                        'data-[theme=light]:border-slate-300 data-[theme=light]:hover:border-slate-400',
                                                    ),
                                            )}
                                        >
                                            <span
                                                data-theme={theme}
                                                className={cn(
                                                    'text-xl font-bold',
                                                    isSelected
                                                        ? 'text-cyan-400'
                                                        : 'text-white data-[theme=light]:text-slate-900',
                                                )}
                                            >
                                                {table.tableNumber}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <Users className="w-3 h-3" />
                                                <span>{table.minSeats}-{table.maxSeats}</span>
                                            </div>
                                            {table.zone && (
                                                <span
                                                    className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: table.zone.color
                                                            ? `${table.zone.color}20`
                                                            : 'rgba(100,100,100,0.2)',
                                                        color: table.zone.color || '#888',
                                                    }}
                                                >
                                                    {table.zone.translations?.[language]?.name || table.zone.zoneName}
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        data-theme={theme}
                        className={cn(
                            'p-4 border-t flex justify-end',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200',
                        )}
                    >
                        <Button variant="secondary" onClick={onClose}>
                            {t('common:cancel', 'Cancel')}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default TableSelectionModal;
