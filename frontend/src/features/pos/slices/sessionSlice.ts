/**
 * Session Redux Slice
 * Manages register session state
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { registerSessionService, type RegisterSession } from '@/services/session.service';

// =============================================================================
// CONSTANTS
// =============================================================================

// MVP: Use seeded device UUID (from devices table)
const DEFAULT_DEVICE_ID = '6a477384-24a6-427c-a961-44e1940cddc1'; // POS Terminal 1
const DEFAULT_WAREHOUSE_ID = '001bfc5f-33b6-4135-ab0a-80ba0bfefcd5'; // Main Warehouse
const DEFAULT_STORE_ID = '9c8370cd-44ee-4999-aecf-72c4b490ec2f'; // Default Store

// =============================================================================
// TYPES
// =============================================================================

export interface SessionState {
    session: RegisterSession | null;
    deviceId: string;
    warehouseId: string;
    isLoading: boolean;
    isOpening: boolean;
    isClosing: boolean;
    error: string | null;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: SessionState = {
    session: null,
    deviceId: DEFAULT_DEVICE_ID,
    warehouseId: DEFAULT_WAREHOUSE_ID,
    isLoading: false,
    isOpening: false,
    isClosing: false,
    error: null,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

/**
 * Initialize session on app load
 */
export const initializeSession = createAsyncThunk<
    RegisterSession | null,
    void,
    { state: RootState; rejectValue: string }
>('session/initialize', async (_, { getState, rejectWithValue }) => {
    const { deviceId } = getState().session;

    try {
        const session = await registerSessionService.getActiveSession(deviceId);
        return session;
    } catch (error) {
        console.error('[Session] Failed to initialize:', error);
        return rejectWithValue('Failed to check session status');
    }
});

/**
 * Open a new register session
 */
export const openSession = createAsyncThunk<
    RegisterSession,
    { openingBalance: number; userId?: string },
    { state: RootState; rejectValue: string }
>('session/open', async ({ openingBalance, userId }, { getState, rejectWithValue }) => {
    const { deviceId } = getState().session;

    try {
        const session = await registerSessionService.openSession({
            deviceId,
            openingBalance: openingBalance.toString(),
            userId: userId || 'default-cashier',
            storeId: DEFAULT_STORE_ID,
        });
        return session;
    } catch (error) {
        console.error('[Session] Failed to open:', error);
        return rejectWithValue('Failed to open session');
    }
});

/**
 * Close the current session
 */
export const closeSession = createAsyncThunk<
    void,
    { closingBalance: number; notes?: string },
    { state: RootState; rejectValue: string }
>('session/close', async ({ closingBalance, notes }, { getState, rejectWithValue }) => {
    const { session } = getState().session;

    if (!session) {
        return rejectWithValue('No active session to close');
    }

    try {
        await registerSessionService.closeSession(session.id, {
            closingBalance,
            notes,
        });
    } catch (error) {
        console.error('[Session] Failed to close:', error);
        return rejectWithValue('Failed to close session');
    }
});

/**
 * Refresh session data from server
 */
export const refreshSession = createAsyncThunk<
    RegisterSession | null,
    void,
    { state: RootState; rejectValue: string }
>('session/refresh', async (_, { getState, rejectWithValue }) => {
    const { session } = getState().session;

    if (!session) {
        return null;
    }

    try {
        const updated = await registerSessionService.getSession(session.id);
        return updated;
    } catch (error) {
        console.error('[Session] Failed to refresh:', error);
        return rejectWithValue('Failed to refresh session');
    }
});

// =============================================================================
// SLICE
// =============================================================================

const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        /**
         * Clear error state
         */
        clearError: (state) => {
            state.error = null;
        },

        /**
         * Set device ID
         */
        setDeviceId: (state, action: PayloadAction<string>) => {
            state.deviceId = action.payload;
        },

        /**
         * Set warehouse ID
         */
        setWarehouseId: (state, action: PayloadAction<string>) => {
            state.warehouseId = action.payload;
        },

        /**
         * Reset session state
         */
        resetSession: () => initialState,
    },
    extraReducers: (builder) => {
        // Initialize session
        builder
            .addCase(initializeSession.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(initializeSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.session = action.payload;
            })
            .addCase(initializeSession.rejected, (state, action) => {
                state.isLoading = false;
                state.session = null;
                state.error = action.payload ?? 'Failed to initialize session';
            });

        // Open session
        builder
            .addCase(openSession.pending, (state) => {
                state.isOpening = true;
                state.error = null;
            })
            .addCase(openSession.fulfilled, (state, action) => {
                state.isOpening = false;
                state.session = action.payload;
            })
            .addCase(openSession.rejected, (state, action) => {
                state.isOpening = false;
                state.error = action.payload ?? 'Failed to open session';
            });

        // Close session
        builder
            .addCase(closeSession.pending, (state) => {
                state.isClosing = true;
                state.error = null;
            })
            .addCase(closeSession.fulfilled, (state) => {
                state.isClosing = false;
                state.session = null;
            })
            .addCase(closeSession.rejected, (state, action) => {
                state.isClosing = false;
                state.error = action.payload ?? 'Failed to close session';
            });

        // Refresh session
        builder
            .addCase(refreshSession.fulfilled, (state, action) => {
                if (action.payload) {
                    state.session = action.payload;
                }
            });
    },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const { clearError, setDeviceId, setWarehouseId, resetSession } = sessionSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectSession = (state: RootState) => state.session.session;
export const selectDeviceId = (state: RootState) => state.session.deviceId;
export const selectWarehouseId = (state: RootState) => state.session.warehouseId;
export const selectIsLoading = (state: RootState) => state.session.isLoading;
export const selectIsOpening = (state: RootState) => state.session.isOpening;
export const selectIsClosing = (state: RootState) => state.session.isClosing;
export const selectSessionError = (state: RootState) => state.session.error;

export const selectIsSessionOpen = (state: RootState): boolean => {
    const session = state.session.session;
    return session !== null && session.isOpen;
};

export const selectSessionId = (state: RootState): string | null => {
    return state.session.session?.id ?? null;
};

// =============================================================================
// REDUCER
// =============================================================================

export default sessionSlice.reducer;
