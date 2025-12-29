/**
 * Store Configuration Service
 * Connects to backend /api/stores/:id/configurations endpoints
 */
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';

export interface StoreConfig {
    id: string;
    configKey: string;
    configValue: any;
    configType: 'BOOLEAN' | 'NUMBER' | 'STRING' | 'JSON' | 'ENUM';
    category: string;
    description: string;
}

export interface ConfigCategory {
    key: string;
    label: string;
    description: string;
    icon?: string;
}

// Configuration categories for UI
export const CONFIG_CATEGORIES: ConfigCategory[] = [
    { key: 'session', label: 'Session & Cash', description: 'Cashier session and drawer settings' },
    { key: 'eod', label: 'End of Day', description: 'Manager end-of-day settings' },
    { key: 'inventory', label: 'Inventory', description: 'Stock management settings' },
    { key: 'order', label: 'Orders', description: 'Order creation and workflow' },
    { key: 'kitchen', label: 'Kitchen', description: 'Kitchen display settings' },
    { key: 'payment', label: 'Payments', description: 'Payment methods and rules' },
    { key: 'discount', label: 'Discounts', description: 'Discount limits and approvals' },
    { key: 'zatca', label: 'ZATCA', description: 'E-invoicing compliance' },
    { key: 'tax', label: 'Tax', description: 'Tax rates and calculation' },
];

class StoreConfigurationService {
    private baseUrl = '/api/stores';

    /**
     * Get all configurations for a store
     */
    async getAll(storeId: string, category?: string): Promise<StoreConfig[]> {
        const params = category ? { category } : {};
        const response = await apiClient.get<ApiResponse<StoreConfig[]>>(
            `${this.baseUrl}/${storeId}/configurations`,
            { params }
        );
        return response.data.data;
    }

    /**
     * Get a specific configuration value
     */
    async get<T = any>(storeId: string, key: string, defaultValue: T): Promise<T> {
        try {
            const response = await apiClient.get<ApiResponse<{ configKey: string; configValue: T }>>(
                `${this.baseUrl}/${storeId}/configurations/${key}`
            );
            return response.data.data.configValue ?? defaultValue;
        } catch {
            return defaultValue;
        }
    }

    /**
     * Set a configuration value
     */
    async set(
        storeId: string,
        key: string,
        value: any,
        type: StoreConfig['configType'],
        category: string,
        description?: string
    ): Promise<void> {
        await apiClient.post(`${this.baseUrl}/${storeId}/configurations`, {
            configKey: key,
            configValue: value,
            configType: type,
            category,
            description,
        });
    }

    /**
     * Delete a configuration
     */
    async delete(storeId: string, key: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${storeId}/configurations/${key}`);
    }

    /**
     * Get boolean config with { enabled: true } support
     */
    async getBoolean(storeId: string, key: string, defaultValue = false): Promise<boolean> {
        const value = await this.get(storeId, key, defaultValue);
        if (typeof value === 'object' && value !== null && 'enabled' in value) {
            return (value as { enabled: boolean }).enabled;
        }
        return Boolean(value);
    }

    /**
     * Set boolean config in { enabled: boolean } format
     */
    async setBoolean(storeId: string, key: string, enabled: boolean, category: string, description?: string): Promise<void> {
        await this.set(storeId, key, { enabled }, 'BOOLEAN', category, description);
    }

    /**
     * Get number config
     */
    async getNumber(storeId: string, key: string, defaultValue = 0): Promise<number> {
        const value = await this.get(storeId, key, defaultValue);
        return Number(value);
    }

    /**
     * Set number config
     */
    async setNumber(storeId: string, key: string, value: number, category: string, description?: string): Promise<void> {
        await this.set(storeId, key, value, 'NUMBER', category, description);
    }
}

export const storeConfigService = new StoreConfigurationService();
