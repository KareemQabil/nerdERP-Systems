/**
 * VoidReport Component
 *
 * Detailed void report with breakdowns by reason and user
 */
import { AlertTriangle, User, FileText, XCircle } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { useReportsStore } from '@/stores/reports.store';
import { cn } from '@/lib/utils';

export function VoidReport() {
    const { language } = useSettingsStore();
    const { voidReport, voidReportLoading } = useReportsStore();

    if (voidReportLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!voidReport) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <XCircle className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">{language === 'ar' ? 'لا توجد بيانات' : 'No data available'}</p>
            </div>
        );
    }

    const hasVoids = voidReport.voidedItems.length > 0 || voidReport.voidedOrders.length > 0;

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-red-500/20">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-red-400">
                                {language === 'ar' ? 'إجمالي قيمة الإلغاءات' : 'Total Void Value'}
                            </p>
                            <p className="text-2xl font-bold text-red-400">
                                {voidReport.totalVoidValue.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{voidReport.voidedItems.length}</p>
                            <p className="text-xs text-slate-400">
                                {language === 'ar' ? 'عناصر ملغاة' : 'Voided Items'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{voidReport.voidedOrders.length}</p>
                            <p className="text-xs text-slate-400">
                                {language === 'ar' ? 'طلبات ملغاة' : 'Voided Orders'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {!hasVoids ? (
                <div className="flex flex-col items-center justify-center h-64 text-emerald-400">
                    <AlertTriangle className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">{language === 'ar' ? 'لا توجد إلغاءات' : 'No voids recorded'}</p>
                    <p className="text-sm mt-2">
                        {language === 'ar' ? 'أداء ممتاز!' : 'Excellent performance!'}
                    </p>
                </div>
            ) : (
                <>
                    {/* By Reason */}
                    {Object.keys(voidReport.byReason).length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">
                                {language === 'ar' ? 'الإلغاءات حسب السبب' : 'Voids by Reason'}
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(voidReport.byReason)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([reason, value]) => (
                                        <div
                                            key={reason}
                                            className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                                        >
                                            <span className="text-white">{reason}</span>
                                            <span className="text-red-400 font-bold">
                                                {value.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* By User */}
                    {voidReport.byUser.length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">
                                {language === 'ar' ? 'الإلغاءات حسب الموظف' : 'Voids by User'}
                            </h3>
                            <div className="space-y-3">
                                {voidReport.byUser.map((user) => (
                                    <div
                                        key={user.userId}
                                        className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-slate-600">
                                                <User className="w-4 h-4 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{user.userName}</p>
                                                <p className="text-xs text-slate-400">
                                                    {user.voidCount} {language === 'ar' ? 'إلغاءات' : 'voids'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-red-400 font-bold">
                                            {user.voidValue.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Voided Orders */}
                    {voidReport.voidedOrders.length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">
                                {language === 'ar' ? 'الطلبات الملغاة' : 'Voided Orders'}
                            </h3>
                            <div className="space-y-2">
                                {voidReport.voidedOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-white font-medium">#{order.orderNumber}</p>
                                                <p className="text-xs text-slate-400">
                                                    {order.voidedBy} • {new Date(order.voidedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-red-400 font-bold">
                                                {order.total.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                            <p className="text-xs text-slate-400">{order.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Voided Items */}
                    {voidReport.voidedItems.length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                            <h3 className="text-lg font-bold text-white mb-4">
                                {language === 'ar' ? 'العناصر الملغاة' : 'Voided Items'}
                            </h3>
                            <div className="space-y-2">
                                {voidReport.voidedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{item.productName}</p>
                                            <p className="text-xs text-slate-400">
                                                #{item.orderNumber} • {item.voidedBy}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-red-400 font-bold">
                                                {item.lineTotal.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {item.quantity} {language === 'ar' ? 'وحدة' : 'units'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default VoidReport;
