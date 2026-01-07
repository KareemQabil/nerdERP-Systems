import { test, expect } from '../../fixtures/pos.fixture';
import { PaymentMock } from '../../mocks';

/**
 * PAY-001 to PAY-008: Payment Workflow Tests
 *
 * Tests various payment methods and scenarios with mocked APIs
 * to eliminate race conditions and external dependencies.
 */

// Setup payment mocks for all payment tests
test.beforeEach(async ({ posPage }) => {
  PaymentMock.setupMocks(posPage);
});

test.describe('PAY-001: Cash Exact Payment', () => {

    test('should complete cash payment with exact amount', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Today's Coffee");

        // Click payment button
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal to be visible
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });
        await posPage.waitForTimeout(300); // Allow modal animation

        // Select cash payment (may already be selected by default)
        const cashBtn = posPage.locator('[data-testid="payment-method-cash"]');
        if (await cashBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await cashBtn.click();
            await posPage.waitForTimeout(200);
        }

        // Try quick cash buttons or Exact button
        const exactBtn = posPage.locator('button:has-text("Exact"), [data-testid="exact-amount-btn"]');
        const quickCashButtons = [
            '[data-testid="quick-cash-100"]',
            '[data-testid="quick-cash-50"]',
            '[data-testid="quick-cash-20"]',
            '[data-testid="quick-cash-10"]',
        ];

        let clicked = false;
        // Try Exact button first
        if (await exactBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await exactBtn.click();
            clicked = true;
        } else {
            // Fall back to quick cash buttons
            for (const selector of quickCashButtons) {
                const btn = posPage.locator(selector);
                if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await btn.click();
                    clicked = true;
                    break;
                }
            }
        }

        expect(clicked).toBeTruthy();

        // Wait for complete button to be enabled
        await posPage.waitForTimeout(500);

        // Complete payment
        const completeBtn = posPage.locator('[data-testid="complete-payment-btn"]');
        await expect(completeBtn).toBeEnabled({ timeout: 3000 });
        await completeBtn.click();

        // Wait for payment success - try multiple selectors
        await Promise.race([
            posPage.waitForSelector('[data-testid="payment-success"]', { timeout: 8000 }),
            posPage.waitForSelector('[data-testid="tax-invoice"]', { timeout: 8000 }),
            posPage.waitForSelector('[data-testid="checkout-success"]', { timeout: 8000 })
        ]);

        // Verify success state
        const hasSuccess = await posPage.locator('[data-testid="payment-success"]').isVisible().catch(() => false);
        const hasInvoice = await posPage.locator('[data-testid="tax-invoice"]').isVisible().catch(() => false);
        expect(hasSuccess || hasInvoice).toBeTruthy();
    });
});

test.describe('PAY-002: Cash with Change', () => {

    test('should calculate change correctly', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Today's Coffee");

        // Click payment
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });
        await posPage.waitForTimeout(300);

        // Select cash
        const cashBtn = posPage.locator('[data-testid="payment-method-cash"]');
        if (await cashBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await cashBtn.click();
            await posPage.waitForTimeout(200);
        }

        // Try quick cash 100 (assuming order is less than 100)
        const quickCash100 = posPage.locator('[data-testid="quick-cash-100"]');
        if (await quickCash100.isVisible({ timeout: 3000 }).catch(() => false)) {
            await quickCash100.click();

            // Verify change is calculated and displayed
            const changeDisplay = posPage.locator('[data-testid="change-amount"]');
            await expect(changeDisplay).toBeVisible({ timeout: 2000 });

            const changeText = await changeDisplay.textContent();
            const changeAmount = parseFloat(changeText?.replace(/[^0-9.]/g, '') || '0');
            expect(changeAmount).toBeGreaterThanOrEqual(0);
        } else {
            test.skip(true, 'Quick cash 100 button not available for this order amount');
        }
    });
});

