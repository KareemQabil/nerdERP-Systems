/**
 * Sync Service
 * Coordinates offline data synchronization with the server
 */
import { offlineStorage, type PendingOrder } from '@/lib/offline-storage';
import { orderService } from '@/services/order.service';
import { productService, categoryService } from '@/services/product.service';

// =============================================================================
// TYPES
// =============================================================================

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

export interface SyncState {
    status: SyncStatus;
    isOnline: boolean;
    pendingOrders: number;
    lastSyncAt: number | null;
    lastError?: string;
}

export interface SyncResult {
    success: boolean;
    syncedOrders: number;
    failedOrders: number;
    errors: Array<{ orderId: string; error: string }>;
}

export interface SyncConfig {
    autoSync: boolean;
    syncInterval: number; // milliseconds
    retryLimit: number;
    retryDelay: number; // milliseconds
}

// =============================================================================
// SYNC SERVICE
// =============================================================================

class SyncService {
    private static instance: SyncService;
    private state: SyncState = {
        status: 'online',
        isOnline: true,
        pendingOrders: 0,
        lastSyncAt: null,
    };
    private listeners: Set<(state: SyncState) => void> = new Set();
    private syncTimer: NodeJS.Timeout | null = null;
    private isSyncing: boolean = false;
    private config: SyncConfig = {
        autoSync: true,
        syncInterval: 30000, // 30 seconds
        retryLimit: 3,
        retryDelay: 5000, // 5 seconds
    };

    private constructor() {
        this.initializeNetworkMonitoring();
    }

    static getInstance(): SyncService {
        if (!SyncService.instance) {
            SyncService.instance = new SyncService();
        }
        return SyncService.instance;
    }

    // ========================================================================
    // NETWORK MONITORING
    // ========================================================================

