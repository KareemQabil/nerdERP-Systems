/**
 * Configuration Store
 * Central store for feature flags, POS config, and organization settings
 * Loads from backend and persists locally for offline access
 */
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import type {
    FeatureFlags,
    POSConfig,
    Organization,
    Store,
    CustomFieldDefinition,
    WorkflowConfig,
    DEFAULT_FEATURE_FLAGS,
    DEFAULT_POS_CONFIG,
} from '@/types/config.types';

// =============================================================================
// STATE INTERFACE
// =============================================================================

interface ConfigState {
    // Organization & Store
    organization: Organization | null;
    store: Store | null;

    // Feature Configuration
    features: FeatureFlags;
    posConfig: POSConfig;

    // Dynamic Configuration
    customFields: CustomFieldDefinition[];
    workflows: WorkflowConfig[];

    // State
    isLoaded: boolean;
    isLoading: boolean;
    lastSyncAt: string | null;
    error: string | null;

    // =========================================================================
    // ACTIONS
    // =========================================================================

    // Load configuration from backend
    loadConfig: (storeId: string) => Promise<void>;

    // Refresh config from server
    refreshConfig: () => Promise<void>;

    // Feature access
    getFeature: (path: string) => boolean;
    setFeature: (path: string, enabled: boolean) => void;

    // POS config access
    getPOSConfig: <K extends keyof POSConfig>(key: K) => POSConfig[K];
    setPOSConfig: (updates: Partial<POSConfig>) => void;

    // Custom fields
    getCustomFields: (entity: string) => CustomFieldDefinition[];

    // Workflows
    getWorkflow: (type: string) => WorkflowConfig | null;

    // Reset
    reset: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get nested value from object using dot notation path
 * e.g., getNestedValue(obj, 'pos.holdOrders')
 */
function getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
        if (current && typeof current === 'object' && key in current) {
            return (current as Record<string, unknown>)[key];
        }
        return undefined;
    }, obj);
}

/**
 * Set nested value in object using dot notation path
 */
