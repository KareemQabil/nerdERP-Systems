/**
 * SalesReport Component
 *
 * Detailed sales report with charts and breakdowns
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Calendar,
    ArrowUpDown,
    Package,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { useReportsStore } from '@/stores/reports.store';
import { cn } from '@/lib/utils';

export function SalesReport() {
    const { language } = useSettingsStore();
    const { salesReport, salesReportLoading, fetchSalesReport, topSellingItems, topItemsLoading } =
        useReportsStore();

    const [chartView, setChartView] = useState<'sales' | 'orders'>('sales');

    // Fetch top items when sales report loads
    useState(() => {
        if (salesReport && topSellingItems.length === 0) {
            fetchSalesReport({ period: 'daily' });
        }
    });

    if (salesReportLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!salesReport) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Package className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">{language === 'ar' ? 'لا توجد بيانات' : 'No data available'}</p>
            </div>
        );
    }

    // Calculate chart data
    const chartData = salesReport.dailyData || salesReport.hourlyData || [];
    const maxValue = Math.max(...chartData.map((d) => (chartView === 'sales' ? d.sales : d.orders)), 1);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                    label={language === 'ar' ? 'إجمالي المبيعات' : 'Gross Sales'}
                    value={salesReport.grossSales}
                    icon={DollarSign}
                    color="text-emerald-400"
                    bgColor="bg-emerald-500/20"
                />
                <SummaryCard
                    label={language === 'ar' ? 'صافي المبيعات' : 'Net Sales'}
                    value={salesReport.netSales}
                    icon={TrendingUp}
                    color="text-cyan-400"
                    bgColor="bg-cyan-500/20"
                />
                <SummaryCard
                    label={language === 'ar' ? 'عدد الطلبات' : 'Orders'}
                    value={salesReport.orderCount}
                    icon={ShoppingBag}
                    color="text-blue-400"
                    bgColor="bg-blue-500/20"
                    isNumber
                />
                <SummaryCard
                    label={language === 'ar' ? 'متوسط الطلب' : 'Avg Ticket'}
                    value={salesReport.avgTicketSize}
                    icon={Calendar}
                    color="text-purple-400"
                    bgColor="bg-purple-500/20"
                />
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Discounts */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-sm text-slate-400 mb-2">
                        {language === 'ar' ? 'الخصومات' : 'Discounts'}
                    </p>
                    <p className="text-xl font-bold text-orange-400">
                        {salesReport.discounts.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </p>
                </div>

                {/* Taxes */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-sm text-slate-400 mb-2">
                        {language === 'ar' ? 'الضرائب' : 'Taxes'}
                    </p>
                    <p className="text-xl font-bold text-yellow-400">
                        {salesReport.taxes.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </p>
                </div>

                {/* Refunds */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                    <p className="text-sm text-slate-400 mb-2">
                        {language === 'ar' ? 'المرتجعات' : 'Refunds'}
                    </p>
                    <p className="text-xl font-bold text-red-400">
                        {salesReport.refunds.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">
                        {language === 'ar' ? 'رسم بياني' : 'Chart'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setChartView('sales')}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                chartView === 'sales'
                                    ? 'bg-cyan-500 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            )}
                        >
                            {language === 'ar' ? 'المبيعات' : 'Sales'}
                        </button>
                        <button
                            onClick={() => setChartView('orders')}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                                chartView === 'orders'
                                    ? 'bg-cyan-500 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            )}
                        >
                            {language === 'ar' ? 'الطلبات' : 'Orders'}
                        </button>
                    </div>
                </div>

                {/* Simple Bar Chart */}
                <div className="h-64 flex items-end gap-1">
                    {chartData.map((data, index) => {
                        const value = chartView === 'sales' ? data.sales : data.orders;
                        const percentage = (value / maxValue) * 100;
                        const label = salesReport.hourlyData
                            ? `${data.hour}:00`
                            : new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        return (
                            <motion.div
                                key={index}
                                initial={{ height: 0 }}
                                animate={{ height: `${percentage}%` }}
                                transition={{ delay: index * 0.02 }}
                                className="flex-1 flex flex-col items-center group"
                            >
                                <div className="relative w-full flex items-end justify-center bg-cyan-500/30 rounded-t hover:bg-cyan-500/50 transition-colors">
                                    <div
                                        className="w-full bg-cyan-500 rounded-t"
                                        style={{ height: `${percentage}%` }}
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 rounded px-2 py-1 whitespace-nowrap z-10">
                                        <p className="text-xs text-slate-300">{label}</p>
                                        <p className="text-sm font-bold text-white">
                                            {typeof value === 'number'
                                                ? value.toLocaleString('en-US', {
                                                      minimumFractionDigits: chartView === 'sales' ? 2 : 0,
                                                      maximumFractionDigits: chartView === 'sales' ? 2 : 0,
                                                  })
                                                : value}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 mt-2 rotate-0 md:-rotate-45 origin-bottom-left truncate w-full text-center">
                                    {label}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                    {language === 'ar' ? 'أكثر المنتجات مبيعاً' : 'Top Selling Items'}
                </h3>
                {topItemsLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
                    </div>
                ) : topSellingItems.length > 0 ? (
                    <div className="space-y-2">
                        {topSellingItems.slice(0, 10).map((item, index) => (
                            <div
                                key={item.productId}
                                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-white">{item.productName}</p>
                                        <p className="text-xs text-slate-400">
                                            {item.quantitySold} {language === 'ar' ? 'مباعة' : 'sold'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-emerald-400">
                                    {item.revenue.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-slate-500 py-8">
                        {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                    </p>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// SUMMARY CARD COMPONENT
// =============================================================================

interface SummaryCardProps {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    isNumber?: boolean;
}

function SummaryCard({ label, value, icon: Icon, color, bgColor, isNumber }: SummaryCardProps) {
    return (
        <div className={cn('p-4 rounded-xl border', bgColor, 'border-current')}>
            <Icon className={cn('w-5 h-5', color)} />
            <p className={cn('text-xl font-bold mt-2', color)}>
                {isNumber
                    ? value.toLocaleString()
                    : value.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                      })}
            </p>
            <p className={cn('text-xs mt-1', color)}>{label}</p>
        </div>
    );
}

export default SalesReport;
