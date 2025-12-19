// Refund & Return Management Types

/**
 * Refund Item - represents a single item being refunded
 */
export interface RefundItem {
    orderItemId: string;
    productId: string;
    productName: string;
    originalQuantity: string; // decimal(10,3)
    refundQuantity: string; // User input
    unitPrice: string;
    lineTotal: string; // refundQuantity * unitPrice
    returnToStock: boolean;
    reason?: 'DAMAGED' | 'WRONG_ORDER' | 'CUSTOMER_REQUEST' | 'OTHER';
}

/**
 * Refund Transaction - complete refund record
 */
export interface RefundTransaction {
    id: string;
    originalOrderId: string;
    originalOrderNumber: string;
    refundDate: string;
    refundMethod: 'CASH' | 'CARD';
    totalRefundAmount: string;
    items: RefundItem[];
    processedByUserId: string;
    registerSessionId: string;
    notes?: string;
}

/**
 * Order with refund tracking
 */
export interface OrderWithRefunds {
    id: string;
    orderNumber: string;
    invoiceCounter: number;
    total: string;
    refundedAmount: string; // Total refunded so far
    status: 'COMPLETED' | 'PARTIAL_REFUND' | 'REFUNDED' | 'VOID';
    paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER';
    items: OrderItemWithRefunds[];
    createdAt: string;
}

export interface OrderItemWithRefunds {
    id: string;
    productId: string;
    productName: string;
    quantity: string;
    refundedQuantity: string; // Track how much already refunded
    unitPrice: string;
    lineTotal: string;
}

/**
 * Refund validation result
 */
export interface RefundValidation {
    valid: boolean;
    error?: string;
    maxRefundable?: string;
}
