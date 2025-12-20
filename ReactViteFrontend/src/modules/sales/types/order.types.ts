// Sales Order Types from nerdjson.md schema

/**
 * Order Type enum
 * PHASE 4 UPDATE: Expanded to include granular delivery providers
 * for better revenue reporting and analytics
 */
export type OrderType =
    | 'DINE_IN'              // 🍽️ Table service
    | 'TAKEAWAY'             // 📦 Customer pickup
    | 'DRIVE_THRU'           // 🚙 Drive-through service
    | 'DELIVERY_INTERNAL'    // 🚗 In-house delivery driver
    | 'DELIVERY_TALABAT'     // 🛵 Talabat integration
    | 'DELIVERY_UBER'        // 🚚 UberEats integration
    | 'DELIVERY_JAHEZ';      // 🏍️ Jahez (Saudi delivery app)

/**
 * Order Status enum
 */
export type OrderStatus = 'DRAFT' | 'KITCHEN' | 'READY' | 'COMPLETED' | 'VOID' | 'REFUNDED';

/**
 * Payment Status enum
 */
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

/**
 * Sales Order entity
 * Maps to sales_orders table in nerdjson.md
 */
export interface SalesOrder {
    id: string; // uuid
    orderNumber: string; // Unique: ORD-20250101-0001
    publicRef: string; // Short kitchen code: K-102
    invoiceCounter: number; // Sequential per register session

    // Foreign Keys
    registerSessionId: string;
    deviceId: string;
    customerId?: string | null;
    tableId?: string | null;
    servedByUserId: string;

    // Order Info
    orderType: OrderType;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;

    // Financial (decimal(10,3))
    subtotal: string; // Before tax/discounts
    discountAmount: string;
    discountReason?: string | null;
    totalTax: string;
    totalGross: string; // Final amount to pay

    // ZATCA Compliance
    isSimplifiedInvoice: boolean; // B2C vs B2B
    zatcaXmlUuid?: string | null; // Unique invoice identifier
    zatcaInvoiceHash?: string | null; // SHA256 of invoice XML
    zatcaPreviousHash?: string | null; // Cryptographic chain
    zatcaQrCode?: string | null; // TLV-encoded Base64 QR
    zatcaSignature?: string | null;
    zatcaSubmissionStatus?: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    zatcaSubmissionResponse?: Record<string, any> | null;

    // Metadata
    notes?: string | null;
    createdAt: string; // ISO 8601
    updatedAt: string;
    completedAt?: string | null;
    voidedAt?: string | null;
    voidedByUserId?: string | null;
    voidReason?: string | null;

    // Relations (populated via joins)
    items?: OrderItem[];
    payments?: Payment[];
    customer?: any; // TODO: Import Customer type
    table?: any; // TODO: Import Table type
}

/**
 * Order Item entity
 * Maps to order_items table in nerdjson.md
 */
export interface OrderItem {
    id: string;
    orderId: string; // ON DELETE CASCADE
    lineNumber: number; // Display sequence

    // Product Info (snapshot at sale time)
    productId: string;
    productName: string;
    sku: string;

    // Pricing (decimal(10,3))
    quantity: string;
    unitPrice: string; // Base price before modifiers
    modifiersTotal: string;
    lineDiscount: string;
    lineSubtotal: string; // (unit_price + modifiers) * qty - discount
    taxRate: string; // decimal(5,2) - 15.00 for Saudi VAT
    taxAmount: string;
    lineTotal: string;

    // Costing
    costAtSale: string; // FIFO cost for margin calculation

    // Modifiers
    selectedModifiers?: ModifierSnapshot[] | null; // JSON [{modifier_id, option_id, price}]
    specialInstructions?: string | null;

    // Void tracking
    isVoided: boolean;
    voidedQuantity: string;
}

/**
 * Modifier snapshot stored in JSON
 */
export interface ModifierSnapshot {
    modifierId: string;
    modifierName: string;
    optionId: string;
    optionName: string;
    price: string; // decimal(10,3)
}

/**
 * Payment entity
 * Maps to payments table in nerdjson.md
 */
export interface Payment {
    id: string;
    orderId: string;
    registerSessionId: string;

    // Payment Info
    paymentMethod: PaymentMethod;
    amount: string; // decimal(10,3)
    receivedAmount: string; // Cash received (for change calc)
    changeGiven: string;

    // Card details
    cardLast4?: string | null;
    cardType?: string | null; // Visa, Mada
    transactionRef?: string | null; // Bank reference

    // Status
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    createdAt: string;
    processedByUserId: string;
}

/**
 * Payment Method enum
 */
export type PaymentMethod =
    | 'CASH'
    | 'CARD'
    | 'BANK_TRANSFER'
    | 'MOBILE_WALLET'
    | 'CREDIT_ACCOUNT'
    | 'LOYALTY_POINTS';

/**
 * Create Order DTO
 */
export interface CreateOrderDto {
    registerSessionId: string;
    deviceId: string;
    orderType: OrderType;
    customerId?: string;
    tableId?: string;
    items: CreateOrderItemDto[];
}

export interface CreateOrderItemDto {
    productId: string;
    quantity: string; // decimal(10,3)
    selectedModifiers?: Array<{
        modifierId: string;
        optionId: string;
    }>;
    specialInstructions?: string;
}

/**
 * Order Filter DTO
 */
export interface OrderFilterDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    registerSessionId?: string;
    customerId?: string;
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
    dateFrom?: string; // ISO 8601
    dateTo?: string; // ISO 8601
    orderNumber?: string; // Partial match
}
