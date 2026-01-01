/**
 * POS Data Hooks
 * Fetches categories, products, and modifiers with smart fallback to mock data
 * Migrated to RTK Query from TanStack Query
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    useGetActiveCategoriesQuery,
    useGetProductsForPOSQuery,
    useGetProductWithModifiersQuery,
    useGetModifierGroupsForProductQuery,
    type Category,
    type Product,
    type ModifierGroup,
} from '@/features/pos/api/productsApi';
import { mockCategories, mockProducts, mockModifierGroups } from '@/data/mock-pos-data';

// =============================================================================
// TYPES
// =============================================================================

export interface UsePOSDataOptions {
    /** Currently selected category ID (null or empty = all) */
    categoryId?: string | null;
    /** Search query for filtering products */
    searchQuery?: string;
    /** Whether to enable mock data fallback */
    enableFallback?: boolean;
}

export interface UsePOSDataResult {
    /** Categories for filtering */
    categories: Category[];
    /** Products to display */
    products: Product[];
    /** Whether data is loading */
    isLoading: boolean;
    /** Whether using mock fallback data */
    isUsingMockData: boolean;
    /** Error if any (only when fallback disabled) */
    error: Error | null;
    /** Refetch all data */
    refetch: () => void;
}

// =============================================================================
// MOCK DATA CONVERTERS
// =============================================================================

/** Convert mock category to API Category type */
function mockToCategory(mock: typeof mockCategories[0]): Category {
    return {
        id: mock.id,
        name: mock.name,
        nameAr: mock.nameAr,
        sortOrder: parseInt(mock.id),
        isActive: true,
    };
}

/** Convert mock product to API Product type */
function mockToProduct(mock: typeof mockProducts[0]): Product {
    return {
        id: mock.id,
        name: mock.name,
        nameAr: mock.nameAr,
        sku: `SKU-${mock.id}`,
        salePrice: mock.price,
        taxable: true,
        imageUrl: mock.image,
        isActive: true,
        isPrepared: false,
        trackInventory: true,
        stockQuantity: String(mock.stock),
        modifierGroups: mock.hasModifiers ? mockModifierGroups.map(mockToModifierGroup) : [],
    };
}

