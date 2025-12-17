import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SalesOrder, OrderStatus, PaymentStatus } from '../types/order.types';

/**
 * Held Order Interface
 * Orders temporarily saved for later completion
 */
export interface HeldOrder {
    id: string;
    order: Partial<SalesOrder>;
    cartSnapshot: any; // Cart items at time of hold
    heldAt: string; // ISO 8601
    heldBy: string; // User ID
    reason?: string;
}

/**
 * Order Store Interface
 * Manages current order state and held orders
 */
interface OrderStore {
    // State
    currentOrder: Partial<SalesOrder> | null;
    heldOrders: HeldOrder[];
    isProcessing: boolean;

    // Actions
    createDraftOrder: (orderData: Partial<SalesOrder>) => void;
    updateOrder: (updates: Partial<SalesOrder>) => void;
    clearCurrentOrder: () => void;

    // Held orders
    holdCurrentOrder: (reason?: string) => void;
    retrieveHeldOrder: (heldOrderId: string) => void;
    deleteHeldOrder: (heldOrderId: string) => void;
    getAllHeldOrders: () => HeldOrder[];

    // Order completion
    finalizeOrder: (orderId: string) => Promise<void>;
    voidOrder: (orderId: string, reason: string) => Promise<void>;
}

/**
 * Order Store
 * CRITICAL: Requires AuthStore (cashier) and RegisterStore (open session)
 * Manages order lifecycle: draft → held → finalized
 */
export const useOrderStore = create<OrderStore>()(
    devtools(
        (set, get) => ({
            // Initial state
            currentOrder: null,
            heldOrders: [],
            isProcessing: false,

            // Create draft order
            createDraftOrder: (orderData) => {
                const draftOrder: Partial<SalesOrder> = {
                    id: `draft-${Date.now()}`,
                    orderStatus: 'DRAFT',
                    paymentStatus: 'UNPAID',
                    createdAt: new Date().toISOString(),
                    ...orderData,
                };

                set({ currentOrder: draftOrder });
            },

            // Update current order
            updateOrder: (updates) => {
                const { currentOrder } = get();
                if (!currentOrder) return;

                set({
                    currentOrder: {
                        ...currentOrder,
                        ...updates,
                        updatedAt: new Date().toISOString(),
                    },
                });
            },

            // Clear current order
            clearCurrentOrder: () => {
                set({ currentOrder: null });
            },

            // Hold current order
            holdCurrentOrder: (reason) => {
                const { currentOrder, heldOrders } = get();
                if (!currentOrder) return;

                // Get current user from AuthStore
                // In real implementation: const { user } = useAuthStore.getState();
                const userId = 'user-001'; // Mock

                const heldOrder: HeldOrder = {
                    id: `held-${Date.now()}`,
                    order: currentOrder,
                    cartSnapshot: null, // Would include cart items
                    heldAt: new Date().toISOString(),
                    heldBy: userId,
                    reason,
                };

                set({
                    heldOrders: [...heldOrders, heldOrder],
                    currentOrder: null,
                });
            },

            // Retrieve held order
            retrieveHeldOrder: (heldOrderId) => {
                const { heldOrders } = get();
                const heldOrder = heldOrders.find(h => h.id === heldOrderId);

                if (heldOrder) {
                    set({
                        currentOrder: heldOrder.order,
                        heldOrders: heldOrders.filter(h => h.id !== heldOrderId),
                    });
                }
            },

            // Delete held order
            deleteHeldOrder: (heldOrderId) => {
                const { heldOrders } = get();
                set({
                    heldOrders: heldOrorders.filter(h => h.id !== heldOrderId),
                });
            },

            // Get all held orders
            getAllHeldOrders: () => {
                return get().heldOrders;
            },

            // Finalize order (submit to backend)
            finalizeOrder: async (orderId) => {
                set({ isProcessing: true });

                try {
                    // CRITICAL CHECKS:
                    // 1. Check AuthStore - must have logged-in user
                    // 2. Check RegisterStore - session must be open

                    // In real implementation:
                    // const { user } = useAuthStore.getState();
                    // const { isSessionOpen } = useRegisterStore.getState();
                    // if (!user) throw new Error('No cashier logged in');
                    // if (!isSessionOpen) throw new Error('Register session not open');

                    // Mock API call
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const { currentOrder } = get();
                    if (!currentOrder) throw new Error('No current order');

                    // Update order status
                    set({
                        currentOrder: {
                            ...currentOrder,
                            orderStatus: 'COMPLETED',
                            paymentStatus: 'PAID',
                            completedAt: new Date().toISOString(),
                        },
                        isProcessing: false,
                    });

                    // Print receipt
                    // await PrintService.printReceipt(receiptData);

                    // Update register balance
                    // useRegisterStore.getState().updateSessionBalance(total, paymentMethod);

                } catch (error) {
                    set({ isProcessing: false });
                    throw error;
                }
            },

            // Void order (requires manager authorization)
            voidOrder: async (orderId, reason) => {
                set({ isProcessing: true });

                try {
                    // CRITICAL: Requires manager permission
                    // const { user } = useAuthStore.getState();
                    // if (!user.hasPermission('orders:void')) {
                    //   throw new Error('Insufficient permissions');
                    // }

                    // Mock API call
                    await new Promise(resolve => setTimeout(resolve, 300));

                    const { currentOrder } = get();
                    if (!currentOrder) throw new Error('No current order');

                    set({
                        currentOrder: {
                            ...currentOrder,
                            orderStatus: 'VOID',
                            voidedAt: new Date().toISOString(),
                            voidReason: reason,
                        },
                        isProcessing: false,
                    });
                } catch (error) {
                    set({ isProcessing: false });
                    throw error;
                }
            },
        }),
        { name: 'order-store' }
    )
);
