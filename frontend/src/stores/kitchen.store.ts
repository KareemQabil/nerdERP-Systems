/**
 * Kitchen Store
 *
 * State management for the Kitchen Display System (KDS)
 *
 * Uses Zustand with devtools and persistence
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
    KitchenTicket,
    KitchenTicketItem,
    KitchenStation,
    KitchenStatus,
} from '@/lib/kitchen-socket';

// Re-export types for consumers
export type { KitchenTicket, KitchenTicketItem, KitchenStation, KitchenStatus };

// =============================================================================
// TYPES
// =============================================================================

export interface KitchenTicketWithId extends KitchenTicket {
    localId?: string; // For local identification
}

interface KitchenState {
    // State
    tickets: KitchenTicketWithId[];
    selectedStation: KitchenStation;
    isConnected: boolean;

    // Actions
    setSelectedStation: (station: KitchenStation) => void;
    setConnected: (connected: boolean) => void;

    // Ticket Actions
    addTicket: (ticket: KitchenTicketWithId) => void;
    updateTicket: (ticketId: string, updates: Partial<KitchenTicketWithId>) => void;
    removeTicket: (ticketId: string) => void;
    clearCompletedTickets: () => void;

    // Item Actions
    updateItemStatus: (ticketId: string, itemId: string, status: KitchenStatus) => void;

    // Computed
    getTicketsByStation: (station: KitchenStation) => KitchenTicketWithId[];
    getPendingCount: (station?: KitchenStation) => number;
    getPreparingCount: (station?: KitchenStation) => number;
    getReadyCount: (station?: KitchenStation) => number;
}

// =============================================================================
// STORE
// =============================================================================

export const useKitchenStore = create<KitchenState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial State
                tickets: [],
                selectedStation: 'ALL',
                isConnected: false,

                // Actions
                setSelectedStation: (station) => set({ selectedStation: station }),
                setConnected: (connected) => set({ isConnected: connected }),

                // Ticket Actions
                addTicket: (ticket) =>
                    set((state) => ({
                        tickets: [...state.tickets, { ...ticket, localId: `${ticket.id}-${Date.now()}` }],
                    })),

                updateTicket: (ticketId, updates) =>
                    set((state) => ({
                        tickets: state.tickets.map((t) =>
                            t.id === ticketId ? { ...t, ...updates } : t
                        ),
                    })),

                removeTicket: (ticketId) =>
                    set((state) => ({
                        tickets: state.tickets.filter((t) => t.id !== ticketId),
                    })),

                clearCompletedTickets: () =>
                    set((state) => ({
                        tickets: state.tickets.filter((t) =>
                            t.items.some((item) => item.status !== 'READY' && item.status !== 'SERVED')
                        ),
                    })),

                // Item Actions
                updateItemStatus: (ticketId, itemId, status) =>
                    set((state) => ({
                        tickets: state.tickets.map((ticket) =>
                            ticket.id === ticketId
                                ? {
                                    ...ticket,
                                    items: ticket.items.map((item) =>
                                        item.id === itemId ? { ...item, status } : item
                                    ),
                                }
                                : ticket
                        ),
                    })),

                // Computed
                getTicketsByStation: (station) => {
                    const state = get();
                    if (station === 'ALL') {
                        return state.tickets;
                    }
                    return state.tickets.filter((ticket) =>
                        ticket.items.some((item) => item.station === station)
                    );
                },

                getPendingCount: (station) => {
                    const state = get();
                    const tickets = station && station !== 'ALL'
                        ? state.tickets.filter((t) =>
                            t.items.some((item) => item.station === station)
                        )
                        : state.tickets;

                    return tickets.reduce(
                        (count, ticket) =>
                            count +
                            ticket.items.filter(
                                (item) => item.status === 'PENDING'
                            ).length,
                        0
                    );
                },

                getPreparingCount: (station) => {
                    const state = get();
                    const tickets = station && station !== 'ALL'
                        ? state.tickets.filter((t) =>
                            t.items.some((item) => item.station === station)
                        )
                        : state.tickets;

                    return tickets.reduce(
                        (count, ticket) =>
                            count +
                            ticket.items.filter(
                                (item) => item.status === 'PREPARING'
                            ).length,
                        0
                    );
                },

                getReadyCount: (station) => {
                    const state = get();
                    const tickets = station && station !== 'ALL'
                        ? state.tickets.filter((t) =>
                            t.items.some((item) => item.station === station)
                        )
                        : state.tickets;

                    return tickets.reduce(
                        (count, ticket) =>
                            count +
                            ticket.items.filter(
                                (item) => item.status === 'READY'
                            ).length,
                        0
                    );
                },
            }),
            {
                name: 'kitchen-store',
                // Only persist selected station, not the tickets (they come from WebSocket)
                partialize: (state) => ({
                    selectedStation: state.selectedStation,
                }),
            }
        )
    )
);

// =============================================================================
// EXPORTS
// =============================================================================

export default useKitchenStore;
