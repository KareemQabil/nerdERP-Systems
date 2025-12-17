import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, TrendingUp, TrendingDown, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface DrawerClosingData {
    openingBalance: number;
    cashSales: number;
    cashReturns: number;
    pettyCash: number;
    dropsToSafe: number;
    expectedBalance: number;
    actualCounted: number;
    difference: number;
    overShort: 'over' | 'short' | 'exact';
}

interface DrawerClosingModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionData: {
        id: string;
        openingBalance: number;
        cashSales: number;
        cashReturns: number;
        pettyCash: number;
        dropsToSafe: number;
    };
    onSubmit: (closingData: DrawerClosingData, notes: string) => void;
}

export function DrawerClosingModal({
    isOpen,
    onClose,
    sessionData,
    onSubmit,
}: DrawerClosingModalProps) {
    const [counted, setCounted] = useState({
        bills1000: 0,
        bills500: 0,
        bills200: 0,
        bills100: 0,
        bills50: 0,
        bills10: 0,
        bills5: 0,
        bills1: 0,
        coins050: 0,
        coins025: 0,
    });
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const expectedBalance =
        sessionData.openingBalance +
        sessionData.cashSales -
        sessionData.cashReturns -
        sessionData.pettyCash -
        sessionData.dropsToSafe;

    const actualCounted =
        counted.bills1000 * 1000 +
        counted.bills500 * 500 +
        counted.bills200 * 200 +
        counted.bills100 * 100 +
        counted.bills50 * 50 +
        counted.bills10 * 10 +
        counted.bills5 * 5 +
        counted.bills1 * 1 +
        counted.coins050 * 0.5 +
        counted.coins025 * 0.25;

    const difference = actualCounted - expectedBalance;
    const overShort: 'over' | 'short' | 'exact' =
        Math.abs(difference) < 0.01 ? 'exact' : difference > 0 ? 'over' : 'short';

    const handleSubmit = async () => {
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        const closingData: DrawerClosingData = {
            openingBalance: sessionData.openingBalance,
            cashSales: sessionData.cashSales,
            cashReturns: sessionData.cashReturns,
            pettyCash: sessionData.pettyCash,
            dropsToSafe: sessionData.dropsToSafe,
            expectedBalance,
            actualCounted,
            difference,
            overShort,
        };

        onSubmit(closingData, notes);
        setIsSubmitting(false);
        onClose();
    };

    const denominations = [
        { key: 'bills1000' as keyof typeof counted, label: '1000 ر.س', value: 1000 },
        { key: 'bills500' as keyof typeof counted, label: '500 ر.س', value: 500 },
        { key: 'bills200' as keyof typeof counted, label: '200 ر.س', value: 200 },
        { key: 'bills100' as keyof typeof counted, label: '100 ر.س', value: 100 },
        { key: 'bills50' as keyof typeof counted, label: '50 ر.س', value: 50 },
        { key: 'bills10' as keyof typeof counted, label: '10 ر.س', value: 10 },
        { key: 'bills5' as keyof typeof counted, label: '5 ر.س', value: 5 },
        { key: 'bills1' as keyof typeof counted, label: '1 ر.س', value: 1 },
        { key: 'coins050' as keyof typeof counted, label: '50 هللة', value: 0.5 },
        { key: 'coins025' as keyof typeof counted, label: '25 هللة', value: 0.25 },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-3xl max-h-[90vh] bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--outline-variant)] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[var(--surface-variant)] border-b border-[var(--outline-variant)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-400 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-[#00373a]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                    إغلاق الدرج النقدي
                                </h2>
                                <p className="text-sm text-[var(--on-surface-variant)]">
                                    جرد النقدية وإغلاق الجلسة
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-10 h-10 rounded-xl hover:bg-[var(--surface)] transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-[var(--on-surface-variant)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Session Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="bg-[var(--surface-variant)] rounded-xl p-4">
                                <p className="text-xs text-[var(--on-surface-variant)] font-['Almarai'] mb-1" dir="auto">
                                    رصيد الافتتاح
                                </p>
                                <p className="text-lg font-['Arial'] font-bold text-[var(--on-surface)]">
                                    {sessionData.openingBalance.toFixed(2)} ر.س
                                </p>
                            </div>
                            <div className="bg-green-500/10 rounded-xl p-4">
                                <p className="text-xs text-green-400 font-['Almarai'] mb-1" dir="auto">
                                    المبيعات النقدية
                                </p>
                                <p className="text-lg font-['Arial'] font-bold text-green-400">
                                    +{sessionData.cashSales.toFixed(2)} ر.س
                                </p>
                            </div>
                            <div className="bg-red-500/10 rounded-xl p-4">
                                <p className="text-xs text-red-400 font-['Almarai'] mb-1" dir="auto">
                                    المرتجعات
                                </p>
                                <p className="text-lg font-['Arial'] font-bold text-red-400">
                                    -{sessionData.cashReturns.toFixed(2)} ر.س
                                </p>
                            </div>
                            <div className="bg-orange-500/10 rounded-xl p-4">
                                <p className="text-xs text-orange-400 font-['Almarai'] mb-1" dir="auto">
                                    مصروفات نثرية
                                </p>
                                <p className="text-lg font-['Arial'] font-bold text-orange-400">
                                    -{sessionData.pettyCash.toFixed(2)} ر.س
                                </p>
                            </div>
                            <div className="bg-blue-500/10 rounded-xl p-4">
                                <p className="text-xs text-blue-400 font-['Almarai'] mb-1" dir="auto">
                                    إيداع للخزنة
                                </p>
                                <p className="text-lg font-['Arial'] font-bold text-blue-400">
                                    -{sessionData.dropsToSafe.toFixed(2)} ر.س
                                </p>
                            </div>
                            <div className="bg-cyan-500/10 rounded-xl p-4">
                                <p className="text-xs text-cyan-400 font-['Almarai'] mb-1" dir="auto">
                                    الرصيد المتوقع
                                </p>
                                <p className="text-lg font-['Arial'] font-bold text-cyan-400">
                                    {expectedBalance.toFixed(2)} ر.س
                                </p>
                            </div>
                        </div>

                        {/* Cash Count */}
                        <div>
                            <h3 className="text-base font-['Almarai'] font-bold text-[var(--on-surface)] mb-4" dir="auto">
                                عد النقدية
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {denominations.map((denom) => (
                                    <div key={denom.key} className="bg-[var(--surface-variant)] rounded-xl p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-['Almarai'] text-[var(--on-surface)]" dir="auto">
                                                {denom.label}
                                            </span>
                                            <span className="text-xs text-[var(--on-surface-variant)]">
                                                {(counted[denom.key] * denom.value).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    setCounted((prev) => ({ ...prev, [denom.key]: Math.max(0, prev[denom.key] - 1) }))
                                                }
                                                disabled={isSubmitting}
                                                className="w-8 h-8 rounded-lg bg-[var(--surface)] hover:bg-[var(--outline-variant)] flex items-center justify-center transition-colors disabled:opacity-50"
                                            >
                                                <span className="text-lg">-</span>
                                            </button>
                                            <input
                                                type="number"
                                                value={counted[denom.key]}
                                                onChange={(e) =>
                                                    setCounted((prev) => ({
                                                        ...prev,
                                                        [denom.key]: Math.max(0, parseInt(e.target.value) || 0),
                                                    }))
                                                }
                                                disabled={isSubmitting}
                                                className="flex-1 h-8 px-2 bg-[var(--surface)] border border-[var(--outline-variant)] rounded-lg text-center text-sm font-['Arial'] font-bold text-[var(--on-surface)] focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                                                dir="ltr"
                                            />
                                            <button
                                                onClick={() => setCounted((prev) => ({ ...prev, [denom.key]: prev[denom.key] + 1 }))}
                                                disabled={isSubmitting}
                                                className="w-8 h-8 rounded-lg bg-[var(--surface)] hover:bg-[var(--outline-variant)] flex items-center justify-center transition-colors disabled:opacity-50"
                                            >
                                                <span className="text-lg">+</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total Counted */}
                        <div className="bg-gradient-to-r from-cyan-400/10 to-blue-600/10 border border-cyan-400/30 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-base font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                    إجمالي العد
                                </span>
                                <span className="text-3xl font-['Arial'] font-bold text-cyan-400">
                                    {actualCounted.toFixed(2)} ر.س
                                </span>
                            </div>

                            {/* Difference */}
                            <div
                                className={`flex items-center justify-between p-4 rounded-xl ${overShort === 'exact'
                                        ? 'bg-green-500/20 border border-green-500/30'
                                        : overShort === 'over'
                                            ? 'bg-blue-500/20 border border-blue-500/30'
                                            : 'bg-red-500/20 border border-red-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {overShort === 'exact' ? (
                                        <Check className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-orange-400" />
                                    )}
                                    <span className="text-sm font-['Almarai'] font-bold" dir="auto">
                                        {overShort === 'exact' ? 'متوازن' : overShort === 'over' ? 'زيادة' : 'نقص'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {overShort !== 'exact' && (
                                        <>
                                            {overShort === 'over' ? (
                                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                            ) : (
                                                <TrendingDown className="w-5 h-5 text-red-400" />
                                            )}
                                        </>
                                    )}
                                    <span
                                        className={`text-xl font-['Arial'] font-bold ${overShort === 'exact'
                                                ? 'text-green-400'
                                                : overShort === 'over'
                                                    ? 'text-blue-400'
                                                    : 'text-red-400'
                                            }`}
                                    >
                                        {Math.abs(difference).toFixed(2)} ر.س
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-['Almarai'] font-bold text-[var(--on-surface)] mb-2" dir="auto">
                                ملاحظات (اختياري)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isSubmitting}
                                placeholder="أي ملاحظات حول الجلسة..."
                                className="w-full px-4 py-3 bg-[var(--surface-variant)] border border-[var(--outline-variant)] rounded-xl text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] font-['Almarai'] focus:outline-none focus:border-green-400 resize-none transition-colors disabled:opacity-50"
                                rows={3}
                                dir="rtl"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-[var(--outline-variant)] flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-1 h-14 rounded-xl bg-gradient-to-b from-green-400 to-green-600 text-[#00373a] font-['Almarai'] font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
                        >
                            <Check className="w-5 h-5" />
                            <span dir="auto">{isSubmitting ? 'جاري الإغلاق...' : 'إغلاق الجلسة'}</span>
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 h-14 rounded-xl bg-[var(--surface-variant)] hover:bg-[var(--outline-variant)] text-[var(--on-surface)] font-['Almarai'] font-bold transition-colors disabled:opacity-50"
                        >
                            <span dir="auto">إلغاء</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
