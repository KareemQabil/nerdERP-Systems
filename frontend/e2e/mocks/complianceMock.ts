/**
 * Compliance Mock Helper
 *
 * Provides utilities for mocking ZATCA compliance APIs in E2E tests.
 * This eliminates 30s timeouts from waiting for real backend responses.
 */

import type { Page, Route } from '@playwright/test';

/**
 * Mock invoice hash entry
 */
export interface MockInvoiceHashEntry {
  id: string;
  orderId: string;
  invoiceHash: string;
  previousHash: string;
  invoiceNumber: string;
  createdAt: string;
}

/**
 * Mock ZATCA QR code data
 */
export interface MockZatcaQRData {
  seller: string;
  vatNo: string;
  timestamp: string;
  total: string;
  vat: string;
  encoded: string;
}

/**
 * Mock tax invoice response
 */
export interface MockTaxInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceHash: string;
  previousHash: string;
  qrCodeData: string;
  seller: string;
  vatNumber: string;
  subtotal: string;
  discount: string;
  taxRate: number;
  taxAmount: string;
  total: string;
  paymentMethod: string;
}

/**
 * Helper class for mocking ZATCA compliance APIs in E2E tests
 */
export class ComplianceMock {
  private static invoiceCounter = 1;
  private static hashChain: string[] = ['0'.repeat(64)]; // Start with zeros

  /**
   * Generate the next invoice number in sequence
   */
  private static getNextInvoiceNumber(): string {
    return `INV-${new Date().getFullYear()}-${String(this.invoiceCounter++).padStart(6, '0')}`;
  }

