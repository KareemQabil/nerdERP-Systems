/**
 * Payment Mock Helper
 *
 * Provides utilities for mocking payment processing APIs in E2E tests.
 * This eliminates race conditions and external dependencies during testing.
 */

import type { Page, Route } from '@playwright/test';

/**
 * Mock payment entry response
 */
export interface MockPaymentEntry {
  id: string;
  orderId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'MOBILE' | 'BANK_TRANSFER' | 'GIFT_CARD';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  reference?: string;
}

/**
 * Mock split payment response
 */
export interface MockSplitPaymentResponse {
  success: boolean;
  data: {
    payments: MockPaymentEntry[];
    totalPaid: number;
    remainingAmount: number;
    status: 'PENDING' | 'COMPLETED' | 'PARTIAL';
  };
}

/**
 * Helper class for mocking payment processing in E2E tests
 */
export class PaymentMock {
  private static mockPaymentId = 0;
  private static paymentHistory: MockPaymentEntry[] = [];

  /**
   * Generate a unique mock payment ID
   */
  private static generatePaymentId(): string {
    return `pay-mock-${++this.mockPaymentId}-${Date.now()}`;
  }

  /**
   * Setup all payment-related API mocks
   */
  static setupMocks(page: Page): void {
    this.mockPaymentProcess(page);
    this.mockSplitPayment(page);
    this.mockPaymentStatus(page);
    this.mockRefund(page);
    this.resetHistory();
  }

