import { useState } from 'react';
import { LayoutGrid, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTableStore } from '@/modules/tables/store/tableStore';
import { TableCard } from '@/modules/tables/components/TableGrid/TableCard';
import type { Table } from '@/modules/tables/types/table.types';

/**
 * TablesPage Component
 * Restaurant floor plan with zone-based table management
 * 
 * Features:
 * - Zone tabs switcher
 * - Real-time table status
 * - Statistics dashboard
 * - Responsive grid layout
 */
export default function TablesPage() {
    const { zones, activeZoneId, setActiveZone, getTableStats } = useTableStore();
    const stats = getTableStats();
    const activeZone = zones.find((z) => z.id === activeZoneId);

    const handleTableClick = (table: Table) => {
        console.log('Table Clicked:', table);
        console.log('Status:', table.status);
        console.log('Active Order ID:', table.activeOrderId);
        // TODO Phase 11: Wire to POS cart system
    };

    return (
        <div className="h-screen w-screen bg-[#131722] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                    {/* Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                            <LayoutGrid className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white font-['Almarai']">خريطة الطاولات</h1>
                            <p className="text-sm text-cyan-400/80">Floor Plan</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                        {/* Total */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 px-6 py-3">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-cyan-400" />
                                <div>
                                    <p className="text-xs text-gray-400 font-['Almarai']">إجمالي</p>
                                    <p className="text-2xl font-bold text-white font-mono">{stats.total}</p>
                                </div>
                            </div>
                        </div>

                        {/* Occupied */}
                        <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-400/30 px-6 py-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                                <div>
                                    <p className="text-xs text-red-400 font-['Almarai']">مشغول</p>
                                    <p className="text-2xl font-bold text-red-400 font-mono">{stats.occupied}</p>
                                </div>
                            </div>
                        </div>

                        {/* Available */}
                        <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl border border-emerald-400/30 px-6 py-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                <div>
                                    <p className="text-xs text-emerald-400 font-['Almarai']">متاح</p>
                                    <p className="text-2xl font-bold text-emerald-400 font-mono">{stats.available}</p>
                                </div>
                            </div>
                        </div>

                        {/* Reserved */}
                        <div className="bg-orange-500/10 backdrop-blur-sm rounded-2xl border border-orange-400/30 px-6 py-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-400" />
                                <div>
                                    <p className="text-xs text-orange-400 font-['Almarai']">محجوز</p>
                                    <p className="text-2xl font-bold text-orange-400 font-mono">{stats.reserved}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Zone Tabs */}
                <div className="flex gap-2">
                    {zones.map((zone) => (
                        <motion.button
                            key={zone.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveZone(zone.id)}
                            className={cn(
                                'px-6 py-3 rounded-2xl font-bold font-[\'Almarai\'] transition-all',
                                'border-2',
                                activeZoneId === zone.id
                                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-cyan-400/30'
                            )}
                        >
                            {zone.nameAr}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Table Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeZone ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {activeZone.tables.map((table, index) => (
                            <motion.div
                                key={table.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <TableCard table={table} onClick={handleTableClick} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <LayoutGrid className="w-24 h-24 text-gray-500 mx-auto mb-4" />
                            <p className="text-xl text-gray-400 font-['Almarai']">اختر منطقة لعرض الطاولات</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Scrollbar */}
            <style>{`
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.3);
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.5);
                }
            `}</style>
        </div>
    );
}