function setNestedValue<T>(obj: T, path: string, value: unknown): T {
    const keys = path.split('.');
    const result = JSON.parse(JSON.stringify(obj)) as T;
    let current: Record<string, unknown> = result as Record<string, unknown>;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    return result;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const defaultFeatureFlags: FeatureFlags = {
    modules: {
        pos: true,
        inventory: true,
        kitchen: false,
        customers: true,
        reports: true,
        settings: true,
    },
    pos: {
        dineIn: true,
        takeaway: true,
        delivery: false,
        pickup: false,
        driveThru: false,
        holdOrders: true,
        mergeOrders: false,
        splitOrders: false,
        transferOrders: false,
        splitPayments: true,
        partialPayments: false,
        tipCollection: false,
        kitchenRouting: false,
        courseManagement: false,
        rushOrders: false,
        tableSideOrdering: false,
        customerDisplay: false,
        qrOrdering: false,
    },
    customers: {
        search: true,
        quickCreate: true,
        loyaltyProgram: false,
        storeCredit: false,
        giftCards: false,
        reservations: false,
        feedback: false,
    },
    inventory: {
        stockTracking: true,
        batchTracking: false,
        expiryTracking: false,
        lowStockAlerts: true,
        autoReorder: false,
        recipeManagement: false,
        wastageTracking: false,
    },
    security: {
        managerPin: true,
        shiftManagement: true,
        cashDrawerControl: false,
        blindCloseout: false,
        zatcaCompliance: true,
        auditTrail: true,
    },
    integrations: {
        onlineOrdering: false,
        deliveryPartners: false,
        accounting: false,
        paymentTerminals: false,
        printers: true,
        scales: false,
    },
};

const defaultPOSConfig: POSConfig = {
    enabledOrderTypes: ['TAKEAWAY', 'DINE_IN'],
    defaultOrderType: 'TAKEAWAY',
    enabledPaymentMethods: ['CASH', 'CARD'],
    taxRate: '15.000',
    taxIncluded: false,
    currency: 'SAR',
    currencySymbol: 'ر.س',
    currencyPosition: 'after',
    decimalPlaces: 3,
    requirePinFor: ['DISCOUNT', 'VOID', 'REFUND'],
    sessionTimeout: 30,
    showStockLevels: true,
    lowStockThreshold: 5,
    compactCartMode: false,
    maxDiscountPercent: 100,
    maxRefundWithoutAuth: '0.000',
};

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useConfigStore = create<ConfigState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                organization: null,
                store: null,
                features: defaultFeatureFlags,
                posConfig: defaultPOSConfig,
                customFields: [],
                workflows: [],
                isLoaded: false,
                isLoading: false,
                lastSyncAt: null,
                error: null,

                // =============================================================
                // LOAD CONFIG FROM BACKEND
                // =============================================================

                loadConfig: async (storeId: string) => {
                    set({ isLoading: true, error: null });

                    try {
                        // Fetch store configuration from backend
                        const response = await apiClient.get(`/stores/${storeId}/config`);
                        const data = response.data.data;

                        set({
                            organization: data.organization,
                            store: data.store,
                            features: { ...defaultFeatureFlags, ...data.features },
                            posConfig: { ...defaultPOSConfig, ...data.posConfig },
                            customFields: data.customFields || [],
                            workflows: data.workflows || [],
                            isLoaded: true,
                            isLoading: false,
                            lastSyncAt: new Date().toISOString(),
                        });
                    } catch (error) {
                        console.error('Failed to load config:', error);
                        set({
                            isLoading: false,
                            error: 'Failed to load configuration',
                            // Keep using defaults/cached values
                            isLoaded: true,
                        });
                    }
                },

                // =============================================================
                // REFRESH CONFIG
                // =============================================================

                refreshConfig: async () => {
                    const { store } = get();
                    if (store?.id) {
                        await get().loadConfig(store.id);
                    }
                },

                // =============================================================
                // FEATURE ACCESS
                // =============================================================

                getFeature: (path: string): boolean => {
                    const value = getNestedValue(get().features, path);
                    return typeof value === 'boolean' ? value : false;
                },

                setFeature: (path: string, enabled: boolean) => {
                    set((state) => ({
                        features: setNestedValue(state.features, path, enabled),
                    }));

                    // TODO: Sync to backend
                    // apiClient.patch(`/stores/${get().store?.id}/features`, { [path]: enabled });
                },

                // =============================================================
                // POS CONFIG ACCESS
                // =============================================================

                getPOSConfig: <K extends keyof POSConfig>(key: K): POSConfig[K] => {
                    return get().posConfig[key];
                },

                setPOSConfig: (updates: Partial<POSConfig>) => {
                    set((state) => ({
                        posConfig: { ...state.posConfig, ...updates },
                    }));

                    // TODO: Sync to backend
                },

                // =============================================================
                // CUSTOM FIELDS
                // =============================================================

                getCustomFields: (entity: string): CustomFieldDefinition[] => {
                    return get().customFields.filter(
                        (f) => f.entity === entity
                    );
                },

                // =============================================================
                // WORKFLOWS
                // =============================================================

                getWorkflow: (type: string): WorkflowConfig | null => {
                    return get().workflows.find((w) => w.type === type && w.isActive) ?? null;
                },

                // =============================================================
                // RESET
                // =============================================================

                reset: () => {
                    set({
                        organization: null,
                        store: null,
                        features: defaultFeatureFlags,
                        posConfig: defaultPOSConfig,
                        customFields: [],
                        workflows: [],
                        isLoaded: false,
                        isLoading: false,
                        lastSyncAt: null,
                        error: null,
                    });
                },
            }),
            {
                name: 'nerdpos-config',
                partialize: (state) => ({
                    // Persist everything for offline access
                    organization: state.organization,
                    store: state.store,
                    features: state.features,
                    posConfig: state.posConfig,
                    customFields: state.customFields,
                    workflows: state.workflows,
                    lastSyncAt: state.lastSyncAt,
                }),
            }
        ),
        { name: 'ConfigStore' }
    )
);

// =============================================================================
// SELECTORS (for performance optimization)
// =============================================================================

export const selectFeature = (path: string) => (state: ConfigState) =>
    getNestedValue(state.features, path) === true;

export const selectPOSConfig = <K extends keyof POSConfig>(key: K) =>
    (state: ConfigState) => state.posConfig[key];

export const selectIsLoaded = (state: ConfigState) => state.isLoaded;

export const selectStore = (state: ConfigState) => state.store;

export const selectOrganization = (state: ConfigState) => state.organization;
