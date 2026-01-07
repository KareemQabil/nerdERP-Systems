/**
 * useKitchenSocket Hook
 *
 * Manages kitchen WebSocket connection for real-time order updates
 *
 * Usage in KDS:
 * ```tsx
 * const { isConnected, subscribeToStation, updateItemStatus } = useKitchenSocket({
 *   onTicketCreated: (event) => {
 *     // Add ticket to KDS display
 *   }
 * });
 * ```
 *
 * Usage in POS:
 * ```tsx
 * const { isConnected, subscribeToOrder } = useKitchenSocket({
 *   onOrderFired: (event) => {
 *     // Show notification
 *   }
 * });
 * ```
 */
import { useEffect, useCallback } from 'react';
import { kitchenSocket, type KitchenEventCallbacks, type KitchenStation, type KitchenStatus } from '@/lib/kitchen-socket';

// =============================================================================
// TYPES
// =============================================================================

export interface UseKitchenSocketOptions extends Partial<KitchenEventCallbacks> {
    /** Auto-connect on mount */
    autoConnect?: boolean;
}

export interface UseKitchenSocketReturn {
    /** Whether connected to the kitchen namespace */
    isConnected: boolean;
    /** Subscribe to a kitchen station (for KDS) */
    subscribeToStation: (station: KitchenStation) => Promise<void>;
    /** Unsubscribe from a kitchen station */
    unsubscribeFromStation: (station: KitchenStation) => Promise<void>;
    /** Subscribe to order updates (for POS) */
    subscribeToOrder: (orderId: string) => Promise<void>;
    /** Unsubscribe from order updates */
    unsubscribeFromOrder: (orderId: string) => Promise<void>;
    /** Update item status (from KDS) */
    updateItemStatus: (ticketId: string, itemId: string, status: KitchenStatus) => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for real-time kitchen updates via WebSocket
 */
export function useKitchenSocket(
    options: UseKitchenSocketOptions = {},
): UseKitchenSocketReturn {
    const { autoConnect = true, onTicketCreated, onItemUpdated, onOrderFired, onOrderReady } = options;

    // Connect to the kitchen namespace
    useEffect(() => {
        if (!autoConnect) return;

        const callbacks: KitchenEventCallbacks = {
            onTicketCreated: (event) => {
                onTicketCreated?.(event);
            },
            onItemUpdated: (event) => {
                onItemUpdated?.(event);
            },
            onOrderFired: (event) => {
                onOrderFired?.(event);
            },
            onOrderReady: (event) => {
                onOrderReady?.(event);
            },
        };

        kitchenSocket.connect(callbacks);

        return () => {
            kitchenSocket.disconnect();
        };
    }, [autoConnect, onTicketCreated, onItemUpdated, onOrderFired, onOrderReady]);

    const subscribeToStation = useCallback(async (station: KitchenStation) => {
        await kitchenSocket.subscribeToStation(station);
    }, []);

    const unsubscribeFromStation = useCallback(async (station: KitchenStation) => {
        await kitchenSocket.unsubscribeFromStation(station);
    }, []);

    const subscribeToOrder = useCallback(async (orderId: string) => {
        await kitchenSocket.subscribeToOrder(orderId);
    }, []);

    const unsubscribeFromOrder = useCallback(async (orderId: string) => {
        await kitchenSocket.unsubscribeFromOrder(orderId);
    }, []);

    const updateItemStatus = useCallback(async (ticketId: string, itemId: string, status: KitchenStatus) => {
        await kitchenSocket.updateItemStatus(ticketId, itemId, status);
    }, []);

    return {
        isConnected: kitchenSocket.connected,
        subscribeToStation,
        unsubscribeFromStation,
        subscribeToOrder,
        unsubscribeFromOrder,
        updateItemStatus,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useKitchenSocket;
