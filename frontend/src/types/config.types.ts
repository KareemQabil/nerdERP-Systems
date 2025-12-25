/**
 * Configuration Types
 * Central type definitions for feature flags, permissions, and configuration
 */

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export interface FeatureFlags {
    // Core Modules
    modules: {
        pos: boolean;
        inventory: boolean;
        kitchen: boolean;
        customers: boolean;
        reports: boolean;
        settings: boolean;
    };

    // POS Features
    pos: {
        // Order Types
        dineIn: boolean;
        takeaway: boolean;
        delivery: boolean;
        pickup: boolean;
        driveThru: boolean;

        // Order Features
        holdOrders: boolean;
        mergeOrders: boolean;
        splitOrders: boolean;
        transferOrders: boolean;

        // Payment
        splitPayments: boolean;
        partialPayments: boolean;
        tipCollection: boolean;

        // Kitchen
        kitchenRouting: boolean;
        courseManagement: boolean;
        rushOrders: boolean;

        // Other
        tableSideOrdering: boolean;
        customerDisplay: boolean;
        qrOrdering: boolean;
    };

    // Customer Features
    customers: {
        search: boolean;
        quickCreate: boolean;
        loyaltyProgram: boolean;
        storeCredit: boolean;
        giftCards: boolean;
        reservations: boolean;
        feedback: boolean;
    };

    // Inventory Features
    inventory: {
        stockTracking: boolean;
        batchTracking: boolean;
        expiryTracking: boolean;
        lowStockAlerts: boolean;
        autoReorder: boolean;
        recipeManagement: boolean;
        wastageTracking: boolean;
    };

    // Security & Compliance
    security: {
        managerPin: boolean;
        shiftManagement: boolean;
        cashDrawerControl: boolean;
        blindCloseout: boolean;
        zatcaCompliance: boolean;
        auditTrail: boolean;
    };

    // Integrations
    integrations: {
        onlineOrdering: boolean;
        deliveryPartners: boolean;
        accounting: boolean;
        paymentTerminals: boolean;
        printers: boolean;
        scales: boolean;
    };
}

// =============================================================================
// POS CONFIGURATION
// =============================================================================

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'PICKUP' | 'DRIVE_THRU';
export type PaymentMethodType = 'CASH' | 'CARD' | 'GIFT_CARD' | 'LOYALTY_POINTS' | 'STORE_CREDIT';

export interface POSConfig {
    // Order Types
    enabledOrderTypes: OrderType[];
    defaultOrderType: OrderType;

    // Payments
    enabledPaymentMethods: PaymentMethodType[];

    // Tax
    taxRate: string;
    taxIncluded: boolean;

    // Currency
    currency: string;
    currencySymbol: string;
    currencyPosition: 'before' | 'after';
    decimalPlaces: number;

    // Security
    requirePinFor: ('DISCOUNT' | 'VOID' | 'REFUND' | 'CASH_DROP' | 'PRICE_OVERRIDE')[];
    sessionTimeout: number; // minutes

    // Display
    showStockLevels: boolean;
    lowStockThreshold: number;
    compactCartMode: boolean;

    // Limits
    maxDiscountPercent: number;
    maxRefundWithoutAuth: string;
}

// =============================================================================
// PERMISSIONS
// =============================================================================

