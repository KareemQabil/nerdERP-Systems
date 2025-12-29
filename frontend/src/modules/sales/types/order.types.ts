/**
 * Sales/Order Types
 * Matches backend DTOs for type safety
 */

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export type OrderType = 'TAKEAWAY' | 'DINE_IN' | 'DELIVERY';
export type PaymentMethod = 'CASH' | 'CARD' | 'MADA';
export type OrderStatus = 'OPEN' | 'COMPLETED' | 'VOIDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';

// ═══════════════════════════════════════════════════════════
// ORDER ITEM MODIFIER
// ═══════════════════════════════════════════════════════════

export interface OrderItemModifier {
    modifierId: string;
    modifierName: string;
    optionId: string;
    optionName: string;
    priceAdjustment: number;
    quantity: number;
}

// ═══════════════════════════════════════════════════════════
// ORDER ITEM
// ═══════════════════════════════════════════════════════════

export interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    total: number;
    modifiers: OrderItemModifier[];
    specialInstructions?: string;
}

// ═══════════════════════════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════════════════════════

export interface Payment {
    id: string;
    method: PaymentMethod;
    amount: number;
    referenceNumber?: string;
    createdAt: string;
}

// ═══════════════════════════════════════════════════════════
// SALES ORDER
// ═══════════════════════════════════════════════════════════

export interface SalesOrder {
    id: string;
    orderNumber: string;
    orderType: OrderType;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    totalGross: number;
    totalTax: number;
    totalDiscount: number;
    items: OrderItem[];
    payments: Payment[];
    customerId?: string;
    tableId?: string;
    registerId: string;
    registerSessionId: string;
    warehouseId: string;
    notes?: string;
    createdAt: string;
    completedAt?: string;
}

// ═══════════════════════════════════════════════════════════
// CREATE ORDER PAYLOAD
// ═══════════════════════════════════════════════════════════

export interface CreateOrderItemPayload {
    productId: string;
    quantity: number;
    unitPrice: number;
    modifiers?: {
        modifierId: string;
        optionId: string;
        quantity: number;
    }[];
    specialInstructions?: string;
}

export interface CreatePaymentPayload {
    method: PaymentMethod;
    amount: number;
    referenceNumber?: string;
}

export interface CreateOrderPayload {
    items: CreateOrderItemPayload[];
    payments: CreatePaymentPayload[];
    orderType: OrderType;
    registerSessionId: string;
    warehouseId: string;
    customerId?: string;
    tableId?: string;
    notes?: string;
}

// ═══════════════════════════════════════════════════════════
// QUERY PARAMS
// ═══════════════════════════════════════════════════════════

export interface OrderQueryParams {
    page?: number;
    limit?: number;
    orderType?: OrderType;
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
    startDate?: string;
    endDate?: string;
}

// ═══════════════════════════════════════════════════════════
// PAGINATED RESULT
// ═══════════════════════════════════════════════════════════

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    success: boolean;
    data: T[];
    meta: PaginationMeta;
    timestamp: string;
}
