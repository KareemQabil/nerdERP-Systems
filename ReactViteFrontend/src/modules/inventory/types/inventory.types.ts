// Inventory Types from nerdjson.md schema

/**
 * Warehouse Type enum
 */
export type WarehouseType = 'MAIN' | 'KITCHEN' | 'BAR' | 'RETAIL';

/**
 * Stock Move Type enum
 */
export type StockMoveType =
    | 'PURCHASE'
    | 'SALE'
    | 'WASTAGE'
    | 'ADJUSTMENT'
    | 'PRODUCTION'
    | 'TRANSFER'
    | 'RETURN';

/**
 * Purchase Order Status enum
 */
export type PurchaseOrderStatus =
    | 'DRAFT'
    | 'SENT'
    | 'CONFIRMED'
    | 'RECEIVED'
    | 'CANCELLED';

/**
 * Stock Alert Status enum
 */
export type StockAlertStatus = 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';

/**
 * Recipe entity (BOM)
 * Maps to recipes table in nerdjson.md
 */
export interface Recipe {
    id: string;
    productId: string; // Burger
    ingredientId: string; // Beef Patty
    quantityRequired: string; // decimal(10,3) - 0.2 kg per burger
}

/**
 * Inventory Batch entity (FIFO cost tracking)
 * Maps to inventory_batches table in nerdjson.md
 */
export interface InventoryBatch {
    id: string;
    productId: string;
    warehouseId: string;
    batchCode: string;
    supplierId?: string | null;
    purchaseOrderId?: string | null;

    // Financial
    expiryDate?: string | null; // ISO 8601 date
    costPerUnit: string; // decimal(10,3)
    initialQuantity: string; // decimal(10,3)

    // Timestamps
    createdAt: string; // ISO 8601

    // Note: qty_remaining is calculated from stock_moves, not stored
}

/**
 * Stock Move entity (Immutable ledger)
 * Maps to stock_moves table in nerdjson.md
 */
export interface StockMove {
    id: string;
    createdAt: string; // Indexed

    // Product/Location
    productId: string; // Indexed
    warehouseId: string;
    batchId?: string | null;

    // Movement
    qtyChange: string; // decimal(10,3) - +100 in, -5 out
    unitCost: string; // decimal(10,3) - Cost at this transaction

    // Type & Reference
    moveType: StockMoveType;
    refOrderId?: string | null;
    refPurchaseOrderId?: string | null;
    refTransferId?: string | null;

    // Metadata
    reason?: string | null; // Spillage, Expired
    createdByUserId: string;
}

/**
 * Warehouse entity
 * Maps to warehouses table in nerdjson.md
 */
export interface Warehouse {
    id: string;
    name: string; // Main Kitchen, Bar Storage
    type: WarehouseType;
    isActive: boolean;
}

/**
 * Purchase Order entity
 * Maps to purchase_orders table in nerdjson.md
 */
export interface PurchaseOrder {
    id: string;
    poNumber: string; // Unique
    supplierId: string;
    warehouseId: string;

    // Status
    status: PurchaseOrderStatus;
    totalAmount: string; // decimal(10,3)

    // Dates
    orderedAt: string; // ISO 8601
    expectedDeliveryDate?: string | null; // ISO 8601 date
    receivedAt?: string | null; // ISO 8601

    // Metadata
    createdByUserId: string;

    // Relations
    items?: PurchaseOrderItem[];
    supplier?: Supplier;
}

/**
 * Purchase Order Item entity
 * Maps to purchase_order_items table in nerdjson.md
 */
export interface PurchaseOrderItem {
    id: string;
    purchaseOrderId: string;
    productId: string;
    quantityOrdered: string; // decimal(10,3)
    quantityReceived: string; // decimal(10,3)
    unitCost: string; // decimal(10,3)
    lineTotal: string; // decimal(10,3)
}

/**
 * Supplier entity
 * Maps to suppliers table in nerdjson.md
 */
export interface Supplier {
    id: string;
    name: string;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
    taxId?: string | null;
    paymentTerms?: string | null; // Net 30
    isActive: boolean;
}

/**
 * Stock Alert entity
 * Maps to stock_alerts table in nerdjson.md
 */
export interface StockAlert {
    id: string;
    productId: string;
    warehouseId: string;
    minQuantity: string; // decimal(10,3)
    currentQuantity: string; // decimal(10,3)
    alertStatus: StockAlertStatus;
    notifiedAt?: string | null; // ISO 8601
}

/**
 * Stock Level (Calculated)
 * Not a table, but a calculated view
 */
export interface StockLevel {
    productId: string;
    warehouseId: string;
    totalQuantity: string; // Sum of all batches
    availableQuantity: string; // Non-expired
    costValue: string; // Total value at cost
    averageCost: string; // Weighted average
}
