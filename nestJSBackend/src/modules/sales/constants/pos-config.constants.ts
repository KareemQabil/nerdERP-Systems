/**
 * H-POS Configuration Keys
 * Enterprise-grade configuration for MENA region POS systems
 * All settings configurable per store via store_configurations table
 */

// =============================================================================
// Configuration Key Constants
// =============================================================================

export const POS_CONFIG_KEYS = {
    // Tax & Charges
    VAT_RATE: 'pos.vat_rate',                           // e.g., 0.14 for 14%
    SERVICE_CHARGE_RATE: 'pos.service_charge_rate',     // e.g., 0.12 for 12%
    SERVICE_CHARGE_APPLIES_TO: 'pos.service_charge_applies_to', // ['DINE_IN']

    // Currency
    CURRENCY_CODE: 'pos.currency_code',                 // e.g., 'EGP', 'SAR', 'AED'
    CURRENCY_SYMBOL: 'pos.currency_symbol',             // e.g., 'ج.م', 'ر.س', 'د.إ'
    CURRENCY_DECIMAL_PLACES: 'pos.currency_decimal_places', // e.g., 2

    // Delivery
    PLATFORM_DELIVERY_CHARGE: 'pos.platform_delivery_charge', // Fixed charge for aggregators
    ENABLE_DELIVERY_ZONES: 'pos.enable_delivery_zones',       // true/false

    // Order Operations
    REQUIRE_TABLE_FOR_DINE_IN: 'pos.require_table_for_dine_in',
    REQUIRE_CUSTOMER_COUNT: 'pos.require_customer_count',
    AUTO_FIRE_KITCHEN_ON_SAVE: 'pos.auto_fire_kitchen_on_save',

    // Manager Approvals
    VOID_REQUIRES_MANAGER: 'pos.void_requires_manager',
    DELETE_AFTER_SAVE_REQUIRES_MANAGER: 'pos.delete_after_save_requires_manager',
    RETURN_REQUIRES_MANAGER: 'pos.return_requires_manager',

    // Receipts
    PRINT_CUSTOMER_COPY: 'pos.print_customer_copy',
    PRINT_KITCHEN_COPY: 'pos.print_kitchen_copy',
} as const;

// =============================================================================
// Default Values (used when no store config is set)
// =============================================================================

export const POS_CONFIG_DEFAULTS = {
    // Tax & Charges - MENA defaults
    [POS_CONFIG_KEYS.VAT_RATE]: 0.14,                    // 14% VAT (Egypt)
    [POS_CONFIG_KEYS.SERVICE_CHARGE_RATE]: 0.12,         // 12% service charge
    [POS_CONFIG_KEYS.SERVICE_CHARGE_APPLIES_TO]: ['DINE_IN'],

    // Currency
    [POS_CONFIG_KEYS.CURRENCY_CODE]: 'EGP',
    [POS_CONFIG_KEYS.CURRENCY_SYMBOL]: 'ج.م',
    [POS_CONFIG_KEYS.CURRENCY_DECIMAL_PLACES]: 2,

    // Delivery
    [POS_CONFIG_KEYS.PLATFORM_DELIVERY_CHARGE]: 50,
    [POS_CONFIG_KEYS.ENABLE_DELIVERY_ZONES]: true,

    // Order Operations
    [POS_CONFIG_KEYS.REQUIRE_TABLE_FOR_DINE_IN]: true,
    [POS_CONFIG_KEYS.REQUIRE_CUSTOMER_COUNT]: true,
    [POS_CONFIG_KEYS.AUTO_FIRE_KITCHEN_ON_SAVE]: false,

    // Manager Approvals
    [POS_CONFIG_KEYS.VOID_REQUIRES_MANAGER]: true,
    [POS_CONFIG_KEYS.DELETE_AFTER_SAVE_REQUIRES_MANAGER]: true,
    [POS_CONFIG_KEYS.RETURN_REQUIRES_MANAGER]: true,

    // Receipts
    [POS_CONFIG_KEYS.PRINT_CUSTOMER_COPY]: true,
    [POS_CONFIG_KEYS.PRINT_KITCHEN_COPY]: true,
};

// =============================================================================
// Type Definitions
// =============================================================================

export interface POSConfig {
    // Tax & Charges
    vatRate: number;
    serviceChargeRate: number;
    serviceChargeAppliesTo: string[];

    // Currency
    currencyCode: string;
    currencySymbol: string;
    currencyDecimalPlaces: number;

    // Delivery
    platformDeliveryCharge: number;
    enableDeliveryZones: boolean;

    // Order Operations
    requireTableForDineIn: boolean;
    requireCustomerCount: boolean;
    autoFireKitchenOnSave: boolean;

    // Manager Approvals
    voidRequiresManager: boolean;
    deleteAfterSaveRequiresManager: boolean;
    returnRequiresManager: boolean;

    // Receipts
    printCustomerCopy: boolean;
    printKitchenCopy: boolean;
}

// =============================================================================
// Country Presets (for quick setup)
// =============================================================================

export const COUNTRY_PRESETS: Record<string, Partial<POSConfig>> = {
    EGYPT: {
        vatRate: 0.14,
        currencyCode: 'EGP',
        currencySymbol: 'ج.م',
        serviceChargeRate: 0.12,
    },
    SAUDI_ARABIA: {
        vatRate: 0.15,
        currencyCode: 'SAR',
        currencySymbol: 'ر.س',
        serviceChargeRate: 0.10,
    },
    UAE: {
        vatRate: 0.05,
        currencyCode: 'AED',
        currencySymbol: 'د.إ',
        serviceChargeRate: 0.10,
    },
    QATAR: {
        vatRate: 0,
        currencyCode: 'QAR',
        currencySymbol: 'ر.ق',
        serviceChargeRate: 0.10,
    },
    KUWAIT: {
        vatRate: 0,
        currencyCode: 'KWD',
        currencySymbol: 'د.ك',
        serviceChargeRate: 0.10,
    },
    BAHRAIN: {
        vatRate: 0.10,
        currencyCode: 'BHD',
        currencySymbol: 'د.ب',
        serviceChargeRate: 0.10,
    },
    OMAN: {
        vatRate: 0.05,
        currencyCode: 'OMR',
        currencySymbol: 'ر.ع',
        serviceChargeRate: 0.10,
    },
};
