/**
 * Store Settings Service
 * Handles store configuration, feature flags, and settings
 */
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';
import type { FeatureFlags, POSConfig, Organization, Store, CustomFieldDefinition, WorkflowConfig } from '@/types/config.types';

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

// =============================================================================
// STORE SETTINGS SERVICE
// =============================================================================

class StoreSettingsService {
    private baseUrl = '/api/v1';

    /**
     * Get complete store configuration
     */
    async getStoreConfig(storeId: string): Promise<StoreConfig> {
        const response = await apiClient.get<ApiResponse<StoreConfig>>(
            `${this.baseUrl}/stores/${storeId}/config`
        );
        return response.data.data;
    }

    /**
     * Update store configuration
     */
    async updateStoreConfig(storeId: string, config: Partial<StoreConfig>): Promise<StoreConfig> {
        const response = await apiClient.patch<ApiResponse<StoreConfig>>(
            `${this.baseUrl}/stores/${storeId}/config`,
            config
        );
        return response.data.data;
    }

    // =========================================================================
    // FEATURE FLAGS
    // =========================================================================

    /**
     * Get feature flags
     */
    async getFeatures(storeId: string): Promise<FeatureFlags> {
        const response = await apiClient.get<ApiResponse<FeatureFlags>>(
            `${this.baseUrl}/stores/${storeId}/features`
        );
        return response.data.data;
    }

    /**
     * Update feature flags
     */
    async updateFeatures(storeId: string, features: Partial<FeatureFlags>): Promise<FeatureFlags> {
        const response = await apiClient.patch<ApiResponse<FeatureFlags>>(
            `${this.baseUrl}/stores/${storeId}/features`,
            features
        );
        return response.data.data;
    }

    // =========================================================================
    // POS CONFIG
    // =========================================================================

    /**
     * Get POS configuration
     */
    async getPOSConfig(storeId: string): Promise<POSConfig> {
        const response = await apiClient.get<ApiResponse<POSConfig>>(
            `${this.baseUrl}/stores/${storeId}/pos-config`
        );
        return response.data.data;
    }

    /**
     * Update POS configuration
     */
    async updatePOSConfig(storeId: string, config: Partial<POSConfig>): Promise<POSConfig> {
        const response = await apiClient.patch<ApiResponse<POSConfig>>(
            `${this.baseUrl}/stores/${storeId}/pos-config`,
            config
        );
        return response.data.data;
    }

    // =========================================================================
    // PAYMENT METHODS
    // =========================================================================

    /**
     * Get available payment methods
     */
    async getPaymentMethods(storeId: string): Promise<PaymentMethodConfig[]> {
        const response = await apiClient.get<ApiResponse<PaymentMethodConfig[]>>(
            `${this.baseUrl}/stores/${storeId}/payment-methods`
        );
        return response.data.data;
    }

    /**
     * Update payment method status
     */
    async updatePaymentMethod(storeId: string, methodId: string, isActive: boolean): Promise<PaymentMethodConfig> {
        const response = await apiClient.patch<ApiResponse<PaymentMethodConfig>>(
            `${this.baseUrl}/stores/${storeId}/payment-methods/${methodId}`,
            { isActive }
        );
        return response.data.data;
    }

    // =========================================================================
    // TAX PROFILES
    // =========================================================================

    /**
     * Get tax profiles
     */
    async getTaxProfiles(storeId: string): Promise<TaxProfile[]> {
        const response = await apiClient.get<ApiResponse<TaxProfile[]>>(
            `${this.baseUrl}/organization/tax-profiles`
        );
        return response.data.data;
    }

    /**
     * Get default tax profile
     */
    async getDefaultTaxProfile(storeId: string): Promise<TaxProfile | null> {
        const profiles = await this.getTaxProfiles(storeId);
        return profiles.find(p => p.isDefault) ?? null;
    }

    // =========================================================================
    // PRINTERS
    // =========================================================================

    /**
     * Get printer configurations
     */
    async getPrinters(storeId: string): Promise<PrinterConfig[]> {
        const response = await apiClient.get<ApiResponse<PrinterConfig[]>>(
            `${this.baseUrl}/stores/${storeId}/printers`
        );
        return response.data.data;
    }

    /**
     * Test printer connection
     */
    async testPrinter(storeId: string, printerId: string): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
            `${this.baseUrl}/stores/${storeId}/printers/${printerId}/test`
        );
        return response.data.data;
    }

    // =========================================================================
    // CUSTOM FIELDS
    // =========================================================================

    /**
     * Get custom field definitions
     */
    async getCustomFields(storeId: string): Promise<CustomFieldDefinition[]> {
        const response = await apiClient.get<ApiResponse<CustomFieldDefinition[]>>(
            `${this.baseUrl}/custom-fields`
        );
        return response.data.data;
    }

    /**
     * Create custom field
     */
    async createCustomField(definition: Omit<CustomFieldDefinition, 'id'>): Promise<CustomFieldDefinition> {
        const response = await apiClient.post<ApiResponse<CustomFieldDefinition>>(
            `${this.baseUrl}/custom-fields`,
            definition
        );
        return response.data.data;
    }

    /**
     * Update custom field
     */
    async updateCustomField(fieldId: string, updates: Partial<CustomFieldDefinition>): Promise<CustomFieldDefinition> {
        const response = await apiClient.patch<ApiResponse<CustomFieldDefinition>>(
            `${this.baseUrl}/custom-fields/${fieldId}`,
            updates
        );
        return response.data.data;
    }

    /**
     * Delete custom field
     */
    async deleteCustomField(fieldId: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/custom-fields/${fieldId}`);
    }

    // =========================================================================
    // WORKFLOWS
    // =========================================================================

    /**
     * Get workflow configurations
     */
    async getWorkflows(storeId: string): Promise<WorkflowConfig[]> {
        const response = await apiClient.get<ApiResponse<WorkflowConfig[]>>(
            `${this.baseUrl}/stores/${storeId}/workflows`
        );
        return response.data.data;
    }

    /**
     * Update workflow
     */
    async updateWorkflow(storeId: string, workflowType: string, config: Partial<WorkflowConfig>): Promise<WorkflowConfig> {
        const response = await apiClient.patch<ApiResponse<WorkflowConfig>>(
            `${this.baseUrl}/stores/${storeId}/workflows/${workflowType}`,
            config
        );
        return response.data.data;
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const storeSettingsService = new StoreSettingsService();
