/**
 * Shift Management Types
 * 
 * Defines the data model for shift/session management with cash control.
 * Each shift represents a cashier's work session from open to close with
 * cash counting and reconciliation.
 */

export type ShiftStatus = 'OPEN' | 'CLOSED';

export type TransactionType =
    | 'CASH'
    | 'CARD'
    | 'MADA'
    | 'APPLE_PAY'
    | 'STC_PAY'
    | 'REFUND'; // NEW: For refund transactions

export type CashTransactionType =
    | 'SALE'
    | 'REFUND'
    | 'PAY_IN'
    | 'PAY_OUT';

/**
 * Cash Transaction Record
 * Individual transaction entry for shift history
 */
export interface CashTransaction {
    id: string;
    type: CashTransactionType;
    amount: string;          // decimal(10,3)
    paymentMethod?: TransactionType;  // Only for SALE/REFUND
    reason?: string;         // Required for PAY_IN/PAY_OUT
    timestamp: string;       // ISO 8601
}

/**
 * Shift interface - Complete shift session data
 * 
 * Tracks cash flow from opening float through sales AND REFUNDS to closing reconciliation.
 * All currency values stored as decimal strings (e.g., "500.000") for precision.
 */
export interface Shift {
    // Identity
    id: string;                    // Unique shift identifier
    cashierId: string;             // User ID who opened shift
    cashierName: string;           // Display name for reports

    // Timestamps
    startTime: string;             // ISO 8601 when shift opened
    endTime?: string;              // ISO 8601 when shift closed (optional during open shift)

    // Cash tracking (all decimal strings)
    startingCash: string;          // Opening float amount
    totalCashSales: string;        // Running total of cash transactions
    totalCardSales: string;        // Running total of card/digital transactions
    totalRefundsCash: string;      // Running total of cash refunds issued  
    totalRefundsCard: string;      // Running total of card refunds issued
    totalPayIn: string;            // Manual cash additions (e.g., extra change)
    totalPayOut: string;           // Manual cash removals (e.g., expenses)
    expectedCash: string;          // Calculated: start + sales - refunds + payIn - payOut
    actualCash?: string;           // User-counted cash at close (optional during open shift)
    difference?: string;           // Calculated: actualCash - expectedCash (optional during open shift)

    // Status
    status: ShiftStatus;

    // Metrics
    transactionCount: number;      // Total number of transactions
    refundCount: number;           // Total number of refunds issued
    totalSales: string;            // Sum of all payment methods

    // Transaction History
    transactions: CashTransaction[];  // Full transaction log
}

/**
 * Create Shift DTO - Data needed to open a new shift
 */
export interface CreateShiftDto {
    cashierName: string;
    startingCash: string;
}

/**
 * Close Shift DTO - Data needed to close a shift
 */
export interface CloseShiftDto {
    actualCash: string;            // User-counted amount in drawer
}
