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
 * Delivery WebSocket Gateway
 *
 * Handles real-time delivery updates
 *
 * Namespace: /delivery
 *
 * Events (Server → Client):
 * - delivery:order-created: New delivery order created
 * - delivery:driver-assigned: Driver assigned to order
 * - delivery:status-updated: Delivery status changed
 * - delivery:driver-location: Driver location updated
 *
 * This gateway broadcasts updates to all connected clients (Dashboard, Driver App, POS, etc.)
 */
@WebSocketGateway({
    namespace: '/delivery',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class DeliveryGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(DeliveryGateway.name);

    afterInit(server: Server) {
        this.logger.log('Delivery WebSocket Gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.debug(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.debug(`Client disconnected: ${client.id}`);
    }

    // ==================== SERVER → CLIENT BROADCAST METHODS ====================

    /**
     * Broadcast new delivery order created
     */
    broadcastOrderCreated(data: {
        orderId: string;
        orderNumber: string;
        customerName: string;
        customerPhone?: string;
        deliveryAddress: string;
        zoneId: string;
        estimatedTime: number;
        createdAt: Date;
    }) {
        this.server.emit('delivery:order-created', {
            ...data,
            timestamp: new Date(),
        });
        this.logger.debug(`Delivery order created: ${data.orderNumber}`);
    }

    /**
     * Broadcast driver assignment
     */
    broadcastDriverAssigned(data: {
        orderId: string;
        orderNumber: string;
        driverId: string;
        driverName: string;
        driverPhone?: string;
        assignedAt: Date;
    }) {
        this.server.emit('delivery:driver-assigned', {
            ...data,
            timestamp: new Date(),
        });
        this.logger.debug(`Driver assigned: ${data.driverName} → ${data.orderNumber}`);
    }

    /**
     * Broadcast delivery status update
     */
    broadcastStatusUpdated(data: {
        orderId: string;
        orderNumber: string;
        status: string;
        location?: { lat: number; lng: number };
        timestamp: Date;
    }) {
        this.server.emit('delivery:status-updated', {
            ...data,
        });
        this.logger.debug(`Delivery status updated: ${data.orderNumber} → ${data.status}`);
    }

    /**
     * Broadcast driver location update
     */
    broadcastDriverLocation(data: {
        driverId: string;
        orderId: string;
        location: { lat: number; lng: number };
        timestamp: Date;
    }) {
        this.server.emit('delivery:driver-location', {
            ...data,
        });
        // Don't log location updates to avoid spam
    }
}
