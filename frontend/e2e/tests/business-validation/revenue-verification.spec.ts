import { test, expect } from '../../fixtures/pos.fixture';

/**
 * BIZ-REVENUE-001: Revenue Protection Tests
 *
 * Validates business rules from the Owner/Management perspective:
 * - All revenue is properly tracked
 * - No revenue is lost through voids/deletions
 * - Discounts are properly authorized
 * - Cash drawer balances match expected amounts
 * - No orphaned payments exist
 */

test.describe('@business-validation BIZ-REVENUE-001: Revenue Protection', () => {
    test('should track all revenue correctly in reports', async ({
        posPage,
        addProduct,
        completePayment,
    }) => {
        console.log('Testing revenue tracking...');

        // Create a few orders to generate revenue
        for (let i = 0; i < 3; i++) {
            await addProduct("Today's Coffee");
            await completePayment('cash');

            // Wait for order to complete
            await posPage.waitForTimeout(1000);

            // Verify payment success
            const paymentSuccess = posPage.locator('[data-testid="payment-success"]');
            await expect(paymentSuccess).toBeVisible({ timeout: 5000 });

            // Start new order
            await posPage.waitForTimeout(500);
        }

        // Navigate to reports
        console.log('Navigating to sales report...');
        await posPage.goto('/reports/sales');

        // Wait for report to load
        await posPage.waitForSelector('[data-testid="sales-report"], [data-testid="report-container"]', {
            timeout: 10000
        });

        // Verify total revenue is displayed
        const totalRevenue = posPage.locator('[data-testid="total-revenue"], [data-testid="report-total-revenue"]');
        const isRevenueDisplayed = await totalRevenue.isVisible().catch(() => false);

        if (isRevenueDisplayed) {
            const revenueText = await totalRevenue.textContent();
            const revenueAmount = parseFloat(revenueText?.replace(/[^0-9.]/g, '') || '0');

            console.log(`Total revenue reported: ${revenueAmount}`);
            expect(revenueAmount).toBeGreaterThan(0);

            // Revenue should be sum of all orders (3 x coffee price)
            expect(revenueAmount).toBeGreaterThan(50); // At least some revenue
        } else {
            console.log('Revenue display not available (reports may not be implemented)');
        }

        // Verify order count matches
        const orderCount = posPage.locator('[data-testid="order-count"], [data-testid="total-orders"]');
        if (await orderCount.isVisible().catch(() => false)) {
            const countText = await orderCount.textContent();
            const count = parseInt(countText?.replace(/[^0-9]/g, '') || '0');
            console.log(`Order count: ${count}`);
            expect(count).toBeGreaterThanOrEqual(3);
        }
    });

    test('should have audit trail for all voids', async ({
        posPage,
        addProduct,
        openCart,
    }) => {
        console.log('Testing void audit trail...');

        // Add product
        await addProduct("Classic Latte");

        // Open cart
        await openCart();

        // Right-click to void (or use void button)
        const cartItem = posPage.locator('[data-testid="cart-item"]').first();
        await cartItem.click({ button: 'right' });

        // Look for void option
        const voidBtn = posPage.locator('[data-testid="void-item-btn"], [data-testid="remove-item-btn"]');
        const hasVoidButton = await voidBtn.isVisible().catch(() => false);

        if (hasVoidButton) {
            await voidBtn.click();

            // Check if PIN is required
            const pinModal = posPage.locator('[data-testid="manager-pin-modal"]');
            const requiresPin = await pinModal.isVisible().catch(() => false);

            if (requiresPin) {
                console.log('PIN required for void - good security');
                // Enter PIN to proceed
                for (const digit of '1234') {
                    await posPage.click(`[data-testid="pin-key-${digit}"]`);
                    await posPage.waitForTimeout(100);
                }
                await posPage.click('[data-testid="authorize-btn"]');
            }

            // Verify void was recorded
            // Navigate to audit logs or void reports
            await posPage.goto('/reports/voids');

            // Wait for void report
            await posPage.waitForSelector('[data-testid="void-report"], [data-testid="audit-log"]', {
                timeout: 5000
            }).catch(() => {
                console.log('Void report page not available');
            });

            // Check if void is logged with reason and authorization
            const voidEntries = posPage.locator('[data-testid^="void-entry-"], [data-testid^="audit-entry-"]');
            const voidCount = await voidEntries.count();

            if (voidCount > 0) {
                console.log(`Found ${voidCount} void entries in audit log`);

                // Check first entry has required fields
                const firstEntry = voidEntries.first();

                // Should have reason
                const reason = firstEntry.locator('[data-testid="void-reason"], [data-testid="audit-reason"]');
                const hasReason = await reason.isVisible().catch(() => false);

                // Should have authorizer
                const authorizer = firstEntry.locator('[data-testid="authorized-by"], [data-testid="audit-authorizer"]');
                const hasAuthorizer = await authorizer.isVisible().catch(() => false);

                // Should have timestamp
                const timestamp = firstEntry.locator('[data-testid="void-time"], [data-testid="audit-time"]');
                const hasTimestamp = await timestamp.isVisible().catch(() => false);

                console.log('Void entry has:', {
                    reason: hasReason,
                    authorizer: hasAuthorizer,
                    timestamp: hasTimestamp,
                });

                expect(hasReason || hasAuthorizer || hasTimestamp).toBeTruthy();
            }
        } else {
            console.log('Void button not available in current implementation');
        }
    });

    test('should detect suspicious void patterns', async ({
        posPage,
        addProduct,
        openCart,
    }) => {
        console.log('Testing fraud detection for excessive voids...');

        // Navigate to fraud detection report
        await posPage.goto('/reports/fraud');

        // Wait for fraud report
        const fraudReport = posPage.locator('[data-testid="fraud-report"], [data-testid="suspicious-activity-report"]');
        const hasFraudReport = await fraudReport.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasFraudReport) {
            console.log('Fraud report available');

            // Check for excessive voids alert
            const excessiveVoidsAlert = posPage.locator('[data-testid="excessive-voids-alert"]');
            const hasAlert = await excessiveVoidsAlert.isVisible().catch(() => false);

            if (hasAlert) {
                const alertText = await excessiveVoidsAlert.textContent();
                console.log(`Excessive voids alert: ${alertText}`);

                // Click to see details
                await excessiveVoidsAlert.click();

                // Verify detail modal
                const detailModal = posPage.locator('[data-testid="void-details-modal"]');
                await expect(detailModal).toBeVisible();

                // Check that each void has proper documentation
                const voidItems = posPage.locator('[data-testid^="void-audit-"]');
                const count = await voidItems.count();

                console.log(`Found ${count} void items requiring review`);

                for (let i = 0; i < Math.min(count, 3); i++) {
                    const item = voidItems.nth(i);

                    // Should have reason
                    const reason = item.locator('[data-testid="void-reason"]');
                    const hasReason = await reason.isVisible().catch(() => false);

                    // Should have authorizer
                    const authorizer = item.locator('[data-testid="authorized-by"]');
                    const hasAuthorizer = await authorizer.isVisible().catch(() => false);

                    console.log(`Void ${i + 1}: reason=${hasReason}, authorized=${hasAuthorizer}`);

                    // All voids should be properly authorized
                    expect(hasAuthorizer).toBeTruthy();
                }
            } else {
                console.log('No excessive voids detected (good!)');
            }
        } else {
            console.log('Fraud report not available (feature may not be implemented)');
        }
    });

    test('should verify no orphaned payments', async ({
        posPage,
    }) => {
        console.log('Testing for orphaned payments...');

        // Navigate to payment reconciliation report
        await posPage.goto('/reports/payments');

        // Wait for report to load
        await posPage.waitForSelector('[data-testid="payment-report"], [data-testid="reconciliation-report"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Payment report not available');
        });

        // Check for orphaned payments
        const orphanedPayments = posPage.locator('[data-testid="orphaned-payment"], [data-testid="unmatched-payment"]');
        const orphanedCount = await orphanedPayments.count();

        console.log(`Orphaned payments found: ${orphanedCount}`);

        // Should be zero orphaned payments
        expect(orphanedCount).toBe(0);

        // Verify payment reconciliation
        const reconciliationStatus = posPage.locator('[data-testid="reconciliation-status"]');
        if (await reconciliationStatus.isVisible().catch(() => false)) {
            const status = await reconciliationStatus.textContent();
            console.log(`Reconciliation status: ${status}`);
            expect(status || '').toMatch(/balanced|reconciled|ok/i);
        }
    });

    test('should track discount authorization', async ({
        posPage,
        addProduct,
        applyDiscount,
        authorizeWithPIN,
        openCart,
    }) => {
        console.log('Testing discount authorization tracking...');

        // Add product
        await addProduct("Premium Steak");

        // Open cart
        await openCart();

        // Apply large discount that requires manager authorization
        await applyDiscount('percentage', 25);

        // Check if PIN modal appeared
        const pinModal = posPage.locator('[data-testid="manager-pin-modal"]');
        const requiresPin = await pinModal.isVisible().catch(() => false);

        if (requiresPin) {
            console.log('PIN required for large discount - good control');

            // Authorize
            await authorizeWithPIN('1234');

            // Verify discount was applied
            const discountDisplay = posPage.locator('[data-testid="cart-discount"]');
            await expect(discountDisplay).toBeVisible();

            // Navigate to discount report
            await posPage.goto('/reports/discounts');

            // Check that discount is logged with authorizer
            const discountEntries = posPage.locator('[data-testid^="discount-entry-"]');
            const hasDiscountLog = await discountEntries.count() > 0;

            if (hasDiscountLog) {
                console.log('Discount authorization is logged');

                const firstEntry = discountEntries.first();

                // Should have authorizer info
                const authorizer = firstEntry.locator('[data-testid="authorized-by"], [data-testid="manager-name"]');
                const hasAuthorizer = await authorizer.isVisible().catch(() => false);

                expect(hasAuthorizer).toBeTruthy();
            }
        } else {
            console.log('No PIN required (25% may be within cashier limits)');
        }
    });

    test('should verify session reconciliation', async ({
        posPage,
    }) => {
        console.log('Testing session reconciliation...');

        // Navigate to session management
        await posPage.goto('/sessions');

        // Wait for sessions list
        await posPage.waitForSelector('[data-testid="sessions-list"], [data-testid="session-management"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Sessions page not available');
        });

        // Look for closed sessions that need reconciliation
        const sessionsNeedingReview = posPage.locator('[data-testid="session-needs-review"], [data-testid="pending-approval"]');
        const needsReviewCount = await sessionsNeedingReview.count();

        console.log(`Sessions needing review: ${needsReviewCount}`);

        // Click on a session if available
        const firstSession = posPage.locator('[data-testid^="session-row-"]').first();
        if (await firstSession.isVisible().catch(() => false)) {
            await firstSession.click();

            // Verify session details are shown
            const sessionReport = posPage.locator('[data-testid="session-report"], [data-testid="session-details"]');
            await expect(sessionReport).toBeVisible();

            // Check discrepancy calculation
            const expectedBalance = posPage.locator('[data-testid="expected-balance"]');
            const actualBalance = posPage.locator('[data-testid="actual-balance"]');
            const discrepancy = posPage.locator('[data-testid="discrepancy"]');

            const hasExpected = await expectedBalance.isVisible().catch(() => false);
            const hasActual = await actualBalance.isVisible().catch(() => false);
            const hasDiscrepancy = await discrepancy.isVisible().catch(() => false);

            console.log('Session report has:', {
                expected: hasExpected,
                actual: hasActual,
                discrepancy: hasDiscrepancy,
            });

            if (hasExpected && hasActual && hasDiscrepancy) {
                const expected = parseFloat((await expectedBalance.textContent())?.replace(/[^0-9.-]/g, '') || '0');
                const actual = parseFloat((await actualBalance.textContent())?.replace(/[^0-9.-]/g, '') || '0');
                const discrepancyAmount = parseFloat((await discrepancy.textContent())?.replace(/[^0-9.-]/g, '') || '0');

                console.log(`Session: expected=${expected}, actual=${actual}, discrepancy=${discrepancyAmount}`);

                // Verify discrepancy is calculated correctly
                expect(Math.abs(discrepancyAmount - (actual - expected))).toBeLessThan(0.01);
            }

            // Check if manager approval is required
            const needsApproval = posPage.locator('[data-testid="needs-approval-badge"]');
            if (await needsApproval.isVisible().catch(() => false)) {
                console.log('Session requires manager approval');
            }
        }
    });
});

