import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    EyeOff,
    Calculator,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    Wallet,
    Shield,
    FileText,
    TrendingUp,
    TrendingDown,
    Printer,
    Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import Decimal from 'decimal.js';
import type {
    Denomination,
    ClosingReport,
    PinAuthorizationRequest,
} from '@/types/pos.types';

// =============================================================================
// KSA CURRENCY DENOMINATIONS (SAR)
// =============================================================================

const SAR_DENOMINATIONS: Denomination[] = [
    { value: 500, label: '500', type: 'NOTE' },
    { value: 200, label: '200', type: 'NOTE' },
    { value: 100, label: '100', type: 'NOTE' },
    { value: 50, label: '50', type: 'NOTE' },
    { value: 20, label: '20', type: 'NOTE' },
    { value: 10, label: '10', type: 'NOTE' },
    { value: 5, label: '5', type: 'NOTE' },
    { value: 1, label: '1', type: 'COIN' },
    { value: 0.5, label: '0.50', type: 'COIN' },
    { value: 0.25, label: '0.25', type: 'COIN' },
];

// =============================================================================
// TYPES
// =============================================================================

export interface BlindCloseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (actualCash: string, note?: string) => Promise<{
        success: boolean;
        report?: ClosingReport;
        message?: string;
    }>;
    /** Session ID being closed */
    sessionId: string;
    /** Whether to show denomination breakdown input */
    showDenominations?: boolean;
}

export interface CashCount {
    denomination: number;
    count: number;
    total: string;
}

type BlindCloseStep = 'COUNT' | 'CONFIRM' | 'AUTHORIZE' | 'PROCESSING' | 'REPORT';

// =============================================================================
// BLIND CLOSE MODAL COMPONENT
// =============================================================================

/**
 * BlindCloseModal
 *
 * Secure cash register closing workflow:
 * 1. COUNT - Cashier enters actual cash count (without seeing expected)
 * 2. CONFIRM - Verify the entered amounts
 * 3. AUTHORIZE - Manager authorization if discrepancy exceeds threshold
 * 4. PROCESSING - Submit to backend
 * 5. REPORT - Show closing report with discrepancy analysis
 *
 * The "blind" aspect means the cashier doesn't see the expected total
 * until after they've entered their actual count, preventing manipulation.
 */
