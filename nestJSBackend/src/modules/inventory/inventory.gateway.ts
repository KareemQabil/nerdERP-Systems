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
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { InventoryService } from './services/inventory.service';

/**
 * Inventory WebSocket Gateway
 *
 * Handles real-time inventory updates for POS and other clients
 *
 * Namespace: /inventory
 *
 * Events (Server → Client):
 * - inventory:stock-changed: Stock quantity changed for a product
 * - inventory:batch-updated: Batch quality/status updated
 * - inventory:alert-created: New stock alert created
 * - inventory:alert-resolved: Stock alert resolved
 *
 * Events (Client → Server):
 * - subscribe:warehouse: Subscribe to inventory updates for a warehouse
 * - unsubscribe:warehouse: Unsubscribe from warehouse updates
 * - subscribe:product: Subscribe to updates for a specific product
 * - unsubscribe:product: Unsubscribe from product updates
 */
@WebSocketGateway({
    namespace: '/inventory',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class InventoryGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(InventoryGateway.name);
    private readonly warehouseSubscriptions = new Map<string, Set<string>>();
    private readonly productSubscriptions = new Map<string, Set<string>>();

    constructor(
        @Inject(forwardRef(() => InventoryService))
        private readonly inventoryService: InventoryService,
    ) { }

    async handleConnection(client: Socket) {
        this.logger.debug(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        this.logger.debug(`Client disconnected: ${client.id}`);

        // Remove client from all subscriptions
        for (const [warehouseId, clients] of this.warehouseSubscriptions.entries()) {
            clients.delete(client.id);
            if (clients.size === 0) {
                this.warehouseSubscriptions.delete(warehouseId);
            }
        }

        for (const [productId, clients] of this.productSubscriptions.entries()) {
            clients.delete(client.id);
            if (clients.size === 0) {
                this.productSubscriptions.delete(productId);
            }
        }
    }

    // ==================== CLIENT → SERVER EVENTS ====================

    /**
     * Subscribe to inventory updates for a warehouse
     * Used by POS to receive stock updates for their location
     */
    @SubscribeMessage('subscribe:warehouse')
    async handleSubscribeToWarehouse(
        @MessageBody() data: { warehouseId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { warehouseId } = data;

        if (!this.warehouseSubscriptions.has(warehouseId)) {
            this.warehouseSubscriptions.set(warehouseId, new Set());
        }

        this.warehouseSubscriptions.get(warehouseId)!.add(client.id);

        // Join socket.io room for the warehouse
        await client.join(`warehouse:${warehouseId}`);

        // Send current inventory summary for the warehouse
        try {
            const summary = await this.inventoryService.getInventorySummary(warehouseId);
            client.emit('inventory:initial-summary', { warehouseId, summary });
        } catch (error) {
            this.logger.error(`Failed to send inventory summary for warehouse ${warehouseId}:`, error);
        }

        this.logger.debug(`Client ${client.id} subscribed to warehouse ${warehouseId}`);
        return { event: 'subscribed', warehouseId };
    }

    /**
     * Unsubscribe from warehouse updates
     */
    @SubscribeMessage('unsubscribe:warehouse')
    async handleUnsubscribeFromWarehouse(
        @MessageBody() data: { warehouseId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { warehouseId } = data;

        this.warehouseSubscriptions.get(warehouseId)?.delete(client.id);
        await client.leave(`warehouse:${warehouseId}`);

        this.logger.debug(`Client ${client.id} unsubscribed from warehouse ${warehouseId}`);
        return { event: 'unsubscribed', warehouseId };
    }

    /**
     * Subscribe to updates for a specific product
     * Used to track stock changes for specific items
     */
    @SubscribeMessage('subscribe:product')
    async handleSubscribeToProduct(
        @MessageBody() data: { productId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { productId } = data;

        if (!this.productSubscriptions.has(productId)) {
            this.productSubscriptions.set(productId, new Set());
        }

        this.productSubscriptions.get(productId)!.add(client.id);
        await client.join(`product:${productId}`);

        this.logger.debug(`Client ${client.id} subscribed to product ${productId}`);
        return { event: 'subscribed', productId };
    }

    /**
     * Unsubscribe from product updates
     */
    @SubscribeMessage('unsubscribe:product')
    async handleUnsubscribeFromProduct(
        @MessageBody() data: { productId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { productId } = data;

        this.productSubscriptions.get(productId)?.delete(client.id);
        await client.leave(`product:${productId}`);

        this.logger.debug(`Client ${client.id} unsubscribed from product ${productId}`);
        return { event: 'unsubscribed', productId };
    }

    // ==================== SERVER → CLIENT BROADCAST METHODS ====================

    /**
     * Broadcast stock change event
     * Called after any stock operation (add, deduct, adjust)
     *
     * @param warehouseId The warehouse where stock changed
     * @param productId The product that changed
     * @param newQuantity The new available quantity
     * @param operation The type of operation (IN, OUT, ADJUSTMENT)
     */
    broadcastStockChanged(
        warehouseId: string,
        productId: string,
        newQuantity: number,
        operation: 'IN' | 'OUT' | 'ADJUSTMENT',
    ) {
        this.server.to(`warehouse:${warehouseId}`).emit('inventory:stock-changed', {
            warehouseId,
            productId,
            newQuantity: newQuantity.toString(),
            operation,
            timestamp: new Date().toISOString(),
        });

        this.server.to(`product:${productId}`).emit('inventory:stock-changed', {
            warehouseId,
            productId,
            newQuantity: newQuantity.toString(),
            operation,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast batch update event
     * Called when batch quality or status changes
     */
    broadcastBatchUpdated(
        warehouseId: string,
        batchId: string,
        productId: string,
        qualityStatus: string,
    ) {
        this.server.to(`warehouse:${warehouseId}`).emit('inventory:batch-updated', {
            warehouseId,
            batchId,
            productId,
            qualityStatus,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast alert created event
     */
    broadcastAlertCreated(alert: {
        id: string;
        productId: string;
        warehouseId: string;
        alertType: string;
        currentQty: string;
    }) {
        this.server.to(`warehouse:${alert.warehouseId}`).emit('inventory:alert-created', {
            ...alert,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast alert resolved event
     */
    broadcastAlertResolved(
        warehouseId: string,
        alertId: string,
        productId: string,
    ) {
        this.server.to(`warehouse:${warehouseId}`).emit('inventory:alert-resolved', {
            alertId,
            productId,
            warehouseId,
            timestamp: new Date().toISOString(),
        });
    }
}
