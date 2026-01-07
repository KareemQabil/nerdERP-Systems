/**
 * Reports Dashboard Page
 *
 * Main dashboard for sales, void, and employee performance reports
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Users,
    AlertTriangle,
    FileText,
    Calendar,
    RefreshCw,
    BarChart3,
    PieChart,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { useReportsStore } from '@/stores/reports.store';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SalesReport } from '../components/SalesReport';
import { VoidReport } from '../components/VoidReport';
import { EmployeePerformance } from '../components/EmployeePerformance';

// =============================================================================
// TYPES
// =============================================================================

type ReportTab = 'overview' | 'sales' | 'voids' | 'employees';

// =============================================================================
// COMPONENT
// =============================================================================

export default function ReportsDashboard() {
    const { language } = useSettingsStore();
    const {
        salesReport,
        salesReportLoading,
        voidReport,
        voidReportLoading,
        employeePerformance,
        employeePerformanceLoading,
        fetchSalesReport,
        fetchVoidReport,
        fetchEmployeePerformance,
    } = useReportsStore();

    const [activeTab, setActiveTab] = useState<ReportTab>('overview');
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');

    // Fetch reports on mount and date range change
    useEffect(() => {
        const fetchReports = async () => {
            const now = new Date();
            let fromDate: string;
            let toDate = now.toISOString().split('T')[0];

            switch (dateRange) {
                case 'today':
                    fromDate = toDate;
                    break;
                case 'week':
                    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0];
                    break;
                case 'month':
                    fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0];
                    break;
                default:
                    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0];
            }

            await Promise.all([
                fetchSalesReport({ fromDate, toDate, period: dateRange === 'today' ? 'hourly' : 'daily' }),
                fetchVoidReport({ fromDate, toDate }),
                fetchEmployeePerformance({ fromDate, toDate }),
            ]);
        };

        fetchReports().catch(console.error);
    }, [dateRange, fetchSalesReport, fetchVoidReport, fetchEmployeePerformance]);

    // Calculate overview stats
    const overviewStats = salesReport
        ? [
              {
                  label: language === 'ar' ? 'إجمالي المبيعات' : 'Gross Sales',
                  value: salesReport.grossSales,
                  icon: DollarSign,
                  color: 'text-emerald-400',
                  bgColor: 'bg-emerald-500/20',
              },
              {
                  label: language === 'ar' ? 'صافي المبيعات' : 'Net Sales',
                  value: salesReport.netSales,
                  icon: TrendingUp,
                  color: 'text-cyan-400',
                  bgColor: 'bg-cyan-500/20',
              },
              {
                  label: language === 'ar' ? 'عدد الطلبات' : 'Orders',
                  value: salesReport.orderCount,
                  icon: ShoppingBag,
                  color: 'text-blue-400',
                  bgColor: 'bg-blue-500/20',
              },
              {
                  label: language === 'ar' ? 'متوسط الطلب' : 'Avg Ticket',
                  value: salesReport.avgTicketSize,
                  icon: FileText,
                  color: 'text-purple-400',
                  bgColor: 'bg-purple-500/20',
              },
          ]
        : [];

    const tabs: Array<{ key: ReportTab; label: string; labelAr: string; icon: any }> = [
        { key: 'overview', label: 'Overview', labelAr: 'نظرة عامة', icon: BarChart3 },
        { key: 'sales', label: 'Sales', labelAr: 'المبيعات', icon: DollarSign },
        { key: 'voids', label: 'Voids', labelAr: 'الإلغاءات', icon: AlertTriangle },
        { key: 'employees', label: 'Employees', labelAr: 'الموظفين', icon: Users },
    ];

    return (
        <div className="h-full flex flex-col bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {language === 'ar' ? 'التقارير والتحليلات' : 'Reports & Analytics'}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {language === 'ar' ? 'رؤى شاملة حول الأداء والمبيعات' : 'Comprehensive insights on performance and sales'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                        {(['today', 'week', 'month'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={cn(
                                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                                    dateRange === range
                                        ? 'bg-cyan-500 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                )}
                            >
                                {range === 'today'
                                    ? language === 'ar'
                                        ? 'اليوم'
                                        : 'Today'
                                    : range === 'week'
                                    ? language === 'ar'
                                        ? 'أسبوع'
                                        : 'Week'
                                    : language === 'ar'
                                    ? 'شهر'
                                    : 'Month'}
                            </button>
                        ))}
                    </div>

                    <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-6 py-3 border-b border-slate-700/50 bg-slate-800/30">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                activeTab === tab.key
                                    ? 'bg-cyan-500 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{language === 'ar' ? tab.labelAr : tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {overviewStats.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={stat.label}
                                        className={cn('p-4 rounded-xl border', stat.bgColor, 'border-current')}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                                                <Icon className={cn('w-5 h-5', stat.color)} />
                                            </div>
                                        </div>
                                        <p className={cn('text-2xl font-bold mt-3', stat.color)}>
                                            {typeof stat.value === 'number'
                                                ? stat.value.toLocaleString('en-US', {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                  })
                                                : stat.value}
                                        </p>
                                        <p className={cn('text-sm mt-1', stat.color)}>{stat.label}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Payment Breakdown */}
                        {salesReport && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <PaymentBreakdownCard
                                    breakdown={salesReport.paymentBreakdown}
                                    language={language}
                                />
                                <OrderTypeBreakdownCard
                                    breakdown={salesReport.orderTypeBreakdown}
                                    language={language}
                                />
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'sales' && <SalesReport />}

                {activeTab === 'voids' && <VoidReport />}

                {activeTab === 'employees' && <EmployeePerformance />}
            </div>
        </div>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface PaymentBreakdownCardProps {
    breakdown: Record<string, number>;
    language: string;
}

