import { Controller, Get, Query, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AuditLogService } from '../../../common/services/audit-log.service';

/**
 * Audit Controller
 *
 * Provides endpoints for audit log access and reporting.
 *
 * Features:
 * - Entity history tracking
 * - User activity timeline
 * - Void operation reports
 * - Security reports (failed PIN attempts)
 */
@ApiTags('audit')
@Controller('audit')
export class AuditController {
    private readonly auditLogService: any;

    constructor(auditLogService: AuditLogService) {
        // Cast to any to allow calling methods that may not be typed yet
        this.auditLogService = auditLogService as any;
    }

    /**
     * Get audit logs with filtering
     *
     * GET /api/v1/audit/logs
     *
     * Query params:
     * - entityType: Filter by entity type (SalesOrder, Product, User, etc.)
     * - entityId: Filter by entity ID
     * - userId: Filter by user who performed the action
     * - action: Filter by action type (CREATE, UPDATE, DELETE, VOID, etc.)
     * - startDate: Start of date range
     * - endDate: End of date range
     * - page: Page number (default: 1)
     * - limit: Items per page (default: 50)
     */
    @Get('logs')
    @ApiOperation({ summary: 'Get audit logs with optional filters' })
    @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
    @ApiQuery({ name: 'entityType', required: false, type: 'string', example: 'SalesOrder' })
    @ApiQuery({ name: 'entityId', required: false, type: 'string' })
    @ApiQuery({ name: 'userId', required: false, type: 'string' })
    @ApiQuery({ name: 'action', required: false, type: 'string', example: 'CREATE' })
    @ApiQuery({ name: 'startDate', required: false, type: 'string', example: '2024-01-01' })
    @ApiQuery({ name: 'endDate', required: false, type: 'string', example: '2024-01-31' })
    @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', example: 50 })
    async getAuditLogs(
        @Query('entityType') entityType?: string,
        @Query('entityId') entityId?: string,
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('startDate') startDateStr?: string,
        @Query('endDate') endDateStr?: string,
        @Query('page') pageStr?: string,
        @Query('limit') limitStr?: string,
    ) {
        const page = pageStr ? parseInt(pageStr) : 1;
        const limit = limitStr ? parseInt(limitStr) : 50;

        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        const result = await this.auditLogService.getAuditLogs({
            entityType,
            entityId,
            userId,
            action,
            startDate,
            endDate,
            page,
            limit,
        });

        return {
            success: true,
            data: result.logs,
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
        };
    }

    /**
     * Get entity history
     *
     * GET /api/v1/audit/entity/:entityType/:entityId
     *
     * Returns all audit log entries for a specific entity.
     */
    @Get('entity/:entityType/:entityId')
    @ApiOperation({ summary: 'Get full history for a specific entity' })
    @ApiResponse({ status: 200, description: 'Entity history retrieved successfully' })
    @ApiParam({ name: 'entityType', type: 'string', example: 'SalesOrder' })
    @ApiParam({ name: 'entityId', type: 'string', example: 'order-uuid' })
    async getEntityHistory(
        @Param('entityType') entityType: string,
        @Param('entityId') entityId: string,
    ) {
        const history = await this.auditLogService.getEntityHistory(entityType, entityId);

        return {
            success: true,
            data: history,
        };
    }

    /**
     * Get user activity timeline
     *
     * GET /api/v1/audit/user/:userId/timeline
     *
     * Returns a timeline of all actions performed by a user.
     */
    @Get('user/:userId/timeline')
    @ApiOperation({ summary: 'Get user activity timeline' })
    @ApiResponse({ status: 200, description: 'User timeline retrieved successfully' })
    @ApiParam({ name: 'userId', type: 'string', example: 'user-uuid' })
    @ApiQuery({ name: 'startDate', required: false, type: 'string' })
    @ApiQuery({ name: 'endDate', required: false, type: 'string' })
    @ApiQuery({ name: 'limit', required: false, type: 'number', example: 100 })
    async getUserTimeline(
        @Param('userId') userId: string,
        @Query('startDate') startDateStr?: string,
        @Query('endDate') endDateStr?: string,
        @Query('limit') limitStr?: string,
    ) {
        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;
        const limit = limitStr ? parseInt(limitStr) : 100;

        const timeline = await this.auditLogService.getUserTimeline(userId, {
            startDate,
            endDate,
            limit,
        });

        return {
            success: true,
            data: timeline,
        };
    }

