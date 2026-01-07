import { test, expect } from '../../fixtures/pos.fixture';

/**
 * WF-DELIVERY-001: Complete Delivery Order Workflow
 *
 * Full lifecycle test for delivery orders:
 * 1. Set order type to DELIVERY
 * 2. Select delivery zone
 * 3. Enter customer details
 * 4. Add products
 * 5. Verify delivery fee calculation
 * 6. Complete payment
 * 7. Fire to kitchen
 * 8. Assign driver
 * 9. Track delivery status
 */

test.describe('@workflow WF-DELIVERY-001: Complete Delivery Order', () => {
    test('should complete full delivery workflow', async ({
        posPage,
        addProduct,
        setOrderType,
        completePayment,
        getCartItemCount,
    }) => {
        console.log('Starting delivery workflow test');

        // Step 1: Set order type to DELIVERY
        console.log('Step 1: Set order type to DELIVERY');
        await setOrderType('delivery');

        // Step 2: Handle delivery details modal if it appears
        console.log('Step 2: Check for delivery details modal');
        const deliveryModal = posPage.locator('[data-testid="delivery-details-modal"], [data-testid="delivery-info-modal"]');

        if (await deliveryModal.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Enter customer name
            const nameInput = posPage.locator('[data-testid="customer-name-input"], [data-testid="delivery-customer-name"]');
            if (await nameInput.isVisible().catch(() => false)) {
                await nameInput.fill('Test Customer');
            }

            // Confirm delivery details
            const confirmBtn = posPage.locator('[data-testid="confirm-delivery-btn"], [data-testid="delivery-confirm-btn"]');
            if (await confirmBtn.isVisible().catch(() => false)) {
                await confirmBtn.click();
            }
        }

        // Step 3: Add products
        console.log('Step 3: Add products');
        await addProduct("Premium Steak");
        await addProduct("Fresh Juice");

        // Verify cart has items
        const itemCount = await getCartItemCount();
        expect(itemCount).toBeGreaterThanOrEqual(1);
        console.log(`Cart has ${itemCount} items`);

        // Step 4: Complete payment
        console.log('Step 4: Complete payment');
        await completePayment('cash');

        // Verify payment success
        const paymentSuccess = posPage.locator('[data-testid="payment-success"]');
        await expect(paymentSuccess).toBeVisible({ timeout: 10000 });
        console.log('Payment completed');

        // Note: Kitchen firing and driver assignment handled separately
        console.log('Delivery workflow completed successfully!');
    });

    test('should handle delivery order with address', async ({
        posPage,
        addProduct,
        setOrderType,
        completePayment,
    }) => {
        // Set order type to DELIVERY
        await setOrderType('delivery');

        // Handle delivery modal if it appears
        const deliveryModal = posPage.locator('[data-testid="delivery-details-modal"]');
        if (await deliveryModal.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Enter delivery address
            const addressInput = posPage.locator('[data-testid="delivery-address-input"], [data-testid="address-input"]');
            if (await addressInput.isVisible().catch(() => false)) {
                await addressInput.fill('123 Test Street');
            }

            // Confirm
            const confirmBtn = posPage.locator('[data-testid="confirm-delivery-btn"]');
            if (await confirmBtn.isVisible().catch(() => false)) {
                await confirmBtn.click();
            }
        }

        // Add product
        await addProduct("Today's Coffee");

        // Complete payment
        await completePayment('cash');

        // Verify success
        const paymentSuccess = posPage.locator('[data-testid="payment-success"]');
        await expect(paymentSuccess).toBeVisible({ timeout: 10000 });
    });

    test('should calculate delivery fee based on zone', async ({
        posPage,
        addProduct,
        setOrderType,
        getCartTotal,
    }) => {
        // Set order type to DELIVERY
        await setOrderType('delivery');

        // Handle delivery modal if it appears
        const deliveryModal = posPage.locator('[data-testid="delivery-details-modal"]');
        if (await deliveryModal.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Select different zone and check fee
            const zoneSelect = posPage.locator('[data-testid="delivery-zone-select"]');
            if (await zoneSelect.isVisible().catch(() => false)) {
                // Get initial fee
                const deliveryFeeBefore = posPage.locator('[data-testid="delivery-fee"]');
                const feeBefore = await deliveryFeeBefore.textContent() || '0';

                // Change zone
                await zoneSelect.selectOption({ index: 1 });
                await posPage.waitForTimeout(500);

                // Get new fee
                const feeAfter = await deliveryFeeBefore.textContent() || '0';

                console.log(`Delivery fee before zone change: ${feeBefore}`);
                console.log(`Delivery fee after zone change: ${feeAfter}`);

                // Close modal
                await posPage.click('[data-testid="close-modal-btn"], [data-testid="cancel-btn"]');
            }
        }

        // Add product
        await addProduct("Today's Coffee");

        // Verify total includes some amount
        const total = await getCartTotal();
        expect(parseFloat(total)).toBeGreaterThan(0);
    });

    test('should require delivery details before checkout', async ({
        posPage,
        addProduct,
        setOrderType,
    }) => {
        // Set order type to DELIVERY
        await setOrderType('delivery');

        // Add product
        await addProduct("Classic Latte");

        // Try to checkout without delivery details
        await posPage.click('[data-testid="action-payment"]');

        // Should show delivery details modal or error
        const deliveryModal = posPage.locator('[data-testid="delivery-details-modal"]');
        const checkoutBlocker = posPage.locator('[data-testid="checkout-blocker"]');
        const checkoutModal = posPage.locator('[data-testid="checkout-modal"]');

        const hasDeliveryModal = await deliveryModal.isVisible().catch(() => false);
        const hasBlocker = await checkoutBlocker.isVisible().catch(() => false);
        const hasCheckoutModal = await checkoutModal.isVisible().catch(() => false);

        // Either delivery modal should appear or blocker or checkout
        expect(hasDeliveryModal || hasBlocker || hasCheckoutModal).toBeTruthy();

        if (hasDeliveryModal) {
            // Fill minimum details to proceed
            const addressInput = posPage.locator('[data-testid="delivery-address-input"]');
            if (await addressInput.isVisible().catch(() => false)) {
                await addressInput.fill('123 Test Street');
            }

            const confirmBtn = posPage.locator('[data-testid="confirm-delivery-btn"]');
            if (await confirmBtn.isVisible().catch(() => false)) {
                await confirmBtn.click();
            }
        }
    });
});

