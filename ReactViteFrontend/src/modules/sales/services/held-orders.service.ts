import type { CartItem } from '../store/cartStore';

const STORAGE_KEY = 'POS_HELD_ORDERS';

export interface HeldOrder {
    id: string;
    items: CartItem[];
    totalAmount: number;
    subtotal: number;
    taxAmount: number;
    heldAt: string; // ISO Date
    referenceNote?: string; // "Table 5" or Customer Name
}

export class HeldOrdersService {
    /**
     * Get all held orders from localStorage
     */
    static getHeldOrders(): HeldOrder[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const orders = JSON.parse(raw);
                console.log('📋 [HELD] Retrieved orders:', orders.length);
                return orders;
            }
        } catch (error) {
            console.error('❌ [HELD] Error reading held orders:', error);
        }
        return [];
    }

    /**
     * Save held orders to localStorage
     */
    private static saveHeldOrders(orders: HeldOrder[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
            console.log('💾 [HELD] Saved orders:', orders.length);
        } catch (error) {
            console.error('❌ [HELD] Error saving held orders:', error);
        }
    }

    /**
     * Hold a new order
     */
    static holdOrder(
        items: CartItem[],
        totalAmount: number,
        subtotal: number,
        taxAmount: number,
        referenceNote?: string
    ): HeldOrder {
        const newHeldOrder: HeldOrder = {
            id: `held-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            items,
            totalAmount,
            subtotal,
            taxAmount,
            heldAt: new Date().toISOString(),
            referenceNote,
        };

        const currentOrders = this.getHeldOrders();
        const updatedOrders = [newHeldOrder, ...currentOrders];
        this.saveHeldOrders(updatedOrders);

        console.log('✅ [HELD] Order held:', {
            id: newHeldOrder.id,
            reference: referenceNote,
            items: items.length,
            total: totalAmount,
        });

        return newHeldOrder;
    }

    /**
     * Restore a held order (retrieve it for editing)
     */
    static restoreOrder(id: string): HeldOrder | null {
        const currentOrders = this.getHeldOrders();
        const order = currentOrders.find((o) => o.id === id);

        if (order) {
            console.log('🔄 [HELD] Restoring order:', order.referenceNote || order.id);
            // Note: We don't delete it here - let the UI decide when to delete
            return order;
        }

        console.warn('⚠️ [HELD] Order not found:', id);
        return null;
    }

    /**
     * Delete a held order
     */
    static deleteOrder(id: string): boolean {
        const currentOrders = this.getHeldOrders();
        const filteredOrders = currentOrders.filter((o) => o.id !== id);

        if (filteredOrders.length < currentOrders.length) {
            this.saveHeldOrders(filteredOrders);
            console.log('🗑️ [HELD] Order deleted:', id);
            return true;
        }

        console.warn('⚠️ [HELD] Order not found for deletion:', id);
        return false;
    }

    /**
     * Get count of held orders
     */
    static getHeldOrdersCount(): number {
        return this.getHeldOrders().length;
    }

    /**
     * Clear all held orders (for admin/testing)
     */
    static clearAllHeldOrders(): void {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ [HELD] All held orders cleared');
    }
}
