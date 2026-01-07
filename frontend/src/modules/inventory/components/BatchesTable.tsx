/**
 * BatchesTable Component
 *
 * Displays inventory batches with expiry tracking and quality status management
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Package,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Filter,
    ChevronDown,
    Edit,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';
import type { InventoryBatch } from '@/services/inventory.service';

// =============================================================================
// TYPES
// =============================================================================

type QualityStatus = 'GOOD' | 'DAMAGED' | 'EXPIRED' | 'QUARANTINE' | 'RETURNED';

interface BatchesTableProps {
    batches: InventoryBatch[];
    loading?: boolean;
    onRefresh?: () => void;
    onEditBatch?: (batch: InventoryBatch) => void;
}

interface ColumnConfig {
    key: string;
    label: string;
    labelAr?: string;
    sortable: boolean;
    render?: (batch: InventoryBatch) => React.ReactNode;
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const QUALITY_STATUS: Record<
    QualityStatus,
    { label: string; labelAr: string; color: string; bgColor: string; icon: typeof CheckCircle }
> = {
    GOOD: {
        label: 'Good',
        labelAr: 'جيد',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20 border-green-500/30',
        icon: CheckCircle,
    },
    DAMAGED: {
        label: 'Damaged',
        labelAr: 'تالف',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20 border-orange-500/30',
        icon: AlertTriangle,
    },
    EXPIRED: {
        label: 'Expired',
        labelAr: 'منتهي الصلاحية',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20 border-red-500/30',
        icon: XCircle,
    },
    QUARANTINE: {
        label: 'Quarantine',
        labelAr: 'حجر صحي',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500/30',
        icon: AlertTriangle,
    },
    RETURNED: {
        label: 'Returned',
        labelAr: 'مسترجع',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20 border-purple-500/30',
        icon: Package,
    },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function BatchesTable({ batches, loading, onRefresh, onEditBatch }: BatchesTableProps) {
    const { language } = useSettingsStore();
    const [sortColumn, setSortColumn] = useState<string>('receivedDate');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filters, setFilters] = useState<{
        qualityStatus?: QualityStatus;
        search: string;
    }>({
        qualityStatus: undefined,
        search: '',
    });

    // Filter and sort batches
    const filteredBatches = useMemo(() => {
        let filtered = [...batches];

        // Quality status filter
        if (filters.qualityStatus) {
            filtered = filtered.filter((b) => b.qualityStatus === filters.qualityStatus);
        }

        // Search filter
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (b) =>
                    b.productName?.toLowerCase().includes(search) ||
                    b.productSku?.toLowerCase().includes(search) ||
                    b.batchNumber?.toLowerCase().includes(search)
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
                    aVal = parseFloat(a.qtyRemaining);
                    bVal = parseFloat(b.qtyRemaining);
                    break;
                case 'cost':
                    aVal = parseFloat(a.costPerUnit);
                    bVal = parseFloat(b.costPerUnit);
                    break;
                case 'receivedDate':
                    aVal = new Date(a.receivedDate).getTime();
                    bVal = new Date(b.receivedDate).getTime();
                    break;
                case 'expiryDate':
                    aVal = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
                    bVal = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [batches, filters, sortColumn, sortDirection]);

    // Handle sort
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Check expiry status
    const getExpiryStatus = (expiryDate?: string) => {
        if (!expiryDate) return null;

        const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        if (days < 0) return 'expired';
        if (days <= 7) return 'critical';
        if (days <= 30) return 'warning';
        return 'ok';
    };

    // Calculate expiry status for batch
    const getBatchExpiryClass = (batch: InventoryBatch) => {
        if (batch.qualityStatus === 'EXPIRED') return 'border-red-500/50';

        const expiryStatus = getExpiryStatus(batch.expiryDate);
        switch (expiryStatus) {
            case 'expired':
            case 'critical':
                return 'border-red-500/50';
            case 'warning':
                return 'border-yellow-500/50';
            default:
                return 'border-slate-700/50';
        }
    };

    const columns: ColumnConfig[] = [
        {
            key: 'productName',
            label: 'Product',
            labelAr: 'المنتج',
            sortable: true,
            render: (batch) => (
                <div>
                    <div className="font-medium text-white">{batch.productName}</div>
                    <div className="text-xs text-slate-400">{batch.productSku}</div>
                </div>
            ),
        },
        {
            key: 'batchNumber',
            label: 'Batch #',
            labelAr: 'رقم الدفعة',
            sortable: false,
            render: (batch) => (
                <span className="font-mono text-sm text-slate-300">{batch.batchNumber || '-'}</span>
            ),
        },
        {
            key: 'quantity',
            label: 'Quantity',
            labelAr: 'الكمية',
            sortable: true,
            render: (batch) => (
                <span className="font-bold text-white">{parseFloat(batch.qtyRemaining).toLocaleString()}</span>
            ),
        },
        {
            key: 'cost',
            label: 'Cost',
            labelAr: 'التكلفة',
            sortable: true,
            render: (batch) => (
                <span className="text-slate-300">{parseFloat(batch.costPerUnit).toFixed(2)} SAR</span>
            ),
        },
        {
            key: 'receivedDate',
            label: 'Received',
            labelAr: 'تاريخ الاستلام',
            sortable: true,
            render: (batch) => (
                <span className="text-slate-300">{new Date(batch.receivedDate).toLocaleDateString()}</span>
            ),
        },
        {
            key: 'expiryDate',
            label: 'Expiry',
            labelAr: 'تاريخ الانتهاء',
            sortable: true,
            render: (batch) => {
                const status = getExpiryStatus(batch.expiryDate);
                return (
                    <div className="flex items-center gap-2">
                        <Calendar className={cn(
                            'w-4 h-4',
                            status === 'expired' || status === 'critical' ? 'text-red-400' :
                            status === 'warning' ? 'text-yellow-400' :
                            'text-green-400'
                        )} />
                        <span className={cn(
                            'text-sm',
                            status === 'expired' || status === 'critical' ? 'text-red-400' :
                            status === 'warning' ? 'text-yellow-400' :
                            'text-slate-300'
                        )}>
                            {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '-'}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'qualityStatus',
            label: 'Quality',
            labelAr: 'الجودة',
            sortable: false,
            render: (batch) => {
                const status = QUALITY_STATUS[batch.qualityStatus as QualityStatus] || QUALITY_STATUS.GOOD;
                const Icon = status.icon;
                return (
                    <div
                        className={cn(
                            'flex items-center gap-2 px-2 py-1 rounded-lg border-2',
                            status.bgColor,
                            'border-current',
                        )}
                    >
                        <Icon className={cn('w-4 h-4', status.color)} />
                        <span className={cn('text-xs font-bold', status.color)}>
                            {language === 'ar' ? status.labelAr : status.label}
                        </span>
                    </div>
                );
            },
        },
        {
            key: 'actions',
            label: 'Actions',
            labelAr: 'الإجراءات',
            sortable: false,
            render: (batch) => (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEditBatch?.(batch)}
                    className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                    <Edit className="w-4 h-4 text-slate-400" />
                </motion.button>
            ),
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
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>

                {/* Quality Status Filter */}
                <select
                    value={filters.qualityStatus || ''}
                    onChange={(e) => setFilters({ ...filters, qualityStatus: e.target.value as QualityStatus | undefined })}
                    className={cn(
                        'px-4 py-2 rounded-lg border',
                        'bg-slate-800 border-slate-700 text-white',
                        'focus:border-cyan-500 focus:outline-none',
                    )}
                >
                    <option value="">{language === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
                    {Object.entries(QUALITY_STATUS).map(([key, status]) => (
                        <option key={key} value={key}>
                            {language === 'ar' ? status.labelAr : status.label}
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
                        ) : filteredBatches.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>{language === 'ar' ? 'لا توجد دفعات' : 'No batches found'}</p>
                                </td>
                            </tr>
                        ) : (
                            filteredBatches.map((batch) => (
                                <tr
                                    key={batch.id}
                                    className={cn(
                                        'border-b border-slate-700/50 transition-colors hover:bg-slate-800/30',
                                        getBatchExpiryClass(batch),
                                    )}
                                >
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-4 py-3">
                                            {column.render ? column.render(batch) : null}
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
                    {filteredBatches.length} {language === 'ar' ? 'دفعة' : 'batches'}
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

export default BatchesTable;
