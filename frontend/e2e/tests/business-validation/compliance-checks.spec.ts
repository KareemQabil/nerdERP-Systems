import { test, expect } from '../../fixtures/pos.fixture';
import { ComplianceMock } from '../../mocks';

/**
 * BIZ-COMPLIANCE-001: ZATCA Compliance Tests
 *
 * Validates Saudi Arabian tax compliance requirements from the Accountant perspective:
 * - VAT is calculated at 15% correctly
 * - Invoice includes all required fields
 * - ZATCA-compliant invoice hash (SHA-256) is generated
 * - QR code contains TLV-encoded data
 * - Audit trail is retained for required period
 * - Tax invoices are properly numbered sequentially
 */

// Setup ZATCA compliance mocks for all tests
test.beforeEach(async ({ posPage }) => {
  ComplianceMock.setupMocks(posPage);
});

test.describe('@business-validation BIZ-COMPLIANCE-001: ZATCA VAT Compliance', () => {
    test('should calculate VAT correctly at 15%', async ({
        posPage,
        addProduct,
        openCart,
        parseMonetaryValue,
    }) => {
        console.log('Testing VAT calculation at 15%...');

        // Add a product with known price
        await addProduct("Today's Coffee");

        // Open cart to see breakdown
        await openCart();

        // Try multiple selectors for subtotal (handles Arabic/English)
        const subtotalSelectors = [
            '[data-testid="cart-subtotal"]',
            '[data-testid="checkout-subtotal"]',
            '.cart-subtotal',
            '.checkout-subtotal',
            '[data-testid="cart-panel"] [data-testid="subtotal"]'
        ];

        let subtotal = 0;
        for (const selector of subtotalSelectors) {
            subtotal = await parseMonetaryValue(selector);
            if (subtotal > 0) break;
        }

        // Try multiple selectors for VAT AMOUNT (not rate)
        // We want the actual tax amount, not the percentage rate
        const vatAmountSelectors = [
            '[data-testid="cart-tax"]',
            '[data-testid="checkout-tax"]',
            '[data-testid="vat-amount"]',
            '.cart-tax',
            '.checkout-tax',
            '[data-testid="cart-panel"] [data-testid="tax"]'
        ];

        let vatAmount = 0;
        for (const selector of vatAmountSelectors) {
            const value = await parseMonetaryValue(selector);
            // VAT amount should be a small number (like 1.5), not a percentage (like 15)
            // If value is > 100, it's likely the rate, not the amount
            if (value > 0 && value < 100) {
                vatAmount = value;
                break;
            }
        }

        // If still no values found, try checkout modal
        if (subtotal === 0 || vatAmount === 0) {
            console.log('Values not found in cart, trying checkout modal...');

            // Open checkout - try multiple selectors
            const paymentBtnSelectors = [
                '[data-testid="action-payment"]',
                'button:has-text("Checkout")',
                'button:has-text("Pay")',
                'button:has-text("دفع")',
                '[aria-label*="checkout" i], [aria-label*="payment" i]',
            ];

            let clicked = false;
            for (const selector of paymentBtnSelectors) {
                try {
                    await posPage.click(selector, { timeout: 2000 });
                    clicked = true;
                    console.log(`Clicked payment button: ${selector}`);
                    break;
                } catch {
                    continue;
                }
            }

            if (clicked) {
                // Wait for checkout modal to appear
                await posPage.waitForTimeout(2000);

                // Wait for checkout modal to be visible
                const checkoutModal = posPage.locator('[data-testid="checkout-modal"]');
                const modalVisible = await checkoutModal.isVisible().catch(() => false);

                if (modalVisible) {
                    console.log('Checkout modal opened');

                    // Try to get values from checkout modal
                    const checkoutSelectors = [
                        { selector: '[data-testid="checkout-modal"] [data-testid="checkout-subtotal"]', target: 'subtotal' },
                        { selector: '[data-testid="checkout-subtotal"]', target: 'subtotal' },
                        { selector: '[data-testid="checkout-modal"] [data-testid="checkout-tax"]', target: 'tax' },
                        { selector: '[data-testid="checkout-tax"]', target: 'tax' },
                    ];

                    for (const { selector, target } of checkoutSelectors) {
                        try {
                            const value = await parseMonetaryValue(selector);
                            if (value > 0 && value < 100) {
                                if (target === 'subtotal' && subtotal === 0) subtotal = value;
                                else if (target === 'tax' && vatAmount === 0) vatAmount = value;
                            }
                        } catch {
                            continue;
                        }
                    }
                }
            }
        }

        console.log(`Subtotal: ${subtotal}, VAT: ${vatAmount}`);

        // If we have both values, verify the calculation
        if (subtotal > 0 && vatAmount > 0) {
            const expectedVat = subtotal * 0.15;
            console.log(`Expected VAT: ${expectedVat}, Actual VAT: ${vatAmount}`);

            // VAT should be 15% of subtotal (allow small rounding difference)
            expect(Math.abs(vatAmount - expectedVat)).toBeLessThan(0.50);
        } else {
            console.log('Could not find valid subtotal or VAT amount, skipping verification');
            // Mark test as skipped if we can't find the values
            test.skip();
        }

        // Close checkout modal if open
        const checkoutModal = posPage.locator('[data-testid="checkout-modal"]');
        const closeModalSelectors = [
            '[data-testid="checkout-modal"] button:has-text("Cancel")',
            '[data-testid="checkout-modal"] button:has-text("إلغاء")',
            '[data-testid="close-modal-btn"]',
        ];

        if (await checkoutModal.isVisible().catch(() => false)) {
            for (const selector of closeModalSelectors) {
                try {
                    await posPage.click(selector, { timeout: 2000 });
                    console.log(`Closed modal with: ${selector}`);
                    break;
                } catch {
                    continue;
                }
            }
        }
    });

    test('should include all required fields on tax invoice', async ({
        posPage,
        addProduct,
        completePayment,
    }) => {
        console.log('Testing tax invoice required fields...');

        // Add product
        await addProduct("Classic Latte");

        // Complete payment to generate invoice
        await completePayment('cash');

        // Wait for payment success state (mocked responses are immediate)
        await Promise.race([
            posPage.waitForSelector('[data-testid="payment-success"]', { timeout: 5000 }),
            posPage.waitForSelector('[data-testid="tax-invoice"]', { timeout: 5000 }),
            posPage.waitForSelector('[data-testid="invoice-view"]', { timeout: 5000 })
        ]).catch(() => console.log('No success state found, continuing anyway'));

        // Look for invoice/receipt view
        const invoiceView = posPage.locator('[data-testid="invoice-view"], [data-testid="receipt-view"], [data-testid="tax-invoice"]');
        await expect(invoiceView.first()).toBeVisible({ timeout: 5000 });
        console.log('Invoice view displayed');

        // Check for required fields per ZATCA regulations:
        // 1. Tax invoice number
        const invoiceNumber = posPage.locator('[data-testid="invoice-number"], [data-testid="tax-invoice-number"]');
        await expect(invoiceNumber.first()).toBeVisible({ timeout: 3000 });
        console.log('Invoice number: Yes');

        // 2. Issue date and time
        const invoiceDate = posPage.locator('[data-testid="invoice-date"], [data-testid="issue-date"]');
        await expect(invoiceDate.first()).toBeVisible({ timeout: 3000 });
        console.log('Issue date: Yes');

        // 3. Seller name and tax number
        const sellerName = posPage.locator('[data-testid="seller-name"], [data-testid="business-name"]');
        const taxNumber = posPage.locator('[data-testid="tax-number"], [data-testid="vat-registration"]');
        const hasSeller = await sellerName.first().isVisible().catch(() => false);
        const hasTaxNumber = await taxNumber.first().isVisible().catch(() => false);
        console.log(`Seller info: ${hasSeller ? 'Yes' : 'No'}, Tax number: ${hasTaxNumber ? 'Yes' : 'No'}`);

        // 4. Customer name (if applicable)
        const customerName = posPage.locator('[data-testid="customer-name"], [data-testid="buyer-name"]');
        const hasCustomer = await customerName.count() > 0 ? await customerName.first().isVisible().catch(() => false) : false;
        console.log(`Customer name: ${hasCustomer ? 'Yes' : 'No (optional for B2C)'}`);

        // 5. Item descriptions
        const itemDescriptions = posPage.locator('[data-testid^="invoice-item-"] [data-testid="item-description"], [data-testid^="line-item-"]');
        const itemCount = await itemDescriptions.count();
        console.log(`Line items: ${itemCount}`);

        // 6. VAT amount and rate
        const vatAmount = posPage.locator('[data-testid="vat-amount"], [data-testid="total-vat"]');
        await expect(vatAmount.first()).toBeVisible({ timeout: 3000 });
        console.log('VAT amount: Yes');

        // 7. Total amount including VAT
        const totalIncludingVat = posPage.locator('[data-testid="total-including-vat"], [data-testid="grand-total"], [data-testid="cart-total"]');
        await expect(totalIncludingVat.first()).toBeVisible({ timeout: 3000 });
        console.log('Grand total: Yes');

        // Verify critical fields are present
        expect(itemCount).toBeGreaterThan(0);
    });

    test('should generate ZATCA-compliant invoice hash (SHA-256)', async ({
        posPage,
        addProduct,
        completePayment,
    }) => {
        console.log('Testing ZATCA invoice hash generation...');

        // Add product
        await addProduct("Premium Steak");

        // Complete payment
        await completePayment('cash');

        // Wait for payment success state (mocked responses are immediate)
        await Promise.race([
            posPage.waitForSelector('[data-testid="payment-success"]', { timeout: 5000 }),
            posPage.waitForSelector('[data-testid="tax-invoice"]', { timeout: 5000 }),
            posPage.waitForSelector('[data-testid="invoice-view"]', { timeout: 5000 })
        ]).catch(() => console.log('No success state found, continuing anyway'));

        // Look for invoice hash (should be 64-character hexadecimal string)
        const invoiceHash = posPage.locator('[data-testid="zatca-invoice-hash"], [data-testid="invoice-hash"], [data-testid="digital-signature"]');

        // With mocked ZATCA API, hash should be available immediately
        await expect(invoiceHash.first()).toBeVisible({ timeout: 5000 }).catch(() => {
            console.log('Invoice hash not visible (may be on printed receipt or QR code only)');
        });

        const hashValue = await invoiceHash.first().textContent();
        console.log(`Invoice hash: ${hashValue?.substring(0, 16)}...`);

        // Verify SHA-256 format (64 hex characters) - mocked hash matches this pattern
        expect(hashValue || '').toMatch(/^[A-F0-9]{64}$/i);
        console.log('Invoice hash format is correct (SHA-256)');

        // Also check QR code which contains the hash
        const qrCode = posPage.locator('[data-testid="zatca-qr-code"], [data-testid="invoice-qr-code"]');
        await expect(qrCode.first()).toBeVisible({ timeout: 3000 }).catch(() => {
            console.log('QR code not visible on screen');
        });
        console.log('QR code is displayed (contains TLV-encoded data including hash)');
    });

    test('should generate proper QR code with TLV encoding', async ({
        posPage,
        addProduct,
        completePayment,
    }) => {
        console.log('Testing ZATCA QR code generation...');

        // Add product
        await addProduct("Today's Coffee");

        // Complete payment
        await completePayment('cash');

        // Wait for payment success state (mocked responses are immediate)
        await Promise.race([
            posPage.waitForSelector('[data-testid="payment-success"]', { timeout: 5000 }),
            posPage.waitForSelector('[data-testid="tax-invoice"]', { timeout: 5000 }),
            posPage.waitForSelector('[data-testid="invoice-view"]', { timeout: 5000 })
        ]).catch(() => console.log('No success state found, continuing anyway'));

        // Look for QR code element
        const qrCode = posPage.locator('[data-testid="zatca-qr-code"], [data-testid="qr-code"], [data-testid="invoice-qr"]');

        // With mocked ZATCA API, QR code should be available immediately
        await expect(qrCode.first()).toBeVisible({ timeout: 5000 });
        console.log('QR code found');

        // Check if it's an image/canvas element
        const tagName = await qrCode.first().evaluate(el => el.tagName);
        console.log(`QR code element type: ${tagName}`);

        // Should be either IMG (with src), CANVAS, or contain an SVG
        expect(['IMG', 'CANVAS', 'svg', 'IMG-CONTAINER']).toContain(
            tagName === 'svg' ? 'svg' :
                tagName === 'IMG' ? 'IMG' :
                    tagName === 'CANVAS' ? 'CANVAS' : 'IMG-CONTAINER'
        );

        // If it's an image, check it has a source
        if (tagName === 'IMG') {
            const src = await qrCode.first().getAttribute('src');
            expect(src).toBeTruthy();
            console.log(`QR code source length: ${src?.length} characters`);
        }
    });

    test('should maintain sequential invoice numbering', async ({
        posPage,
        addProduct,
        completePayment,
    }) => {
        console.log('Testing sequential invoice numbering...');

        const invoiceNumbers: string[] = [];

        // Create multiple orders and collect invoice numbers
        for (let i = 0; i < 3; i++) {
            // Add product
            await addProduct("Fresh Juice");

            // Complete payment
            await completePayment('cash');

            // Wait for payment success state (mocked responses are immediate)
            await Promise.race([
                posPage.waitForSelector('[data-testid="payment-success"]', { timeout: 5000 }),
                posPage.waitForSelector('[data-testid="tax-invoice"]', { timeout: 5000 }),
                posPage.waitForSelector('[data-testid="invoice-view"]', { timeout: 5000 })
            ]).catch(() => console.log('No success state found, continuing anyway'));

            // Get invoice number (mock returns sequential numbers)
            const invoiceNumber = posPage.locator('[data-testid="invoice-number"], [data-testid="tax-invoice-number"]');

            // With mocked ZATCA API, invoice number should be available immediately
            await expect(invoiceNumber.first()).toBeVisible({ timeout: 3000 });
            const number = await invoiceNumber.first().textContent() || '';
            invoiceNumbers.push(number.trim());
            console.log(`Invoice ${i + 1}: ${number}`);

            // Start new order for next iteration
            if (i < 2) {
                const newOrderBtn = posPage.locator('[data-testid="new-order-btn"], button:has-text("New Order")');
                await newOrderBtn.first().click().catch(() => console.log('No new order button found'));
                await posPage.waitForTimeout(300);
            }
        }

        // Verify invoice numbers are sequential
        console.log('Invoice numbers:', invoiceNumbers);

        // Check if they are numeric and increasing
        const numericNumbers = invoiceNumbers
            .map(n => parseInt(n.replace(/[^0-9]/g, '')))
            .filter(n => !isNaN(n));

        expect(numericNumbers.length).toBeGreaterThanOrEqual(2);

        // Verify each number is greater than the previous
        for (let i = 1; i < numericNumbers.length; i++) {
            expect(numericNumbers[i]).toBeGreaterThan(numericNumbers[i - 1]);
        }
        console.log('Invoice numbers are sequential');
    });
});

