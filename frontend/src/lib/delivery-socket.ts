/**
 * Delivery Socket Client
 *
 * Manages WebSocket connection for real-time delivery order updates
 *
 * Events received:
 * - delivery:order-created: New delivery order created
 * - delivery:driver-assigned: Driver assigned to order
 * - delivery:status-updated: Order status updated
 * - delivery:driver-location: Driver location updated
 *
 * Events sent:
 * - subscribe:store: Subscribe to store delivery updates
 * - unsubscribe:store: Unsubscribe from store
 * - assign-driver: Assign driver to order
 * - update-status: Update delivery status
 */

import { io, Socket } from 'socket.io-client';

// =============================================================================
// TYPES
// =============================================================================

export type DeliveryStatus =
    | 'PENDING'
    | 'ASSIGNED'
    | 'OUT_FOR_DELIVERY'
    | 'READY_FOR_PICKUP'
    | 'COMPLETED'
    | 'CANCELLED';

export type DriverStatus = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';

export interface DeliveryDriver {
    id: string;
    name: string;
    phone?: string;
    status: DriverStatus;
    currentOrderId?: string;
    activeOrdersCount: number;
    completedTodayCount: number;
}

export interface DeliveryOrder {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    address: string;
    zoneCode: string;
    zoneName: string;
    deliveryFee: number;
    status: DeliveryStatus;
    driverId?: string;
    driverName?: string;
    estimatedMinutes?: number;
    createdAt: string;
    assignedAt?: string;
    outForDeliveryAt?: string;
}

export interface OrderCreatedEvent {
    orderId: string;
    orderNumber: string;
    customerName: string;
    address: string;
    zoneCode: string;
    createdAt: string;
}

export interface DriverAssignedEvent {
    orderId: string;
    driverId: string;
    driverName: string;
    assignedAt: string;
}

export interface StatusUpdatedEvent {
    orderId: string;
    status: DeliveryStatus;
    updatedAt: string;
    note?: string;
}

export interface DriverLocationEvent {
    driverId: string;
    orderId: string;
    latitude: number;
    longitude: number;
    timestamp: string;
}

export interface DeliveryEventCallbacks {
    onOrderCreated?: (event: OrderCreatedEvent) => void;
    onDriverAssigned?: (event: DriverAssignedEvent) => void;
    onStatusUpdated?: (event: StatusUpdatedEvent) => void;
    onDriverLocation?: (event: DriverLocationEvent) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Error) => void;
}

// =============================================================================
// CLIENT CLASS
// =============================================================================

class DeliverySocketClient {
    private socket: Socket | null = null;
    private _isConnected = false;
    private readonly namespace = '/delivery';

    /**
     * Connect to the delivery WebSocket namespace
     */
    connect(storeId: string, callbacks?: DeliveryEventCallbacks): void {
        if (this.socket?.connected) {
            console.log('[DeliverySocket] Already connected');
            return;
        }

        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        this.socket = io(`${baseURL}${this.namespace}`, {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
            query: { storeId },
        });

        // Set up event listeners
        this.setupEventListeners(callbacks);
    }

    /**
     * Disconnect from the delivery namespace
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this._isConnected = false;
        }
    }

    /**
     * Subscribe to store delivery updates
     * @param storeId The store to subscribe to
     */
    async subscribeToStore(storeId: string): Promise<void> {
        if (!this.socket?.connected) {
            console.warn('[DeliverySocket] Not connected, cannot subscribe to store');
            return;
        }

        this.socket.emit('subscribe:store', { storeId }, (response: any) => {
            console.log('[DeliverySocket] Subscribed to store:', storeId, response);
        });
    }

    /**
     * Unsubscribe from store updates
     * @param storeId The store to unsubscribe from
     */
    async unsubscribeFromStore(storeId: string): Promise<void> {
        if (!this.socket?.connected) {
            return;
        }

        this.socket.emit('unsubscribe:store', { storeId });
    }

    /**
     * Assign driver to order
     * @param orderId The order ID
     * @param driverId The driver ID
     */
    async assignDriver(orderId: string, driverId: string): Promise<void> {
        if (!this.socket?.connected) {
            console.warn('[DeliverySocket] Not connected, cannot assign driver');
            return;
        }

        this.socket.emit('assign-driver', { orderId, driverId });
    }

    /**
     * Update delivery status
     * @param orderId The order ID
     * @param status The new status
     * @param note Optional note
     */
    async updateStatus(orderId: string, status: DeliveryStatus, note?: string): Promise<void> {
        if (!this.socket?.connected) {
            console.warn('[DeliverySocket] Not connected, cannot update status');
            return;
        }

        this.socket.emit('update-status', { orderId, status, note });
    }

    /**
     * Check if connected
     */
    get connected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Set up event listeners
     */
    private setupEventListeners(callbacks?: DeliveryEventCallbacks): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('[DeliverySocket] Connected');
            this._isConnected = true;
            callbacks?.onConnected?.();
        });

        this.socket.on('disconnect', () => {
            console.log('[DeliverySocket] Disconnected');
            this._isConnected = false;
            callbacks?.onDisconnected?.();
        });

        this.socket.on('error', (error) => {
            console.error('[DeliverySocket] Error:', error);
            callbacks?.onError?.(error);
        });

        // Delivery events
        this.socket.on('delivery:order-created', (event: OrderCreatedEvent) => {
            console.log('[DeliverySocket] Order created:', event);
            callbacks?.onOrderCreated?.(event);
        });

        this.socket.on('delivery:driver-assigned', (event: DriverAssignedEvent) => {
            console.log('[DeliverySocket] Driver assigned:', event);
            callbacks?.onDriverAssigned?.(event);
        });

        this.socket.on('delivery:status-updated', (event: StatusUpdatedEvent) => {
            console.log('[DeliverySocket] Status updated:', event);
            callbacks?.onStatusUpdated?.(event);
        });

        this.socket.on('delivery:driver-location', (event: DriverLocationEvent) => {
            callbacks?.onDriverLocation?.(event);
        });
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const deliverySocket = new DeliverySocketClient();