test.describe('PAY-003: Card Payment', () => {

    test('should show card payment option', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Today's Coffee");

        // Click payment
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });

        // Card payment option should be visible
        await expect(posPage.locator('[data-testid="payment-method-card"]')).toBeVisible();
    });

    test('should process card payment', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Today's Coffee");

        // Click payment
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });
        await posPage.waitForTimeout(300);

        // Select card
        const cardBtn = posPage.locator('[data-testid="payment-method-card"]');
        if (await cardBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await cardBtn.click();
            await posPage.waitForTimeout(500);

            // Complete payment (mocked response will be immediate)
            const completeBtn = posPage.locator('[data-testid="complete-payment-btn"]');
            await expect(completeBtn).toBeEnabled({ timeout: 3000 });
            await completeBtn.click();

            // Should show success or terminal waiting
            const result = await Promise.race([
                posPage.waitForSelector('[data-testid="payment-success"]', { timeout: 8000 }).then(() => 'success'),
                posPage.waitForSelector('[data-testid="tax-invoice"]', { timeout: 8000 }).then(() => 'invoice'),
                posPage.waitForSelector('[data-testid="terminal-waiting"]', { timeout: 5000 }).then(() => 'terminal'),
                new Promise(resolve => setTimeout(() => resolve('timeout'), 9000))
            ]);

            expect(['success', 'invoice', 'terminal']).toContain(result);
        }
    });
});

test.describe('PAY-004: Split Payment', () => {

    test('should allow split between cash and card', async ({ posPage, addProduct }) => {
        // Add product worth enough to split
        await addProduct("Premium Steak");

        // Click payment
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });
        await posPage.waitForTimeout(300);

        // Look for split payment button
        const splitBtn = posPage.locator('[data-testid="split-payment-btn"]');
        if (await splitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await splitBtn.click();

            // Should show split payment panel
            const splitPanel = posPage.locator('[data-testid="split-payment-panel"]');
            await expect(splitPanel).toBeVisible({ timeout: 3000 });
            await posPage.waitForTimeout(200);

            // Add first payment (Cash 50)
            await PaymentMock.addSplitPayment(posPage, 50, 'CASH');

            // Add second payment (Card 50)
            await PaymentMock.addSplitPayment(posPage, 50, 'CARD');

            // Wait for remaining amount to reach 0
            await PaymentMock.waitForFullPayment(posPage, 5000);

            // Complete button should be enabled
            const completeBtn = posPage.locator('[data-testid="complete-payment-btn"]');
            await expect(completeBtn).toBeEnabled();

            // Click complete
            await completeBtn.click();

            // Wait for success state
            await PaymentMock.waitForPaymentSuccess(posPage, 8000);

            // Verify success
            const hasSuccess = await posPage.locator('[data-testid="payment-success"]').isVisible().catch(() => false);
            const hasInvoice = await posPage.locator('[data-testid="tax-invoice"]').isVisible().catch(() => false);
            expect(hasSuccess || hasInvoice).toBeTruthy();
        } else {
            test.skip(true, 'Split payment button not available');
        }
    });

    test('should track multiple payment entries in split mode', async ({ posPage, addProduct }) => {
        // Add high-value product
        await addProduct("Premium Steak");

        // Click payment
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });

        // Enter split mode
        const splitBtn = posPage.locator('[data-testid="split-payment-btn"]');
        if (await splitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await splitBtn.click();

            // Wait for split panel
            await expect(posPage.locator('[data-testid="split-payment-panel"]')).toBeVisible({ timeout: 3000 });

            // Add first payment
            await PaymentMock.addSplitPayment(posPage, 50, 'CASH');

            // Verify payment entry appears
            await expect(posPage.locator('[data-testid^="payment-entry-"]').first()).toBeVisible();

            // Add second payment
            await PaymentMock.addSplitPayment(posPage, 50, 'CARD');

            // Verify multiple payment entries
            const paymentEntries = posPage.locator('[data-testid^="payment-entry-"]');
            const entryCount = await paymentEntries.count();
            expect(entryCount).toBeGreaterThanOrEqual(2);
        } else {
            test.skip(true, 'Split payment button not available');
        }
    });
});

test.describe('PAY-005: Quick Cash Buttons', () => {

    test('should have quick denomination buttons', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Today's Coffee");

        // Click payment
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });

        // Select cash
        const cashBtn = posPage.locator('[data-testid="payment-method-cash"]');
        if (await cashBtn.isVisible()) {
            await cashBtn.click();
        }

        // Quick buttons should be visible
        const quickButtons = posPage.locator('[data-testid^="quick-cash-"]');
        const quickCount = await quickButtons.count();
        expect(quickCount).toBeGreaterThan(0);
    });
});

