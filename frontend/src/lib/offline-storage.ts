import { openDB, IDBPDatabase, DBSchema } from 'idb';

// =============================================================================
// Types
// =============================================================================

export interface PendingOrder {
    id: string; // Temporary UUID
    payload: any;
    timestamp: number;
    retryCount: number;
    syncedAt?: number;
    lastError?: string;
}

export interface ProductCache {
    products: any[];
    categories: any[];
    cachedAt: number;
}

// =============================================================================
// Database Schema
// =============================================================================

const schema: DBSchema = {
    name: 'nerdpos-offline',
    version: 2, // Incremented version for new stores
    stores: {
        'pending-orders': {
            keyPath: 'id',
            autoIncrement: false,
        },
        'product-cache': {
            keyPath: 'id',
            autoIncrement: false,
        },
        'category-cache': {
            keyPath: 'id',
            autoIncrement: false,
        },
        'cache-metadata': {
            keyPath: 'key',
            autoIncrement: false,
        },
    },
};

const DB_NAME = 'nerdpos-offline';
const VERSION = 2; // Incremented from 1

// =============================================================================
// Storage Class
// =============================================================================

export class OfflineStorage {
    private db: Promise<IDBPDatabase<typeof schema>>;

    constructor() {
        this.db = openDB(DB_NAME, VERSION, {
            upgrade(db, oldVersion, newVersion) {
                // Create pending-orders store (existing)
                if (!db.objectStoreNames.contains('pending-orders')) {
                    db.createObjectStore('pending-orders', { keyPath: 'id' });
                }

                // Create new stores for v2
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains('product-cache')) {
                        db.createObjectStore('product-cache', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('category-cache')) {
                        db.createObjectStore('category-cache', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('cache-metadata')) {
                        db.createObjectStore('cache-metadata', { keyPath: 'key' });
                    }
                }
            },
        });
    }

    // ==================== ORDERS ====================

    async saveOrder(order: any): Promise<string> {
        const id = crypto.randomUUID();
        const pendingOrder: PendingOrder = {
            id,
            payload: order,
            timestamp: Date.now(),
            retryCount: 0,
        };
        const db = await this.db;
        await db.put('pending-orders', pendingOrder);
        return id;
    }

    async getPendingOrders(): Promise<PendingOrder[]> {
        const db = await this.db;
        return await db.getAll('pending-orders');
    }

    async removeOrder(id: string): Promise<void> {
        const db = await this.db;
        await db.delete('pending-orders', id);
    }

    async updateRetryCount(id: string): Promise<void> {
        const db = await this.db;
        const order = await db.get('pending-orders', id);
        if (order) {
            order.retryCount += 1;
            await db.put('pending-orders', order);
        }
    }

    async markOrderSynced(id: string, orderId: string): Promise<void> {
        const db = await this.db;
        const order = await db.get('pending-orders', id);
        if (order) {
            order.syncedAt = Date.now();
            order.lastError = undefined;
            await db.put('pending-orders', order);
            console.log(`[OfflineStorage] Order synced: ${id} -> ${orderId}`);
        }
    }

    async markOrderFailed(id: string, error: string): Promise<void> {
        const db = await this.db;
        const order = await db.get('pending-orders', id);
        if (order) {
            order.lastError = error;
            order.retryCount += 1;
            await db.put('pending-orders', order);
            console.error(`[OfflineStorage] Order failed: ${id} - ${error}`);
        }
    }

    // ==================== PRODUCT CACHE ====================

    async cacheProducts(products: any[], categories: any[]): Promise<void> {
        const db = await this.db;
        const tx = db.transaction(['product-cache', 'category-cache', 'cache-metadata'], 'readwrite');

        // Clear existing cache
        await tx.objectStore('product-cache').clear();
        await tx.objectStore('category-cache').clear();

        // Add products and categories
        for (const product of products) {
            await tx.objectStore('product-cache').put(product);
        }
        for (const category of categories) {
            await tx.objectStore('category-cache').put(category);
        }

        // Update metadata
        await tx.objectStore('cache-metadata').put({
            key: 'product-cache',
            productsCount: products.length,
            categoriesCount: categories.length,
            cachedAt: Date.now(),
        });

        await tx.done;
        console.log(`[OfflineStorage] Cached ${products.length} products and ${categories.length} categories`);
    }

    async getProductCache(): Promise<{ products: any[]; categories: any[] } | null> {
        try {
            const db = await this.db;
            const [products, categories, metadata] = await Promise.all([
                db.getAll('product-cache'),
                db.getAll('category-cache'),
                db.get('cache-metadata', 'product-cache'),
            ]);

            if (!metadata || products.length === 0) {
                return null;
            }

            // Check if cache is recent (less than 1 hour old)
            const cacheAge = Date.now() - (metadata.cachedAt || 0);
            if (cacheAge > 60 * 60 * 1000) {
                console.log('[OfflineStorage] Product cache is stale');
                return null;
            }

            return { products, categories };
        } catch (error) {
            console.error('[OfflineStorage] Failed to get product cache:', error);
            return null;
        }
    }

    async getProductById(id: string): Promise<any | null> {
        try {
            const db = await this.db;
            return await db.get('product-cache', id) || null;
        } catch {
            return null;
        }
    }

    // ==================== CLEARING DATA ====================

    async clearCache(): Promise<void> {
        const db = await this.db;
        const tx = db.transaction(['product-cache', 'category-cache', 'cache-metadata'], 'readwrite');
        await tx.objectStore('product-cache').clear();
        await tx.objectStore('category-cache').clear();
        await tx.objectStore('cache-metadata').clear();
        await tx.done;
        console.log('[OfflineStorage] Cleared product cache');
    }

    async getStats(): Promise<{
        pendingOrders: number;
        cachedProducts: number;
        cachedCategories: number;
    }> {
        const db = await this.db;
        const [pendingOrders, cachedProducts, cachedCategories] = await Promise.all([
            db.count('pending-orders'),
            db.count('product-cache'),
            db.count('category-cache'),
        ]);

        return { pendingOrders, cachedProducts, cachedCategories };
    }
}

export const offlineStorage = new OfflineStorage();
