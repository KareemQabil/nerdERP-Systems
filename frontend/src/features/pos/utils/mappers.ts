/**
 * POS Type Mappers
 * Convert API types to UI component props
 */
import type { Product, Category, ModifierGroup } from '@/services/product.service';
import type { ProductInfo, ModifierGroup as CartModifierGroup } from '@/types/pos.types';

// =============================================================================
// PRODUCT MAPPERS
// =============================================================================

/**
 * Determine badge type based on product properties
 */
function getBadgeType(product: Product): 'popular' | 'bestseller' | 'new' | null {
    // This could be enhanced with actual backend flags
    // For now, we'll use simple heuristics
    if (!product.isActive) return null;

    // These would ideally come from the backend
    // For now returning null - can enhance later with real data
    return null;
}

/**
 * Check if product has required modifiers
 */
function hasRequiredModifiers(product: Product): boolean {
    return product.modifierGroups?.some(g => g.isRequired) ?? false;
}

/**
 * Map API Product to ProductInfo for cart operations
 */
export function mapProductToProductInfo(product: Product): ProductInfo {
    // MVP: Products are available if active (stock validation deferred until inventory is seeded)
    // TODO: Restore stock check when inventory batches are properly seeded
    const isAvailable = product.isActive;

    return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        nameAr: product.nameAr || null,
        salePrice: product.salePrice,
        imageUrl: product.imageUrl,
        requiresKitchen: product.isPrepared,
        kitchenStation: null, // Would come from backend
        trackInventory: product.trackInventory,
        stockQuantity: product.stockQuantity,
        allowNegativeStock: false,
        modifierGroups: mapModifierGroups(product.modifierGroups || []),
        hasRequiredModifiers: hasRequiredModifiers(product),
        categoryId: product.categoryId || '',
        isAvailable,
        isFeatured: false,
        sortOrder: 0,
        badges: [], // Could be derived from backend data
    };
}

/**
 * Map API ModifierGroup to cart-compatible format
 */
export function mapModifierGroups(groups: ModifierGroup[]): CartModifierGroup[] {
    return groups.map((group, index) => ({
        id: group.id,
        name: group.name,
        nameAr: group.nameAr || null,
        isRequired: group.isRequired,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        selectionType: group.selectionType,
        sortOrder: index,
        modifiers: group.modifiers.map((mod, modIndex) => ({
            id: mod.id,
            name: mod.name,
            nameAr: mod.nameAr || null,
            priceAdjustment: mod.price || '0.000', // Safety fallback for undefined
            isDefault: mod.isDefault,
            isAvailable: mod.isActive,
            isNegative: false,
            sortOrder: mod.sortOrder ?? modIndex,
        })),
    }));
}

// =============================================================================
// PRODUCT CARD PROPS
// =============================================================================

export interface ProductCardPropsFromAPI {
    id: string;
    name: string;
    nameAr: string;
    price: string;
    imageUrl?: string;
    stock: number;
    available: boolean;
    badgeType: 'popular' | 'bestseller' | 'new' | null;
    hasRequiredModifiers: boolean;
    product: ProductInfo;
}

/**
 * Map API Product to ProductCard component props
 */
export function mapProductToCardProps(product: Product): ProductCardPropsFromAPI {
    // MVP: Products are available if active (stock validation deferred)
    const stockCount = parseInt(product.stockQuantity || '0');
    const available = product.isActive;

    return {
        id: product.id,
        name: product.name,
        nameAr: product.nameAr || product.name,
        price: product.salePrice,
        imageUrl: product.imageUrl,
        stock: stockCount,
        available,
        badgeType: getBadgeType(product),
        hasRequiredModifiers: hasRequiredModifiers(product),
        product: mapProductToProductInfo(product),
    };
}

// =============================================================================
// CATEGORY MAPPERS
// =============================================================================

export interface CategoryPillPropsFromAPI {
    id: string;
    name: string;
    nameAr: string;
    icon: string;
}

/**
 * Get icon identifier for category
 * Maps category ID/name to icon identifiers used by the UI
 */
function getCategoryIcon(category: Category): string {
    // Map common category names to icons
    const iconMap: Record<string, string> = {
        'all': 'all',
        'hot drinks': 'hot-drinks',
        'cold drinks': 'cold-drinks',
        'bakery': 'bakery',
        'desserts': 'desserts',
        'salads': 'salads',
        'burgers': 'burger',
        'pizza': 'pizza',
        'sandwiches': 'sandwich',
        'beverages': 'beverage',
    };

    const key = category.name.toLowerCase();
    return iconMap[key] || 'default';
}

/**
 * Map API Category to CategoryPill component props
 */
export function mapCategoryToPillProps(category: Category): CategoryPillPropsFromAPI {
    return {
        id: category.id,
        name: category.name,
        nameAr: category.nameAr || category.name,
        icon: getCategoryIcon(category),
    };
}

/**
 * Create an "All" category for showing all products
 */
export function createAllCategory(): CategoryPillPropsFromAPI {
    return {
        id: '',
        name: 'All',
        nameAr: 'الكل',
        icon: 'all',
    };
}
