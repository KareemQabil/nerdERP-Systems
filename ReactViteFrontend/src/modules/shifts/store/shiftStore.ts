import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Decimal from 'decimal.js';
import type { Shift, ShiftStatus, TransactionType, CashTransaction, CashTransactionType } from '../types/shift.types';

/**
 * Shift Store Interface
 * 
 * Manages shift state with localStorage persistence.
 * Enforces shift cycle: must open shift before POS operations.
 */
interface ShiftStore {
    // State
    currentShift: Shift | null;
    isShiftOpen: boolean;

    // Actions
    openShift: (cashierName: string, startingCash: string) => void;
    closeShift: (actualCash: string) => Shift;
    addTransaction: (amount: string, type: TransactionType) => void;
    addRefund: (amount: string, type: TransactionType) => void;
    payIn: (amount: string, reason: string) => void;
    payOut: (amount: string, reason: string) => void;
    getCurrentShift: () => Shift | null;
    getTransactionHistory: () => CashTransaction[];
}

/**
 * Shift Store with Zustand + Persist
 * 
 * Persists shift data to localStorage for session continuity.
 * Survives page refresh and browser restart.
 */
export const useShiftStore = create<ShiftStore>()(
    persist(
        (set, get) => ({
            // Initial state
            currentShift: null,
            isShiftOpen: false,

            /**
             * Open a new shift
             * Creates new shift session with opening cash amount
             */
            openShift: (cashierName: string, startingCash: string) => {
                const now = new Date().toISOString();
                const shiftId = `shift-${Date.now()}-${Math.random().toString(36).slice(2)}`;

                const newShift: Shift = {
                    id: shiftId,
                    cashierId: 'current-user-id', // TODO: Get from auth context
                    cashierName,
                    startTime: now,
                    endTime: undefined,
                    startingCash,
                    totalCashSales: '0.000',
                    totalCardSales: '0.000',
                    totalRefundsCash: '0.000',
                    totalRefundsCard: '0.000',
                    totalPayIn: '0.000',
                    totalPayOut: '0.000',
                    expectedCash: startingCash, // Initially same as starting
                    actualCash: undefined,
                    difference: undefined,
                    status: 'OPEN',
                    transactionCount: 0,
                    refundCount: 0,
                    totalSales: '0.000',
                    transactions: [],
                };

                set({
                    currentShift: newShift,
                    isShiftOpen: true,
                });

                console.log('✅ Shift Opened:', {
                    shiftId,
                    cashierName,
                    startingCash,
                    timestamp: now,
                });
            },

            /**
             * Close current shift
             * Calculates final reconciliation and returns completed shift
             * ATOMICALLY resets store to force new shift opening
             */
            closeShift: (actualCash: string) => {
                const shift = get().currentShift;

                if (!shift) {
                    throw new Error('No shift open to close');
                }

                const now = new Date().toISOString();

                // Calculate difference: actualCash - expectedCash
                const actual = new Decimal(actualCash);
                const expected = new Decimal(shift.expectedCash);
                const difference = actual.minus(expected).toFixed(3);

                const closedShift: Shift = {
                    ...shift,
                    endTime: now,
                    actualCash,
                    difference,
                    status: 'CLOSED',
                };

                console.log('✅ Shift Closed:', {
                    shiftId: closedShift.id,
                    expectedCash: closedShift.expectedCash,
                    actualCash: closedShift.actualCash,
                    difference: closedShift.difference,
                    totalSales: closedShift.totalSales,
                    transactions: closedShift.transactionCount,
                });

                // ATOMIC RESET: Set both to null/false simultaneously
                set({
                    currentShift: null,
                    isShiftOpen: false,
                });

                return closedShift;
            },

            /**
             * Add transaction to current shift
             * Updates running totals based on payment type
             * Called after each successful order creation
             */
            addTransaction: (amount: string, type: TransactionType) => {
                const shift = get().currentShift;

                if (!shift) {
                    console.warn('⚠️ No shift open - transaction not tracked');
                    return;
                }

                const amountDecimal = new Decimal(amount);
                const currentTotalSales = new Decimal(shift.totalSales);
                const newTotalSales = currentTotalSales.plus(amountDecimal).toFixed(3);

                // Update cash or card totals based on payment type
                let updatedShift: Shift;

                if (type === 'CASH') {
                    const currentCashSales = new Decimal(shift.totalCashSales);
                    const newCashSales = currentCashSales.plus(amountDecimal).toFixed(3);

                    // Recalculate expected cash
                    const startingCash = new Decimal(shift.startingCash);
                    const expectedCash = startingCash.plus(newCashSales).toFixed(3);

                    // Create transaction record
                    const transaction: CashTransaction = {
                        id: `txn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        type: 'SALE',
                        amount,
                        paymentMethod: type,
                        timestamp: new Date().toISOString(),
                    };

                    updatedShift = {
                        ...shift,
                        totalCashSales: newCashSales,
                        expectedCash,
                        totalSales: newTotalSales,
                        transactionCount: shift.transactionCount + 1,
                        transactions: [...shift.transactions, transaction],
                    };
                } else {
                    // Card/Digital payment
                    const currentCardSales = new Decimal(shift.totalCardSales);
                    const newCardSales = currentCardSales.plus(amountDecimal).toFixed(3);

                    // Create transaction record
                    const transaction: CashTransaction = {
                        id: `txn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        type: 'SALE',
                        amount,
                        paymentMethod: type,
                        timestamp: new Date().toISOString(),
                    };

                    updatedShift = {
                        ...shift,
                        totalCardSales: newCardSales,
                        totalSales: newTotalSales,
                        transactionCount: shift.transactionCount + 1,
                        transactions: [...shift.transactions, transaction],
                    };
                }

                set({ currentShift: updatedShift });

                console.log('💰 Transaction Added:', {
                    amount,
                    type,
                    newTotalSales,
                    transactionCount: updatedShift.transactionCount,
                });
            },

            /**
             * Add refund to current shift
             * Deducts from running totals and updates expected cash
             * Called after successful refund processing
             */
            addRefund: (amount: string, type: TransactionType) => {
                const shift = get().currentShift;

                if (!shift) {
                    console.warn('⚠️ No shift open - refund not tracked');
                    return;
                }

                const amountDecimal = new Decimal(amount);

                // Update refund totals based on payment type
                let updatedShift: Shift;

                if (type === 'CASH') {
                    const currentRefundsCash = new Decimal(shift.totalRefundsCash);
                    const newRefundsCash = currentRefundsCash.plus(amountDecimal).toFixed(3);

                    // Recalculate expected cash: starting + sales - refunds
                    const startingCash = new Decimal(shift.startingCash);
                    const cashSales = new Decimal(shift.totalCashSales);
                    const expectedCash = startingCash.plus(cashSales).minus(newRefundsCash).toFixed(3);

                    updatedShift = {
                        ...shift,
                        totalRefundsCash: newRefundsCash,
                        expectedCash,
                        refundCount: shift.refundCount + 1,
                    };
                } else {
                    // Card/Digital refund
                    const currentRefundsCard = new Decimal(shift.totalRefundsCard);
                    const newRefundsCard = currentRefundsCard.plus(amountDecimal).toFixed(3);

                    updatedShift = {
                        ...shift,
                        totalRefundsCard: newRefundsCard,
                        refundCount: shift.refundCount + 1,
                    };
                }

                set({ currentShift: updatedShift });

                console.log('🔄 Refund Added:', {
                    amount,
                    type,
                    refundCount: updatedShift.refundCount,
                    expectedCash: updatedShift.expectedCash,
                });
            },

            /**
             * Get current shift
             * Returns null if no shift open
             */
            /**
             * Pay In - Add cash to drawer manually
             * Use case: Adding extra change, bank deposit return, etc.
             */
            payIn: (amount: string, reason: string) => {
                const shift = get().currentShift;

                if (!shift) {
                    console.warn('⚠️ No shift open - pay in not recorded');
                    return;
                }

                const amountDecimal = new Decimal(amount);
                const currentPayIn = new Decimal(shift.totalPayIn);
                const newPayIn = currentPayIn.plus(amountDecimal).toFixed(3);

                // Recalculate expected cash
                const startingCash = new Decimal(shift.startingCash);
                const cashSales = new Decimal(shift.totalCashSales);
                const refundsCash = new Decimal(shift.totalRefundsCash);
                const payOut = new Decimal(shift.totalPayOut);
                const expectedCash = startingCash.plus(cashSales).minus(refundsCash).plus(newPayIn).minus(payOut).toFixed(3);

                // Create transaction record
                const transaction: CashTransaction = {
                    id: `txn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    type: 'PAY_IN',
                    amount,
                    reason,
                    timestamp: new Date().toISOString(),
                };

                const updatedShift: Shift = {
                    ...shift,
                    totalPayIn: newPayIn,
                    expectedCash,
                    transactions: [...shift.transactions, transaction],
                };

                set({ currentShift: updatedShift });

                console.log('✅ Pay In recorded:', { amount, reason, newExpectedCash: expectedCash });
            },

            /**
             * Pay Out - Remove cash from drawer manually
             * Use case: Paying for supplies, petty cash, expenses, etc.
             */
            payOut: (amount: string, reason: string) => {
                const shift = get().currentShift;

                if (!shift) {
                    console.warn('⚠️ No shift open - pay out not recorded');
                    return;
                }

                const amountDecimal = new Decimal(amount);
                const currentPayOut = new Decimal(shift.totalPayOut);
                const newPayOut = currentPayOut.plus(amountDecimal).toFixed(3);

                // Recalculate expected cash
                const startingCash = new Decimal(shift.startingCash);
                const cashSales = new Decimal(shift.totalCashSales);
                const refundsCash = new Decimal(shift.totalRefundsCash);
                const payIn = new Decimal(shift.totalPayIn);
                const expectedCash = startingCash.plus(cashSales).minus(refundsCash).plus(payIn).minus(newPayOut).toFixed(3);

                // Create transaction record
                const transaction: CashTransaction = {
                    id: `txn-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    type: 'PAY_OUT',
                    amount,
                    reason,
                    timestamp: new Date().toISOString(),
                };

                const updatedShift: Shift = {
                    ...shift,
                    totalPayOut: newPayOut,
                    expectedCash,
                    transactions: [...shift.transactions, transaction],
                };

                set({ currentShift: updatedShift });

                console.log('✅ Pay Out recorded:', { amount, reason, newExpectedCash: expectedCash });
            },

            getCurrentShift: () => {
                return get().currentShift;
            },

            /**
             * Get transaction history for current shift
             * Returns empty array if no shift open
             */
            getTransactionHistory: () => {
                const shift = get().currentShift;
                return shift?.transactions || [];
            },
        }),
        {
            name: 'shift-storage', // localStorage key
            // Note: In production, should sync with backend API
        }
    )
);
