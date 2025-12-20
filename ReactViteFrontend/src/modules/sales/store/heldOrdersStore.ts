import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import type { CartItem } from './cartStore';
import type { OrderType } from '../types/order.types';

/**
 * HeldOrdersStore - Smart Order Parking System (Phase 4)
 * 
 * PURPOSE:
 * - Preserve cart state across sessions (table switching, customer interruptions)
 * - CRITICAL: Maintain SENT status of kitchen items (prevent duplicate cooking)
 * 
 * CONTEXT PRESERVATION:
 * - Table ID + Name (for Dine-In)
 * - Customer Name (for Takeaway/Delivery reference)
 * - Exact item status (NEW → stays NEW, SENT → stays SENT)
 * 
 * STORAGE: localStorage via zustand persist middleware
 */

export interface HeldOrder {
    id: string; // UUID

    // Context Fields
    tableId?: string; // For DINE_IN orders
    tableName?: string; // Display: "Table 5"
    customerName?: string; // Optional reference for Takeaway/Delivery

    // Cart State (IMMUTABLE on resume)
    items: CartItem[]; // Including status: 'NEW' | 'SENT' | 'VOIDED'
    orderType: OrderType;

    // Metadata
    timestamp: number; // Date.now() - for sorting
    note?: string; // e.g., "Customer forgot wallet"
    parkedBy?: string; // User who held the order
}

interface HeldOrdersState {
    heldOrders: HeldOrder[];

    // Actions
    holdOrder: (
        items: CartItem[],
        orderType: OrderType,
        tableId?: string,
        tableName?: string,
        customerName?: string,
        note?: string
    ) => string; // Returns hold ID

    resumeOrder: (holdId: string) => HeldOrder | null;
    deleteHeldOrder: (holdId: string) => void;
    clearAllHeldOrders: () => void;

    // Queries
    getHeldOrderByTable: (tableId: string) => HeldOrder | null;
    getHeldOrdersByType: (orderType: OrderType) => HeldOrder[];
}

/**
 * 🛡️ CRITICAL RULE: The Context Preservation Rule
 * 
 * When resuming a held order:
 * 1. Items with status: 'SENT' MUST remain 'SENT'
 * 2. Items with status: 'VOIDED' MUST remain 'VOIDED'
 * 3. Only 'NEW' items can be modified after resume
 * 
 * WHY: Prevents duplicate kitchen tickets ("Double Cooking Prevention")
 * 
 * Example:
 * - Hold: [Burger (SENT), Fries (NEW)]
 * - Resume: [Burger (SENT), Fries (NEW)] ← Exact same
 * - Kitchen: Only receives ticket for Fries if cashier adds more items
 */

export const useHeldOrdersStore = create<HeldOrdersState>()(
    persist(
        (set, get) => ({
            heldOrders: [],

            /**
             * Hold Order Action
             * Saves current cart state with full context
             */
            holdOrder: (items, orderType, tableId, tableName, customerName, note) => {
                const holdId = crypto.randomUUID(); // Native browser API - no dependency needed

                const heldOrder: HeldOrder = {
                    id: holdId,
                    items: items.map(item => ({ ...item })), // Deep copy to prevent mutations
                    orderType,
                    tableId,
                    tableName,
                    customerName,
                    timestamp: Date.now(),
                    note,
                };

                set((state) => ({
                    heldOrders: [...state.heldOrders, heldOrder],
                }));

                console.log(`✅ [HeldOrdersStore] Order held:`, {
                    id: holdId,
                    type: orderType,
                    itemCount: items.length,
                    sentItems: items.filter(i => i.status === 'SENT').length,
                    tableId,
                    tableName,
                    customerName,
                });

                return holdId;
            },

            /**
             * Resume Order Action
             * Returns the held order WITHOUT modifying item statuses
             * 
             * CRITICAL: Caller must validate that items are copied AS-IS
             */
            resumeOrder: (holdId) => {
                const held = get().heldOrders.find(o => o.id === holdId);

                if (!held) {
                    toast.error('❌ Held order not found');
                    return null;
                }

                console.log(`🔄 [HeldOrdersStore] Resuming order:`, {
                    id: holdId,
                    type: held.orderType,
                    itemCount: held.items.length,
                    sentItems: held.items.filter(i => i.status === 'SENT').length,
                    tableId: held.tableId,
                    tableName: held.tableName,
                });

                // ⚠️ CRITICAL: Return items with ORIGINAL status preserved
                // The calling component MUST use these statuses as-is
                return held;
            },

            /**
             * Delete Held Order
             * Called after successful resume OR manual cancellation
             */
            deleteHeldOrder: (holdId) => {
                set((state) => ({
                    heldOrders: state.heldOrders.filter(o => o.id !== holdId),
                }));

                console.log(`🗑️ [HeldOrdersStore] Deleted held order: ${holdId}`);
            },

            /**
             * Clear All (Admin function)
             */
            clearAllHeldOrders: () => {
                set({ heldOrders: [] });
                toast.success('🗑️ All held orders cleared');
                console.log('🗑️ [HeldOrdersStore] All held orders cleared');
            },

            /**
             * Query: Get Held Order by Table ID
             * Returns the most recent order for this table
             */
            getHeldOrderByTable: (tableId) => {
                const orders = get().heldOrders.filter(o => o.tableId === tableId);

                if (orders.length === 0) return null;

                // Sort by timestamp DESC (most recent first)
                return orders.sort((a, b) => b.timestamp - a.timestamp)[0];
            },

            /**
             * Query: Get All Orders of a Specific Type
             */
            getHeldOrdersByType: (orderType) => {
                return get().heldOrders.filter(o => o.orderType === orderType);
            },
        }),
        {
            name: 'nerdpos-held-orders', // localStorage key
            version: 1,
        }
    )
);
