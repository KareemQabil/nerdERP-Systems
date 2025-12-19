import type { Product } from '@/modules/products/types/product.types';

/**
 * ============================================
 * PHASE 1: CORE TYPE DEFINITIONS
 * ============================================
 * Comprehensive TypeScript interfaces for POS system
 * Supports: Modifiers, Orders, Invoices, Tables, Kitchen
 */

// ============================================
// 0. RESTAURANT WORKFLOW TYPES (NEW)
// ============================================

/**
 * Item Status for Restaurant Workflow
 * Tracks item lifecycle from cart to kitchen
 */
export type ItemStatus = 'NEW' | 'SENT' | 'VOIDED';

/**
 * Cart Action Log Entry
 * Audit trail for all cart operations
 */
export interface CartActionLog {
    id: string;
    timestamp: string; // ISO 8601
    action: 'ADD_ITEM' | 'UPDATE_QTY' | 'REMOVE_ITEM' | 'SEND_KITCHEN' | 'VOID_ITEM' | 'APPLY_DISCOUNT' | 'CHANGE_ORDER_TYPE';
    userId?: string; // Who performed the action
    itemId?: string; // Which cart item was affected
    details: {
        productName?: string;
        quantity?: string;
        oldQuantity?: string;
        orderType?: string;
        reason?: string; // For voids/discounts
    };
}

// ============================================
// 1. MODIFIERS (Phase 2 & 9)
// ============================================

/**
 * Cart Item Modifier
 * Represents selected customizations (e.g., "Extra Shot", "No Sugar")
 */
export interface CartItemModifier {
    id: string;
    name: string;
    price: number;
}

// ============================================
// 2. CART ITEM (Enhanced with Modifiers)
// ============================================

/**
 * Cart Item Interface
 * Represents a product added to cart with optional modifiers
 */
export interface CartItem {
    id: string;                         // Unique cart entry ID
    product: Product;                   // Full product reference
    quantity: number;                   // Quantity ordered
    modifiers: CartItemModifier[];      // Selected modifiers (empty array if none)
    unitPrice: number;                  // Base product price
    modifiersTotal: number;             // Sum of all modifier prices
    lineTotal: number;                  // (unitPrice + modifiersTotal) * quantity
    notes?: string;                     // Special instructions (e.g., "No ice")
    specialInstructions?: string;       // Alias for notes (backward compatibility)
}

// ============================================
// 3. ORDER STATUSES & PAYMENT (Phase 3 & 4)
// ============================================

/**
 * Order Status Enum
 * Tracks order lifecycle from creation to completion
 */
export type OrderStatus = 'completed' | 'refunded' | 'held' | 'cancelled';

/**
 * Payment Method Enum
 * Supported payment types
 */
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mada' | 'stcpay';

// ============================================
// 4. ORDER & INVOICE (Phase 3 & 8)
// ============================================

/**
 * Order Interface
 * Complete order representation with items, totals, and context
 */
export interface Order {
    id: string;
    invoiceNumber: string;              // e.g., "INV-001001"
    createdAt: string;                  // ISO 8601 date string
    items: CartItem[];                  // Order items with modifiers
    subtotal: number;                   // Sum of all line totals
    tax: number;                        // Tax amount (e.g., 15% VAT)
    discount: number;                   // Discount amount
    total: number;                      // Final total (subtotal - discount + tax)
    paymentMethod: PaymentMethod;       // How customer paid
    status: OrderStatus;                // Order lifecycle status

    // Context (Phase 10 - Tables)
    tableId?: string;                   // Linked table ID
    tableName?: string;                 // Table name (e.g., "Table 5")
    zoneId?: string;                    // Zone ID (e.g., "zone-indoor")

    // Additional metadata
    customerName?: string;              // Customer name (if provided)
    customerId?: string;                // Customer ID (if registered)
    notes?: string;                     // Order-level notes
}

// ============================================
// 5. ADDITIONAL TYPES (For Compatibility)
// ============================================

/**
 * Order Type Enum
 * Dining service type
 */
export type OrderType = 'dineIn' | 'takeaway' | 'delivery';

/**
 * Legacy Payment Status (for backward compatibility)
 */
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';

/**
 * Sales Order (Compatibility with existing codebase)
 */
export interface SalesOrder extends Order {
    orderNumber: string;                // Alias for invoiceNumber
    type: OrderType;                    // Dining service type
    paymentStatus: PaymentStatus;       // Payment lifecycle status
    createdBy: string;                  // User who created order
}
