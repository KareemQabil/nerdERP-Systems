import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConfigInitService } from './services/config-init.service';

/**
 * Config WebSocket Gateway
 * Broadcasts configuration updates in real-time to all connected clients
 *
 * Namespace: /config
 *
 * Events (Server → Client):
 * - config.updated: Full config object updated
 * - config.theme.updated: Theme changed
 * - config.translations.updated: Translations changed
 * - config.features.updated: Feature flags changed
 *
 * Events (Client → Server):
 * - subscribe:store: Subscribe to store config updates
 */
@WebSocketGateway({
    namespace: '/config',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class ConfigGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ConfigGateway.name);
    private readonly storeSubscribers = new Map<string, Set<string>>();

    constructor(private readonly configInitService: ConfigInitService) {}

    async handleConnection(client: Socket) {
        this.logger.debug(`Config client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        this.logger.debug(`Config client disconnected: ${client.id}`);

        // Remove from all subscriptions
        for (const [storeId, clients] of this.storeSubscribers.entries()) {
            clients.delete(client.id);
            if (clients.size === 0) {
                this.storeSubscribers.delete(storeId);
            }
        }
    }

    // ==================== CLIENT → SERVER EVENTS ====================

    /**
     * Subscribe to store configuration updates
     */
    @SubscribeMessage('subscribe:store')
    async handleSubscribeToStore(
        @MessageBody() data: { storeId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { storeId } = data;

        if (!this.storeSubscribers.has(storeId)) {
            this.storeSubscribers.set(storeId, new Set());
        }

        this.storeSubscribers.get(storeId)!.add(client.id);
        await client.join(`store:${storeId}`);

        this.logger.debug(`Client ${client.id} subscribed to store ${storeId}`);
        return { event: 'subscribed', storeId };
    }

    /**
     * Unsubscribe from store configuration updates
     */
    @SubscribeMessage('unsubscribe:store')
    async handleUnsubscribeFromStore(
        @MessageBody() data: { storeId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { storeId } = data;

        this.storeSubscribers.get(storeId)?.delete(client.id);
        await client.leave(`store:${storeId}`);

        this.logger.debug(`Client ${client.id} unsubscribed from store ${storeId}`);
        return { event: 'unsubscribed', storeId };
    }

    // ==================== SERVER → CLIENT BROADCAST METHODS ====================

    /**
     * Broadcast full config update
     * Called when any configuration changes
     */
    broadcastConfigUpdate(storeId: string, languageCode?: string) {
        this.server.to(`store:${storeId}`).emit('config.updated', {
            storeId,
            timestamp: new Date().toISOString(),
            message: 'Configuration updated',
        });
    }

    /**
     * Broadcast theme update
     */
    broadcastThemeUpdate(storeId: string, theme: any) {
        this.server.to(`store:${storeId}`).emit('config.theme.updated', {
            storeId,
            theme,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast translation update
     */
    broadcastTranslationUpdate(storeId: string, languageCode: string) {
        this.server.to(`store:${storeId}`).emit('config.translations.updated', {
            storeId,
            languageCode,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast feature flag update
     */
    broadcastFeatureUpdate(storeId: string, featurePath: string, enabled: boolean) {
        this.server.to(`store:${storeId}`).emit('config.features.updated', {
            storeId,
            featurePath,
            enabled,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Broadcast tax configuration update
     */
    broadcastTaxUpdate(storeId: string) {
        this.server.to(`store:${storeId}`).emit('config.taxes.updated', {
            storeId,
            timestamp: new Date().toISOString(),
        });
    }
}
