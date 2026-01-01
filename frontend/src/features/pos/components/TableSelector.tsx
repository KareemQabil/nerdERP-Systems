import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users, Clock, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';
import { Input, Button } from '@/components/ui';

export interface TableInfo {
    id: string;
    number: string;
    capacity: number;
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
    currentOrderId?: string;
    guestCount?: number;
    occupiedSince?: Date;
    section?: string;
}

interface TableSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (table: TableInfo) => void;
    tables: TableInfo[];
    selectedTableId?: string;
}

const STATUS_CONFIG = {
    AVAILABLE: {
        label: 'Available',
        labelAr: 'متاح',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        icon: Check,
    },
    OCCUPIED: {
        label: 'Occupied',
        labelAr: 'مشغول',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: Users,
    },
    RESERVED: {
        label: 'Reserved',
        labelAr: 'محجوز',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        icon: Clock,
    },
    CLEANING: {
        label: 'Cleaning',
        labelAr: 'تنظيف',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/20',
        borderColor: 'border-slate-500/30',
        icon: AlertCircle,
    },
};

/**
 * Table Selector Modal
 * Grid-based table selection for dine-in orders
 */
export function TableSelector({
    isOpen,
    onClose,
    onSelect,
    tables,
    selectedTableId,
}: TableSelectorProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useAppSelector(selectSettings);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<TableInfo['status'] | 'ALL'>('ALL');

    // Filter tables
    const filteredTables = useMemo(() => {
        return tables.filter((table) => {
            const matchesSearch =
                searchQuery === '' ||
                table.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                table.section?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'ALL' || table.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [tables, searchQuery, filterStatus]);

    // Group by section
    const groupedTables = useMemo(() => {
        const groups: Record<string, TableInfo[]> = {};
        filteredTables.forEach((table) => {
            const section = table.section || (language === 'ar' ? 'عام' : 'General');
            if (!groups[section]) groups[section] = [];
            groups[section].push(table);
        });
        return groups;
    }, [filteredTables, language]);

    // Calculate time occupied
    const getOccupiedTime = (since?: Date) => {
        if (!since) return '';
        const mins = Math.floor((Date.now() - new Date(since).getTime()) / 60000);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        return `${hrs}h ${mins % 60}m`;
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
                    data-theme={theme}
                    className={cn(
                        'relative w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col',
                        'bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                        'data-[theme=luxury]:bg-slate-950/95 data-[theme=luxury]:border-amber-800/30',
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
                        <h2
                            data-theme={theme}
                            className={cn(
                                'text-lg font-bold',
                                'text-white',
                                'data-[theme=light]:text-slate-900',
                            )}
                        >
                            {t('table.selectTitle', 'Select Table')}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="p-4 space-y-3">
                        <Input
                            placeholder={t('table.searchPlaceholder', 'Search tables...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                        />

                        {/* Status Filter Pills */}
                        <div className="flex flex-wrap gap-2">
                            {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'] as const).map((status) => {
                                const isActive = filterStatus === status;
                                const config = status === 'ALL' ? null : STATUS_CONFIG[status];
                                const label =
                                    status === 'ALL'
                                        ? language === 'ar'
                                            ? 'الكل'
                                            : 'All'
                                        : language === 'ar'
                                            ? config!.labelAr
                                            : config!.label;

                                return (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        data-theme={theme}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                            isActive
                                                ? status === 'ALL'
                                                    ? 'bg-cyan-500 text-white data-[theme=luxury]:bg-amber-500'
                                                    : cn(config!.bgColor, config!.color)
                                                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 data-[theme=light]:bg-slate-100 data-[theme=light]:text-slate-600',
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tables Grid */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {Object.entries(groupedTables).map(([section, sectionTables]) => (
                            <div key={section}>
                                <h3
                                    data-theme={theme}
                                    className={cn(
                                        'text-sm font-semibold mb-3',
                                        'text-slate-400',
                                        'data-[theme=light]:text-slate-600',
                                    )}
                                >
                                    {section}
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {sectionTables.map((table) => {
                                        const config = STATUS_CONFIG[table.status];
                                        const StatusIcon = config.icon;
                                        const isSelected = table.id === selectedTableId;
                                        const isAvailable = table.status === 'AVAILABLE';

                                        return (
                                            <motion.button
                                                key={table.id}
                                                whileHover={{ scale: isAvailable ? 1.05 : 1 }}
                                                whileTap={{ scale: isAvailable ? 0.95 : 1 }}
                                                onClick={() => isAvailable && onSelect(table)}
                                                disabled={!isAvailable}
                                                data-theme={theme}
                                                className={cn(
                                                    'relative p-3 rounded-xl border-2 transition-all text-center',
                                                    isSelected
                                                        ? 'border-cyan-500 bg-cyan-500/20 data-[theme=luxury]:border-amber-500 data-[theme=luxury]:bg-amber-500/20'
                                                        : cn(
                                                            config.borderColor,
                                                            config.bgColor,
                                                            'hover:border-4',
                                                        ),
                                                    !isAvailable && 'opacity-60 cursor-not-allowed',
                                                )}
                                            >
                                                {/* Table Number */}
                                                <p
                                                    data-theme={theme}
                                                    className={cn(
                                                        'text-2xl font-bold mb-1',
                                                        isSelected
                                                            ? 'text-cyan-400 data-[theme=luxury]:text-amber-400'
                                                            : cn(
                                                                'text-white',
                                                                'data-[theme=light]:text-slate-900',
                                                            ),
                                                    )}
                                                >
                                                    {table.number}
                                                </p>

                                                {/* Capacity */}
                                                <div className="flex items-center justify-center gap-1 text-xs">
                                                    <Users className={cn('w-3 h-3', config.color)} />
                                                    <span className={config.color}>
                                                        {table.guestCount || 0}/{table.capacity}
                                                    </span>
                                                </div>

                                                {/* Status Badge */}
                                                <div
                                                    className={cn(
                                                        'mt-2 flex items-center justify-center gap-1 text-xs',
                                                        config.color,
                                                    )}
                                                >
                                                    <StatusIcon className="w-3 h-3" />
                                                    <span>
                                                        {language === 'ar' ? config.labelAr : config.label}
                                                    </span>
                                                </div>

                                                {/* Occupied Time */}
                                                {table.status === 'OCCUPIED' && table.occupiedSince && (
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {getOccupiedTime(table.occupiedSince)}
                                                    </p>
                                                )}

                                                {/* Selected Indicator */}
                                                {isSelected && (
                                                    <div className="absolute top-1 end-1">
                                                        <Check className="w-4 h-4 text-cyan-400 data-[theme=luxury]:text-amber-400" />
                                                    </div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {filteredTables.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-slate-500">
                                    {t('table.noTables', 'No tables found')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        data-theme={theme}
                        className={cn(
                            'p-4 border-t flex justify-end gap-2',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200',
                        )}
                    >
                        <Button variant="secondary" onClick={onClose}>
                            {t('cancel', 'Cancel')}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default TableSelector;
