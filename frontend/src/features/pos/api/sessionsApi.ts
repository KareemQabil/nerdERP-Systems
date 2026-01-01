/**
 * Sessions RTK Query API
 * Handles cash register session management with caching
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithErrorHandling } from '@/lib/api/baseQuery';

// =============================================================================
// TYPES
// =============================================================================

export interface RegisterSession {
    id: string;
    deviceId: string;
    userId: string;
    storeId?: string;
    openingBalance: string;
    closingBalance?: string;
    expectedBalance?: string;
    discrepancy?: string;
    isOpen: boolean;
    openedAt: string;
    closedAt?: string;
    closedBy?: string;
    notes?: string;
}

export interface CreateSessionDto {
    deviceId: string;
    openingBalance: string;
    userId?: string;
    storeId?: string;
}

export interface CloseSessionDto {
    closingBalance: number;
    closedBy?: string;
    notes?: string;
}

export interface SessionBalance {
    openingBalance: string;
    cashSales: string;
    cashRefunds: string;
    dropsToSafe: string;
    pettyCash: string;
    expectedBalance: string;
}

export interface CashDropDto {
    amount: number;
    notes?: string;
}

export interface PettyCashDto {
    amount: number;
    reason: string;
}

// =============================================================================
// API DEFINITION
// =============================================================================

export const sessionsApi = createApi({
    reducerPath: 'sessionsApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Session', 'ActiveSession', 'SessionBalance'],
    endpoints: (builder) => ({
        /**
         * Open a new register session
         */
        openSession: builder.mutation<RegisterSession, CreateSessionDto>({
            query: (dto) => ({
                url: '/api/v1/cash/sessions/open',
                method: 'POST',
                body: dto,
            }),
            invalidatesTags: ['ActiveSession'],
        }),

        /**
         * Close an existing session
         */
        closeSession: builder.mutation<
            RegisterSession,
            { sessionId: string; dto: CloseSessionDto }
        >({
            query: ({ sessionId, dto }) => ({
                url: `/api/v1/cash/sessions/${sessionId}/close`,
                method: 'POST',
                body: dto,
            }),
            invalidatesTags: (_result, _error, { sessionId }) => [
                { type: 'Session', id: sessionId },
                'ActiveSession',
            ],
        }),

        /**
         * Get active session for a device
         */
        getActiveSession: builder.query<RegisterSession | null, string>({
            query: (deviceId) => `/api/v1/cash/sessions/active/${deviceId}`,
            providesTags: ['ActiveSession'],
            transformResponse: (response: RegisterSession | null) => response || null,
            transformErrorResponse: () => null, // Return null on error instead of throwing
        }),

        /**
         * Get session by ID
         */
        getSession: builder.query<RegisterSession, string>({
            query: (sessionId) => `/api/v1/cash/sessions/${sessionId}`,
            providesTags: (_result, _error, sessionId) => [
                { type: 'Session', id: sessionId },
            ],
        }),

        /**
         * Get calculated balance for session
         */
        getSessionBalance: builder.query<SessionBalance, string>({
            query: (sessionId) => `/api/v1/cash/sessions/${sessionId}/balance`,
            providesTags: (_result, _error, sessionId) => [
                { type: 'SessionBalance', id: sessionId },
            ],
        }),

        /**
         * Drop cash to safe
         */
        dropToSafe: builder.mutation<
            void,
            { sessionId: string; dto: CashDropDto }
        >({
            query: ({ sessionId, dto }) => ({
                url: `/api/v1/cash/sessions/${sessionId}/drop-to-safe`,
                method: 'POST',
                body: dto,
            }),
            invalidatesTags: (_result, _error, { sessionId }) => [
                { type: 'SessionBalance', id: sessionId },
                { type: 'Session', id: sessionId },
            ],
        }),

        /**
         * Record petty cash payout
         */
        recordPettyCash: builder.mutation<
            void,
            { sessionId: string; dto: PettyCashDto }
        >({
            query: ({ sessionId, dto }) => ({
                url: `/api/v1/cash/sessions/${sessionId}/petty-cash`,
                method: 'POST',
                body: dto,
            }),
            invalidatesTags: (_result, _error, { sessionId }) => [
                { type: 'SessionBalance', id: sessionId },
                { type: 'Session', id: sessionId },
            ],
        }),
    }),
});

// =============================================================================
// EXPORT HOOKS
// =============================================================================

export const {
    useOpenSessionMutation,
    useCloseSessionMutation,
    useGetActiveSessionQuery,
    useGetSessionQuery,
    useGetSessionBalanceQuery,
    useDropToSafeMutation,
    useRecordPettyCashMutation,
} = sessionsApi;
