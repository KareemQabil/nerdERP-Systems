/**
 * Order Redux Slice
 * Manages held orders, order history, and session statistics
 * Ported from order.store.ts (Zustand)
 */

import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import Decimal from 'decimal.js';
import { DecimalUtil } from '@/lib/decimal';
import type { RootState } from '@/app/store';
import type {
    OrderType,
    PaymentStatus,
    PaymentMethod,
    Order,
    CartItem,
    CustomerInfo,
    TableInfo,
    DeliveryInfo,
    OrderDiscount,
    PaymentRecord,
} from '@/types/pos.types';

// =============================================================================
// TYPES
// =============================================================================

export interface HeldOrder {
    id: string;
    name: string;
    nameAr: string | null;
    orderType: OrderType;
    items: CartItem[];
    customer: CustomerInfo | null;
    table: TableInfo | null;
    delivery: DeliveryInfo | null;
    discount: OrderDiscount | null;
    notes: string | null;
    heldAt: string;
    heldBy: string;
    cashierName: string;
    subtotal: string;
    taxAmount: string;
    total: string;
}

export interface CompletedOrder extends Order {
    completedAt: string;
    receiptPrinted: boolean;
}

interface OrderState {
    heldOrders: HeldOrder[];
    orderHistory: CompletedOrder[];
    activeOrderId: string | null;
    orderCounter: number;
    sessionStartedAt: string | null;
    sessionId: string | null;
    cashierId: string | null;
    cashierName: string | null;
    activeOrders: Record<string, Order>; // In-memory active orders map
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: OrderState = {
    heldOrders: [],
    orderHistory: [],
    activeOrderId: null,
    orderCounter: 0,
    sessionStartedAt: null,
    sessionId: null,
    cashierId: null,
    cashierName: null,
    activeOrders: {},
};

// =============================================================================
// SLICE
// =============================================================================

const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        // =====================================================================
        // SESSION ACTIONS
        // =====================================================================

        startSession: (state, action: PayloadAction<{ cashierId: string; cashierName: string }>) => {
            state.sessionId = crypto.randomUUID();
            state.sessionStartedAt = new Date().toISOString();
            state.cashierId = action.payload.cashierId;
            state.cashierName = action.payload.cashierName;
            state.orderCounter = 0;
            state.orderHistory = [];
        },

        endSession: (state) => {
            state.sessionId = null;
            state.sessionStartedAt = null;
            state.cashierId = null;
            state.cashierName = null;
            state.orderHistory = [];
            state.orderCounter = 0;
            state.activeOrders = {};
        },

        // =====================================================================
        // HELD ORDER ACTIONS
        // =====================================================================

        holdOrder: (state, action: PayloadAction<Omit<HeldOrder, 'id' | 'heldAt'>>) => {
            const id = crypto.randomUUID();
            const heldOrder: HeldOrder = {
                ...action.payload,
                id,
                heldAt: new Date().toISOString(),
            };
            state.heldOrders.push(heldOrder);
        },

        recallOrder: (state, action: PayloadAction<string>) => {
            const index = state.heldOrders.findIndex((o) => o.id === action.payload);
            if (index !== -1) {
                state.heldOrders.splice(index, 1);
            }
        },

        deleteHeldOrder: (state, action: PayloadAction<string>) => {
            state.heldOrders = state.heldOrders.filter((o) => o.id !== action.payload);
        },

        renameHeldOrder: (
            state,
            action: PayloadAction<{ id: string; name: string; nameAr?: string | null }>
        ) => {
            const order = state.heldOrders.find((o) => o.id === action.payload.id);
            if (order) {
                order.name = action.payload.name;
                if (action.payload.nameAr !== undefined) {
                    order.nameAr = action.payload.nameAr;
                }
            }
        },

        // =====================================================================
        // ORDER CREATION
        // =====================================================================