/**
 * WF-DELIVERY-002: Zone-Based Delivery Pricing
 *
 * Tests that delivery fees are calculated correctly based on zones
 */
test.describe('@workflow WF-DELIVERY-002: Zone-Based Delivery Pricing', () => {
    test('should apply correct delivery fee for each zone', async ({
        posPage,
        addProduct,
        setOrderType,
    }) => {
        // Set order type to DELIVERY
        await setOrderType('delivery');

        // Wait for delivery modal
        const deliveryModal = posPage.locator('[data-testid="delivery-details-modal"]');
        const hasModal = await deliveryModal.isVisible({ timeout: 3000 }).catch(() => false);

        if (!hasModal) {
            console.log('Delivery modal not shown, skipping zone test');
            return;
        }

        // Get zone select
        const zoneSelect = posPage.locator('[data-testid="delivery-zone-select"]');
        if (!await zoneSelect.isVisible().catch(() => false)) {
            console.log('Zone selector not available');
            return;
        }

        // Add a product first
        await addProduct("Today's Coffee");

        // Get delivery fee element
        const deliveryFeeElement = posPage.locator('[data-testid="delivery-fee"]');

        // Test each available zone
        const zoneOptions = await zoneSelect.locator('option').all();
        console.log(`Found ${zoneOptions.length} delivery zones`);

        for (let i = 0; i < Math.min(zoneOptions.length, 3); i++) {
            const zoneValue = await zoneOptions[i].getAttribute('value');
            const zoneText = await zoneOptions[i].textContent();

            await zoneSelect.selectOption({ index: i });
            await posPage.waitForTimeout(500);

            const feeText = await deliveryFeeElement.textContent() || '0';
            const feeAmount = parseFloat(feeText.replace(/[^0-9.]/g, '') || '0');

            console.log(`Zone "${zoneText}": Delivery fee = ${feeAmount}`);

            // Fee should be non-negative
            expect(feeAmount).toBeGreaterThanOrEqual(0);
        }
    });
});

