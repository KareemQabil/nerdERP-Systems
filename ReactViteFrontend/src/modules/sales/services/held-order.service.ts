import type { CartItem, OrderType, Table, Discount } from '../types/pos.types';

export interface HeldOrder {
    id: string;
    orderNumber: string;
    timestamp: Date;
    itemsCount: number;
    total: number;
    customerName?: string;
    items: CartItem[];
    orderType: OrderType;
    selectedTable?: Table;
    appliedDiscount?: { discount: Discount; value: number };
}

const STORAGE_KEY = 'pos_held_orders';

/**
 * Held Order Service
 * Manages holding and retrieving orders using LocalStorage
 */
export class HeldOrderService {
    /**
     * Hold an order for later retrieval
     */
    static async holdOrder(
        items: CartItem[],
        orderType: OrderType,
        selectedTable?: Table,
        appliedDiscount?: { discount: Discount; value: number },
        customerName?: string
    ): Promise<void> {
        const heldOrders = this.getHeldOrdersSync();

        const total = items.reduce((sum, item) => sum + item.total, 0);
        const tax = total * 0.15;
        const discountAmount = appliedDiscount
            ? (appliedDiscount.discount.type === 'percentage'
                ? (total * appliedDiscount.value) / 100
                : appliedDiscount.value)
            : 0;

        const orderNumber = `HOLD-${Date.now().toString().slice(-6)}`;

        const heldOrder: HeldOrder = {
            id: `held-${Date.now()}`,
            orderNumber,
            timestamp: new Date(),
            itemsCount: items.length,
            total: total + tax - discountAmount,
            customerName,
            items,
            orderType,
            selectedTable,
            appliedDiscount,
        };

        heldOrders.push(heldOrder);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(heldOrders));
    }

    /**
     * Get all held orders
     */
    static async getHeldOrders(): Promise<HeldOrder[]> {
        return this.getHeldOrdersSync();
    }

    /**
     * Retrieve a specific held order
     */
    static async retrieveOrder(orderId: string): Promise<HeldOrder | null> {
        const heldOrders = this.getHeldOrdersSync();
        const order = heldOrders.find(o => o.id === orderId);

        if (order) {
            // Remove from storage
            const remaining = heldOrders.filter(o => o.id !== orderId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
        }

        return order || null;
    }

    /**
     * Delete a held order
     */
    static async deleteHeldOrder(orderId: string): Promise<void> {
        const heldOrders = this.getHeldOrdersSync();
        const remaining = heldOrders.filter(o => o.id !== orderId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    }

    /**
     * Get held orders from localStorage (private helper)
     */
    private static getHeldOrdersSync(): HeldOrder[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];

            const orders = JSON.parse(stored);
            // Convert timestamp strings back to Date objects
            return orders.map((order: any) => ({
                ...order,
                timestamp: new Date(order.timestamp),
            }));
        } catch (error) {
            console.error('Failed to parse held orders:', error);
            return [];
        }
    }
}
