import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'nerdpos-offline';
const STORE_NAME = 'pending-orders';
const VERSION = 1;

export interface PendingOrder {
    id: string; // Temporary UUID
    payload: any;
    timestamp: number;
    retryCount: number;
}

export class OfflineStorage {
    private db: Promise<IDBPDatabase>;

    constructor() {
        this.db = openDB(DB_NAME, VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            },
        });
    }

    async saveOrder(order: any): Promise<string> {
        const id = crypto.randomUUID();
        const pendingOrder: PendingOrder = {
            id,
            payload: order,
            timestamp: Date.now(),
            retryCount: 0,
        };
        const db = await this.db;
        await db.put(STORE_NAME, pendingOrder);
        return id;
    }

    async getPendingOrders(): Promise<PendingOrder[]> {
        const db = await this.db;
        return db.getAll(STORE_NAME);
    }

    async removeOrder(id: string): Promise<void> {
        const db = await this.db;
        await db.delete(STORE_NAME, id);
    }

    async updateRetryCount(id: string): Promise<void> {
        const db = await this.db;
        const order = await db.get(STORE_NAME, id);
        if (order) {
            order.retryCount += 1;
            await db.put(STORE_NAME, order);
        }
    }
}

export const offlineStorage = new OfflineStorage();