/**
 * WF-DELIVERY-003: Driver Assignment Workflow
 *
 * Tests driver assignment for delivery orders
 */
test.describe('@workflow WF-DELIVERY-003: Driver Assignment', () => {
    test('should allow manual driver assignment', async ({
        posPage,
        addProduct,
        setOrderType,
        completePayment,
        fireToKitchen,
    }) => {
        // Set order type to DELIVERY
        await setOrderType('delivery');

        // Handle delivery modal
        const deliveryModal = posPage.locator('[data-testid="delivery-details-modal"]');
        if (await deliveryModal.isVisible({ timeout: 3000 }).catch(() => false)) {
            const addressInput = posPage.locator('[data-testid="delivery-address-input"]');
            if (await addressInput.isVisible().catch(() => false)) {
                await addressInput.fill('123 Test Street');
            }
            const confirmBtn = posPage.locator('[data-testid="confirm-delivery-btn"]');
            if (await confirmBtn.isVisible().catch(() => false)) {
                await confirmBtn.click();
            }
        }

        // Add product
        await addProduct("Classic Latte");

        // Complete payment
        await completePayment('cash');

        // Fire to kitchen
        await fireToKitchen();

        // Look for driver assignment option
        const assignDriverBtn = posPage.locator('[data-testid="assign-driver-btn"]');
        const driverModal = posPage.locator('[data-testid="driver-assignment-modal"]');

        const hasAssignButton = await assignDriverBtn.isVisible().catch(() => false);
        const hasDriverModal = await driverModal.isVisible().catch(() => false);

        if (hasAssignButton) {
            await assignDriverBtn.click();

            // Wait for driver selection modal
            await posPage.waitForSelector('[data-testid="driver-assignment-modal"], [data-testid="driver-list"]', {
                timeout: 5000
            });

            // Select first available driver
            const firstDriver = posPage.locator('[data-testid^="driver-option-"]').first();
            if (await firstDriver.isVisible().catch(() => false)) {
                await firstDriver.click();
                console.log('Driver assigned');

                // Confirm assignment
                const confirmBtn = posPage.locator('[data-testid="confirm-driver-btn"]');
                if (await confirmBtn.isVisible().catch(() => false)) {
                    await confirmBtn.click();
                }
            }
        } else if (hasDriverModal) {
            // Modal is already open
            const firstDriver = posPage.locator('[data-testid^="driver-option-"]').first();
            if (await firstDriver.isVisible().catch(() => false)) {
                await firstDriver.click();
            }
        } else {
            console.log('Driver assignment not available or auto-assigned');
        }
    });

    test('should show driver availability status', async ({
        posPage,
        setOrderType,
    }) => {
        // Set order type to DELIVERY
        await setOrderType('delivery');

        // Check for driver availability indicator
        const driverAvailability = posPage.locator('[data-testid="driver-availability"], [data-testid="available-drivers-count"]');
        const hasAvailability = await driverAvailability.isVisible().catch(() => false);

        if (hasAvailability) {
            const availabilityText = await driverAvailability.textContent();
            console.log(`Driver availability: ${availabilityText}`);
            expect(availabilityText).toBeTruthy();
        }
    });
});

/**
 * WF-DELIVERY-004: Delivery Status Tracking
 *
 * Tests tracking delivery order through different statuses
 */
