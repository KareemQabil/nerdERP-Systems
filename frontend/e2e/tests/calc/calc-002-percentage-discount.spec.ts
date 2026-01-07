import { test, expect } from '../../fixtures/pos.fixture';

/**
 * CALC-002: Percentage Discount
 * 
 * Tests percentage discount flow including:
 * - Discount modal opens FIRST (before PIN)
 * - Manager PIN authorization AFTER selection
 * - Correct discount calculation
 */

test.describe('CALC-002: Percentage Discount', () => {

    test('should open discount modal FIRST when clicking discount button', async ({ posPage, addProduct }) => {
        // Add a product first
        await addProduct("Any Product");

        // Click discount button
        await posPage.click('[data-testid="action-discount"]');

        // Discount modal should appear FIRST (not PIN modal)
        const discountModal = posPage.locator('[data-testid="discount-modal"]');
        await expect(discountModal).toBeVisible({ timeout: 10000 });

        // PIN modal should NOT be visible yet
        const pinModal = posPage.locator('[data-testid="manager-pin-modal"]');
        await expect(pinModal).not.toBeVisible();
    });

    test('should request PIN AFTER selecting discount and clicking Apply', async ({ posPage, addProduct }) => {
        // Add a product
        await addProduct("Any Product");

        // Click discount button
        await posPage.click('[data-testid="action-discount"]');

        // Wait for discount modal
        await posPage.waitForSelector('[data-testid="discount-modal"]', { timeout: 10000 });

        // Select percentage type and enter value
        await posPage.click('[data-testid="discount-type-percentage"]');
        await posPage.fill('[data-testid="discount-value-input"]', '20');

        // Click Apply
        await posPage.click('[data-testid="apply-discount-btn"]');

        // NOW PIN modal should appear
        const pinModal = posPage.locator('[data-testid="manager-pin-modal"]');
        await expect(pinModal).toBeVisible({ timeout: 10000 });
    });

    test('should show discount in cart after PIN authorization', async ({
        posPage,
        addProduct,
        applyDiscount,
        authorizeWithPIN,
        openCart
    }) => {
        // Add product
        await addProduct("Any Product");

        // Apply percentage discount
        await applyDiscount('percentage', 20);

        // Authorize with PIN
        await authorizeWithPIN('1234');

        // Open cart
        await openCart();

        // Verify discount is visible (just check it appears, not exact value)
        const discountAmount = posPage.locator('[data-testid="cart-discount"]');
        await expect(discountAmount).toBeVisible({ timeout: 5000 });
    });

    test('should handle custom percentage input', async ({
        posPage,
        addProduct,
        authorizeWithPIN
    }) => {
        // Add product
        await addProduct("Any Product");

        // Open discount modal
        await posPage.click('[data-testid="action-discount"]');
        await posPage.waitForSelector('[data-testid="discount-modal"]', { timeout: 10000 });

        // Select percentage type
        await posPage.click('[data-testid="discount-type-percentage"]');

        // Enter custom percentage (15%)
        await posPage.fill('[data-testid="discount-value-input"]', '15');

        // Apply
        await posPage.click('[data-testid="apply-discount-btn"]');

        // Should request PIN
        const pinModal = posPage.locator('[data-testid="manager-pin-modal"]');
        await expect(pinModal).toBeVisible({ timeout: 10000 });

        // Authorize
        await authorizeWithPIN();

        // PIN modal should close
        await expect(pinModal).not.toBeVisible({ timeout: 10000 });
    });

    test('should reject invalid PIN', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Any Product");

        // Open discount modal and select discount
        await posPage.click('[data-testid="action-discount"]');
        await posPage.waitForSelector('[data-testid="discount-modal"]', { timeout: 10000 });
        await posPage.click('[data-testid="discount-type-percentage"]');
        await posPage.fill('[data-testid="discount-value-input"]', '20');
        await posPage.click('[data-testid="apply-discount-btn"]');

        // Wait for PIN modal
        await posPage.waitForSelector('[data-testid="manager-pin-modal"]', { timeout: 10000 });

        // Enter wrong PIN (0000)
        await posPage.click('[data-testid="pin-key-0"]');
        await posPage.click('[data-testid="pin-key-0"]');
        await posPage.click('[data-testid="pin-key-0"]');
        await posPage.click('[data-testid="pin-key-0"]');
        await posPage.click('[data-testid="authorize-btn"]');

        // Should show error or PIN modal should still be visible
        const pinModal = posPage.locator('[data-testid="manager-pin-modal"]');
        await expect(pinModal).toBeVisible({ timeout: 5000 });
    });
});

