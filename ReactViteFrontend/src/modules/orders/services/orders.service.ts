// Stub service for orders - will be fully implemented later
export class OrdersService {
    static async getOrderById(orderId: string): Promise<any> {
        console.log('OrdersService.getOrderById called with:', orderId);
        // Return mock data for now
        return {
            id: orderId,
            orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
            type: 'takeaway',
            items: [],
            customerName: '',
            customerPhone: '',
            tableId: null,
            createdAt: new Date(),
        };
    }

    static async createOrder(orderData: any): Promise<any> {
        console.log('OrdersService.createOrder called');
        return { id: `ORD-${Date.now()}`, ...orderData };
    }
}
