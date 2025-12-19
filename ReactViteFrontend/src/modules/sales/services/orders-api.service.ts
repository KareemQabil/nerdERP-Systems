import { apiClient } from '@/core/services/api/api-client';
import type { StandardResponse } from '@/core/types/api.types';
import { createMockStandardResponse } from '@/core/services/mock/mock-products';
import type { CartItem } from '@/modules/sales/store/cartStore';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// ✅ LocalStorage Key for persistent orders
const ORDERS_STORAGE_KEY = 'NerdPOS_OrdersHistory';

// ✅ Helper: Get orders from localStorage
const getStoredOrders = (): any[] => {
    try {
        const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to read from localStorage:', error);
    }
    return [];
};

// ✅ Helper: Save orders to localStorage
const saveOrdersToStorage = (orders: any[]) => {
    try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
        console.log('💾 Saved to localStorage:', orders.length, 'orders');
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
};

/**
 * Order Type enum
 */
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

/**
 * Payment Method enum
 */
export type PaymentMethod = 'CASH' | 'CARD' | 'MADA' | 'APPLE_PAY' | 'STC_PAY';

/**
 * Create Order DTO
 */
export interface CreateOrderDto {
    orderType: OrderType;
    customerId?: string | null;
    tableId?: string | null;
    items: Array<{
        productId: string;
        productName: string;
        quantity: string;
        unitPrice: string;
        modifiers?: Array<{
            modifierId: string;
            optionName: string;
            price: string;
        }>;
        specialInstructions?: string;
        lineTotal: string;
    }>;
    subtotal: string;
    taxAmount: string;
    discountAmount: string;
    totalAmount: string;
    paymentMethod: PaymentMethod;
    amountPaid: string;
    changeAmount?: string;
}

/**
 * Order Response
 */
export interface OrderResponse {
    id: string;
    orderNumber: string;
    orderType: OrderType;
    customerId?: string | null;
    customerName?: string | null;
    items: CreateOrderDto['items'];
    subtotal: string;
    taxAmount: string;
    discountAmount: string;
    totalAmount: string;
    paymentMethod: PaymentMethod;
    amountPaid: string;
    changeAmount: string;
    createdAt: string;
}

/**
 * Orders API Service
 * Handles order creation and management
 */
export class OrdersApiService {
    private static readonly BASE_PATH = '/orders';
    private static orderCounter = 1000; // Mock order counter

    /**
     * Create new order
     */
    static async createOrder(dto: CreateOrderDto): Promise<StandardResponse<OrderResponse>> {
        if (IS_MOCK_MODE) {
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 800));

            // Generate order number
            this.orderCounter++;
            const orderNumber = `INV-${this.orderCounter.toString().padStart(6, '0')}`;

            // Create order response
            const order: OrderResponse = {
                id: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                orderNumber,
                orderType: dto.orderType,
                customerId: dto.customerId || null,
                customerName: null,
                items: dto.items,
                subtotal: dto.subtotal,
                taxAmount: dto.taxAmount,
                discountAmount: dto.discountAmount,
                totalAmount: dto.totalAmount,
                paymentMethod: dto.paymentMethod,
                amountPaid: dto.amountPaid,
                changeAmount: dto.changeAmount || '0.000',
                createdAt: new Date().toISOString(),
            };

            // Transform items to include id field for history modal
            const itemsWithIds = dto.items.map((item, index) => ({
                id: `item-${order.id}-${index}`,
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                modifiers: item.modifiers,
                specialInstructions: item.specialInstructions,
                lineTotal: item.lineTotal,
                isRefunded: false,
            }));

            const orderForHistory = {
                ...order,
                items: itemsWithIds,
                status: 'COMPLETED',
            };

            // ✅ CRITICAL: Save to localStorage instead of in-memory
            const currentOrders = getStoredOrders();
            const updatedOrders = [orderForHistory, ...currentOrders]; // Add to beginning
            saveOrdersToStorage(updatedOrders);

            console.log('✅ Order Created & Saved to LocalStorage:', {
                orderNumber: order.orderNumber,
                total: order.totalAmount,
                items: order.items.length,
                paymentMethod: order.paymentMethod,
            });
            console.log('📋 Full Order Details:', order);
            console.log('💾 Total Orders in LocalStorage:', updatedOrders.length);

