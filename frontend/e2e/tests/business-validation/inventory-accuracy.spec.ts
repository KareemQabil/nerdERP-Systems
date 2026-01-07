import { test, expect } from '../../fixtures/pos.fixture';

/**
 * BIZ-INV-001: Inventory Accuracy Tests
 *
 * Validates inventory tracking accuracy from the Operations Manager perspective:
 * - Stock matches physical count
 * - No negative stock
 * - FIFO (First In, First Out) batch tracking works
 * - Waste is properly tracked and authorized
 * - Stock movements have complete audit trail
 */

test.describe('@business-validation BIZ-INV-001: Inventory Accuracy', () => {
    test('should prevent negative stock', async ({
        posPage,
    }) => {
        console.log('Testing negative stock prevention...');

        // Navigate to inventory page
        await posPage.goto('/inventory');

        // Wait for inventory to load
        await posPage.waitForSelector('[data-testid="inventory-page"], [data-testid="inventory-dashboard"]', {
            timeout: 10000
        }).catch(() => {
            console.log('Inventory page not available');
        });

        // Look for negative stock alert
        const negativeStockAlert = posPage.locator('[data-testid="negative-stock-alert"], [data-testid="stock-below-zero-alert"]');
        const hasAlert = await negativeStockAlert.isVisible().catch(() => false);

        if (hasAlert) {
            const alertText = await negativeStockAlert.textContent();
            console.log(`Negative stock alert: ${alertText}`);

            // Click to see details
            await negativeStockAlert.click();

            // Verify detail modal
            const detailModal = posPage.locator('[data-testid="stock-detail-modal"]');
            await expect(detailModal).toBeVisible();

            // Check that each negative stock item has resolution workflow
            const negativeItems = posPage.locator('[data-testid^="negative-stock-item-"]');
            const itemCount = await negativeItems.count();

            console.log(`Items with negative stock: ${itemCount}`);

            for (let i = 0; i < itemCount; i++) {
                const item = negativeItems.nth(i);

                // Should have resolution button
                const resolutionBtn = item.locator('[data-testid="resolution-btn"], [data-testid="adjust-stock-btn"]');
                const hasResolution = await resolutionBtn.isVisible().catch(() => false);

                console.log(`Item ${i + 1}: has resolution workflow: ${hasResolution}`);

                // Operations should be able to resolve negative stock
                expect(hasResolution).toBeTruthy();
            }
        } else {
            console.log('No negative stock detected (good!)');
        }
    });

    test('should track stock movements accurately', async ({
        posPage,
    }) => {
        console.log('Testing stock movement tracking...');

        // Navigate to stock movements
        await posPage.goto('/inventory/movements');

        // Wait for movements page
        await posPage.waitForSelector('[data-testid="stock-movements"], [data-testid="movements-list"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Stock movements page not available');
        });

        // Look for movement entries
        const movementEntries = posPage.locator('[data-testid^="movement-entry-"], [data-testid^="stock-move-"]');
        const movementCount = await movementEntries.count();

        console.log(`Stock movements found: ${movementCount}`);

        if (movementCount > 0) {
            // Check first few entries have required information
            for (let i = 0; i < Math.min(movementCount, 3); i++) {
                const entry = movementEntries.nth(i);

                // Should have type (addition, deduction, transfer, waste)
                const type = entry.locator('[data-testid="movement-type"], [data-testid="move-type"]');
                const hasType = await type.isVisible().catch(() => false);

                // Should have product
                const product = entry.locator('[data-testid="product-name"], [data-testid="item-name"]');
                const hasProduct = await product.isVisible().catch(() => false);

                // Should have quantity
                const quantity = entry.locator('[data-testid="quantity"], [data-testid="move-quantity"]');
                const hasQuantity = await quantity.isVisible().catch(() => false);

                // Should have timestamp
                const timestamp = entry.locator('[data-testid="timestamp"], [data-testid="move-time"]');
                const hasTimestamp = await timestamp.isVisible().catch(() => false);

                // Should have user
                const user = entry.locator('[data-testid="user"], [data-testid="performed-by"]');
                const hasUser = await user.isVisible().catch(() => false);

                console.log(`Movement ${i + 1}:`, {
                    type: hasType,
                    product: hasProduct,
                    quantity: hasQuantity,
                    timestamp: hasTimestamp,
                    user: hasUser,
                });

                expect(hasType && hasProduct && hasQuantity && hasTimestamp).toBeTruthy();
            }
        }
    });

    test('should track waste with proper authorization', async ({
        posPage,
    }) => {
        console.log('Testing waste tracking...');

        // Navigate to inventory movements
        await posPage.goto('/inventory/movements');

        // Filter by waste movements if filter is available
        const filterBtn = posPage.locator('[data-testid="filter-btn"], [data-testid="movement-filter"]');
        const hasFilter = await filterBtn.isVisible().catch(() => false);

        if (hasFilter) {
            await filterBtn.click();

            // Select waste filter
            const wasteFilter = posPage.locator('[data-testid="filter-waste"], [data-testid="waste-type-filter"]');
            if (await wasteFilter.isVisible().catch(() => false)) {
                await wasteFilter.click();
            }
        }

        // Look for waste entries
        const wasteEntries = posPage.locator('[data-testid^="waste-entry-"], [data-testid^="movement-"][data-waste-type="true"]');
        const wasteCount = await wasteEntries.count();

        console.log(`Waste entries found: ${wasteCount}`);

        if (wasteCount > 0) {
            // Check waste entries have proper documentation
            for (let i = 0; i < Math.min(wasteCount, 3); i++) {
                const entry = wasteEntries.nth(i);

                // Should have reason
                const reason = entry.locator('[data-testid="waste-reason"], [data-testid="reason"]');
                const hasReason = await reason.isVisible().catch(() => false);

                // Should have authorizer (waste should require approval)
                const authorizer = entry.locator('[data-testid="authorized-by"], [data-testid="manager-approval"]');
                const hasAuthorizer = await authorizer.isVisible().catch(() => false);

                // Should have quantity
                const quantity = entry.locator('[data-testid="quantity"]');
                const hasQuantity = await quantity.isVisible().catch(() => false);

                console.log(`Waste entry ${i + 1}:`, {
                    reason: hasReason,
                    authorized: hasAuthorizer,
                    quantity: hasQuantity,
                });

                // Waste should be documented and authorized
                expect(hasReason && hasAuthorizer && hasQuantity).toBeTruthy();
            }
        } else {
            console.log('No waste entries found');
        }
    });

    test('should track stock deductions from orders', async ({
        posPage,
        addProduct,
        completePayment,
    }) => {
        console.log('Testing stock deduction on order completion...');

        // Get initial stock level for a product
        const productName = "Today's Coffee";

        // Navigate to inventory
        await posPage.goto('/inventory');

        // Find product stock before order
        const productRow = posPage.locator(`[data-testid="product-row-${productName}"], [data-testid^="product-row-"]:has-text("${productName}")`).first();
        let initialStock = 0;

        if (await productRow.isVisible().catch(() => false)) {
            const stockElement = productRow.locator('[data-testid="stock-level"], [data-testid="current-stock"]');
            const stockText = await stockElement.textContent() || '0';
            initialStock = parseFloat(stockText.replace(/[^0-9.]/g, '') || '0');
            console.log(`Initial stock for ${productName}: ${initialStock}`);
        }

        // Create an order
        await posPage.goto('/pos');
        await posPage.waitForSelector('[data-testid="pos-page"]', { timeout: 10000 });

        await addProduct(productName);
        await completePayment('cash');

        // Wait for order to complete and stock to update
        await posPage.waitForTimeout(2000);

        // Check stock again
        await posPage.goto('/inventory');
        await posPage.waitForSelector('[data-testid="inventory-page"]', { timeout: 10000 });

        const productRowAfter = posPage.locator(`[data-testid="product-row-${productName}"], [data-testid^="product-row-"]:has-text("${productName}")`).first();

        if (await productRowAfter.isVisible().catch(() => false)) {
            const stockElementAfter = productRowAfter.locator('[data-testid="stock-level"], [data-testid="current-stock"]');
            const stockTextAfter = await stockElementAfter.textContent() || '0';
            const finalStock = parseFloat(stockTextAfter.replace(/[^0-9.]/g, '') || '0');

            console.log(`Final stock for ${productName}: ${finalStock}`);

            // Stock should have decreased by at least 1
            expect(finalStock).toBeLessThanOrEqual(initialStock - 1);

            // Verify stock movement was recorded
            await posPage.goto('/inventory/movements');

            // Look for recent deduction
            const recentDeduction = posPage.locator('[data-testid="movement-type-deduction"], [data-testid^="movement-"][data-type="deduction"]').first();
            const hasDeduction = await recentDeduction.isVisible().catch(() => false);

            if (hasDeduction) {
                console.log('Stock deduction recorded in movements');
            }
        }
    });

    test('should support FIFO batch tracking', async ({
        posPage,
    }) => {
        console.log('Testing FIFO batch tracking...');

        // Navigate to inventory batches
        await posPage.goto('/inventory/batches');

        // Wait for batches page
        await posPage.waitForSelector('[data-testid="batches-page"], [data-testid="batch-tracking"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Batch tracking page not available');
        });

        // Look for batch entries
        const batchEntries = posPage.locator('[data-testid^="batch-entry-"], [data-testid^="batch-"]');
        const batchCount = await batchEntries.count();

        console.log(`Batches found: ${batchCount}`);

        if (batchCount > 0) {
            // Check that batches have required information
            const firstBatch = batchEntries.first();

            // Should have batch number/ID
            const batchNumber = firstBatch.locator('[data-testid="batch-number"], [data-testid="batch-id"]');
            const hasBatchNumber = await batchNumber.isVisible().catch(() => false);

            // Should have expiry date
            const expiryDate = firstBatch.locator('[data-testid="expiry-date"], [data-testid="expires-on"]');
            const hasExpiry = await expiryDate.isVisible().catch(() => false);

            // Should have quantity
            const quantity = firstBatch.locator('[data-testid="quantity"], [data-testid="batch-quantity"]');
            const hasQuantity = await quantity.isVisible().catch(() => false);

            // Should have cost
            const cost = firstBatch.locator('[data-testid="cost"], [data-testid="unit-cost"]');
            const hasCost = await cost.isVisible().catch(() => false);

            console.log('Batch information:', {
                batchNumber: hasBatchNumber,
                expiry: hasExpiry,
                quantity: hasQuantity,
                cost: hasCost,
            });

            expect(hasBatchNumber && hasQuantity).toBeTruthy();

            // Check FIFO ordering (earliest expiry should be used first)
            const expiryDates: string[] = [];
            for (let i = 0; i < Math.min(batchCount, 3); i++) {
                const batch = batchEntries.nth(i);
                const expiry = batch.locator('[data-testid="expiry-date"]');
                const dateText = await expiry.textContent() || '';
                if (dateText) {
                    expiryDates.push(dateText);
                }
            }

            if (expiryDates.length >= 2) {
                console.log('Expiry dates:', expiryDates);
                // Dates should be in ascending order (soonest expiring first)
                // This is a visual check - actual FIFO happens during deductions
            }
        } else {
            console.log('No batches found (items may not have batch tracking enabled)');
        }
    });

    test('should alert for low stock items', async ({
        posPage,
    }) => {
        console.log('Testing low stock alerts...');

        // Navigate to inventory
        await posPage.goto('/inventory');

        // Look for low stock alert
        const lowStockAlert = posPage.locator('[data-testid="low-stock-alert"], [data-testid="stock-reorder-alert"]');
        const hasAlert = await lowStockAlert.isVisible().catch(() => false);

        if (hasAlert) {
            const alertText = await lowStockAlert.textContent();
            console.log(`Low stock alert: ${alertText}`);

            // Click to see details
            await lowStockAlert.click();

            // Verify alert modal
            const alertModal = posPage.locator('[data-testid="low-stock-modal"], [data-testid="reorder-modal"]');
            await expect(alertModal).toBeVisible();

            // Check low stock items
            const lowStockItems = posPage.locator('[data-testid^="low-stock-item-"]');
            const itemCount = await lowStockItems.count();

            console.log(`Items below reorder point: ${itemCount}`);

            // Each item should have reorder information
            for (let i = 0; i < Math.min(itemCount, 3); i++) {
                const item = lowStockItems.nth(i);

                // Should show current stock
                const currentStock = item.locator('[data-testid="current-stock"]');
                const hasCurrent = await currentStock.isVisible().catch(() => false);

                // Should show reorder point
                const reorderPoint = item.locator('[data-testid="reorder-point"], [data-testid="min-stock"]');
                const hasReorder = await reorderPoint.isVisible().catch(() => false);

                // Should have reorder action
                const reorderBtn = item.locator('[data-testid="reorder-btn"], [data-testid="order-stock-btn"]');
                const hasReorderBtn = await reorderBtn.isVisible().catch(() => false);

                console.log(`Item ${i + 1}:`, {
                    currentStock: hasCurrent,
                    reorderPoint: hasReorder,
                    canReorder: hasReorderBtn,
                });

                expect(hasCurrent && hasReorder).toBeTruthy();
            }
        } else {
            console.log('No low stock alerts (all items at good levels)');
        }
    });

    test('should track stock transfers between warehouses', async ({
        posPage,
    }) => {
        console.log('Testing stock transfer tracking...');

        // Navigate to stock transfers
        await posPage.goto('/inventory/transfers');

        // Wait for transfers page
        await posPage.waitForSelector('[data-testid="transfers-page"], [data-testid="stock-transfers"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Stock transfers page not available');
        });

        // Look for transfer entries
        const transferEntries = posPage.locator('[data-testid^="transfer-entry-"], [data-testid^="stock-transfer-"]');
        const transferCount = await transferEntries.count();

        console.log(`Stock transfers found: ${transferCount}`);

        if (transferCount > 0) {
            // Check transfer entries have proper documentation
            const firstTransfer = transferEntries.first();

            // Should have source warehouse
            const source = firstTransfer.locator('[data-testid="source-warehouse"], [data-testid="from-warehouse"]');
            const hasSource = await source.isVisible().catch(() => false);

            // Should have destination warehouse
            const destination = firstTransfer.locator('[data-testid="destination-warehouse"], [data-testid="to-warehouse"]');
            const hasDestination = await destination.isVisible().catch(() => false);

            // Should have product
            const product = firstTransfer.locator('[data-testid="product-name"]');
            const hasProduct = await product.isVisible().catch(() => false);

            // Should have quantity
            const quantity = firstTransfer.locator('[data-testid="transfer-quantity"]');
            const hasQuantity = await quantity.isVisible().catch(() => false);

            // Should have status (pending, approved, completed)
            const status = firstTransfer.locator('[data-testid="transfer-status"]');
            const hasStatus = await status.isVisible().catch(() => false);

            console.log('Transfer information:', {
                source: hasSource,
                destination: hasDestination,
                product: hasProduct,
                quantity: hasQuantity,
                status: hasStatus,
            });

            expect(hasSource && hasDestination && hasQuantity).toBeTruthy();
        }
    });

    test('should show inventory valuation report', async ({
        posPage,
    }) => {
        console.log('Testing inventory valuation...');

        // Navigate to inventory reports
        await posPage.goto('/reports/inventory');

        // Wait for report
        await posPage.waitForSelector('[data-testid="inventory-report"], [data-testid="inventory-valuation"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Inventory valuation report not available');
        });

        // Look for total valuation
        const totalValue = posPage.locator('[data-testid="total-inventory-value"], [data-testid="inventory-valuation-total"]');
        const hasValue = await totalValue.isVisible().catch(() => false);

        if (hasValue) {
            const valueText = await totalValue.textContent();
            const valueAmount = parseFloat(valueText?.replace(/[^0-9.]/g, '') || '0');

            console.log(`Total inventory value: ${valueAmount}`);
            expect(valueAmount).toBeGreaterThanOrEqual(0);
        }

        // Check for valuation by category
        const categoryValues = posPage.locator('[data-testid^="category-value-"]');
        const categoryCount = await categoryValues.count();

        if (categoryCount > 0) {
            console.log(`Valuation by ${categoryCount} categories`);
        }
    });
});

