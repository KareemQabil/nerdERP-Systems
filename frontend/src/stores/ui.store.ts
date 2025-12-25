/**
 * UI Store
 * Centralized UI state management for modals, loading states, and panels
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
    /** Callback when modal is closed */
    onClose?: () => void;
    /** Title for accessibility */
    title?: string;
}

export interface ModalInstance extends ModalConfig {
    openedAt: string;
}

export interface ToastConfig {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface UIState {
    // Modal stack (supports nested modals)
    modalStack: ModalInstance[];

    // Global loading
    globalLoading: boolean;
    loadingMessage: string | null;

    // Panels
    isSidebarExpanded: boolean;
    isCartExpanded: boolean;

    // Toasts
    toasts: ToastConfig[];

    // Confirmation dialog
    confirmDialog: {
        isOpen: boolean;
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: 'danger' | 'warning' | 'info';
        onConfirm?: () => void;
        onCancel?: () => void;
    } | null;

    // =========================================================================
    // MODAL ACTIONS
    // =========================================================================

    /** Open a modal, returns the modal ID */
    openModal: (config: Omit<ModalConfig, 'id'>) => string;

    /** Close a specific modal or the topmost one */
    closeModal: (id?: string) => void;

    /** Close all modals */
    closeAllModals: () => void;

    /** Check if a specific modal is open */
    isModalOpen: (component: string) => boolean;

    /** Get modal by component name */
    getModal: (component: string) => ModalInstance | null;

    // =========================================================================
    // LOADING ACTIONS
    // =========================================================================

    /** Set global loading state */
    setLoading: (loading: boolean, message?: string) => void;

    // =========================================================================
    // PANEL ACTIONS
    // =========================================================================

    /** Toggle sidebar */
    toggleSidebar: () => void;

    /** Set sidebar state */
    setSidebarExpanded: (expanded: boolean) => void;

    /** Toggle cart panel */
    toggleCart: () => void;

    /** Set cart panel state */
    setCartExpanded: (expanded: boolean) => void;

    // =========================================================================
    // TOAST ACTIONS
    // =========================================================================

    /** Show a toast notification */
    showToast: (config: Omit<ToastConfig, 'id'>) => string;

    /** Dismiss a toast */
    dismissToast: (id: string) => void;

    /** Clear all toasts */
    clearToasts: () => void;

    // =========================================================================
    // CONFIRMATION DIALOG
    // =========================================================================

    /** Show confirmation dialog */
    confirm: (config: {
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        variant?: 'danger' | 'warning' | 'info';
    }) => Promise<boolean>;