            return createMockStandardResponse(order);
        }

        const response = await apiClient.post<StandardResponse<OrderResponse>>(
            this.BASE_PATH,
            dto
        );
        return response.data;
    }

    /**
     * Get order by ID
     */
    static async getOrderById(id: string): Promise<StandardResponse<OrderResponse>> {
        if (IS_MOCK_MODE) {
            throw new Error('Mock implementation: getOrderById not available');
        }

        const response = await apiClient.get<StandardResponse<OrderResponse>>(
            `${this.BASE_PATH}/${id}`
        );
        return response.data;
    }

    /**
     * Helper: Convert CartItem to Order Item DTO
     */
    static convertCartItemToOrderItem(
        cartItem: CartItem
    ): CreateOrderDto['items'][0] {
        return {
            productId: cartItem.product.id,
            productName: cartItem.product.name,
            quantity: cartItem.quantity,
            unitPrice: cartItem.unitPrice,
            modifiers: cartItem.selectedModifiers,
            specialInstructions: cartItem.specialInstructions,
            lineTotal: cartItem.lineTotal,
        };
    }

    static async getOrders(filter?: {
        search?: string;
        date?: string;
        status?: string;
    }): Promise<StandardResponse<any>> {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network

        // ✅ Read from localStorage instead of in-memory variable
        let allOrders = getStoredOrders();

        // If no orders in storage, generate defaults and save them
        if (allOrders.length === 0) {
            allOrders = OrdersApiService.generateMockOrders();
            saveOrdersToStorage(allOrders);
        }

        let filtered = [...allOrders];

        // Apply search filter
        if (filter?.search) {
            const search = filter.search.toLowerCase();
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(search) ||
                order.id.toLowerCase().includes(search)
            );
        }

        // Apply date filter
        if (filter?.date) {
            const filterDate = new Date(filter.date).toISOString().split('T')[0];
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                return orderDate === filterDate;
            });
        }

        // Apply status filter
        if (filter?.status) {
            filtered = filtered.filter(order => order.status === filter.status);
        }

        // Sort by createdAt DESC (Newest first)
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        console.log('📚 Orders from LocalStorage - Total:', allOrders.length);
        console.log('📋 Filtered & Sorted Orders:', filtered.length);
        console.log('🔝 First 3 Orders:', filtered.slice(0, 3).map(o => ({
            orderNumber: o.orderNumber,
            createdAt: o.createdAt,
            items: o.items?.length || 0,
        })));

        return createMockStandardResponse({
            success: true,
            data: filtered,
        });
    }

    static async refundOrder(dto: {
        orderId: string;
        itemsToRefund?: Array<{ itemId: string; returnToStock: boolean }>;
        refundReason?: string;
        refundPaymentMethod: string;
    }): Promise<StandardResponse<any>> {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network

        // ✅ Read from localStorage
        const allOrders = getStoredOrders();
        const orderIndex = allOrders.findIndex(o => o.id === dto.orderId);

        if (orderIndex === -1) {
            throw new Error('Order not found');
        }

        const order = allOrders[orderIndex];

        // Check if already fully refunded
        if (order.status === 'REFUNDED') {
            throw new Error('Order already fully refunded');
        }

        const now = new Date().toISOString();
        const isFullRefund = !dto.itemsToRefund || dto.itemsToRefund.length === order.items.length;

        if (isFullRefund) {
            // Full Refund
            order.status = 'REFUNDED';
            order.refundedAmount = order.totalAmount;
            order.refundedItems = order.items.map(item => ({
                itemId: item.id,
                returnedToStock: dto.itemsToRefund?.find(r => r.itemId === item.id)?.returnToStock ?? true,
                refundedAt: now,
            }));
            order.refundedAt = now;
            order.refundReason = dto.refundReason;
            order.refundPaymentMethod = dto.refundPaymentMethod;

            // Mark all items as refunded
            order.items.forEach(item => {
                item.isRefunded = true;
            });
        } else {
            // Partial Refund
            let refundSubtotal = 0;

            dto.itemsToRefund!.forEach(refundItem => {
                const item = order.items.find(i => i.id === refundItem.itemId);
                if (item) {
                    item.isRefunded = true;
                    refundSubtotal += parseFloat(item.lineTotal);
                }
            });

            // Calculate prorated tax
            const originalSubtotal = parseFloat(order.subtotal);
            const taxRate = parseFloat(order.taxAmount) / originalSubtotal;
            const refundTax = refundSubtotal * taxRate;
            const refundTotal = (refundSubtotal + refundTax).toFixed(3);

            order.status = 'PARTIALLY_REFUNDED';
            order.refundedAmount = refundTotal;
            order.refundedItems = dto.itemsToRefund!.map(item => ({
                itemId: item.itemId,
                returnedToStock: item.returnToStock,
                refundedAt: now,
            }));
            order.refundedAt = now;
            order.refundReason = dto.refundReason;
            order.refundPaymentMethod = dto.refundPaymentMethod;
        }

        // ✅ Update order in array and save to localStorage
        allOrders[orderIndex] = order;
        saveOrdersToStorage(allOrders);

        return createMockStandardResponse({
            success: true,
            data: order,
        });
    }

    /**
     * Generate mock orders for history
     */
    private static generateMockOrders() {
        const now = new Date();
        const orders = [];

        // Order 1: Completed - Cash
        orders.push({
            id: 'ord-001',
            orderNumber: '#1001',
            orderType: 'DINE_IN' as OrderType,
            items: [
                {
                    id: 'item-001-1',
                    productId: 'prod-burger',
                    productName: 'Beef Burger',
                    quantity: '2.000',
                    unitPrice: '25.000',
                    lineTotal: '50.000',
                    modifiers: [{ id: 'mod-1', modifierName: 'Extra Cheese', price: '5.000' }],
                },
                {
                    id: 'item-001-2',
                    productId: 'prod-fries',
                    productName: 'French Fries',
                    quantity: '1.000',
                    unitPrice: '10.000',
                    lineTotal: '10.000',
                },
            ],
            subtotal: '60.000',
            taxAmount: '9.000',
            discountAmount: '0.000',
            totalAmount: '69.000',
            paymentMethod: 'CASH' as PaymentMethod,
            amountPaid: '70.000',
            changeAmount: '1.000',
            status: 'COMPLETED',
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        });

        // Order 2: Completed - Card
        orders.push({
            id: 'ord-002',
            orderNumber: '#1002',
            orderType: 'TAKEAWAY' as OrderType,
            items: [
                {
                    id: 'item-002-1',
                    productId: 'prod-pizza',
                    productName: 'Pizza Margherita',
                    quantity: '1.000',
                    unitPrice: '45.000',
                    lineTotal: '45.000',
                },
            ],
            subtotal: '45.000',
            taxAmount: '6.750',
            discountAmount: '0.000',
            totalAmount: '51.750',
            paymentMethod: 'CARD' as PaymentMethod,
            amountPaid: '51.750',
            changeAmount: '0.000',
            status: 'COMPLETED',
            createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        });

        // Order 3: Refunded
        orders.push({
            id: 'ord-003',
            orderNumber: '#1003',
            orderType: 'DINE_IN' as OrderType,
            items: [
                {
                    id: 'item-003-1',
                    productId: 'prod-salad',
                    productName: 'Caesar Salad',
                    quantity: '1.000',
                    unitPrice: '20.000',
                    lineTotal: '20.000',
                    isRefunded: true,
                },
            ],
            subtotal: '20.000',
            taxAmount: '3.000',
            discountAmount: '0.000',
            totalAmount: '23.000',
            paymentMethod: 'CASH' as PaymentMethod,
            amountPaid: '23.000',
            changeAmount: '0.000',
            status: 'REFUNDED',
            createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
            refundedAmount: '23.000',
            refundedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
            refundReason: 'Customer complaint',
            refundPaymentMethod: 'CASH',
            refundedItems: [{ itemId: 'item-003-1', returnedToStock: true, refundedAt: new Date().toISOString() }],
        });

        // Add 5 more varied orders
        for (let i = 4; i <= 8; i++) {
            const isEven = i % 2 === 0;
            orders.push({
                id: `ord-00${i}`,
                orderNumber: `#100${i}`,
                orderType: isEven ? ('DINE_IN' as OrderType) : ('TAKEAWAY' as OrderType),
                items: [
                    {
                        id: `item-00${i}-1`,
                        productId: `prod-${i}`,
                        productName: `Product ${i}`,
                        quantity: '1.000',
                        unitPrice: `${15 + i * 5}.000`,
                        lineTotal: `${15 + i * 5}.000`,
                    },
                ],
                subtotal: `${15 + i * 5}.000`,
                taxAmount: `${(15 + i * 5) * 0.15}.000`,
                discountAmount: '0.000',
                totalAmount: `${(15 + i * 5) * 1.15}.000`,
                paymentMethod: (isEven ? 'CASH' : 'CARD') as PaymentMethod,
                amountPaid: `${(15 + i * 5) * 1.15}.000`,
                changeAmount: '0.000',
                status: 'COMPLETED',
                createdAt: new Date(now.getTime() - (i + 2) * 60 * 60 * 1000).toISOString(),
            });
        }

        return orders;
    }

    // Static storage for mock orders
    private static MOCK_ORDERS: any[] | null = null;
}
