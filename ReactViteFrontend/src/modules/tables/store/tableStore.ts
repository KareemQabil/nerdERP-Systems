import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Table, TableStatus } from '../types/table.types';

/**
 * Zone Interface (Simplified for Frontend)
 */
export interface Zone {
    id: string;
    name: string;
    nameAr: string;
    color: string;
    tables: Table[];
}

/**
 * Table Store State
 */
interface TableStoreState {
    zones: Zone[];
    activeZoneId: string;
}

/**
 * Table Store Actions
 */
interface TableStoreActions {
    setActiveZone: (zoneId: string) => void;
    updateTableStatus: (tableId: string, status: TableStatus, activeOrderId?: string) => void;
    getTableById: (tableId: string) => Table | undefined;
    getActiveZone: () => Zone | undefined;
    getTableStats: () => {
        total: number;
        available: number;
        occupied: number;
        reserved: number;
    };
}

type TableStore = TableStoreState & TableStoreActions;

/**
 * Generate Mock Table Data
 */
const generateMockZones = (): Zone[] => {
    return [
        {
            id: 'zone-indoor',
            name: 'Indoor',
            nameAr: 'داخلي',
            color: '#22d3ee', // Cyan
            tables: [
                { id: 'table-1', name: 'Table 1', capacity: 4, status: 'AVAILABLE' as TableStatus, zoneId: 'zone-indoor', isActive: true },
                { id: 'table-2', name: 'Table 2', capacity: 2, status: 'OCCUPIED' as TableStatus, activeOrderId: 'order-123', zoneId: 'zone-indoor', isActive: true },
                { id: 'table-3', name: 'Table 3', capacity: 6, status: 'AVAILABLE' as TableStatus, zoneId: 'zone-indoor', isActive: true },
                { id: 'table-4', name: 'Table 4', capacity: 4, status: 'RESERVED' as TableStatus, zoneId: 'zone-indoor', isActive: true },
                { id: 'table-5', name: 'Table 5', capacity: 2, status: 'OCCUPIED' as TableStatus, activeOrderId: 'order-124', zoneId: 'zone-indoor', isActive: true },
                { id: 'table-6', name: 'Table 6', capacity: 8, status: 'AVAILABLE' as TableStatus, zoneId: 'zone-indoor', isActive: true },
                { id: 'table-7', name: 'Table 7', capacity: 4, status: 'AVAILABLE' as TableStatus, zoneId: 'zone-indoor', isActive: true },
                { id: 'table-8', name: 'Table 8', capacity: 2, status: 'OCCUPIED' as TableStatus, activeOrderId: 'order-125', zoneId: 'zone-indoor', isActive: true },
            ],
        },
        {
            id: 'zone-terrace',
            name: 'Terrace',
            nameAr: 'تراس',
            color: '#f59e0b', // Amber
            tables: [
                { id: 'table-9', name: 'T1', capacity: 4, status: 'AVAILABLE' as TableStatus, zoneId: 'zone-terrace', isActive: true },
                { id: 'table-10', name: 'T2', capacity: 2, status: 'AVAILABLE' as TableStatus, zoneId: 'zone-terrace', isActive: true },
                { id: 'table-11', name: 'T3', capacity: 6, status: 'OCCUPIED' as TableStatus, activeOrderId: 'order-126', zoneId: 'zone-terrace', isActive: true },
                { id: 'table-12', name: 'T4', capacity: 4, status: 'AVAILABLE' as TableStatus, zoneId: 'zone-terrace', isActive: true },
                { id: 'table-13', name: 'T5', capacity: 2, status: 'RESERVED' as TableStatus, zoneId: 'zone-terrace', isActive: true },
                { id: 'table-14', name: 'T6', capacity: 4, status: 'AVAILABLE' as TableStatus, zoneId: 'zone-terrace', isActive: true },
            ],
        },
    ];
};

/**
 * Table Store
 * Manages restaurant floor plan with zones and tables
 */
export const useTableStore = create<TableStore>()(
    devtools(
        (set, get) => ({
            // Initial State
            zones: generateMockZones(),
            activeZoneId: 'zone-indoor',

            // Actions
            setActiveZone: (zoneId) => {
                set({ activeZoneId: zoneId });
                console.log('🏢 [TableStore] Active zone changed:', zoneId);
            },

            updateTableStatus: (tableId, status, activeOrderId) => {
                const { zones } = get();
                const updatedZones = zones.map((zone) => ({
                    ...zone,
                    tables: zone.tables.map((table) =>
                        table.id === tableId
                            ? { ...table, status, activeOrderId }
                            : table
                    ),
                }));
                set({ zones: updatedZones });
                console.log('🔄 [TableStore] Table status updated:', { tableId, status, activeOrderId });
            },

            getTableById: (tableId) => {
                const { zones } = get();
                for (const zone of zones) {
                    const table = zone.tables.find((t) => t.id === tableId);
                    if (table) return table;
                }
                return undefined;
            },

            getActiveZone: () => {
                const { zones, activeZoneId } = get();
                return zones.find((z) => z.id === activeZoneId);
            },

            getTableStats: () => {
                const { zones } = get();
                let total = 0;
                let available = 0;
                let occupied = 0;
                let reserved = 0;

                zones.forEach((zone) => {
                    zone.tables.forEach((table) => {
                        total++;
                        if (table.status === 'AVAILABLE') available++;
                        if (table.status === 'OCCUPIED') occupied++;
                        if (table.status === 'RESERVED') reserved++;
                    });
                });

                return { total, available, occupied, reserved };
            },
        }),
        { name: 'table-store' }
    )
);
