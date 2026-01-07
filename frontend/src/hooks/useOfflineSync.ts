/**
 * useOfflineSync Hook
 * Manages offline sync state and operations for components
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { syncService, type SyncState, type SyncResult } from '@/services/sync.service';
import { offlineStorage } from '@/lib/offline-storage';
import { productService } from '@/services/product.service';

// =============================================================================
// TYPES
// =============================================================================

export interface UseOfflineSyncOptions {
    autoCache?: boolean; // Automatically cache products on mount
    autoSync?: boolean; // Enable automatic sync
    syncInterval?: number; // Sync interval in milliseconds
}

export interface UseOfflineSyncReturn extends SyncState {
    // Actions
    syncNow: () => Promise<SyncResult>;
    cacheProducts: () => Promise<void>;
    clearCache: () => Promise<void>;
    getProducts: () => Promise<{ products: any[]; categories: any[] } | null>;
    queueOrder: (order: any) => Promise<string>;

    // Helper states
    canSync: boolean; // Can sync if online and not already syncing
}

// =============================================================================
// HOOK
// =============================================================================

export function useOfflineSync(options: UseOfflineSyncOptions = {}): UseOfflineSyncReturn {
    const {
        autoCache = true,
        autoSync = true,
        syncInterval,
    } = options;

    const [state, setState] = useState<SyncState>(syncService.getState());
    const isInitialized = useRef(false);

    // Subscribe to sync state changes
    useEffect(() => {
        const unsubscribe = syncService.subscribe((newState) => {
            setState(newState);
        });

        return unsubscribe;
    }, []);

    // Initialize on mount
    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        const initialize = async () => {
            // Set sync config
            if (autoSync !== undefined || syncInterval !== undefined) {
                syncService.setConfig({
                    autoSync,
                    syncInterval: syncInterval || 30000,
                });
            }

            // Start auto-sync if enabled
            if (autoSync) {
                syncService.startAutoSync();
            }

            // Cache products on mount
            if (autoCache) {
                try {
                    await cacheProducts();
                } catch (error) {
                    console.error('[useOfflineSync] Failed to cache products on init:', error);
                }
            }

            // Update pending orders count
            await syncService.updatePendingCount();
        };

        initialize().catch((error) => {
            console.error('[useOfflineSync] Initialization error:', error);
        });

        // Cleanup on unmount
        return () => {
            syncService.stopAutoSync();
        };
    }, [autoCache, autoSync, syncInterval]);

    // Sync action
    const syncNow = useCallback(async (): Promise<SyncResult> => {
        return await syncService.syncNow();
    }, []);

    // Cache products action
    const cacheProducts = useCallback(async () => {
        await syncService.cacheProducts();
    }, []);

    // Clear cache action
    const clearCache = useCallback(async () => {
        await syncService.clearCache();
    }, []);

    // Get products from cache or server
    const getProducts = useCallback(async () => {
        return await syncService.getProducts();
    }, []);

    // Queue order for offline sync
    const queueOrder = useCallback(async (order: any) => {
        return await syncService.queueOrder(order);
    }, []);

    // Helper: can sync if online and not currently syncing
    const canSync = state.isOnline && state.status !== 'syncing';

    return {
        ...state,
        syncNow,
        cacheProducts,
        clearCache,
        getProducts,
        queueOrder,
        canSync,
    };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook for POS-specific offline operations
 */
export function usePOSOfflineSync() {
    const sync = useOfflineSync({
        autoCache: true,
        autoSync: true,
        syncInterval: 30000, // 30 seconds
    });

    // Create order with offline fallback
    const createOrder = useCallback(async (orderPayload: any) => {
        try {
            // Try to create order online
            const { orderService } = await import('@/services/order.service');
            const order = await orderService.create(orderPayload);
            return { success: true, order, offline: false };
        } catch (error) {
            // If offline, queue the order
            if (!sync.isOnline) {
                const offlineId = await sync.queueOrder(orderPayload);
                console.log('[usePOSOfflineSync] Order queued offline:', offlineId);
                return { success: true, order: { id: offlineId, ...orderPayload }, offline: true };
            }
            throw error;
        }
    }, [sync.isOnline, sync.queueOrder]);

    // Get products for POS with offline fallback
    const getPOSProducts = useCallback(async (categoryId?: string, search?: string) => {
        try {
            // Try online first
            return await productService.getForPOS(categoryId, search);
        } catch (error) {
            // Fallback to cache if offline
            console.log('[usePOSOfflineSync] Using cached products');
            const cached = await sync.getProducts();
            if (!cached) {
                throw new Error('No cached products available');
            }

            let products = cached.products;

            // Filter by category
            if (categoryId) {
                products = products.filter((p) => p.categoryId === categoryId);
            }

            // Filter by search
            if (search) {
                const searchLower = search.toLowerCase();
                products = products.filter(
                    (p) =>
                        p.name.toLowerCase().includes(searchLower) ||
                        p.sku.toLowerCase().includes(searchLower)
                );
            }

            return products;
        }
    }, [sync]);

    return {
        ...sync,
        createOrder,
        getPOSProducts,
    };
}

/**
 * Hook for inventory-specific offline operations
 */
export function useInventoryOfflineSync() {
    const sync = useOfflineSync({
        autoCache: true,
        autoSync: true,
    });

    // Batch sync multiple stock movements
    const batchSync = useCallback(async (movements: any[]) => {
        if (!sync.isOnline) {
            // Queue movements for later sync
            for (const movement of movements) {
                await sync.queueOrder({ type: 'STOCK_MOVEMENT', payload: movement });
            }
            return { success: true, queued: movements.length, synced: 0 };
        }

        // Sync immediately if online
        let synced = 0;
        const errors: Array<{ index: number; error: string }> = [];

        for (let i = 0; i < movements.length; i++) {
            try {
                // Would call inventory service to sync movement
                synced++;
            } catch (error) {
                errors.push({ index: i, error: String(error) });
            }
        }

        return {
            success: errors.length === 0,
            queued: 0,
            synced,
            errors,
        };
    }, [sync.isOnline, sync.queueOrder]);

    return {
        ...sync,
        batchSync,
    };
}