    /**
     * Get void operations report
     *
     * GET /api/v1/audit/void-report
     *
     * Returns void operations grouped by reason and user.
     */
    @Get('void-report')
    @ApiOperation({ summary: 'Get void operations report' })
    @ApiResponse({ status: 200, description: 'Void report generated' })
    @ApiQuery({ name: 'startDate', required: true, type: 'string', example: '2024-01-01' })
    @ApiQuery({ name: 'endDate', required: true, type: 'string', example: '2024-01-31' })
    async getVoidReport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const report = await this.auditLogService.getVoidReport(startDate, endDate);

        return {
            success: true,
            data: report,
        };
    }

    /**
     * Get security report
     *
     * GET /api/v1/audit/security-report
     *
     * Returns security-related events:
     * - Failed PIN attempts
     * - Account lockouts
     * - Unauthorized access attempts
     */
    @Get('security-report')
    @ApiOperation({ summary: 'Get security events report' })
    @ApiResponse({ status: 200, description: 'Security report generated' })
    @ApiQuery({ name: 'startDate', required: true, type: 'string', example: '2024-01-01' })
    @ApiQuery({ name: 'endDate', required: true, type: 'string', example: '2024-01-31' })
    @ApiQuery({ name: 'userId', required: false, type: 'string' })
    async getSecurityReport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('userId') userId?: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const report = await this.auditLogService.getSecurityReport(startDate, endDate, userId);

        return {
            success: true,
            data: report,
        };
    }

    /**
     * Get action statistics
     *
     * GET /api/v1/audit/statistics
     *
     * Returns aggregated statistics about audit events.
     */
    @Get('statistics')
    @ApiOperation({ summary: 'Get audit log statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved' })
    @ApiQuery({ name: 'startDate', required: true, type: 'string', example: '2024-01-01' })
    @ApiQuery({ name: 'endDate', required: true, type: 'string', example: '2024-01-31' })
    async getStatistics(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const stats = await this.auditLogService.getStatistics(startDate, endDate);

        return {
            success: true,
            data: stats,
        };
    }

    /**
     * Get active sessions
     *
     * GET /api/v1/audit/active-sessions
     *
     * Returns all active user sessions.
     */
    @Get('active-sessions')
    @ApiOperation({ summary: 'Get all active user sessions' })
    @ApiResponse({ status: 200, description: 'Active sessions retrieved' })
    async getActiveSessions() {
        // This would require a sessions table or device tracking
        // For now, return a placeholder response
        return {
            success: true,
            data: [],
            message: 'Session tracking not yet implemented',
        };
    }

    /**
     * Export audit logs to CSV
     *
     * GET /api/v1/audit/export
     *
     * Returns audit logs in CSV format for download.
     */
    @Get('export')
    @ApiOperation({ summary: 'Export audit logs to CSV' })
    @ApiResponse({ status: 200, description: 'CSV export generated' })
    @ApiQuery({ name: 'startDate', required: true, type: 'string' })
    @ApiQuery({ name: 'endDate', required: true, type: 'string' })
    @ApiQuery({ name: 'entityType', required: false, type: 'string' })
    @ApiQuery({ name: 'action', required: false, type: 'string' })
    async exportAuditLogs(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('entityType') entityType?: string,
        @Query('action') action?: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const csvData = await this.auditLogService.exportToCSV({
            startDate,
            endDate,
            entityType,
            action,
        });

        return {
            success: true,
            data: csvData,
        };
    }
}
