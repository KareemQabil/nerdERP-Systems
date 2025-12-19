import { useState } from 'react';
import { Clock, TrendingUp, User, LogOut, Plus, Minus, DollarSign, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShiftStore } from '../store/shiftStore';
import { OpenShiftModal } from './OpenShiftModal';
import { CloseShiftModal } from './CloseShiftModal';
import { CashAdjustmentModal } from './CashAdjustmentModal';

export interface ShiftControlModalProps {
    onClose: () => void;
}

/**
 * ShiftControlModal - Enhanced Shift Management Hub
 * 
 * Features:
 * - Live expected cash display
 * - Pay In/Out buttons
 * - Transaction history (last 10)
 * - Open/Close shift actions
 */
export function ShiftControlModal({ onClose }: ShiftControlModalProps) {
    const { isShiftOpen, currentShift, payIn, payOut, getTransactionHistory } = useShiftStore();
    const [showOpenShift, setShowOpenShift] = useState(false);
    const [showCloseShift, setShowCloseShift] = useState(false);
    const [showCashAdjustment, setShowCashAdjustment] = useState<'PAY_IN' | 'PAY_OUT' | null>(null);

    const handleOpenShift = () => {
        setShowOpenShift(true);
    };

    const handleShiftOpened = () => {
        setShowOpenShift(false);
        onClose();
    };

    const handleCloseShift = () => {
        setShowCloseShift(true);
    };

    const handleShiftClosed = () => {
        setShowCloseShift(false);
        onClose();
    };

    const handlePayIn = (amount: string, reason: string) => {
        payIn(amount, reason);
        setShowCashAdjustment(null);
    };

    const handlePayOut = (amount: string, reason: string) => {
        payOut(amount, reason);
        setShowCashAdjustment(null);
    };

    // Get transaction history
    const transactions = getTransactionHistory().slice(-10).reverse(); // Last 10, newest first

    // If shift modals are open, render them
    if (showOpenShift) {
        return <OpenShiftModal onShiftOpened={handleShiftOpened} />;
    }

    if (showCloseShift && currentShift) {
        return (
            <CloseShiftModal
                shift={currentShift}
                onClose={() => setShowCloseShift(false)}
                onShiftClosed={handleShiftClosed}
            />
        );
    }

    return (
        <>
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white font-['Almarai']">
                                        إدارة الوردية
                                    </h2>
                                    <p className="text-sm text-gray-400">Shift Management</p>
                                </div>
                            </div>
                        </div>

                        {/* Body - SCROLLABLE */}
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Status Display */}
                            <div className={`p-4 rounded-xl border-2 ${isShiftOpen ? 'bg-emerald-500/10 border-emerald-400/30' : 'bg-red-500/10 border-red-400/30'}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-400 font-['Almarai']">حالة الوردية</p>
                                        <p className={`text-lg font-bold font-['Almarai'] ${isShiftOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {isShiftOpen ? 'مفتوحة' : 'مغلقة'}
                                        </p>
                                    </div>
                                    <div className={`w-16 h-16 rounded-full ${isShiftOpen ? 'bg-emerald-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                                        <div className={`w-8 h-8 rounded-full ${isShiftOpen ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                                    </div>
                                </div>
                            </div>

                            {/* Shift Details (if open) */}
                            {isShiftOpen && currentShift && (
                                <>
                                    {/* Cashier Info */}
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-cyan-400" />
                                            <p className="text-xs text-gray-400 font-['Almarai']">الكاشير</p>
                                        </div>
                                        <p className="text-white font-['Almarai']">{currentShift.cashierName}</p>
                                    </div>

                                    {/* Live Expected Cash - BIG DISPLAY */}
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400/30">
                                        <div className="flex items-center gap-2 mb-3">
                                            <DollarSign className="w-5 h-5 text-cyan-400" />
                                            <p className="text-sm font-bold text-cyan-400 font-['Almarai']">النقدية المتوقعة في الدرج</p>
                                        </div>
                                        <p className="text-4xl font-mono font-bold text-white">
                                            {parseFloat(currentShift.expectedCash).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">SAR (Expected Cash in Drawer)</p>
                                    </div>

                                    {/* Pay In/Out Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setShowCashAdjustment('PAY_IN')}
                                            className="h-14 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 hover:border-emerald-400/50 text-emerald-400 font-bold font-['Almarai'] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span>إضافة نقدية</span>
                                        </button>
                                        <button
                                            onClick={() => setShowCashAdjustment('PAY_OUT')}
                                            className="h-14 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 hover:border-red-400/50 text-red-400 font-bold font-['Almarai'] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Minus className="w-5 h-5" />
                                            <span>سحب نقدية</span>
                                        </button>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-xs text-gray-400 font-['Almarai'] mb-1">رصيد البداية</p>
                                            <p className="text-lg font-mono font-bold text-cyan-400">
                                                {parseFloat(currentShift.startingCash).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            <p className="text-xs text-gray-400 font-['Almarai'] mb-1">إجمالي المبيعات</p>
                                            <p className="text-lg font-mono font-bold text-emerald-400">
                                                {parseFloat(currentShift.totalSales).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Transaction History */}
                                    {transactions.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <History className="w-4 h-4 text-gray-400" />
                                                <p className="text-sm font-bold text-gray-300 font-['Almarai']">آخر المعاملات</p>
                                            </div>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {transactions.map((txn) => (
                                                    <div
                                                        key={txn.id}
                                                        className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs font-bold px-2 py-1 rounded ${txn.type === 'SALE' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                    txn.type === 'REFUND' ? 'bg-red-500/20 text-red-400' :
                                                                        txn.type === 'PAY_IN' ? 'bg-blue-500/20 text-blue-400' :
                                                                            'bg-amber-500/20 text-amber-400'
                                                                    }`}>
                                                                    {txn.type}
                                                                </span>
                                                                {txn.paymentMethod && (
                                                                    <span className="text-xs text-gray-500">{txn.paymentMethod}</span>
                                                                )}
                                                            </div>
                                                            {txn.reason && (
                                                                <p className="text-xs text-gray-400 mt-1">{txn.reason}</p>
                                                            )}
                                                            <p className="text-[10px] text-gray-500 mt-1">
                                                                {new Date(txn.timestamp).toLocaleTimeString('ar-SA')}
                                                            </p>
                                                        </div>
                                                        <p className={`text-lg font-mono font-bold ${txn.type === 'PAY_OUT' || txn.type === 'REFUND' ? 'text-red-400' : 'text-emerald-400'
                                                            }`}>
                                                            {txn.type === 'PAY_OUT' || txn.type === 'REFUND' ? '-' : '+'}
                                                            {parseFloat(txn.amount).toFixed(2)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/30">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-blue-400" />
                                            <p className="text-xs text-blue-200 font-['Almarai']">
                                                {currentShift.transactionCount} معاملة حتى الآن
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* No Shift Message */}
                            {!isShiftOpen && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30">
                                    <p className="text-sm text-amber-200 font-['Almarai']">
                                        ⚠️ يجب فتح وردية جديدة لبدء العمل
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Please open a new shift to start working
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 space-y-2 bg-gradient-to-t from-black/40 to-transparent">
                            {!isShiftOpen ? (
                                <button
                                    onClick={handleOpenShift}
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-['Almarai'] transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2"
                                >
                                    <Clock className="w-5 h-5" />
                                    <span>فتح وردية جديدة</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleCloseShift}
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold font-['Almarai'] transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>إغلاق الوردية</span>
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-['Almarai'] font-bold transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>

            {/* Cash Adjustment Modal */}
            {showCashAdjustment && (
                <CashAdjustmentModal
                    type={showCashAdjustment}
                    onConfirm={showCashAdjustment === 'PAY_IN' ? handlePayIn : handlePayOut}
                    onClose={() => setShowCashAdjustment(null)}
                />
            )}
        </>
    );
}