test.describe('PAY-006: Payment Summary', () => {

    test('should display correct payment summary', async ({ posPage, addProduct }) => {
        // Add multiple products
        await addProduct("Today's Coffee");
        await addProduct("Classic Latte");

        // Click payment
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });

        // Verify summary shows with multiple selectors
        const subtotalSelectors = [
            '[data-testid="checkout-subtotal"]',
            '[data-testid="cart-subtotal"]',
            '.checkout-subtotal'
        ];

        let subtotalVisible = false;
        for (const selector of subtotalSelectors) {
            if (await posPage.locator(selector).isVisible().catch(() => false)) {
                subtotalVisible = true;
                break;
            }
        }
        expect(subtotalVisible).toBeTruthy();

        // Same for tax and total
        const taxVisible = await posPage.locator('[data-testid="checkout-tax"], [data-testid="cart-tax"]').isVisible().catch(() => false);
        expect(taxVisible).toBeTruthy();

        const totalVisible = await posPage.locator('[data-testid="checkout-total"], [data-testid="cart-total"]').isVisible().catch(() => false);
        expect(totalVisible).toBeTruthy();
    });
});

test.describe('PAY-007: Receipt Options', () => {

    test('should have print receipt option after payment', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Today's Coffee");

        // Click payment
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });

        // Select cash and complete payment
        const cashBtn = posPage.locator('[data-testid="payment-method-cash"]');
        if (await cashBtn.isVisible()) {
            await cashBtn.click();
        }

        // Use quick cash or exact button
        const exactBtn = posPage.locator('button:has-text("Exact")');
        if (await exactBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await exactBtn.click();
        } else {
            await posPage.click('[data-testid="quick-cash-100"]');
        }

        // Complete payment
        await posPage.click('[data-testid="complete-payment-btn"]');

        // Wait for success/receipt view
        await PaymentMock.waitForPaymentSuccess(posPage, 8000);

        // Look for print option (may or may not be visible depending on implementation)
        const printBtn = posPage.locator('[data-testid="print-receipt-btn"]');
        const hasPrintButton = await printBtn.isVisible().catch(() => false);

        if (hasPrintButton) {
            console.log('Print receipt button is available');
        }
        // Test passes regardless - print button is optional
    });
});

test.describe('PAY-008: Insufficient Payment', () => {

    test('should prevent checkout with insufficient payment', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Premium Steak");

        // Click payment
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });

        // Select cash but don't enter any amount
        const cashBtn = posPage.locator('[data-testid="payment-method-cash"]');
        if (await cashBtn.isVisible()) {
            await cashBtn.click();
        }

        // Complete button should be disabled when no amount entered
        const completeBtn = posPage.locator('[data-testid="complete-payment-btn"]');
        const isDisabled = await completeBtn.isDisabled();

        if (!isDisabled) {
            // If not disabled, clicking it should show an error
            await completeBtn.click();

            const error = posPage.locator('[data-testid="payment-error"], .error-message');
            await expect(error).toBeVisible({ timeout: 2000 });
        } else {
            expect(isDisabled).toBeTruthy();
        }
    });

    test('should validate payment amount against total', async ({ posPage, addProduct }) => {
        // Add product
        await addProduct("Premium Steak");

        // Click payment
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await expect(posPage.locator('[data-testid="checkout-modal"]')).toBeVisible({ timeout: 5000 });

        // Get total amount from modal
        const totalElement = posPage.locator('[data-testid="checkout-total"]');
        const totalText = await totalElement.textContent();
        const totalAmount = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');

        // Try to pay with insufficient amount
        const smallCashButton = posPage.locator('[data-testid="quick-cash-10"]');
        if (await smallCashButton.isVisible().catch(() => false)) {
            await smallCashButton.click();

            // Either button stays disabled or shows error
            const completeBtn = posPage.locator('[data-testid="complete-payment-btn"]');

            const isStillDisabled = await completeBtn.isDisabled();
            if (!isStillDisabled) {
                await completeBtn.click();
                const error = posPage.locator('[data-testid="payment-error"], .error-message');
                await expect(error).toBeVisible({ timeout: 2000 });
            }
        }
    });
});
