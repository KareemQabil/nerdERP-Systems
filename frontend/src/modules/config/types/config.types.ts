/**
 * Config Init Response
 * Complete store configuration returned by /api/config/init
 */
export interface ConfigInitResponse {
    store: {
        id: string;
        name: string;
        currency: string;
        timezone: string;
    };
    theme: Record<string, string | number>;
    translations: Record<string, Record<string, string>>;
    features: FeatureFlags;
    taxes: TaxConfig;
    pos: POSConfig;
    version: string;
    timestamp: string;
}

/**
 * Feature Flags
 */
export interface FeatureFlags {
    modules: {
        pos: boolean;
        inventory: boolean;
        kitchen: boolean;
        customers: boolean;
        reports: boolean;
        settings: boolean;
    };
    pos: {
        dineIn: boolean;
        takeaway: boolean;
        delivery: boolean;
        pickup: boolean;
        driveThru: boolean;
        holdOrders: boolean;
        mergeOrders: boolean;
        splitOrders: boolean;
        transferOrders: boolean;
        splitPayments: boolean;
        partialPayments: boolean;
        tipCollection: boolean;
        kitchenRouting: boolean;
        courseManagement: boolean;
        rushOrders: boolean;
        tableSideOrdering: boolean;
        customerDisplay: boolean;
        qrOrdering: boolean;
    };
    customers: {
        search: boolean;
        quickCreate: boolean;
        loyaltyProgram: boolean;
        storeCredit: boolean;
        giftCards: boolean;
        reservations: boolean;
        feedback: boolean;
    };
    inventory: {
        stockTracking: boolean;
        batchTracking: boolean;
        expiryTracking: boolean;
        lowStockAlerts: boolean;
        autoReorder: boolean;
        recipeManagement: boolean;
        wastageTracking: boolean;
    };
    security: {
        managerPin: boolean;
        shiftManagement: boolean;
        cashDrawerControl: boolean;
        blindCloseout: boolean;
        zatcaCompliance: boolean;
        auditTrail: boolean;
    };
    integrations: {
        onlineOrdering: boolean;
        deliveryPartners: boolean;
        accounting: boolean;
        paymentTerminals: boolean;
        printers: boolean;
        scales: boolean;
    };
}

/**
 * Tax Configuration
 */
export interface TaxConfig {
    vatRate: number;
    vatIncluded: boolean;
    serviceChargeRate: number;
}

/**
 * POS Configuration
 */
export interface POSConfig {
    vatRate: number;
    serviceChargeRate: number;
    serviceChargeAppliesTo: string[];
    currencyCode: string;
    currencySymbol: string;
    currencyDecimalPlaces: number;
    platformDeliveryCharge: number;
    enableDeliveryZones: boolean;
    requireTableForDineIn: boolean;
    requireCustomerCount: boolean;
    voidRequiresManager: boolean;
    deleteAfterSaveRequiresManager: boolean;
    returnRequiresManager: boolean;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
    success: true;
    data: T;
    timestamp: string;
}
