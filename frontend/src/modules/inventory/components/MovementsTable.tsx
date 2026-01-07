/**
 * MovementsTable Component
 *
 * Displays stock movement history with filtering and drill-down
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowDown,
    ArrowUp,
    ArrowRight,
    RotateCcw,
    FileText,
    Filter,
    ChevronDown,
    Search,
    Package,
    Warehouse,
    Calendar,
    User,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';
import type { StockMove } from '@/services/inventory.service';

// =============================================================================
// TYPES
// =============================================================================

type MoveType = 'IN' | 'OUT' | 'ADJ' | 'TRANSFER' | 'RETURN';

interface MovementsTableProps {
    movements: StockMove[];
    loading?: boolean;
    onRefresh?: () => void;
    onMovementClick?: (movement: StockMove) => void;
}

interface ColumnConfig {
    key: string;
    label: string;
    labelAr?: string;
    sortable: boolean;
    render?: (move: StockMove) => React.ReactNode;
}

// =============================================================================
// MOVE TYPE CONFIG
// =============================================================================

const MOVE_TYPE_CONFIG: Record<
    MoveType,
    { label: string; labelAr: string; icon: typeof ArrowDown; color: string; bgColor: string }
> = {
    IN: {
        label: 'Stock In',
        labelAr: 'إدخال',
        icon: ArrowDown,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20 border-emerald-500/30',
    },
    OUT: {
        label: 'Stock Out',
        labelAr: 'إخراج',
        icon: ArrowUp,
        color: 'text-red-400',
        bgColor: 'bg-red-500/20 border-red-500/30',
    },
    ADJ: {
        label: 'Adjustment',
        labelAr: 'تعديل',
        icon: RotateCcw,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20 border-purple-500/30',
    },
    TRANSFER: {
        label: 'Transfer',
        labelAr: 'نقل',
        icon: ArrowRight,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20 border-blue-500/30',
    },
    RETURN: {
        label: 'Return',
        labelAr: 'مرتجع',
        icon: RotateCcw,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20 border-orange-500/30',
    },
};

const REFERENCE_TYPE_LABELS: Record<string, { label: string; labelAr: string }> = {
    SALE: { label: 'Sale', labelAr: 'بيع' },
    PO: { label: 'Purchase', labelAr: 'شراء' },
    MANUAL: { label: 'Manual', labelAr: 'يدوي' },
    WASTE: { label: 'Waste', labelAr: 'هالك' },
    RECIPE: { label: 'Recipe', labelAr: 'وصفة' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function MovementsTable({ movements, loading, onRefresh, onMovementClick }: MovementsTableProps) {
    const { language } = useSettingsStore();
    const [sortColumn, setSortColumn] = useState<string>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filters, setFilters] = useState<{
        moveType?: MoveType;
        search: string;
    }>({
        moveType: undefined,
        search: '',
    });

    // Filter and sort movements
    const filteredMovements = useMemo(() => {
        let filtered = [...movements];

        // Move type filter
        if (filters.moveType) {
            filtered = filtered.filter((m) => m.moveType === filters.moveType);
        }

        // Search filter
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (m) =>
                    m.productName?.toLowerCase().includes(search) ||
                    m.warehouseName?.toLowerCase().includes(search) ||
                    m.referenceId?.toLowerCase().includes(search)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortColumn) {
                case 'productName':
                    aVal = a.productName || '';
                    bVal = b.productName || '';
                    break;
                case 'quantity':
                    aVal = parseFloat(a.quantity);
                    bVal = parseFloat(b.quantity);
                    break;
                case 'warehouse':
                    aVal = a.warehouseName || '';
                    bVal = b.warehouseName || '';
                    break;
                case 'moveType':
                    aVal = a.moveType;
                    bVal = b.moveType;
                    break;
                case 'createdAt':
                    aVal = new Date(a.createdAt).getTime();
                    bVal = new Date(b.createdAt).getTime();
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [movements, filters, sortColumn, sortDirection]);

    // Handle sort
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const columns: ColumnConfig[] = [
        {
            key: 'createdAt',
            label: 'Date',
            labelAr: 'التاريخ',
            sortable: true,
            render: (move) => (
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">
                        {new Date(move.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-500">
                        {new Date(move.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            ),
        },
        {
            key: 'productName',
            label: 'Product',
            labelAr: 'المنتج',
            sortable: true,
            render: (move) => (
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-white">{move.productName || '-'}</span>
                </div>
            ),
        },
        {
            key: 'moveType',
            label: 'Type',
            labelAr: 'النوع',
            sortable: true,
            render: (move) => {
                const config = MOVE_TYPE_CONFIG[move.moveType as MoveType] || MOVE_TYPE_CONFIG.ADJ;
                const Icon = config.icon;
                return (
                    <div
                        className={cn(
                            'flex items-center gap-2 px-2 py-1 rounded-lg border-2',
                            config.bgColor,
                            'border-current',
                        )}
                    >
                        <Icon className={cn('w-4 h-4', config.color)} />
                        <span className={cn('text-xs font-bold', config.color)}>
                            {language === 'ar' ? config.labelAr : config.label}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'quantity',
            label: 'Quantity',
            labelAr: 'الكمية',
            sortable: true,
            render: (move) => {
                const qty = parseFloat(move.quantity);
                const isPositive = move.moveType === 'IN' || move.moveType === 'TRANSFER';
                return (
                    <span className={cn(
                        'font-mono font-bold',
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                    )}>
                        {isPositive ? '+' : '-'}{Math.abs(qty).toLocaleString()}
                    </span>
                );
            },
        },
        {
            key: 'warehouse',
            label: 'Warehouse',
            labelAr: 'المستودع',
            sortable: true,
            render: (move) => (
                <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">{move.warehouseName || '-'}</span>
                </div>
            ),
        },
        {
            key: 'reference',
            label: 'Reference',
            labelAr: 'المرجع',
            sortable: false,
            render: (move) => {
                const refLabel = REFERENCE_TYPE_LABELS[move.referenceType];
                return (
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <div>
                            <div className="text-xs text-slate-500">{refLabel ? (language === 'ar' ? refLabel.labelAr : refLabel.label) : move.referenceType}</div>
                            <div className="text-sm font-mono text-slate-300">{move.referenceId || '-'}</div>
                        </div>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className={cn(
                            'w-full pl-10 pr-4 py-2 rounded-lg border',
                            'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500',
                            'focus:border-cyan-500 focus:outline-none',
                        )}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>

                {/* Move Type Filter */}
                <select
                    value={filters.moveType || ''}
                    onChange={(e) => setFilters({ ...filters, moveType: e.target.value as MoveType | undefined })}
                    className={cn(
                        'px-4 py-2 rounded-lg border',
                        'bg-slate-800 border-slate-700 text-white',
                        'focus:border-cyan-500 focus:outline-none',
                    )}
                >
                    <option value="">{language === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
                    {Object.entries(MOVE_TYPE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                            {language === 'ar' ? config.labelAr : config.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50 bg-slate-800/50">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                    className={cn(
                                        'px-4 py-3 text-left text-sm font-medium text-slate-400',
                                        column.sortable && 'cursor-pointer hover:text-white transition-colors',
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{language === 'ar' ? column.labelAr : column.label}</span>
                                        {column.sortable && (
                                            <ChevronDown
                                                className={cn(
                                                    'w-4 h-4 transition-transform',
                                                    sortColumn === column.key && (sortDirection === 'asc' ? 'rotate-180' : ''),
                                                )}
                                            />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredMovements.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>{language === 'ar' ? 'لا توجد حركات' : 'No movements found'}</p>
                                </td>
                            </tr>
                        ) : (
                            filteredMovements.map((move) => (
                                <tr
                                    key={move.id}
                                    onClick={() => onMovementClick?.(move)}
                                    className={cn(
                                        'border-b border-slate-700/50 transition-colors hover:bg-slate-800/30 cursor-pointer',
                                    )}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-4 py-3">
                                            {column.render ? column.render(move) : null}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-slate-400">
                <span>
                    {filteredMovements.length} {language === 'ar' ? 'حركة' : 'movements'}
                </span>
                <button
                    onClick={onRefresh}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                    {language === 'ar' ? 'تحديث' : 'Refresh'}
                </button>
            </div>
        </div>
    );
}

export default MovementsTable;
