// Product Types from nerdjson.md schema

/**
 * Product Type enum
 */
export type ProductType = 'PRODUCT' | 'INGREDIENT' | 'SERVICE' | 'COMBO';

/**
 * Product entity
 * Maps to products table in nerdjson.md
 */
export interface Product {
    id: string; // uuid
    sku: string; // Unique
    barcode?: string | null; // Unique
    name: string;
    nameAr?: string | null; // Arabic for receipts
    description?: string | null;

    // Category
    categoryId: string;
    type: ProductType;

    // Pricing (decimal(10,3))
    salePrice: string;
    costPrice: string; // Average cost

    // Tax
    taxRate: string; // decimal(5,2) - Default 15.00
    isTaxInclusive: boolean;
    isTaxExempt: boolean;
    taxExemptReason?: string | null;

    // Inventory
    isStockManaged: boolean;
    unitOfMeasure: string; // pcs, kg, liter

    // Kitchen
    kitchenStationId?: string | null;

    // UI
    imageUrl?: string | null;
    displayOrder: number;
    isActive: boolean;
    isFeatured: boolean;

    // Timestamps
    createdAt: string; // ISO 8601
    updatedAt: string;

    // Relations (populated via joins)
    category?: ProductCategory;
    modifiers?: ProductModifier[];
}

/**
 * Product Category entity
 * Maps to product_categories table in nerdjson.md
 */
export interface ProductCategory {
    id: string;
    name: string;
    nameAr?: string | null;
    parentId?: string | null; // Self-referencing
    displayOrder: number;
    colorHex: string; // UI color coding

    // Relations
    children?: ProductCategory[];
    products?: Product[];
}

/**
 * Modifier entity
 * Maps to modifiers table in nerdjson.md
 */
export interface Modifier {
    id: string;
    name: string; // Size, Add-ons
    nameAr?: string | null;
    minSelection: number; // Default 0
    maxSelection: number; // Default 1
    isRequired: boolean;
    displayOrder: number;

    // Relations
    options?: ModifierOption[];
}

/**
 * Modifier Option entity
 * Maps to modifier_options table in nerdjson.md
 */
export interface ModifierOption {
    id: string;
    modifierId: string;
    name: string; // Small, Large, Extra Cheese
    nameAr?: string | null;
    priceAdjustment: string; // decimal(10,3) - +5.00 for Extra Cheese
    priceType: 'FIXED' | 'PERCENTAGE';
    isDefault: boolean;
    displayOrder: number;
}

/**
 * Product Modifier Link
 * Maps to product_modifiers table in nerdjson.md
 */
export interface ProductModifier {
    id: string;
    productId: string;
    modifierId: string;
    displayOrder: number;

    // Relations
    modifier?: Modifier;
}

/**
 * Product Filter DTO
 */
export interface ProductFilterDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    categoryId?: string;
    type?: ProductType;
    isActive?: boolean;
    isFeatured?: boolean;
    search?: string; // Search by name, sku, barcode
}

/**
 * Create Product DTO
 */
export interface CreateProductDto {
    sku: string;
    barcode?: string;
    name: string;
    nameAr?: string;
    description?: string;
    categoryId: string;
    type: ProductType;
    salePrice: string; // decimal(10,3)
    costPrice: string;
    taxRate?: string; // Default 15.00
    isTaxInclusive?: boolean; // Default true
    isStockManaged?: boolean; // Default true
    unitOfMeasure: string;
    kitchenStationId?: string;
    imageUrl?: string;
    displayOrder?: number;
    isActive?: boolean; // Default true
    isFeatured?: boolean; // Default false
}

/**
 * Update Product DTO
 */
export interface UpdateProductDto extends Partial<CreateProductDto> {
    id: string;
}
