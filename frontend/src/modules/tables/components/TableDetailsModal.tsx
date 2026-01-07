/**
 * TableDetailsModal Component
 *
 * Modal for viewing table details, current order, and actions
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Users,
    Clock,
    CheckCircle,
    MapPin,
    Utensils,
    RotateCcw,
    Lock,
    Unlock,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { useTablesStore } from '@/stores/tables.store';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Table, TableStatus } from '@/services/tables.service';

// =============================================================================
// TYPES
// =============================================================================

interface TableDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    table: Table | null;
    onOccupy?: (tableId: string, orderId: string) => void;
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const STATUS_CONFIG: Record<
    TableStatus,
    { label: string; labelAr: string; color: string; bgColor: string; icon: any }
> = {
    AVAILABLE: {
        label: 'Available',
        labelAr: 'متاح',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20 border-emerald-500/30',
        icon: CheckCircle,
    },
    OCCUPIED: {
        label: 'Occupied',
        labelAr: 'مشغول',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20 border-red-500/30',
        icon: Users,
    },
    RESERVED: {
        label: 'Reserved',
        labelAr: 'محجوز',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500/30',
        icon: Clock,
    },
    CLEANING: {
        label: 'Cleaning',
        labelAr: 'تنظيف',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20 border-blue-500/30',
        icon: RotateCcw,
    },
    BLOCKED: {
        label: 'Blocked',
        labelAr: 'محجور',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/20 border-slate-500/30',
        icon: Lock,
    },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function TableDetailsModal({
    isOpen,
    onClose,
    table,
}: TableDetailsModalProps) {
    const { language } = useSettingsStore();
    const { updateTableStatus, freeTable, markTableClean, blockTable, setTableCleaning } = useTablesStore();
    const [isProcessing, setIsProcessing] = useState(false);

    const config = table ? STATUS_CONFIG[table.status] : STATUS_CONFIG.AVAILABLE;
    const Icon = config.icon;

    if (!isOpen || !table) return null;

    const handleStatusChange = async (newStatus: TableStatus) => {
        setIsProcessing(true);
        try {
            switch (newStatus) {
                case 'AVAILABLE':
                    // Use markTableClean for CLEANING->AVAILABLE, freeTable otherwise
                    if (table.status === 'CLEANING') {
                        await markTableClean(table.id);
                    } else {
                        await freeTable(table.id);
                    }
                    break;
                case 'CLEANING':
                    await setTableCleaning(table.id);
                    break;
                case 'BLOCKED':
                    await blockTable(table.id);
                    break;
                case 'OCCUPIED':
                    if (table.currentOrderId) {
                        await updateTableStatus(table.id, newStatus, table.currentOrderId);
                    } else {
                        await updateTableStatus(table.id, newStatus);
                    }
                    break;
                default:
                    await updateTableStatus(table.id, newStatus);
            }
            onClose();
        } catch (error) {
            console.error('[TableDetailsModal] Failed to update table status:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const availableActions: TableStatus[] = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'BLOCKED'];

    // Can only free occupied tables
    if (table.status === 'OCCUPIED') {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-slate-900 border border-slate-700/50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    'w-12 h-12 rounded-xl flex items-center justify-center',
                                    config.bgColor,
                                )}>
                                    <Icon className={cn('w-6 h-6', config.color)} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Table {table.tableNumber}
                                    </h2>
                                    <p className={cn('text-sm', config.color)}>
                                        {language === 'ar' ? config.labelAr : config.label}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* Table Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                        <Users className="w-3 h-3" />
                                        <span>{language === 'ar' ? 'السعة' : 'Capacity'}</span>
                                    </div>
                                    <p className="text-white font-medium">
                                        {table.minSeats} - {table.maxSeats} {language === 'ar' ? 'أشخاص' : 'guests'}
                                    </p>
                                </div>

                                {table.zone && (
                                    <div className="p-3 rounded-lg bg-slate-800/50">
                                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{language === 'ar' ? 'المنطقة' : 'Zone'}</span>
                                        </div>
                                        <p
                                            className="text-sm font-medium"
                                            style={{ color: table.zone.color || '#fff' }}
                                        >
                                            {table.zone.zoneName}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Current Order */}
                            {table.currentOrderId && (
                                <div className="p-4 rounded-lg bg-orange-500/20 border border-orange-500/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Utensils className="w-5 h-5 text-orange-400" />
                                            <div>
                                                <p className="text-sm text-orange-300">
                                                    {language === 'ar' ? 'الطلب الحالي' : 'Current Order'}
                                                </p>
                                                <p className="text-xs text-slate-400 font-mono mt-1">
                                                    {table.currentOrderId}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - Free Table Action */}
                        <div className="p-4 border-t border-slate-700/50">
                            <Button
                                variant="primary"
                                onClick={() => handleStatusChange('AVAILABLE')}
                                disabled={isProcessing}
                                className="w-full gap-2 bg-emerald-500 hover:bg-emerald-600"
                            >
                                <Unlock className="w-4 h-4" />
                                {isProcessing
                                    ? (language === 'ar' ? 'جاري المعالجة...' : 'Processing...')
                                    : (language === 'ar' ? 'تحرير الطاولة' : 'Free Table')
                                }
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-slate-900 border border-slate-700/50"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center',
                                config.bgColor,
                            )}>
                                <Icon className={cn('w-6 h-6', config.color)} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Table {table.tableNumber}
                                </h2>
                                <p className={cn('text-sm', config.color)}>
                                    {language === 'ar' ? config.labelAr : config.label}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Table Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-slate-800/50">
                                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                    <Users className="w-3 h-3" />
                                    <span>{language === 'ar' ? 'السعة' : 'Capacity'}</span>
                                </div>
                                <p className="text-white font-medium">
                                    {table.minSeats} - {table.maxSeats} {language === 'ar' ? 'أشخاص' : 'guests'}
                                </p>
                            </div>

                            {table.zone && (
                                <div className="p-3 rounded-lg bg-slate-800/50">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{language === 'ar' ? 'المنطقة' : 'Zone'}</span>
                                    </div>
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: table.zone.color || '#fff' }}
                                    >
                                        {table.zone.zoneName}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Status Change */}
                        <div>
                            <p className="text-sm text-slate-400 mb-2">
                                {language === 'ar' ? 'تغيير الحالة' : 'Change Status'}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {availableActions
                                    .filter((status) => status !== table.status)
                                    .map((status) => {
                                        const actionConfig = STATUS_CONFIG[status];
                                        const ActionIcon = actionConfig.icon;
                                        return (
                                            <motion.button
                                                key={status}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleStatusChange(status)}
                                                disabled={isProcessing}
                                                className={cn(
                                                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                                                    actionConfig.bgColor,
                                                    'border-current',
                                                    'disabled:opacity-50 disabled:cursor-not-allowed',
                                                )}
                                            >
                                                <ActionIcon className={cn('w-6 h-6', actionConfig.color)} />
                                                <span className={cn('text-xs font-bold', actionConfig.color)}>
                                                    {language === 'ar' ? actionConfig.labelAr : actionConfig.label}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-700/50 flex justify-end">
                        <Button variant="secondary" onClick={onClose}>
                            {language === 'ar' ? 'إغلاق' : 'Close'}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default TableDetailsModal;
