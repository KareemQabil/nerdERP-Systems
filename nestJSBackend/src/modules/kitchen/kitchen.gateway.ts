import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { KitchenService } from './services/kitchen.service';
import { KitchenTicket, TicketStatus } from './entities/kitchen-ticket.entity';

/**
 * Kitchen WebSocket Gateway
 *
 * Handles real-time communication between:
 * - POS: Sends orders to kitchen, receives status updates
 * - KDS (Kitchen Display System): Subscribes to station updates, updates item status
 *
 * Namespace: /kitchen
 *
 * Events (Server → Client):
 * - kitchen.ticket.created: New ticket created for a station
 * - kitchen.item.updated: Ticket item status changed
 * - kitchen.ticket.ready: All items in ticket are ready
 * - kitchen.ticket.bumped: Ticket completed/bumped
 * - kitchen.order.status: Order status changed (FIRED → PREPARING → READY)
 *
 * Events (Client → Server):
 * - subscribe:station: Subscribe to updates for a specific station
 * - unsubscribe:station: Unsubscribe from station updates
 * - update:item-status: Update ticket item status (PREPARING/READY)
 * - bump:ticket: Complete/bump a ticket
 */
@WebSocketGateway({
    namespace: '/kitchen',
    cors: {
        origin: '*', // Configure based on your frontend URL
        credentials: true,
    },
})
export class KitchenGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(KitchenGateway.name);
    private readonly stationSubscriptions = new Map<string, Set<string>>();
    private readonly orderSubscriptions = new Map<string, Set<string>>();

    constructor(private readonly kitchenService: KitchenService) { }

    async handleConnection(client: Socket) {
        this.logger.debug(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        this.logger.debug(`Client disconnected: ${client.id}`);

        // Remove client from all subscriptions
        for (const [stationId, clients] of this.stationSubscriptions.entries()) {
            clients.delete(client.id);
            if (clients.size === 0) {
                this.stationSubscriptions.delete(stationId);
            }
        }

        for (const [orderId, clients] of this.orderSubscriptions.entries()) {
            clients.delete(client.id);
            if (clients.size === 0) {
                this.orderSubscriptions.delete(orderId);
            }
        }
    }

    // ==================== CLIENT → SERVER EVENTS ====================

    /**
     * Subscribe to updates for a specific kitchen station
     * Used by KDS displays to receive tickets for their station
     */
    @SubscribeMessage('subscribe:station')
    async handleSubscribeToStation(
        @MessageBody() data: { stationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { stationId } = data;

        if (!this.stationSubscriptions.has(stationId)) {
            this.stationSubscriptions.set(stationId, new Set());
        }

        this.stationSubscriptions.get(stationId)!.add(client.id);

        // Join socket.io room for the station
        await client.join(`station:${stationId}`);

        // Send current active tickets for the station
        const tickets = await this.kitchenService.getTicketsForStation(stationId, true);
        client.emit('kitchen:initial-tickets', { stationId, tickets });

        this.logger.debug(`Client ${client.id} subscribed to station ${stationId}`);
        return { event: 'subscribed', stationId };
    }

    /**
     * Unsubscribe from a kitchen station
     */
    @SubscribeMessage('unsubscribe:station')
    async handleUnsubscribeFromStation(
        @MessageBody() data: { stationId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { stationId } = data;

        this.stationSubscriptions.get(stationId)?.delete(client.id);
        await client.leave(`station:${stationId}`);

        this.logger.debug(`Client ${client.id} unsubscribed from station ${stationId}`);
        return { event: 'unsubscribed', stationId };
    }

    /**
     * Subscribe to updates for a specific order
     * Used by POS to track order kitchen status
     */
    @SubscribeMessage('subscribe:order')
    async handleSubscribeToOrder(
        @MessageBody() data: { orderId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { orderId } = data;

        if (!this.orderSubscriptions.has(orderId)) {
            this.orderSubscriptions.set(orderId, new Set());
        }

        this.orderSubscriptions.get(orderId)!.add(client.id);
        await client.join(`order:${orderId}`);

        this.logger.debug(`Client ${client.id} subscribed to order ${orderId}`);
        return { event: 'subscribed', orderId };
    }

    /**
     * Update ticket item status
     * Used by KDS to mark items as PREPARING or READY
     */
    @SubscribeMessage('update:item-status')
    async handleUpdateItemStatus(
        @MessageBody() data: {
            ticketItemId: string;
            status: 'PREPARING' | 'READY';
            userId: string;
        },
    ) {
        try {
            const updatedItem = await this.kitchenService.updateTicketItemStatus(
                data.ticketItemId,
                data.status,
                data.userId,
            );

            // Broadcast to station subscribers
            this.server.to(`station:${updatedItem.ticket.station?.id}`).emit('kitchen:item-updated', {
                ticketItemId: updatedItem.id,
                status: data.status,
                isPrepared: updatedItem.isPrepared,
                preparedAt: updatedItem.preparedAt,
            });

            // If item ready, broadcast to order subscribers
            if (data.status === 'READY') {
                this.server.to(`order:${updatedItem.ticket.orderId}`).emit('kitchen:order-item-ready', {
                    orderItemId: updatedItem.orderItemId,
                    ticketItemId: updatedItem.id,
                    productName: updatedItem.productName,
                });
            }

            this.logger.debug(`Item ${updatedItem.id} status updated to ${data.status}`);
            return { event: 'item-updated', ticketItemId: updatedItem.id, status: data.status };
        } catch (error) {
            this.logger.error(`Error updating item status: ${error.message}`);
            return { event: 'error', message: error.message };
        }
    }

    /**
     * Bump a ticket (mark as complete)
     */
    @SubscribeMessage('bump:ticket')
    async handleBumpTicket(
        @MessageBody() data: {
            ticketId: string;
            userId: string;
        },
    ) {
        try {
            const ticket = await this.kitchenService.bumpTicket(data.ticketId, {
                userId: data.userId,
            });

            // Broadcast to station
            this.server.to(`station:${ticket.station?.id}`).emit('kitchen:ticket-bumped', {
                ticketId: ticket.id,
                bumpedAt: ticket.bumpedAt,
                bumpedBy: data.userId,
            });

            this.logger.debug(`Ticket ${ticket.id} bumped`);
            return { event: 'ticket-bumped', ticketId: ticket.id };
        } catch (error) {
            this.logger.error(`Error bumping ticket: ${error.message}`);
            return { event: 'error', message: error.message };
        }
    }

    // ==================== SERVER → CLIENT BROADCAST METHODS ====================

    /**
     * Broadcast new ticket to station subscribers
     * Called after fireOrderToKitchen creates tickets
     */
    broadcastTicketCreated(ticket: KitchenTicket) {
        this.server.to(`station:${ticket.station?.id}`).emit('kitchen:ticket-created', {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            orderNumber: ticket.orderNumber,
            orderId: ticket.orderId,
            stationId: ticket.station?.id,
            status: ticket.status,
            priority: ticket.priority,
            sentAt: ticket.sentAt,
            items: ticket.items?.map((item) => ({
                id: item.id,
                orderItemId: item.orderItemId,
                productName: item.productName,
                quantity: item.quantity,
                modifiers: item.modifiers,
                notes: item.notes,
            })),
        });

        // Also notify order subscribers
        this.server.to(`order:${ticket.orderId}`).emit('kitchen:order-fired', {
            orderId: ticket.orderId,
            ticketId: ticket.id,
            stationId: ticket.station?.id,
            ticketNumber: ticket.ticketNumber,
        });
    }

    /**
     * Broadcast ticket ready event
     */
    broadcastTicketReady(ticketId: string, stationId: string, orderId: string) {
        this.server.to(`station:${stationId}`).emit('kitchen:ticket-ready', {
            ticketId,
        });

        this.server.to(`order:${orderId}`).emit('kitchen:order-ready', {
            orderId,
            ticketId,
        });
    }

    /**
     * Broadcast order status change
     */
    broadcastOrderStatus(orderId: string, status: string) {
        this.server.to(`order:${orderId}`).emit('kitchen:order-status', {
            orderId,
            status,
        });
    }
}
