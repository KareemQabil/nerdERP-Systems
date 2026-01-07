/**
 * Tables Store
 * Zustand store for table and reservation state management
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    tablesService,
    Table,
    TableZone,
    type TableStatus,
    Reservation,
} from '@/services/tables.service';
import { tablesSocket, type TableStatusChangedEvent, type TableUpdatedEvent, type ZoneUpdatedEvent, type TableCreatedEvent } from '@/lib/tables-socket';

// =============================================================================
// Mock Data (for fallback/demo mode)
// =============================================================================

const MOCK_ZONES: TableZone[] = [
    { id: 'zone-1', storeId: 'default', zoneName: 'Main Dining', translations: { ar: { name: 'الصالة الرئيسية' } }, displayOrder: 1, isActive: true },
    { id: 'zone-2', storeId: 'default', zoneName: 'Outdoor', translations: { ar: { name: 'الخارج' } }, displayOrder: 2, isActive: true },
    { id: 'zone-3', storeId: 'default', zoneName: 'VIP', translations: { ar: { name: 'ضيافة' } }, displayOrder: 3, isActive: true },
];

const MOCK_TABLES: Table[] = [
    { id: 'table-1', storeId: 'default', zoneId: 'zone-1', tableNumber: '1', minSeats: 2, maxSeats: 4, status: 'AVAILABLE', floorPosition: { x: 100, y: 100, width: 80, height: 80, shape: 'circle' }, zone: MOCK_ZONES[0], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'table-2', storeId: 'default', zoneId: 'zone-1', tableNumber: '2', minSeats: 2, maxSeats: 4, status: 'OCCUPIED', floorPosition: { x: 250, y: 100, width: 80, height: 80, shape: 'circle' }, zone: MOCK_ZONES[0], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'table-3', storeId: 'default', zoneId: 'zone-1', tableNumber: '3', minSeats: 4, maxSeats: 6, status: 'RESERVED', floorPosition: { x: 100, y: 250, width: 120, height: 80, shape: 'rectangle' }, zone: MOCK_ZONES[0], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'table-4', storeId: 'default', zoneId: 'zone-2', tableNumber: '4', minSeats: 2, maxSeats: 4, status: 'AVAILABLE', floorPosition: { x: 250, y: 250, width: 80, height: 80, shape: 'rectangle' }, zone: MOCK_ZONES[1], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'table-5', storeId: 'default', zoneId: 'zone-2', tableNumber: '5', minSeats: 6, maxSeats: 8, status: 'CLEANING', floorPosition: { x: 400, y: 100, width: 120, height: 80, shape: 'rectangle' }, zone: MOCK_ZONES[1], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'table-6', storeId: 'default', zoneId: 'zone-3', tableNumber: '6', minSeats: 2, maxSeats: 2, status: 'AVAILABLE', floorPosition: { x: 400, y: 250, width: 80, height: 80, shape: 'circle' }, zone: MOCK_ZONES[2], isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];


// =============================================================================
// Types
// =============================================================================

interface TablesState {
    // Data
    zones: TableZone[];
    tables: Table[];
    reservations: Reservation[];
    selectedZoneId: string | null;

    // Loading states
    isLoadingZones: boolean;
    isLoadingTables: boolean;
    isLoadingReservations: boolean;

    // Errors
    error: string | null;

    // Actions
    fetchZones: (storeId?: string) => Promise<void>;
    fetchTables: (storeId?: string) => Promise<void>;
    fetchReservations: (storeId: string, date?: string) => Promise<void>;

    setSelectedZone: (zoneId: string | null) => void;

    occupyTable: (tableId: string, orderId: string) => Promise<void>;
    freeTable: (tableId: string) => Promise<void>;
    updateTableStatus: (tableId: string, status: TableStatus, orderId?: string) => Promise<void>;

    // Table Cleaning Workflow
    markTableClean: (tableId: string) => Promise<void>;
    setTableCleaning: (tableId: string) => Promise<void>;
    blockTable: (tableId: string, reason?: string) => Promise<void>;

    // WebSocket sync
    syncWithWebSocket: () => void;

    clearError: () => void;
    reset: () => void;
}

type TablesStore = TablesState;

// =============================================================================
// Initial State
// =============================================================================

const initialState: Pick<TablesState, 'zones' | 'tables' | 'reservations' | 'selectedZoneId' | 'isLoadingZones' | 'isLoadingTables' | 'isLoadingReservations' | 'error'> = {
    zones: [],
    tables: [],
    reservations: [],
    selectedZoneId: null,
    isLoadingZones: false,
    isLoadingTables: false,
    isLoadingReservations: false,
    error: null,
};

// =============================================================================
// Store
// =============================================================================

export const useTablesStore = create<TablesStore>()(
    devtools(
        (set, _get) => ({
            ...initialState,

            // =================================================================
            // Data Fetching
            // =================================================================

            fetchZones: async (storeId) => {
                set({ isLoadingZones: true, error: null });
                try {
                    const response: unknown = await tablesService.getZones(storeId);
                    // Ensure zones is always an array (API might return { data: [...] } or [...] )
                    const zones = Array.isArray(response)
                        ? response
                        : ((response as Record<string, unknown>)?.data as TableZone[] || []);
                    set({ zones: Array.isArray(zones) ? zones : [], isLoadingZones: false });
                } catch (error) {
                    console.warn('[Tables] Failed to fetch zones, using mock data:', error);
                    set({ zones: MOCK_ZONES, isLoadingZones: false });
                }
            },

            fetchTables: async (storeId) => {
                set({ isLoadingTables: true, error: null });
                try {
                    const response: unknown = await tablesService.getTables(storeId);
                    // Ensure tables is always an array (API might return { data: [...] } or [...] )
                    const tables = Array.isArray(response)
                        ? response
                        : ((response as Record<string, unknown>)?.data as Table[] || []);
                    set({ tables: Array.isArray(tables) ? tables : [], isLoadingTables: false });
                } catch (error) {
                    console.warn('[Tables] Failed to fetch tables, using mock data:', error);
                    set({ tables: MOCK_TABLES, isLoadingTables: false });
                }
            },

            fetchReservations: async (storeId, date) => {
                set({ isLoadingReservations: true, error: null });
                try {
                    const today = date || new Date().toISOString().split('T')[0];
                    const reservations = await tablesService.getTodayReservations(storeId, today);
                    set({ reservations, isLoadingReservations: false });
                } catch (error) {
                    console.error('[Tables] Failed to fetch reservations:', error);
                    set({
                        isLoadingReservations: false,
                        error: 'Failed to load reservations',
                    });
                }
            },

            // =================================================================
            // Actions
            // =================================================================

            setSelectedZone: (zoneId) => {
                set({ selectedZoneId: zoneId });
            },

            occupyTable: async (tableId, orderId) => {
                try {
                    const table = await tablesService.occupyTable(tableId, orderId);
                    // Update table in state
                    set((state) => ({
                        tables: state.tables.map((t) =>
                            t.id === tableId ? table : t
                        ),
                    }));
                } catch (error: any) {
                    console.error('[Tables] Failed to occupy table:', error);
                    set({ error: error.response?.data?.message || 'Failed to occupy table' });
                    throw error;
                }
            },

            freeTable: async (tableId) => {
                try {
                    const table = await tablesService.freeTable(tableId);
                    // Update table in state
                    set((state) => ({
                        tables: state.tables.map((t) =>
                            t.id === tableId ? table : t
                        ),
                    }));
                } catch (error: any) {
                    console.error('[Tables] Failed to free table:', error);
                    set({ error: error.response?.data?.message || 'Failed to free table' });
                    throw error;
                }
            },

            updateTableStatus: async (tableId, status, orderId) => {
                try {
                    const table = await tablesService.updateTableStatus(tableId, {
                        status,
                        currentOrderId: orderId,
                    });
                    // Update table in state
                    set((state) => ({
                        tables: state.tables.map((t) =>
                            t.id === tableId ? table : t
                        ),
                    }));
                } catch (error: any) {
                    console.error('[Tables] Failed to update table status:', error);
                    set({ error: error.response?.data?.message || 'Failed to update table status' });
                    throw error;
                }
            },

            // =================================================================
            // Table Cleaning Workflow
            // =================================================================

            markTableClean: async (tableId) => {
                try {
                    const table = await tablesService.markTableClean(tableId);
                    set((state) => ({
                        tables: state.tables.map((t) =>
                            t.id === tableId ? table : t
                        ),
                    }));
                } catch (error: any) {
                    console.error('[Tables] Failed to mark table clean:', error);
                    set({ error: error.response?.data?.message || 'Failed to mark table clean' });
                    throw error;
                }
            },

            setTableCleaning: async (tableId) => {
                try {
                    const table = await tablesService.setTableCleaning(tableId);
                    set((state) => ({
                        tables: state.tables.map((t) =>
                            t.id === tableId ? table : t
                        ),
                    }));
                } catch (error: any) {
                    console.error('[Tables] Failed to set table to cleaning:', error);
                    set({ error: error.response?.data?.message || 'Failed to set table to cleaning' });
                    throw error;
                }
            },

            blockTable: async (tableId, reason) => {
                try {
                    const table = await tablesService.blockTable(tableId, reason);
                    set((state) => ({
                        tables: state.tables.map((t) =>
                            t.id === tableId ? table : t
                        ),
                    }));
                } catch (error: any) {
                    console.error('[Tables] Failed to block table:', error);
                    set({ error: error.response?.data?.message || 'Failed to block table' });
                    throw error;
                }
            },

            // =================================================================
            // WebSocket Sync
            // =================================================================

            syncWithWebSocket: () => {
                // Connect to tables WebSocket for real-time updates
                tablesSocket.connect({
                    onConnected: () => {
                        console.log('[Tables] WebSocket connected');
                    },
                    onDisconnected: () => {
                        console.log('[Tables] WebSocket disconnected');
                    },
                    onTableUpdated: (event: TableUpdatedEvent) => {
                        set((state) => ({
                            tables: state.tables.map((t) =>
                                t.id === event.tableId
                                    ? { ...t, status: event.status as TableStatus }
                                    : t
                            ),
                        }));
                    },
                    onTableStatusChanged: (event: TableStatusChangedEvent) => {
                        set((state) => ({
                            tables: state.tables.map((t) =>
                                t.id === event.tableId
                                    ? { ...t, status: event.status as TableStatus, currentOrderId: event.orderId }
                                    : t
                            ),
                        }));
                    },
                    onZoneUpdated: (event: ZoneUpdatedEvent) => {
                        set((state) => ({
                            zones: state.zones.map((z) =>
                                z.id === event.zoneId
                                    ? { ...z, zoneName: event.name }
                                    : z
                            ),
                        }));
                    },
                    onTableCreated: (event: TableCreatedEvent) => {
                        const newTable: Table = {
                            id: event.tableId,
                            storeId: 'default',
                            zoneId: event.zoneId,
                            tableNumber: event.tableNumber,
                            minSeats: event.seats,
                            maxSeats: event.seats,
                            status: event.status as TableStatus,
                            floorPosition: {
                                shape: event.shape as 'rectangle' | 'circle' | 'oval',
                                x: event.position.x,
                                y: event.position.y,
                                width: 80,  // Default size
                                height: 80, // Default size
                            },
                            isActive: true,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        };
                        set((state) => ({
                            tables: [...state.tables, newTable],
                        }));
                    },
                    onTableDeleted: (event) => {
                        set((state) => ({
                            tables: state.tables.filter((t) => t.id !== event.tableId),
                        }));
                    },
                });
            },

            // =================================================================
            // UI Actions
            // =================================================================

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        { name: 'tables-store' }
    )
);