  /**
   * Mock the payment processing endpoint
   * POST /api/v1/payments/process
   */
  private static mockPaymentProcess(page: Page): void {
    page.route('**/api/v1/payments/process', async (route: Route) => {
      const request = route.request();
      const postData = await request.postDataJSON().catch(() => ({}));

      const mockPayment: MockPaymentEntry = {
        id: this.generatePaymentId(),
        orderId: postData.orderId || 'mock-order-id',
        amount: postData.amount || 0,
        method: postData.method || 'CASH',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        reference: `REF-${Date.now()}`
      };

      this.paymentHistory.push(mockPayment);

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockPayment
        })
      });
    });
  }

  /**
   * Mock the split payment endpoint
   * POST /api/v1/payments/split
   */
  private static mockSplitPayment(page: Page): void {
    page.route('**/api/v1/payments/split', async (route: Route) => {
      const request = route.request();
      const postData = await request.postDataJSON().catch(() => ({}));
      const payments = postData.payments || [];

      // Create mock payment entries
      const mockPayments: MockPaymentEntry[] = payments.map((payment: any) => ({
        id: this.generatePaymentId(),
        orderId: postData.orderId || 'mock-order-id',
        amount: payment.amount || 0,
        method: payment.method || 'CASH',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        reference: `SPLIT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      }));

      // Calculate totals
      const totalPaid = mockPayments.reduce((sum, p) => sum + p.amount, 0);
      const orderTotal = postData.orderTotal || totalPaid;
      const remainingAmount = Math.max(0, orderTotal - totalPaid);

      const response: MockSplitPaymentResponse = {
        success: true,
        data: {
          payments: mockPayments,
          totalPaid,
          remainingAmount,
          status: remainingAmount === 0 ? 'COMPLETED' : 'PARTIAL'
        }
      };

      this.paymentHistory.push(...mockPayments);

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Mock the payment status check endpoint
   * GET /api/v1/payments/orders/:orderId/status
   */
  private static mockPaymentStatus(page: Page): void {
    page.route('**/api/v1/payments/orders/*/status', async (route: Route) => {
      const url = route.request().url();
      const orderIdMatch = url.match(/orders\/([^\/]+)\/status/);
      const orderId = orderIdMatch ? orderIdMatch[1] : 'unknown';

      // Find payments for this order
      const orderPayments = this.paymentHistory.filter(p => p.orderId === orderId);
      const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0);

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            orderId,
            payments: orderPayments,
            totalPaid,
            status: orderPayments.length > 0 ? 'PAID' : 'PENDING',
            paymentComplete: totalPaid > 0
          }
        })
      });
    });
  }

  /**
   * Mock the refund endpoint
   * POST /api/v1/payments/refund
   */
  private static mockRefund(page: Page): void {
    page.route('**/api/v1/payments/refund', async (route: Route) => {
      const request = route.request();
      const postData = await request.postDataJSON().catch(() => ({}));

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: `ref-${Date.now()}`,
            paymentId: postData.paymentId || 'mock-payment-id',
            amount: postData.amount || 0,
            status: 'COMPLETED',
            createdAt: new Date().toISOString()
          }
        })
      });
    });
  }

  /**
   * Reset payment history between tests
   */
  static resetHistory(): void {
    this.mockPaymentId = 0;
    this.paymentHistory = [];
  }

  /**
   * Get all recorded mock payments
   */
  static getPaymentHistory(): MockPaymentEntry[] {
    return [...this.paymentHistory];
  }

  /**
   * Get payments for a specific order
   */
  static getOrderPayments(orderId: string): MockPaymentEntry[] {
    return this.paymentHistory.filter(p => p.orderId === orderId);
  }

  /**
   * Wait for payment success state
   */
  static async waitForPaymentSuccess(page: Page, timeout: number = 5000): Promise<void> {
    await Promise.race([
      page.waitForSelector('[data-testid="payment-success"]', { timeout }),
      page.waitForSelector('[data-testid="tax-invoice"]', { timeout }),
      page.waitForSelector('[data-testid="checkout-success"]', { timeout })
    ]);
  }

  /**
   * Wait for split payment panel to be ready
   */
  static async waitForSplitPaymentPanel(page: Page, timeout: number = 3000): Promise<void> {
    await page.waitForSelector('[data-testid="split-payment-panel"]', { timeout });
    // Wait for animations
    await page.waitForTimeout(200);
  }

  /**
   * Wait for remaining amount to reach zero
   */
  static async waitForFullPayment(page: Page, timeout: number = 5000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const remainingElement = page.locator('[data-testid="remaining-amount"]').first();
      const isVisible = await remainingElement.isVisible().catch(() => false);

      if (isVisible) {
        const text = await remainingElement.textContent() || '';
        const remaining = parseFloat(text.replace(/[^\d.]/g, ''));

        if (remaining === 0) {
          return;
        }
      }

      await page.waitForTimeout(100);
    }

    throw new Error('Remaining amount did not reach zero within timeout');
  }

  /**
   * Add a payment in split payment mode
   */
  static async addSplitPayment(
    page: Page,
    amount: number,
    method: string = 'CASH'
  ): Promise<void> {
    // Wait for amount input
    await page.waitForSelector('[data-testid="payment-amount-input"]', { timeout: 3000 });

    // Fill amount
    await page.fill('[data-testid="payment-amount-input"]', amount.toString());

    // Select method if needed
    if (method !== 'CASH') {
      const methodSelector = await page.locator(`[data-testid="method-${method.toLowerCase()}"]`);
      if (await methodSelector.isVisible().catch(() => false)) {
        await methodSelector.click();
      }
    }

    // Click add payment button
    await page.click('[data-testid="add-payment-btn"]');

    // Wait for payment entry to appear
    await page.waitForSelector('[data-testid^="payment-entry-"]', { timeout: 3000 });
  }

  /**
   * Verify payment button is enabled
   */
  static async verifyCompleteButtonEnabled(page: Page): Promise<boolean> {
    const completeBtn = page.locator('[data-testid="complete-payment-btn"]').first();
    const isEnabled = await completeBtn.isEnabled().catch(() => false);
    return isEnabled;
  }

  /**
   * Simulate a payment failure scenario
   */
  static setupFailureScenario(page: Page, failureType: 'INSUFFICIENT' | 'DECLINED' | 'TIMEOUT'): void {
    page.route('**/api/v1/payments/process', async (route: Route) => {
      let errorMessage = 'Payment failed';
      let statusCode = 400;

      switch (failureType) {
        case 'INSUFFICIENT':
          errorMessage = 'Insufficient funds';
          break;
        case 'DECLINED':
          errorMessage = 'Card declined';
          statusCode = 402;
          break;
        case 'TIMEOUT':
          // Simulate timeout by not responding
          return;
      }

      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: errorMessage
        })
      });
    });
  }

  /**
   * Create test payment scenarios
   */
  static createTestScenarios() {
    return {
      /**
       * Standard single payment
       */
      singlePayment: {
        orderId: 'test-order-001',
        amount: 100,
        method: 'CASH'
      },

      /**
       * Split payment with two methods
       */
      splitPayment: {
        orderId: 'test-order-002',
        orderTotal: 150,
        payments: [
          { amount: 100, method: 'CASH' },
          { amount: 50, method: 'CARD' }
        ]
      },

      /**
       * Complex split with multiple methods
       */
      complexSplit: {
        orderId: 'test-order-003',
        orderTotal: 300,
        payments: [
          { amount: 100, method: 'CASH' },
          { amount: 150, method: 'CARD' },
          { amount: 50, method: 'MOBILE' }
        ]
      },

      /**
       * Large order requiring split
       */
      largeOrder: {
        orderId: 'test-order-004',
        orderTotal: 500,
        payments: [
          { amount: 200, method: 'CARD' },
          { amount: 200, method: 'CARD' },
          { amount: 100, method: 'CASH' }
        ]
      }
    };
  }
}

export default PaymentMock;