export type Permission =
    // POS
    | 'pos.view'
    | 'pos.create_order'
    | 'pos.modify_order'
    | 'pos.void_item'
    | 'pos.void_order'
    | 'pos.apply_discount'
    | 'pos.apply_discount_above_limit'
    | 'pos.hold_order'
    | 'pos.recall_order'
    | 'pos.process_refund'
    | 'pos.split_payment'
    | 'pos.open_cash_drawer'
    | 'pos.view_previous_orders'
    | 'pos.price_override'
    | 'pos.*'

    // Customers
    | 'customers.view'
    | 'customers.create'
    | 'customers.edit'
    | 'customers.delete'
    | 'customers.view_balance'
    | 'customers.adjust_balance'
    | 'customers.*'

    // Products
    | 'products.view'
    | 'products.create'
    | 'products.edit'
    | 'products.delete'
    | 'products.adjust_price'
    | 'products.*'

    // Inventory
    | 'inventory.view'
    | 'inventory.adjust'
    | 'inventory.transfer'
    | 'inventory.receive'
    | 'inventory.waste'
    | 'inventory.*'

    // Kitchen
    | 'kitchen.view'
    | 'kitchen.update_status'
    | 'kitchen.*'

    // Reports
    | 'reports.view_sales'
    | 'reports.view_inventory'
    | 'reports.view_staff'
    | 'reports.export'
    | 'reports.*'

    // Cash
    | 'cash.open_session'
    | 'cash.close_session'
    | 'cash.drop'
    | 'cash.payout'
    | 'cash.float'
    | 'cash.*'

    // Settings
    | 'settings.view'
    | 'settings.edit'
    | 'settings.manage_users'
    | 'settings.manage_roles'
    | 'settings.*'

    // Delivery
    | 'delivery.view'
    | 'delivery.manage'
    | 'delivery.*'

    // Admin (superuser)
    | 'admin.all';

// =============================================================================
// ROLES
// =============================================================================

export interface RoleLimits {
    maxDiscountPercent?: number;
    maxRefundAmount?: string;
    maxVoidAmount?: string;
    maxCashDrop?: string;
}

export interface Role {
    id: string;
    name: string;
    nameAr: string;
    permissions: Permission[];
    isSystem: boolean; // Built-in roles can't be deleted
    limits?: RoleLimits;
}

// Preset system roles
export const PRESET_ROLES: Role[] = [
    {
        id: 'owner',
        name: 'Owner',
        nameAr: 'المالك',
        permissions: ['admin.all'],
        isSystem: true,
    },
    {
        id: 'manager',
        name: 'Manager',
        nameAr: 'مدير',
        permissions: [
            'pos.*',
            'customers.*',
            'products.view',
            'products.edit',
            'inventory.*',
            'reports.*',
            'cash.*',
            'settings.view',
        ],
        isSystem: true,
        limits: { maxDiscountPercent: 50 },
    },
    {
        id: 'cashier',
        name: 'Cashier',
        nameAr: 'كاشير',
        permissions: [
            'pos.view',
            'pos.create_order',
            'pos.modify_order',
            'pos.apply_discount',
            'pos.split_payment',
            'pos.hold_order',
            'pos.recall_order',
            'customers.view',
            'customers.create',
            'cash.open_session',
            'cash.close_session',
        ],
        isSystem: true,
        limits: { maxDiscountPercent: 10 },
    },
    {
        id: 'server',
        name: 'Server',
        nameAr: 'نادل',
        permissions: [
            'pos.view',
            'pos.create_order',
            'pos.modify_order',
            'pos.hold_order',
            'pos.recall_order',
            'customers.view',
        ],
        isSystem: true,
        limits: { maxDiscountPercent: 0 },
    },
    {
        id: 'kitchen',
        name: 'Kitchen Staff',
        nameAr: 'طاقم المطبخ',
        permissions: ['kitchen.view', 'kitchen.update_status'],
        isSystem: true,
    },
];

// =============================================================================
// ORGANIZATION & STORE
// =============================================================================

export interface Organization {
    id: string;
    name: string;
    nameAr: string;
    logo?: string;
    country: string;
    timezone: string;
    currency: string;
}

export interface Store {
    id: string;
    organizationId: string;
    name: string;
    nameAr: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive: boolean;
}

// =============================================================================
// CUSTOM FIELDS
// =============================================================================

export type CustomFieldType =
    | 'TEXT'
    | 'TEXTAREA'
    | 'NUMBER'
    | 'DECIMAL'
    | 'DATE'
    | 'DATETIME'
    | 'BOOLEAN'
    | 'SELECT'
    | 'MULTI_SELECT'
    | 'FILE'
    | 'IMAGE'
    | 'URL'
    | 'EMAIL'
    | 'PHONE'
    | 'COLOR';

