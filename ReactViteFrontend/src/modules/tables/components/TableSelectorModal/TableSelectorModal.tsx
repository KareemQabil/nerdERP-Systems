import { useState } from 'react';
import { X, Users, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTableStore } from '@/modules/tables/store/tableStore';
import { useCartStore } from '@/modules/sales/store/cartStore';
import type { Table } from '@/modules/tables/types/table.types';

export interface TableSelectorModalProps {
    onClose: () => void;
}

/**
 * TableSelectorModal Component
 * Glassmorphic modal for selecting dining tables
 * 
 * Features:
 * - Zone tabs (Indoor, Terrace, etc.)
 * - Table grid with real-time status
 * - Visual status indicators (Available, Occupied, Reserved)
 * - Links to cartStore on selection
 * - Max height constraint (max-h-[90vh])
 */
export function TableSelectorModal({ onClose }: TableSelectorModalProps) {
    const { zones, activeZoneId, setActiveZone, getTableById } = useTableStore();
    const { setTable, setOrderType } = useCartStore();
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

    const activeZone = zones.find(z => z.id === activeZoneId);

    const handleTableSelect = (table: Table) => {
        if (table.status === 'occupied') {
            alert(`Table ${table.name} is currently occupied`);
            return;
        }

        setSelectedTableId(table.id);
    };

    const handleConfirm = () => {
        if (!selectedTableId) {
            alert('Please select a table');
            return;
        }

        const table = getTableById(selectedTableId);
        if (table) {
            setTable(selectedTableId);
            setOrderType('TAKEAWAY'); // Will be changed to DINE_IN in future
            console.log('✅ Table selected:', table.name);
            onClose();
        }
    };

    const getStatusColor = (status: Table['status']) => {
        switch (status) {
            case 'available':
                return 'border-emerald-400/50 bg-emerald-500/20 text-emerald-400';
            case 'occupied':
                return 'border-red-400/50 bg-red-500/20 text-red-400';
            case 'reserved':
                return 'border-amber-400/50 bg-amber-500/20 text-amber-400';
            default:
                return 'border-gray-400/50 bg-gray-500/20 text-gray-400';
        }
    };

    const getStatusIcon = (status: Table['status']) => {
        switch (status) {
            case 'available':
                return '✓';
            case 'occupied':
                return '◉';
            case 'reserved':
                return '◔';
            default:
                return '?';
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    onClick={onClose}
                />

                {/* Modal Container - MAX HEIGHT */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white font-['Almarai']">
                                        اختر الطاولة
                                    </h2>
                                    <p className="text-sm text-gray-400">Select a dining table</p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"
                            >
                                <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </button>
                        </div>

                        {/* Zone Tabs */}
                        <div className="flex gap-2 mt-4">
                            {zones.map((zone) => (
                                <button
                                    key={zone.id}
                                    onClick={() => setActiveZone(zone.id)}
                                    className={cn(
                                        'px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300',
                                        activeZoneId === zone.id
                                            ? 'bg-cyan-500/20 border-2 border-cyan-400/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                                            : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                                    )}
                                >
                                    {zone.nameAr}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Body - SCROLLABLE */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {/* Table Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            {activeZone?.tables.map((table) => (
                                <motion.button
                                    key={table.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleTableSelect(table)}
                                    disabled={table.status === 'occupied'}
                                    className={cn(
                                        'relative p-4 rounded-2xl border-2 transition-all duration-300',
                                        getStatusColor(table.status),
                                        selectedTableId === table.id && 'ring-4 ring-cyan-400/50',
                                        table.status === 'occupied' && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    {/* Status Icon */}
                                    <div className="absolute top-2 right-2 text-xl">
                                        {getStatusIcon(table.status)}
                                    </div>

                                    {/* Table Info */}
                                    <div className="text-center mt-2">
                                        <div className="text-2xl font-bold mb-1">
                                            {table.name}
                                        </div>
                                        <div className="flex items-center justify-center gap-1 text-sm opacity-80">
                                            <Users className="w-4 h-4" />
                                            <span>{table.capacity}</span>
                                        </div>
                                        <div className="text-xs mt-2 uppercase tracking-wider">
                                            {table.status}
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-400/50" />
                                <span className="text-gray-400">Available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-red-500/20 border border-red-400/50" />
                                <span className="text-gray-400">Occupied</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-400/50" />
                                <span className="text-gray-400">Reserved</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gradient-to-t from-black/40 to-transparent border-t border-white/10 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold font-['Almarai'] transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedTableId}
                            className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-['Almarai'] transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <MapPin className="w-5 h-5" />
                            <span>تأكيد الطاولة</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
