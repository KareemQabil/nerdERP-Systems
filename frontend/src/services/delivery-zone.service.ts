/**
 * Delivery Zone Service
 * H-POS: Frontend service for zone-based delivery management
 */
import { apiClient } from '@/lib/api-client';

// =============================================================================
// Types
// =============================================================================

export interface DeliveryZone {
    id: string;
    zoneName: string;
    translations?: Record<string, { name: string }>;
    zoneCode: string;
    deliveryFee: number;
    freeDeliveryMinimum?: number;
    minimumOrderValue?: number;
    estimatedDeliveryMinutes?: number;
    polygon?: { lat: number; lng: number }[];
    displayOrder: number;
    color?: string;
    isActive: boolean;
    storeId: string;
}

export interface DeliveryZonePOS {
    id: string;
    code: string;
    name: string;
    fee: number;
    freeAbove: number | null;
    estimatedMinutes: number | null;
    color: string | null;
}

export interface DeliveryFeeResult {
    zoneId: string;
    zoneName: string;
    deliveryFee: number;
    isFreeDelivery: boolean;
    freeDeliveryThreshold?: number;
    estimatedMinutes?: number;
}

export interface CreateDeliveryZoneDto {
    zoneName: string;
    zoneCode: string;
    deliveryFee: number;
    freeDeliveryMinimum?: number;
    minimumOrderValue?: number;
    estimatedDeliveryMinutes?: number;
    polygon?: { lat: number; lng: number }[];
    color?: string;
    displayOrder?: number;
    storeId: string;
}

// =============================================================================
// Service
// =============================================================================

class DeliveryZoneService {
    private readonly baseUrl = '/api/v1/delivery-zones';
    private cache: DeliveryZonePOS[] | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    /**
     * Get all delivery zones for a store
     */
    async getZones(storeId: string): Promise<DeliveryZone[]> {
        const response = await apiClient.get(`${this.baseUrl}`, {
            params: { storeId },
        });
        return response.data?.data || response.data || [];
    }

    /**
     * Get simplified zones for POS cart UI
     * Cached for 5 minutes
     */
    async getZonesForPOS(storeId: string): Promise<DeliveryZonePOS[]> {
        // Return cached if valid
        if (this.cache && Date.now() < this.cacheExpiry) {
            return this.cache;
        }

        try {
            const response = await apiClient.get(`${this.baseUrl}/pos`, {
                params: { storeId },
            });
            this.cache = response.data?.data || response.data || [];
            this.cacheExpiry = Date.now() + this.CACHE_TTL_MS;
            return this.cache || [];
        } catch (error) {
            console.warn('[DeliveryZoneService] Failed to fetch zones:', error);
            return [];
        }
    }

    /**
     * Calculate delivery fee for an order
     */
    async calculateFee(zoneId: string, orderTotal: number): Promise<DeliveryFeeResult> {
        const response = await apiClient.post(`${this.baseUrl}/calculate-fee`, {
            zoneId,
            orderTotal,
        });
        return response.data?.data || response.data;
    }

    /**
     * Get zone by ID
     */
    async getZoneById(id: string): Promise<DeliveryZone> {
        const response = await apiClient.get(`${this.baseUrl}/${id}`);
        return response.data?.data || response.data;
    }

    /**
     * Get zone by code
     */
    async getZoneByCode(storeId: string, zoneCode: string): Promise<DeliveryZone | null> {
        try {
            const response = await apiClient.get(`${this.baseUrl}/by-code/${storeId}/${zoneCode}`);
            return response.data?.data || response.data;
        } catch {
            return null;
        }
    }

    /**
     * Create a new delivery zone (admin)
     */
    async create(dto: CreateDeliveryZoneDto): Promise<DeliveryZone> {
        const response = await apiClient.post(this.baseUrl, dto);
        this.clearCache();
        return response.data?.data || response.data;
    }

    /**
     * Update a delivery zone (admin)
     */
    async update(id: string, dto: Partial<CreateDeliveryZoneDto>): Promise<DeliveryZone> {
        const response = await apiClient.put(`${this.baseUrl}/${id}`, dto);
        this.clearCache();
        return response.data?.data || response.data;
    }

    /**
     * Delete a delivery zone (admin)
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/${id}`);
        this.clearCache();
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache = null;
        this.cacheExpiry = 0;
    }
}

export const deliveryZoneService = new DeliveryZoneService();