/** Convert mock modifier group to API ModifierGroup type */
function mockToModifierGroup(mock: typeof mockModifierGroups[0]): ModifierGroup {
    return {
        id: mock.id,
        name: mock.name,
        nameAr: mock.nameAr || undefined,
        selectionType: mock.selectionType,
        isRequired: mock.isRequired,
        minSelections: mock.minSelections,
        maxSelections: mock.maxSelections,
        modifiers: mock.modifiers.map(m => ({
            id: m.id,
            groupId: mock.id,
            name: m.name,
            nameAr: m.nameAr || undefined,
            price: m.priceAdjustment,
            isDefault: m.isDefault,
            isActive: m.isAvailable,
            sortOrder: m.sortOrder,
        })),
    };
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Main hook for fetching all POS data
 * Uses RTK Query with smart fallback to mock data
 */
export function usePOSData(options: UsePOSDataOptions = {}): UsePOSDataResult {
    const {
        categoryId = null,
        searchQuery = '',
        enableFallback = true
    } = options;

    const [isUsingMockData, setIsUsingMockData] = useState(false);

    // Fetch categories with RTK Query
    const {
        data: categoriesData,
        isLoading: categoriesLoading,
        error: categoriesError,
        refetch: refetchCategories,
    } = useGetActiveCategoriesQuery(undefined, {
        // Polling disabled, manual refetch only
        pollingInterval: 0,
    });

    // Fetch products with RTK Query
    const {
        data: productsData,
        isLoading: productsLoading,
        error: productsError,
        refetch: refetchProducts,
    } = useGetProductsForPOSQuery(
        {
            categoryId: categoryId || undefined,
            search: searchQuery || undefined,
        },
        {
            // Polling disabled, manual refetch only
            pollingInterval: 0,
        }
    );

    // Handle fallback logic for categories
    const categories = useMemo(() => {
        // If API succeeded with data, use it
        if (categoriesData && categoriesData.length > 0) {
            setIsUsingMockData(false);
            return categoriesData;
        }

        // If API failed or returned empty and fallback is enabled
        if (enableFallback && (categoriesError || !categoriesData || categoriesData.length === 0)) {
            if (categoriesError) {
                console.warn('[POS] Using mock categories - API error:', categoriesError);
            } else {
                console.warn('[POS] Using mock categories - API returned empty');
            }
            setIsUsingMockData(true);
            return mockCategories.map(mockToCategory);
        }

        // No fallback, return empty or API data
        return categoriesData || [];
    }, [categoriesData, categoriesError, enableFallback]);

    // Handle fallback logic for products
    const products = useMemo(() => {
        // If API succeeded with data, use it
        if (productsData && productsData.length > 0) {
            setIsUsingMockData(false);
            return productsData;
        }

        // If API failed or returned empty (but only fallback if no search query)
        if (enableFallback && (productsError || (!productsData || productsData.length === 0)) && !searchQuery) {
            if (productsError) {
                console.warn('[POS] Using mock products - API error:', productsError);
            } else {
                console.warn('[POS] Using mock products - API returned empty');
            }
            setIsUsingMockData(true);

            // Apply local filtering to mock data
            let filtered = mockProducts.map(mockToProduct);

            // Note: categoryId filtering not implemented for mock data
            // as mock data doesn't have categoryId field

            return filtered;
        }

        // If there's a search query and API returned empty, return empty (not mock)
        if (searchQuery && (!productsData || productsData.length === 0)) {
            return [];
        }

        // No fallback, return empty or API data
        return productsData || [];
    }, [productsData, productsError, searchQuery, enableFallback]);

    // Refetch function
    const refetch = useCallback(() => {
        refetchCategories();
        refetchProducts();
    }, [refetchCategories, refetchProducts]);

    // Determine if using mock data based on either query
    const usingMockData = isUsingMockData;

    // Combine errors
    const error = (!enableFallback && (categoriesError || productsError))
        ? (categoriesError || productsError) as Error
        : null;

    return {
        categories,
        products,
        isLoading: categoriesLoading || productsLoading,
        isUsingMockData: usingMockData,
        error,
        refetch,
    };
}

/**
 * Hook for fetching modifiers for a specific product
 */
export function useProductModifiers(productId: string | null, enabled = true) {
    const [isUsingMockData, setIsUsingMockData] = useState(false);

    const {
        data,
        isLoading,
        error,
    } = useGetModifierGroupsForProductQuery(productId!, {
        skip: !enabled || !productId,
    });

    // Handle fallback to mock data
    const modifierGroups = useMemo(() => {
        if (data && data.length > 0) {
            setIsUsingMockData(false);
            return data;
        }

        // Fallback to mock data on error or empty response
        if (error || !data || data.length === 0) {
            if (error) {
                console.warn('[POS] Using mock modifiers - API error:', error);
            }
            setIsUsingMockData(true);
            return mockModifierGroups.map(mockToModifierGroup);
        }

        return data || [];
    }, [data, error]);

    return {
        modifierGroups,
        isLoading,
        isUsingMockData,
        error: error as Error | null,
    };
}

/**
 * Hook for product search with debouncing built-in
 * This returns the search query setter - actual fetching is done by usePOSData
 */
export function useProductSearch(debounceMs = 300) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce the search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchQuery, debounceMs]);

    return {
        searchQuery,
        debouncedQuery,
        setSearchQuery,
        clearSearch: () => setSearchQuery(''),
    };
}

/**
 * Hook for getting a single product with full details including modifiers
 */
export function useProductDetails(productId: string | null, enabled = true) {
    const [isUsingMockData, setIsUsingMockData] = useState(false);

    const {
        data,
        isLoading,
        error,
    } = useGetProductWithModifiersQuery(productId!, {
        skip: !enabled || !productId,
    });

    // Handle fallback to mock data
    const product = useMemo(() => {
        if (data) {
            setIsUsingMockData(false);
            return data;
        }

        // Fallback to mock data on error
        if (error && productId) {
            console.warn('[POS] Using mock product details - API error:', error);
            setIsUsingMockData(true);
            const mock = mockProducts.find(p => p.id === productId);
            return mock ? mockToProduct(mock) : null;
        }

        return null;
    }, [data, error, productId]);

    return {
        product,
        isLoading,
        isUsingMockData,
        error: error as Error | null,
    };
}