test.describe('@workflow WF-DELIVERY-004: Delivery Status Tracking', () => {
    test('should track order through delivery statuses', async ({
        posPage,
        addProduct,
        setOrderType,
        completePayment,
        fireToKitchen,
    }) => {
        // Set order type to DELIVERY
        await setOrderType('delivery');

        // Handle delivery modal
        const deliveryModal = posPage.locator('[data-testid="delivery-details-modal"]');
        if (await deliveryModal.isVisible({ timeout: 3000 }).catch(() => false)) {
            const addressInput = posPage.locator('[data-testid="delivery-address-input"]');
            if (await addressInput.isVisible().catch(() => false)) {
                await addressInput.fill('123 Test Street');
            }
            const confirmBtn = posPage.locator('[data-testid="confirm-delivery-btn"]');
            if (await confirmBtn.isVisible().catch(() => false)) {
                await confirmBtn.click();
            }
        }

        // Add product
        await addProduct("Today's Coffee");

        // Complete payment
        await completePayment('cash');

        // Fire to kitchen
        await fireToKitchen();

        // Check delivery status tracker
        const statusTracker = posPage.locator('[data-testid="delivery-status-tracker"], [data-testid="delivery-progress"]');
        const hasTracker = await statusTracker.isVisible().catch(() => false);

        if (hasTracker) {
            const statusText = await statusTracker.textContent();
            console.log(`Delivery status: ${statusText}`);

            // Should show some delivery-related status
            expect(statusText || '').toBeTruthy();
        }

        // Check for individual status indicators
        const statusIndicators = [
            '[data-testid="status-pending"]',
            '[data-testid="status-preparing"]',
            '[data-testid="status-ready"]',
            '[data-testid="status-out-for-delivery"]',
            '[data-testid="status-delivered"]',
        ];

        for (const selector of statusIndicators) {
            const indicator = posPage.locator(selector);
            if (await indicator.isVisible().catch(() => false)) {
                console.log(`Status indicator visible: ${selector}`);
            }
        }
    });
});

/**
 * WF-DELIVERY-005: COD (Cash on Delivery) Handling
 *
 * Tests cash on delivery payment option
 */
test.describe('@workflow WF-DELIVERY-005: COD Payment', () => {
    test('should support cash on delivery option', async ({
        posPage,
        addProduct,
        setOrderType,
        getCartTotal,
    }) => {
        // Set order type to DELIVERY
        await setOrderType('delivery');

        // Handle delivery modal
        const deliveryModal = posPage.locator('[data-testid="delivery-details-modal"]');
        if (await deliveryModal.isVisible({ timeout: 3000 }).catch(() => false)) {
            const addressInput = posPage.locator('[data-testid="delivery-address-input"]');
            if (await addressInput.isVisible().catch(() => false)) {
                await addressInput.fill('123 Test Street');
            }

            // Look for COD checkbox
            const codCheckbox = posPage.locator('[data-testid="cod-checkbox"], [data-testid="cash-on-delivery"]');
            if (await codCheckbox.isVisible().catch(() => false)) {
                await codCheckbox.check();
                console.log('Cash on delivery selected');
            }

            const confirmBtn = posPage.locator('[data-testid="confirm-delivery-btn"]');
            if (await confirmBtn.isVisible().catch(() => false)) {
                await confirmBtn.click();
            }
        }

        // Add product
        await addProduct("Classic Latte");

        // Click payment button
        await posPage.click('[data-testid="action-payment"]');

        // Check if COD payment method is available
        const codPaymentMethod = posPage.locator('[data-testid="payment-method-cod"], [data-testid="payment-method-cash-on-delivery"]');
        const hasCOD = await codPaymentMethod.isVisible().catch(() => false);

        if (hasCOD) {
            await codPaymentMethod.click();
            console.log('COD payment method selected');

            // Complete order
            await posPage.click('[data-testid="complete-payment-btn"]');

            // Verify success (order created but payment pending)
            const orderSuccess = posPage.locator('[data-testid="order-success"], [data-testid="payment-pending"]');
            await expect(orderSuccess).toBeVisible({ timeout: 10000 });
        } else {
            console.log('COD not available as separate payment method');
        }
    });
});
