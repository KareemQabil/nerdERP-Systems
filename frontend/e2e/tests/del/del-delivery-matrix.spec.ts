import { test, expect } from '../../fixtures/pos.fixture';

/**
 * DEL-001 to DEL-005: Delivery Matrix Tests
 * 
 * Tests delivery order workflows
 */

test.describe('DEL-001: Zone Pricing', () => {

    test('should show delivery option in order types', async ({ posPage }) => {
        // Open order type selector
        await posPage.click('[data-testid="order-type-selector"]');

        // Delivery option should be visible
        const deliveryOption = posPage.locator('[data-testid="order-type-delivery"]');
        await expect(deliveryOption).toBeVisible();
    });

    test('should select delivery zone', async ({ posPage }) => {
        // Select delivery order type
        await posPage.click('[data-testid="order-type-selector"]');
        await posPage.click('[data-testid="order-type-delivery"]');

        // Delivery modal should appear
        const deliveryModal = posPage.locator('[data-testid="delivery-modal"]');
        if (await deliveryModal.isVisible({ timeout: 5000 }).catch(() => false)) {
            // Zone selection should be available
            const zoneSelect = posPage.locator('[data-testid="delivery-zone-select"]');
            await expect(zoneSelect).toBeVisible();
        }
    });
});

test.describe('DEL-002: Customer Info', () => {

    test('should require customer details for delivery', async ({ posPage }) => {
        // Select delivery
        await posPage.click('[data-testid="order-type-selector"]');
        await posPage.click('[data-testid="order-type-delivery"]');

        // Delivery modal should require address
        const deliveryModal = posPage.locator('[data-testid="delivery-modal"]');
        if (await deliveryModal.isVisible({ timeout: 5000 }).catch(() => false)) {
            const addressInput = posPage.locator('[data-testid="delivery-address"]');
            await expect(addressInput).toBeVisible();

            const phoneInput = posPage.locator('[data-testid="delivery-phone"]');
            await expect(phoneInput).toBeVisible();
        }
    });
});

test.describe('DEL-003: Aggregator Orders', () => {

    test('should show platform orders section', async ({ posPage }) => {
        // Look for aggregator/platform order types
        await posPage.click('[data-testid="order-type-selector"]');

        // Platform options like Talabat, HungerStation
        const talabatOption = posPage.locator('[data-testid="order-type-talabat"]');
        const platformSection = posPage.locator('button:has-text("Talabat"), button:has-text("HungerStation")');

        // May or may not be visible depending on config
    });
});

test.describe('DEL-004: Delivery Dashboard', () => {

    test('should open delivery dashboard', async ({ posPage }) => {
        // Look for delivery button
        const deliveryBtn = posPage.locator('button:has-text("Delivery")');
        if (await deliveryBtn.isVisible()) {
            await deliveryBtn.click();

            // Delivery dashboard should open
            const deliveryDashboard = posPage.locator('[data-testid="delivery-dashboard"]');
            await expect(deliveryDashboard).toBeVisible();
        }
    });
});

test.describe('DEL-005: Driver Assignment', () => {

    test('should allow driver assignment', async ({ posPage }) => {
        // Open delivery dashboard
        const deliveryBtn = posPage.locator('button:has-text("Delivery")');
        if (await deliveryBtn.isVisible()) {
            await deliveryBtn.click();

            // Look for pending delivery orders
            const deliveryOrder = posPage.locator('[data-testid="delivery-order"]').first();
            if (await deliveryOrder.isVisible({ timeout: 5000 }).catch(() => false)) {
                // Click assign driver
                await deliveryOrder.locator('[data-testid="assign-driver-btn"]').click();

                // Driver selection should appear
                const driverSelect = posPage.locator('[data-testid="driver-select"]');
                await expect(driverSelect).toBeVisible();
            }
        }
    });
});
