// =====================================================================
// NerdPOS Type Definitions
// Comprehensive types for POS system with modifiers, kitchen routing,
// order lifecycle, and checkout workflows
// =====================================================================

// Base entity interface
interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type OrderType = 'TAKEAWAY' | 'DINE_IN' | 'DELIVERY' | 'PICKUP' | 'DRIVE_THRU';

// Enhanced OrderStatus with state machine support
export type OrderStatus =
    // Draft & Initial States
    | 'DRAFT'                       // Items being added
    | 'SAVED'                       // Order saved but not paid/sent to kitchen
    // Kitchen Workflow
    | 'FIRED_TO_KITCHEN'            // Order sent to kitchen
    | 'PREPARING'                   // Kitchen is preparing
    | 'READY'                       // Order ready for service
    | 'SERVED'                      // Order has been served (dine-in)
    // Payment Workflow
    | 'PAYMENT_PENDING'             // Awaiting payment
    | 'PAYMENT_PROCESSING'          // Payment being processed
    | 'PAID'                        // Payment received
    | 'PARTIALLY_PAID'              // Partial payment received
    // Delivery Workflow
    | 'OUT_FOR_DELIVERY'            // Driver out for delivery
    | 'AWAITING_PICKUP'             // Order ready for pickup (takeaway)
    // Aggregator Workflow
    | 'RECEIVED_FROM_AGGREGATOR'    // Order received from Talabat/Marsool/Instashop
    // Void & Return Workflow
    | 'VOID_REQUESTED'              // Void requested, awaiting approval
    | 'VOID_APPROVED'               // Void approved, executing
    | 'RETURN_REQUESTED'            // Return requested, awaiting approval
    | 'RETURN_APPROVED'             // Return approved, processing
    | 'REFUNDED'                    // Order refunded
    // Final States
    | 'COMPLETED'                   // Order completed and closed
    | 'VOID'                        // Order cancelled/voided
    // Legacy (for backward compatibility)
    | 'ACTIVE'                      // @deprecated Use FIRED_TO_KITCHEN or PREPARING
    | 'VOIDED'                      // @deprecated Use VOID
    | 'HELD';                       // @deprecated Use SAVED

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
    // Standard Methods
    | 'CASH'
    | 'CARD'
    | 'VISA'
    | 'MASTERCARD'
    | 'MADA'
    | 'MEEZA'
    // Electronic Payment Terminals
    | 'EPT'
    // Mobile Payments
    | 'APPLE_PAY'
    | 'GOOGLE_PAY'
    // Delivery Platform Payments
    | 'TALABAT'
    | 'MARSOOL'
    | 'INSTASHOP'
    | 'HUNGERSTATION'
    | 'CAREEM'
    // Other
    | 'GIFT_CARD'
    | 'LOYALTY_POINTS'
    | 'STORE_CREDIT'
    | 'VOUCHER'
    | 'CREDIT';