    private initializeNetworkMonitoring() {
        if (typeof window === 'undefined') return;

        // Initial check
        this.updateOnlineStatus(navigator.onLine);

        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    private handleOnline() {
        console.log('[SyncService] Connection restored');
        this.updateOnlineStatus(true);

        // Trigger automatic sync when coming back online
        if (this.config.autoSync) {
            this.syncNow().catch((error) => {
                console.error('[SyncService] Auto-sync failed:', error);
            });
        }
    }

    private handleOffline() {
        console.log('[SyncService] Connection lost');
        this.updateOnlineStatus(false);
    }

    private updateOnlineStatus(isOnline: boolean) {
        this.state.isOnline = isOnline;
        this.state.status = isOnline ? 'online' : 'offline';
        this.notifyListeners();
    }

    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================

    getState(): SyncState {
        return { ...this.state };
    }

    subscribe(listener: (state: SyncState) => void): () => void {
        this.listeners.add(listener);
        // Immediately call with current state
        listener(this.getState());
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        const state = this.getState();
        this.listeners.forEach((listener) => {
            try {
                listener(state);
            } catch (error) {
                console.error('[SyncService] Listener error:', error);
            }
        });
    }

    private updateState(updates: Partial<SyncState>) {
        this.state = { ...this.state, ...updates };
        this.notifyListeners();
    }

    // ========================================================================
    // PRODUCT CACHE SYNC
    // ========================================================================

    /**
     * Cache products and categories for offline use
     */
    async cacheProducts(storeId?: string): Promise<void> {
        try {
            const [products, categories] = await Promise.all([
                productService.getAllProducts(500),
                categoryService.getActive(),
            ]);

            await offlineStorage.cacheProducts(products, categories);
            console.log(`[SyncService] Cached ${products.length} products and ${categories.length} categories`);
        } catch (error) {
            console.error('[SyncService] Failed to cache products:', error);
            throw error;
        }
    }

    /**
     * Get products from cache or fetch if stale
     */
    async getProducts(forceRefresh = false): Promise<{ products: any[]; categories: any[] } | null> {
        if (forceRefresh) {
            await this.cacheProducts();
        }

        const cached = await offlineStorage.getProductCache();
        if (cached) {
            return cached;
        }

        // Cache is stale or empty, fetch fresh data
        await this.cacheProducts();
        return await offlineStorage.getProductCache();
    }

    // ========================================================================
    // ORDER SYNC
    // ========================================================================

    /**
     * Queue an order for offline storage
     */
    async queueOrder(orderPayload: any): Promise<string> {
        const id = await offlineStorage.saveOrder(orderPayload);
        await this.updatePendingCount();
        console.log(`[SyncService] Order queued: ${id}`);
        return id;
    }

    /**
     * Sync all pending orders to the server
     */
    async syncNow(): Promise<SyncResult> {
        if (this.isSyncing) {
            console.log('[SyncService] Sync already in progress');
            return {
                success: false,
                syncedOrders: 0,
                failedOrders: 0,
                errors: [],
            };
        }

        if (!this.state.isOnline) {
            console.log('[SyncService] Cannot sync while offline');
            return {
                success: false,
                syncedOrders: 0,
                failedOrders: 0,
                errors: [{ orderId: 'all', error: 'Device is offline' }],
            };
        }

        this.isSyncing = true;
        this.updateState({ status: 'syncing', lastError: undefined });

        try {
            const pendingOrders = await offlineStorage.getPendingOrders();

            if (pendingOrders.length === 0) {
                console.log('[SyncService] No pending orders to sync');
                this.updateState({
                    status: 'online',
                    lastSyncAt: Date.now(),
                });
                return {
                    success: true,
                    syncedOrders: 0,
                    failedOrders: 0,
                    errors: [],
                };
            }

            console.log(`[SyncService] Syncing ${pendingOrders.length} pending orders`);

            let syncedCount = 0;
            let failedCount = 0;
            const syncErrors: Array<{ orderId: string; error: string }> = [];

            for (const pendingOrder of pendingOrders) {
                // Check retry limit
                if (pendingOrder.retryCount >= this.config.retryLimit) {
                    console.error(`[SyncService] Order ${pendingOrder.id} exceeded retry limit`);
                    syncErrors.push({
                        orderId: pendingOrder.id,
                        error: `Exceeded retry limit (${this.config.retryLimit})`,
                    });
                    failedCount++;
                    continue;
                }

                try {
                    // Create the order on the server
                    const createdOrder = await orderService.create(pendingOrder.payload);

                    // Mark as synced
                    await offlineStorage.markOrderSynced(pendingOrder.id, createdOrder.id);
                    syncedCount++;
                    console.log(`[SyncService] Synced order: ${pendingOrder.id} -> ${createdOrder.id}`);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`[SyncService] Failed to sync order ${pendingOrder.id}:`, errorMessage);

                    // Mark as failed with retry
                    await offlineStorage.markOrderFailed(pendingOrder.id, errorMessage);
                    await offlineStorage.updateRetryCount(pendingOrder.id);

                    syncErrors.push({
                        orderId: pendingOrder.id,
                        error: errorMessage,
                    });
                    failedCount++;
                }
            }

            // Update sync state
            await this.updatePendingCount();

            const success = failedCount === 0;
            this.updateState({
                status: success ? 'online' : 'error',
                lastSyncAt: Date.now(),
                lastError: success ? undefined : `${failedCount} orders failed to sync`,
            });

            return {
                success,
                syncedOrders: syncedCount,
                failedOrders: failedCount,
                errors: syncErrors,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
            this.updateState({
                status: 'error',
                lastError: errorMessage,
            });
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Get pending orders count
     */
    async updatePendingCount(): Promise<void> {
        const stats = await offlineStorage.getStats();
        this.updateState({ pendingOrders: stats.pendingOrders });
    }

    // ========================================================================
    // AUTO-SYNC
    // ========================================================================

    startAutoSync(): void {
        if (this.syncTimer) {
            return; // Already running
        }

        console.log(`[SyncService] Starting auto-sync (interval: ${this.config.syncInterval}ms)`);
        this.syncTimer = setInterval(() => {
            if (this.state.isOnline && !this.isSyncing) {
                this.syncNow().catch((error) => {
                    console.error('[SyncService] Auto-sync error:', error);
                });
            }
        }, this.config.syncInterval);
    }

    stopAutoSync(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
            console.log('[SyncService] Auto-sync stopped');
        }
    }

    setConfig(config: Partial<SyncConfig>): void {
        this.config = { ...this.config, ...config };

        // Restart auto-sync if interval changed
        if (config.syncInterval && this.syncTimer) {
            this.stopAutoSync();
            if (this.config.autoSync) {
                this.startAutoSync();
            }
        }
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    /**
     * Clear all cached data
     */
    async clearCache(): Promise<void> {
        await offlineStorage.clearCache();
        console.log('[SyncService] Cache cleared');
    }

    /**
     * Get storage statistics
     */
    async getStats(): Promise<Awaited<ReturnType<typeof offlineStorage.getStats>>> {
        return await offlineStorage.getStats();
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const syncService = SyncService.getInstance();

// =============================================================================
// RE-EXPORT TYPES
// =============================================================================

export type { PendingOrder };