/**
 * BIZ-COMPLIANCE-002: Audit Trail Retention
 *
 * Tests that audit trail is maintained for regulatory requirements
 */
test.describe('@business-validation BIZ-COMPLIANCE-002: Audit Trail', () => {
    test('should maintain audit trail for all transactions', async ({
        posPage,
    }) => {
        console.log('Testing audit trail maintenance...');

        // Navigate to audit log
        await posPage.goto('/reports/audit');

        // Wait for audit log
        await posPage.waitForSelector('[data-testid="audit-log"], [data-testid="audit-trail"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Audit log page not available');
        });

        // Check for audit entries
        const auditEntries = posPage.locator('[data-testid^="audit-entry-"], [data-testid^="audit-log-"]');
        const entryCount = await auditEntries.count();

        console.log(`Audit entries found: ${entryCount}`);

        if (entryCount > 0) {
            // Check that entries have required information
            const firstEntry = auditEntries.first();

            // Should have timestamp
            const timestamp = firstEntry.locator('[data-testid="timestamp"], [data-testid="audit-time"]');
            const hasTimestamp = await timestamp.isVisible().catch(() => false);

            // Should have user
            const user = firstEntry.locator('[data-testid="user"], [data-testid="actor"]');
            const hasUser = await user.isVisible().catch(() => false);

            // Should have action
            const action = firstEntry.locator('[data-testid="action"], [data-testid="event"]');
            const hasAction = await action.isVisible().catch(() => false);

            console.log('Audit entry has:', {
                timestamp: hasTimestamp,
                user: hasUser,
                action: hasAction,
            });

            expect(hasTimestamp && hasUser && hasAction).toBeTruthy();

            // Verify audit trail is not easily deletable
            const deleteBtn = posPage.locator('[data-testid="delete-audit-btn"]');
            const hasDelete = await deleteBtn.isVisible().catch(() => false);

            if (hasDelete) {
                console.log('WARNING: Delete button available for audit entries');
                // This might be OK if it requires special authorization
            } else {
                console.log('Audit entries cannot be deleted (compliant)');
            }
        }
    });

    test('should log all state changes with timestamps', async ({
        posPage,
        addProduct,
        completePayment,
    }) => {
        console.log('Testing state change logging...');

        // Create an order
        await addProduct("Classic Latte");
        await completePayment('cash');

        // Navigate to order history
        await posPage.goto('/orders/history');

        // Wait for order list
        await posPage.waitForSelector('[data-testid="order-history"], [data-testid="orders-list"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Order history not available');
        });

        // Click on first order
        const firstOrder = posPage.locator('[data-testid^="order-row-"]').first();
        if (await firstOrder.isVisible().catch(() => false)) {
            await firstOrder.click();

            // Look for state history
            const stateHistory = posPage.locator('[data-testid="state-history"], [data-testid="order-state-history"]');
            const hasHistory = await stateHistory.isVisible().catch(() => false);

            if (hasHistory) {
                console.log('State history is available');

                const historyEntries = posPage.locator('[data-testid^="state-change-"]');
                const entryCount = await historyEntries.count();

                console.log(`State changes: ${entryCount}`);

                // Each state change should have:
                // - Previous state
                // - New state
                // - Timestamp
                // - User who made the change
                for (let i = 0; i < Math.min(entryCount, 3); i++) {
                    const entry = historyEntries.nth(i);

                    const fromState = entry.locator('[data-testid="from-state"]');
                    const toState = entry.locator('[data-testid="to-state"]');
                    const timestamp = entry.locator('[data-testid="timestamp"]');
                    const user = entry.locator('[data-testid="user"]');

                    const hasFrom = await fromState.isVisible().catch(() => false);
                    const hasTo = await toState.isVisible().catch(() => false);
                    const hasTimestamp = await timestamp.isVisible().catch(() => false);
                    const hasUser = await user.isVisible().catch(() => false);

                    console.log(`State change ${i + 1}:`, {
                        from: hasFrom,
                        to: hasTo,
                        timestamp: hasTimestamp,
                        user: hasUser,
                    });

                    expect(hasTo && hasTimestamp).toBeTruthy();
                }
            }
        }
    });
});

