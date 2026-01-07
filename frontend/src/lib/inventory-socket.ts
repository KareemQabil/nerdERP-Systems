/**
 * Inventory Socket Client
 *
 * Manages WebSocket connection for real-time inventory updates
 *
 * Events received:
 * - inventory:initial-summary: Initial inventory data for subscribed warehouse
 * - inventory:stock-changed: Stock quantity changed for a product
 * - inventory:batch-updated: Batch quality/status changed
 * - inventory:alert-created: New stock alert
 * - inventory:alert-resolved: Stock alert resolved
 *
 * Events sent:
 * - subscribe:warehouse: Subscribe to warehouse updates
 * - unsubscribe:warehouse: Unsubscribe from warehouse
 * - subscribe:product: Subscribe to product updates
 * - unsubscribe:product: Unsubscribe from product
 */

import { io, Socket } from 'socket.io-client';

// =============================================================================
// TYPES
// =============================================================================

export interface StockChangedEvent {
    warehouseId: string;
    productId: string;
    newQuantity: string;
    operation: 'IN' | 'OUT' | 'ADJUSTMENT';
    timestamp: string;
}

export interface BatchUpdatedEvent {
    warehouseId: string;
    batchId: string;
    productId: string;
    qualityStatus: string;
    timestamp: string;
}

export interface AlertCreatedEvent {
    id: string;
    productId: string;
    productName?: string;
    warehouseId: string;
    alertType: string;
    currentQty: string;
    timestamp: string;
}

export interface AlertResolvedEvent {
    alertId: string;
    productId: string;
    warehouseId: string;
    timestamp: string;
}

export interface InventoryEventCallbacks {
    onStockChanged?: (event: StockChangedEvent) => void;
    onBatchUpdated?: (event: BatchUpdatedEvent) => void;
    onAlertCreated?: (event: AlertCreatedEvent) => void;
    onAlertResolved?: (event: AlertResolvedEvent) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Error) => void;
}

// =============================================================================
// CLIENT CLASS
// =============================================================================

class InventorySocketClient {
    private socket: Socket | null = null;
    private isConnected = false;
    private readonly namespace = '/inventory';

    /**
     * Connect to the inventory WebSocket namespace
     */
    connect(callbacks?: InventoryEventCallbacks): void {
        if (this.socket?.connected) {
            console.log('[InventorySocket] Already connected');
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
     * Disconnect from the inventory namespace
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    /**
     * Subscribe to inventory updates for a warehouse
     * @param warehouseId The warehouse to subscribe to
     */
    async subscribeToWarehouse(warehouseId: string): Promise<void> {
        if (!this.socket?.connected) {
            console.warn('[InventorySocket] Not connected, cannot subscribe to warehouse');
            return;
        }

        this.socket.emit('subscribe:warehouse', { warehouseId }, (response: any) => {
            console.log('[InventorySocket] Subscribed to warehouse:', warehouseId, response);
        });
    }

    /**
     * Unsubscribe from warehouse updates
     * @param warehouseId The warehouse to unsubscribe from
     */
    async unsubscribeFromWarehouse(warehouseId: string): Promise<void> {
        if (!this.socket?.connected) {
            return;
        }

        this.socket.emit('unsubscribe:warehouse', { warehouseId });
    }

    /**
     * Subscribe to updates for a specific product
     * @param productId The product to subscribe to
     */
    async subscribeToProduct(productId: string): Promise<void> {
        if (!this.socket?.connected) {
            console.warn('[InventorySocket] Not connected, cannot subscribe to product');
            return;
        }

        this.socket.emit('subscribe:product', { productId });
    }

    /**
     * Unsubscribe from product updates
     * @param productId The product to unsubscribe from
     */
    async unsubscribeFromProduct(productId: string): Promise<void> {
        if (!this.socket?.connected) {
            return;
        }

        this.socket.emit('unsubscribe:product', { productId });
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
    private setupEventListeners(callbacks?: InventoryEventCallbacks): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('[InventorySocket] Connected');
            this.isConnected = true;
            callbacks?.onConnected?.();
        });

        this.socket.on('disconnect', () => {
            console.log('[InventorySocket] Disconnected');
            this.isConnected = false;
            callbacks?.onDisconnected?.();
        });

        this.socket.on('error', (error) => {
            console.error('[InventorySocket] Error:', error);
            callbacks?.onError?.(error);
        });

        // Inventory events
        this.socket.on('inventory:stock-changed', (event: StockChangedEvent) => {
            console.log('[InventorySocket] Stock changed:', event);
            callbacks?.onStockChanged?.(event);
        });

        this.socket.on('inventory:batch-updated', (event: BatchUpdatedEvent) => {
            console.log('[InventorySocket] Batch updated:', event);
            callbacks?.onBatchUpdated?.(event);
        });

        this.socket.on('inventory:alert-created', (event: AlertCreatedEvent) => {
            console.log('[InventorySocket] Alert created:', event);
            callbacks?.onAlertCreated?.(event);
        });

        this.socket.on('inventory:alert-resolved', (event: AlertResolvedEvent) => {
            console.log('[InventorySocket] Alert resolved:', event);
            callbacks?.onAlertResolved?.(event);
        });

        this.socket.on('inventory:initial-summary', (data: any) => {
            console.log('[InventorySocket] Initial summary received:', data);
        });
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const inventorySocket = new InventorySocketClient();

// =============================================================================
