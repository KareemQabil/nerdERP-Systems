import { useState, useRef } from 'react';
import { X, Printer, TrendingUp, DollarSign, CreditCard, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import Decimal from 'decimal.js';
import { useShiftStore } from '../store/shiftStore';
import type { Shift } from '../types/shift.types';

export interface CloseShiftModalProps {
    shift: Shift;
    onClose: () => void;
    onShiftClosed: (closedShift: Shift) => void;
}

/**
 * CloseShiftModal - Z-Report with Cash Reconciliation
 * 
 * Features:
 * - Cash reconciliation with difference calculation
 * - Color-coded difference (green/red/blue)
 * - Thermal receipt printing with react-to-print
 * - Complete shift statistics
 */
export function CloseShiftModal({ shift, onClose, onShiftClosed }: CloseShiftModalProps) {
    const [countedCash, setCountedCash] = useState(shift.expectedCash);
    const [revealed, setRevealed] = useState(false); // Blind count: hide expected until revealed
    const zReportRef = useRef<HTMLDivElement>(null);
    const { closeShift } = useShiftStore();

    const handlePrint = useReactToPrint({
        contentRef: zReportRef,
        documentTitle: `Z-Report-${shift.id}`,
    });

    // Calculate difference in real-time
    const actual = new Decimal(countedCash);
    const expected = new Decimal(shift.expectedCash);
    const difference = actual.minus(expected);
    const differenceStr = difference.toFixed(2);

    // Color coding
    let differenceColor = 'text-emerald-400'; // Perfect match
    if (difference.lessThan(0)) {
        differenceColor = 'text-red-400'; // Shortage
    } else if (difference.greaterThan(0)) {
        differenceColor = 'text-blue-400'; // Overage
    }

    const handleReveal = () => {
        setRevealed(true);
    };

    const handleEndShift = () => {
        if (!revealed) {
            alert('⚠️ Please count and reveal first');
            return;
        }

        // Call closeShift from store
        const closedShift = closeShift(countedCash);

        // Pass the closed shift to parent callback
        onShiftClosed(closedShift);
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('ar-SA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-gradient-to-br from-slate-900/98 to-slate-800/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white font-['Almarai']">
                                إغلاق الوردية - تقرير Z
                            </h2>
                            <p className="text-sm text-gray-400 font-['Almarai']">Close Shift - Z Report</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    {/* Shift Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-400 font-['Almarai']">رقم الوردية</p>
                            <p className="text-sm font-mono text-white">{shift.id.slice(-8)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-['Almarai']">الكاشير</p>
                            <p className="text-sm font-['Almarai'] text-white">{shift.cashierName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-['Almarai']">وقت البداية</p>
                            <p className="text-sm font-mono text-white">{formatDateTime(shift.startTime)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-['Almarai']">وقت الانتهاء</p>
                            <p className="text-sm font-mono text-white">{formatDateTime(new Date().toISOString())}</p>
                        </div>
                    </div>

                    {/* BLIND COUNT: Hide expected until revealed */}
                    {!revealed ? (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-3">
                            <h3 className="text-sm font-bold text-amber-400 font-['Almarai'] flex items-center gap-2">
                                🔒 عد النقدية أولاً (Blind Count)
                            </h3>
                            <p className="text-xs text-amber-200 font-['Almarai']">
                                قم بعد النقدية في الدرج وأدخل المبلغ الفعلي قبل الكشف عن المتوقع
                            </p>
                            <p className="text-xs text-gray-400">
                                Count cash in drawer and enter actual amount before revealing expected
                            </p>
                        </div>
                    ) : (
                        /* Cash Reconciliation - Only after reveal */
                        <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 space-y-3">
                            <h3 className="text-sm font-bold text-white font-['Almarai'] flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                تسوية النقدية
                            </h3>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-['Almarai']">رصيد البداية:</span>
                                    <span className="font-mono text-white">{parseFloat(shift.startingCash).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-['Almarai']">+ مبيعات نقدية:</span>
                                    <span className="font-mono text-emerald-400">+{parseFloat(shift.totalCashSales).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-white/10 pt-2">
                                    <div className="flex justify-between text-base font-bold">
                                        <span className="text-white font-['Almarai']">= النقدية المتوقعة:</span>
                                        <span className="font-mono text-cyan-400">{parseFloat(shift.expectedCash).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Counted Cash Input */}
                    <div>
                        <label className="block text-sm font-bold text-white mb-2 font-['Almarai']">
                            النقدية المحسوبة في الدرج
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={countedCash}
                                onChange={(e) => setCountedCash(e.target.value)}
                                step="0.01"
                                className="w-full h-14 px-4 pr-16 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 text-white text-lg font-mono transition-all"
                                placeholder="0.00"
                                autoFocus
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                <span className="text-gray-400 font-['Arial']">SAR</span>
                            </div>
                        </div>
                    </div>

                    {/* Difference Display */}
                    <div className={`p-4 rounded-xl bg-white/5 border ${differenceColor === 'text-emerald-400' ? 'border-emerald-500/30 bg-emerald-500/10' : differenceColor === 'text-red-400' ? 'border-red-500/30 bg-red-500/10' : 'border-blue-500/30 bg-blue-500/10'}`}>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-['Almarai'] text-white">الفرق:</span>
                            <span className={`text-2xl font-mono font-bold ${differenceColor}`}>
                                {difference.greaterThanOrEqualTo(0) ? '+' : ''}{differenceStr}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {difference.isZero() ? '✓ Perfect match' : difference.lessThan(0) ? '⚠️ Shortage' : '💰 Overage'}
                        </p>
                    </div>

                    {/* Sales Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                <p className="text-xs text-gray-400 font-['Almarai']">مبيعات نقدية</p>
                            </div>
                            <p className="text-xl font-mono font-bold text-emerald-400">
                                {parseFloat(shift.totalCashSales).toFixed(2)}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-4 h-4 text-blue-400" />
                                <p className="text-xs text-gray-400 font-['Almarai']">مبيعات بطاقة</p>
                            </div>
                            <p className="text-xl font-mono font-bold text-blue-400">
                                {parseFloat(shift.totalCardSales).toFixed(2)}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-cyan-400" />
                                <p className="text-xs text-gray-400 font-['Almarai']">إجمالي المبيعات</p>
                            </div>
                            <p className="text-xl font-mono font-bold text-cyan-400">
                                {parseFloat(shift.totalSales).toFixed(2)}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-400 font-['Almarai']">عدد المعاملات</p>
                            </div>
                            <p className="text-xl font-mono font-bold text-white">
                                {shift.transactionCount}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 space-y-2 bg-slate-900/50">
                    <button
                        onClick={handlePrint}
                        className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-['Almarai'] font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <Printer className="w-5 h-5" />
                        <span>طباعة التقرير</span>
                    </button>

                    {!revealed ? (
                        <button
                            onClick={handleReveal}
                            className="w-full h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-['Almarai'] font-bold text-lg shadow-lg shadow-cyan-500/20 transition-all"
                        >
                            🔓 كشف النقدية المتوقعة
                        </button>
                    ) : (
                        <button
                            onClick={handleEndShift}
                            className="w-full h-14 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-['Almarai'] font-bold text-lg shadow-lg shadow-red-500/20 transition-all"
                        >
                            إنهاء الوردية
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Hidden Z-Report for Printing - 80mm Thermal Format */}
            <div className="hidden">
                <div ref={zReportRef} className="w-[320px] bg-white text-black p-4">
                    {/* Header */}
                    <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
                        <h1 className="text-xl font-bold text-gray-900">Z-REPORT</h1>
                        <p className="text-xs text-gray-700 mt-1">NerdPOS System</p>
                        <p className="text-[10px] text-gray-600 mt-2">
                            {formatDateTime(new Date().toISOString())}
                        </p>
                    </div>

                    {/* Shift Info */}
                    <div className="space-y-1 border-b border-dashed border-gray-400 pb-3 mb-3 text-xs">
                        <div className="flex justify-between">
                            <span className="font-bold">Shift ID:</span>
                            <span className="font-mono">{shift.id.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold">Cashier:</span>
                            <span>{shift.cashierName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold">Start:</span>
                            <span className="font-mono text-[10px]">{formatDateTime(shift.startTime)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-bold">End:</span>
                            <span className="font-mono text-[10px]">{formatDateTime(new Date().toISOString())}</span>
                        </div>
                    </div>

                    {/* Cash Reconciliation */}
                    <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
                        <div className="text-xs font-bold mb-2">CASH RECONCILIATION</div>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span>Starting Cash:</span>
                                <span className="font-mono">{parseFloat(shift.startingCash).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>+ Cash Sales:</span>
                                <span className="font-mono">+{parseFloat(shift.totalCashSales).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-400 pt-1 mt-1 font-bold">
                                <span>= Expected Cash:</span>
                                <span className="font-mono">{parseFloat(shift.expectedCash).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mt-2">
                                <span>Counted Cash:</span>
                                <span className="font-mono">{parseFloat(countedCash).toFixed(2)}</span>
                            </div>
                            <div className={`flex justify-between font-bold ${difference.isZero() ? '' : difference.lessThan(0) ? 'text-red-600' : 'text-blue-600'}`}>
                                <span>Difference:</span>
                                <span className="font-mono">{difference.greaterThanOrEqualTo(0) ? '+' : ''}{differenceStr}</span>
                            </div>
                        </div>
                    </div>

                    {/* Sales Summary */}
                    <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
                        <div className="text-xs font-bold mb-2">SALES SUMMARY</div>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span>Cash Sales:</span>
                                <span className="font-mono">{parseFloat(shift.totalCashSales).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Card Sales:</span>
                                <span className="font-mono">{parseFloat(shift.totalCardSales).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-400 pt-1 mt-1 font-bold">
                                <span>Total Sales:</span>
                                <span className="font-mono">{parseFloat(shift.totalSales).toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span>Transactions:</span>
                                <span className="font-mono">{shift.transactionCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-600 pt-3">
                        <p className="font-bold">END OF Z-REPORT</p>
                        <p className="font-mono text-[10px] mt-2">{shift.id}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