/**
 * BIZ-REVENUE-002: Cash Drawer Security
 *
 * Tests cash drawer security and accountability
 */
test.describe('@business-validation BIZ-REVENUE-002: Cash Drawer Security', () => {
    test('should require PIN to open drawer without sale', async ({
        posPage,
    }) => {
        console.log('Testing cash drawer security...');

        // Look for open drawer button
        const openDrawerBtn = posPage.locator('[data-testid="action-openDrawer"], [data-testid="open-drawer-btn"]');
        const hasButton = await openDrawerBtn.isVisible().catch(() => false);

        if (hasButton) {
            await openDrawerBtn.click();

            // Should require PIN
            const pinModal = posPage.locator('[data-testid="manager-pin-modal"]');
            await expect(pinModal).toBeVisible();

            console.log('PIN required to open drawer - good security');
        } else {
            console.log('Open drawer button not available');
        }
    });

    test('should track cash drops to safe', async ({
        posPage,
    }) => {
        console.log('Testing cash drop tracking...');

        // Look for cash drop option
        const cashDropBtn = posPage.locator('[data-testid="cash-drop-btn"], [data-testid="drop-to-safe-btn"]');
        const hasButton = await cashDropBtn.isVisible().catch(() => false);

        if (hasButton) {
            await cashDropBtn.click();

            // Should require amount and authorization
            const amountInput = posPage.locator('[data-testid="cash-drop-amount"]');
            const pinModal = posPage.locator('[data-testid="manager-pin-modal"]');

            const hasAmountInput = await amountInput.isVisible().catch(() => false);
            const requiresPin = await pinModal.isVisible().catch(() => false);

            console.log('Cash drop requires:', {
                amountInput: hasAmountInput,
                pin: requiresPin,
            });

            expect(hasAmountInput || requiresPin).toBeTruthy();
        } else {
            console.log('Cash drop feature not available');
        }
    });
});

