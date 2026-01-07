import { io, Socket } from 'socket.io-client';

/**
 * Config Socket Client
 * Manages WebSocket connection to /config namespace for real-time updates
 */
class ConfigSocket {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    /**
     * Connect to the config WebSocket namespace
     */
    connect() {
        if (this.socket?.connected) return;

        const serverUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

        this.socket = io(`${serverUrl}/config`, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
            console.log('[ConfigSocket] Connected');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', () => {
            console.log('[ConfigSocket] Disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('[ConfigSocket] Connection error:', error);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('[ConfigSocket] Max reconnection attempts reached');
                this.socket?.disconnect();
            }
        });
    }

    /**
     * Disconnect from the config WebSocket namespace
     */
    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    /**
     * Subscribe to store configuration updates
     */
    subscribe(storeId: string) {
        this.socket?.emit('subscribe:store', { storeId });
    }

    /**
     * Unsubscribe from store configuration updates
     */
    unsubscribe(storeId: string) {
        this.socket?.emit('unsubscribe:store', { storeId });
    }

    /**
     * Register event listener
     */
    on(event: string, callback: (...args: any[]) => void) {
        this.socket?.on(event, callback);
    }

    /**
     * Remove event listener
     */
    off(event: string, callback: (...args: any[]) => void) {
        this.socket?.off(event, callback);
    }

    /**
     * Emit event to server
     */
    emit(event: string, data?: any) {
        this.socket?.emit(event, data);
    }
}

export const configSocket = new ConfigSocket();
