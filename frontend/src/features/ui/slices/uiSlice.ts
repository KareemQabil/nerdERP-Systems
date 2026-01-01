/**
 * UI Redux Slice
 * Manages UI state: modals, toasts, loading states, panels
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

// =============================================================================
// TYPES
// =============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalConfig {
    /** Unique ID for this modal instance */
    id: string;
    /** Component name to render (from modal registry) */
    component: string;
    /** Props to pass to the modal component */
    props?: Record<string, unknown>;
    /** Modal size */
    size?: ModalSize;
    /** Whether the modal can be closed by clicking backdrop or ESC */
    closable?: boolean;
    /** Title for accessibility */
    title?: string;
    /** Timestamp when opened */
    openedAt: string;
}

export interface ToastConfig {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

export interface ConfirmDialogConfig {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    variant: 'danger' | 'warning' | 'info';
    /** Unique ID for tracking response */
    requestId: string;
}

// =============================================================================
// STATE INTERFACE
// =============================================================================

export interface UIState {
    // Modal stack (supports nested modals)
    modalStack: ModalConfig[];

    // Global loading
    globalLoading: boolean;
    loadingMessage: string | null;

    // Panels
    isSidebarExpanded: boolean;
    isCartExpanded: boolean;

    // Toasts
    toasts: ToastConfig[];

    // Confirmation dialog
    confirmDialog: ConfirmDialogConfig | null;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: UIState = {
    modalStack: [],
    globalLoading: false,
    loadingMessage: null,
    isSidebarExpanded: true,
    isCartExpanded: false,
    toasts: [],
    confirmDialog: null,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// =============================================================================
// SLICE
// =============================================================================

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        // =====================================================================
        // MODAL ACTIONS
        // =====================================================================

        /**
         * Open a modal
         */
        openModal: (state, action: PayloadAction<Omit<ModalConfig, 'id' | 'openedAt'>>) => {
            const modal: ModalConfig = {
                id: generateId('modal'),
                ...action.payload,
                closable: action.payload.closable ?? true,
                size: action.payload.size ?? 'md',
                openedAt: new Date().toISOString(),
            };
            state.modalStack.push(modal);
        },

        /**
         * Open a modal with a specific ID (for tracking)
         */
        openModalWithId: (state, action: PayloadAction<ModalConfig>) => {
            state.modalStack.push(action.payload);
        },

        /**
         * Close a specific modal or the topmost one
         */
        closeModal: (state, action: PayloadAction<string | undefined>) => {
            const id = action.payload;
            if (id) {
                state.modalStack = state.modalStack.filter((m) => m.id !== id);
            } else if (state.modalStack.length > 0) {
                const topModal = state.modalStack[state.modalStack.length - 1];
                if (topModal.closable) {
                    state.modalStack = state.modalStack.slice(0, -1);
                }
            }
        },

        /**
         * Close all modals
         */
        closeAllModals: (state) => {
            state.modalStack = [];
        },

        // =====================================================================
        // LOADING ACTIONS
        // =====================================================================

        /**
         * Set global loading state
         */
        setLoading: (state, action: PayloadAction<{ loading: boolean; message?: string }>) => {
            state.globalLoading = action.payload.loading;
            state.loadingMessage = action.payload.loading ? (action.payload.message ?? null) : null;
        },

        // =====================================================================
        // PANEL ACTIONS
        // =====================================================================

        /**
         * Toggle sidebar
         */
        toggleSidebar: (state) => {
            state.isSidebarExpanded = !state.isSidebarExpanded;
        },

        /**
         * Set sidebar state
         */
        setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
            state.isSidebarExpanded = action.payload;
        },

        /**
         * Toggle cart panel
         */
        toggleCart: (state) => {
            state.isCartExpanded = !state.isCartExpanded;
        },

        /**
         * Set cart panel state
         */
        setCartExpanded: (state, action: PayloadAction<boolean>) => {
            state.isCartExpanded = action.payload;
        },

        // =====================================================================
        // TOAST ACTIONS
        // =====================================================================

        /**
         * Show a toast notification
         */
        showToast: (state, action: PayloadAction<Omit<ToastConfig, 'id'>>) => {
            const toast: ToastConfig = {
                id: generateId('toast'),
                ...action.payload,
                duration: action.payload.duration ?? 5000,
            };
            state.toasts.push(toast);
        },

