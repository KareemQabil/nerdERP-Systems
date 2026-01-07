import { test, expect } from '../../fixtures/pos.fixture';

/**
 * CALC-003: Fixed Amount Discount
 * 
 * Tests fixed SAR discount application
 */

test.describe('CALC-003: Fixed Amount Discount', () => {

    test('should apply fixed discount and show in cart', async ({
        posPage,
        addProduct,
        applyDiscount,
        authorizeWithPIN,
        openCart
    }) => {
        // Add any product
        await addProduct("Any Product");

        // Apply 5 SAR fixed discount
        await applyDiscount('fixed', 5);

        // Authorize
        await authorizeWithPIN();

        // Open cart
        await openCart();

        // Verify discount amount is visible
        const discountAmount = posPage.locator('[data-testid="cart-discount"]');
        await expect(discountAmount).toBeVisible({ timeout: 5000 });
    });

    test('should show fixed discount type selector', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Any Product");

        // Open discount modal
        await posPage.click('[data-testid="action-discount"]');
        await posPage.waitForSelector('[data-testid="discount-modal"]', { timeout: 10000 });

        // Fixed type button should be visible
        const fixedTab = posPage.locator('[data-testid="discount-type-fixed"]');
        await expect(fixedTab).toBeVisible({ timeout: 5000 });
    });

    test('should switch from percentage to fixed discount type', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Any Product");

        // Open discount modal
        await posPage.click('[data-testid="action-discount"]');
        await posPage.waitForSelector('[data-testid="discount-modal"]', { timeout: 10000 });

        // Click on fixed type
        await posPage.click('[data-testid="discount-type-fixed"]');

        // Fixed tab should be clickable
        const fixedTab = posPage.locator('[data-testid="discount-type-fixed"]');
        await expect(fixedTab).toBeVisible();
    });

    test('should handle custom fixed amount input', async ({
        posPage,
        addProduct,
        authorizeWithPIN
    }) => {
        // Add product
        await addProduct("Any Product");

        // Open discount modal
        await posPage.click('[data-testid="action-discount"]');
        await posPage.waitForSelector('[data-testid="discount-modal"]', { timeout: 10000 });

        // Select fixed type
        await posPage.click('[data-testid="discount-type-fixed"]');

        // Enter custom amount (15 SAR)
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

    test('should show discount value input field', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Any Product");

        // Open discount modal
        await posPage.click('[data-testid="action-discount"]');
        await posPage.waitForSelector('[data-testid="discount-modal"]', { timeout: 10000 });

        // Select fixed type
        await posPage.click('[data-testid="discount-type-fixed"]');

        // Value input should be visible
        const valueInput = posPage.locator('[data-testid="discount-value-input"]');
        await expect(valueInput).toBeVisible({ timeout: 5000 });
    });
});

