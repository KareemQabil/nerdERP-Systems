/**
 * Audit Trail Page
 *
 * Displays audit log entries with filtering and search capabilities.
 * Shows who did what, when, and with what changes.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    Search,
    Filter,
    Download,
    RefreshCw,
    Eye,
    ChevronDown,
    ChevronUp,
    User,
    Calendar,
    Activity,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { auditService, type AuditLog } from '@/services/audit.service';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

type ActionFilter = 'ALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VOID' | 'PIN_VERIFY' | 'PIN_LOCKOUT';
type DateRange = 'today' | 'week' | 'month' | 'custom';

// =============================================================================
// COMPONENT
// =============================================================================

export default function AuditTrailPage() {
    const { t, language } = useTranslation();
    const { theme } = useSettingsStore();

    // State
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [actionFilter, setActionFilter] = useState<ActionFilter>('ALL');
    const [dateRange, setDateRange] = useState<DateRange>('today');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Expanded log entry
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    // Fetch audit logs
    const fetchAuditLogs = async () => {
        setLoading(true);
        setError(null);

        try {
            const now = new Date();
            let startDate: Date;
            let endDate = now;

            switch (dateRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            }

            const response = await auditService.getAuditLogs({
                startDate,
                endDate,
                action: actionFilter === 'ALL' ? undefined : actionFilter,
                page,
                limit: 50,
            });

            if (response.success && response.data) {
                setLogs(response.data);
                if (response.meta) {
                    setTotalPages(response.meta.totalPages);
                    setTotalCount(response.meta.total);
                }
            } else {
                setLogs([]);
            }
        } catch (err) {
            console.error('[AuditTrailPage] Failed to fetch audit logs:', err);
            setError(language === 'ar' ? 'فشل تحميل السجلات' : 'Failed to load audit logs');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch logs on mount and filter change
    useEffect(() => {
        fetchAuditLogs();
    }, [actionFilter, dateRange, page]);

    // Filter logs by search query
    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            log.userName?.toLowerCase().includes(query) ||
            log.entityType?.toLowerCase().includes(query) ||
            log.action?.toLowerCase().includes(query) ||
            log.changes && JSON.stringify(log.changes).toLowerCase().includes(query)
        );
    });

    // Export logs to CSV
    const handleExport = async () => {
        try {
            const now = new Date();
            let startDate: Date;
            let endDate = now;

            switch (dateRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            }

            const response = await auditService.exportAuditLogs({
                startDate,
                endDate,
                action: actionFilter === 'ALL' ? undefined : actionFilter,
            });

            if (response.success && response.data) {
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('[AuditTrailPage] Failed to export logs:', err);
        }
    };

    // Action filter options
    const actionFilters: Array<{ key: ActionFilter; label: string; labelAr: string }> = [
        { key: 'ALL', label: 'All Actions', labelAr: 'جميع الإجراءات' },
        { key: 'CREATE', label: 'Created', labelAr: 'إنشاء' },
        { key: 'UPDATE', label: 'Updated', labelAr: 'تحديث' },
        { key: 'DELETE', label: 'Deleted', labelAr: 'حذف' },
        { key: 'VOID', label: 'Voided', labelAr: 'إلغاء' },
        { key: 'PIN_VERIFY', label: 'PIN Verify', labelAr: 'التحقق من PIN' },
        { key: 'PIN_LOCKOUT', label: 'Lockout', labelAr: 'قفل الحساب' },
    ];

    // Date range options
    const dateRanges: Array<{ key: DateRange; label: string; labelAr: string }> = [
        { key: 'today', label: 'Today', labelAr: 'اليوم' },
        { key: 'week', label: 'This Week', labelAr: 'هذا الأسبوع' },
        { key: 'month', label: 'This Month', labelAr: 'هذا الشهر' },
    ];

    return (
        <div className="h-full flex flex-col bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {language === 'ar' ? 'سجل التدقيق' : 'Audit Trail'}
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            {language === 'ar' ? 'تتبع جميع الإجراءات والأحداث' : 'Track all actions and events'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={fetchAuditLogs}>
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        {language === 'ar' ? 'تصدير' : 'Export'}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-700/50 bg-slate-800/30">
                {/* Search */}
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            'w-full pl-10 pr-4 py-2 rounded-lg text-sm',
                            'bg-slate-700/50 border border-slate-600',
                            'text-white placeholder:text-slate-400',
                            'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                        )}
                    />
                </div>

                {/* Action Filter */}
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value as ActionFilter);
                            setPage(1);
                        }}
                        className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium',
                            'bg-slate-700/50 border border-slate-600',
                            'text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                        )}
                    >
                        {actionFilters.map((filter) => (
                            <option key={filter.key} value={filter.key}>
                                {language === 'ar' ? filter.labelAr : filter.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                    {dateRanges.map((range) => (
                        <button
                            key={range.key}
                            onClick={() => {
                                setDateRange(range.key);
                                setPage(1);
                            }}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                                dateRange === range.key
                                    ? 'bg-purple-500 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            )}
                        >
                            {language === 'ar' ? range.labelAr : range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 mb-4">
                            <Shield className="w-12 h-12 text-red-400" />
                        </div>
                        <p className="text-red-400 font-medium">{error}</p>
                        <Button
                            variant="secondary"
                            className="mt-4"
                            onClick={fetchAuditLogs}
                        >
                            {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                        </Button>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center h-full">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full"
                        />
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-4">
                            <Activity className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-slate-400 font-medium">
                            {searchQuery
                                ? language === 'ar'
                                    ? 'لا توجد نتائج'
                                    : 'No results found'
                                : language === 'ar'
                                    ? 'لا توجد سجلات'
                                    : 'No audit logs found'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Results count */}
                        <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                            <span>
                                {language === 'ar'
                                    ? `عرض ${filteredLogs.length} من ${totalCount} سجل`
                                    : `Showing ${filteredLogs.length} of ${totalCount} logs`}
                            </span>
                        </div>

                        {/* Log entries */}
                        {filteredLogs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    'rounded-xl border overflow-hidden',
                                    'bg-slate-800/50 border-slate-700/50',
                                    'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-200',
                                )}
                                data-theme={theme}
                            >
                                {/* Summary row */}
                                <div
                                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                >
                                    {/* Action badge */}
                                    <div
                                        className={cn(
                                            'px-2 py-1 rounded text-xs font-bold',
                                            auditService.getActionColor(log.action) === 'green' && 'bg-green-500/20 text-green-400',
                                            auditService.getActionColor(log.action) === 'blue' && 'bg-blue-500/20 text-blue-400',
                                            auditService.getActionColor(log.action) === 'red' && 'bg-red-500/20 text-red-400',
                                            auditService.getActionColor(log.action) === 'orange' && 'bg-orange-500/20 text-orange-400',
                                            auditService.getActionColor(log.action) === 'gray' && 'bg-gray-500/20 text-gray-400',
                                        )}
                                    >
                                        {auditService.getActionDisplayName(log.action, language as 'en' | 'ar')}
                                    </div>

                                    {/* Entity */}
                                    <div className="flex-1">
                                        <span className="text-white font-medium">
                                            {log.entityType || 'Unknown'}
                                        </span>
                                        {log.entityId && (
                                            <span className="text-slate-400 text-sm ml-2">
                                                #{log.entityId.slice(0, 8)}
                                            </span>
                                        )}
                                    </div>

                                    {/* User */}
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <User className="w-4 h-4" />
                                        <span>{log.userName || 'Unknown User'}</span>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {new Date(log.createdAt).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>

                                    {/* Expand icon */}
                                    {expandedLogId === log.id ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>

                                {/* Expanded details */}
                                {expandedLogId === log.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="px-4 pb-4 border-t border-slate-700/50 pt-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            {/* IP Address */}
                                            {log.ipAddress && (
                                                <div>
                                                    <span className="text-slate-400">
                                                        {language === 'ar' ? 'عنوان IP' : 'IP Address'}:
                                                    </span>
                                                    <span className="text-white ml-2">{log.ipAddress}</span>
                                                </div>
                                            )}

                                            {/* User Agent */}
                                            {log.userAgent && (
                                                <div>
                                                    <span className="text-slate-400">
                                                        {language === 'ar' ? 'المتصفح' : 'Browser'}:
                                                    </span>
                                                    <span className="text-white ml-2 truncate max-w-xs inline-block">
                                                        {log.userAgent}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Changes */}
                                        <div className="mt-3">
                                            <span className="text-slate-400 text-sm">
                                                {language === 'ar' ? 'التغييرات:' : 'Changes:'}
                                            </span>
                                            <pre className="mt-2 p-3 rounded-lg bg-slate-900/50 text-xs text-slate-300 overflow-auto max-h-40">
                                                {JSON.stringify(log.changes, null, 2)}
                                            </pre>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            {language === 'ar' ? 'السابق' : 'Previous'}
                        </Button>
                        <span className="text-slate-400 text-sm">
                            {language === 'ar' ? 'صفحة' : 'Page'} {page} {language === 'ar' ? 'من' : 'of'} {totalPages}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            {language === 'ar' ? 'التالي' : 'Next'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