        /**
         * Show a toast with specific ID
         */
        showToastWithId: (state, action: PayloadAction<ToastConfig>) => {
            state.toasts.push(action.payload);
        },

        /**
         * Dismiss a toast
         */
        dismissToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter((t) => t.id !== action.payload);
        },

        /**
         * Clear all toasts
         */
        clearToasts: (state) => {
            state.toasts = [];
        },

        // =====================================================================
        // CONFIRMATION DIALOG
        // =====================================================================

        /**
         * Show confirmation dialog
         */
        showConfirmDialog: (
            state,
            action: PayloadAction<{
                title: string;
                message: string;
                confirmLabel?: string;
                cancelLabel?: string;
                variant?: 'danger' | 'warning' | 'info';
                requestId?: string;
            }>
        ) => {
            state.confirmDialog = {
                isOpen: true,
                title: action.payload.title,
                message: action.payload.message,
                confirmLabel: action.payload.confirmLabel ?? 'Confirm',
                cancelLabel: action.payload.cancelLabel ?? 'Cancel',
                variant: action.payload.variant ?? 'info',
                requestId: action.payload.requestId ?? generateId('confirm'),
            };
        },

        /**
         * Close confirmation dialog
         */
        closeConfirmDialog: (state) => {
            state.confirmDialog = null;
        },

        // =====================================================================
        // RESET
        // =====================================================================

        /**
         * Reset UI state
         */
        resetUI: () => initialState,
    },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
    openModal,
    openModalWithId,
    closeModal,
    closeAllModals,
    setLoading,
    toggleSidebar,
    setSidebarExpanded,
    toggleCart,
    setCartExpanded,
    showToast,
    showToastWithId,
    dismissToast,
    clearToasts,
    showConfirmDialog,
    closeConfirmDialog,
    resetUI,
} = uiSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectModalStack = (state: RootState) => state.ui.modalStack;
export const selectTopModal = (state: RootState) =>
    state.ui.modalStack[state.ui.modalStack.length - 1] ?? null;
export const selectHasOpenModals = (state: RootState) => state.ui.modalStack.length > 0;
export const selectIsModalOpen = (component: string) => (state: RootState) =>
    state.ui.modalStack.some((m) => m.component === component);
export const selectModal = (component: string) => (state: RootState) =>
    state.ui.modalStack.find((m) => m.component === component) ?? null;

export const selectIsLoading = (state: RootState) => state.ui.globalLoading;
export const selectLoadingMessage = (state: RootState) => state.ui.loadingMessage;

export const selectIsSidebarExpanded = (state: RootState) => state.ui.isSidebarExpanded;
export const selectIsCartExpanded = (state: RootState) => state.ui.isCartExpanded;

export const selectToasts = (state: RootState) => state.ui.toasts;
export const selectConfirmDialog = (state: RootState) => state.ui.confirmDialog;

// =============================================================================
// THUNKS (for async operations)
// =============================================================================

import { createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Show a toast and auto-dismiss after duration
 */
export const showToastWithAutoDismiss = createAsyncThunk(
    'ui/showToastWithAutoDismiss',
    async (config: Omit<ToastConfig, 'id'>, { dispatch }) => {
        const id = generateId('toast');
        const duration = config.duration ?? 5000;

        dispatch(showToastWithId({ ...config, id }));

        if (duration > 0) {
            await new Promise((resolve) => setTimeout(resolve, duration));
            dispatch(dismissToast(id));
        }

        return id;
    }
);

// =============================================================================
// TOAST HELPERS (for use outside of components)
// =============================================================================

import { store } from '@/app/store';

export const toast = {
    success: (message: string, duration?: number) =>
        store.dispatch(showToastWithAutoDismiss({ type: 'success', message, duration })),
    error: (message: string, duration?: number) =>
        store.dispatch(showToastWithAutoDismiss({ type: 'error', message, duration })),
    warning: (message: string, duration?: number) =>
        store.dispatch(showToastWithAutoDismiss({ type: 'warning', message, duration })),
    info: (message: string, duration?: number) =>
        store.dispatch(showToastWithAutoDismiss({ type: 'info', message, duration })),
};

// =============================================================================
// REDUCER
// =============================================================================

export default uiSlice.reducer;