function PaymentBreakdownCard({ breakdown, language }: PaymentBreakdownCardProps) {
    const paymentLabels: Record<string, { label: string; labelAr: string; color: string }> = {
        CASH: { label: 'Cash', labelAr: 'نقدي', color: 'bg-emerald-500' },
        CARD: { label: 'Card', labelAr: 'بطاقة', color: 'bg-blue-500' },
        MOBILE: { label: 'Mobile', labelAr: 'موبايل', color: 'bg-purple-500' },
        BANK_TRANSFER: { label: 'Bank Transfer', labelAr: 'تحويل بنكي', color: 'bg-orange-500' },
        GIFT_CARD: { label: 'Gift Card', labelAr: 'بطاقة هدايا', color: 'bg-pink-500' },
    };

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <h3 className="text-lg font-bold text-white mb-4">
                {language === 'ar' ? 'طرق الدفع' : 'Payment Methods'}
            </h3>
            <div className="space-y-3">
                {Object.entries(breakdown).map(([method, amount]) => {
                    const config = paymentLabels[method];
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    return (
                        <div key={method} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-300">{language === 'ar' ? config.labelAr : config.label}</span>
                                <span className="text-white font-medium">
                                    {amount.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full', config.color)}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface OrderTypeBreakdownCardProps {
    breakdown: Record<string, number>;
    language: string;
}

function OrderTypeBreakdownCard({ breakdown, language }: OrderTypeBreakdownCardProps) {
    const typeLabels: Record<string, { label: string; labelAr: string; color: string }> = {
        DINE_IN: { label: 'Dine In', labelAr: 'في المطعم', color: 'bg-cyan-500' },
        TAKEAWAY: { label: 'Takeaway', labelAr: 'سفري', color: 'bg-blue-500' },
        DELIVERY: { label: 'Delivery', labelAr: 'توصيل', color: 'bg-green-500' },
        PICKUP: { label: 'Pickup', labelAr: 'استلام', color: 'bg-yellow-500' },
        DRIVE_THRU: { label: 'Drive Thru', labelAr: 'درايف ثرو', color: 'bg-purple-500' },
    };

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <h3 className="text-lg font-bold text-white mb-4">
                {language === 'ar' ? 'أنواع الطلبات' : 'Order Types'}
            </h3>
            <div className="space-y-3">
                {Object.entries(breakdown).map(([type, amount]) => {
                    const config = typeLabels[type];
                    const percentage = total > 0 ? (amount / total) * 100 : 0;
                    return (
                        <div key={type} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-300">{language === 'ar' ? config.labelAr : config.label}</span>
                                <span className="text-white font-medium">
                                    {amount.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full', config.color)}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
