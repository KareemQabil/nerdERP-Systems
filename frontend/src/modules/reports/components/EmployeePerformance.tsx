/**
 * EmployeePerformance Component
 *
 * Employee performance metrics and leaderboard
 */
import { User, TrendingUp, Award, AlertTriangle, DollarSign } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { useReportsStore } from '@/stores/reports.store';
import { cn } from '@/lib/utils';

export function EmployeePerformance() {
    const { language } = useSettingsStore();
    const { employeePerformance, employeePerformanceLoading } = useReportsStore();

    if (employeePerformanceLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (employeePerformance.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <User className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">{language === 'ar' ? 'لا توجد بيانات' : 'No data available'}</p>
            </div>
        );
    }

    // Sort by total sales
    const sortedEmployees = [...employeePerformance].sort((a, b) => b.totalSales - a.totalSales);

    const topPerformer = sortedEmployees[0];
    const avgOrderValue = employeePerformance.reduce((sum, e) => sum + e.avgOrderValue, 0) / employeePerformance.length;
    const avgVoidRate = employeePerformance.reduce((sum, e) => sum + e.voidRate, 0) / employeePerformance.length;

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    label={language === 'ar' ? 'أفضل موظف' : 'Top Performer'}
                    value={topPerformer.userName}
                    subValue={`${topPerformer.totalSales.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    })} ${language === 'ar' ? 'ريال' : 'SAR'}`}
                    icon={Award}
                    color="text-yellow-400"
                    bgColor="bg-yellow-500/20"
                />
                <StatCard
                    label={language === 'ar' ? 'متوسط الطلب' : 'Avg Order Value'}
                    value={avgOrderValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                    icon={DollarSign}
                    color="text-emerald-400"
                    bgColor="bg-emerald-500/20"
                />
                <StatCard
                    label={language === 'ar' ? 'متوسط معدل الإلغاء' : 'Avg Void Rate'}
                    value={`${avgVoidRate.toFixed(1)}%`}
                    icon={TrendingUp}
                    color="text-cyan-400"
                    bgColor="bg-cyan-500/20"
                />
            </div>

            {/* Employee Leaderboard */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                    {language === 'ar' ? 'لوحة الصدارة' : 'Leaderboard'}
                </h3>
                <div className="space-y-3">
                    {sortedEmployees.map((employee, index) => {
                        const isTop = index === 0;
                        const voidRateHigh = employee.voidRate > 5;

                        return (
                            <div
                                key={employee.userId}
                                className={cn(
                                    'flex items-center justify-between p-4 rounded-xl border transition-all',
                                    isTop
                                        ? 'bg-yellow-500/10 border-yellow-500/30'
                                        : 'bg-slate-700/30 border-slate-700/50'
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Rank */}
                                    <div
                                        className={cn(
                                            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                                            isTop
                                                ? 'bg-yellow-500 text-black'
                                                : index === 1
                                                ? 'bg-slate-400 text-black'
                                                : index === 2
                                                ? 'bg-orange-600 text-white'
                                                : 'bg-slate-600 text-slate-300'
                                        )}
                                    >
                                        {index + 1}
                                    </div>

                                    {/* Avatar */}
                                    <div
                                        className={cn(
                                            'flex items-center justify-center w-10 h-10 rounded-full',
                                            isTop ? 'bg-yellow-500/20' : 'bg-slate-600'
                                        )}
                                    >
                                        <User className={cn('w-5 h-5', isTop ? 'text-yellow-400' : 'text-slate-400')} />
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <p className="text-white font-medium">{employee.userName}</p>
                                        <p className="text-xs text-slate-400">
                                            {employee.role} • {employee.ordersProcessed}{' '}
                                            {language === 'ar' ? 'طلب' : 'orders'}
                                        </p>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">
                                            {language === 'ar' ? 'مبيعات' : 'Sales'}
                                        </p>
                                        <p className="text-lg font-bold text-emerald-400">
                                            {employee.totalSales.toLocaleString('en-US', {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">
                                            {language === 'ar' ? 'متوسط الطلب' : 'Avg'}
                                        </p>
                                        <p className="text-sm font-medium text-white">
                                            {employee.avgOrderValue.toLocaleString('en-US', {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">
                                            {language === 'ar' ? 'إلغاء' : 'Void'}
                                        </p>
                                        <p
                                            className={cn(
                                                'text-sm font-medium',
                                                voidRateHigh ? 'text-red-400' : 'text-slate-300'
                                            )}
                                        >
                                            {employee.voidRate.toFixed(1)}%
                                        </p>
                                    </div>
                                    {voidRateHigh && (
                                        <AlertTriangle className="w-4 h-4 text-red-400" title="High void rate" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detailed Metrics Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50 bg-slate-800/50">
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                                    {language === 'ar' ? 'الموظف' : 'Employee'}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                                    {language === 'ar' ? 'الطلبات' : 'Orders'}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                                    {language === 'ar' ? 'المبيعات' : 'Sales'}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                                    {language === 'ar' ? 'متوسط الطلب' : 'Avg Order'}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                                    {language === 'ar' ? 'الإلغاءات' : 'Voids'}
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">
                                    {language === 'ar' ? 'الخصومات' : 'Discounts'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedEmployees.map((employee) => (
                                <tr key={employee.userId} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-600">
                                                <User className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{employee.userName}</p>
                                                <p className="text-xs text-slate-500">{employee.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-white">{employee.ordersProcessed}</td>
                                    <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                                        {employee.totalSales.toLocaleString('en-US', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-right text-white">
                                        {employee.avgOrderValue.toLocaleString('en-US', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span
                                            className={cn(
                                                'text-sm font-medium',
                                                employee.voidRate > 5 ? 'text-red-400' : 'text-slate-300'
                                            )}
                                        >
                                            {employee.voidCount} ({employee.voidRate.toFixed(1)}%)
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-white">
                                        {employee.discountCount > 0 ? (
                                            <span>
                                                {employee.discountCount} (
                                                {employee.discountTotal.toLocaleString('en-US', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                })})
                                            </span>
                                        ) : (
                                            <span className="text-slate-500">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

interface StatCardProps {
    label: string;
    value: string;
    subValue?: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

function StatCard({ label, value, subValue, icon: Icon, color, bgColor }: StatCardProps) {
    return (
        <div className={cn('p-4 rounded-xl border', bgColor, 'border-current')}>
            <div className="flex items-start justify-between">
                <div className={cn('p-2 rounded-lg', bgColor)}>
                    <Icon className={cn('w-5 h-5', color)} />
                </div>
            </div>
            <p className={cn('text-xl font-bold mt-3', color)}>{value}</p>
            <p className={cn('text-xs mt-1', color)}>{label}</p>
            {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
    );
}

export default EmployeePerformance;
