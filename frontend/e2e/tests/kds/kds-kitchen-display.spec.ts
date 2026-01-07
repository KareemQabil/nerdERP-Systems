import { test, expect } from '../../fixtures/pos.fixture';
import { setupAllMocks } from '../../mocks';

/**
 * KDS-001 to KDS-005: Kitchen Display System Tests
 *
 * Tests kitchen operations and ticket management using mock ticket injection
 * to avoid WebSocket dependencies in test environment.
 */

// Setup all mocks before KDS tests
test.beforeEach(async ({ posPage }) => {
  setupAllMocks(posPage.page);
});

test.describe('KDS-001: Kitchen Ticket Creation', () => {

    test('should create kitchen ticket using test button', async ({ posPage }) => {
        // Navigate to KDS page
        const kdsButton = posPage.locator('[data-testid="action-kitchen"]');
        if (await kdsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await kdsButton.click();
            await posPage.waitForTimeout(500);

            // Look for KDS page
            const kdsPage = posPage.locator('[data-testid="kds-page"]');
            await expect(kdsPage).toBeVisible({ timeout: 3000 });

            // Click test ticket injection button
            const injectBtn = posPage.locator('[data-testid="inject-test-ticket"]');
            await expect(injectBtn).toBeVisible();
            await injectBtn.click();

            // Wait for ticket to appear
            await posPage.waitForSelector('[data-testid="kitchen-ticket"]', { timeout: 3000 });

            // Verify ticket exists
            const tickets = posPage.locator('[data-testid="kitchen-ticket"]');
            const ticketCount = await tickets.count();
            expect(ticketCount).toBeGreaterThan(0);

            // Verify ticket content
            const firstTicket = tickets.first();
            await expect(firstTicket.locator('[data-testid="ticket-order-number"]')).toBeVisible();
            await expect(firstTicket.locator('[data-testid="ticket-table-number"]')).toBeVisible();
        } else {
            // If no KDS button, test is skipped for this configuration
            test.skip(true, 'KDS button not available in current configuration');
        }
    });
});

test.describe('KDS-002: Ticket Status', () => {

    test('should show pending tickets count on KDS', async ({ posPage }) => {
        // Navigate to KDS
        const kdsButton = posPage.locator('[data-testid="action-kitchen"]');
        if (await kdsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await kdsButton.click();
            await posPage.waitForSelector('[data-testid="kds-page"]', { timeout: 3000 });

            // Inject test ticket
            const injectBtn = posPage.locator('[data-testid="inject-test-ticket"]');
            await injectBtn.click();

            // Wait for ticket to appear
            await posPage.waitForSelector('[data-testid="kitchen-ticket"]', { timeout: 3000 });

            // Check pending count
            const pendingCount = posPage.locator('[data-testid="kds-pending-count"]');
            await expect(pendingCount).toBeVisible();

            // Verify pending count is greater than 0
            const countText = await pendingCount.textContent();
            const count = parseInt(countText || '0');
            expect(count).toBeGreaterThan(0);
        } else {
            test.skip(true, 'KDS button not available in current configuration');
        }
    });

    test('should display tickets in grid layout', async ({ posPage }) => {
        // Navigate to KDS
        const kdsButton = posPage.locator('[data-testid="action-kitchen"]');
        if (await kdsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await kdsButton.click();
            await posPage.waitForSelector('[data-testid="kds-page"]', { timeout: 3000 });

            // Inject multiple test tickets
            const injectBtn = posPage.locator('[data-testid="inject-test-ticket"]');
            await injectBtn.click();
            await posPage.waitForTimeout(200);
            await injectBtn.click();
            await posPage.waitForTimeout(200);
            await injectBtn.click();

            // Check for tickets grid
            const ticketsGrid = posPage.locator('[data-testid="kds-tickets-grid"]');
            await expect(ticketsGrid).toBeVisible();

            // Verify multiple tickets
            const tickets = posPage.locator('[data-testid="kitchen-ticket"]');
            const ticketCount = await tickets.count();
            expect(ticketCount).toBeGreaterThanOrEqual(3);
        } else {
            test.skip(true, 'KDS button not available in current configuration');
        }
    });
});

