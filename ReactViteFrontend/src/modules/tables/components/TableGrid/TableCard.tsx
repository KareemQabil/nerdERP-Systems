import { motion } from 'framer-motion';
import { Users, Clock, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Table, TableStatus } from '../../types/table.types';

export interface TableCardProps {
    table: Table;
    onClick: (table: Table) => void;
}

/**
 * TableCard Component
 * Glassmorphic card for displaying table status
 * 
 * Status Colors:
 * - Green: AVAILABLE
 * - Red: OCCUPIED (with time & order info)
 * - Orange: RESERVED
 */
export function TableCard({ table, onClick }: TableCardProps) {
    const getStatusStyle = (status: TableStatus) => {
        switch (status) {
            case 'AVAILABLE':
                return {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-400/30',
                    text: 'text-emerald-400',
                    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
                    hoverGlow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
                };
            case 'OCCUPIED':
                return {
                    bg: 'bg-red-500/10',
                    border: 'border-red-400/30',
                    text: 'text-red-400',
                    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
                    hoverGlow: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]',
                };
            case 'RESERVED':
                return {
                    bg: 'bg-orange-500/10',
                    border: 'border-orange-400/30',
                    text: 'text-orange-400',
                    glow: 'shadow-[0_0_20px_rgba(251,146,60,0.2)]',
                    hoverGlow: 'hover:shadow-[0_0_30px_rgba(251,146,60,0.3)]',
                };
            default:
                return {
                    bg: 'bg-gray-500/10',
                    border: 'border-gray-400/30',
                    text: 'text-gray-400',
                    glow: '',
                    hoverGlow: '',
                };
        }
    };

    const style = getStatusStyle(table.status);

    // Mock time elapsed for occupied tables
    const getTimeElapsed = () => {
        if (table.status !== 'OCCUPIED') return null;
        // Mock: random time between 15-90 minutes
        const minutes = Math.floor(Math.random() * 75) + 15;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    // Mock order total for occupied tables
    const getOrderTotal = () => {
        if (table.status !== 'OCCUPIED' || !table.activeOrderId) return null;
        // Mock: random total between 50-300 SAR
        const total = (Math.random() * 250 + 50).toFixed(2);
        return `${total} SAR`;
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onClick(table)}
            className={cn(
                'relative w-full aspect-square rounded-2xl p-6',
                'bg-white/5 backdrop-blur-sm border-2',
                'transition-all duration-300',
                'flex flex-col items-center justify-between',
                style.bg,
                style.border,
                style.glow,
                style.hoverGlow
            )}
        >
            {/* Top Section: Table Name */}
            <div className="flex items-center justify-center w-full">
                <h3 className={cn('text-2xl font-bold font-[\'Almarai\']', style.text)}>
                    {table.name}
                </h3>
            </div>

            {/* Middle Section: Icon */}
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center', style.bg, 'border', style.border)}>
                <Utensils className={cn('w-8 h-8', style.text)} />
            </div>

            {/* Bottom Section: Details */}
            <div className="w-full space-y-2">
                {/* Capacity */}
                <div className="flex items-center justify-center gap-2">
                    <Users className={cn('w-4 h-4', style.text)} />
                    <span className={cn('text-sm font-bold', style.text)}>
                        {table.capacity} {table.capacity === 1 ? 'شخص' : 'أشخاص'}
                    </span>
                </div>

                {/* Occupied Info */}
                {table.status === 'OCCUPIED' && (
                    <>
                        {/* Time Elapsed */}
                        <div className="flex items-center justify-center gap-2">
                            <Clock className={cn('w-4 h-4', style.text)} />
                            <span className={cn('text-xs font-mono', style.text)}>
                                {getTimeElapsed()}
                            </span>
                        </div>

                        {/* Order Total */}
                        <div className={cn(
                            'rounded-lg px-3 py-1 text-xs font-bold text-center',
                            'bg-red-500/20 border border-red-400/30'
                        )}>
                            <span className="text-red-400">{getOrderTotal()}</span>
                        </div>
                    </>
                )}

                {/* Reserved Badge */}
                {table.status === 'RESERVED' && (
                    <div className={cn(
                        'rounded-lg px-3 py-1 text-xs font-bold text-center font-[\'Almarai\']',
                        'bg-orange-500/20 border border-orange-400/30'
                    )}>
                        <span className="text-orange-400">محجوز</span>
                    </div>
                )}

                {/* Available Badge */}
                {table.status === 'AVAILABLE' && (
                    <div className={cn(
                        'rounded-lg px-3 py-1 text-xs font-bold text-center font-[\'Almarai\']',
                        'bg-emerald-500/20 border border-emerald-400/30'
                    )}>
                        <span className="text-emerald-400">متاح</span>
                    </div>
                )}
            </div>
        </motion.button>
    );
}
