import { Page } from '@playwright/test';

/**
 * Mock data for E2E tests
 * Provides consistent test data when API is not available
 */

export interface MockProduct {
    id: string;
    name: string;
    nameAr: string;
    salePrice: string;
    categoryId: string;
    isActive: boolean;
    isPrepared: boolean;
    trackInventory: boolean;
    taxRate: string;
}

export interface MockCategory {
    id: string;
    name: string;
    nameAr: string;
    icon: string;
    color: string;
}

// Mock products for testing
export const MOCK_PRODUCTS: MockProduct[] = [
    {
        id: 'prod-001',
        name: 'Classic Coffee',
        nameAr: 'قهوة كلاسيك',
        salePrice: '20.000',
        categoryId: 'cat-001',
        isActive: true,
        isPrepared: true,
        trackInventory: false,
        taxRate: '15.00',
    },
    {
        id: 'prod-002',
        name: 'Latte',
        nameAr: 'لاتيه',
        salePrice: '25.000',
        categoryId: 'cat-001',
        isActive: true,
        isPrepared: true,
        trackInventory: false,
        taxRate: '15.00',
    },
    {
        id: 'prod-003',
        name: 'Premium Steak',
        nameAr: 'ستيك ممتاز',
        salePrice: '100.000',
        categoryId: 'cat-002',
        isActive: true,
        isPrepared: true,
        trackInventory: true,
        taxRate: '15.00',
    },
    {
        id: 'prod-004',
        name: 'Caesar Salad',
        nameAr: 'سلطة سيزر',
        salePrice: '35.000',
        categoryId: 'cat-003',
        isActive: true,
        isPrepared: true,
        trackInventory: true,
        taxRate: '15.00',
    },
];

// Mock categories
export const MOCK_CATEGORIES: MockCategory[] = [
    {
        id: 'cat-001',
        name: 'Beverages',
        nameAr: 'مشروبات',
        icon: 'coffee',
        color: '#8B4513',
    },
    {
        id: 'cat-002',
        name: 'Main Dishes',
        nameAr: 'أطباق رئيسية',
        icon: 'utensils',
        color: '#DC143C',
    },
    {
        id: 'cat-003',
        name: 'Salads',
        nameAr: 'سلطات',
        icon: 'leaf',
        color: '#228B22',
    },
];

// Mock tables
export const MOCK_TABLES = [
    { id: 'table-1', tableNumber: '1', maxSeats: 4, status: 'AVAILABLE', zoneId: 'zone-1' },
    { id: 'table-2', tableNumber: '2', maxSeats: 4, status: 'AVAILABLE', zoneId: 'zone-1' },
    { id: 'table-3', tableNumber: '3', maxSeats: 6, status: 'AVAILABLE', zoneId: 'zone-1' },
    { id: 'table-4', tableNumber: '4', maxSeats: 2, status: 'OCCUPIED', zoneId: 'zone-2' },
    { id: 'table-5', tableNumber: '5', maxSeats: 8, status: 'AVAILABLE', zoneId: 'zone-2' },
];

// Mock zones
export const MOCK_ZONES = [
    { id: 'zone-1', zoneName: 'Main Hall', color: '#3B82F6' },
    { id: 'zone-2', zoneName: 'Terrace', color: '#10B981' },
];

// Mock delivery zones
export const MOCK_DELIVERY_ZONES = [
    { id: 'dz-1', zoneCode: 'ZONE_A', zoneName: 'Zone A', deliveryFee: '10.000', estimatedMinutes: 30 },
    { id: 'dz-2', zoneCode: 'ZONE_B', zoneName: 'Zone B', deliveryFee: '15.000', estimatedMinutes: 45 },
    { id: 'dz-3', zoneCode: 'ZONE_C', zoneName: 'Zone C', deliveryFee: '20.000', estimatedMinutes: 60 },
];

/**
 * Setup mock API routes for Playwright tests
 */
