import { io, Socket } from 'socket.io-client';

// Types
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'DIRTY' | 'CLEANING';

export interface TableUpdatedEvent {
    tableId: string;
    zoneId?: string;
    tableNumber: string;
    status: TableStatus;
    seats?: number;
    shape?: string;
    position?: { x: number; y: number };
    timestamp: Date;
}

export interface TableStatusChangedEvent {
    tableId: string;
    status: TableStatus;
    orderId?: string;
    customerCount?: number;
    timestamp?: Date;
}

export interface ZoneUpdatedEvent {
    zoneId: string;
    name: string;
    nameAr?: string;
    priority: number;
    timestamp?: Date;
}

export interface TableCreatedEvent {
    tableId: string;
    zoneId: string;
    tableNumber: string;
    seats: number;
    shape: string;
    position: { x: number; y: number };
    status: TableStatus;
    timestamp?: Date;
}

export interface TableDeletedEvent {
    tableId: string;
    timestamp?: Date;
}

export interface TablesEventCallbacks {
    onTableUpdated?: (event: TableUpdatedEvent) => void;
    onTableStatusChanged?: (event: TableStatusChangedEvent) => void;
    onZoneUpdated?: (event: ZoneUpdatedEvent) => void;
    onTableCreated?: (event: TableCreatedEvent) => void;
    onTableDeleted?: (event: TableDeletedEvent) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
}

// Singleton class
class TablesSocketClass {
    private socket: Socket | null = null;
    private _connected = false;
    private callbacks: TablesEventCallbacks = {};

    get connected() {
        return this._connected && this.socket?.connected;
    }

    connect(callbacks: TablesEventCallbacks = {}) {
        if (this.socket?.connected) return;

        this.callbacks = callbacks;

        this.socket = io('/tables', {
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            this._connected = true;
            this.callbacks.onConnected?.();
        });

        this.socket.on('disconnect', () => {
            this._connected = false;
            this.callbacks.onDisconnected?.();
        });

        this.socket.on('table:updated', (event: TableUpdatedEvent) => {
            this.callbacks.onTableUpdated?.(event);
        });

        this.socket.on('table:status-changed', (event: TableStatusChangedEvent) => {
            this.callbacks.onTableStatusChanged?.(event);
        });

        this.socket.on('zone:updated', (event: ZoneUpdatedEvent) => {
            this.callbacks.onZoneUpdated?.(event);
        });

        this.socket.on('table:created', (event: TableCreatedEvent) => {
            this.callbacks.onTableCreated?.(event);
        });

        this.socket.on('table:deleted', (event: TableDeletedEvent) => {
            this.callbacks.onTableDeleted?.(event);
        });
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
        this._connected = false;
    }
}

export const tablesSocket = new TablesSocketClass();
