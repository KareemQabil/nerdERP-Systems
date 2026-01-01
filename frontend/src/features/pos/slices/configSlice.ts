/**
 * Config Redux Slice
 * Central configuration for feature flags, POS config, and organization settings
 * Ported from config.store.ts (Zustand)
 */

import { createSlice, createAsyncThunk, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type {
    FeatureFlags,
    POSConfig,
    Organization,
    Store,
    CustomFieldDefinition,
    WorkflowConfig,
} from '@/types/config.types';

// =============================================================================
// TYPES
// =============================================================================

interface ConfigState {
    organization: Organization | null;
    store: Store | null;
    features: FeatureFlags;
    posConfig: POSConfig;
    customFields: CustomFieldDefinition[];
    workflows: WorkflowConfig[];
    isLoaded: boolean;
    isLoading: boolean;
    lastSyncAt: string | null;
    error: string | null;
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
// INITIAL STATE
// =============================================================================

const initialState: ConfigState = {
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
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get nested value from object using dot notation path
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
// ASYNC THUNKS
// =============================================================================

/**
 * Load configuration from backend
 * This will be replaced with RTK Query in Phase 3, but kept for now
 */
export const loadConfig = createAsyncThunk(
    'config/loadConfig',
    async (_storeId: string, { rejectWithValue }) => {
        try {
            // This will use RTK Query in Phase 3
            // For now, use a placeholder that returns defaults
            // The actual API call will be: storeSettingsApi.useGetStoreConfigQuery(storeId)

            // Placeholder: In real implementation, this would fetch from backend
            const response = {
                organization: null,
                store: null,
                features: defaultFeatureFlags,
                posConfig: defaultPOSConfig,
                customFields: [],
                workflows: [],
            };

            return response;
        } catch (error) {
            return rejectWithValue('Failed to load configuration');
        }
    }
);

// =============================================================================
// SLICE
// =============================================================================

const configSlice = createSlice({
    name: 'config',
    initialState,
    reducers: {
        setFeature: (state, action: PayloadAction<{ path: string; enabled: boolean }>) => {
            state.features = setNestedValue(
                state.features,
                action.payload.path,
                action.payload.enabled
            );
        },

        setPOSConfig: (state, action: PayloadAction<Partial<POSConfig>>) => {
            state.posConfig = { ...state.posConfig, ...action.payload };
        },

        setStoreConfig: (
            state,
            action: PayloadAction<{
                organization?: Organization | null;
                store?: Store | null;
                features?: Partial<FeatureFlags>;
                posConfig?: Partial<POSConfig>;
                customFields?: CustomFieldDefinition[];
                workflows?: WorkflowConfig[];
            }>
        ) => {
            if (action.payload.organization !== undefined) {
                state.organization = action.payload.organization;
            }
            if (action.payload.store !== undefined) {
                state.store = action.payload.store;
            }
            if (action.payload.features) {
                state.features = { ...state.features, ...action.payload.features };
            }
            if (action.payload.posConfig) {
                state.posConfig = { ...state.posConfig, ...action.payload.posConfig };
            }
            if (action.payload.customFields) {
                state.customFields = action.payload.customFields;
            }
            if (action.payload.workflows) {
                state.workflows = action.payload.workflows;
            }
            state.lastSyncAt = new Date().toISOString();
        },

        reset: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadConfig.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loadConfig.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isLoaded = true;
                state.organization = action.payload.organization;
                state.store = action.payload.store;
                state.features = { ...defaultFeatureFlags, ...action.payload.features };
                state.posConfig = { ...defaultPOSConfig, ...action.payload.posConfig };
                state.customFields = action.payload.customFields || [];
                state.workflows = action.payload.workflows || [];
                state.lastSyncAt = new Date().toISOString();
            })
            .addCase(loadConfig.rejected, (state, action) => {
                state.isLoading = false;
                state.error = (action.payload as string) || 'Failed to load configuration';
                state.isLoaded = true; // Still mark as loaded to use defaults
            });
    },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const { setFeature, setPOSConfig, setStoreConfig, reset } = configSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

export const selectConfig = (state: RootState) => state.config;
export const selectFeatures = (state: RootState) => state.config.features;
export const selectPOSConfig = (state: RootState) => state.config.posConfig;
export const selectOrganization = (state: RootState) => state.config.organization;
export const selectStore = (state: RootState) => state.config.store;
export const selectCustomFields = (state: RootState) => state.config.customFields;
export const selectWorkflows = (state: RootState) => state.config.workflows;
export const selectIsLoaded = (state: RootState) => state.config.isLoaded;
export const selectLastSyncAt = (state: RootState) => state.config.lastSyncAt;

/**
 * Get feature flag value by path (dot notation)
 * e.g., 'pos.holdOrders' or 'modules.kitchen'
 */
export const selectFeature = (path: string) =>
    createSelector([selectFeatures], (features) => {
        const value = getNestedValue(features, path);
        return typeof value === 'boolean' ? value : false;
    });

/**
 * Get POS config value by key
 */
export const selectPOSConfigValue = <K extends keyof POSConfig>(key: K) =>
    createSelector([selectPOSConfig], (posConfig) => posConfig[key]);

/**
 * Get custom fields for a specific entity
 */
export const selectCustomFieldsByEntity = (entity: string) =>
    createSelector([selectCustomFields], (customFields) =>
        customFields.filter((f) => f.entity === entity)
    );

/**
 * Get workflow by type
 */
export const selectWorkflowByType = (type: string) =>
    createSelector([selectWorkflows], (workflows) =>
        workflows.find((w) => w.type === type && w.isActive) ?? null
    );

// =============================================================================
// REDUCER
// =============================================================================

export default configSlice.reducer;