export type CustomFieldEntity =
    | 'PRODUCT'
    | 'CATEGORY'
    | 'CUSTOMER'
    | 'ORDER'
    | 'ORDER_ITEM'
    | 'USER'
    | 'TABLE'
    | 'WAREHOUSE';

export interface CustomFieldOption {
    value: string;
    label: string;
    labelAr: string;
}

export interface CustomFieldValidation {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
}

export interface CustomFieldDefinition {
    id: string;
    entity: CustomFieldEntity;
    fieldKey: string;
    fieldName: string;
    fieldNameAr: string;
    fieldType: CustomFieldType;
    isRequired: boolean;
    isSearchable: boolean;
    isFilterable: boolean;
    showInList: boolean;
    showInDetail: boolean;
    sortOrder: number;
    defaultValue?: unknown;
    validation?: CustomFieldValidation;
    options?: CustomFieldOption[];
}

// =============================================================================
// WORKFLOW
// =============================================================================

export type WorkflowType =
    | 'ORDER_CREATION'
    | 'ORDER_MODIFICATION'
    | 'ORDER_COMPLETION'
    | 'DISCOUNT_APPLICATION'
    | 'VOID_ITEM'
    | 'VOID_ORDER'
    | 'REFUND'
    | 'CASH_DROP'
    | 'CASH_PAYOUT'
    | 'STOCK_ADJUSTMENT'
    | 'PRICE_CHANGE'
    | 'SHIFT_CLOSE';

export interface WorkflowConfig {
    type: WorkflowType;
    name: string;
    nameAr: string;
    isActive: boolean;
    steps: WorkflowStep[];
}

export interface WorkflowStep {
    id: string;
    type: 'VALIDATION' | 'AUTHORIZATION' | 'ACTION' | 'NOTIFICATION';
    order: number;
    isOptional: boolean;
    config: Record<string, unknown>;
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
    modules: {
        pos: true,
        inventory: true,
        kitchen: false,
        customers: true,
        reports: true,
        settings: true,
    },
    pos: {
        dineIn: true,
        takeaway: true,
        delivery: false,
        pickup: false,
        driveThru: false,
        holdOrders: true,
        mergeOrders: false,
        splitOrders: false,
        transferOrders: false,
        splitPayments: true,
        partialPayments: false,
        tipCollection: false,
        kitchenRouting: false,
        courseManagement: false,
        rushOrders: false,
        tableSideOrdering: false,
        customerDisplay: false,
        qrOrdering: false,
    },
    customers: {
        search: true,
        quickCreate: true,
        loyaltyProgram: false,
        storeCredit: false,
        giftCards: false,
        reservations: false,
        feedback: false,
    },
    inventory: {
        stockTracking: true,
        batchTracking: false,
        expiryTracking: false,
        lowStockAlerts: true,
        autoReorder: false,
        recipeManagement: false,
        wastageTracking: false,
    },
    security: {
        managerPin: true,
        shiftManagement: true,
        cashDrawerControl: false,
        blindCloseout: false,
        zatcaCompliance: true,
        auditTrail: true,
    },
    integrations: {
        onlineOrdering: false,
        deliveryPartners: false,
        accounting: false,
        paymentTerminals: false,
        printers: true,
        scales: false,
    },
};

export const DEFAULT_POS_CONFIG: POSConfig = {
    enabledOrderTypes: ['TAKEAWAY', 'DINE_IN'],
    defaultOrderType: 'TAKEAWAY',
    enabledPaymentMethods: ['CASH', 'CARD'],
    taxRate: '15.000',
    taxIncluded: false,
    currency: 'SAR',
    currencySymbol: 'ر.س',
    currencyPosition: 'after',
    decimalPlaces: 3,
    requirePinFor: ['DISCOUNT', 'VOID', 'REFUND'],
    sessionTimeout: 30,
    showStockLevels: true,
    lowStockThreshold: 5,
    compactCartMode: false,
    maxDiscountPercent: 100,
    maxRefundWithoutAuth: '0.000',
};
