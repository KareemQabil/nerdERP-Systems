import { apiClient } from '@/shared/lib/api';
import type { CartItem, OrderType, SalesOrder } from '../types/pos.types';

interface TableOccupationData {
    tableId: string;
    tableNumber: string;
    orderId: string;
    orderNumber: string;
    guestCount: number;
    currentBill: number;
}

interface SaleData {
    id: string;
    orderNumber: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    orderType: OrderType;
    customerName?: string;
    customerPhone?: string;
    tableId?: string;
    tableNumber?: string;
    createdBy: string;
    createdByName: string;
}

/**
 * POS Integration Service
 * Handles synchronization with backend for orders, inventory, and tables
 */
export class SyncService {
    /**
     * Process a completed sale
     * Creates order, updates inventory, and syncs with backend
     */
    static async processSale(saleData: SaleData): Promise<SalesOrder | null> {
        try {
            // Prepare order data for API
            const orderPayload = {
                orderType: saleData.orderType,
                items: saleData.items.map(item => ({
                    productId: item.productId,
                    productName: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                    modifiers: item.modifiers?.map(mod => ({
                        id: mod.id,
                        name: mod.name,
                        price: mod.price,
                    })),
                    specialInstructions: item.specialInstructions,
                })),
                subtotal: saleData.subtotal,
                tax: saleData.tax,
                discount: saleData.discount,
                total: saleData.total,
                paymentMethod: saleData.paymentMethod,
                customerName: saleData.customerName,
                customerPhone: saleData.customerPhone,
                tableId: saleData.tableId,
                notes: `Created by ${saleData.createdByName}`,
            };

            // Send to backend
            const order = await apiClient.post<any, SalesOrder>('/orders', orderPayload);

            console.log('✅ Sale synced successfully:', order);
            return order;
        } catch (error) {
            console.error('❌ Failed to sync sale:', error);
            // Log error but don't block the sale
            // In production, you might want to queue failed syncs for retry
            return null;
        }
    }

    /**
     * Occupy a table when order is started
     */
    static async occupyTable(tableData: TableOccupationData): Promise<void> {
        try {
            // TODO: Implement table occupation API call
            // await apiClient.post(`/tables/${tableData.tableId}/occupy`, tableData);

            console.log('📍 Table occupied:', tableData);
        } catch (error) {
            console.error('Failed to occupy table:', error);
        }
    }

    /**
     * Free a table when order is completed or cancelled
     */
    static async freeTable(_tableId: string, tableNumber: string): Promise<void> {
        try {
            // TODO: Implement table release API call
            // await apiClient.post(`/tables/${tableId}/free`);

            console.log('🆓 Table freed:', tableNumber);
        } catch (error) {
            console.error('Failed to free table:', error);
        }
    }

    /**
     * Update inventory after sale
     * This is typically handled by the backend when creating an order
     * but included here for reference
     */
    static async updateInventory(items: CartItem[]): Promise<void> {
        try {
            // Backend should handle inventory deduction automatically
            // when processing the order via FIFO logic
            console.log('📦 Inventory update triggered for', items.length, 'items');
        } catch (error) {
            console.error('Failed to update inventory:', error);
        }
    }

    /**
     * Send order to kitchen
     */
    static async sendToKitchen(
        orderNumber: string,
        items: CartItem[],
        orderType: OrderType,
        tableNumber?: string,
        notes?: string
    ): Promise<void> {
        try {
            // TODO: Implement kitchen display system integration
            // This would typically send to a websocket or kitchen display API

            const kitchenTicket = {
                orderNumber,
                items: items.map(item => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    modifiers: item.modifiers?.map(m => m.name),
                    instructions: item.specialInstructions,
                })),
                orderType,
                tableNumber,
                notes,
                timestamp: new Date(),
            };

            console.log('🍳 Kitchen ticket sent:', kitchenTicket);

            // In production, you would:
            // await apiClient.post('/kitchen/tickets', kitchenTicket);
            // or
            // websocket.send(JSON.stringify(kitchenTicket));
        } catch (error) {
            console.error('Failed to send to kitchen:', error);
        }
    }
}
