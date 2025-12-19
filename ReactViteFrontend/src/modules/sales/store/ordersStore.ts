import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import Decimal from 'decimal.js';
import type { OrderWithRefunds, RefundTransaction, RefundValidation } from '../types/refund.types';
import { useShiftStore } from '@/modules/shifts/store/shiftStore';

// Mock orders for testing
const MOCK_ORDERS: OrderWithRefunds[] = [
    {
        id: '1',
        orderNumber: 'ORD-001',
        invoiceCounter: 1001,
        total: '125.000',
        refundedAmount: '0.000',
        status: 'COMPLETED',
        paymentMethod: 'CASH',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        items: [
            {
                id: '1-1',
                productId: 'prod-1',
                productName: 'Chicken Burger',
                quantity: '2.000',
                refundedQuantity: '0.000',
                unitPrice: '25.000',
                lineTotal: '50.000',
            },
            {
                id: '1-2',
                productId: 'prod-2',
                productName: 'French Fries',
                quantity: '1.000',
                refundedQuantity: '0.000',
                unitPrice: '15.000',
                lineTotal: '15.000',
            },
        ],
    },
    {
        id: '2',
        orderNumber: 'ORD-002',
        invoiceCounter: 1002,
        total: '89.500',
        refundedAmount: '25.000',
        status: 'PARTIAL_REFUND',
        paymentMethod: 'CARD',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        items: [
            {
                id: '2-1',
                productId: 'prod-3',
                productName: 'Pizza Margherita',
                quantity: '2.000',
                refundedQuantity: '1.000',
                unitPrice: '35.000',
                lineTotal: '70.000',
            },
        ],
    },
];

interface OrdersStore {
    orders: OrderWithRefunds[];
    searchOrders: (query: string) => OrderWithRefunds[];
    getRefundableOrders: () => OrderWithRefunds[];
    validateRefundQuantity: (refundQty: string, originalQty: string, alreadyRefunded: string) => RefundValidation;
    processRefund: (refundData: RefundTransaction) => Promise<void>;
}

export const useOrdersStore = create<OrdersStore>()(
    devtools(
        (set, get) => ({
            orders: MOCK_ORDERS,

            searchOrders: (query: string) => {
                const orders = get().orders;
                if (!query.trim()) return orders;

                const searchTerm = query.toLowerCase();
                return orders.filter(
                    (order) =>
                        order.orderNumber.toLowerCase().includes(searchTerm) ||
                        order.invoiceCounter.toString().includes(searchTerm)
                );
            },

            getRefundableOrders: () => {
                return get().orders.filter((order) => order.status !== 'REFUNDED' && order.status !== 'VOID');
            },

            validateRefundQuantity: (refundQty, originalQty, alreadyRefunded) => {
                try {
                    const refundDec = new Decimal(refundQty);
                    const originalDec = new Decimal(originalQty);
                    const refundedDec = new Decimal(alreadyRefunded);
                    const remaining = originalDec.minus(refundedDec);

                    if (refundDec.lessThanOrEqualTo(0)) {
                        return { valid: false, error: 'Refund quantity must be > 0' };
                    }

                    if (refundDec.greaterThan(remaining)) {
                        return {
                            valid: false,
                            error: `Cannot refund ${refundQty}. Only ${remaining.toString()} available.`,
                            maxRefundable: remaining.toString(),
                        };
                    }

                    return { valid: true };
                } catch (error) {
                    return { valid: false, error: 'Invalid quantity format' };
                }
            },

            processRefund: async (refundData: RefundTransaction) => {
                const orders = get().orders;
                const orderIndex = orders.findIndex((o) => o.id === refundData.originalOrderId);

                if (orderIndex === -1) throw new Error('Order not found');

                const order = orders[orderIndex];

                // Validate
                for (const refundItem of refundData.items) {
                    const orderItem = order.items.find((i) => i.id === refundItem.orderItemId);
                    if (!orderItem) throw new Error(`Item ${refundItem.productName} not found`);

                    const validation = get().validateRefundQuantity(
                        refundItem.refundQuantity,
                        orderItem.quantity,
                        orderItem.refundedQuantity
                    );

                    if (!validation.valid) throw new Error(`${refundItem.productName}: ${validation.error}`);
                }

                // Calculate total
                const totalRefund = refundData.items.reduce((sum, item) => sum.plus(item.lineTotal), new Decimal(0));

                // Update items
                const updatedItems = order.items.map((item) => {
                    const refundItem = refundData.items.find((r) => r.orderItemId === item.id);
                    if (refundItem) {
                        return {
                            ...item,
                            refundedQuantity: new Decimal(item.refundedQuantity).plus(refundItem.refundQuantity).toFixed(3),
                        };
                    }
                    return item;
                });

                // Update status
                const newRefundedAmount = new Decimal(order.refundedAmount).plus(totalRefund).toFixed(3);
                const fullyRefunded = new Decimal(newRefundedAmount).greaterThanOrEqualTo(order.total);

                const updatedOrder: OrderWithRefunds = {
                    ...order,
                    items: updatedItems,
                    refundedAmount: newRefundedAmount,
                    status: fullyRefunded ? 'REFUNDED' : 'PARTIAL_REFUND',
                };

                // Update shift if cash
                if (refundData.refundMethod === 'CASH') {
                    useShiftStore.getState().addTransaction(totalRefund.toFixed(3), 'REFUND');
                }

                // Update store
                const updatedOrders = [...orders];
                updatedOrders[orderIndex] = updatedOrder;
                set({ orders: updatedOrders });

                console.log('✅ Refund processed:', totalRefund.toFixed(3), 'SAR');
            },
        }),
        { name: 'OrdersStore' }
    )
);
