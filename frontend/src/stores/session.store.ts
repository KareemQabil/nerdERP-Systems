/**
 * Register Session Store
 * Manages the current cash register session state
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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

interface SessionState {
    // Session data
    session: RegisterSession | null;
    deviceId: string;
    warehouseId: string;

    // Loading states
    isLoading: boolean;
    isOpening: boolean;
    isClosing: boolean;
    error: string | null;

    // Actions
    initializeSession: () => Promise<void>;
    openSession: (openingBalance: number, userId?: string) => Promise<RegisterSession>;
    closeSession: (closingBalance: number, notes?: string) => Promise<void>;
    refreshSession: () => Promise<void>;
    clearError: () => void;

    // Getters
    isSessionOpen: () => boolean;
    getSessionId: () => string | null;
    getWarehouseId: () => string;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useSessionStore = create<SessionState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                session: null,
                deviceId: DEFAULT_DEVICE_ID,
                warehouseId: DEFAULT_WAREHOUSE_ID,
                isLoading: false,
                isOpening: false,
                isClosing: false,
                error: null,

                /**
                 * Initialize session on app load
                 * Checks if there's an active session for this device
                 */
                initializeSession: async () => {
                    const { deviceId } = get();
                    set({ isLoading: true, error: null });

                    try {
                        const session = await registerSessionService.getActiveSession(deviceId);
                        set({ session, isLoading: false });
                    } catch (error) {
                        console.error('[Session] Failed to initialize:', error);
                        set({
                            session: null,
                            isLoading: false,
                            error: 'Failed to check session status'
                        });
                    }
                },

                /**
                 * Open a new register session
                 */
                openSession: async (openingBalance: number, userId?: string) => {
                    const { deviceId } = get();
                    set({ isOpening: true, error: null });

                    try {
                        const session = await registerSessionService.openSession({
                            deviceId,
                            openingBalance: openingBalance.toString(), // Backend expects string
                            userId: userId || 'default-cashier',
                            storeId: DEFAULT_STORE_ID,
                        });
                        set({ session, isOpening: false });
                        return session;
                    } catch (error) {
                        console.error('[Session] Failed to open:', error);
                        set({
                            isOpening: false,
                            error: 'Failed to open session'
                        });
                        throw error;
                    }
                },

                /**
                 * Close the current session
                 */
                closeSession: async (closingBalance: number, notes?: string) => {
                    const { session } = get();
                    if (!session) {
                        throw new Error('No active session to close');
                    }

                    set({ isClosing: true, error: null });

                    try {
                        await registerSessionService.closeSession(session.id, {
                            closingBalance,
                            notes,
                        });
                        set({ session: null, isClosing: false });
                    } catch (error) {
                        console.error('[Session] Failed to close:', error);
                        set({
                            isClosing: false,
                            error: 'Failed to close session'
                        });
                        throw error;
                    }
                },

                /**
                 * Refresh session data from server
                 */
                refreshSession: async () => {
                    const { session } = get();
                    if (!session) return;

                    try {
                        const updated = await registerSessionService.getSession(session.id);
                        set({ session: updated });
                    } catch (error) {
                        console.error('[Session] Failed to refresh:', error);
                    }
                },

                /**
                 * Clear error state
                 */
                clearError: () => set({ error: null }),

                /**
                 * Check if session is open
                 */
                isSessionOpen: () => {
                    const { session } = get();
                    return session !== null && session.isOpen;
                },

                /**
                 * Get current session ID
                 */
                getSessionId: () => {
                    const { session } = get();
                    return session?.id || null;
                },

                /**
                 * Get warehouse ID for inventory operations
                 */
                getWarehouseId: () => {
                    return get().warehouseId;
                },
            }),
            {
                name: 'nerdpos-session',
                partialize: (state) => ({
                    deviceId: state.deviceId,
                    warehouseId: state.warehouseId,
                    // Don't persist session - always check on load
                }),
            }
        ),
        { name: 'SessionStore' }
    )
);

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook for components that need session context
 */
export function useSession() {
    const session = useSessionStore((s) => s.session);
    const isLoading = useSessionStore((s) => s.isLoading);
    const error = useSessionStore((s) => s.error);
    const isSessionOpen = useSessionStore((s) => s.isSessionOpen);
    const getSessionId = useSessionStore((s) => s.getSessionId);
    const getWarehouseId = useSessionStore((s) => s.getWarehouseId);
    const openSession = useSessionStore((s) => s.openSession);
    const closeSession = useSessionStore((s) => s.closeSession);
    const initializeSession = useSessionStore((s) => s.initializeSession);

    return {
        session,
        isLoading,
        error,
        isOpen: isSessionOpen(),
        sessionId: getSessionId(),
        warehouseId: getWarehouseId(),
        openSession,
        closeSession,
        initializeSession,
    };
}
