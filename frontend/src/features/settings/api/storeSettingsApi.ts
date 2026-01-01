/**
 * Store Settings RTK Query API
 * Handles store configuration, feature flags, and settings management
 */

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithErrorHandling } from '@/lib/api/baseQuery';
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

export interface StoreConfig {
    organization: Organization;
    store: Store;
    features: FeatureFlags;
    posConfig: POSConfig;
    customFields: CustomFieldDefinition[];
    workflows: WorkflowConfig[];
}

export interface PaymentMethodConfig {
    id: string;
    code: string;
    name: string;
    nameAr: string;
    isActive: boolean;
    requiresReference: boolean;
    icon?: string;
    sortOrder: number;
}

export interface TaxProfile {
    id: string;
    name: string;
    nameAr: string;
    rate: string;
    isDefault: boolean;
    isInclusive: boolean;
}

export interface PrinterConfig {
    id: string;
    name: string;
    type: 'RECEIPT' | 'KITCHEN' | 'LABEL';
    ipAddress?: string;
    port?: number;
    isDefault: boolean;
    isActive: boolean;
}

export interface PrinterTestResult {
    success: boolean;
    message: string;
}

// =============================================================================
// API DEFINITION
// =============================================================================

export const storeSettingsApi = createApi({
    reducerPath: 'storeSettingsApi',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: [
        'StoreConfig',
        'Features',
        'POSConfig',
        'PaymentMethods',
        'TaxProfiles',
        'Printers',
        'CustomFields',
        'Workflows',
    ],
    endpoints: (builder) => ({
        // =====================================================================
        // STORE CONFIGURATION
        // =====================================================================

        /**
         * Get complete store configuration
         */
        getStoreConfig: builder.query<StoreConfig, string>({
            query: (storeId) => `/api/v1/stores/${storeId}/config`,
            providesTags: ['StoreConfig'],
        }),

        /**
         * Update store configuration
         */
        updateStoreConfig: builder.mutation<
            StoreConfig,
            { storeId: string; config: Partial<StoreConfig> }
        >({
            query: ({ storeId, config }) => ({
                url: `/api/v1/stores/${storeId}/config`,
                method: 'PATCH',
                body: config,
            }),
            invalidatesTags: ['StoreConfig'],
        }),

        // =====================================================================
        // FEATURE FLAGS
        // =====================================================================

        /**
         * Get feature flags
         */
        getFeatures: builder.query<FeatureFlags, string>({
            query: (storeId) => `/api/v1/stores/${storeId}/features`,
            providesTags: ['Features'],
        }),

        /**
         * Update feature flags
         */
        updateFeatures: builder.mutation<
            FeatureFlags,
            { storeId: string; features: Partial<FeatureFlags> }
        >({
            query: ({ storeId, features }) => ({
                url: `/api/v1/stores/${storeId}/features`,
                method: 'PATCH',
                body: features,
            }),
            invalidatesTags: ['Features', 'StoreConfig'],
        }),

        // =====================================================================
        // POS CONFIG
        // =====================================================================

        /**
         * Get POS configuration
         */
        getPOSConfig: builder.query<POSConfig, string>({
            query: (storeId) => `/api/v1/stores/${storeId}/pos-config`,
            providesTags: ['POSConfig'],
        }),

        /**
         * Update POS configuration
         */
        updatePOSConfig: builder.mutation<
            POSConfig,
            { storeId: string; config: Partial<POSConfig> }
        >({
            query: ({ storeId, config }) => ({
                url: `/api/v1/stores/${storeId}/pos-config`,
                method: 'PATCH',
                body: config,
            }),
            invalidatesTags: ['POSConfig', 'StoreConfig'],
        }),

        // =====================================================================
        // PAYMENT METHODS
        // =====================================================================

        /**
         * Get available payment methods
         */
        getPaymentMethods: builder.query<PaymentMethodConfig[], string>({
            query: (storeId) => `/api/v1/stores/${storeId}/payment-methods`,
            providesTags: ['PaymentMethods'],
        }),

        /**
         * Update payment method status
         */
        updatePaymentMethod: builder.mutation<
            PaymentMethodConfig,
            { storeId: string; methodId: string; isActive: boolean }
        >({
            query: ({ storeId, methodId, isActive }) => ({
                url: `/api/v1/stores/${storeId}/payment-methods/${methodId}`,
                method: 'PATCH',
                body: { isActive },
            }),
            invalidatesTags: ['PaymentMethods'],
        }),

        // =====================================================================
        // TAX PROFILES
        // =====================================================================

        /**
         * Get tax profiles
         */
        getTaxProfiles: builder.query<TaxProfile[], string>({
            query: () => `/api/v1/organization/tax-profiles`,
            providesTags: ['TaxProfiles'],
        }),

        /**
         * Get default tax profile
         */
        getDefaultTaxProfile: builder.query<TaxProfile | null, string>({
            query: () => `/api/v1/organization/tax-profiles`,
            transformResponse: (response: TaxProfile[]) =>
                response.find((p) => p.isDefault) ?? null,
            providesTags: ['TaxProfiles'],
        }),

        // =====================================================================
        // PRINTERS
        // =====================================================================

        /**
         * Get printer configurations
         */
        getPrinters: builder.query<PrinterConfig[], string>({
            query: (storeId) => `/api/v1/stores/${storeId}/printers`,
            providesTags: ['Printers'],
        }),

        /**
         * Test printer connection
         */
        testPrinter: builder.mutation<
            PrinterTestResult,
            { storeId: string; printerId: string }
        >({
            query: ({ storeId, printerId }) => ({
                url: `/api/v1/stores/${storeId}/printers/${printerId}/test`,
                method: 'POST',
            }),
        }),

        // =====================================================================
        // CUSTOM FIELDS
        // =====================================================================

        /**
         * Get custom field definitions
         */
        getCustomFields: builder.query<CustomFieldDefinition[], void>({
            query: () => `/api/v1/custom-fields`,
            providesTags: ['CustomFields'],
        }),

        /**
         * Create custom field
         */
        createCustomField: builder.mutation<
            CustomFieldDefinition,
            Omit<CustomFieldDefinition, 'id'>
        >({
            query: (definition) => ({
                url: `/api/v1/custom-fields`,
                method: 'POST',
                body: definition,
            }),
            invalidatesTags: ['CustomFields', 'StoreConfig'],
        }),

        /**
         * Update custom field
         */
        updateCustomField: builder.mutation<
            CustomFieldDefinition,
            { fieldId: string; updates: Partial<CustomFieldDefinition> }
        >({
            query: ({ fieldId, updates }) => ({
                url: `/api/v1/custom-fields/${fieldId}`,
                method: 'PATCH',
                body: updates,
            }),
            invalidatesTags: ['CustomFields', 'StoreConfig'],
        }),

        /**
         * Delete custom field
         */
        deleteCustomField: builder.mutation<void, string>({
            query: (fieldId) => ({
                url: `/api/v1/custom-fields/${fieldId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['CustomFields', 'StoreConfig'],
        }),

        // =====================================================================
        // WORKFLOWS
        // =====================================================================

        /**
         * Get workflow configurations
         */
        getWorkflows: builder.query<WorkflowConfig[], string>({
            query: (storeId) => `/api/v1/stores/${storeId}/workflows`,
            providesTags: ['Workflows'],
        }),

        /**
         * Update workflow
         */
        updateWorkflow: builder.mutation<
            WorkflowConfig,
            { storeId: string; workflowType: string; config: Partial<WorkflowConfig> }
        >({
            query: ({ storeId, workflowType, config }) => ({
                url: `/api/v1/stores/${storeId}/workflows/${workflowType}`,
                method: 'PATCH',
                body: config,
            }),
            invalidatesTags: ['Workflows', 'StoreConfig'],
        }),
    }),
});

// =============================================================================
// EXPORT HOOKS
// =============================================================================

export const {
    useGetStoreConfigQuery,
    useUpdateStoreConfigMutation,
    useGetFeaturesQuery,
    useUpdateFeaturesMutation,
    useGetPOSConfigQuery,
    useUpdatePOSConfigMutation,
    useGetPaymentMethodsQuery,
    useUpdatePaymentMethodMutation,
    useGetTaxProfilesQuery,
    useGetDefaultTaxProfileQuery,
    useGetPrintersQuery,
    useTestPrinterMutation,
    useGetCustomFieldsQuery,
    useCreateCustomFieldMutation,
    useUpdateCustomFieldMutation,
    useDeleteCustomFieldMutation,
    useGetWorkflowsQuery,
    useUpdateWorkflowMutation,
} = storeSettingsApi;
