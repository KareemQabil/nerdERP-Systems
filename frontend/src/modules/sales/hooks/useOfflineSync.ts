import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '@/lib/offline-storage';
import { orderService } from '@/services/order.service';
import { useFeedback } from '@/components/feedback';

export function useOfflineSync() {
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const { error: showErrorMsg } = useFeedback();

    const updateCount = useCallback(async () => {
        const orders = await offlineStorage.getPendingOrders();
        setPendingCount(orders.length);
    }, []);

    const syncOrders = useCallback(async () => {
        if (isSyncing) return;

        const orders = await offlineStorage.getPendingOrders();
        if (orders.length === 0) return;

        setIsSyncing(true);
        console.log(`[OfflineSync] Attempting to sync ${orders.length} orders...`);

        for (const order of orders) {
            try {
                await orderService.create(order.payload);
                await offlineStorage.removeOrder(order.id);
                console.log(`[OfflineSync] Order ${order.id} synced successfully.`);
            } catch (err) {
                console.error(`[OfflineSync] Failed to sync order ${order.id}:`, err);
                await offlineStorage.updateRetryCount(order.id);
            }
        }

        await updateCount();
        setIsSyncing(false);
    }, [isSyncing, updateCount]);

    useEffect(() => {
        updateCount();
    }, [updateCount]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (navigator.onLine) {
                syncOrders();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [syncOrders]);

    useEffect(() => {
        const handleOnline = () => {
            console.log('[OfflineSync] Browser back online, triggering sync...');
            syncOrders();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [syncOrders]);

    const saveFailedOrder = async (payload: any) => {
        await offlineStorage.saveOrder(payload);
        await updateCount();
        showErrorMsg('Order failed and saved locally. Will retry when online.');
    };

    return {
        pendingCount,
        isSyncing,
        syncOrders,
        saveFailedOrder
    };
}
