// =====================================================================
// NerdPOS Type Definitions
// Comprehensive types for POS system with modifiers, kitchen routing,
// order lifecycle, and checkout workflows
// =====================================================================

import type { BaseEntity } from './api.types';

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type OrderType = 'TAKEAWAY' | 'DINE_IN' | 'DELIVERY';

export type OrderStatus =
    | 'DRAFT'       // Items being added
    | 'ACTIVE'      // Order confirmed, items being prepared
    | 'COMPLETED'   // Paid and closed
    | 'VOIDED'      // Cancelled
    | 'HELD';       // Parked for later

export type PaymentStatus =
    | 'UNPAID'
    | 'PARTIALLY_PAID'
    | 'PAID'
    | 'REFUNDED';

export type KitchenStatus =
    | 'PENDING'      // Not yet sent to kitchen
    | 'FIRED'        // Sent to kitchen
    | 'PREPARING'    // Kitchen acknowledged, cooking
    | 'READY'        // Ready to serve/pickup
    | 'SERVED';      // Delivered to customer

export type KitchenStation =
    | 'GRILL'
    | 'COLD_PREP'
    | 'BAR'
    | 'FRYER'
    | 'OVEN'
    | 'BEVERAGE';

export type ModifierSelectionType = 'SINGLE' | 'MULTIPLE';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export type PaymentMethod =
    | 'CASH'
    | 'CARD'
    | 'GIFT_CARD'
    | 'LOYALTY_POINTS'
    | 'STORE_CREDIT';

export type VoidReason =
    | 'CUSTOMER_CHANGED_MIND'
    | 'WRONG_ITEM'
    | 'QUALITY_ISSUE'
    | 'DUPLICATE_ORDER'
    | 'OUT_OF_STOCK'
    | 'OTHER';

export type TableStatus =
    | 'AVAILABLE'
    | 'OCCUPIED'
    | 'RESERVED'
    | 'CLEANING';

// =============================================================================
// PRODUCT & MODIFIERS
// =============================================================================

export interface Modifier {
    id: string;
    name: string;
    nameAr: string | null;
    priceAdjustment: string;        // e.g., "0.750" for +$0.75
    isDefault: boolean;              // Pre-selected?
    isNegative: boolean;             // "No onions" type modifier
    isAvailable: boolean;            // Can be selected?
    sortOrder: number;
}

export interface ModifierGroup {
    id: string;
    name: string;
    nameAr: string | null;
    selectionType: ModifierSelectionType;
    isRequired: boolean;             // Must select at least minSelections
    minSelections: number;           // Minimum required (0 if optional)
    maxSelections: number;           // Maximum allowed (-1 for unlimited)
    modifiers: Modifier[];
    sortOrder: number;
    // Conditional display (for nested modifiers)
    conditionalOnModifierId?: string;  // Only show if this modifier selected
    conditionalOnModifierGroupId?: string;
}

export interface ProductInfo {
    id: string;
    sku: string;
    name: string;
    nameAr: string | null;
    description?: string;
    descriptionAr?: string | null;
    salePrice: string;               // Base price as decimal string
    costPrice?: string;
    imageUrl?: string;

    // Kitchen & Inventory
    requiresKitchen: boolean;
    kitchenStation: KitchenStation | null;
    trackInventory: boolean;
    stockQuantity?: string;
    allowNegativeStock: boolean;

    // Modifiers
    modifierGroups: ModifierGroup[];
    hasRequiredModifiers: boolean;   // Computed: any group with isRequired=true

    // Display
    categoryId: string;
    categoryName?: string;
    isAvailable: boolean;
    isFeatured: boolean;
    sortOrder: number;

    // Badges
    badges: ProductBadge[];
}

export type ProductBadge = 'NEW' | 'POPULAR' | 'BESTSELLER' | 'SPICY' | 'VEGETARIAN' | 'VEGAN';

// =============================================================================
// CART & ORDER ITEMS
// =============================================================================

export interface CartItemModifier {
    modifierId: string;
    modifierName: string;
    modifierNameAr: string | null;
    modifierGroupId: string;
    modifierGroupName: string;
    priceAdjustment: string;
    isNegative: boolean;
}

export interface ItemDiscount {
    type: DiscountType;
    value: string;                   // Percentage (e.g., "10") or fixed amount
    calculatedAmount: string;        // Actual discount in currency
    reason: string;
    code?: string;                   // Coupon code if applicable
    authorizedBy?: string;           // Manager ID if required auth
}

export interface CartItem {
    id: string;                      // Unique cart item ID (UUID)
    productId: string;
    product: ProductInfo;
    quantity: string;                // Decimal as string for precision

    // Pricing breakdown
    basePrice: string;               // Product sale price
    modifiersTotal: string;          // Sum of modifier price adjustments
    unitPrice: string;               // basePrice + modifiersTotal
    lineTotal: string;               // unitPrice × quantity

    // Modifiers & Instructions
    modifiers: CartItemModifier[];
    specialInstructions: string | null;

    // Kitchen tracking
    kitchenStatus: KitchenStatus;
    addedAt: string;                 // ISO timestamp
    firedAt: string | null;
    readyAt: string | null;
    servedAt: string | null;

    // Course sequencing (for dine-in)
    courseNumber?: number;           // 1 = appetizer, 2 = main, 3 = dessert

    // Discounts
    itemDiscount: ItemDiscount | null;

    // Void tracking
    isVoided: boolean;
    voidedAt?: string;
    voidReason?: VoidReason;
    voidedBy?: string;
    voidAuthorizedBy?: string;
}

// =============================================================================
// ORDER
// =============================================================================

export interface CustomerInfo {
    id: string;
    name: string;
    nameAr?: string | null;
    phone?: string;
    email?: string;
    loyaltyPoints?: number;
    loyaltyTier?: string;
}

