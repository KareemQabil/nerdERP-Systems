/**
 * Register Session Service
 * Handles cash register session management
 */
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api.types';

// =============================================================================
// TYPES
// =============================================================================

export interface RegisterSession {
    id: string;
    deviceId: string;
    userId: string;
    storeId?: string;
    openingBalance: string;
    closingBalance?: string;
    expectedBalance?: string;
    discrepancy?: string;
    isOpen: boolean;
    openedAt: string;
    closedAt?: string;
    closedBy?: string;
    notes?: string;
}

export interface CreateSessionDto {
    deviceId: string;
    openingBalance: string; // Backend expects decimal as string
    userId?: string;
    storeId?: string;
}

export interface CloseSessionDto {
    actualBalance: string; // Backend expects decimal as string, not closingBalance
    notes?: string;
}

export interface SessionBalance {
    openingBalance: string;
    cashSales: string;
    cashRefunds: string;
    dropsToSafe: string;
    pettyCash: string;
    expectedBalance: string;
}

// =============================================================================
// SESSION SERVICE
// =============================================================================

class RegisterSessionService {
    private readonly endpoint = '/api/v1/cash/sessions';

    /**
     * Open a new register session
     */
    async openSession(dto: CreateSessionDto): Promise<RegisterSession> {
        const response = await apiClient.post<ApiResponse<RegisterSession>>(
            `${this.endpoint}/open`,
            dto
        );
        return response.data.data;
    }

    /**
     * Close an existing session
     */
    async closeSession(sessionId: string, dto: CloseSessionDto): Promise<RegisterSession> {
        const response = await apiClient.post<ApiResponse<RegisterSession>>(
            `${this.endpoint}/${sessionId}/close`,
            dto
        );
        return response.data.data;
    }

    /**
     * Get active session for a device
     */
    async getActiveSession(deviceId: string): Promise<RegisterSession | null> {
        try {
            console.log('[SessionService] Checking for active session, deviceId:', deviceId);
            const response = await apiClient.get<ApiResponse<RegisterSession>>(
                `${this.endpoint}/active/${deviceId}`
            );
            console.log('[SessionService] Full response:', response);
            console.log('[SessionService] response.data:', response.data);

            // Handle double-nesting: axios returns response.data, which contains the API wrapper
            // API wrapper has {success, data, timestamp}, so we need response.data.data.data
            const apiWrapper = response.data as any;
            const session = apiWrapper.data?.data || apiWrapper.data || null;

            console.log('[SessionService] Extracted session:', session);
            console.log('[SessionService] Session keys:', session ? Object.keys(session) : 'null');

            if (session && typeof session === 'object' && 'id' in session) {
                console.log('[SessionService] ✅ Found active session, ID:', session.id, 'isOpen:', session.isOpen);
                return session;
            } else {
                console.log('[SessionService] ⚠️ No valid session found');
                return null;
            }
        } catch (error: any) {
            console.error('[SessionService] ❌ Error getting active session:', error?.response?.data || error.message);
            return null;
        }
    }

    /**
     * Get session by ID
     */
    async getSession(sessionId: string): Promise<RegisterSession> {
        const response = await apiClient.get<ApiResponse<RegisterSession>>(
            `${this.endpoint}/${sessionId}`
        );
        return response.data.data;
    }

    /**
     * Get calculated balance for session
     */
    async getBalance(sessionId: string): Promise<SessionBalance> {
        const response = await apiClient.get<ApiResponse<SessionBalance>>(
            `${this.endpoint}/${sessionId}/balance`
        );
        return response.data.data;
    }

    /**
     * Drop cash to safe
     */
    async dropToSafe(sessionId: string, amount: number, notes?: string): Promise<void> {
        await apiClient.post(
            `${this.endpoint}/${sessionId}/drop-to-safe`,
            { amount, notes }
        );
    }

    /**
     * Record petty cash payout
     */
    async recordPettyCash(sessionId: string, amount: number, reason: string): Promise<void> {
        await apiClient.post(
            `${this.endpoint}/${sessionId}/petty-cash`,
            { amount, reason }
        );
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const registerSessionService = new RegisterSessionService();
