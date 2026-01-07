/**
 * Mock Helpers Index
 *
 * Centralized exports for all test mock utilities
 */

export { MockSocketHelper, createTestTicketScenarios } from './socketMock';
export type { MockKitchenTicket } from './socketMock';

export { PaymentMock } from './paymentMock';
export type { MockPaymentEntry, MockSplitPaymentResponse } from './paymentMock';

export { ComplianceMock } from './complianceMock';
export type {
  MockInvoiceHashEntry,
  MockZatcaQRData,
  MockTaxInvoice
} from './complianceMock';

/**
 * Setup all mocks for a complete E2E test run
 */
import type { Page } from '@playwright/test';
import { PaymentMock } from './paymentMock';
import { ComplianceMock } from './complianceMock';
import { MockSocketHelper } from './socketMock';

export function setupAllMocks(page: Page): void {
  PaymentMock.setupMocks(page);
  ComplianceMock.setupMocks(page);
  MockSocketHelper.setupSocketMock(page);
}

/**
 * Reset all mock state between tests
 */
export function resetAllMocks(): void {
  PaymentMock.resetHistory();
  ComplianceMock.resetCounters();
}