  /**
   * Generate a mock SHA-256 hash (64 hex characters)
   */
  private static generateMockHash(): string {
    // Generate random-looking but deterministic hash
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  /**
   * Get the previous hash in the chain
   */
  private static getPreviousHash(): string {
    return this.hashChain[this.hashChain.length - 1];
  }

  /**
   * Add hash to chain
   */
  private static addToHashChain(hash: string): void {
    this.hashChain.push(hash);
  }

  /**
   * Setup all ZATCA compliance API mocks
   */
  static setupMocks(page: Page): void {
    this.mockInvoiceHash(page);
    this.mockQRCode(page);
    this.mockInvoiceNumber(page);
    this.mockDailyReport(page);
    this.mockMonthlyReport(page);
    this.mockVoidReport(page);
    this.mockTaxExport(page);
  }

  /**
   * Mock invoice hash generation endpoint
   * POST /api/v1/zatca/invoice-hash
   */
  private static mockInvoiceHash(page: Page): void {
    page.route('**/api/v1/zatca/invoice-hash', async (route: Route) => {
      const request = route.request();
      const postData = await request.postDataJSON().catch(() => ({}));

      const invoiceHash = this.generateMockHash();
      const previousHash = this.getPreviousHash();
      const invoiceNumber = postData.invoiceNumber || this.getNextInvoiceNumber();

      this.addToHashChain(invoiceHash);

      const response: MockInvoiceHashEntry = {
        id: `hash-${Date.now()}`,
        orderId: postData.orderId || 'mock-order-id',
        invoiceHash,
        previousHash,
        invoiceNumber,
        createdAt: new Date().toISOString()
      };

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: response
        })
      });
    });
  }

  /**
   * Mock QR code generation endpoint
   * POST /api/v1/zatca/qr
   */
  private static mockQRCode(page: Page): void {
    page.route('**/api/v1/zatca/qr', async (route: Route) => {
      const request = route.request();
      const postData = await request.postDataJSON().catch(() => ({}));

      const qrData: MockZatcaQRData = {
        seller: postData.seller || 'Test Business Name',
        vatNo: postData.vatNo || '300000000000003',
        timestamp: postData.timestamp || new Date().toISOString(),
        total: postData.total || '115.00',
        vat: postData.vat || '15.00',
        encoded: this.generateBase64TLV(
          postData.seller || 'Test Business Name',
          postData.vatNo || '300000000000003',
          postData.timestamp || new Date().toISOString(),
          postData.total || '115.00',
          postData.vat || '15.00'
        )
      };

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: qrData
        })
      });
    });
  }

  /**
   * Generate mock base64 TLV encoded data
   * TLV format: Tag-Length-Value
   */
  private static generateBase64TLV(
    seller: string,
    vatNo: string,
    timestamp: string,
    total: string,
    vat: string
  ): string {
    // Simplified TLV encoding for testing
    // In real ZATCA, this would be properly encoded
    const tlvData = [
      `01${seller.length.toString().padStart(2, '0')}${seller}`,
      `02${vatNo.length.toString().padStart(2, '0')}${vatNo}`,
      `03${timestamp.length.toString().padStart(2, '0')}${timestamp}`,
      `04${total.length.toString().padStart(2, '0')}${total}`,
      `05${vat.length.toString().padStart(2, '0')}${vat}`
    ].join('');

    return Buffer.from(tlvData).toString('base64');
  }

  /**
   * Mock invoice number generation endpoint
   * POST /api/v1/zatca/invoice-number
   */
  private static mockInvoiceNumber(page: Page): void {
    page.route('**/api/v1/zatca/invoice-number', async (route: Route) => {
      const request = route.request();
      const postData = await request.postDataJSON().catch(() => ({}));

      const invoiceNumber = postData.sequence
        ? `INV-${postData.sequence}`
        : this.getNextInvoiceNumber();

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { invoiceNumber }
        })
      });
    });
  }

  /**
   * Mock daily tax report endpoint
   * GET /api/v1/zatca/daily-report
   */
  private static mockDailyReport(page: Page): void {
    page.route('**/api/v1/zatca/daily-report', async (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            date: new Date().toISOString().split('T')[0],
            grossSales: 11500.00,
            vatAmount: 1725.00,
            netSales: 9775.00,
            orderCount: 100,
            averageOrderValue: 115.00,
            voidCount: 2,
            voidAmount: 230.00,
            vatRate: 15
          }
        })
      });
    });
  }

  /**
   * Mock monthly tax report endpoint
   * GET /api/v1/zatca/monthly-report
   */
  private static mockMonthlyReport(page: Page): void {
    page.route('**/api/v1/zatca/monthly-report', async (route: Route) => {
      const url = route.request().url();
      const yearMatch = url.match(/[?&]year=(\d+)/);
      const monthMatch = url.match(/[?&]month=(\d+)/);

      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      const month = monthMatch ? parseInt(monthMatch[1]) : new Date().getMonth() + 1;

      // Generate daily breakdown for the month
      const daysInMonth = new Date(year, month, 0).getDate();
      const dailyBreakdown = Array.from({ length: daysInMonth }, (_, i) => ({
        date: `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
        grossSales: Math.floor(Math.random() * 5000) + 1000,
        vatAmount: Math.floor(Math.random() * 750) + 150,
        netSales: Math.floor(Math.random() * 4250) + 850,
        orderCount: Math.floor(Math.random() * 50) + 10,
        averageOrderValue: Math.floor(Math.random() * 100) + 50
      }));

      const totals = dailyBreakdown.reduce((acc, day) => ({
        grossSales: acc.grossSales + day.grossSales,
        vatAmount: acc.vatAmount + day.vatAmount,
        netSales: acc.netSales + day.netSales,
        orderCount: acc.orderCount + day.orderCount
      }), { grossSales: 0, vatAmount: 0, netSales: 0, orderCount: 0 });

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            year,
            month,
            ...totals,
            dailyBreakdown
          }
        })
      });
    });
  }

  /**
   * Mock void report endpoint
   * GET /api/v1/zatca/void-report
   */
  private static mockVoidReport(page: Page): void {
    page.route('**/api/v1/zatca/void-report', async (route: Route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              date: new Date().toISOString().split('T')[0],
              voidCount: 2,
              voidAmount: 230.00,
              reasons: [
                { reason: 'Customer request', count: 1, amount: 115.00 },
                { reason: 'Mistake', count: 1, amount: 115.00 }
              ],
              voidedBy: [
                { userId: 'user-1', userName: 'Cashier 1', count: 2 }
              ]
            }
          ]
        })
      });
    });
  }

  /**
   * Mock tax export endpoint
   * GET /api/v1/zatca/export
   */
  private static mockTaxExport(page: Page): void {
    page.route('**/api/v1/zatca/export', async (route: Route) => {
      const url = route.request().url();
      const vatNoMatch = url.match(/[?&]vatNumber=([^&]+)/);
      const companyMatch = url.match(/[?&]companyName=([^&]+)/);

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            vatNumber: vatNoMatch ? decodeURIComponent(vatNoMatch[1]) : '300000000000003',
            companyName: companyMatch ? decodeURIComponent(companyMatch[1]) : 'Test Business',
            periodStart: new Date().toISOString().split('T')[0],
            periodEnd: new Date().toISOString().split('T')[0],
            grossSales: 345000.00,
            vatAmount: 51750.00,
            netSales: 293250.00,
            invoiceCount: 3000,
            voidCount: 15,
            generatedAt: new Date().toISOString()
          }
        })
      });
    });
  }

  /**
   * Reset invoice counter between test runs
   */
  static resetCounters(): void {
    this.invoiceCounter = 1;
    this.hashChain = ['0'.repeat(64)];
  }

  /**
   * Get the current invoice number
   */
  static getCurrentInvoiceNumber(): string {
    return `INV-${new Date().getFullYear()}-${String(this.invoiceCounter).padStart(6, '0')}`;
  }

  /**
   * Get the hash chain (for debugging)
   */
  static getHashChain(): string[] {
    return [...this.hashChain];
  }

  /**
   * Create test tax invoice scenarios
   */
  static createTestScenarios() {
    return {
      /**
       * Standard tax invoice
       */
      standardInvoice: {
        invoiceNumber: this.getNextInvoiceNumber(),
        invoiceDate: new Date().toISOString(),
        invoiceHash: this.generateMockHash(),
        previousHash: this.getPreviousHash(),
        subtotal: '100.00',
        discount: '0.00',
        taxRate: 15,
        taxAmount: '15.00',
        total: '115.00'
      },

      /**
       * Invoice with discount
       */
      discountedInvoice: {
        invoiceNumber: this.getNextInvoiceNumber(),
        invoiceDate: new Date().toISOString(),
        subtotal: '100.00',
        discount: '10.00',
        taxRate: 15,
        taxAmount: '13.50',
        total: '103.50'
      },

      /**
       * High-value invoice
       */
      highValueInvoice: {
        invoiceNumber: this.getNextInvoiceNumber(),
        invoiceDate: new Date().toISOString(),
        subtotal: '1000.00',
        discount: '0.00',
        taxRate: 15,
        taxAmount: '150.00',
        total: '1150.00'
      }
    };
  }

  /**
   * Verify invoice hash format (SHA-256 = 64 hex characters)
   */
  static isValidInvoiceHash(hash: string): boolean {
    return /^[A-F0-9]{64}$/i.test(hash);
  }

  /**
   * Verify invoice number format (INV-YYYY-NNNNNN)
   */
  static isValidInvoiceNumber(invoiceNumber: string): boolean {
    return /^INV-\d{4}-\d{6}$/.test(invoiceNumber);
  }

  /**
   * Extract invoice data from page for verification
   */
  static async extractInvoiceData(page: Page): Promise<{
    invoiceNumber?: string;
    invoiceHash?: string;
    subtotal?: string;
    taxAmount?: string;
    total?: string;
  }> {
    const data: Record<string, string> = {};

    // Try to extract invoice number
    try {
      const invoiceNumElement = page.locator('[data-testid="invoice-number"], [data-testid="tax-invoice-number"]');
      if (await invoiceNumElement.isVisible().catch(() => false)) {
        data.invoiceNumber = await invoiceNumElement.textContent() || undefined;
      }
    } catch {}

    // Try to extract invoice hash
    try {
      const hashElement = page.locator('[data-testid="invoice-hash"], [data-testid="zatca-invoice-hash"]');
      if (await hashElement.isVisible().catch(() => false)) {
        data.invoiceHash = await hashElement.textContent() || undefined;
      }
    } catch {}

    // Try to extract financial data
    try {
      const subtotalElement = page.locator('[data-testid="invoice-subtotal"]');
      if (await subtotalElement.isVisible().catch(() => false)) {
        data.subtotal = await subtotalElement.textContent() || undefined;
      }
    } catch {}

    try {
      const taxElement = page.locator('[data-testid="invoice-vat"], [data-testid="vat-amount"]');
      if (await taxElement.isVisible().catch(() => false)) {
        data.taxAmount = await taxElement.textContent() || undefined;
      }
    } catch {}

    try {
      const totalElement = page.locator('[data-testid="invoice-total"], [data-testid="total-including-vat"]');
      if (await totalElement.isVisible().catch(() => false)) {
        data.total = await totalElement.textContent() || undefined;
      }
    } catch {}

    return data;
  }
}

export default ComplianceMock;
