import { useEffect } from 'react';
import { tablesSocket, type TablesEventCallbacks } from '@/lib/tables-socket';

export interface UseTablesSocketOptions extends Partial<TablesEventCallbacks> {
    autoConnect?: boolean;
}

export interface UseTablesSocketReturn {
    isConnected: boolean;
}

/**
 * Hook to connect to Tables WebSocket for real-time table and zone updates
 *
 * @example
 * const { isConnected } = useTablesSocket({
 *   autoConnect: true,
 *   onTableUpdated: (event) => {
 *     console.log('Table updated:', event);
 *   },
 *   onTableStatusChanged: (event) => {
 *     // Update local table status
 *     updateTableStatus(event.tableId, event.status);
 *   },
 * });
 */
export function useTablesSocket(
    options: UseTablesSocketOptions = {},
): UseTablesSocketReturn {
    const { autoConnect = true, onTableUpdated, onTableStatusChanged, onZoneUpdated, onTableCreated, onTableDeleted } = options;

    useEffect(() => {
        if (!autoConnect) return;

        const callbacks: TablesEventCallbacks = {
            onConnected: () => {
                console.log('[TablesSocket] Connected');
            },
            onDisconnected: () => {
                console.log('[TablesSocket] Disconnected');
            },
            onTableUpdated,
            onTableStatusChanged,
            onZoneUpdated,
            onTableCreated,
            onTableDeleted,
        };

        tablesSocket.connect(callbacks);

        return () => {
            tablesSocket.disconnect();
        };
    }, [autoConnect, onTableUpdated, onTableStatusChanged, onZoneUpdated, onTableCreated, onTableDeleted]);

    return {
        isConnected: tablesSocket.connected || false,
    };
}

export default useTablesSocket;
