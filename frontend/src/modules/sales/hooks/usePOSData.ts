/**
 * POS Data Hooks
 * Fetches categories, products, and modifiers with smart fallback to mock data
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { categoryService, productService, modifierService } from '@/services/product.service';
import type { Category, Product, ModifierGroup } from '@/services/product.service';
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
 * Uses TanStack Query with smart fallback to mock data
 * NOTE: We avoid calling setState inside queryFn to prevent infinite loops
 */
export function usePOSData(options: UsePOSDataOptions = {}): UsePOSDataResult {
    const {
        categoryId = null,
        searchQuery = '',
        enableFallback = true
    } = options;

    // Fetch categories with fallback - returns { data, isMock } tuple
    const categoriesQuery = useQuery({
        queryKey: ['categories', 'active'],
        queryFn: async (): Promise<{ data: Category[]; isMock: boolean }> => {
            try {
                const data = await categoryService.getActive();
                // Also fallback if API returns empty data (likely DB issue)
                if (enableFallback && (!data || data.length === 0)) {
                    console.warn('[POS] Using mock categories - API returned empty');
                    return { data: mockCategories.map(mockToCategory), isMock: true };
                }
                return { data, isMock: false };
            } catch (error) {
                if (enableFallback) {
                    console.warn('[POS] Using mock categories - API error:', error);
                    return { data: mockCategories.map(mockToCategory), isMock: true };
                }
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: enableFallback ? 1 : 3, // Less retries if fallback enabled
    });

    // Fetch products with fallback - returns { data, isMock } tuple
    const productsQuery = useQuery({
        queryKey: ['products', 'pos', categoryId, searchQuery],
        queryFn: async (): Promise<{ data: Product[]; isMock: boolean }> => {
            try {
                const data = await productService.getForPOS(
                    categoryId || undefined,
                    searchQuery || undefined
                );
                // Also fallback if API returns empty data (likely DB issue)
                if (enableFallback && (!data || data.length === 0) && !searchQuery) {
                    console.warn('[POS] Using mock products - API returned empty');
                    return { data: mockProducts.map(mockToProduct), isMock: true };
                }
                return { data, isMock: false };
            } catch (error) {
                if (enableFallback) {
                    console.warn('[POS] Using mock products - API error:', error);

                    // Apply local filtering to mock data
                    let filtered = mockProducts.map(mockToProduct);

                    // Filter by search query
                    if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        filtered = filtered.filter(p =>
                            p.name.toLowerCase().includes(query) ||
                            (p.nameAr && p.nameAr.includes(query))
                        );
                    }

                    return { data: filtered, isMock: true };
                }
                throw error;
            }
        },
        staleTime: 60 * 1000, // 1 minute
        retry: enableFallback ? 1 : 3,
    });

    const queryClient = useQueryClient();

    const refetch = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
    }, [queryClient]);

    // Derive mock status from query results (no setState needed!)
    const isUsingMockData =
        (categoriesQuery.data?.isMock ?? false) ||
        (productsQuery.data?.isMock ?? false);

    return {
        categories: categoriesQuery.data?.data || [],
        products: productsQuery.data?.data || [],
        isLoading: categoriesQuery.isLoading || productsQuery.isLoading,
        isUsingMockData,
        error: (categoriesQuery.error || productsQuery.error) as Error | null,
        refetch,
    };
}

/**
 * Hook for fetching modifiers for a specific product
 */
export function useProductModifiers(productId: string | null, enabled = true) {
    const query = useQuery({
        queryKey: ['modifiers', productId],
        queryFn: async (): Promise<{ data: ModifierGroup[]; isMock: boolean }> => {
            if (!productId) return { data: [], isMock: false };

            try {
                const data = await modifierService.getForProduct(productId);
                return { data, isMock: false };
            } catch (error) {
                console.warn('[POS] Using mock modifiers - API unavailable');
                return { data: mockModifierGroups.map(mockToModifierGroup), isMock: true };
            }
        },
        enabled: enabled && !!productId,
        staleTime: 5 * 60 * 1000,
    });

    return {
        modifierGroups: query.data?.data || [],
        isLoading: query.isLoading,
        isUsingMockData: query.data?.isMock ?? false,
        error: query.error as Error | null,
    };
}

/**
 * Hook for product search with debouncing built-in
 * This returns the search query setter - actual fetching is done by usePOSData
 */
export function useProductSearch(debounceMs = 300) {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce the search query - use useEffect, NOT useMemo!
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
    const query = useQuery({
        queryKey: ['product', productId, 'details'],
        queryFn: async (): Promise<{ data: Product | null; isMock: boolean }> => {
            if (!productId) return { data: null, isMock: false };

            try {
                const data = await productService.getWithModifiers(productId);
                return { data, isMock: false };
            } catch (error) {
                console.warn('[POS] Using mock product details - API unavailable');
                const mock = mockProducts.find(p => p.id === productId);
                return { data: mock ? mockToProduct(mock) : null, isMock: true };
            }
        },
        enabled: enabled && !!productId,
        staleTime: 60 * 1000,
    });

    return {
        product: query.data?.data ?? null,
        isLoading: query.isLoading,
        isUsingMockData: query.data?.isMock ?? false,
        error: query.error as Error | null,
    };
}
