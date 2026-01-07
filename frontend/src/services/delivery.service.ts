/**
 * Delivery Service
 * Handles delivery dashboard, driver assignment, and delivery status updates
 */
import { apiClient } from '@/lib/api-client';
import { ApiService } from '@/lib/api-service';
import type { ApiResponse, PaginatedResult, QueryParams } from '@/types/api.types';

// =============================================================================
// TYPES
// =============================================================================

export type DeliveryStatus =
    | 'PENDING'
    | 'ASSIGNED'
    | 'OUT_FOR_DELIVERY'
    | 'READY_FOR_PICKUP'
    | 'COMPLETED'
    | 'CANCELLED';

export type DriverStatus = 'AVAILABLE' | 'BUSY' | 'OFF_DUTY';

export interface DeliveryDriver {
    id: string;
    name: string;
    phone?: string;
    status: DriverStatus;
    currentOrderId?: string;
    activeOrdersCount: number;
    completedTodayCount: number;
    averageDeliveryTime?: number;
}

export interface DeliveryOrder {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    address: string;
    city: string;
    zoneCode: string;
    zoneName: string;
    deliveryFee: number;
    estimatedMinutes?: number;
    orderTotal: number;
    status: DeliveryStatus;
    driverId?: string;
    driverName?: string;
    driverPhone?: string;
    createdAt: string;
    assignedAt?: string;
    outForDeliveryAt?: string;
    completedAt?: string;
    notes?: string;
    isRush?: boolean;
}

export interface DeliveryZoneStats {
    zoneId: string;
    zoneCode: string;
    zoneName: string;
    deliveryFee: number;
    estimatedMinutes: number;
    activeOrders: number;
    completedToday: number;
    availableDrivers: number;
}

export interface DashboardSummary {
    totalPendingOrders: number;
    totalAssignedOrders: number;
    totalOutForDelivery: number;
    totalReadyForPickup: number;
    totalCompletedToday: number;
    availableDrivers: number;
    busyDrivers: number;
    offDutyDrivers: number;
    avgDeliveryTimeMinutes: number;
    onTimeDeliveryPercentage: number;
}

export interface DashboardData {
    summary: DashboardSummary;
    pendingOrders: DeliveryOrder[];
    assignedOrders: DeliveryOrder[];
    outForDeliveryOrders: DeliveryOrder[];
    readyForPickupOrders: DeliveryOrder[];
    completedOrders: DeliveryOrder[];
    availableDrivers: DeliveryDriver[];
    busyDrivers: DeliveryDriver[];
    offDutyDrivers: DeliveryDriver[];
    zoneStats: DeliveryZoneStats[];
}

// =============================================================================
// DTOs
// =============================================================================

export interface AssignDriverDto {
    orderId: string;
    driverId: string;
}

export interface UpdateDeliveryStatusDto {
    orderId: string;
    status: DeliveryStatus;
    note?: string;
}

export interface CreateDeliveryOrderDto {
    orderId: string;
    customerName: string;
    customerPhone: string;
    address: string;
    city: string;
    zoneCode: string;
    orderTotal: number;
    notes?: string;
}

// =============================================================================
// DELIVERY SERVICE
// =============================================================================

class DeliveryService extends ApiService<any, any, any> {
    constructor() {
        super({ endpoint: '/api/v1/delivery', cacheKey: 'delivery' });
    }

    // ========================================================================
    // DASHBOARD
    // ========================================================================

    /**
     * Get delivery dashboard data for a store
     */
    async getDashboard(storeId: string): Promise<DashboardData> {
        const response = await apiClient.get<ApiResponse<DashboardData>>(
            `${this.endpoint}/dashboard/${storeId}`
        );
        return response.data.data;
    }

    // ========================================================================
    // DRIVER MANAGEMENT
    // ========================================================================

    /**
     * Get all drivers for a store
     */
    async getDrivers(storeId: string, status?: DriverStatus): Promise<DeliveryDriver[]> {
        const response = await apiClient.get<ApiResponse<DeliveryDriver[]>>(
            `${this.endpoint}/drivers/${storeId}`,
            { params: status ? { status } : undefined }
        );
        return response.data.data;
    }

    /**
     * Assign driver to order
     */
    async assignDriver(orderId: string, driverId: string): Promise<DeliveryOrder> {
        const response = await apiClient.post<ApiResponse<DeliveryOrder>>(
            `${this.endpoint}/assign`,
            { orderId, driverId }
        );
        return response.data.data;
    }

    /**
     * Unassign driver from order
     */
    async unassignDriver(orderId: string): Promise<DeliveryOrder> {
        const response = await apiClient.post<ApiResponse<DeliveryOrder>>(
            `${this.endpoint}/unassign`,
            { orderId }
        );
        return response.data.data;
    }

    // ========================================================================
    // DELIVERY STATUS
    // ========================================================================

    /**
     * Update delivery order status
     */
    async updateStatus(params: UpdateDeliveryStatusDto): Promise<DeliveryOrder> {
        const response = await apiClient.patch<ApiResponse<DeliveryOrder>>(
            `${this.endpoint}/status`,
            params
        );
        return response.data.data;
    }

    /**
     * Get delivery order details
     */
    async getOrder(orderId: string): Promise<DeliveryOrder> {
        const response = await apiClient.get<ApiResponse<DeliveryOrder>>(
            `${this.endpoint}/orders/${orderId}`
        );
        return response.data.data;
    }

    /**
     * Get delivery orders for a store with filters
     */
    async getOrders(
        storeId: string,
        params?: QueryParams & {
            status?: DeliveryStatus;
            driverId?: string;
            zoneCode?: string;
            fromDate?: string;
            toDate?: string;
        }
    ): Promise<PaginatedResult<DeliveryOrder>> {
        const response = await apiClient.get<ApiResponse<DeliveryOrder[]>>(
            `${this.endpoint}/orders/${storeId}`,
            { params }
        );
        return {
            data: response.data.data,
            meta: {
                total: response.data.data.length,
                page: 1,
                limit: params?.limit || 50,
                totalPages: 1,
            },
        };
    }

    // ========================================================================
    // DELIVERY ZONES
    // ========================================================================

    /**
     * Get delivery zones for a store
     */
    async getZones(storeId: string): Promise<DeliveryZoneStats[]> {
        const response = await apiClient.get<ApiResponse<DeliveryZoneStats[]>>(
            `${this.endpoint}/zones/${storeId}`
        );
        return response.data.data;
    }

    /**
     * Calculate delivery fee for a zone
     */
    async calculateDeliveryFee(storeId: string, zoneCode: string): Promise<number> {
        const response = await apiClient.get<ApiResponse<{ fee: number }>>(
            `${this.endpoint}/zones/${storeId}/fee`,
            { params: { zoneCode } }
        );
        return response.data.data.fee;
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const deliveryService = new DeliveryService();