        createOrder: (
            state,
            action: PayloadAction<{
                orderType: OrderType;
                items: CartItem[];
                customer: CustomerInfo | null;
                table: TableInfo | null;
                delivery: DeliveryInfo | null;
                discount: OrderDiscount | null;
                notes: string | null;
                subtotal: string;
                taxAmount: string;
                taxRate: string;
                deliveryFee: string;
                total: string;
            }>
        ) => {
            const counter = state.orderCounter + 1;
            state.orderCounter = counter;

            // Generate order number: YYYYMMDD-XXXX
            const date = new Date();
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            const sequence = counter.toString().padStart(4, '0');
            const orderNumber = `${dateStr}-${sequence}`;

            const order: Order = {
                id: crypto.randomUUID(),
                orderNumber,
                orderType: action.payload.orderType,
                status: 'ACTIVE',
                paymentStatus: 'UNPAID',
                items: action.payload.items,
                customer: action.payload.customer,
                table: action.payload.table,
                delivery: action.payload.delivery,
                subtotal: action.payload.subtotal,
                discountAmount: action.payload.discount?.calculatedAmount ?? '0.000',
                taxRate: action.payload.taxRate,
                taxAmount: action.payload.taxAmount,
                deliveryFee: action.payload.deliveryFee,
                serviceCharge: '0.000',
                total: action.payload.total,
                discount: action.payload.discount,
                payments: [],
                amountPaid: '0.000',
                amountDue: action.payload.total,
                changeGiven: '0.000',
                cashierId: state.cashierId ?? 'unknown',
                cashierName: state.cashierName ?? 'Unknown',
                allItemsFired: action.payload.items.every(
                    (i) => !i.product.requiresKitchen || i.kitchenStatus !== 'PENDING'
                ),
                allItemsReady: action.payload.items.every(
                    (i) =>
                        !i.product.requiresKitchen ||
                        i.kitchenStatus === 'READY' ||
                        i.kitchenStatus === 'SERVED'
                ),
                notes: action.payload.notes,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            state.activeOrders[order.id] = order;
            state.activeOrderId = order.id;
        },

        addPayment: (
            state,
            action: PayloadAction<{
                orderId: string;
                payment: Omit<PaymentRecord, 'id' | 'processedAt' | 'processedBy'>;
            }>
        ) => {
            const order = state.activeOrders[action.payload.orderId];
            if (!order) return;

            const payment: PaymentRecord = {
                id: crypto.randomUUID(),
                ...action.payload.payment,
                processedAt: new Date().toISOString(),
                processedBy: state.cashierId ?? 'unknown',
            };

            const newPayments = [...order.payments, payment];
            const newAmountPaid = DecimalUtil.sum(newPayments.map((p) => p.amount)).toFixed(3);
            const newAmountDue = DecimalUtil.subtract(order.total, newAmountPaid);
            const amountDueValue = newAmountDue.lessThan(0) ? '0.000' : newAmountDue.toFixed(3);

            // Determine payment status
            let paymentStatus: PaymentStatus = 'UNPAID';
            if (newAmountDue.lessThanOrEqualTo(0)) {
                paymentStatus = 'PAID';
            } else if (new Decimal(newAmountPaid).greaterThan(0)) {
                paymentStatus = 'PARTIALLY_PAID';
            }

            state.activeOrders[action.payload.orderId] = {
                ...order,
                payments: newPayments,
                amountPaid: newAmountPaid,
                amountDue: amountDueValue,
                paymentStatus,
                updatedAt: new Date().toISOString(),
            };
        },

        completeOrder: (
            state,
            action: PayloadAction<{ orderId: string; change: string }>
        ) => {
            const order = state.activeOrders[action.payload.orderId];
            if (!order || order.paymentStatus !== 'PAID') return;

            const completedOrder: CompletedOrder = {
                ...order,
                status: 'COMPLETED',
                changeGiven: action.payload.change,
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                receiptPrinted: false,
            };

            state.orderHistory.unshift(completedOrder);
            delete state.activeOrders[action.payload.orderId];
            state.activeOrderId = null;
        },

        voidOrder: (
            state,
            action: PayloadAction<{
                orderId: string;
                reason: string;
                authorizedBy?: string;
            }>
        ) => {
            const { orderId, reason } = action.payload;

            // Remove from active orders
            if (state.activeOrders[orderId]) {
                delete state.activeOrders[orderId];
                state.activeOrderId = null;
            }

            // Mark as voided in history
            const historyOrder = state.orderHistory.find((o) => o.id === orderId);
            if (historyOrder) {
                historyOrder.status = 'VOIDED';
                historyOrder.notes = `${historyOrder.notes ?? ''}\nVoided: ${reason}`.trim();
                historyOrder.updatedAt = new Date().toISOString();
            }
        },

        markReceiptPrinted: (state, action: PayloadAction<string>) => {
            const order = state.orderHistory.find((o) => o.id === action.payload);
            if (order) {
                order.receiptPrinted = true;
            }
        },
    },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
    startSession,
    endSession,
    holdOrder,
    recallOrder,
    deleteHeldOrder,
    renameHeldOrder,
    createOrder,
    addPayment,
    completeOrder,
    voidOrder,
    markReceiptPrinted,
} = orderSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectHeldOrders = (state: RootState) => state.order.heldOrders;
export const selectOrderHistory = (state: RootState) => state.order.orderHistory;
export const selectActiveOrderId = (state: RootState) => state.order.activeOrderId;
export const selectSessionInfo = (state: RootState) => ({
    sessionId: state.order.sessionId,
    sessionStartedAt: state.order.sessionStartedAt,
    cashierId: state.order.cashierId,
    cashierName: state.order.cashierName,
});