export type VoidReason =
    | 'CUSTOMER_CHANGED_MIND'
    | 'WRONG_ITEM'
    | 'WRONG_ORDER'
    | 'QUALITY_ISSUE'
    | 'DUPLICATE_ORDER'
    | 'OUT_OF_STOCK'
    | 'ITEM_OUT_OF_STOCK'
    | 'MISTAKE'
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
    zoneCode?: string;
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

    // State Machine
    stateHistory?: OrderStateHistoryEntry[];
    paidAt?: string;
    servedAt?: string;
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
    PICKUP: {
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
    DRIVE_THRU: {
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
};

// =============================================================================
// MANAGER PIN & AUTHORIZATION
// =============================================================================

export interface PinAuthorizationRequest {
    action: 'VOID_ITEM' | 'VOID_ORDER' | 'APPLY_DISCOUNT' | 'PRICE_OVERRIDE' | 'REFUND' | 'OPEN_DRAWER' | 'DELETE_ORDER';
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

// =============================================================================
// CALCULATION PIPELINE TYPES
// =============================================================================

export interface CalculationStageConfig {
    id: string;
    type: string;
    condition?: {
        type: string;
        rules?: Array<{
            field: string;
            operator: string;
            value: any;
        }>;
    };
    config: Record<string, any>;
    outputs: string[];
}

export interface CalculationPipelineConfig {
    version: string;
    storeId: string;
    pricingConfig?: DeliveryZonePricingConfig;
    freeDeliveryThreshold?: number;
    pipelineId: string;
    description: string;
    isActive: boolean;
    orderTypePipelines: Record<string, {
        pipeline: CalculationStageConfig[];
    }>;
    discountConfigs: Record<string, {
        type: 'percentage' | 'fixed';
        maxPercentage?: number;
        maxAmount?: number;
        requiresAuthorization: boolean;
        authorizationLevel?: string;
    }>;
}

export interface CalculationBreakdownStage {
    stageId: string;
    stageName: string;
    description: string;
    inputs: Record<string, any>;
    outputs: Record<string, string>;
    formula: string;
}

export interface CalculationBreakdown {
    pipelineId: string;
    pipelineVersion: string;
    orderType: OrderType;
    executedAt: string;
    stages: CalculationBreakdownStage[];
    summary: {
        subtotal: string;
        serviceCharge: string;
        deliveryFee: string;
        subtotalBeforeTax: string;
        tax: string;
        discount: string;
        total: string;
    };
}

export interface CalculationStageBreakdown {
    stage: string;
    stageType: string;
    description: string;
    value: number;
    formula?: string;
}

export interface CalculationResult {
    subtotal: number;
    serviceCharge: number;
    deliveryFee: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    breakdown: CalculationBreakdown[];
}

export interface CalculationStageResult {
    stage: string;
    stageType: string;
    value: number;
    formula?: string;
}

export interface StateTransitionResult {
    success: boolean;
    order?: Order;
    currentState: OrderStatus;
    previousState?: OrderStatus;
    error?: string;
    requiresApproval?: boolean;
    approvalId?: string;
}

export interface OrderStateHistoryEntry {
    historyId: string;
    orderId: string;
    fromState: OrderStatus | null;
    toState: OrderStatus;
    transitionedBy: string;
    transitionedByName: string;
    transitionedAt: Date;
    reason?: string;
    voidData?: {
        voidReason: string;
        authorizedBy?: string;
    };
    returnData?: {
        returnReason: string;
        returnedItems?: any[];
    };
    sideEffects?: string[];
}

// =============================================================================
// STATE MACHINE TYPES
// =============================================================================

export interface StateTransitionRule {
    fromState: OrderStatus | null;
    toState: OrderStatus;
    allowedPaymentStatuses?: string[];
    requiredFields?: string[];
    sideEffects?: SideEffect[];
}

export interface SideEffect {
    type: 'PRINT_KOT' | 'PRINT_CHECK' | 'UPDATE_TABLE' | 'DEDUCT_INVENTORY' |
    'NOTIFY_KITCHEN' | 'NOTIFY_WAITSTAFF' | 'UPDATE_REGISTER' | 'RESTORE_INVENTORY';
    params?: Record<string, any>;
}

export interface AllowedTransition {
    state: OrderStatus;
    label: string;
    labelAr?: string;
    description: string;
    requiresApproval: boolean;
    requiresPin: boolean;
    allowedRoles: string[];
}

export interface AllowedTransitionsResponse {
    currentState: OrderStatus;
    allowedTransitions: AllowedTransition[];
    canVoid: boolean;
    canReturn: boolean;
}

export interface TransitionContext {
    orderId: string;
    toState: OrderStatus;
    reason?: string;
    metadata?: Record<string, any>;
    voidData?: {
        voidReason: string;
        authorizedBy?: string;
    };
    returnData?: {
        returnReason: string;
        returnedItems?: any[];
    };
    userId?: string;
    userRole?: string;
    userName?: string;
    approvedBy?: string;
    sideEffects?: string[];
}

// =============================================================================
// VOID & RETURN WORKFLOW TYPES
// =============================================================================

export interface VoidRequestParams {
    orderId: string;
    voidReason: string;
    requestedBy: string;
    ipAddress?: string;
    deviceId?: string;
    storeId?: string;
}

export interface VoidApprovalParams {
    historyId: string;
    approved: boolean;
    approvedBy: string;
    rejectionReason?: string;
}

export interface ReturnRequestParams {
    orderId: string;
    returnType: ReturnOrderType;
    returnReason: string;
    returnedItems: Array<{
        orderItemId: string;
        productName: string;
        quantity: number;
        reason: string;
    }>;
    refundAmount?: number;
    requestedBy: string;
}

export interface ReturnApprovalParams {
    historyId: string;
    approved: boolean;
    approvedBy: string;
    refundMethod?: string;
    rejectionReason?: string;
}

export interface PendingApprovalsResponse {
    voidRequests: Array<{
        historyId: string;
        orderNumber: string;
        orderType: OrderType;
        requestedBy: string;
        requestedAt: Date;
        voidReason: string;
        orderTotal: number;
    }>;
    returnRequests: Array<{
        historyId: string;
        orderNumber: string;
        orderType: OrderType;
        requestedBy: string;
        requestedAt: Date;
        returnReason: string;
        refundAmount: number;
    }>;
}

// =============================================================================
// RETURN ORDER TYPES
// =============================================================================

export type ReturnOrderType = 'FULL' | 'PARTIAL' | 'EXCHANGE';

export type ReturnStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface ReturnOrder {
    id: string;
    returnNumber: string;
    originalOrderId: string;
    originalOrderNumber: string;
    returnType: ReturnOrderType;
    returnStatus: ReturnStatus;
    returnedItems: Array<{
        orderItemId: string;
        productName: string;
        quantity: number;
        reason: string;
    }>;
    refundAmount: number;
    refundMethod: string;
    returnReason: string;
    requestedByUserId: string;
    requestedByUserName: string;
    approvedByUserId?: string;
    approvedByUserName?: string;
    completedAt?: Date;
    storeId: string;
    pricingConfig?: DeliveryZonePricingConfig;
    freeDeliveryThreshold?: number;
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// PRINTER ROUTING TYPES
// =============================================================================

export type PrintJobType = 'RECEIPT' | 'KITCHEN_TICKET' | 'INVOICE' | 'TEST';

export type PrintJobStatus = 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type PriorityLevel = 1 | 2 | 3 | 4 | 5; // 1=EMERGENCY, 5=TEST

export type PriorityName = 'EMERGENCY' | 'EXPEDITE' | 'NORMAL' | 'REPRINT' | 'TEST';

export interface PrintJob {
    id: string;
    printerId: string;
    orderId?: string;
    type: PrintJobType;
    status: PrintJobStatus;
    priorityLevel: PriorityLevel;
    priorityName: PriorityName;
    stationId?: string;
    stationCode?: string;
    isFallback: boolean;
    originalPrinterId?: string;
    fallbackAttempt: number;
    templateId?: string;
    printData?: Record<string, any>;
    renderedContent?: string;
    retryCount: number;
    maxRetries: number;
    errorMessage?: string;
    completedAt?: Date;
    createdAt: Date;
}

export interface StationMapping {
    stationId: string;
    stationCode: string;
    primaryPrinterId: string;
    fallbackPrinterIds: string[];
    falloverConfig: {
        enabled: boolean;
        maxRetryAttempts: number;
        alertOnFallover: boolean;
    };
    templateId: string;
}

export interface PrinterRoutingConfig {
    version: string;
    storeId: string;
    pricingConfig?: DeliveryZonePricingConfig;
    freeDeliveryThreshold?: number;
    stationMappings: StationMapping[];
    orderTypeRules: Array<{
        orderType: OrderType;
        autoPrint: {
            customerReceipt: boolean;
            kitchenTickets: boolean;
        };
        receiptPrinterId?: string;
        receiptTemplateId?: string;
        priorityLevel?: number;
    }>;
    priorityConfig: {
        levels: Array<{
            level: number;
            name: PriorityName;
            queuePosition: 'front' | 'back';
        }>;
        autoEscalation: {
            enabled: boolean;
            waitTimeMinutes: number;
        };
    };
    falloverConfig: {
        globalEnabled: boolean;
        maxRetryAttempts: number;
        alertThreshold: number;
    };
}

// =============================================================================
// PRINT TEMPLATE TYPES
// =============================================================================

export type TemplateType = 'RECEIPT' | 'KITCHEN_TICKET' | 'DELIVERY_LABEL' | 'INVOICE' | 'TEST';

export type PaperSize = 'THERMAL_58MM' | 'THERMAL_80MM' | 'A4';

export type SectionType = 'HEADER' | 'BODY' | 'FOOTER' | 'CUSTOM';

export type ContentType = 'TEXT' | 'VARIABLE' | 'LINE' | 'IMAGE' | 'BARCODE' | 'TABLE';

export type TextAlignment = 'LEFT' | 'CENTER' | 'RIGHT';

export interface TemplateSection {
    id: string;
    type: SectionType;
    label?: string;
    visible: boolean;
    content: TemplateContent[];
}

export interface TemplateContent {
    type: ContentType;
    text?: string;
    variable?: string;
    width?: number;
    align?: TextAlignment;
    bold?: boolean;
    underline?: boolean;
    fontSize?: 'small' | 'normal' | 'large';
    repeat?: number;
}

export interface TemplateVariable {
    key: string;
    label: string;
    labelAr?: string;
    dataType: 'string' | 'number' | 'currency' | 'date' | 'boolean';
    format?: string;
    required: boolean;
}

export interface TemplateConfig {
    sections: TemplateSection[];
    variables: TemplateVariable[];
    formatting: {
        fontSize?: 'small' | 'normal' | 'large';
        alignment?: TextAlignment;
        lineHeight?: number;
        characterSet?: 'UTF8' | 'CP437';
        padding?: {
            left?: number;
            right?: number;
        };
    };
    barcode?: {
        enabled: boolean;
        type: 'QR' | 'CODE128' | 'EAN13';
        position: 'header' | 'footer';
        width?: number;
        height?: number;
    };
}

export interface PrintTemplate {
    id: string;
    templateName: string;
    templateCode: string;
    description?: string;
    templateType: TemplateType;
    paperSize: PaperSize;
    config: TemplateConfig;
    isSystem: boolean;
    isActive: boolean;
    version: string;
    category?: string;
    language: string;
    isRtl: boolean;
    previewImageUrl?: string;
    storeId?: string;
}

// =============================================================================
// DELIVERY MANAGEMENT TYPES
// =============================================================================

export type DeliveryStatus =
    | 'PENDING'           // Order created, awaiting kitchen
    | 'ASSIGNED'          // Driver assigned
    | 'PREPARING'         // Kitchen preparing
    | 'READY'             // Order ready, awaiting pickup
    | 'PICKED_UP'         // Driver picked up
    | 'OUT_FOR_DELIVERY'  // Driver en route
    | 'DELIVERED'         // Order delivered
    | 'FAILED'            // Delivery failed
    | 'CANCELLED';        // Order cancelled

export type DriverStatus = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';

export type AssignmentStatus =
    | 'ASSIGNED'
    | 'ACCEPTED'
    | 'DECLINED'
    | 'PICKED_UP'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'FAILED'
    | 'CANCELLED'
    | 'COMPLETED';

export interface DeliveryDriver {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    status: DriverStatus;
    currentLocationLat?: number;
    currentLocationLng?: number;
    currentLocationAddress?: string;
    lastLocationUpdateAt?: Date;
    maxConcurrentOrders: number;
    currentOrdersCount: number;
    currentOrderId?: string;
    isActive: boolean;
    storeId: string;
    pricingConfig?: DeliveryZonePricingConfig;
    freeDeliveryThreshold?: number;
    metrics?: {
        totalDeliveries: number;
        completedDeliveries: number;
        avgDeliveryTime: number;
        onTimeRate: number;
    };
}

export interface DeliveryAssignment {
    id: string;
    driverId: string;
    driverName: string;
    orderId: string;
    orderNumber: string;
    zoneId: string;
    zoneCode: string;
    status: AssignmentStatus;
    assignedAt: Date;
    acceptedAt?: Date;
    declinedAt?: Date;
    pickedUpAt?: Date;
    outForDeliveryAt?: Date;
    deliveredAt?: Date;
    completedAt?: Date;
    declineReason?: string;
    declineNotes?: string;
    deliveryProof?: {
        photoUrl?: string;
        signatureUrl?: string;
        customerNote?: string;
        deliveredToPerson?: string;
        deliveredAtTime?: Date;
    };
    deliveredToPerson?: string;
    deliveryNotes?: string;
    tripData?: {
        distanceKm: number;
        estimatedMinutes: number;
        actualMinutes: number;
    };
    startLocation?: {
        lat: number;
        lng: number;
        address?: string;
    };
    destinationLocation?: {
        lat: number;
        lng: number;
        address: string;
    };
    paymentCollection?: {
        amountCollected: number;
        amountPending: number;
        paymentMethod: string;
        collectedAt?: Date;
        reference?: string;
        notes?: string;
    };
    priorityLevel: number;
    isRush: boolean;
    storeId: string;
    pricingConfig?: DeliveryZonePricingConfig;
    freeDeliveryThreshold?: number;
}

export interface DeliveryZone {
    id: string;
    zoneName: string;
    zoneCode: string;
    deliveryFee: number;
    freeDeliveryMinimum?: number;
    minimumOrderValue?: number;
    estimatedDeliveryMinutes?: number;
    polygon?: Array<{ lat: number; lng: number }>;
    displayOrder: number;
    color?: string;
    isActive: boolean;
    storeId: string;
    pricingConfig?: DeliveryZonePricingConfig;
    freeDeliveryThreshold?: number;
}

export interface DeliveryOrderCard {
    orderId: string;
    orderNumber: string;
    orderType: OrderType;
    status: string;
    orderTotal: number;
    deliveryFee: number;
    customerName: string;
    customerPhone?: string;
    deliveryAddress?: {
        lat: number;
        lng: number;
        address: string;
    };
    zoneId?: string;
    zoneCode: string;
    zoneName: string;
    createdAt: Date;
    estimatedDeliveryMinutes: number;
    isRushOrder: boolean;
    driverInfo?: {
        driverId: string;
        driverName: string;
        driverPhone?: string;
        driverStatus: DriverStatus;
        currentLocation?: {
            lat: number;
            lng: number;
            address?: string;
        };
    };
    assignmentId?: string;
    timeInStatus: number;
}

export interface DriverCard {
    driverId: string;
    driverName: string;
    driverPhone?: string;
    status: DriverStatus;
    currentLocation?: {
        lat: number;
        lng: number;
        address?: string;
        lastUpdate: Date;
    };
    maxConcurrentOrders: number;
    currentOrdersCount: number;
    activeOrders: Array<{
        orderId: string;
        orderNumber: string;
        status: AssignmentStatus;
        assignedAt: Date;
        zoneCode: string;
    }>;
    metrics: {
        totalDeliveries: number;
        completedDeliveries: number;
        avgDeliveryTime: number;
        onTimeRate: number;
    };
}

export interface DashboardSummary {
    totalPendingOrders: number;
    totalAssignedOrders: number;
    totalOutForDelivery: number;
    totalReadyForPickup: number;
    totalActiveOrders: number;
    availableDrivers: number;
    busyDrivers: number;
    totalDrivers: number;
    avgDeliveryTimeMinutes: number;
    onTimeDeliveryPercentage: number;
}

// =============================================================================
// AGGREGATOR TYPES
// =============================================================================

export type AggregatorProvider = 'TALABAT' | 'MARSOOL' | 'INSTASHOP' | 'HUNGRY' | 'CAREEM';

export type AggregatorOrderStatus =
    | 'PENDING'
    | 'ACCEPTED'
    | 'PREPARING'
    | 'READY'
    | 'PICKED_UP'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REJECTED';

export interface AggregatorConfig {
    provider: AggregatorProvider;
    enabled: boolean;
    webhookSecret?: string;
    webhookUrl?: string;
    apiEndpoint: string;
    apiKey?: string;
    storeId?: string;
    fixedDeliveryFee?: number;
    commissionRate?: number;
    autoAcceptOrders?: boolean;
    syncIntervalMinutes?: number;
}

export interface AggregatorOrder {
    aggregatorOrderId: string;
    provider: AggregatorProvider;
    customerName: string;
    customerPhone: string;
    deliveryAddress: {
        address: string;
        lat?: number;
        lng?: number;
        zone?: string;
    };
    items: Array<{
        productId?: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        notes?: string;
    }>;
    subtotal: number;
    deliveryFee: number;
    commission: number;
    total: number;
    specialInstructions?: string;
    scheduledFor?: Date;
}

// =============================================================================
// ORDER DISCOUNT TYPES (Enhanced)
// =============================================================================

export type OrderDiscountType = 'CORPORATE_PRESET' | 'MANUAL_PERCENTAGE' | 'MANUAL_AMOUNT' | 'COUPON';

export type OrderDiscountMethod = 'PERCENTAGE' | 'FIXED';

export interface OrderDiscountEntity {
    id: string;
    orderId: string;
    discountType: OrderDiscountType;
    discountMethod: OrderDiscountMethod;
    value: number;
    amount: number;
    authorizedByUserId?: string;
    authorizedAt?: Date;
    corporateCode?: string;
    reason: string;
    createdAt: Date;
}

// =============================================================================
// KITCHEN STATION TYPES
// =============================================================================

export interface KitchenStationEntity {
    id: string;
    stationName: string;
    stationCode: string;
    color?: string;
    icon?: string;
    displayOrder: number;
    isActive: boolean;
    storeId: string;
    pricingConfig?: DeliveryZonePricingConfig;
    freeDeliveryThreshold?: number;
    printerId?: string;
    kdsConfig?: {
        autoBumpSeconds?: number;
        alertThresholdSeconds?: number;
        soundEnabled?: boolean;
    };
}

// =============================================================================
// DELIVERY ZONE PRICING TYPES
// =============================================================================

export interface DistanceTier {
    tierCode: string;
    fee: number;
    increment: number;
    estimatedMinutes: number;
}

export interface PeakHoursSchedule {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
}

export interface DeliveryZonePricingConfig {
    baseFee: number;
    distanceTiers: DistanceTier[];
    freeDeliveryThreshold?: number;
    minimumOrderValue?: number;
    peakHoursPricing?: {
        enabled: boolean;
        surcharge: number;
        schedules: PeakHoursSchedule[];
    };
}

// =============================================================================
// PRINTER ROUTING TYPES (Additional)
// =============================================================================

export interface OrderTypeRule {
    orderType: OrderType;
    autoPrint: {
        customerReceipt: boolean;
        kitchenTickets: boolean;
    };
    receiptPrinterId?: string;
    receiptTemplateId?: string;
    priorityLevel?: number;
}

// =============================================================================
// BLIND CLOSE TYPES
// =============================================================================

export interface Denomination {
    value: number;
    label: string;
    labelAr: string;
    count?: number;
    total?: number;
}

export interface ClosingReport {
    sessionId: string;
    cashierId: string;
    cashierName: string;
    closedAt: Date;
    expectedTotal: number;
    actualCount: number;
    discrepancy: number;
    discrepancyType: 'overage' | 'shortage' | 'balanced';
    denominations: Denomination[];
    payments: {
        method: PaymentMethod;
        expected: number;
        actual: number;
        discrepancy: number;
    }[];
    totals: {
        sales: number;
        tax: number;
        refunds: number;
        voids: number;
        discounts: number;
    };
}

// =============================================================================
// RETURN ORDER TYPES
// =============================================================================

export interface ReturnItemRequest {
    orderItemId: string;
    productName: string;
    quantity: number;
    reason: string;
}

export type ReturnReason =
    | 'DAMAGED'
    | 'DEFECTIVE'
    | 'WRONG_ITEM'
    | 'NOT_NEEDED'
    | 'QUALITY_ISSUE'
    | 'EXPIRED'
    | 'OTHER';

// OrderItem is an alias for CartItem for use in order contexts
export type OrderItem = CartItem;