export function BlindCloseModal({
    isOpen,
    onClose,
    onComplete,
    sessionId,
    showDenominations = true,
}: BlindCloseModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();
    const { verifyPin, currentUser } = useAuthStore();

    const [step, setStep] = useState<BlindCloseStep>('COUNT');
    const [denominationCounts, setDenominationCounts] = useState<Record<number, number>>({});
    const [totalCash, setTotalCash] = useState('0');
    const [closingNote, setClosingNote] = useState('');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [closingReport, setClosingReport] = useState<ClosingReport | null>(null);
    const [closeResult, setCloseResult] = useState<{
        success: boolean;
        message?: string;
    } | null>(null);

    // Calculate total cash from denomination counts
    const calculatedTotal = useMemo(() => {
        let total = new Decimal(0);
        SAR_DENOMINATIONS.forEach((denom) => {
            const count = denominationCounts[denom.value] || 0;
            total = total.plus(new Decimal(denom.value).mul(count));
        });
        return total.toFixed(3);
    }, [denominationCounts]);

    // Reset state when modal opens/closes
    const handleReset = () => {
        setStep('COUNT');
        setDenominationCounts({});
        setTotalCash('0');
        setClosingNote('');
        setPin('');
        setPinError(null);
        setIsProcessing(false);
        setClosingReport(null);
        setCloseResult(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Update denomination count
    const updateDenominationCount = (denomination: number, delta: number) => {
        const currentCount = denominationCounts[denomination] || 0;
        const newCount = Math.max(0, currentCount + delta);

        setDenominationCounts((prev) => ({
            ...prev,
            [denomination]: newCount,
        }));

        setTotalCash(calculatedTotal);
    };

    // Set denomination count directly
    const setDenominationCount = (denomination: number, value: number) => {
        const newCount = Math.max(0, value);

        setDenominationCounts((prev) => ({
            ...prev,
            [denomination]: newCount,
        }));

        setTotalCash(calculatedTotal);
    };

    // Step 1: Proceed to confirmation
    const handleCountProceed = () => {
        if (parseFloat(totalCash) === 0) {
            setPinError(language === 'ar'
                ? 'يرجى إدخال عدد النقود'
                : 'Please enter cash count');
            return;
        }
        setPinError(null);
        setTotalCash(calculatedTotal);
        setStep('CONFIRM');
    };

    // Step 2: Confirm and submit
    const handleConfirmProceed = () => {
        // Check if manager authorization is needed (based on discrepancy threshold)
        // For now, we'll skip this check and let the backend handle it
        setStep('AUTHORIZE');
    };

    // Step 3: Manager authorization
    const handleAuthorize = async () => {
        if (!pin || pin.length < 4) {
            setPinError(language === 'ar' ? 'يرجى إدخال رمز PIN صحيح' : 'Please enter a valid PIN');
            return;
        }

        setPinError(null);
        setIsProcessing(true);
        setStep('PROCESSING');

        try {
            // Verify manager PIN
            const authResult = await verifyPin(pin, 'OPEN_DRAWER', 'Blind Close Authorization');

            if (!authResult.authorized) {
                setPinError(language === 'ar' ? 'رمز PIN غير صحيح' : 'Invalid PIN');
                setIsProcessing(false);
                setStep('AUTHORIZE');
                return;
            }

            // Submit blind close
            const result = await onComplete(totalCash, closingNote);

            if (result.success && result.report) {
                setClosingReport(result.report);
                setCloseResult({ success: true });
                setStep('REPORT');
            } else {
                setCloseResult({
                    success: false,
                    message: result.message || (language === 'ar' ? 'فشل العملية' : 'Operation failed'),
                });
                setStep('REPORT');
            }
        } catch (error) {
            setCloseResult({
                success: false,
                message: (error as Error).message || (language === 'ar' ? 'فشل العملية' : 'Operation failed'),
            });
            setStep('REPORT');
        } finally {
            setIsProcessing(false);
        }
    };

    // Print closing report
    const handlePrintReport = () => {
        // TODO: Implement print functionality
        window.print();
    };

    // Export report as CSV
    const handleExportReport = () => {
        if (!closingReport) return;

        const csvContent = [
            ['Closing Report', ''],
            ['Date', new Date().toLocaleString()],
            ['Cashier', currentUser?.fullName || ''],
            ['', ''],
            ['Expected Cash', closingReport.expectedCash],
            ['Actual Cash', closingReport.actualCash],
            ['Difference', closingReport.discrepancy],
            ['', ''],
            ['Cash Sales', closingReport.cashSales],
            ['Other Sales', closingReport.otherSales],
            ['Total Sales', closingReport.totalSales],
            ['', ''],
            ['Denominations', 'Count', 'Total'],
            ...SAR_DENOMINATIONS.map((denom) => [
                denom.value,
                denominationCounts[denom.value] || 0,
                new Decimal(denom.value).mul(denominationCounts[denom.value] || 0).toFixed(3),
            ]),
        ].map((row) => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `closing-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Handle completion
    const handleComplete = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={step === 'REPORT' ? undefined : handleClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    data-theme={theme}
                    className={cn(
                        'relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden',
                        'bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                        'data-[theme=luxury]:bg-slate-950/95 data-[theme=luxury]:border-amber-800/30',
                    )}
                >
                    {/* Header */}
                    <div
                        data-theme={theme}
                        className={cn(
                            'flex items-center justify-between p-4 border-b',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200',
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center',
                                step === 'REPORT'
                                    ? closeResult?.success
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        : 'bg-gradient-to-br from-red-500 to-red-600'
                                    : 'bg-gradient-to-br from-amber-500 to-orange-600',
                            )}>
                                {step === 'REPORT' ? (
                                    closeResult?.success ? (
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-white" />
                                    )
                                ) : (
                                    <EyeOff className="w-5 h-5 text-white" />
                                )}
                            </div>
                            <div>
                                <h2
                                    data-theme={theme}
                                    className={cn(
                                        'text-lg font-bold',
                                        'text-white',
                                        'data-[theme=light]:text-slate-900',
                                    )}
                                >
                                    {step === 'REPORT' && closeResult?.success
                                        ? t('blindClose.sessionClosed', 'Session Closed')
                                        : step === 'REPORT' && !closeResult?.success
                                            ? t('blindClose.closeFailed', 'Close Failed')
                                            : t('blindClose.blindCashCount', 'Blind Cash Count')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {step === 'COUNT' && t('blindClose.enterActualCash', 'Enter actual cash count')}
                                    {step === 'CONFIRM' && t('blindClose.verifyAmount', 'Verify your cash count')}
                                    {step === 'AUTHORIZE' && t('blindClose.managerApproval', 'Manager approval required')}
                                </p>
                            </div>
                        </div>
                        {step !== 'PROCESSING' && step !== 'REPORT' && (
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                        <AnimatePresence mode="wait">
                            {/* COUNT STEP */}
                            {step === 'COUNT' && (
                                <motion.div
                                    key="count"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    {/* Blind Mode Notice */}
                                    <div className={cn(
                                        'rounded-xl p-3 flex items-start gap-3',
                                        'bg-amber-500/20 border border-amber-500/30',
                                    )}>
                                        <EyeOff className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-amber-400 font-medium">
                                                {t('blindClose.blindMode', 'Blind Mode Active')}
                                            </p>
                                            <p className="text-xs text-amber-400/70 mt-1">
                                                {t('blindClose.blindModeNotice', 'Expected total is hidden. Enter your actual cash count accurately.')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Running Total */}
                                    <div
                                        data-theme={theme}
                                        className={cn(
                                            'rounded-xl p-4 text-center',
                                            'bg-slate-800/50',
                                            'data-[theme=light]:bg-slate-50',
                                        )}
                                    >
                                        <p className="text-xs text-slate-400 mb-1">
                                            {t('blindClose.yourTotal', 'Your Total (SAR)')}
                                        </p>
                                        <p
                                            data-theme={theme}
                                            className={cn(
                                                'text-3xl font-bold',
                                                'text-white',
                                                'data-[theme=light]:text-slate-900',
                                            )}
                                        >
                                            {parseFloat(calculatedTotal).toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Denomination Inputs */}
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-400 uppercase tracking-wide">
                                            {t('blindClose.denominationCount', 'Denomination Count')}
                                        </p>

                                        {SAR_DENOMINATIONS.map((denom) => {
                                            const count = denominationCounts[denom.value] || 0;
                                            const denomTotal = new Decimal(denom.value).mul(count).toFixed(3);

                                            return (
                                                <div
                                                    key={denom.value}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'rounded-lg p-3 flex items-center justify-between',
                                                        count > 0
                                                            ? 'bg-cyan-500/10 border border-cyan-500/30'
                                                            : 'bg-slate-800/50',
                                                        'data-[theme=light]:bg-slate-50',
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            'w-12 h-8 rounded flex items-center justify-center text-xs font-bold',
                                                            denom.type === 'NOTE'
                                                                ? 'bg-amber-500/20 text-amber-400'
                                                                : 'bg-yellow-500/20 text-yellow-400',
                                                        )}>
                                                            {denom.label}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => updateDenominationCount(denom.value, -1)}
                                                                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                                                            >
                                                                <X className="w-3 h-3 text-slate-400" />
                                                            </motion.button>
                                                            <span
                                                                data-theme={theme}
                                                                className={cn(
                                                                    'w-10 text-center font-bold text-lg',
                                                                    'text-white',
                                                                    'data-[theme=light]:text-slate-900',
                                                                )}
                                                            >
                                                                {count}
                                                            </span>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => updateDenominationCount(denom.value, 1)}
                                                                className="w-7 h-7 rounded-lg bg-cyan-500 hover:bg-cyan-600 flex items-center justify-center"
                                                            >
                                                                <span className="text-white text-sm">+</span>
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <PriceDisplay
                                                            value={denomTotal}
                                                            size="sm"
                                                            variant={count > 0 ? 'primary' : 'muted'}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Notes Input */}
                                    <div>
                                        <textarea
                                            value={closingNote}
                                            onChange={(e) => setClosingNote(e.target.value)}
                                            placeholder={language === 'ar'
                                                ? 'ملاحظات حول الجلسة (اختياري)...'
                                                : 'Notes about this session (optional)...'}
                                            data-theme={theme}
                                            className={cn(
                                                'w-full p-3 rounded-xl border-2 resize-none text-sm',
                                                'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                                                'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-300',
                                                'text-white placeholder:text-slate-500',
                                                'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder:text-slate-400',
                                            )}
                                            rows={2}
                                            maxLength={200}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* CONFIRM STEP */}
                            {step === 'CONFIRM' && (
                                <motion.div
                                    key="confirm"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className={cn(
                                        'rounded-xl p-3 flex items-start gap-3',
                                        'bg-blue-500/20 border border-blue-500/30',
                                    )}>
                                        <Calculator className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-blue-400 font-medium">
                                                {t('blindClose.verifyAmount', 'Verify Your Amount')}
                                            </p>
                                            <p className="text-xs text-blue-400/70 mt-1">
                                                {t('blindClose.verifyNotice', 'Please verify your cash count before submitting. Manager approval will be required.')}
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        data-theme={theme}
                                        className={cn(
                                            'rounded-xl p-4 text-center',
                                            'bg-cyan-500/10 border border-cyan-500/30',
                                        )}
                                    >
                                        <p className="text-xs text-cyan-400 mb-1">
                                            {t('blindClose.totalCashToDeclare', 'Total Cash to Declare')}
                                        </p>
                                        <p
                                            data-theme={theme}
                                            className={cn(
                                                'text-4xl font-bold',
                                                'text-white',
                                                'data-[theme=light]:text-slate-900',
                                            )}
                                        >
                                            {parseFloat(totalCash).toFixed(2)} <span className="text-2xl">SAR</span>
                                        </p>
                                    </div>

                                    {/* Summary */}
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-400 uppercase tracking-wide">
                                            {t('blindClose.breakdown', 'Breakdown')}
                                        </p>
                                        {SAR_DENOMINATIONS.filter((denom) => denominationCounts[denom.value] > 0).map((denom) => {
                                            const count = denominationCounts[denom.value] || 0;
                                            const denomTotal = new Decimal(denom.value).mul(count).toFixed(3);

                                            return (
                                                <div
                                                    key={denom.value}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'rounded-lg p-2 flex justify-between items-center text-sm',
                                                        'bg-slate-800/50',
                                                        'data-[theme=light]:bg-slate-50',
                                                    )}
                                                >
                                                    <span className="text-slate-400">
                                                        {denom.label} SAR × {count}
                                                    </span>
                                                    <PriceDisplay value={denomTotal} size="sm" variant="muted" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* AUTHORIZE STEP */}
                            {step === 'AUTHORIZE' && (
                                <motion.div
                                    key="authorize"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className={cn(
                                        'rounded-xl p-3 flex items-start gap-3',
                                        'bg-purple-500/20 border border-purple-500/30',
                                    )}>
                                        <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-purple-400 font-medium">
                                                {t('blindClose.managerApproval', 'Manager Approval Required')}
                                            </p>
                                            <p className="text-xs text-purple-400/70 mt-1">
                                                {t('blindClose.managerApprovalNotice', 'A manager must authorize this blind close before it can be submitted.')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Wallet className="w-4 h-4 text-cyan-400" />
                                            <span className="text-slate-400">
                                                {t('blindClose.declaredAmount', 'Declared Amount')}
                                            </span>
                                        </div>

                                        <div
                                            data-theme={theme}
                                            className={cn(
                                                'rounded-xl p-3 text-center',
                                                'bg-cyan-500/10 border border-cyan-500/30',
                                            )}
                                        >
                                            <p className="text-3xl font-bold text-cyan-400">
                                                {parseFloat(totalCash).toFixed(2)} SAR
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <Shield className="w-4 h-4 text-purple-400" />
                                            <span className="text-slate-400">
                                                {t('blindClose.enterManagerPin', 'Enter Manager PIN')}
                                            </span>
                                        </div>

                                        <input
                                            type="password"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            maxLength={6}
                                            autoFocus
                                            placeholder="••••"
                                            data-theme={theme}
                                            className={cn(
                                                'w-full px-4 py-3 rounded-xl border-2 text-center text-2xl tracking-widest font-bold',
                                                'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none transition-colors',
                                                'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-300',
                                                'text-white placeholder:text-slate-600',
                                                'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder:text-slate-400',
                                            )}
                                        />

                                        {pinError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-2 rounded-lg bg-red-500/20 border border-red-500/30"
                                            >
                                                <p className="text-xs text-red-400 text-center">{pinError}</p>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* PROCESSING STEP */}
                            {step === 'PROCESSING' && (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-16 h-16 mx-auto mb-4 border-4 border-amber-500/30 border-t-amber-500 rounded-full"
                                    />
                                    <p
                                        data-theme={theme}
                                        className={cn(
                                            'text-sm',
                                            'text-slate-300',
                                            'data-[theme=light]:text-slate-700',
                                        )}
                                    >
                                        {t('blindClose.processing', 'Processing blind close...')}
                                    </p>
                                </motion.div>
                            )}

                            {/* REPORT STEP */}
                            {step === 'REPORT' && closingReport && (
                                <motion.div
                                    key="report"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-3"
                                >
                                    {/* Discrepancy Banner */}
                                    {parseFloat(closingReport.discrepancy) !== 0 && (
                                        <div className={cn(
                                            'rounded-xl p-3 flex items-start gap-3',
                                            parseFloat(closingReport.discrepancy) > 0
                                                ? 'bg-green-500/20 border border-green-500/30'
                                                : 'bg-red-500/20 border border-red-500/30',
                                        )}>
                                            {parseFloat(closingReport.discrepancy) > 0 ? (
                                                <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {parseFloat(closingReport.discrepancy) > 0
                                                        ? t('blindClose.overage', 'Overage')
                                                        : t('blindClose.shortage', 'Shortage')}
                                                </p>
                                                <p className="text-xs mt-1">
                                                    {parseFloat(closingReport.discrepancy) > 0
                                                        ? `${t('blindClose.over', 'Over')} ${Math.abs(parseFloat(closingReport.discrepancy)).toFixed(2)} SAR`
                                                        : `${t('blindClose.short', 'Short')} ${Math.abs(parseFloat(closingReport.discrepancy)).toFixed(2)} SAR`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Closing Summary */}
                                    <div
                                        data-theme={theme}
                                        className={cn(
                                            'rounded-xl p-4 space-y-3',
                                            'bg-slate-800/50',
                                            'data-[theme=light]:bg-slate-50',
                                        )}
                                    >
                                        <h3
                                            data-theme={theme}
                                            className={cn(
                                                'font-bold text-sm',
                                                'text-white',
                                                'data-[theme=light]:text-slate-900',
                                            )}
                                        >
                                            {t('blindClose.closingSummary', 'Closing Summary')}
                                        </h3>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">{t('blindClose.expectedCash', 'Expected Cash')}</span>
                                                <PriceDisplay value={closingReport.expectedCash} size="sm" variant="muted" />
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">{t('blindClose.actualCash', 'Actual Cash')}</span>
                                                <PriceDisplay value={closingReport.actualCash} size="sm" variant="muted" />
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-slate-700 font-bold">
                                                <span
                                                    data-theme={theme}
                                                    className={cn(
                                                        'text-white',
                                                        'data-[theme=light]:text-slate-900',
                                                    )}
                                                >
                                                    {t('blindClose.difference', 'Difference')}
                                                </span>
                                                <PriceDisplay
                                                    value={closingReport.discrepancy}
                                                    size="sm"
                                                    variant={parseFloat(closingReport.discrepancy) >= 0 ? 'success' : 'danger'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sales Summary */}
                                    <div
                                        data-theme={theme}
                                        className={cn(
                                            'rounded-xl p-4 space-y-3',
                                            'bg-slate-800/50',
                                            'data-[theme=light]:bg-slate-50',
                                        )}
                                    >
                                        <h3
                                            data-theme={theme}
                                            className={cn(
                                                'font-bold text-sm',
                                                'text-white',
                                                'data-[theme=light]:text-slate-900',
                                            )}
                                        >
                                            {t('blindClose.salesSummary', 'Sales Summary')}
                                        </h3>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">{t('blindClose.cashSales', 'Cash Sales')}</span>
                                                <PriceDisplay value={closingReport.cashSales} size="sm" variant="muted" />
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">{t('blindClose.otherSales', 'Other Payments')}</span>
                                                <PriceDisplay value={closingReport.otherSales} size="sm" variant="muted" />
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-slate-700 font-bold">
                                                <span
                                                    data-theme={theme}
                                                    className={cn(
                                                        'text-white',
                                                        'data-[theme=light]:text-slate-900',
                                                    )}
                                                >
                                                    {t('blindClose.totalSales', 'Total Sales')}
                                                </span>
                                                <PriceDisplay value={closingReport.totalSales} size="sm" variant="primary" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {step !== 'PROCESSING' && (
                        <div
                            data-theme={theme}
                            className={cn(
                                'p-4 border-t flex gap-2',
                                'border-slate-700/50',
                                'data-[theme=light]:border-slate-200',
                            )}
                        >
                            {step === 'COUNT' && (
                                <>
                                    <Button variant="secondary" onClick={handleClose}>
                                        {t('cancel', 'Cancel')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleCountProceed}
                                        disabled={parseFloat(calculatedTotal) === 0}
                                    >
                                        {t('blindClose.verify', 'Verify Amount')}
                                        <ArrowRight className="w-4 h-4 ms-2" />
                                    </Button>
                                </>
                            )}

                            {step === 'CONFIRM' && (
                                <>
                                    <Button variant="secondary" onClick={() => setStep('COUNT')}>
                                        {t('back', 'Back')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleConfirmProceed}
                                    >
                                        {t('blindClose.submit', 'Submit for Approval')}
                                        <Shield className="w-4 h-4 ms-2" />
                                    </Button>
                                </>
                            )}

                            {step === 'AUTHORIZE' && (
                                <>
                                    <Button variant="secondary" onClick={() => setStep('CONFIRM')}>
                                        {t('back', 'Back')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleAuthorize}
                                        disabled={!pin || pin.length < 4}
                                    >
                                        {t('blindClose.authorizeClose', 'Authorize & Close')}
                                        <CheckCircle2 className="w-4 h-4 ms-2" />
                                    </Button>
                                </>
                            )}

                            {step === 'REPORT' && (
                                <>
                                    <Button variant="secondary" onClick={handleExportReport}>
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button variant="secondary" onClick={handlePrintReport}>
                                        <Printer className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={closeResult?.success ? 'primary' : 'secondary'}
                                        className="flex-1"
                                        onClick={handleComplete}
                                    >
                                        {closeResult?.success ? (
                                            <>
                                                {t('blindClose.done', 'Done')}
                                                <CheckCircle2 className="w-4 h-4 ms-2" />
                                            </>
                                        ) : (
                                            t('blindClose.close', 'Close')
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default BlindCloseModal;
