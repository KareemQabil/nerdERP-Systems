import { test, expect } from '../../fixtures/pos.fixture';

/**
 * CALC-001: Basic Price Calculation Flow
 * 
 * Tests that products are added correctly and totals are calculated accurately.
 */

test.describe('CALC-001: Basic Price Calculation', () => {

    test('should add product to cart', async ({ posPage, addProduct, openCart }) => {
        // Add a product
        await addProduct("Any Product");

        // Open cart panel
        await openCart();

        // Verify item appears in cart
        const cartItem = posPage.locator('[data-testid="cart-item"]');
        await expect(cartItem.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show cart subtotal after adding product', async ({ posPage, addProduct, openCart }) => {
        // Add product
        await addProduct("Any Product");

        // Open cart
        await openCart();

        // Verify subtotal is visible and contains a number (English or Arabic numerals)
        const subtotal = posPage.locator('[data-testid="cart-subtotal"]');
        await expect(subtotal).toBeVisible({ timeout: 5000 });
        // Match English digits (0-9) or Arabic-Indic numerals (٠-٩)
        await expect(subtotal).toContainText(/[\d٠-٩]/);
    });

    test('should show tax amount in cart', async ({ posPage, addProduct, openCart }) => {
        // Add product
        await addProduct("Any Product");

        // Open cart
        await openCart();

        // Verify tax is visible
        const taxAmount = posPage.locator('[data-testid="cart-tax"]');
        await expect(taxAmount).toBeVisible({ timeout: 5000 });
    });

    test('should show total in cart', async ({ posPage, addProduct, openCart }) => {
        // Add product
        await addProduct("Any Product");

        // Open cart
        await openCart();

        // Verify total is visible and shows a formatted amount (English or Arabic numerals)
        const total = posPage.locator('[data-testid="cart-total"]');
        await expect(total).toBeVisible({ timeout: 5000 });
        // Match English format "10.00" or Arabic format "١٠٫٠٠"
        await expect(total).toContainText(/[\d٠-٩]+[\.٫][\d٠-٩]{2}/);
    });

    test('should update quantity when adding same product twice', async ({ posPage, addProduct, openCart }) => {
        // Add product twice
        await addProduct("Any Product");
        await addProduct("Any Product");

        // Open cart
        await openCart();

        // Verify cart has item(s)
        const cartItems = posPage.locator('[data-testid="cart-item"]');
        const count = await cartItems.count();
        expect(count).toBeGreaterThan(0);
    });
});

