/**
 * Tables Service
 * API client for table and reservation management
 */
import { apiClient } from '@/lib/api-client';

// =============================================================================
// Types
// =============================================================================

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'BLOCKED';

export interface TableZone {
    id: string;
    zoneName: string;
    translations?: Record<string, { name: string }>;
    color?: string;
    displayOrder: number;
    isActive: boolean;
    storeId: string;
}

export interface FloorPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    shape?: 'rectangle' | 'circle' | 'oval';
}

export interface Table {
    id: string;
    tableNumber: string;
    zone?: TableZone;
    zoneId?: string;
    status: TableStatus;
    minSeats: number;
    maxSeats: number;
    floorPosition?: FloorPosition;
    qrCode?: string;
    currentOrderId?: string;
    // H-POS: Customer tracking
    currentCustomerCount?: number;
    occupiedAt?: string;
    isActive: boolean;
    storeId: string;
    createdAt: string;
    updatedAt: string;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
    id: string;
    table: Table;
    tableId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    partySize: number;
    reservationDate: string;
    status: ReservationStatus;
    notes?: string;
    confirmedAt?: string;
    createdAt: string;
    updatedAt: string;
}

// DTOs
export interface CreateTableDto {
    tableNumber: string;
    zoneId?: string;
    minSeats: number;
    maxSeats: number;
    floorPosition?: FloorPosition;
    storeId: string;
}

export interface UpdateTableStatusDto {
    status: TableStatus;
    currentOrderId?: string;
    customerCount?: number;
}

export interface CreateTableZoneDto {
    zoneName: string;
    color?: string;
    displayOrder?: number;
    storeId: string;
}

export interface CreateReservationDto {
    tableId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    partySize: number;
    reservationDate: string;
    notes?: string;
}

// =============================================================================
// Service
// =============================================================================

class TablesServiceClass {
    private readonly baseUrl = '/api/v1';

    // =========================================================================
    // Zones
    // =========================================================================

    async getZones(storeId?: string): Promise<TableZone[]> {
        const params: Record<string, string> = {};
        // Only include storeId if it's a valid UUID
        if (storeId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId)) {
            params.storeId = storeId;
        }
        const response = await apiClient.get(`${this.baseUrl}/tables/zones`, { params });
        return response.data?.data || response.data || [];
    }

    async createZone(dto: CreateTableZoneDto): Promise<TableZone> {
        const response = await apiClient.post(`${this.baseUrl}/tables/zones`, dto);
        return response.data?.data || response.data;
    }

    // =========================================================================
    // Tables
    // =========================================================================

    async getTables(storeId?: string): Promise<Table[]> {
        const params: Record<string, string> = {};
        // Only include storeId if it's a valid UUID
        if (storeId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId)) {
            params.storeId = storeId;
        }
        const response = await apiClient.get(`${this.baseUrl}/tables`, { params });
        return response.data?.data || response.data || [];
    }

    async getTableById(id: string): Promise<Table> {
        const response = await apiClient.get(`${this.baseUrl}/tables/${id}`);
        return response.data?.data || response.data;
    }

    async getAvailableTables(storeId: string, partySize?: number): Promise<Table[]> {
        const params: Record<string, string | number> = { storeId };
        if (partySize) params.partySize = partySize;

        const response = await apiClient.get(`${this.baseUrl}/tables/available`, { params });
        return response.data?.data || response.data || [];
    }

    async createTable(dto: CreateTableDto): Promise<Table> {
        const response = await apiClient.post(`${this.baseUrl}/tables`, dto);
        return response.data?.data || response.data;
    }

    async updateTableStatus(id: string, dto: UpdateTableStatusDto): Promise<Table> {
        const response = await apiClient.patch(`${this.baseUrl}/tables/${id}/status`, dto);
        return response.data?.data || response.data;
    }

    async occupyTable(tableId: string, orderId: string, customerCount?: number): Promise<Table> {
        const response = await apiClient.post(`${this.baseUrl}/tables/${tableId}/occupy`, { orderId, customerCount });
        return response.data?.data || response.data;
    }

    async freeTable(tableId: string): Promise<Table> {
        const response = await apiClient.post(`${this.baseUrl}/tables/${tableId}/free`);
        return response.data?.data || response.data;
    }

    async updateFloorPosition(tableId: string, position: FloorPosition): Promise<Table> {
        const response = await apiClient.patch(`${this.baseUrl}/tables/${tableId}`, {
            floorPosition: position
        });
        return response.data?.data || response.data;
    }

    // =========================================================================
    // Table Cleaning Workflow
    // =========================================================================

    /**
     * Set table to cleaning status (after order completion)
     */
    async setTableCleaning(tableId: string): Promise<Table> {
        const response = await apiClient.post(`${this.baseUrl}/tables/${tableId}/set-cleaning`);
        return response.data?.data || response.data;
    }

    /**
     * Mark table as clean and available (staff action)
     */
    async markTableClean(tableId: string): Promise<Table> {
        const response = await apiClient.post(`${this.baseUrl}/tables/${tableId}/mark-clean`);
        return response.data?.data || response.data;
    }

    /**
     * Block table for maintenance or VIP
     */
    async blockTable(tableId: string, reason?: string): Promise<Table> {
        const response = await apiClient.post(`${this.baseUrl}/tables/${tableId}/block`, { reason });
        return response.data?.data || response.data;
    }

    /**
     * Get tables that need cleaning
     */
    async getTablesNeedingCleaning(storeId: string): Promise<Table[]> {
        const response = await apiClient.get(`${this.baseUrl}/tables/cleaning/${storeId}`);
        return response.data?.data || response.data || [];
    }

    // =========================================================================
    // Reservations
    // =========================================================================

    async getTodayReservations(storeId: string, date?: string): Promise<Reservation[]> {
        const params: Record<string, string> = { storeId };
        if (date) params.date = date;

        const response = await apiClient.get(`${this.baseUrl}/tables/reservations/today`, { params });
        return response.data?.data || response.data || [];
    }

    async createReservation(dto: CreateReservationDto): Promise<Reservation> {
        const response = await apiClient.post(`${this.baseUrl}/tables/reservations`, dto);
        return response.data?.data || response.data;
    }

    async checkInReservation(reservationId: string): Promise<Reservation> {
        const response = await apiClient.post(`${this.baseUrl}/tables/reservations/${reservationId}/checkin`);
        return response.data?.data || response.data;
    }

    async cancelReservation(reservationId: string): Promise<Reservation> {
        const response = await apiClient.post(`${this.baseUrl}/tables/reservations/${reservationId}/cancel`);
        return response.data?.data || response.data;
    }

    async updateReservation(reservationId: string, dto: Partial<CreateReservationDto>): Promise<Reservation> {
        const response = await apiClient.patch(`${this.baseUrl}/tables/reservations/${reservationId}`, dto);
        return response.data?.data || response.data;
    }
}

// Export singleton instance
export const tablesService = new TablesServiceClass();
