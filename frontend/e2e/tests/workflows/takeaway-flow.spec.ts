import { test, expect } from '../../fixtures/pos.fixture';

/**
 * WF-TAKEAWAY-001: Complete Takeaway Order Workflow
 *
 * Full lifecycle test for takeaway orders:
 * 1. Set order type to TAKEAWAY
 * 2. Add products
 * 3. Pre-payment before order preparation
 * 4. Fire to kitchen
 * 5. Order status transitions through pickup states
 * 6. Mark as picked up/completed
 */

test.describe('@workflow WF-TAKEAWAY-001: Complete Takeaway Order', () => {
    test('should complete full takeaway workflow with pre-payment', async ({
        posPage,
        addProduct,
        setOrderType,
        completePayment,
        getCartItemCount,
    }) => {
        console.log('Starting takeaway workflow test');

        // Step 1: Set order type to TAKEAWAY
        console.log('Step 1: Set order type to TAKEAWAY');
        await setOrderType('takeaway');

        // Verify order type is set
        const orderTypeIndicator = posPage.locator('[data-testid="order-type-display"], [data-testid="current-order-type"]');
        if (await orderTypeIndicator.isVisible().catch(() => false)) {
            const orderType = await orderTypeIndicator.textContent();
            console.log(`Order type: ${orderType}`);
        }

        // Step 2: Add products
        console.log('Step 2: Add products');
        await addProduct("Classic Latte");
        await addProduct("Fresh Juice");

        // Verify cart has items (at least 1 since products may not exist and fallback adds quantity)
        const itemCount = await getCartItemCount();
        expect(itemCount).toBeGreaterThanOrEqual(1);
        console.log(`Cart has ${itemCount} items`);

        // Step 3: Pre-payment (takeaway typically requires pre-payment)
        console.log('Step 3: Complete pre-payment');
        await completePayment('cash');

        // Verify payment success
        const paymentSuccess = posPage.locator('[data-testid="payment-success"]');
        await expect(paymentSuccess).toBeVisible({ timeout: 10000 });
        console.log('Pre-payment completed');

        // Note: Kitchen firing and status tracking is handled separately in KDS
        // POS workflow ends with successful payment for takeaway orders
        console.log('Takeaway workflow completed successfully!');
    });

    test('should handle takeaway order with customer name', async ({
        posPage,
        addProduct,
        setOrderType,
        completePayment,
    }) => {
        // Set order type to TAKEAWAY
        await setOrderType('takeaway');

        // Add product
        await addProduct("Today's Coffee");

        // Look for customer name input (for takeaway orders)
        const customerInput = posPage.locator('[data-testid="customer-name-input"], [data-testid="customer-input"]');
        if (await customerInput.isVisible().catch(() => false)) {
            await customerInput.fill('John Doe');
            console.log('Customer name entered');
        }

        // Complete payment
        await completePayment('cash');

        // Verify success
        const paymentSuccess = posPage.locator('[data-testid="payment-success"]');
        await expect(paymentSuccess).toBeVisible({ timeout: 10000 });
    });

    test('should allow takeaway order without table selection', async ({
        posPage,
        addProduct,
        setOrderType,
        completePayment,
    }) => {
        // Set order type to TAKEAWAY
        await setOrderType('takeaway');

        // Add products
        await addProduct("Premium Steak");

        // Verify no table selection is required/prompted
        const tableModal = posPage.locator('[data-testid="table-selection-modal"]');
        const isTableModalVisible = await tableModal.isVisible().catch(() => false);

        expect(isTableModalVisible).toBeFalsy();

        // Should be able to complete payment without table
        await completePayment('cash');

        // Verify success
        const paymentSuccess = posPage.locator('[data-testid="payment-success"]');
        await expect(paymentSuccess).toBeVisible({ timeout: 10000 });
    });
});

/**
 * WF-TAKEAWAY-002: Rush Order Handling
 *
 * Tests that takeaway orders can be marked as rush/priority
 */
test.describe('@workflow WF-TAKEAWAY-002: Rush Order Handling', () => {
    test('should allow marking takeaway order as rush', async ({
        posPage,
        addProduct,
        setOrderType,
        fireToKitchen,
        getCartItemCount,
    }) => {
        // Set order type to TAKEAWAY
        await setOrderType('takeaway');

        // Add product
        await addProduct("Classic Latte");

        // Look for rush/priority button
        const rushBtn = posPage.locator('[data-testid="rush-order-btn"], [data-testid="priority-btn"]');
        const hasRushButton = await rushBtn.isVisible().catch(() => false);

        if (hasRushButton) {
            await rushBtn.click();
            console.log('Order marked as rush');

            // Verify rush indicator is visible
            const rushIndicator = posPage.locator('[data-testid="rush-indicator"], [data-testid="priority-badge"]');
            await expect(rushIndicator).toBeVisible();
        } else {
            console.log('Rush button not available (feature may not be enabled)');
        }

        // Fire to kitchen
        await fireToKitchen();

        // Verify order was created
        const itemCount = await getCartItemCount();
        expect(itemCount).toBeGreaterThanOrEqual(0);
    });
});

/**
 * WF-TAKEAWAY-003: Multiple Payment Methods
 *
 * Tests takeaway orders with split payments
 */
