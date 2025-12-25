import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import Decimal from 'decimal.js';
import { DecimalUtil } from '@/lib/decimal';
import type {
    OrderType,
    OrderStatus,
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
// HELD ORDER (Parked for later)
// =============================================================================

export interface HeldOrder {
    id: string;
    name: string;                    // "Table 5" or "John's Order"
    nameAr: string | null;
    orderType: OrderType;
    items: CartItem[];
    customer: CustomerInfo | null;
    table: TableInfo | null;
    delivery: DeliveryInfo | null;
    discount: OrderDiscount | null;
    notes: string | null;
    heldAt: string;                  // ISO timestamp
    heldBy: string;                  // Cashier ID
    cashierName: string;
    // Totals at time of hold
    subtotal: string;
    taxAmount: string;
    total: string;
}

// =============================================================================
// ORDER HISTORY (Completed orders for current session)
// =============================================================================

export interface CompletedOrder extends Order {
    completedAt: string;
    receiptPrinted: boolean;
}

// =============================================================================
// STORE STATE
// =============================================================================

interface OrderState {
    // Held Orders
    heldOrders: HeldOrder[];

    // Order History (current session)
    orderHistory: CompletedOrder[];

    // Active order being created (synced from cart on checkout)
    activeOrderId: string | null;

    // Order number counter (per session)
    orderCounter: number;

    // Session info
    sessionStartedAt: string | null;
    sessionId: string | null;
    cashierId: string | null;
    cashierName: string | null;

    // =========================================================================
    // SESSION ACTIONS
    // =========================================================================

    startSession: (cashierId: string, cashierName: string) => void;
    endSession: () => void;

    // =========================================================================
    // HELD ORDER ACTIONS
    // =========================================================================

    holdOrder: (order: Omit<HeldOrder, 'id' | 'heldAt'>) => string;
    recallOrder: (heldOrderId: string) => HeldOrder | null;
    deleteHeldOrder: (heldOrderId: string) => void;
    renameHeldOrder: (heldOrderId: string, name: string, nameAr?: string | null) => void;
    getHeldOrdersCount: () => number;

    // =========================================================================
    // ORDER COMPLETION ACTIONS
    // =========================================================================

    generateOrderNumber: () => string;

    createOrder: (data: {
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
    }) => Order;

    addPayment: (orderId: string, payment: Omit<PaymentRecord, 'id' | 'processedAt' | 'processedBy'>) => void;

    completeOrder: (orderId: string, change: string) => CompletedOrder | null;

    voidOrder: (orderId: string, reason: string, authorizedBy?: string) => void;

    // =========================================================================
    // ORDER HISTORY ACTIONS
    // =========================================================================

    getOrderById: (orderId: string) => Order | CompletedOrder | null;
    getOrderByNumber: (orderNumber: string) => CompletedOrder | null;
    getRecentOrders: (limit?: number) => CompletedOrder[];
    markReceiptPrinted: (orderId: string) => void;

    // =========================================================================
    // STATISTICS (Session-based)
    // =========================================================================

    getSessionStats: () => {
        totalOrders: number;
        totalSales: string;
        totalTax: string;
        averageOrder: string;
        paymentBreakdown: Record<PaymentMethod, string>;
    };
}

// =============================================================================
// ACTIVE ORDERS MAP (in-memory for current transaction)
// =============================================================================

const activeOrders = new Map<string, Order>();

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useOrderStore = create<OrderState>()(
    devtools(
        persist(
            (set, get) => ({
                heldOrders: [],
                orderHistory: [],
                activeOrderId: null,
                orderCounter: 0,
                sessionStartedAt: null,
                sessionId: null,
                cashierId: null,
                cashierName: null,

                // =====================================================================
                // SESSION ACTIONS
                // =====================================================================

                startSession: (cashierId, cashierName) => {
                    set({
                        sessionId: crypto.randomUUID(),
                        sessionStartedAt: new Date().toISOString(),
                        cashierId,
                        cashierName,
                        orderCounter: 0,
                        orderHistory: [],
                    });
                },

                endSession: () => {
                    set({
                        sessionId: null,
                        sessionStartedAt: null,
                        cashierId: null,
                        cashierName: null,
                        // Keep held orders across sessions
                        orderHistory: [],
                        orderCounter: 0,
                    });
                    activeOrders.clear();
                },

                // =====================================================================
                // HELD ORDER ACTIONS
                // =====================================================================

                holdOrder: (orderData) => {
                    const id = crypto.randomUUID();
                    const heldOrder: HeldOrder = {
                        ...orderData,
                        id,
                        heldAt: new Date().toISOString(),
                    };

                    set((state) => ({
                        heldOrders: [...state.heldOrders, heldOrder],
                    }));

                    return id;
                },

                recallOrder: (heldOrderId) => {
                    const order = get().heldOrders.find((o) => o.id === heldOrderId);
                    if (!order) return null;

                    // Remove from held orders
                    set((state) => ({
                        heldOrders: state.heldOrders.filter((o) => o.id !== heldOrderId),
                    }));

                    return order;
                },

                deleteHeldOrder: (heldOrderId) => {
                    set((state) => ({
                        heldOrders: state.heldOrders.filter((o) => o.id !== heldOrderId),
                    }));
                },

                renameHeldOrder: (heldOrderId, name, nameAr) => {
                    set((state) => ({
                        heldOrders: state.heldOrders.map((o) =>
                            o.id === heldOrderId
                                ? { ...o, name, nameAr: nameAr ?? o.nameAr }
                                : o
                        ),
                    }));
                },

                getHeldOrdersCount: () => get().heldOrders.length,

                // =====================================================================
                // ORDER CREATION
                // =====================================================================

                generateOrderNumber: () => {
                    const counter = get().orderCounter + 1;
                    set({ orderCounter: counter });

                    // Format: YYYYMMDD-XXXX (date + sequential number)
                    const date = new Date();
                    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
                    const sequence = counter.toString().padStart(4, '0');

                    return `${dateStr}-${sequence}`;
                },

                createOrder: (data) => {
                    const state = get();
                    const orderNumber = get().generateOrderNumber();

                    const order: Order = {
                        id: crypto.randomUUID(),
                        orderNumber,
                        orderType: data.orderType,
                        status: 'ACTIVE',
                        paymentStatus: 'UNPAID',
                        items: data.items,
                        customer: data.customer,
                        table: data.table,
                        delivery: data.delivery,
                        subtotal: data.subtotal,
                        discountAmount: data.discount?.calculatedAmount ?? '0.000',
                        taxRate: data.taxRate,
                        taxAmount: data.taxAmount,
                        deliveryFee: data.deliveryFee,
                        serviceCharge: '0.000',
                        total: data.total,
                        discount: data.discount,
                        payments: [],
                        amountPaid: '0.000',
                        amountDue: data.total,
                        changeGiven: '0.000',
                        cashierId: state.cashierId ?? 'unknown',
                        cashierName: state.cashierName ?? 'Unknown',
                        allItemsFired: data.items.every(
                            (i) => !i.product.requiresKitchen || i.kitchenStatus !== 'PENDING'
                        ),
                        allItemsReady: data.items.every(
                            (i) => !i.product.requiresKitchen ||
                                i.kitchenStatus === 'READY' ||
                                i.kitchenStatus === 'SERVED'
                        ),
                        notes: data.notes,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    // Store in active orders map
                    activeOrders.set(order.id, order);
                    set({ activeOrderId: order.id });

                    return order;
                },

                addPayment: (orderId, paymentData) => {
                    const order = activeOrders.get(orderId);
                    if (!order) return;

                    const state = get();
                    const payment: PaymentRecord = {
                        id: crypto.randomUUID(),
                        ...paymentData,
                        processedAt: new Date().toISOString(),
                        processedBy: state.cashierId ?? 'unknown',
                    };

                    // Update order
                    const newPayments = [...order.payments, payment];
                    const newAmountPaid = DecimalUtil.sum(
                        newPayments.map((p) => p.amount)
                    ).toFixed(3);
                    const newAmountDue = DecimalUtil.subtract(order.total, newAmountPaid);
                    const amountDueValue = newAmountDue.lessThan(0) ? '0.000' : newAmountDue.toFixed(3);

                    // Determine payment status
                    let paymentStatus: PaymentStatus = 'UNPAID';
                    if (newAmountDue.lessThanOrEqualTo(0)) {
                        paymentStatus = 'PAID';
                    } else if (new Decimal(newAmountPaid).greaterThan(0)) {
                        paymentStatus = 'PARTIALLY_PAID';
                    }

                    activeOrders.set(orderId, {
                        ...order,
                        payments: newPayments,
                        amountPaid: newAmountPaid,
                        amountDue: amountDueValue,
                        paymentStatus,
                        updatedAt: new Date().toISOString(),
                    });
                },

                completeOrder: (orderId, change) => {
                    const order = activeOrders.get(orderId);
                    if (!order) return null;

                    if (order.paymentStatus !== 'PAID') {
                        console.error('Cannot complete order: not fully paid');
                        return null;
                    }

                    const completedOrder: CompletedOrder = {
                        ...order,
                        status: 'COMPLETED',
                        changeGiven: change,
                        completedAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        receiptPrinted: false,
                    };

                    // Add to history
                    set((state) => ({
                        orderHistory: [completedOrder, ...state.orderHistory],
                        activeOrderId: null,
                    }));

                    // Remove from active orders
                    activeOrders.delete(orderId);

                    return completedOrder;
                },

                voidOrder: (orderId, reason, authorizedBy) => {
                    const order = activeOrders.get(orderId);
                    if (order) {
                        // Remove from active
                        activeOrders.delete(orderId);
                        set({ activeOrderId: null });
                    }

                    // Also check in history and mark as voided
                    set((state) => ({
                        orderHistory: state.orderHistory.map((o) =>
                            o.id === orderId
                                ? {
                                    ...o,
                                    status: 'VOIDED' as const,
                                    notes: `${o.notes ?? ''}\nVoided: ${reason}`.trim(),
                                    updatedAt: new Date().toISOString(),
                                }
                                : o
                        ),
                    }));
                },

                // =====================================================================
                // ORDER HISTORY
                // =====================================================================

                getOrderById: (orderId) => {
                    // Check active orders first
                    const active = activeOrders.get(orderId);
                    if (active) return active;

                    // Check history
                    return get().orderHistory.find((o) => o.id === orderId) ?? null;
                },

                getOrderByNumber: (orderNumber) => {
                    return get().orderHistory.find((o) => o.orderNumber === orderNumber) ?? null;
                },

                getRecentOrders: (limit = 10) => {
                    return get().orderHistory.slice(0, limit);
                },

                markReceiptPrinted: (orderId) => {
                    set((state) => ({
                        orderHistory: state.orderHistory.map((o) =>
                            o.id === orderId ? { ...o, receiptPrinted: true } : o
                        ),
                    }));
                },

                // =====================================================================
                // STATISTICS
                // =====================================================================

                getSessionStats: () => {
                    const history = get().orderHistory.filter((o) => o.status === 'COMPLETED');

                    const totalOrders = history.length;
                    const totalSales = DecimalUtil.sum(history.map((o) => o.total)).toFixed(3);
                    const totalTax = DecimalUtil.sum(history.map((o) => o.taxAmount)).toFixed(3);

                    const averageOrder = totalOrders > 0
                        ? DecimalUtil.divide(totalSales, totalOrders).toFixed(3)
                        : '0.000';

                    // Payment breakdown
                    const paymentBreakdown: Record<PaymentMethod, string> = {
                        CASH: '0.000',
                        CARD: '0.000',
                        GIFT_CARD: '0.000',
                        LOYALTY_POINTS: '0.000',
                        STORE_CREDIT: '0.000',
                    };

                    history.forEach((order) => {
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
                },
            }),
            {
                name: 'nerdpos-orders',
                partialize: (state) => ({
                    // Only persist held orders and counter
                    heldOrders: state.heldOrders,
                    orderCounter: state.orderCounter,
                    // Don't persist session info or history (managed per session)
                }),
            }
        ),
        { name: 'OrderStore' }
    )
);
