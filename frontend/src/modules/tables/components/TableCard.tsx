/**
 * TableCard Component
 *
 * Individual table display with status indicator
 */
import { motion } from 'framer-motion';
import { Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';
import type { Table, TableStatus } from '@/services/tables.service';

// =============================================================================
// TYPES
// =============================================================================

interface TableCardProps {
    table: Table;
    isSelected?: boolean;
    onClick?: () => void;
    onDoubleClick?: () => void;
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
        bgColor: 'bg-emerald-500/20 border-emerald-500/40',
        icon: CheckCircle,
    },
    OCCUPIED: {
        label: 'Occupied',
        labelAr: 'مشغول',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20 border-red-500/40',
        icon: Users,
    },
    RESERVED: {
        label: 'Reserved',
        labelAr: 'محجوز',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500/40',
        icon: Clock,
    },
    CLEANING: {
        label: 'Cleaning',
        labelAr: 'تنظيف',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20 border-blue-500/40',
        icon: AlertCircle,
    },
    BLOCKED: {
        label: 'Blocked',
        labelAr: 'محجور',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/20 border-slate-500/40',
        icon: XCircle,
    },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function TableCard({ table, isSelected, onClick, onDoubleClick }: TableCardProps) {
    const { language } = useSettingsStore();
    const config = STATUS_CONFIG[table.status];
    const Icon = config.icon;

    // Calculate table size based on seating capacity
    const getSizeClass = () => {
        if (table.maxSeats <= 2) return 'w-20 h-20';
        if (table.maxSeats <= 4) return 'w-24 h-24';
        if (table.maxSeats <= 6) return 'w-28 h-28';
        return 'w-32 h-32';
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            data-testid={`table-card-${table.tableNumber}`}
            className={cn(
                'relative flex flex-col items-center justify-center rounded-xl border-2 cursor-pointer transition-all',
                getSizeClass(),
                config.bgColor,
                isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : '',
            )}
            style={
                table.floorPosition
                    ? {
                        position: 'absolute',
                        left: `${table.floorPosition.x}px`,
                        top: `${table.floorPosition.y}px`,
                        width: `${table.floorPosition.width}px`,
                        height: `${table.floorPosition.height}px`,
                        transform: table.floorPosition.rotation
                            ? `rotate(${table.floorPosition.rotation}deg)`
                            : undefined,
                    }
                    : undefined
            }
        >
            {/* Table Number */}
            <span className="text-lg font-bold text-white">{table.tableNumber}</span>

            {/* Status Icon */}
            <Icon className={cn('w-4 h-4 mt-1', config.color)} />

            {/* Seats Indicator */}
            <div className="absolute -top-1 -right-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-600">
                <Users className="w-2.5 h-2.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">{table.maxSeats}</span>
            </div>

            {/* Zone Badge */}
            {table.zone && (
                <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                    style={{
                        backgroundColor: table.zone.color || '#64748b',
                        color: 'white',
                    }}
                >
                    {table.zone.zoneName}
                </div>
            )}

            {/* Current Order Badge (for occupied tables) */}
            {table.currentOrderId && (
                <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
            )}
        </motion.div>
    );
}

export default TableCard;
