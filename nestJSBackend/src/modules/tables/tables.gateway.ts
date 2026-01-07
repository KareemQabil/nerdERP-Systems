import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Tables WebSocket Gateway
 *
 * Handles real-time table and zone updates
 *
 * Namespace: /tables
 *
 * Events (Server → Client):
 * - table:updated: Table details changed (position, seats, shape, etc.)
 * - table:status-changed: Table status changed (AVAILABLE, OCCUPIED, RESERVED, etc.)
 * - zone:updated: Zone details changed
 * - table:created: New table created
 * - table:deleted: Table deleted
 *
 * This gateway broadcasts updates to all connected clients (POS, KDS, Floor Plan, etc.)
 */
@WebSocketGateway({
    namespace: '/tables',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class TablesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(TablesGateway.name);

    afterInit(server: Server) {
        this.logger.log('Tables WebSocket Gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.debug(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.debug(`Client disconnected: ${client.id}`);
    }

    // ==================== SERVER → CLIENT BROADCAST METHODS ====================

    /**
     * Broadcast table update
     * Called when table details are modified (position, seats, shape, zone, etc.)
     */
    broadcastTableUpdated(data: {
        tableId: string;
        zoneId?: string;
        tableNumber: string;
        status: string;
        seats?: number;
        shape?: string;
        position?: { x: number; y: number };
    }) {
        this.server.emit('table:updated', {
            ...data,
            timestamp: new Date(),
        });
        this.logger.debug(`Table ${data.tableId} updated`);
    }

    /**
     * Broadcast table status change
     * Called when table status changes (AVAILABLE → OCCUPIED → AVAILABLE)
     */
    broadcastTableStatusChanged(data: {
        tableId: string;
        status: string;
        orderId?: string;
        customerCount?: number;
    }) {
        this.server.emit('table:status-changed', {
            ...data,
            timestamp: new Date(),
        });
        this.logger.debug(`Table ${data.tableId} status changed to ${data.status}`);
    }

    /**
     * Broadcast zone update
     * Called when zone details are modified (name, priority, etc.)
     */
    broadcastZoneUpdated(data: {
        zoneId: string;
        name: string;
        nameAr?: string;
        priority: number;
    }) {
        this.server.emit('zone:updated', {
            ...data,
            timestamp: new Date(),
        });
        this.logger.debug(`Zone ${data.zoneId} updated`);
    }

    /**
     * Broadcast table creation
     * Called when a new table is created
     */
    broadcastTableCreated(data: {
        tableId: string;
        zoneId: string;
        tableNumber: string;
        seats: number;
        shape: string;
        position: { x: number; y: number };
        status: string;
    }) {
        this.server.emit('table:created', {
            ...data,
            timestamp: new Date(),
        });
        this.logger.debug(`Table ${data.tableId} created`);
    }

    /**
     * Broadcast table deletion
     * Called when a table is deleted
     */
    broadcastTableDeleted(data: {
        tableId: string;
    }) {
        this.server.emit('table:deleted', {
            ...data,
            timestamp: new Date(),
        });
        this.logger.debug(`Table ${data.tableId} deleted`);
    }
}
