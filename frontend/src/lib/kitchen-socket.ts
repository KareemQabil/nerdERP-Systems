/**
 * Kitchen Socket Client
 *
 * Manages WebSocket connection for real-time kitchen order updates
 *
 * Events received (KDS):
 * - kitchen:ticket-created: New ticket sent to kitchen
 * - kitchen:item-updated: Item status changed (PREPARING, READY)
 * - kitchen:order-ready: Order is ready for pickup
 *
 * Events received (POS):
 * - kitchen:order-fired: POS notification that order was sent to kitchen
 * - kitchen:order-ready: POS notification that order is ready
 *
 * Events sent:
 * - subscribe:station: Subscribe to a kitchen station
 * - unsubscribe:station: Unsubscribe from station
 * - subscribe:order: Subscribe to order updates (for POS)
 * - update:item-status: Update item status (from KDS)
 */

import { io, Socket } from 'socket.io-client';

// =============================================================================
// TYPES
// =============================================================================

export type KitchenStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
export type KitchenStation = 'HOT_KITCHEN' | 'COLD_KITCHEN' | 'BAR' | 'DESSERT' | 'ALL';

export interface KitchenTicketItem {
    id: string;
    name: string;
    nameAr?: string;
    quantity: number;
    notes?: string;
    status: KitchenStatus;
    station: KitchenStation;
    modifiers?: Array<{
        name: string;
        quantity: number;
    }>;
}

export interface KitchenTicket {
    id: string;
    orderId: string;
    orderType: string;
    tableNumber?: string;
    items: KitchenTicketItem[];
    createdAt: string;
    firedAt: string;
}

export interface TicketCreatedEvent {
    ticketId: string;
    orderId: string;
    orderType: string;
    tableNumber?: string;
    items: KitchenTicketItem[];
    station: KitchenStation;
    createdAt: string;
    firedAt: string;
}

export interface ItemUpdatedEvent {
    ticketId: string;
    itemId: string;
    status: KitchenStatus;
    updatedAt: string;
}

export interface OrderFiredEvent {
    orderId: string;
    firedAt: string;
    itemCount: number;
}

export interface OrderReadyEvent {
    orderId: string;
    readyAt: string;
}

export interface KitchenEventCallbacks {
    onTicketCreated?: (event: TicketCreatedEvent) => void;
    onItemUpdated?: (event: ItemUpdatedEvent) => void;
    onOrderFired?: (event: OrderFiredEvent) => void;
    onOrderReady?: (event: OrderReadyEvent) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Error) => void;
}

// =============================================================================
// CLIENT CLASS
// =============================================================================

class KitchenSocketClient {
    private socket: Socket | null = null;
    private _isConnected = false;
    private readonly namespace = '/kitchen';

    /**
     * Connect to the kitchen WebSocket namespace
     */
    connect(callbacks?: KitchenEventCallbacks): void {
        if (this.socket?.connected) {
            console.log('[KitchenSocket] Already connected');
            return;
        }

        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        this.socket = io(`${baseURL}${this.namespace}`, {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        // Set up event listeners
        this.setupEventListeners(callbacks);
    }

    /**
     * Disconnect from the kitchen namespace
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this._isConnected = false;
        }
    }

    /**
     * Subscribe to a kitchen station (for KDS)
     * @param station The station to subscribe to
     */
    async subscribeToStation(station: KitchenStation): Promise<void> {
        if (!this.socket?.connected) {
            console.warn('[KitchenSocket] Not connected, cannot subscribe to station');
            return;
        }

        this.socket.emit('subscribe:station', { station }, (response: any) => {
            console.log('[KitchenSocket] Subscribed to station:', station, response);
        });
    }

    /**
     * Unsubscribe from a kitchen station
     * @param station The station to unsubscribe from
     */
    async unsubscribeFromStation(station: KitchenStation): Promise<void> {
        if (!this.socket?.connected) {
            return;
        }

        this.socket.emit('unsubscribe:station', { station });
    }

    /**
     * Subscribe to order updates (for POS)
     * @param orderId The order to subscribe to
     */
    async subscribeToOrder(orderId: string): Promise<void> {
        if (!this.socket?.connected) {
            console.warn('[KitchenSocket] Not connected, cannot subscribe to order');
            return;
        }

        this.socket.emit('subscribe:order', { orderId });
    }

    /**
     * Unsubscribe from order updates
     * @param orderId The order to unsubscribe from
     */
    async unsubscribeFromOrder(orderId: string): Promise<void> {
        if (!this.socket?.connected) {
            return;
        }

        this.socket.emit('unsubscribe:order', { orderId });
    }

    /**
     * Update item status (from KDS)
     * @param ticketId The ticket ID
     * @param itemId The item ID
     * @param status The new status
     */
    async updateItemStatus(ticketId: string, itemId: string, status: KitchenStatus): Promise<void> {
        if (!this.socket?.connected) {
            console.warn('[KitchenSocket] Not connected, cannot update item status');
            return;
        }

        this.socket.emit('update:item-status', { ticketId, itemId, status });
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
    private setupEventListeners(callbacks?: KitchenEventCallbacks): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('[KitchenSocket] Connected');
            this._isConnected = true;
            callbacks?.onConnected?.();
        });

        this.socket.on('disconnect', () => {
            console.log('[KitchenSocket] Disconnected');
            this._isConnected = false;
            callbacks?.onDisconnected?.();
        });

        this.socket.on('error', (error) => {
            console.error('[KitchenSocket] Error:', error);
            callbacks?.onError?.(error);
        });

        // Kitchen events
        this.socket.on('kitchen:ticket-created', (event: TicketCreatedEvent) => {
            console.log('[KitchenSocket] Ticket created:', event);
            callbacks?.onTicketCreated?.(event);
        });

        this.socket.on('kitchen:item-updated', (event: ItemUpdatedEvent) => {
            console.log('[KitchenSocket] Item updated:', event);
            callbacks?.onItemUpdated?.(event);
        });

        this.socket.on('kitchen:order-fired', (event: OrderFiredEvent) => {
            console.log('[KitchenSocket] Order fired:', event);
            callbacks?.onOrderFired?.(event);
        });

        this.socket.on('kitchen:order-ready', (event: OrderReadyEvent) => {
            console.log('[KitchenSocket] Order ready:', event);
            callbacks?.onOrderReady?.(event);
        });
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const kitchenSocket = new KitchenSocketClient();

// =============================================================================
