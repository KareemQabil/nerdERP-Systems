import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import Decimal from 'decimal.js';
import type { RegisterSession, RegisterSessionStatus } from '@/modules/cash/types/cash.types';
import { DecimalUtil } from '@/core/utils/decimal.utils';

/**
 * Register Store Interface
 * Manages cash register session state
 */
interface RegisterStore {
    // State
    currentSession: RegisterSession | null;
    isSessionOpen: boolean;

    // Actions
    openSession: (deviceId: string, userId: string, openingCash: string) => Promise<void>;
    closeSession: (closingCashActual: string, notes?: string) => Promise<void>;
    updateSessionBalance: (amount: string, type: 'cash' | 'card') => void;
    recordCashTransaction: (amount: string, reason: string, type: 'in' | 'out') => void;

    // Computed
    getExpectedCash: () => string;
    getCashDifference: (actualCash: string) => string;
    getSessionSummary: () => {
        totalSales: string;
        cashPayments: string;
        cardPayments: string;
        expectedCash: string;
        duration: number; // minutes
    };
}

/**
 * Register Store
 * CRITICAL: Must be open before creating orders
 * Tracks shift cash flow and sales
 */
export const useRegisterStore = create<RegisterStore>()(
    devtools(
        (set, get) => ({
            // Initial state
            currentSession: null,
            isSessionOpen: false,

            // Open new register session
            openSession: async (deviceId, userId, openingCash) => {
                try {
                    // Mock implementation
                    // In production: call CashApiService.openSession()

                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 300));

                    const newSession: RegisterSession = {
                        id: `session-${Date.now()}`,
                        sessionNumber: `SESS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
                        deviceId,
                        userId,
                        openedAt: new Date().toISOString(),
                        openingCash,
                        closingCashExpected: openingCash, // Initially same as opening
                        totalSales: '0.000',
                        totalRefunds: '0.000',
                        totalCashPayments: '0.000',
                        totalCardPayments: '0.000',
                        status: 'OPEN',
                    };

                    set({
                        currentSession: newSession,
                        isSessionOpen: true,
                    });
                } catch (error) {
                    throw new Error('Failed to open register session');
                }
            },

            // Close register session
            closeSession: async (closingCashActual, notes) => {
                const { currentSession } = get();
                if (!currentSession) {
                    throw new Error('No active session to close');
                }

                try {
                    // Calculate expected vs actual
                    const expected = new Decimal(currentSession.closingCashExpected);
                    const actual = new Decimal(closingCashActual);
                    const difference = actual.minus(expected);

                    // Determine status based on difference
                    let status: RegisterSessionStatus = 'CLOSED';
                    const absValue Difference = difference.abs();

                    // If difference > 5 SAR, mark as discrepancy
                    if (absDifference.greaterThan('5.000')) {
                        status = difference.isPositive()
                            ? 'DISCREPANCY_OVER'
                            : 'DISCREPANCY_UNDER';
                    }

                    const closedSession: RegisterSession = {
                        ...currentSession,
                        closedAt: new Date().toISOString(),
                        closingCashActual,
                        cashDifference: difference.toFixed(3),
                        status,
                        notes,
                    };

                    // Mock API call
                    await new Promise(resolve => setTimeout(resolve, 300));

                    set({
                        currentSession: closedSession,
                        isSessionOpen: false,
                    });
                } catch (error) {
                    throw new Error('Failed to close register session');
                }
            },

            // Update session balance (after payment)
            updateSessionBalance: (amount, type) => {
                const { currentSession } = get();
                if (!currentSession) return;

                const amountDecimal = new Decimal(amount);
                const currentSales = new Decimal(currentSession.totalSales);
                const newTotalSales = currentSales.plus(amountDecimal);

                let updatedSession: RegisterSession;

                if (type === 'cash') {
                    const currentCashPayments = new Decimal(currentSession.totalCashPayments);
                    const newCashPayments = currentCashPayments.plus(amountDecimal);

                    // Update expected closing cash
                    const openingCash = new Decimal(currentSession.openingCash);
                    const expectedCash = openingCash.plus(newCashPayments);

                    updatedSession = {
                        ...currentSession,
                        totalSales: newTotalSales.toFixed(3),
                        totalCashPayments: newCashPayments.toFixed(3),
                        closingCashExpected: expectedCash.toFixed(3),
                    };
                } else { // card
                    const currentCardPayments = new Decimal(currentSession.totalCardPayments);
                    const newCardPayments = currentCardPayments.plus(amountDecimal);

                    updatedSession = {
                        ...currentSession,
                        totalSales: newTotalSales.toFixed(3),
                        totalCardPayments: newCardPayments.toFixed(3),
                    };
                }

                set({ currentSession: updatedSession });
            },

            // Record cash transaction (petty cash in/out)
            recordCashTransaction: (amount, reason, type) => {
                const { currentSession } = get();
                if (!currentSession) return;

                const amountDecimal = new Decimal(amount);
                const currentExpected = new Decimal(currentSession.closingCashExpected);

                // Adjust expected cash based on transaction type
                const newExpected = type === 'in'
                    ? currentExpected.plus(amountDecimal)
                    : currentExpected.minus(amountDecimal);

                set({
                    currentSession: {
                        ...currentSession,
                        closingCashExpected: newExpected.toFixed(3),
                    },
                });
            },

            // Get expected cash amount
            getExpectedCash: () => {
                const { currentSession } = get();
                if (!currentSession) return '0.000';
                return currentSession.closingCashExpected;
            },

            // Calculate cash difference
            getCashDifference: (actualCash) => {
                const { currentSession } = get();
                if (!currentSession) return '0.000';

                const expected = new Decimal(currentSession.closingCashExpected);
                const actual = new Decimal(actualCash);
                const difference = actual.minus(expected);

                return difference.toFixed(3);
            },

            // Get session summary
            getSessionSummary: () => {
                const { currentSession } = get();
                if (!currentSession) {
                    return {
                        totalSales: '0.000',
                        cashPayments: '0.000',
                        cardPayments: '0.000',
                        expectedCash: '0.000',
                        duration: 0,
                    };
                }

                // Calculate session duration in minutes
                const openedAt = new Date(currentSession.openedAt);
                const now = new Date();
                const durationMs = now.getTime() - openedAt.getTime();
                const durationMinutes = Math.floor(durationMs / 60000);

                return {
                    totalSales: currentSession.totalSales,
                    cashPayments: currentSession.totalCashPayments,
                    cardPayments: currentSession.totalCardPayments,
                    expectedCash: currentSession.closingCashExpected,
                    duration: durationMinutes,
                };
            },
        }),
        { name: 'register-store' }
    )
);
