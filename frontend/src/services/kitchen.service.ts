/**
 * Kitchen Service
 * API client for kitchen operations
 */
import { apiClient } from '@/lib/api-client';

// =============================================================================
// TYPES
// =============================================================================

export interface FireOrderToKitchenDto {
    itemIds?: string[];
}

export interface KitchenTicket {
    id: string;
    orderId: string;
    orderType: string;
    tableNumber?: string;
    items: KitchenTicketItem[];
    station: string;
    createdAt: string;
    firedAt: string;
}

export interface KitchenTicketItem {
    id: string;
    name: string;
    nameAr?: string;
    quantity: number;
    notes?: string;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
    station: string;
    modifiers?: Array<{
        name: string;
        quantity: number;
    }>;
}

export interface UpdateItemStatusDto {
    ticketId: string;
    itemId: string;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

class KitchenServiceClass {
    private readonly baseUrl = '/api/v1';

    /**
     * Fire order to kitchen
     * Creates kitchen tickets for all kitchen items in the order
     */
    async fireOrderToKitchen(orderId: string, itemIds?: string[]): Promise<KitchenTicket[]> {
        const response = await apiClient.post(`${this.baseUrl}/kitchen/orders/${orderId}/fire-to-kitchen`, {
            itemIds,
        });
        return response.data?.data || response.data || [];
    }

    /**
     * Update item status
     */
    async updateItemStatus(dto: UpdateItemStatusDto): Promise<void> {
        await apiClient.post(`${this.baseUrl}/kitchen/items/status`, dto);
    }

    /**
     * Get active tickets for a station
     */
    async getTicketsForStation(station: string): Promise<KitchenTicket[]> {
        const response = await apiClient.get(`${this.baseUrl}/kitchen/tickets`, {
            params: { station },
        });
        return response.data?.data || response.data || [];
    }

    /**
     * Get all active tickets
     */
    async getAllTickets(): Promise<KitchenTicket[]> {
        const response = await apiClient.get(`${this.baseUrl}/kitchen/tickets`);
        return response.data?.data || response.data || [];
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const kitchenService = new KitchenServiceClass();
