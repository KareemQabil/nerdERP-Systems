/**
 * useDeliverySocket Hook
 *
 * Manages delivery WebSocket connection for real-time delivery updates
 *
 * Usage in Delivery Dashboard:
 * ```tsx
 * const { isConnected, lastMessage } = useDeliverySocket(storeId, {
 *   onOrderCreated: (event) => {
 *     // Add new order to dashboard
 *   },
 *   onDriverAssigned: (event) => {
 *     // Update driver assignment
 *   }
 * });
 * ```
 */
import { useEffect, useState } from 'react';
import {
    deliverySocket,
    type DeliveryEventCallbacks,
} from '@/lib/delivery-socket';

// =============================================================================
// TYPES
// =============================================================================

export interface UseDeliverySocketOptions extends Partial<DeliveryEventCallbacks> {
    /** Auto-connect on mount */
    autoConnect?: boolean;
}

export interface UseDeliverySocketReturn {
    /** Whether connected to the delivery namespace */
    isConnected: boolean;
    /** Last received message */
    lastMessage:
        | {
              type: 'order-created' | 'driver-assigned' | 'status-updated' | 'driver-location';
              data: any;
          }
        | null;
}

// Union type for all delivery events
export type DeliveryUpdateEvent =
    | { type: 'order-created'; data: import('@/lib/delivery-socket').OrderCreatedEvent }
    | { type: 'driver-assigned'; data: import('@/lib/delivery-socket').DriverAssignedEvent }
    | { type: 'status-updated'; data: import('@/lib/delivery-socket').StatusUpdatedEvent }
    | { type: 'driver-location'; data: import('@/lib/delivery-socket').DriverLocationEvent };

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for real-time delivery updates via WebSocket
 */
export function useDeliverySocket(
    storeId: string,
    options: UseDeliverySocketOptions = {},
): UseDeliverySocketReturn {
    const { autoConnect = true, onOrderCreated, onDriverAssigned, onStatusUpdated, onDriverLocation } = options;
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<DeliveryUpdateEvent | null>(null);

    // Connect to the delivery namespace
    useEffect(() => {
        if (!autoConnect || !storeId) return;

        const callbacks: DeliveryEventCallbacks = {
            onConnected: () => {
                setIsConnected(true);
            },
            onDisconnected: () => {
                setIsConnected(false);
            },
            onOrderCreated: (event) => {
                setLastMessage({ type: 'order-created', data: event });
                onOrderCreated?.(event);
            },
            onDriverAssigned: (event) => {
                setLastMessage({ type: 'driver-assigned', data: event });
                onDriverAssigned?.(event);
            },
            onStatusUpdated: (event) => {
                setLastMessage({ type: 'status-updated', data: event });
                onStatusUpdated?.(event);
            },
            onDriverLocation: (event) => {
                setLastMessage({ type: 'driver-location', data: event });
                onDriverLocation?.(event);
            },
        };

        deliverySocket.connect(storeId, callbacks);

        return () => {
            deliverySocket.disconnect();
            setIsConnected(false);
        };
    }, [autoConnect, storeId, onOrderCreated, onDriverAssigned, onStatusUpdated, onDriverLocation]);

    return {
        isConnected,
        lastMessage,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useDeliverySocket;
