import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Config Init Request
 * Used for fetching store initialization configuration
 */
export class ConfigInitDto {
    @ApiPropertyOptional({ description: 'Store ID' })
    @IsString()
    storeId: string;

    @ApiPropertyOptional({ description: 'Language code', default: 'ar' })
    @IsString()
    @IsOptional()
    languageCode?: string = 'ar';
}

/**
 * Store Info Response
 */
export interface StoreInfoResponse {
    id: string;
    name: string;
    currency: string;
    timezone: string;
}

/**
 * Theme Configuration Response
 */
export interface ThemeConfigResponse {
    primary: string;
    secondary: string;
    glassOpacity: number;
    borderRadius: string;
    fontFamily: string;
    themeMode: 'light' | 'dark' | 'luxury';
    [key: string]: string | number;
}

/**
 * Feature Flags Response
 */
export interface FeatureFlagsResponse {
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
 * Tax Configuration Response
 */
export interface TaxConfigResponse {
    vatRate: number;
    vatIncluded: boolean;
    serviceChargeRate: number;
}

/**
 * POS Configuration Response
 */
export interface POSConfigResponse {
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
 * Complete Config Init Response
 */
export interface ConfigInitResponse {
    store: StoreInfoResponse;
    theme: ThemeConfigResponse;
    translations: Record<string, Record<string, string>>;
    features: FeatureFlagsResponse;
    taxes: TaxConfigResponse;
    pos: POSConfigResponse;
    version: string;
    timestamp: string;
}
