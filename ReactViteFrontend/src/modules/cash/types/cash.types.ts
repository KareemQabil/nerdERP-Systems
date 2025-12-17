// Cash Management Types from nerdjson.md schema

/**
 * Register Session Status enum
 */
export type RegisterSessionStatus =
    | 'OPEN'
    | 'CLOSED'
    | 'DISCREPANCY_UNDER'
    | 'DISCREPANCY_OVER';

/**
 * Cash Transaction Type enum
 */
export type CashTransactionType =
    | 'PAY_IN'
    | 'PAY_OUT'
    | 'BANK_DROP'
    | 'FLOAT_ADJUSTMENT';

/**
 * Register Session entity
 * Maps to register_sessions table in nerdjson.md
 */
export interface RegisterSession {
    id: string;
    sessionNumber: string; // Unique
    deviceId: string;
    userId: string;

    // Session timing
    openedAt: string; // ISO 8601
    closedAt?: string | null; // ISO 8601

    // Cash amounts (decimal(10,3))
    openingCash: string;
    closingCashExpected: string;
    closingCashActual?: string | null;
    cashDifference?: string | null;

    // Sales summary (decimal(10,3))
    totalSales: string; // Default 0
    totalRefunds: string; // Default 0
    totalCashPayments: string; // Default 0
    totalCardPayments: string; // Default 0

    // Status
    status: RegisterSessionStatus;
    notes?: string | null;

    // Relations
    cashTransactions?: CashTransaction[];
    orders?: any[]; // sales_orders
}

/**
 * Cash Transaction entity (Petty cash movements)
 * Maps to cash_transactions table in nerdjson.md
 */
export interface CashTransaction {
    id: string;
    registerSessionId: string;

    // Transaction info
    transactionType: CashTransactionType;
    amount: string; // decimal(10,3) - Negative for payout
    reason: string; // Buying ice, Vendor payment

    // Authorization
    authorizedByUserId?: string | null;
    createdAt: string; // ISO 8601
    createdByUserId: string;
}

/**
 * Bank Drop entity
 * Maps to bank_drops table in nerdjson.md
 */
export interface BankDrop {
    id: string;
    registerSessionId?: string | null;
    amount: string; // decimal(10,3)
    depositDate: string; // ISO 8601 date
    bankReference?: string | null;
    depositedByUserId: string;
    notes?: string | null;
}

/**
 * Open Session DTO
 */
export interface OpenSessionDto {
    deviceId: string;
    userId: string;
    openingCash: string; // decimal(10,3)
    notes?: string;
}

/**
 * Close Session DTO
 */
export interface CloseSessionDto {
    sessionId: string;
    closingCashActual: string; // decimal(10,3)
    notes?: string;
}

/**
 * Create Cash Transaction DTO
 */
export interface CreateCashTransactionDto {
    registerSessionId: string;
    transactionType: CashTransactionType;
    amount: string; // decimal(10,3)
    reason: string;
    authorizedByUserId?: string;
}

/**
 * Session Summary (Calculated)
 */
export interface SessionSummary {
    sessionId: string;
    sessionNumber: string;
    openedAt: string;
    closedAt?: string | null;

    // Cash flow
    openingCash: string;
    cashSales: string;
    cashPayouts: string;
    expectedCash: string;
    actualCash: string;
    difference: string;

    // Sales summary
    totalOrders: number;
    totalSales: string;
    totalRefunds: string;
    cashPayments: string;
    cardPayments: string;

    // Status
    status: RegisterSessionStatus;
    discrepancyPercentage?: string;
}
