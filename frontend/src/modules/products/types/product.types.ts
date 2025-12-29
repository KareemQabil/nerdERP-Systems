/**
 * Product Types
 * Matches backend DTOs for type safety
 */

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export enum ProductType {
    STANDARD = 'STANDARD',
    SERVICE = 'SERVICE',
    COMBO = 'COMBO',
}

// ═══════════════════════════════════════════════════════════
// MODIFIER TYPES
// ═══════════════════════════════════════════════════════════

export interface ModifierOption {
    id: string;
    optionName: string;
    optionNameAr?: string;
    priceAdjustment: number;
    isDefault: boolean;
    displayOrder: number;
    deductProductId?: string;
    deductQuantity?: number;
}

export interface ModifierGroup {
    id: string;
    modifierName: string;
    modifierNameAr?: string;
    isRequired: boolean;
    minSelections: number;
    maxSelections: number;
    displayOrder: number;
    options: ModifierOption[];
}

// ═══════════════════════════════════════════════════════════
// CATEGORY
// ═══════════════════════════════════════════════════════════

export interface ProductCategory {
    id: string;
    name: string;
    nameAr?: string;
    imageUrl?: string;
    displayOrder: number;
}

// ═══════════════════════════════════════════════════════════
// PRODUCT
// ═══════════════════════════════════════════════════════════

export interface Product {
    id: string;
    sku: string;
    barcode?: string;
    name: string;
    nameAr?: string;
    type: ProductType;
    salePrice: number;
    costPrice: number;
    trackInventory: boolean;
    isActive: boolean;
    isKitchenItem: boolean;
    printToKitchen?: boolean;
    defaultPrepTimeMinutes?: number;
    isPrepared?: boolean;
    discountExempt?: boolean;
    priceIncludesTax?: boolean;
    imageUrl?: string;
    categoryId?: string;
    category?: ProductCategory;
    modifierGroups?: ModifierGroup[];
    behaviorConfig?: {
        allow_modifiers?: boolean;
        require_modifier?: boolean;
        allow_open_price?: boolean;
        min_quantity?: number;
        max_quantity?: number;
        age_restricted?: boolean;
    };
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

// ═══════════════════════════════════════════════════════════
// QUERY PARAMS
// ═══════════════════════════════════════════════════════════

export interface ProductQueryParams {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    isActive?: boolean;
    isKitchenItem?: boolean;
    includeModifiers?: boolean;
}

// ═══════════════════════════════════════════════════════════
// PAGINATED RESULT
// ═══════════════════════════════════════════════════════════

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    success: boolean;
    data: T[];
    meta: PaginationMeta;
    timestamp: string;
}
