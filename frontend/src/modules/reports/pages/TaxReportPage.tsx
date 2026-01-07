/**
 * TaxReportPage Component
 *
 * Comprehensive tax reporting dashboard for ZATCA compliance.
 *
 * Features:
 * - Daily tax summary
 * - Monthly tax reports
 * - Void operation reports
 * - Top-selling items
 * - Export to CSV
 */

import { useState, useEffect, useCallback } from 'react';
import { zatcaService, DailyTaxSummary, MonthlyTaxReport } from '@/services/zatca.service';

interface ReportPeriod {
    startDate: string;
    endDate: string;
}

interface VoidReport {
    date: string;
    voidCount: number;
    voidAmount: number;
    reasons: Array<{ reason: string; count: number; amount: number }>;
}

interface TopItem {
    productName: string;
    quantity: number;
    revenue: number;
}

export function TaxReportPage() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'void' | 'top'>('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Report data
    const [dailyReport, setDailyReport] = useState<DailyTaxSummary | null>(null);
    const [monthlyReport, setMonthlyReport] = useState<MonthlyTaxReport | null>(null);
    const [voidReport, setVoidReport] = useState<VoidReport[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);

    // Fetch daily report
    const fetchDailyReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await zatcaService.getDailyReport(selectedDate);
            if (response.success && response.data) {
                setDailyReport(response.data);
            }
        } catch (error) {
            console.error('[TaxReportPage] Failed to fetch daily report:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    // Fetch monthly report
    const fetchMonthlyReport = useCallback(async () => {
        setLoading(true);
        try {
            const response = await zatcaService.getMonthlyReport(selectedYear, selectedMonth);
            if (response.success && response.data) {
                setMonthlyReport(response.data);
            }
        } catch (error) {
            console.error('[TaxReportPage] Failed to fetch monthly report:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedMonth]);

    // Fetch void report
    const fetchVoidReport = useCallback(async () => {
        setLoading(true);
        try {
            const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().slice(0, 10);
            const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10);

            const response = await zatcaService.getVoidReport(startDate, endDate);
            if (response.success && response.data) {
                setVoidReport(response.data);
            }
        } catch (error) {
            console.error('[TaxReportPage] Failed to fetch void report:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedMonth]);

    // Fetch top items
    const fetchTopItems = useCallback(async () => {
        setLoading(true);
        try {
            const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().slice(0, 10);
            const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10);

            const response = await zatcaService.getTopItems(startDate, endDate, 10);
            if (response.success && response.data) {
                setTopItems(response.data);
            }
        } catch (error) {
            console.error('[TaxReportPage] Failed to fetch top items:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedMonth]);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        switch (activeTab) {
            case 'daily':
                if (dailyReport) {
                    zatcaService.exportToCSV([dailyReport], `daily-tax-${selectedDate}`);
                }
                break;
            case 'monthly':
                if (monthlyReport) {
                    zatcaService.exportToCSV(monthlyReport.dailyBreakdown, `monthly-tax-${selectedYear}-${selectedMonth}`);
                }
                break;
            case 'void':
                if (voidReport.length > 0) {
                    zatcaService.exportToCSV(voidReport, `void-report-${selectedYear}-${selectedMonth}`);
                }
                break;
            case 'top':
                if (topItems.length > 0) {
                    zatcaService.exportToCSV(topItems, `top-items-${selectedYear}-${selectedMonth}`);
                }
                break;
        }
    }, [activeTab, dailyReport, monthlyReport, voidReport, topItems, selectedDate, selectedYear, selectedMonth]);

    // Load data based on active tab
    useEffect(() => {
        switch (activeTab) {
            case 'daily':
                fetchDailyReport();
                break;
            case 'monthly':
                fetchMonthlyReport();
                break;
            case 'void':
                fetchVoidReport();
                break;
            case 'top':
                fetchTopItems();
                break;
        }
    }, [activeTab, fetchDailyReport, fetchMonthlyReport, fetchVoidReport, fetchTopItems]);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {document.documentElement.dir === 'rtl' ? 'تقارير الضريبة' : 'Tax Reports'}
                </h1>
                <p className="text-gray-600 mt-1">
                    {document.documentElement.dir === 'rtl'
                        ? 'تقارير الامتثال الضريبي لهيئة الزكاة'
                        : 'ZATCA Tax Compliance Reports'}
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'daily'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {document.documentElement.dir === 'rtl' ? 'التقرير اليومي' : 'Daily Report'}
                    </button>
                    <button
                        onClick={() => setActiveTab('monthly')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'monthly'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {document.documentElement.dir === 'rtl' ? 'التقرير الشهري' : 'Monthly Report'}
                    </button>
                    <button
                        onClick={() => setActiveTab('void')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'void'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {document.documentElement.dir === 'rtl' ? 'تقرير الإلغاء' : 'Void Report'}
                    </button>
                    <button
                        onClick={() => setActiveTab('top')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'top'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {document.documentElement.dir === 'rtl' ? 'الأصناف الأكثر مبيعاً' : 'Top Items'}
                    </button>
                </nav>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
                {activeTab === 'daily' && (
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            {document.documentElement.dir === 'rtl' ? 'التاريخ:' : 'Date:'}
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>
                )}

                {(activeTab === 'monthly' || activeTab === 'void' || activeTab === 'top') && (
                    <>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">
                                {document.documentElement.dir === 'rtl' ? 'السنة:' : 'Year:'}
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">
                                {document.documentElement.dir === 'rtl' ? 'الشهر:' : 'Month:'}
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                    <option key={month} value={month}>
                                        {new Date(selectedYear, month - 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <button
                    onClick={exportToCSV}
                    className="ml-auto px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                >
                    {document.documentElement.dir === 'rtl' ? 'تصدير CSV' : 'Export CSV'}
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Daily Report */}
            {activeTab === 'daily' && dailyReport && !loading && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {document.documentElement.dir === 'rtl' ? 'ملخص الضريبة اليومي' : 'Daily Tax Summary'}
                    </h2>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-gray-600">
                                {document.documentElement.dir === 'rtl' ? 'المبيعات الإجمالية' : 'Gross Sales'}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-blue-600">
                                {zatcaService.formatCurrency(dailyReport.grossSales)}
                            </dd>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-gray-600">
                                {document.documentElement.dir === 'rtl' ? 'مبلغ الضريبة' : 'VAT Amount'}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-green-600">
                                {zatcaService.formatCurrency(dailyReport.vatAmount)}
                            </dd>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-gray-600">
                                {document.documentElement.dir === 'rtl' ? 'المبيعات الصافية' : 'Net Sales'}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-purple-600">
                                {zatcaService.formatCurrency(dailyReport.netSales)}
                            </dd>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <dt className="text-sm font-medium text-gray-600">
                                {document.documentElement.dir === 'rtl' ? 'عدد الطلبات' : 'Order Count'}
                            </dt>
                            <dd className="mt-1 text-2xl font-bold text-orange-600">{dailyReport.orderCount}</dd>
                        </div>
                    </dl>
                </div>
            )}

            {/* Monthly Report */}
            {activeTab === 'monthly' && monthlyReport && !loading && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            {document.documentElement.dir === 'rtl' ? 'ملخص الضريبة الشهري' : 'Monthly Tax Summary'}
                        </h2>
                        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-600">
                                    {document.documentElement.dir === 'rtl' ? 'المبيعات الإجمالية' : 'Gross Sales'}
                                </dt>
                                <dd className="mt-1 text-2xl font-bold text-blue-600">
                                    {zatcaService.formatCurrency(monthlyReport.grossSales)}
                                </dd>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-600">
                                    {document.documentElement.dir === 'rtl' ? 'مبلغ الضريبة' : 'VAT Amount'}
                                </dt>
                                <dd className="mt-1 text-2xl font-bold text-green-600">
                                    {zatcaService.formatCurrency(monthlyReport.vatAmount)}
                                </dd>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-600">
                                    {document.documentElement.dir === 'rtl' ? 'المبيعات الصافية' : 'Net Sales'}
                                </dt>
                                <dd className="mt-1 text-2xl font-bold text-purple-600">
                                    {zatcaService.formatCurrency(monthlyReport.netSales)}
                                </dd>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <dt className="text-sm font-medium text-gray-600">
                                    {document.documentElement.dir === 'rtl' ? 'عدد الطلبات' : 'Order Count'}
                                </dt>
                                <dd className="mt-1 text-2xl font-bold text-orange-600">{monthlyReport.orderCount}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Daily breakdown */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-md font-semibold mb-4">
                            {document.documentElement.dir === 'rtl' ? 'تفصيل يومي' : 'Daily Breakdown'}
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            {document.documentElement.dir === 'rtl' ? 'التاريخ' : 'Date'}
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            {document.documentElement.dir === 'rtl' ? 'الإجمالي' : 'Gross'}
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            {document.documentElement.dir === 'rtl' ? 'الضريبة' : 'VAT'}
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            {document.documentElement.dir === 'rtl' ? 'صافي' : 'Net'}
                                        </th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                            {document.documentElement.dir === 'rtl' ? 'طلبات' : 'Orders'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {monthlyReport.dailyBreakdown.map((day, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{day.date}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                                {zatcaService.formatCurrency(day.grossSales)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                                {zatcaService.formatCurrency(day.vatAmount)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                                {zatcaService.formatCurrency(day.netSales)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{day.orderCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Void Report */}
            {activeTab === 'void' && voidReport.length > 0 && !loading && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {document.documentElement.dir === 'rtl' ? 'تقرير عمليات الإلغاء' : 'Void Operations Report'}
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'التاريخ' : 'Date'}
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'عدد' : 'Count'}
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'المبلغ' : 'Amount'}
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'الأسباب' : 'Reasons'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {voidReport.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{item.date}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.voidCount}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                            {zatcaService.formatCurrency(item.voidAmount)}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            {item.reasons.map((reason, i) => (
                                                <div key={i} className="text-xs">
                                                    {reason.reason}: {reason.count}
                                                </div>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Top Items */}
            {activeTab === 'top' && topItems.length > 0 && !loading && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        {document.documentElement.dir === 'rtl' ? 'الأصناف الأكثر مبيعاً' : 'Top Selling Items'}
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        #
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'الصنف' : 'Item'}
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'الكمية' : 'Quantity'}
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                        {document.documentElement.dir === 'rtl' ? 'الإيراد' : 'Revenue'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {topItems.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{index + 1}</td>
                                        <td className="px-4 py-2 text-sm font-medium">{item.productName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                            {item.quantity.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                            {zatcaService.formatCurrency(item.revenue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TaxReportPage;