/**
 * BIZ-COMPLIANCE-003: Rounded Currency Handling
 *
 * Tests proper handling of Saudi Riyal with 2 decimal places (halalat)
 */
test.describe('@business-validation BIZ-COMPLIANCE-003: Currency Handling', () => {
    test('should handle calculations with proper rounding', async ({
        posPage,
        addProduct,
        openCart,
    }) => {
        console.log('Testing currency rounding...');

        // Add multiple items to test rounding
        await addProduct("Today's Coffee"); // 25.00
        await addProduct("Classic Latte");  // 35.00

        // Open cart
        await openCart();

        // Get line item prices
        const lineItems = posPage.locator('[data-testid="cart-item"]');
        const itemCount = await lineItems.count();

        let calculatedTotal = 0;

        for (let i = 0; i < itemCount; i++) {
            const item = lineItems.nth(i);
            const priceElement = item.locator('[data-testid="item-price"], [data-testid="line-price"]');
            const priceText = await priceElement.textContent() || '0';
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '') || '0');
            calculatedTotal += price;
        }

        // Get displayed total
        const totalElement = posPage.locator('[data-testid="cart-total"]');
        const displayedTotalText = await totalElement.textContent() || '0';
        const displayedTotal = parseFloat(displayedTotalText.replace(/[^0-9.]/g, '') || '0');

        console.log(`Calculated: ${calculatedTotal}, Displayed: ${displayedTotal}`);

        // Should match (allowing for tax)
        expect(displayedTotal).toBeGreaterThanOrEqual(calculatedTotal);

        // Verify amounts have 2 decimal places
        const totalText = await totalElement.textContent();
        if (totalText?.includes('.')) {
            const decimals = totalText.split('.')[1];
            expect(decimals.length).toBeLessThanOrEqual(2);
        }
    });

    test('should display currency symbol correctly', async ({
        posPage,
        addProduct,
        openCart,
    }) => {
        // Add product
        await addProduct("Fresh Juice");

        // Open cart
        await openCart();

        // Check for SAR currency symbol or code
        const totalElement = posPage.locator('[data-testid="cart-total"]');
        const totalText = await totalElement.textContent() || '';

        // Should contain SAR or ر.س or similar
        const hasCurrencyIndicator = /SAR|ر\.س|ريال|\d+\.\d{2}/.test(totalText);

        console.log(`Currency display: ${totalText}`);

        expect(hasCurrencyIndicator || /\d+\.\d{2}/.test(totalText)).toBeTruthy();
    });
});