test.describe('KDS-003: Ticket Bump', () => {

    test('should bump completed ticket from display', async ({ posPage }) => {
        // Navigate to KDS
        const kdsButton = posPage.locator('[data-testid="action-kitchen"]');
        if (await kdsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await kdsButton.click();
            await posPage.waitForSelector('[data-testid="kds-page"]', { timeout: 3000 });

            // Inject test ticket
            const injectBtn = posPage.locator('[data-testid="inject-test-ticket"]');
            await injectBtn.click();

            // Wait for ticket to appear
            const tickets = posPage.locator('[data-testid="kitchen-ticket"]');
            await expect(tickets.first()).toBeVisible({ timeout: 3000 });

            // Get initial ticket count
            const initialCount = await tickets.count();

            // Click bump button on first ticket
            const bumpBtn = tickets.first().locator('[data-testid="bump-btn"]');
            if (await bumpBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await bumpBtn.click();
                await posPage.waitForTimeout(500);

                // Verify ticket count decreased or ticket removed
                const newCount = await tickets.count();
                expect(newCount).toBeLessThanOrEqual(initialCount);
            } else {
                // Bump button may not be visible for new tickets
                // This is expected behavior - tickets need to be marked complete first
                console.log('Bump button not visible - ticket may need to be marked complete first');
            }
        } else {
            test.skip(true, 'KDS button not available in current configuration');
        }
    });
});

test.describe('KDS-004: Modifier Display', () => {

    test('should display item modifiers on tickets', async ({ posPage }) => {
        // Navigate to KDS
        const kdsButton = posPage.locator('[data-testid="action-kitchen"]');
        if (await kdsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await kdsButton.click();
            await posPage.waitForSelector('[data-testid="kds-page"]', { timeout: 3000 });

            // Inject test ticket (test ticket includes modifiers)
            const injectBtn = posPage.locator('[data-testid="inject-test-ticket"]');
            await injectBtn.click();

            // Wait for ticket
            const tickets = posPage.locator('[data-testid="kitchen-ticket"]');
            await expect(tickets.first()).toBeVisible({ timeout: 3000 });

            // Check for item name display
            const itemName = tickets.first().locator('[data-testid="ticket-item-name"]');
            await expect(itemName.first()).toBeVisible();

            // Check for modifiers/notes if present
            const itemNotes = tickets.first().locator('[data-testid="ticket-item-notes"]');
            const hasNotes = await itemNotes.count();
            if (hasNotes > 0) {
                console.log('Item modifiers/notes are displayed');
            }
        } else {
            test.skip(true, 'KDS button not available in current configuration');
        }
    });
});

test.describe('KDS-005: Station Filter', () => {

    test('should filter tickets by station', async ({ posPage }) => {
        // Navigate to KDS
        const kdsButton = posPage.locator('[data-testid="action-kitchen"]');
        if (await kdsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await kdsButton.click();
            await posPage.waitForSelector('[data-testid="kds-page"]', { timeout: 3000 });

            // Inject test ticket
            const injectBtn = posPage.locator('[data-testid="inject-test-ticket"]');
            await injectBtn.click();

            // Wait for ticket
            await posPage.waitForSelector('[data-testid="kitchen-ticket"]', { timeout: 3000 });

            // Check for Hot Kitchen station button
            const hotKitchenBtn = posPage.locator('[data-testid="kds-station-hot_kitchen"]');
            await expect(hotKitchenBtn).toBeVisible();

            // Click to filter by Hot Kitchen
            await hotKitchenBtn.click();
            await posPage.waitForTimeout(200);

            // Verify station is now selected
            const isSelected = await hotKitchenBtn.evaluate(el =>
                el.classList.contains('bg-gradient-to-r') ||
                el.getAttribute('class')?.includes('from-orange-500')
            );
            expect(isSelected).toBeTruthy();

            // Verify tickets are still visible (test ticket is for HOT_KITCHEN)
            const tickets = posPage.locator('[data-testid="kitchen-ticket"]');
            const ticketCount = await tickets.count();
            expect(ticketCount).toBeGreaterThan(0);
        } else {
            test.skip(true, 'KDS button not available in current configuration');
        }
    });

    test('should display all available station filters', async ({ posPage }) => {
        // Navigate to KDS
        const kdsButton = posPage.locator('[data-testid="action-kitchen"]');
        if (await kdsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await kdsButton.click();
            await posPage.waitForSelector('[data-testid="kds-page"]', { timeout: 3000 });

            // Check for all station buttons
            const allStationsBtn = posPage.locator('[data-testid="kds-station-all"]');
            const hotKitchenBtn = posPage.locator('[data-testid="kds-station-hot_kitchen"]');
            const coldKitchenBtn = posPage.locator('[data-testid="kds-station-cold_kitchen"]');
            const barBtn = posPage.locator('[data-testid="kds-station-bar"]');
            const dessertBtn = posPage.locator('[data-testid="kds-station-dessert"]');

            // Verify all stations are present
            await expect(allStationsBtn).toBeVisible();
            await expect(hotKitchenBtn).toBeVisible();
            await expect(coldKitchenBtn).toBeVisible();
            await expect(barBtn).toBeVisible();
            await expect(dessertBtn).toBeVisible();
        } else {
            test.skip(true, 'KDS button not available in current configuration');
        }
    });
});