export interface TableInfo {
    id: string;
    number: string;
    zoneName?: string;
    zoneNameAr?: string | null;
    capacity: number;
    status: TableStatus;
}

export interface DeliveryInfo {
    address: string;
    addressLine2?: string;
    city: string;
    zone: string;
    latitude?: number;
    longitude?: number;
    deliveryFee: string;
    estimatedTime?: number;          // Minutes
    driverName?: string;
    driverId?: string;
    driverPhone?: string;
}

export interface OrderDiscount {
    type: DiscountType;
    value: string;
    calculatedAmount: string;
    reason: string;
    code?: string;
    authorizedBy?: string;
}

export interface PaymentRecord {
    id: string;
    method: PaymentMethod;
    amount: string;
    reference?: string;              // Card last 4, gift card number, etc.
    processedAt: string;
    processedBy: string;
}

export interface Order extends BaseEntity {
    orderNumber: string;
    orderType: OrderType;
    status: OrderStatus;
    paymentStatus: PaymentStatus;

    // Items
    items: CartItem[];

    // Customer & Location
    customer: CustomerInfo | null;
    table: TableInfo | null;
    delivery: DeliveryInfo | null;

    // Totals
    subtotal: string;
    discountAmount: string;
    taxRate: string;
    taxAmount: string;
    deliveryFee: string;
    serviceCharge: string;
    total: string;

    // Discount (order-level)
    discount: OrderDiscount | null;

    // Payments
    payments: PaymentRecord[];
    amountPaid: string;
    amountDue: string;
    changeGiven: string;

    // Staff
    cashierId: string;
    cashierName: string;

    // Kitchen
    allItemsFired: boolean;
    allItemsReady: boolean;

    // Notes
    notes: string | null;

    // ZATCA (if applicable)
    invoiceHash?: string;
    previousHash?: string | null;
    zatcaQrCode?: string;
}

// =============================================================================
// ORDER TYPE CONFIGURATION
// =============================================================================

export interface OrderTypeConfig {
    requiresTable: boolean;
    requiresCustomer: boolean;
    requiresDeliveryAddress: boolean;
    fireToKitchenOnAdd: boolean;     // DINE_IN fires immediately
    fireToKitchenOnPayment: boolean; // TAKEAWAY fires after payment
    canCheckoutBeforeReady: boolean;
    partialCheckoutAllowed: boolean;
    autoAddDeliveryFee: boolean;
    autoAddServiceCharge: boolean;
}

export const ORDER_TYPE_CONFIG: Record<OrderType, OrderTypeConfig> = {
    DINE_IN: {
        requiresTable: true,
        requiresCustomer: false,
        requiresDeliveryAddress: false,
        fireToKitchenOnAdd: true,
        fireToKitchenOnPayment: false,
        canCheckoutBeforeReady: false,
        partialCheckoutAllowed: true,
        autoAddDeliveryFee: false,
        autoAddServiceCharge: true,
    },
    TAKEAWAY: {
        requiresTable: false,
        requiresCustomer: false,
        requiresDeliveryAddress: false,
        fireToKitchenOnAdd: false,
        fireToKitchenOnPayment: true,
        canCheckoutBeforeReady: true,
        partialCheckoutAllowed: false,
        autoAddDeliveryFee: false,
        autoAddServiceCharge: false,
    },
    DELIVERY: {
        requiresTable: false,
        requiresCustomer: true,
        requiresDeliveryAddress: true,
        fireToKitchenOnAdd: false,
        fireToKitchenOnPayment: true,
        canCheckoutBeforeReady: true,
        partialCheckoutAllowed: false,
        autoAddDeliveryFee: true,
        autoAddServiceCharge: false,
    },
};

// =============================================================================
// MANAGER PIN & AUTHORIZATION
// =============================================================================

export interface PinAuthorizationRequest {
    action: 'VOID_ITEM' | 'APPLY_DISCOUNT' | 'PRICE_OVERRIDE' | 'REFUND' | 'OPEN_DRAWER' | 'DELETE_ORDER';
    itemId?: string;
    itemName?: string;
    reason?: VoidReason | string;
    currentValue?: string;
    newValue?: string;
}

export interface PinAuthorizationResult {
    authorized: boolean;
    managerId?: string;
    managerName?: string;
    timestamp: string;
}

// =============================================================================
// CHECKOUT
// =============================================================================

export interface CheckoutBlocker {
    type: 'KITCHEN_NOT_READY' | 'TABLE_REQUIRED' | 'CUSTOMER_REQUIRED' | 'ADDRESS_REQUIRED' | 'MINIMUM_ORDER';
    message: string;
    messageAr: string;
    itemId?: string;
    itemName?: string;
    estimatedTime?: number;          // For kitchen items
}

export interface CheckoutSummary {
    canCheckoutAll: boolean;
    canCheckoutReady: boolean;
    blockers: CheckoutBlocker[];
    readyItemsTotal: string;
    allItemsTotal: string;
}

export interface SplitPayment {
    payments: Array<{
        method: PaymentMethod;
        amount: string;
        status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    }>;
    totalPaid: string;
    remaining: string;
}

// =============================================================================
// RECEIPT & PRINTING
// =============================================================================

export interface ReceiptData {
    orderNumber: string;
    orderType: OrderType;
    items: Array<{
        name: string;
        quantity: string;
        unitPrice: string;
        lineTotal: string;
        modifiers: string[];
    }>;
    subtotal: string;
    discount?: { label: string; amount: string };
    tax: string;
    total: string;
    payments: Array<{ method: string; amount: string }>;
    change?: string;
    cashierName: string;
    timestamp: string;
    qrCode?: string;
}