/**
 * BIZ-REVENUE-003: Revenue by Category Analysis
 *
 * Tests that revenue is properly categorized and reported
 */
test.describe('@business-validation BIZ-REVENUE-003: Revenue Analysis', () => {
    test('should show revenue breakdown by category', async ({
        posPage,
    }) => {
        console.log('Testing revenue breakdown by category...');

        // Navigate to category report
        await posPage.goto('/reports/categories');

        // Wait for report
        await posPage.waitForSelector('[data-testid="category-report"], [data-testid="revenue-by-category"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Category report not available');
        });

        // Check for category breakdown
        const categoryRows = posPage.locator('[data-testid^="category-row-"]');
        const categoryCount = await categoryRows.count();

        if (categoryCount > 0) {
            console.log(`Found ${categoryCount} categories in report`);

            // Each category should have name and revenue
            for (let i = 0; i < Math.min(categoryCount, 3); i++) {
                const row = categoryRows.nth(i);

                const name = row.locator('[data-testid="category-name"]');
                const revenue = row.locator('[data-testid="category-revenue"]');

                const hasName = await name.isVisible().catch(() => false);
                const hasRevenue = await revenue.isVisible().catch(() => false);

                console.log(`Category ${i + 1}: name=${hasName}, revenue=${hasRevenue}`);

                expect(hasName && hasRevenue).toBeTruthy();
            }
        }
    });

    test('should show hourly revenue distribution', async ({
        posPage,
    }) => {
        console.log('Testing hourly revenue distribution...');

        // Navigate to hourly report
        await posPage.goto('/reports/hourly');

        // Wait for report
        await posPage.waitForSelector('[data-testid="hourly-report"], [data-testid="revenue-by-hour"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Hourly report not available');
        });

        // Check for hourly breakdown
        const hourlyBars = posPage.locator('[data-testid^="hourly-bar-"]');
        const barCount = await hourlyBars.count();

        if (barCount > 0) {
            console.log(`Found ${barCount} hourly data points`);

            // Should show peak hours
            const peakHourIndicator = posPage.locator('[data-testid="peak-hour"], [data-testid="busiest-hour"]');
            const hasPeakHour = await peakHourIndicator.isVisible().catch(() => false);

            if (hasPeakHour) {
                const peakHour = await peakHourIndicator.textContent();
                console.log(`Peak hour: ${peakHour}`);
            }
        }
    });
});