    /** Close confirmation dialog */
    closeConfirm: () => void;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useUIStore = create<UIState>()(
    devtools(
        (set, get) => ({
            // Initial state
            modalStack: [],
            globalLoading: false,
            loadingMessage: null,
            isSidebarExpanded: true,
            isCartExpanded: false,
            toasts: [],
            confirmDialog: null,

            // =============================================================
            // MODAL ACTIONS
            // =============================================================

            openModal: (config) => {
                const id = `modal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                const instance: ModalInstance = {
                    id,
                    ...config,
                    closable: config.closable ?? true,
                    size: config.size ?? 'md',
                    openedAt: new Date().toISOString(),
                };

                set((state) => ({
                    modalStack: [...state.modalStack, instance],
                }));

                return id;
            },

            closeModal: (id?: string) => {
                const { modalStack } = get();

                if (id) {
                    // Close specific modal
                    const modal = modalStack.find((m) => m.id === id);
                    if (modal?.onClose) {
                        modal.onClose();
                    }
                    set((state) => ({
                        modalStack: state.modalStack.filter((m) => m.id !== id),
                    }));
                } else if (modalStack.length > 0) {
                    // Close topmost modal
                    const topModal = modalStack[modalStack.length - 1];
                    if (topModal.closable) {
                        if (topModal.onClose) {
                            topModal.onClose();
                        }
                        set((state) => ({
                            modalStack: state.modalStack.slice(0, -1),
                        }));
                    }
                }
            },

            closeAllModals: () => {
                const { modalStack } = get();
                modalStack.forEach((modal) => {
                    if (modal.onClose) {
                        modal.onClose();
                    }
                });
                set({ modalStack: [] });
            },

            isModalOpen: (component: string) => {
                return get().modalStack.some((m) => m.component === component);
            },

            getModal: (component: string) => {
                return get().modalStack.find((m) => m.component === component) ?? null;
            },

            // =============================================================
            // LOADING ACTIONS
            // =============================================================

            setLoading: (loading: boolean, message?: string) => {
                set({
                    globalLoading: loading,
                    loadingMessage: loading ? message ?? null : null,
                });
            },

            // =============================================================
            // PANEL ACTIONS
            // =============================================================

            toggleSidebar: () => {
                set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded }));
            },

            setSidebarExpanded: (expanded: boolean) => {
                set({ isSidebarExpanded: expanded });
            },

            toggleCart: () => {
                set((state) => ({ isCartExpanded: !state.isCartExpanded }));
            },

            setCartExpanded: (expanded: boolean) => {
                set({ isCartExpanded: expanded });
            },

            // =============================================================
            // TOAST ACTIONS
            // =============================================================

            showToast: (config) => {
                const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
                const toast: ToastConfig = {
                    id,
                    ...config,
                    duration: config.duration ?? 5000,
                };

                set((state) => ({
                    toasts: [...state.toasts, toast],
                }));

                // Auto-dismiss after duration
                if (toast.duration && toast.duration > 0) {
                    setTimeout(() => {
                        get().dismissToast(id);
                    }, toast.duration);
                }

                return id;
            },

            dismissToast: (id: string) => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id),
                }));
            },

            clearToasts: () => {
                set({ toasts: [] });
            },

            // =============================================================
            // CONFIRMATION DIALOG
            // =============================================================

            confirm: (config) => {
                return new Promise<boolean>((resolve) => {
                    set({
                        confirmDialog: {
                            isOpen: true,
                            title: config.title,
                            message: config.message,
                            confirmLabel: config.confirmLabel ?? 'Confirm',
                            cancelLabel: config.cancelLabel ?? 'Cancel',
                            variant: config.variant ?? 'info',
                            onConfirm: () => {
                                set({ confirmDialog: null });
                                resolve(true);
                            },
                            onCancel: () => {
                                set({ confirmDialog: null });
                                resolve(false);
                            },
                        },
                    });
                });
            },

            closeConfirm: () => {
                const { confirmDialog } = get();
                if (confirmDialog?.onCancel) {
                    confirmDialog.onCancel();
                }
                set({ confirmDialog: null });
            },
        }),
        { name: 'UIStore' }
    )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectModalStack = (state: UIState) => state.modalStack;
export const selectTopModal = (state: UIState) => state.modalStack[state.modalStack.length - 1] ?? null;
export const selectHasOpenModals = (state: UIState) => state.modalStack.length > 0;
export const selectIsLoading = (state: UIState) => state.globalLoading;
export const selectToasts = (state: UIState) => state.toasts;
export const selectConfirmDialog = (state: UIState) => state.confirmDialog;

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/** Quick toast helpers */
export const toast = {
    success: (message: string) => useUIStore.getState().showToast({ type: 'success', message }),
    error: (message: string) => useUIStore.getState().showToast({ type: 'error', message }),
    warning: (message: string) => useUIStore.getState().showToast({ type: 'warning', message }),
    info: (message: string) => useUIStore.getState().showToast({ type: 'info', message }),
};

/** Quick modal openers */
export const openModal = (component: string, props?: Record<string, unknown>, size?: ModalSize) =>
    useUIStore.getState().openModal({ component, props, size });

export const closeModal = (id?: string) => useUIStore.getState().closeModal(id);

/** Quick confirm dialog */
export const confirm = useUIStore.getState().confirm;