export async function setupMockAPI(page: Page): Promise<void> {
    // Mock products endpoint
    await page.route('**/api/v1/products*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: {
                    data: MOCK_PRODUCTS,
                    meta: { page: 1, limit: 50, total: MOCK_PRODUCTS.length, totalPages: 1 },
                },
            }),
        });
    });

    // Mock categories endpoint
    await page.route('**/api/v1/categories*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: {
                    data: MOCK_CATEGORIES,
                    meta: { page: 1, limit: 50, total: MOCK_CATEGORIES.length, totalPages: 1 },
                },
            }),
        });
    });

    // Mock tables endpoint
    await page.route('**/api/v1/tables*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: {
                    data: MOCK_TABLES,
                    meta: { page: 1, limit: 50, total: MOCK_TABLES.length, totalPages: 1 },
                },
            }),
        });
    });

    // Mock zones endpoint
    await page.route('**/api/v1/zones*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: MOCK_ZONES,
            }),
        });
    });

    // Mock delivery zones endpoint
    await page.route('**/api/v1/delivery-zones*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: MOCK_DELIVERY_ZONES,
            }),
        });
    });

    // Mock store config endpoint
    await page.route('**/api/v1/store-config*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: {
                    id: 'store-1',
                    storeName: 'Test Store',
                    taxRate: '15.00',
                    serviceChargeRate: '12.00',
                    currency: 'SAR',
                    defaultWarehouseId: 'wh-1',
                },
            }),
        });
    });

    // Mock session/register endpoint
    await page.route('**/api/v1/register-sessions*', async (route) => {
        const method = route.request().method();
        if (method === 'POST') {
            // Create session
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        id: 'session-1',
                        openingBalance: '500.000',
                        isOpen: true,
                        openedAt: new Date().toISOString(),
                    },
                }),
            });
        } else {
            // Get session
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: null, // No active session - will trigger open modal
                }),
            });
        }
    });

    // Mock PIN verification
    await page.route('**/api/v1/auth/verify-pin*', async (route) => {
        const body = await route.request().postDataJSON();
        const isValid = body.pin === '1234';

        await route.fulfill({
            status: isValid ? 200 : 401,
            contentType: 'application/json',
            body: JSON.stringify({
                success: isValid,
                data: isValid ? { valid: true, userId: 'user-1' } : null,
                error: isValid ? undefined : { code: 'AUTH_006', message: 'Invalid PIN' },
            }),
        });
    });

    // Mock users endpoint
    await page.route('**/api/v1/users*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: [
                    { id: 'user-1', name: 'Admin User', username: 'admin', role: 'ADMIN' },
                    { id: 'user-2', name: 'Cashier', username: 'cashier', role: 'CASHIER' },
                ],
            }),
        });
    });

    // Mock order creation
    let orderCounter = 1000;
    await page.route('**/api/v1/sales/orders', async (route) => {
        const method = route.request().method();
        if (method === 'POST') {
            const body = await route.request().postDataJSON().catch(() => ({}));
            orderCounter++;
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        id: `order-${orderCounter}`,
                        orderNumber: `ORD-${orderCounter}`,
                        invoiceNumber: `INV-${orderCounter}`,
                        orderType: body.orderType || 'TAKEAWAY',
                        status: 'COMPLETED',
                        paymentStatus: 'PAID',
                        subtotal: body.items?.reduce((sum: number, i: any) => sum + (parseFloat(i.unitPrice || 0) * parseFloat(i.quantity || 1)), 0).toFixed(3) || '0.000',
                        taxTotal: '0.000',
                        total: '0.000',
                        createdAt: new Date().toISOString(),
                        invoiceHash: 'abc123def456',
                        zatcaQrCode: 'mock-qr-data',
                    },
                }),
            });
        } else {
            // GET orders
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
                }),
            });
        }
    });

    // Mock order completion
    await page.route('**/api/v1/sales/orders/*/complete', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: { status: 'COMPLETED' },
            }),
        });
    });

    // Mock payments
    await page.route('**/api/v1/payments*', async (route) => {
        const method = route.request().method();
        if (method === 'POST') {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        id: `payment-${Date.now()}`,
                        status: 'COMPLETED',
                        amount: '0.000',
                    },
                }),
            });
        } else {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [] }),
            });
        }
    });

    // Mock kitchen tickets
    await page.route('**/api/v1/kitchen*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
            }),
        });
    });

    // Mock printing
    await page.route('**/api/v1/print*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { printed: true } }),
        });
    });
}

/**
 * Get a mock product by name (partial match)
 */
export function getMockProduct(name: string): MockProduct | undefined {
    return MOCK_PRODUCTS.find(
        (p) => p.name.toLowerCase().includes(name.toLowerCase())
    );
}

/**
 * Calculate expected total with tax
 */
export function calculateTotal(subtotal: number, taxRate = 15): { tax: number; total: number } {
    const tax = subtotal * (taxRate / 100);
    return {
        tax: Math.round(tax * 1000) / 1000,
        total: Math.round((subtotal + tax) * 1000) / 1000,
    };
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
    subtotal: number,
    discountType: 'percentage' | 'fixed',
    discountValue: number
): number {
    if (discountType === 'percentage') {
        return Math.round((subtotal * (discountValue / 100)) * 1000) / 1000;
    }
    return Math.min(discountValue, subtotal);
}