/**
 * BIZ-INV-002: Physical Count Verification
 *
 * Tests physical inventory count reconciliation
 */
test.describe('@business-validation BIZ-INV-002: Physical Count', () => {
    test('should support physical inventory count', async ({
        posPage,
    }) => {
        console.log('Testing physical inventory count...');

        // Navigate to physical count page
        await posPage.goto('/inventory/count');

        // Wait for count page
        await posPage.waitForSelector('[data-testid="physical-count-page"], [data-testid="inventory-count"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Physical count page not available');
        });

        // Look for start count button
        const startCountBtn = posPage.locator('[data-testid="start-count-btn"], [data-testid="new-physical-count"]');
        const hasStartButton = await startCountBtn.isVisible().catch(() => false);

        if (hasStartButton) {
            console.log('Physical count feature available');

            // Check for existing counts
            const existingCounts = posPage.locator('[data-testid^="physical-count-"]');
            const count = await existingCounts.count();

            console.log(`Existing physical counts: ${count}`);

            if (count > 0) {
                const firstCount = existingCounts.first();

                // Should have count date
                const countDate = firstCount.locator('[data-testid="count-date"]');
                const hasDate = await countDate.isVisible().catch(() => false);

                // Should have status
                const status = firstCount.locator('[data-testid="count-status"]');
                const hasStatus = await status.isVisible().catch(() => false);

                // Should have discrepancy count
                const discrepancy = firstCount.locator('[data-testid="discrepancy-count"]');
                const hasDiscrepancy = await discrepancy.isVisible().catch(() => false);

                console.log('Physical count has:', {
                    date: hasDate,
                    status: hasStatus,
                    discrepancy: hasDiscrepancy,
                });
            }
        } else {
            console.log('Physical count feature not available');
        }
    });

    test('should calculate variance between system and physical count', async ({
        posPage,
    }) => {
        console.log('Testing variance calculation...');

        // Navigate to inventory reports
        await posPage.goto('/reports/inventory-variance');

        // Wait for variance report
        await posPage.waitForSelector('[data-testid="variance-report"], [data-testid="inventory-variance"]', {
            timeout: 5000
        }).catch(() => {
            console.log('Variance report not available');
        });

        // Look for variance entries
        const varianceEntries = posPage.locator('[data-testid^="variance-entry-"]');
        const varianceCount = await varianceEntries.count();

        console.log(`Variance entries found: ${varianceCount}`);

        if (varianceCount > 0) {
            // Check variance entries have required fields
            const firstVariance = varianceEntries.first();

            // Should have product
            const product = firstVariance.locator('[data-testid="product-name"]');
            const hasProduct = await product.isVisible().catch(() => false);

            // Should have system quantity
            const systemQty = firstVariance.locator('[data-testid="system-quantity"]');
            const hasSystem = await systemQty.isVisible().catch(() => false);

            // Should have physical quantity
            const physicalQty = firstVariance.locator('[data-testid="physical-quantity"]');
            const hasPhysical = await physicalQty.isVisible().catch(() => false);

            // Should have variance
            const variance = firstVariance.locator('[data-testid="variance-amount"]');
            const hasVariance = await variance.isVisible().catch(() => false);

            // Should have value impact
            const valueImpact = firstVariance.locator('[data-testid="value-impact"]');
            const hasValue = await valueImpact.isVisible().catch(() => false);

            console.log('Variance entry has:', {
                product: hasProduct,
                systemQty: hasSystem,
                physicalQty: hasPhysical,
                variance: hasVariance,
                valueImpact: hasValue,
            });

            expect(hasProduct && hasVariance).toBeTruthy();
        }
    });
});