export const selectHeldOrdersCount = createSelector(
    [selectHeldOrders],
    (heldOrders) => heldOrders.length
);

export const selectHeldOrderById = (id: string) =>
    createSelector([selectHeldOrders], (heldOrders) =>
        heldOrders.find((o) => o.id === id)
    );

export const selectActiveOrder = createSelector(
    [(state: RootState) => state.order.activeOrders, selectActiveOrderId],
    (activeOrders, activeOrderId) => (activeOrderId ? activeOrders[activeOrderId] : null)
);

export const selectOrderById = (orderId: string) =>
    createSelector(
        [(state: RootState) => state.order.activeOrders, selectOrderHistory],
        (activeOrders, history) => {
            return activeOrders[orderId] || history.find((o) => o.id === orderId) || null;
        }
    );

export const selectOrderByNumber = (orderNumber: string) =>
    createSelector([selectOrderHistory], (history) =>
        history.find((o) => o.orderNumber === orderNumber)
    );

export const selectRecentOrders = (limit: number = 10) =>
    createSelector([selectOrderHistory], (history) => history.slice(0, limit));

export const selectSessionStats = createSelector([selectOrderHistory], (history) => {
    const completedOrders = history.filter((o) => o.status === 'COMPLETED');

    const totalOrders = completedOrders.length;
    const totalSales = DecimalUtil.sum(completedOrders.map((o) => o.total)).toFixed(3);
    const totalTax = DecimalUtil.sum(completedOrders.map((o) => o.taxAmount)).toFixed(3);

    const averageOrder =
        totalOrders > 0 ? DecimalUtil.divide(totalSales, totalOrders).toFixed(3) : '0.000';

    // Payment breakdown
    const paymentBreakdown: Record<PaymentMethod, string> = {
        CASH: '0.000',
        CARD: '0.000',
        GIFT_CARD: '0.000',
        LOYALTY_POINTS: '0.000',
        STORE_CREDIT: '0.000',
    };

    completedOrders.forEach((order) => {
        order.payments.forEach((payment) => {
            paymentBreakdown[payment.method] = DecimalUtil.add(
                paymentBreakdown[payment.method],
                payment.amount
            ).toFixed(3);
        });
    });

    return {
        totalOrders,
        totalSales,
        totalTax,
        averageOrder,
        paymentBreakdown,
    };
});

// =============================================================================
// REDUCER
// =============================================================================

export default orderSlice.reducer;