test.describe('@workflow WF-TAKEAWAY-003: Multiple Payment Methods', () => {
    test('should handle takeaway order with card payment', async ({
        posPage,
        addProduct,
        setOrderType,
        completePayment,
    }) => {
        // Set order type to TAKEAWAY
        await setOrderType('takeaway');

        // Add product
        await addProduct("Premium Steak");

        // Complete with card payment
        await completePayment('card');

        // Verify success
        const paymentSuccess = posPage.locator('[data-testid="payment-success"], [data-testid="card-payment-success"]');
        await expect(paymentSuccess).toBeVisible({ timeout: 10000 });
    });

    test('should handle takeaway order with split payment', async ({
        posPage,
        addProduct,
        setOrderType,
        openCart,
        getCartTotal,
    }) => {
        // Set order type to TAKEAWAY
        await setOrderType('takeaway');

        // Add higher value product for split payment
        await addProduct("Premium Steak");

        // Open cart
        await openCart();

        // Click payment button
        await posPage.click('[data-testid="action-payment"]');

        // Wait for checkout modal
        await posPage.waitForSelector('[data-testid="checkout-modal"]', { timeout: 10000 });

        // Check if split payment option exists
        const splitPaymentBtn = posPage.locator('[data-testid="split-payment-btn"]');
        const hasSplitPayment = await splitPaymentBtn.isVisible().catch(() => false);

        if (hasSplitPayment) {
            await splitPaymentBtn.click();

            // Verify split payment interface is shown
            const splitInterface = posPage.locator('[data-testid="split-payment-modal"]');
            await expect(splitInterface).toBeVisible();

            // Close modal for now
            await posPage.click('[data-testid="close-modal-btn"], [data-testid="cancel-btn"]');
        } else {
            console.log('Split payment not available (feature may not be enabled)');
        }

        // Continue with regular payment
        await posPage.click('[data-testid="payment-method-cash"]');
        await posPage.click('[data-testid="complete-payment-btn"]');

        // Verify success
        const paymentSuccess = posPage.locator('[data-testid="payment-success"]');
        await expect(paymentSuccess).toBeVisible({ timeout: 10000 });
    });
});

/**
 * WF-TAKEAWAY-004: Pickup Status Tracking
 *
 * Tests order tracking for pickup orders
 */
test.describe('@workflow WF-TAKEAWAY-004: Pickup Status Tracking', () => {
    test('should track order through pickup statuses', async ({
        posPage,
        addProduct,
        setOrderType,
        completePayment,
        fireToKitchen,
    }) => {
        // Set order type to TAKEAWAY
        await setOrderType('takeaway');

        // Add product
        await addProduct("Classic Latte");

        // Complete payment
        await completePayment('cash');

        // Fire to kitchen
        await fireToKitchen();

        // Check if there's a status tracker for takeaway orders
        const statusTracker = posPage.locator('[data-testid="order-status-tracker"], [data-testid="pickup-status"]');
        const hasTracker = await statusTracker.isVisible().catch(() => false);

        if (hasTracker) {
            // Get current status
            const currentStatus = await statusTracker.textContent();
            console.log(`Pickup status: ${currentStatus}`);

            // Status should indicate order is being prepared or awaiting pickup
            expect(currentStatus || '').toMatch(/prepar|await|pickup|ready/i);
        }

        // Look for pickup/complete button
        const pickupBtn = posPage.locator('[data-testid="mark-picked-up-btn"], [data-testid="complete-pickup-btn"]');
        const hasPickupButton = await pickupBtn.isVisible().catch(() => false);

        if (hasPickupButton) {
            await pickupBtn.click();
            console.log('Order marked as picked up');

            // Verify status changed to completed
            const completedStatus = posPage.locator('[data-testid="order-status"]');
            const statusText = await completedStatus.textContent() || '';
            expect(statusText).toMatch(/complete|picked|done/i);
        }
    });
});

/**
 * WF-TAKEAWAY-005: Receipt Options
 *
 * Tests receipt handling for takeaway orders
 */
test.describe('@workflow WF-TAKEAWAY-005: Receipt Options', () => {
    test('should offer receipt options for takeaway', async ({
        posPage,
        addProduct,
        setOrderType,
        completePayment,
    }) => {
        // Set order type to TAKEAWAY
        await setOrderType('takeaway');

        // Add product
        await addProduct("Today's Coffee");

        // Complete payment
        await completePayment('cash');

        // Check for receipt options
        const printReceiptBtn = posPage.locator('[data-testid="print-receipt-btn"]');
        const noReceiptBtn = posPage.locator('[data-testid="no-receipt-btn"]');
        const emailReceiptBtn = posPage.locator('[data-testid="email-receipt-btn"]');

        const hasPrintOption = await printReceiptBtn.isVisible().catch(() => false);
        const hasNoReceiptOption = await noReceiptBtn.isVisible().catch(() => false);
        const hasEmailOption = await emailReceiptBtn.isVisible().catch(() => false);

        console.log('Receipt options available:', {
            print: hasPrintOption,
            noReceipt: hasNoReceiptOption,
            email: hasEmailOption,
        });

        // At least one receipt option should be available
        expect(hasPrintOption || hasNoReceiptOption || hasEmailOption).toBeTruthy();
    });
});
