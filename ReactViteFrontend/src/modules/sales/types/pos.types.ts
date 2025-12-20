import type { Product } from '@/modules/products/types/product.types';
import type { OrderType } from './order.types'; // ✅ UNIFIED: Import from master source

/**
 * ============================================
 * RESTAURANT POS - TYPE DEFINITIONS
 * ============================================
 * Phase 1: Core Security & State Machine
 * Source of Truth: Unified with order.types.ts
 */

// ============================================
// RESTAURANT WORKFLOW: ITEM STATUS
// ============================================

/**
 * Item Status for Restaurant Workflow
 * Tracks item lifecycle from cart to kitchen
 * 
 * State Machine:
 * NEW → SENT → (VOIDED | COMPLETED)
 */
export type ItemStatus = 'NEW' | 'SENT' | 'VOIDED';

/**
 * Cart Action Log Entry
 * Audit trail for all cart operations (SOP Compliance)
 */
export interface CartActionLog {
    id: string;
    timestamp: string; // ISO 8601
    action: 'ADD_ITEM' | 'UPDATE_QTY' | 'REMOVE_ITEM' | 'SEND_KITCHEN' | 'VOID_ITEM' | 'APPLY_DISCOUNT' | 'CHANGE_ORDER_TYPE';
    userId?: string; // Who performed the action
    managerId?: string; // Who authorized (for voids/refunds)
    itemId?: string; // Which cart item was affected
    details: {
        productName?: string;
        quantity?: string;
        oldQuantity?: string;
        orderType?: OrderType;
        reason?: string; // For voids/discounts
        voidReason?: string; // Specific void reason
    };
}

// ============================================
// MODIFIERS
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
// CART ITEM (Enhanced with Restaurant Workflow)
// ============================================

/**
 * Cart Item Interface
 * Represents a product added to cart with optional modifiers
 * 
 * Security: Items cannot be edited after status = 'SENT'
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

    // ✅ RESTAURANT WORKFLOW (SOP Compliance)
    status: ItemStatus;                 // NEW | SENT | VOIDED
    sentAt?: string;                    // ISO 8601 - When sent to kitchen
    voidedAt?: string;                  // ISO 8601 - When voided
    voidReason?: string;                // Reason for voiding (required if status=VOIDED)
}

// ============================================
// ORDER STATUS & PAYMENT
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
// ORDER & INVOICE
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

    // Context (Tables)
    tableId?: string;                   // Linked table ID
    tableName?: string;                 // Table name (e.g., "Table 5")
    zoneId?: string;                    // Zone ID (e.g., "zone-indoor")

    // Additional metadata
    customerName?: string;              // Customer name (if provided)
    customerId?: string;                // Customer ID (if registered)
    notes?: string;                     // Order-level notes
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

/**
 * Legacy Payment Status (for backward compatibility)
 */
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';

/**
 * Sales Order (Compatibility with existing codebase)
 */
export interface SalesOrder extends Order {
    orderNumber: string;                // Alias for invoiceNumber
    type: OrderType;                    // ✅ UNIFIED: Uses master OrderType
    paymentStatus: PaymentStatus;       // Payment lifecycle status
    createdBy: string;                  // User who created order
}

// ============================================
// API SERVICE TYPES
// ============================================

/**
 * Product Category
 */
export interface Category {
    id: string;
    name: string;
    nameEn?: string;
    count?: number;
    parentId?: string | null;
}

/**
 * Customer
 */
export interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    totalOrders?: number;
    totalSpent?: number;
    joinedDate?: Date;
    loyaltyPoints?: number;
    tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

/**
 * Warehouse
 */
export interface Warehouse {
    id: string;
    name: string;
    nameEn?: string;
    code?: string;
    isActive?: boolean;
}

/**
 * Discount
 */
export interface Discount {
    id: string;
    name: string;
    nameEn?: string;
    type: 'percentage' | 'fixed';
    value: number;
    isActive?: boolean;
}

// ============================================
// RE-EXPORTS (Convenience)
// ============================================

/**
 * Re-export OrderType from master source
 * Prevents duplicate definitions
 */
export type { OrderType } from './order.types';

/**
 * Re-export Product from products module
 * For convenience in POS service layer
 */
export type { Product } from '@/modules/products/types/product.types';
