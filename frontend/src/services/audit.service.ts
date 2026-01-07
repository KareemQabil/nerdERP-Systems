import { apiClient } from '@/lib/api-client';

/**
 * Audit Log Entry
 */
export interface AuditLog {
    id: string;
    entityType: string;
    entityId?: string;
    action: string;
    userId: string;
    userName?: string;
    changes: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

/**
 * Void Report Data
 */
export interface VoidReport {
    totalVoids: number;
    totalAmount: number;
    byReason: Array<{ reason: string; count: number; amount: number }>;
    byUser: Array<{ userId: string; userName: string; count: number }>;
}

/**
 * Security Report Data
 */
export interface SecurityReport {
    failedPinAttempts: number;
    accountLockouts: number;
    unauthorizedAttempts: number;
    successfulVerifications: number;
    recentLockouts: Array<{
        userId: string;
        userName: string;
        lockedAt: string;
        deviceId: string;
    }>;
}

/**
 * Statistics Data
 */
export interface AuditStatistics {
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByEntityType: Record<string, number>;
    eventsByUser: Array<{ userId: string; userName: string; count: number }>;
    topEntities: Array<{ entityType: string; entityId: string; count: number }>;
}

/**
 * Audit Service
 *
 * Client for audit log access and reporting.
 */
class AuditService {
    private readonly basePath = '/audit';

    /**
     * Get audit logs with filtering
     */
    async getAuditLogs(params: {
        entityType?: string;
        entityId?: string;
        userId?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        success: boolean;
        data?: AuditLog[];
        meta?: { total: number; page: number; limit: number; totalPages: number };
    }> {
        const queryParams: Record<string, string | number> = {};

        if (params.entityType) queryParams.entityType = params.entityType;
        if (params.entityId) queryParams.entityId = params.entityId;
        if (params.userId) queryParams.userId = params.userId;
        if (params.action) queryParams.action = params.action;
        if (params.startDate) queryParams.startDate = params.startDate.toISOString().slice(0, 10);
        if (params.endDate) queryParams.endDate = params.endDate.toISOString().slice(0, 10);
        if (params.page) queryParams.page = params.page;
        if (params.limit) queryParams.limit = params.limit;

        return apiClient.get(`${this.basePath}/logs`, { params: queryParams });
    }

    /**
     * Get entity history
     */
    async getEntityHistory(
        entityType: string,
        entityId: string,
    ): Promise<{ success: boolean; data?: AuditLog[] }> {
        return apiClient.get(`${this.basePath}/entity/${entityType}/${entityId}`);
    }

    /**
     * Get user activity timeline
     */
    async getUserTimeline(
        userId: string,
        params?: {
            startDate?: Date;
            endDate?: Date;
            limit?: number;
        },
    ): Promise<{ success: boolean; data?: AuditLog[] }> {
        const queryParams: Record<string, string | number> = {};

        if (params?.startDate) queryParams.startDate = params.startDate.toISOString().slice(0, 10);
        if (params?.endDate) queryParams.endDate = params.endDate.toISOString().slice(0, 10);
        if (params?.limit) queryParams.limit = params.limit;

        return apiClient.get(`${this.basePath}/user/${userId}/timeline`, { params: queryParams });
    }

    /**
     * Get void operations report
     */
    async getVoidReport(
        startDate: string,
        endDate: string,
    ): Promise<{ success: boolean; data?: VoidReport }> {
        return apiClient.get(`${this.basePath}/void-report`, {
            params: { startDate, endDate },
        });
    }

    /**
     * Get security report
     */
    async getSecurityReport(
        startDate: string,
        endDate: string,
        userId?: string,
    ): Promise<{ success: boolean; data?: SecurityReport }> {
        const params: Record<string, string> = { startDate, endDate };
        if (userId) params.userId = userId;

        return apiClient.get(`${this.basePath}/security-report`, { params });
    }

    /**
     * Get statistics
     */
    async getStatistics(
        startDate: string,
        endDate: string,
    ): Promise<{ success: boolean; data?: AuditStatistics }> {
        return apiClient.get(`${this.basePath}/statistics`, {
            params: { startDate, endDate },
        });
    }

    /**
     * Get active sessions
     */
    async getActiveSessions(): Promise<{ success: boolean; data?: any[]; message?: string }> {
        return apiClient.get(`${this.basePath}/active-sessions`);
    }

    /**
     * Export audit logs to CSV
     */
    async exportAuditLogs(params: {
        startDate: Date | string;
        endDate: Date | string;
        entityType?: string;
        action?: string;
    }): Promise<{ success: boolean; data?: string }> {
        const queryParams: Record<string, string> = {
            startDate: typeof params.startDate === 'string' ? params.startDate : params.startDate.toISOString().slice(0, 10),
            endDate: typeof params.endDate === 'string' ? params.endDate : params.endDate.toISOString().slice(0, 10),
        };

        if (params.entityType) queryParams.entityType = params.entityType;
        if (params.action) queryParams.action = params.action;

        return apiClient.get(`${this.basePath}/export`, { params: queryParams });
    }

    /**
     * Format audit log changes for display
     */
    formatChanges(changes: Record<string, any>): string {
        if (!changes || Object.keys(changes).length === 0) {
            return '-';
        }

        return Object.entries(changes)
            .map(([key, value]) => {
                if (typeof value === 'object') {
                    return `${key}: ${JSON.stringify(value)}`;
                }
                return `${key}: ${value}`;
            })
            .join(', ');
    }

    /**
     * Get action badge color
     */
    getActionColor(action: string): string {
        const colors: Record<string, string> = {
            CREATE: 'green',
            UPDATE: 'blue',
            DELETE: 'red',
            VOID: 'orange',
            LOGIN: 'green',
            LOGOUT: 'gray',
            PIN_VERIFY: 'blue',
            PIN_LOCKOUT: 'red',
        };

        return colors[action] || 'gray';
    }

    /**
     * Get action display name (localized)
     */
    getActionDisplayName(action: string, language: 'en' | 'ar' = 'en'): string {
        const names: Record<string, { en: string; ar: string }> = {
            CREATE: { en: 'Created', ar: 'تم الإنشاء' },
            UPDATE: { en: 'Updated', ar: 'تم التحديث' },
            DELETE: { en: 'Deleted', ar: 'تم الحذف' },
            VOID: { en: 'Voided', ar: 'تم الإلغاء' },
            LOGIN: { en: 'Login', ar: 'تسجيل الدخول' },
            LOGOUT: { en: 'Logout', ar: 'تسجيل الخروج' },
            PIN_VERIFY: { en: 'PIN Verified', ar: 'تم التحقق من PIN' },
            PIN_LOCKOUT: { en: 'Account Locked', ar: 'تم قفل الحساب' },
        };

        return names[action]?.[language] || action;
    }
}

export const auditService = new AuditService();
export default auditService;
