/**
 * Socket Mock Helper
 *
 * Provides utilities for testing WebSocket-dependent features
 * without requiring actual WebSocket connections.
 */

import type { Page } from '@playwright/test';

/**
 * Mock kitchen ticket data structure
 */
export interface MockKitchenTicket {
  id: string;
  orderNumber: string;
  tableName: string;
  items: Array<{
    name: string;
    quantity: number;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
    notes?: string;
  }>;
  station: 'HOT_KITCHEN' | 'COLD_KITCHEN' | 'BAR' | 'DESSERT';
  createdAt: Date;
  elapsedMinutes: number;
}

/**
 * Helper class for mocking WebSocket functionality in E2E tests
 */
export class MockSocketHelper {
  /**
   * Inject a mock kitchen ticket directly into the page
   * This bypasses the WebSocket connection entirely
   */
  static async injectKitchenTicket(page: Page, ticketData: MockKitchenTicket): Promise<void> {
    await page.evaluate((data: MockKitchenTicket) => {
      // Dispatch custom event that KDSPage can listen to
      window.dispatchEvent(new CustomEvent('test:kitchen-ticket', {
        detail: data
      }));

      // Also directly manipulate Zustand store if accessible via window
      if ((window as any).kitchenStore) {
        (window as any).kitchenStore.addTicket(data);
      }
    }, ticketData);
  }

  /**
   * Create a default mock kitchen ticket for testing
   */
  static createMockTicket(overrides?: Partial<MockKitchenTicket>): MockKitchenTicket {
    const now = new Date();
    return {
      id: `test-ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: `TEST-${Math.floor(Math.random() * 1000)}`,
      tableName: 'T-1',
      items: [
        {
          name: 'Test Burger',
          quantity: 2,
          status: 'PENDING',
          notes: 'Medium rare, no onions'
        },
        {
          name: 'Test Fries',
          quantity: 1,
          status: 'PENDING'
        }
      ],
      station: 'HOT_KITCHEN',
      createdAt: now,
      elapsedMinutes: 0,
      ...overrides
    };
  }

  /**
   * Wait for a kitchen ticket to appear in the DOM
   */
  static async waitForTicketUpdate(page: Page, timeout: number = 5000): Promise<void> {
    await page.waitForSelector('[data-testid="kitchen-ticket"]', { timeout });
  }

  /**
   * Get the count of visible kitchen tickets
   */
  static async getTicketCount(page: Page): Promise<number> {
    const tickets = page.locator('[data-testid="kitchen-ticket"]');
    return await tickets.count();
  }

  /**
   * Simulate a ticket status change
   */
  static async updateTicketStatus(
    page: Page,
    ticketId: string,
    itemIndex: number,
    newStatus: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED'
  ): Promise<void> {
    await page.evaluate(({ id, idx, status }) => {
      window.dispatchEvent(new CustomEvent('test:ticket-status-update', {
        detail: { ticketId: id, itemIndex: idx, newStatus: status }
      }));

      // Update Zustand store if accessible
      if ((window as any).kitchenStore) {
        (window as any).kitchenStore.updateItemStatus(id, idx, status);
      }
    }, { ticketId, itemIndex: itemIndex, newStatus });
  }

  /**
   * Simulate bumping a ticket (moving it to completed/archived)
   */
  static async bumpTicket(page: Page, ticketId: string): Promise<void> {
    await page.evaluate((id) => {
      window.dispatchEvent(new CustomEvent('test:ticket-bump', {
        detail: { ticketId: id }
      }));

      // Update Zustand store if accessible
      if ((window as any).kitchenStore) {
        (window as any).kitchenStore.bumpTicket(id);
      }
    }, ticketId);
  }

  /**
   * Clear all mock tickets from the page
   */
  static async clearAllTickets(page: Page): Promise<void> {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test:clear-tickets'));

      // Clear Zustand store if accessible
      if ((window as any).kitchenStore) {
        (window as any).kitchenStore.clearTickets();
      }
    });
  }

  /**
   * Setup WebSocket mock for KDS tests
   * This intercepts WebSocket connection attempts and provides mock responses
   */
  static setupSocketMock(page: Page): void {
    // Intercept socket.io client initialization
    page.route('**/socket.io/**', (route) => {
      // Return a mock successful connection response
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sid: 'mock-session-id',
          upgrades: ['websocket'],
          pingInterval: 25000,
          pingTimeout: 5000
        })
      });
    });
  }
}

/**
 * Factory function to create test scenarios with multiple tickets
 */
export function createTestTicketScenarios() {
  return {
    /**
     * Create a scenario with multiple pending tickets
     */
    multiplePending: (): MockKitchenTicket[] => [
      MockSocketHelper.createMockTicket({
        orderNumber: 'TEST-001',
        tableName: 'T-1',
        items: [{ name: 'Burger', quantity: 1, status: 'PENDING' }]
      }),
      MockSocketHelper.createMockTicket({
        orderNumber: 'TEST-002',
        tableName: 'T-2',
        items: [{ name: 'Pizza', quantity: 2, status: 'PENDING' }]
      }),
      MockSocketHelper.createMockTicket({
        orderNumber: 'TEST-003',
        tableName: 'T-3',
        items: [{ name: 'Salad', quantity: 1, status: 'PENDING' }]
      })
    ],

    /**
     * Create a scenario with tickets in various states
     */
    mixedStates: (): MockKitchenTicket[] => [
      MockSocketHelper.createMockTicket({
        orderNumber: 'TEST-001',
        items: [
          { name: 'Burger', quantity: 1, status: 'PREPARING' },
          { name: 'Fries', quantity: 1, status: 'READY' }
        ]
      }),
      MockSocketHelper.createMockTicket({
        orderNumber: 'TEST-002',
        items: [{ name: 'Pizza', quantity: 1, status: 'PENDING' }]
      })
    ],

    /**
     * Create a scenario for testing the bump feature
     */
    readyToBump: (): MockKitchenTicket => MockSocketHelper.createMockTicket({
      orderNumber: 'TEST-001',
      items: [
        { name: 'Burger', quantity: 1, status: 'SERVED' },
        { name: 'Fries', quantity: 1, status: 'SERVED' }
      ]
    })
  };
}

export default MockSocketHelper;
