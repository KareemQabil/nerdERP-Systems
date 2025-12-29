/**
 * Manager End of Day Modal
 * Shows all closed sessions with their discrepancies
 * Manager reviews and completes EOD
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, X, AlertTriangle, CheckCircle, TrendingUp,
    TrendingDown, Loader2, Calendar, Users, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { apiClient } from '@/lib/api-client';
import Decimal from 'decimal.js';

interface SessionSummary {
    sessionId: string;
    userId: string;
    userName: string;
    deviceId: string;
    openedAt: string;
    closedAt: string;
    openingBalance: string;
    expectedBalance: string;
    actualBalance: string;
    discrepancy: string;
    hasDiscrepancy: boolean;
    notes: string | null;
}

interface EODReport {
    id: string;
    storeId: string;
    reportDate: string;
    businessDate: string;  // The business day being closed
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    totalSessions: number;
    sessionsWithDiscrepancy: number;
    totalCashSales: string;
    totalExpectedCash: string;
    totalActualCash: string;
    totalDiscrepancy: string;
    sessionSummaries: SessionSummary[];
    managerNotes?: string;
}

interface ManagerEODModalProps {
    isOpen: boolean;
    onClose: () => void;
    storeId: string;
    managerId: string;
    onComplete?: () => void;
}

export function ManagerEODModal({
    isOpen,
    onClose,
    storeId,
    managerId,
    onComplete,
}: ManagerEODModalProps) {
    const { t } = useTranslation('pos');

    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [eodReport, setEodReport] = useState<EODReport | null>(null);
    const [managerNotes, setManagerNotes] = useState('');

    // Business date with smart default: if before 6 AM, default to previous day
    const getDefaultBusinessDate = () => {
        const now = new Date();
        const hour = now.getHours();
        if (hour < 6) {
            // Before 6 AM - default to previous day
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString().split('T')[0];
        }
        return now.toISOString().split('T')[0];
    };
    const [businessDate, setBusinessDate] = useState(getDefaultBusinessDate);

    // Load EOD data on open or when business date changes
    useEffect(() => {
        if (isOpen) {
            loadEOD();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, storeId, businessDate]);

    const loadEOD = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Check if EOD exists for selected business date
            const response = await apiClient.get(`/api/v1/eod/stores/${storeId}/date/${businessDate}`);

            if (response.data?.data) {
                setEodReport(response.data.data);
            } else {
                setEodReport(null); // No EOD started yet
            }
        } catch (err: any) {
            if (err.response?.status === 404) {
                setEodReport(null); // No EOD exists
            } else {
                setError('Failed to load EOD data');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartEOD = async () => {
        setIsStarting(true);
        setError(null);

        try {
            const response = await apiClient.post(`/api/v1/eod/stores/${storeId}/start`, {
                managerId,
                businessDate,  // Pass the selected business date
            });
            setEodReport(response.data.data);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to start EOD');
        } finally {
            setIsStarting(false);
        }
    };

    const handleCompleteEOD = async () => {
        if (!eodReport) return;

        setIsCompleting(true);
        setError(null);

        try {
            await apiClient.patch(`/api/v1/eod/${eodReport.id}/complete`, {
                managerNotes: managerNotes || undefined,
            });
            onComplete?.();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to complete EOD');
        } finally {
            setIsCompleting(false);
        }
    };

    if (!isOpen) return null;

    const totalDisc = new Decimal(eodReport?.totalDiscrepancy || 0);
    const isOver = totalDisc.greaterThan(0);
    const hasDiscrepancy = !totalDisc.isZero();

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
                    className="w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#1a1c1e] to-[#2a2f35] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-violet-500/20">
                                <FileText className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    {t('eod.title', 'تقرير نهاية اليوم')}
                                </h2>
                                <p className="text-sm text-white/60">
                                    {new Date().toLocaleDateString('ar-SA', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                            </div>
                        ) : !eodReport ? (
                            // No EOD started - show date selector and start button
                            <div className="text-center py-8 space-y-6">
                                <Calendar className="w-16 h-16 text-violet-400 mx-auto" />
                                <h3 className="text-xl font-semibold text-white">
                                    {t('eod.notStarted', 'لم يبدأ تقرير نهاية اليوم')}
                                </h3>

                                {/* Business Date Selector */}
                                <div className="bg-white/5 rounded-xl p-4 max-w-sm mx-auto">
                                    <label className="block text-sm text-white/60 mb-2">
                                        {t('eod.businessDate', 'يوم العمل')}
                                    </label>
                                    <input
                                        type="date"
                                        value={businessDate}
                                        onChange={(e) => setBusinessDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white text-center focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                    />
                                    <p className="text-xs text-white/40 mt-2">
                                        {t('eod.businessDateHint', 'إذا كان المطعم يغلق بعد منتصف الليل، اختر يوم العمل السابق')}
                                    </p>
                                </div>

                                <p className="text-white/60 max-w-md mx-auto">
                                    {t('eod.startDescription', 'ابدأ تقرير نهاية اليوم لمراجعة جميع الورديات المغلقة والفروقات.')}
                                </p>
                                <Button
                                    onClick={handleStartEOD}
                                    disabled={isStarting}
                                    className="bg-violet-600 hover:bg-violet-700 text-white"
                                >
                                    {isStarting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> جاري البدء...</>
                                    ) : (
                                        <><FileText className="w-4 h-4 mr-2" /> بدء التقرير ليوم {businessDate}</>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            // EOD in progress - show data
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <Users className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-white">{eodReport.totalSessions}</p>
                                        <p className="text-sm text-white/60">{t('eod.sessions', 'ورديات')}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-white font-mono">
                                            {parseFloat(eodReport.totalCashSales).toFixed(2)}
                                        </p>
                                        <p className="text-sm text-white/60">{t('eod.cashSales', 'مبيعات نقدية')}</p>
                                    </div>
                                    <div className={cn(
                                        "rounded-xl p-4 text-center",
                                        hasDiscrepancy ? (isOver ? "bg-yellow-500/20" : "bg-red-500/20") : "bg-green-500/20"
                                    )}>
                                        {hasDiscrepancy ? (
                                            isOver ? (
                                                <TrendingUp className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                                            ) : (
                                                <TrendingDown className="w-6 h-6 text-red-400 mx-auto mb-2" />
                                            )
                                        ) : (
                                            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                        )}
                                        <p className={cn(
                                            "text-2xl font-bold font-mono",
                                            hasDiscrepancy ? (isOver ? "text-yellow-400" : "text-red-400") : "text-green-400"
                                        )}>
                                            {totalDisc.toFixed(2)}
                                        </p>
                                        <p className="text-sm text-white/60">{t('eod.discrepancy', 'الفرق')}</p>
                                    </div>
                                </div>

                                {/* Discrepancy Warning */}
                                {hasDiscrepancy && (
                                    <div className={cn(
                                        "p-4 rounded-xl flex items-start gap-3",
                                        isOver ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-red-500/10 border border-red-500/30"
                                    )}>
                                        <AlertTriangle className={cn(
                                            "w-5 h-5 mt-0.5",
                                            isOver ? "text-yellow-400" : "text-red-400"
                                        )} />
                                        <div>
                                            <p className={cn(
                                                "font-medium",
                                                isOver ? "text-yellow-400" : "text-red-400"
                                            )}>
                                                {isOver
                                                    ? t('eod.overWarning', 'يوجد فائض في الصندوق')
                                                    : t('eod.shortWarning', 'يوجد نقص في الصندوق')}
                                            </p>
                                            <p className="text-sm text-white/60 mt-1">
                                                {t('eod.discrepancyNote', 'راجع تفاصيل الورديات أدناه للاطلاع على مصدر الفرق.')}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Sessions List */}
                                <div>
                                    <h3 className="text-sm font-semibold text-white/80 mb-3">
                                        {t('eod.sessionDetails', 'تفاصيل الورديات')} ({eodReport.sessionSummaries?.length || 0})
                                    </h3>
                                    <div className="space-y-2">
                                        {eodReport.sessionSummaries?.map((session) => {
                                            const disc = new Decimal(session.discrepancy || 0);
                                            const sessionHasDisc = !disc.isZero();
                                            const sessionOver = disc.greaterThan(0);

                                            return (
                                                <div
                                                    key={session.sessionId}
                                                    className={cn(
                                                        "p-3 rounded-lg border flex items-center justify-between",
                                                        sessionHasDisc
                                                            ? sessionOver
                                                                ? "bg-yellow-500/10 border-yellow-500/30"
                                                                : "bg-red-500/10 border-red-500/30"
                                                            : "bg-white/5 border-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-medium">
                                                                {session.userName}
                                                            </span>
                                                            <span className="text-xs text-white/50 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(session.openedAt).toLocaleTimeString('ar-SA', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })} - {new Date(session.closedAt).toLocaleTimeString('ar-SA', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <div>
                                                                <span className="text-white/50">متوقع: </span>
                                                                <span className="text-white font-mono">
                                                                    {parseFloat(session.expectedBalance).toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-white/50">فعلي: </span>
                                                                <span className="text-white font-mono">
                                                                    {parseFloat(session.actualBalance).toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className={cn(
                                                                "font-mono font-semibold",
                                                                sessionHasDisc
                                                                    ? sessionOver ? "text-yellow-400" : "text-red-400"
                                                                    : "text-green-400"
                                                            )}>
                                                                {sessionOver ? '+' : ''}{disc.toFixed(2)}
                                                            </div>
                                                        </div>
                                                        {session.notes && (
                                                            <p className="text-xs text-white/40 mt-1 max-w-[200px] truncate">
                                                                {session.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {(!eodReport.sessionSummaries || eodReport.sessionSummaries.length === 0) && (
                                            <p className="text-center text-white/40 py-4">
                                                {t('eod.noSessions', 'لا توجد ورديات مسجلة')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Manager Notes */}
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">
                                        {t('eod.managerNotes', 'ملاحظات المدير')}
                                    </label>
                                    <textarea
                                        value={managerNotes}
                                        onChange={(e) => setManagerNotes(e.target.value)}
                                        placeholder={t('eod.managerNotesPlaceholder', 'أي ملاحظات عن تقرير اليوم...')}
                                        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mx-6 mb-4 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Footer */}
                    {eodReport && eodReport.status !== 'COMPLETED' && (
                        <div className="px-6 py-4 border-t border-white/10 flex justify-between flex-shrink-0">
                            <Button variant="secondary" onClick={onClose}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button
                                onClick={handleCompleteEOD}
                                disabled={isCompleting}
                                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                            >
                                {isCompleting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإكمال...</>
                                ) : (
                                    <><CheckCircle className="w-4 h-4" /> إكمال التقرير</>
                                )}
                            </Button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ManagerEODModal;
