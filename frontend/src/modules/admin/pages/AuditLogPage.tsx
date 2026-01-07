/**
 * AuditLogPage Component
 *
 * Comprehensive audit log dashboard for tracking all system events.
 *
 * Features:
 * - Filterable audit log table
 * - Entity history view
 * - User activity timeline
 * - Void operations report
 * - Security report
 * - Export to CSV
 */

import { useState, useEffect, useCallback } from 'react';
import { auditService, AuditLog, VoidReport, SecurityReport } from '@/services/audit.service';

interface FilterState {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate: string;
    endDate: string;
}

interface PaginationState {
    page: number;
    limit: number;
    total: number;
}

const entityTypes = [
    'SalesOrder',
    'Product',
    'User',
    'Customer',
    'Warehouse',
    'StockMove',
    'StockTransfer',
];

const actions = [
    'CREATE',
    'UPDATE',
    'DELETE',
    'VOID',
    'LOGIN',
    'LOGOUT',
    'PIN_VERIFY',
    'PIN_LOCKOUT',
];

export function AuditLogPage() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'logs' | 'entity' | 'timeline' | 'void' | 'security'>('logs');
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 50,
        total: 0,
    });

    // Filters
    const [filters, setFilters] = useState<FilterState>({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
    });

    // Entity history state
    const [entityType, setEntityType] = useState('SalesOrder');
    const [entityId, setEntityId] = useState('');
    const [entityHistory, setEntityHistory] = useState<AuditLog[]>([]);

    // User timeline state
    const [userId, setUserId] = useState('');
    const [userTimeline, setUserTimeline] = useState<AuditLog[]>([]);

    // Reports
    const [voidReport, setVoidReport] = useState<VoidReport | null>(null);
    const [securityReport, setSecurityReport] = useState<SecurityReport | null>(null);

    // Fetch audit logs
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await auditService.getAuditLogs({
                ...filters,
                page: pagination.page,
                limit: pagination.limit,
            });

            if (response.success && response.data) {
                setLogs(response.data);
                setPagination((prev) => ({
                    ...prev,
                    total: response.meta?.total || 0,
                }));
            }
        } catch (error) {
            console.error('[AuditLogPage] Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.limit]);

    // Fetch entity history
    const fetchEntityHistory = useCallback(async () => {
        if (!entityId) return;

        setLoading(true);
        try {
            const response = await auditService.getEntityHistory(entityType, entityId);
            if (response.success && response.data) {
                setEntityHistory(response.data);
            }
        } catch (error) {
            console.error('[AuditLogPage] Failed to fetch entity history:', error);
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId]);

    // Fetch user timeline
    const fetchUserTimeline = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const response = await auditService.getUserTimeline(userId, {
                startDate: filters.startDate,
                endDate: filters.endDate,
            });
            if (response.success && response.data) {
                setUserTimeline(response.data);
            }
        } catch (error) {
            console.error('[AuditLogPage] Failed to fetch user timeline:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, filters.startDate, filters.endDate]);

    // Fetch void report
    const fetchVoidReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await auditService.getVoidReport(filters.startDate, filters.endDate);
            if (response.success && response.data) {
                setVoidReport(response.data);
            }
        } catch (error) {
            console.error('[AuditLogPage] Failed to fetch void report:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate]);

    // Fetch security report
    const fetchSecurityReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await auditService.getSecurityReport(
                filters.startDate,
                filters.endDate,
            );
            if (response.success && response.data) {
                setSecurityReport(response.data);
            }
        } catch (error) {
            console.error('[AuditLogPage] Failed to fetch security report:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate]);

    // Export to CSV
    const exportToCSV = useCallback(async () => {
        try {
            const response = await auditService.exportAuditLogs(filters);
            if (response.success && response.data) {
                // Create download link
                const blob = new Blob([response.data], { type: 'text/csv' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `audit-logs-${filters.startDate}-${filters.endDate}.csv`;
                link.click();
            }
        } catch (error) {
            console.error('[AuditLogPage] Failed to export:', error);
        }
    }, [filters]);

    // Load data based on active tab
    useEffect(() => {
        switch (activeTab) {
            case 'logs':
                fetchLogs();
                break;
            case 'entity':
                if (entityId) fetchEntityHistory();
                break;
            case 'timeline':
                if (userId) fetchUserTimeline();
                break;
            case 'void':
                fetchVoidReport();
                break;
            case 'security':
                fetchSecurityReport();
                break;
        }
    }, [activeTab, fetchLogs, fetchEntityHistory, fetchUserTimeline, fetchVoidReport, fetchSecurityReport, entityId, userId]);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {document.documentElement.dir === 'rtl' ? 'سجل التدقيق' : 'Audit Logs'}
                </h1>
                <p className="text-gray-600 mt-1">
                    {document.documentElement.dir === 'rtl'
                        ? 'تتبع جميع الأحداث والعمليات في النظام'
                        : 'Track all system events and operations'}
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'logs'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {document.documentElement.dir === 'rtl' ? 'سجل الأحداث' : 'Event Logs'}
                    </button>
                    <button
                        onClick={() => setActiveTab('entity')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'entity'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {document.documentElement.dir === 'rtl' ? 'تاريخ الكيان' : 'Entity History'}
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'timeline'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {document.documentElement.dir === 'rtl' ? 'الجدول الزمني للمستخدم' : 'User Timeline'}
                    </button>
                    <button
                        onClick={() => setActiveTab('void')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'void'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {document.documentElement.dir === 'rtl' ? 'تقرير الإلغاء' : 'Void Report'}
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'security'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {document.documentElement.dir === 'rtl' ? 'تقرير الأمن' : 'Security Report'}
                    </button>
                </nav>
            </div>

            {/* Filters */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-gray-700 mb-1">
                            {document.documentElement.dir === 'rtl' ? 'من تاريخ:' : 'From:'}
                        </label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-gray-700 mb-1">
                            {document.documentElement.dir === 'rtl' ? 'إلى تاريخ:' : 'To:'}
                        </label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                    </div>

                    {activeTab === 'logs' && (
                        <>
                            <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-700 mb-1">
                                    {document.documentElement.dir === 'rtl' ? 'نوع الكيان:' : 'Entity Type:'}
                                </label>
                                <select
                                    value={filters.entityType || ''}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            entityType: e.target.value || undefined,
                                        }))
                                    }
                                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                                >
                                    <option value="">
                                        {document.documentElement.dir === 'rtl' ? 'الكل' : 'All'}
                                    </option>
                                    {entityTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-700 mb-1">
                                    {document.documentElement.dir === 'rtl' ? 'الإجراء:' : 'Action:'}
                                </label>
                                <select
                                    value={filters.action || ''}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            action: e.target.value || undefined,
                                        }))
                                    }
                                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                                >
                                    <option value="">
                                        {document.documentElement.dir === 'rtl' ? 'الكل' : 'All'}
                                    </option>
                                    {actions.map((action) => (
                                        <option key={action} value={action}>
                                            {action}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {activeTab === 'entity' && (
                        <>
                            <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-700 mb-1">
                                    {document.documentElement.dir === 'rtl' ? 'نوع الكيان:' : 'Entity Type:'}
                                </label>
                                <select
                                    value={entityType}
                                    onChange={(e) => setEntityType(e.target.value)}
                                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                                >
                                    {entityTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-medium text-gray-700 mb-1">
                                    {document.documentElement.dir === 'rtl' ? 'معرف الكيان:' : 'Entity ID:'}
                                </label>
                                <input
                                    type="text"
                                    value={entityId}
                                    onChange={(e) => setEntityId(e.target.value)}
                                    placeholder={document.documentElement.dir === 'rtl' ? 'أدخل المعرف...' : 'Enter ID...'}
                                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-700 mb-1">
                                {document.documentElement.dir === 'rtl' ? 'معرف المستخدم:' : 'User ID:'}
                            </label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder={document.documentElement.dir === 'rtl' ? 'أدخل المعرف...' : 'Enter ID...'}
                                className="border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    <button
                        onClick={exportToCSV}
                        className="ml-auto px-4 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                    >
                        {document.documentElement.dir === 'rtl' ? 'تصدير CSV' : 'Export CSV'}
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Event Logs Tab */}
            {activeTab === 'logs' && !loading && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'التاريخ' : 'Date'}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'المستخدم' : 'User'}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'الإجراء' : 'Action'}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'الكيان' : 'Entity'}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'التفاصيل' : 'Details'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {log.userName || log.userId}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded ${
                                                    log.action === 'CREATE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : log.action === 'UPDATE'
                                                          ? 'bg-blue-100 text-blue-800'
                                                          : log.action === 'DELETE'
                                                            ? 'bg-red-100 text-red-800'
                                                            : log.action === 'VOID'
                                                              ? 'bg-orange-100 text-orange-800'
                                                              : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {log.entityType}
                                            {log.entityId && (
                                                <span className="text-gray-500">:{log.entityId.slice(0, 8)}...</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                                            {JSON.stringify(log.changes).slice(0, 100)}
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-sm text-gray-500"
                                        >
                                            {document.documentElement.dir === 'rtl'
                                                ? 'لا توجد سجلات'
                                                : 'No logs found'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.total > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                {document.documentElement.dir === 'rtl'
                                    ? `عرض ${1 + (pagination.page - 1) * pagination.limit}-${Math.min(
                                          pagination.page * pagination.limit,
                                          pagination.total,
                                      )} من ${pagination.total}`
                                    : `Showing ${1 + (pagination.page - 1) * pagination.limit}-${Math.min(
                                          pagination.page * pagination.limit,
                                          pagination.total,
                                      )} of ${pagination.total}`}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                                    }
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                >
                                    {document.documentElement.dir === 'rtl' ? 'السابق' : 'Previous'}
                                </button>
                                <button
                                    onClick={() =>
                                        setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                                    }
                                    disabled={pagination.page * pagination.limit >= pagination.total}
                                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                                >
                                    {document.documentElement.dir === 'rtl' ? 'التالي' : 'Next'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Entity History Tab */}
            {activeTab === 'entity' && !loading && entityHistory.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {document.documentElement.dir === 'rtl' ? 'تاريخ الكيان' : 'Entity History'} -{' '}
                        {entityType}
                    </h2>
                    <div className="space-y-4">
                        {entityHistory.map((log) => (
                            <div key={log.id} className="border-l-4 border-blue-500 pl-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <span className="font-medium">{log.action}</span>
                                    <span>•</span>
                                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                                    <span>•</span>
                                    <span>{log.userName}</span>
                                </div>
                                <div className="text-sm text-gray-900">
                                    <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
                                        {JSON.stringify(log.changes, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User Timeline Tab */}
            {activeTab === 'timeline' && !loading && userTimeline.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {document.documentElement.dir === 'rtl' ? 'الجدول الزمني للمستخدم' : 'User Timeline'}
                    </h2>
                    <div className="space-y-4">
                        {userTimeline.map((log) => (
                            <div key={log.id} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <div className="w-0.5 flex-1 bg-gray-200"></div>
                                </div>
                                <div className="flex-1 pb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                        <span className="font-medium">{log.action}</span>
                                        <span>•</span>
                                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="text-sm text-gray-900">
                                        {log.entityType}
                                        {log.entityId && <span> ({log.entityId.slice(0, 8)}...)</span>}
                                    </div>
                                    {log.changes && Object.keys(log.changes).length > 0 && (
                                        <pre className="bg-gray-50 p-2 rounded mt-2 text-xs overflow-x-auto">
                                            {JSON.stringify(log.changes, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Void Report Tab */}
            {activeTab === 'void' && !loading && voidReport && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {document.documentElement.dir === 'rtl' ? 'تقرير عمليات الإلغاء' : 'Void Operations Report'}
                    </h2>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-gray-600">
                                {document.documentElement.dir === 'rtl' ? 'إجمالي الإلغاءات' : 'Total Voids'}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-orange-600">{voidReport.totalVoids}</dd>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-gray-600">
                                {document.documentElement.dir === 'rtl' ? 'إجمالي المبلغ' : 'Total Amount'}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-red-600">
                                {voidReport.totalAmount.toFixed(2)} SAR
                            </dd>
                        </div>
                    </dl>

                    <h3 className="text-md font-semibold mb-3">
                        {document.documentElement.dir === 'rtl' ? 'بالسبب' : 'By Reason'}
                    </h3>
                    <div className="overflow-x-auto mb-6">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'السبب' : 'Reason'}
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'العدد' : 'Count'}
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'المبلغ' : 'Amount'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {voidReport.byReason.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 text-sm">{item.reason}</td>
                                        <td className="px-4 py-2 text-sm text-right">{item.count}</td>
                                        <td className="px-4 py-2 text-sm text-right">{item.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h3 className="text-md font-semibold mb-3">
                        {document.documentElement.dir === 'rtl' ? 'بواسطة المستخدم' : 'By User'}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'المستخدم' : 'User'}
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'العدد' : 'Count'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {voidReport.byUser.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 text-sm">{item.userName}</td>
                                        <td className="px-4 py-2 text-sm text-right">{item.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Security Report Tab */}
            {activeTab === 'security' && !loading && securityReport && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {document.documentElement.dir === 'rtl' ? 'تقرير الأحداث الأمنية' : 'Security Events Report'}
                    </h2>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-red-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-gray-600">
                                {document.documentElement.dir === 'rtl' ? 'محاولات PIN الفاشلة' : 'Failed PIN Attempts'}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-red-600">
                                {securityReport.failedPinAttempts}
                            </dd>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-gray-600">
                                {document.documentElement.dir === 'rtl' ? 'الحسابات المقفلة' : 'Account Lockouts'}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-orange-600">
                                {securityReport.accountLockouts}
                            </dd>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-gray-600">
                                {document.documentElement.dir === 'rtl' ? 'محاولات الدخول غير المصرح' : 'Unauthorized Attempts'}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-yellow-600">
                                {securityReport.unauthorizedAttempts}
                            </dd>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-gray-600">
                                {document.documentElement.dir === 'rtl' ? 'عمليات التحقق الناجحة' : 'Successful Verifications'}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-blue-600">
                                {securityReport.successfulVerifications}
                            </dd>
                        </div>
                    </dl>
                </div>
            )}
        </div>
    );
}

export default AuditLogPage;
