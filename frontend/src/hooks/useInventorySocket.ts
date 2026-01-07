/**
 * useInventorySocket Hook
 *
 * Manages inventory WebSocket connection for real-time stock updates in POS
 *
 * Usage:
 * ```tsx
 * const { isConnected, subscribeToWarehouse } = useInventorySocket({
 *   onStockChanged: (event) => {
 *     // Update product stock in UI
 *   }
 * });
 *
 * useEffect(() => {
 *   subscribeToWarehouse(currentWarehouseId);
 * }, [currentWarehouseId, subscribeToWarehouse]);
 * ```
 */
import { useEffect, useCallback, useRef } from 'react';
import { inventorySocket, type InventoryEventCallbacks } from '@/lib/inventory-socket';
import { useSession } from '@/stores/session.store';

// =============================================================================
// TYPES
// =============================================================================

export interface UseInventorySocketOptions extends Partial<InventoryEventCallbacks> {
    /** Auto-connect on mount */
    autoConnect?: boolean;
}

export interface UseInventorySocketReturn {
    /** Whether connected to the inventory namespace */
    isConnected: boolean;
    /** Subscribe to warehouse updates */
    subscribeToWarehouse: (warehouseId: string) => Promise<void>;
    /** Unsubscribe from warehouse updates */
    unsubscribeFromWarehouse: (warehouseId: string) => Promise<void>;
    /** Subscribe to product updates */
    subscribeToProduct: (productId: string) => Promise<void>;
    /** Unsubscribe from product updates */
    unsubscribeFromProduct: (productId: string) => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for real-time inventory updates via WebSocket
 */
export function useInventorySocket(
    options: UseInventorySocketOptions = {},
): UseInventorySocketReturn {
    const { autoConnect = true, onStockChanged, onBatchUpdated, onAlertCreated, onAlertResolved } = options;

    const { warehouseId } = useSession();
    const currentWarehouseRef = useRef<string | null>(null);

    // Store callbacks in refs to avoid reconnection on every render
    const callbacksRef = useRef({
        onStockChanged,
        onBatchUpdated,
        onAlertCreated,
        onAlertResolved,
    });

    // Keep refs updated
    callbacksRef.current = {
        onStockChanged,
        onBatchUpdated,
        onAlertCreated,
        onAlertResolved,
    };

    // Connect to the inventory namespace
    useEffect(() => {
        if (!autoConnect) return;

        const callbacks: InventoryEventCallbacks = {
            onStockChanged: (event) => {
                callbacksRef.current.onStockChanged?.(event);
            },
            onBatchUpdated: (event) => {
                callbacksRef.current.onBatchUpdated?.(event);
            },
            onAlertCreated: (event) => {
                callbacksRef.current.onAlertCreated?.(event);
            },
            onAlertResolved: (event) => {
                callbacksRef.current.onAlertResolved?.(event);
            },
        };

        inventorySocket.connect(callbacks);

        return () => {
            inventorySocket.disconnect();
        };
    }, [autoConnect]); // Only reconnect when autoConnect changes

    // Auto-subscribe to warehouse when it changes
    useEffect(() => {
        if (!warehouseId || warehouseId === currentWarehouseRef.current) {
            return;
        }

        // Unsubscribe from previous warehouse
        if (currentWarehouseRef.current) {
            inventorySocket.unsubscribeFromWarehouse(currentWarehouseRef.current);
        }

        // Subscribe to new warehouse
        inventorySocket.subscribeToWarehouse(warehouseId);
        currentWarehouseRef.current = warehouseId;
    }, [warehouseId]);

    const subscribeToWarehouse = useCallback(async (warehouseId: string) => {
        await inventorySocket.subscribeToWarehouse(warehouseId);
    }, []);

    const unsubscribeFromWarehouse = useCallback(async (warehouseId: string) => {
        await inventorySocket.unsubscribeFromWarehouse(warehouseId);
    }, []);

    const subscribeToProduct = useCallback(async (productId: string) => {
        await inventorySocket.subscribeToProduct(productId);
    }, []);

    const unsubscribeFromProduct = useCallback(async (productId: string) => {
        await inventorySocket.unsubscribeFromProduct(productId);
    }, []);

    return {
        isConnected: inventorySocket.connected,
        subscribeToWarehouse,
        unsubscribeFromWarehouse,
        subscribeToProduct,
        unsubscribeFromProduct,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useInventorySocket;
