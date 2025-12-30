/**
 * Inventory Store
 * Zustand store for inventory state management
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    inventoryService,
    Warehouse,
    InventorySummary,
    InventoryBatch,
    StockMove,
    StockAlert,
    BatchFilters,
    StockMoveFilters,
    AddStockDto,
    CreateStockAdjustmentDto,
    CreatePurchaseInvoiceDto
} from '@/services/inventory.service';

// =============================================================================
// Types
// =============================================================================

interface InventoryState {
    // Data
    warehouses: Warehouse[];
    selectedWarehouseId: string | null;
    inventorySummary: InventorySummary[];
    batches: InventoryBatch[];
    stockMoves: StockMove[];
    alerts: StockAlert[];

    // Loading states
    isLoadingWarehouses: boolean;
    isLoadingSummary: boolean;
    isLoadingBatches: boolean;
    isLoadingMoves: boolean;
    isLoadingAlerts: boolean;
    isSubmitting: boolean;

    // Errors
    error: string | null;

    // Active tab
    activeTab: 'overview' | 'products' | 'batches' | 'movements' | 'alerts';

    // Filters
    batchFilters: BatchFilters;
    moveFilters: StockMoveFilters;
}

interface InventoryActions {
    // Warehouse
    fetchWarehouses: () => Promise<void>;
    setSelectedWarehouse: (warehouseId: string | null) => void;

    // Summary
    fetchInventorySummary: () => Promise<void>;

    // Batches
    fetchBatches: (filters?: BatchFilters) => Promise<void>;
    setBatchFilters: (filters: Partial<BatchFilters>) => void;

    // Stock Moves
    fetchStockMoves: (filters?: StockMoveFilters) => Promise<void>;
    setMoveFilters: (filters: Partial<StockMoveFilters>) => void;

    // Alerts
    fetchAlerts: () => Promise<void>;
    acknowledgeAlert: (alertId: string, userId: string) => Promise<void>;
    resolveAlert: (alertId: string) => Promise<void>;

    // Stock Operations
    addStock: (dto: AddStockDto) => Promise<void>;
    createAdjustment: (dto: CreateStockAdjustmentDto) => Promise<void>;
    createPurchaseInvoice: (dto: CreatePurchaseInvoiceDto) => Promise<void>;

    // UI
    setActiveTab: (tab: InventoryState['activeTab']) => void;
    clearError: () => void;
    reset: () => void;
}

type InventoryStore = InventoryState & InventoryActions;

// =============================================================================
// Initial State
// =============================================================================

const initialState: InventoryState = {
    warehouses: [],
    selectedWarehouseId: null,
    inventorySummary: [],
    batches: [],
    stockMoves: [],
    alerts: [],
    isLoadingWarehouses: false,
    isLoadingSummary: false,
    isLoadingBatches: false,
    isLoadingMoves: false,
    isLoadingAlerts: false,
    isSubmitting: false,
    error: null,
    activeTab: 'overview',
    batchFilters: {},
    moveFilters: {},
};

// =============================================================================
// Store
// =============================================================================

export const useInventoryStore = create<InventoryStore>()(
    devtools(
        (set, get) => ({
            ...initialState,

            // =================================================================
            // Warehouse Actions
            // =================================================================

            fetchWarehouses: async () => {
                set({ isLoadingWarehouses: true, error: null });
                try {
                    const warehouses = await inventoryService.getWarehouses();
                    set({
                        warehouses,
                        isLoadingWarehouses: false,
                        // Auto-select first warehouse if none selected
                        selectedWarehouseId: get().selectedWarehouseId || (warehouses[0]?.id ?? null)
                    });
                } catch (error) {
                    console.error('[Inventory] Failed to fetch warehouses:', error);
                    set({
                        isLoadingWarehouses: false,
                        error: 'Failed to load warehouses'
                    });
                }
            },

            setSelectedWarehouse: (warehouseId) => {
                set({ selectedWarehouseId: warehouseId });
                // Refresh data for new warehouse
                const { activeTab } = get();
                if (activeTab === 'overview') {
                    get().fetchInventorySummary();
                } else if (activeTab === 'batches') {
                    get().fetchBatches();
                } else if (activeTab === 'movements') {
                    get().fetchStockMoves();
                }
            },

            // =================================================================
            // Inventory Summary Actions
            // =================================================================

            fetchInventorySummary: async () => {
                const { selectedWarehouseId } = get();
                set({ isLoadingSummary: true, error: null });
                try {
                    const summary = await inventoryService.getInventorySummary(
                        selectedWarehouseId || undefined
                    );
                    set({ inventorySummary: summary, isLoadingSummary: false });
                } catch (error) {
                    console.error('[Inventory] Failed to fetch summary:', error);
                    set({
                        isLoadingSummary: false,
                        error: 'Failed to load inventory summary'
                    });
                }
            },

            // =================================================================
            // Batch Actions
            // =================================================================

            fetchBatches: async (filters) => {
                const { selectedWarehouseId, batchFilters } = get();
                const mergedFilters = {
                    ...batchFilters,
                    ...filters,
                    warehouseId: filters?.warehouseId || selectedWarehouseId || undefined
                };

                set({ isLoadingBatches: true, error: null, batchFilters: mergedFilters });
                try {
                    const batches = await inventoryService.getBatches(mergedFilters);
                    set({ batches, isLoadingBatches: false });
                } catch (error) {
                    console.error('[Inventory] Failed to fetch batches:', error);
                    set({
                        isLoadingBatches: false,
                        error: 'Failed to load batches'
                    });
                }
            },

            setBatchFilters: (filters) => {
                const newFilters = { ...get().batchFilters, ...filters };
                set({ batchFilters: newFilters });
            },

            // =================================================================
            // Stock Move Actions
            // =================================================================

            fetchStockMoves: async (filters) => {
                const { selectedWarehouseId, moveFilters } = get();
                const mergedFilters = {
                    ...moveFilters,
                    ...filters,
                    warehouseId: filters?.warehouseId || selectedWarehouseId || undefined
                };

                set({ isLoadingMoves: true, error: null, moveFilters: mergedFilters });
                try {
                    const moves = await inventoryService.getStockMoves(mergedFilters);
                    set({ stockMoves: moves, isLoadingMoves: false });
                } catch (error) {
                    console.error('[Inventory] Failed to fetch stock moves:', error);
                    set({
                        isLoadingMoves: false,
                        error: 'Failed to load stock movements'
                    });
                }
            },

            setMoveFilters: (filters) => {
                const newFilters = { ...get().moveFilters, ...filters };
                set({ moveFilters: newFilters });
            },

            // =================================================================
            // Alert Actions
            // =================================================================

            fetchAlerts: async () => {
                set({ isLoadingAlerts: true, error: null });
                try {
                    const alerts = await inventoryService.getActiveAlerts();
                    set({ alerts, isLoadingAlerts: false });
                } catch (error) {
                    console.error('[Inventory] Failed to fetch alerts:', error);
                    set({
                        isLoadingAlerts: false,
                        error: 'Failed to load alerts'
                    });
                }
            },

            acknowledgeAlert: async (alertId, userId) => {
                try {
                    await inventoryService.acknowledgeAlert(alertId, userId);
                    // Refresh alerts
                    get().fetchAlerts();
                } catch (error) {
                    console.error('[Inventory] Failed to acknowledge alert:', error);
                    set({ error: 'Failed to acknowledge alert' });
                }
            },

            resolveAlert: async (alertId) => {
                try {
                    await inventoryService.resolveAlert(alertId);
                    // Refresh alerts
                    get().fetchAlerts();
                } catch (error) {
                    console.error('[Inventory] Failed to resolve alert:', error);
                    set({ error: 'Failed to resolve alert' });
                }
            },

            // =================================================================
            // Stock Operation Actions
            // =================================================================

            addStock: async (dto) => {
                set({ isSubmitting: true, error: null });
                try {
                    await inventoryService.addStock(dto);
                    // Refresh relevant data
                    get().fetchInventorySummary();
                    get().fetchBatches();
                    set({ isSubmitting: false });
                } catch (error) {
                    console.error('[Inventory] Failed to add stock:', error);
                    set({
                        isSubmitting: false,
                        error: 'Failed to add stock'
                    });
                    throw error;
                }
            },

            createAdjustment: async (dto) => {
                set({ isSubmitting: true, error: null });
                try {
                    await inventoryService.createAdjustment(dto);
                    // Refresh relevant data
                    get().fetchInventorySummary();
                    get().fetchBatches();
                    get().fetchStockMoves();
                    set({ isSubmitting: false });
                } catch (error) {
                    console.error('[Inventory] Failed to create adjustment:', error);
                    set({
                        isSubmitting: false,
                        error: 'Failed to create adjustment'
                    });
                    throw error;
                }
            },

            createPurchaseInvoice: async (dto) => {
                set({ isSubmitting: true, error: null });
                try {
                    const result = await inventoryService.createPurchaseInvoice(dto);
                    // Receive the purchase immediately
                    await inventoryService.receivePurchaseInvoice(result.id);
                    // Refresh relevant data
                    get().fetchInventorySummary();
                    get().fetchBatches();
                    get().fetchStockMoves();
                    set({ isSubmitting: false });
                } catch (error) {
                    console.error('[Inventory] Failed to create purchase invoice:', error);
                    set({
                        isSubmitting: false,
                        error: 'Failed to create purchase invoice'
                    });
                    throw error;
                }
            },

            // =================================================================
            // UI Actions
            // =================================================================

            setActiveTab: (tab) => {
                set({ activeTab: tab });
                // Fetch data for the new tab
                if (tab === 'overview') {
                    get().fetchInventorySummary();
                } else if (tab === 'batches') {
                    get().fetchBatches();
                } else if (tab === 'movements') {
                    get().fetchStockMoves();
                } else if (tab === 'alerts') {
                    get().fetchAlerts();
                }
            },

            clearError: () => set({ error: null }),

            reset: () => set(initialState),
        }),
        { name: 'inventory-store' }
    )
);
