/**
 * FloorPlanView Component
 *
 * Canvas-based floor plan for visual table management
 */
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Map,
    Plus,
    Edit2,
    Save,
    X,
    Grid,
    Maximize2,
    Filter,
    Layers,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { useTablesStore } from '@/stores/tables.store';
import { TableCard } from './TableCard';
import { cn } from '@/lib/utils';
import type { Table, TableStatus, TableZone } from '@/services/tables.service';

// =============================================================================
// TYPES
// =============================================================================

interface FloorPlanViewProps {
    tables: Table[];
    zones: TableZone[];
    loading?: boolean;
    selectedTableId?: string | null;
    onTableClick?: (table: Table) => void;
    onTableDoubleClick?: (table: Table) => void;
    editable?: boolean;
    onTableMove?: (tableId: string, position: { x: number; y: number; width: number; height: number }) => void;
    onRefresh?: () => void;
    onAddTable?: () => void;
    onAddZone?: () => void;
}

// =============================================================================
// STATUS FILTERS
// =============================================================================

const STATUS_FILTERS: Array<{ status: TableStatus | 'ALL'; label: string; labelAr: string; color: string }> = [
    { status: 'ALL', label: 'All', labelAr: 'الكل', color: 'bg-slate-500' },
    { status: 'AVAILABLE', label: 'Available', labelAr: 'متاح', color: 'bg-emerald-500' },
    { status: 'OCCUPIED', label: 'Occupied', labelAr: 'مشغول', color: 'bg-red-500' },
    { status: 'RESERVED', label: 'Reserved', labelAr: 'محجوز', color: 'bg-yellow-500' },
    { status: 'CLEANING', label: 'Cleaning', labelAr: 'تنظيف', color: 'bg-blue-500' },
    { status: 'BLOCKED', label: 'Blocked', labelAr: 'محجور', color: 'bg-slate-600' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function FloorPlanView({
    tables,
    zones,
    loading,
    selectedTableId,
    onTableClick,
    onTableDoubleClick,
    editable = false,
    onTableMove,
    onRefresh,
    onAddTable,
    onAddZone,
}: FloorPlanViewProps) {
    const { language } = useSettingsStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [statusFilter, setStatusFilter] = useState<TableStatus | 'ALL'>('ALL');
    const [selectedZoneFilter, setSelectedZoneFilter] = useState<string | 'ALL'>('ALL');
    const [draggingTable, setDraggingTable] = useState<Table | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Filter tables
    const filteredTables = tables.filter((table) => {
        if (statusFilter !== 'ALL' && table.status !== statusFilter) return false;
        if (selectedZoneFilter !== 'ALL' && table.zoneId !== selectedZoneFilter) return false;
        return true;
    });

    // Calculate grid size based on table positions
    const gridSize = Math.max(
        800,
        ...tables.flatMap((t) =>
            t.floorPosition
                ? [t.floorPosition.x + t.floorPosition.width, t.floorPosition.y + t.floorPosition.height]
                : [0, 0]
        )
    );

    // Handle drag start
    const handleDragStart = (e: React.MouseEvent, table: Table) => {
        if (!isEditMode || !editable || !onTableMove) return;

        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        setDraggingTable(table);
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    // Handle drag move
    const handleDragMove = (e: React.MouseEvent) => {
        if (!draggingTable || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left - dragOffset.x;
        const y = e.clientY - containerRect.top - dragOffset.y;

        // Constrain to container
        const constrainedX = Math.max(0, Math.min(x, containerRect.width - (draggingTable.floorPosition?.width || 80)));
        const constrainedY = Math.max(0, Math.min(y, containerRect.height - (draggingTable.floorPosition?.height || 80)));

        // Update visual position immediately (would need to update table in store)
        // For now, just log - the actual update happens on drag end
    };

    // Handle drag end
    const handleDragEnd = (e: React.MouseEvent) => {
        if (!draggingTable || !containerRef.current || !onTableMove) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - containerRect.left - dragOffset.x;
        const y = e.clientY - containerRect.top - dragOffset.y;

        const width = draggingTable.floorPosition?.width || 80;
        const height = draggingTable.floorPosition?.height || 80;

        onTableMove(draggingTable.id, {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width,
            height,
        });

        setDraggingTable(null);
    };

    // Calculate stats
    const stats = {
        total: tables.length,
        available: tables.filter((t) => t.status === 'AVAILABLE').length,
        occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
        reserved: tables.filter((t) => t.status === 'RESERVED').length,
        cleaning: tables.filter((t) => t.status === 'CLEANING').length,
        blocked: tables.filter((t) => t.status === 'BLOCKED').length,
    };

    return (
        <div className="space-y-4" data-testid="floor-plan-view">
            {/* Header with Stats and Filters */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Stats */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                        <span className="text-slate-400 text-sm">Total:</span>
                        <span className="text-white font-bold">{stats.total}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-400 text-sm">Free: {stats.available}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-red-400 text-sm">Occupied: {stats.occupied}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-yellow-400 text-sm">Reserved: {stats.reserved}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Add Zone Button */}
                    {onAddZone && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onAddZone}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
                        >
                            <Layers className="w-4 h-4" />
                            {language === 'ar' ? 'منطقة' : 'Zone'}
                        </motion.button>
                    )}
                    {/* Add Table Button */}
                    {onAddTable && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onAddTable}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            {language === 'ar' ? 'طاولة' : 'Table'}
                        </motion.button>
                    )}
                    {editable && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                                isEditMode
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
                            )}
                        >
                            <Edit2 className="w-4 h-4" />
                            {language === 'ar' ? 'تعديل' : 'Edit'}
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRefresh}
                        className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <div className="flex gap-1">
                        {STATUS_FILTERS.map((filter) => (
                            <button
                                key={filter.status}
                                onClick={() => setStatusFilter(filter.status as TableStatus | 'ALL')}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                    statusFilter === filter.status
                                        ? filter.color + ' text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
                                )}
                            >
                                {language === 'ar' ? filter.labelAr : filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Zone Filter */}
                {zones.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">Zone:</span>
                        <select
                            value={selectedZoneFilter}
                            onChange={(e) => setSelectedZoneFilter(e.target.value)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 focus:outline-none focus:border-cyan-500"
                        >
                            <option value="ALL">All Zones</option>
                            {zones.map((zone) => (
                                <option key={zone.id} value={zone.id}>
                                    {zone.zoneName}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Floor Plan Canvas */}
            <div
                ref={containerRef}
                className={cn(
                    'relative rounded-xl border-2 overflow-auto transition-all',
                    isEditMode
                        ? 'border-orange-500/50 bg-slate-800/30'
                        : 'border-slate-700/50 bg-slate-900/50',
                )}
                style={{
                    minHeight: '600px',
                    minWidth: gridSize + 100,
                }}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
            >
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
                    </div>
                ) : filteredTables.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <Map className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium">
                            {language === 'ar' ? 'لا توجد طاولات' : 'No tables found'}
                        </p>
                        <p className="text-sm mt-2">
                            {language === 'ar' ? 'أضف طاولات لبدء العمل' : 'Add tables to get started'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Grid Background */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: `
                                    linear-gradient(to right, rgba(100, 116, 139, 0.1) 1px, transparent 1px),
                                    linear-gradient(to bottom, rgba(100, 116, 139, 0.1) 1px, transparent 1px)
                                `,
                                backgroundSize: '40px 40px',
                            }}
                        />

                        {/* Tables */}
                        {filteredTables.map((table) => (
                            <TableCard
                                key={table.id}
                                table={table}
                                isSelected={selectedTableId === table.id}
                                onClick={() => onTableClick?.(table)}
                                onDoubleClick={() => onTableDoubleClick?.(table)}
                            />
                        ))}
                    </>
                )}

                {/* Edit Mode Indicator */}
                {isEditMode && (
                    <div className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/40">
                        <div className="flex items-center gap-2 text-orange-400">
                            <Edit2 className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {language === 'ar' ? 'وضع التعديل' : 'Edit Mode'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm py-2">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500" />
                    <span className="text-slate-400">{language === 'ar' ? 'متاح' : 'Available'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500" />
                    <span className="text-slate-400">{language === 'ar' ? 'مشغول' : 'Occupied'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500" />
                    <span className="text-slate-400">{language === 'ar' ? 'محجوز' : 'Reserved'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500" />
                    <span className="text-slate-400">{language === 'ar' ? 'تنظيف' : 'Cleaning'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-500" />
                    <span className="text-slate-400">{language === 'ar' ? 'محجور' : 'Blocked'}</span>
                </div>
            </div>
        </div>
    );
}

export default FloorPlanView;
