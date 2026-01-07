/**
 * ManagerSessionReport Component
 * 
 * Manager-only view for reviewing closed sessions with discrepancies
 * Shows expected vs actual balance, and allows resolution
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    FileText,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Wallet,
    Banknote,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { registerSessionService, type SessionReport } from '@/services/session.service';
import Decimal from 'decimal.js';

// =============================================================================
// TYPES
// =============================================================================

interface ManagerSessionReportProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ManagerSessionReport({
    isOpen,
    onClose,
    sessionId,
}: ManagerSessionReportProps) {
    const { t } = useTranslation('pos');
    const [report, setReport] = useState<SessionReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch session report on open
    useEffect(() => {
        if (isOpen && sessionId) {
            fetchReport();
        }
    }, [isOpen, sessionId]);

    const fetchReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await registerSessionService.getSessionReport(sessionId);
            setReport(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load session report');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const discrepancy = report ? new Decimal(report.discrepancy) : new Decimal(0);
    const hasDiscrepancy = discrepancy.abs().greaterThan('0.01');
    const isPositive = discrepancy.greaterThan(0);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-lg bg-gradient-to-b from-[#1a1c1e] to-[#2a2f35] rounded-2xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {t('session.managerReport', 'Session Report')}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {t('session.reviewSession', 'Review session details')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4">
                        {isLoading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full" />
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <span className="text-sm text-red-300">{error}</span>
                            </div>
                        )}

                        {report && !isLoading && (
                            <>
                                {/* Discrepancy Alert */}
                                {hasDiscrepancy && (
                                    <div className={`flex items-center gap-3 p-4 rounded-lg border ${isPositive
                                        ? 'bg-green-500/20 border-green-500/30'
                                        : 'bg-red-500/20 border-red-500/30'
                                        }`}>
                                        {isPositive ? (
                                            <TrendingUp className="w-6 h-6 text-green-400" />
                                        ) : (
                                            <TrendingDown className="w-6 h-6 text-red-400" />
                                        )}
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                                                {isPositive
                                                    ? t('session.cashOver', 'Cash Over')
                                                    : t('session.cashShort', 'Cash Short')}
                                            </p>
                                            <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                {discrepancy.abs().toFixed(2)} SAR
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* No Discrepancy */}
                                {!hasDiscrepancy && (
                                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-emerald-500/20 border-emerald-500/30">
                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        <p className="text-emerald-300 font-medium">
                                            {t('session.noDiscrepancy', 'Cash balanced - no discrepancy')}
                                        </p>
                                    </div>
                                )}

                                {/* Balance Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <p className="text-xs text-gray-400 mb-1">Expected Balance</p>
                                        <p className="text-lg font-bold text-gray-300">
                                            {new Decimal(report.expectedBalance).toFixed(2)} SAR
                                        </p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <p className="text-xs text-gray-400 mb-1">Actual Count</p>
                                        <p className="text-lg font-bold text-white">
                                            {new Decimal(report.closingBalance).toFixed(2)} SAR
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Breakdown */}
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-400 font-medium">Payment Breakdown</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                                            <Banknote className="w-4 h-4 text-green-400" />
                                            <div>
                                                <p className="text-xs text-gray-400">Cash</p>
                                                <p className="text-sm font-bold text-white">
                                                    {new Decimal(report.totalCashSales).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                                            <CreditCard className="w-4 h-4 text-blue-400" />
                                            <div>
                                                <p className="text-xs text-gray-400">Card</p>
                                                <p className="text-sm font-bold text-white">
                                                    {new Decimal(report.totalCardSales).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                                            <Wallet className="w-4 h-4 text-purple-400" />
                                            <div>
                                                <p className="text-xs text-gray-400">Wallet</p>
                                                <p className="text-sm font-bold text-white">
                                                    {new Decimal(report.totalWalletSales).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Stats */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-3 bg-white/5 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-white">{report.orderCount}</p>
                                        <p className="text-xs text-gray-400">Orders</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-yellow-400">{report.voidCount}</p>
                                        <p className="text-xs text-gray-400">Voids</p>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-lg text-center">
                                        <p className="text-2xl font-bold text-red-400">
                                            {new Decimal(report.totalRefunds).toFixed(0)}
                                        </p>
                                        <p className="text-xs text-gray-400">Refunds</p>
                                    </div>
                                </div>

                                {/* Blind Close Badge */}
                                {report.isBlindClose && (
                                    <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg">
                                        <Clock className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs text-blue-300">
                                            {t('session.blindClosedNote', 'This session was closed using blind close mode')}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/10 flex gap-3">
                        <Button variant="secondary" onClick={onClose} className="flex-1">
                            {t('common.close', 'Close')}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ManagerSessionReport;
