import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Divide,
    Users,
    CheckCircle2,
    ArrowRight,
    Plus,
    Minus,
    ChefHat,
    Receipt,
    User,
    ArrowUpDown,
    Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import Decimal from 'decimal.js';
import type { OrderItem } from '@/types/pos.types';

// =============================================================================
// TYPES
// =============================================================================

export type SplitMethod = 'EQUAL' | 'ITEM';

export interface SplitOrderItem {
    orderItemId: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    isSplittable: boolean; // Some items like shared platters may not be splittable
}

export interface OrderSummary {
    orderId: string;
    orderNumber: string;
    tableNumber?: string;
    customerName?: string;
    subtotal: string;
    tax: string;
    discount: string;
    total: string;
    itemCount: number;
}

export interface SeatAssignment {
    seatNumber: number;
    name?: string;
    itemIds: string[];
    quantityPerItem?: Record<string, number>; // For partial quantity splits
}

export interface SplitResult {
    method: SplitMethod;
    splits: Array<{
        seatNumber: number;
        name?: string;
        items: string[];
        subtotal: string;
        tax: string;
        total: string;
    }>;
}

interface SplitBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (result: SplitResult) => Promise<void>;
    /** Order to split */
    order: OrderSummary;
    /** Items in the order */
    items: SplitOrderItem[];
}

type SplitStep = 'METHOD' | 'EQUAL' | 'ITEM' | 'REVIEW' | 'PROCESSING' | 'COMPLETE';

// =============================================================================
// SPLIT BILL MODAL COMPONENT
// =============================================================================

/**
 * SplitBillModal
 *
 * Multi-step bill splitting workflow:
 * 1. METHOD - Select split method (equal or item-based)
 * 2. EQUAL - Set number of guests, shows equal split amounts
 * 3. ITEM - Assign items to seats/guests
 * 4. REVIEW - Review the split configuration
 * 5. PROCESSING - Submitting to backend
 * 6. COMPLETE - Success confirmation
 */
export function SplitBillModal({
    isOpen,
    onClose,
    onComplete,
    order,
    items,
}: SplitBillModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();

    const [step, setStep] = useState<SplitStep>('METHOD');
    const [splitMethod, setSplitMethod] = useState<SplitMethod | null>(null);
    const [guestCount, setGuestCount] = useState(2);
    const [seatAssignments, setSeatAssignments] = useState<SeatAssignment[]>([]);
    const [selectedSeat, setSelectedSeat] = useState<number>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [splitResult, setSplitResult] = useState<{
        success: boolean;
        message?: string;
    } | null>(null);

    // Initialize seat assignments for item-based split
    const initializeSeatAssignments = (count: number) => {
        const assignments: SeatAssignment[] = [];
        for (let i = 1; i <= count; i++) {
            assignments.push({
                seatNumber: i,
                name: `${language === 'ar' ? 'ضيف' : 'Guest'} ${i}`,
                itemIds: [],
            });
        }
        setSeatAssignments(assignments);
        setSelectedSeat(1);
    };

    // Calculate split totals for equal split
    const equalSplitTotals = useMemo(() => {
        if (splitMethod !== 'EQUAL' || guestCount === 0) return null;

        const totalDecimal = new Decimal(order.total);
        const taxDecimal = new Decimal(order.tax);
        const discountDecimal = new Decimal(order.discount);
        const subtotalDecimal = new Decimal(order.subtotal);

        const perGuestTotal = totalDecimal.div(guestCount);
        const perGuestTax = taxDecimal.div(guestCount);
        const perGuestDiscount = discountDecimal.div(guestCount);
        const perGuestSubtotal = subtotalDecimal.div(guestCount);

        return {
            subtotal: perGuestSubtotal.toFixed(3),
            tax: perGuestTax.toFixed(3),
            discount: perGuestDiscount.toFixed(3),
            total: perGuestTotal.toFixed(3),
        };
    }, [splitMethod, guestCount, order]);

    // Calculate totals for item-based split
    const itemSplitTotals = useMemo(() => {
        if (splitMethod !== 'ITEM') return [];

        return seatAssignments.map((seat) => {
            let subtotal = new Decimal(0);

            seat.itemIds.forEach((itemId) => {
                const item = items.find((i) => i.orderItemId === itemId);
                if (item) {
                    const qty = seat.quantityPerItem?.[itemId] || item.quantity;
                    subtotal = subtotal.plus(new Decimal(item.unitPrice).mul(qty));
                }
            });

            // Calculate tax (14% in KSA, adjust based on config)
            const taxRate = new Decimal('0.14');
            const tax = subtotal.mul(taxRate);
            const total = subtotal.plus(tax);

            return {
                seatNumber: seat.seatNumber,
                name: seat.name,
                subtotal: subtotal.toFixed(3),
                tax: tax.toFixed(3),
                total: total.toFixed(3),
                itemCount: seat.itemIds.length,
            };
        });
    }, [splitMethod, seatAssignments, items]);

    // Get unassigned items for item-based split
    const unassignedItems = useMemo(() => {
        if (splitMethod !== 'ITEM') return [];

        const assignedIds = new Set<string>();
        seatAssignments.forEach((seat) => {
            seat.itemIds.forEach((id) => assignedIds.add(id));
        });

        return items.filter((item) => !assignedIds.has(item.orderItemId) && item.isSplittable);
    }, [splitMethod, seatAssignments, items]);

    // Get items for current seat
    const currentSeatItems = useMemo(() => {
        if (splitMethod !== 'ITEM') return [];

        const currentSeat = seatAssignments.find((s) => s.seatNumber === selectedSeat);
        if (!currentSeat) return [];

        return currentSeat.itemIds
            .map((id) => items.find((i) => i.orderItemId === id))
            .filter(Boolean) as SplitOrderItem[];
    }, [splitMethod, seatAssignments, selectedSeat, items]);

    // Reset state when modal opens/closes
    const handleReset = () => {
        setStep('METHOD');
        setSplitMethod(null);
        setGuestCount(2);
        setSeatAssignments([]);
        setSelectedSeat(1);
        setIsProcessing(false);
        setSplitResult(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Step 1: Select split method
    const handleMethodSelect = (method: SplitMethod) => {
        setSplitMethod(method);
        if (method === 'EQUAL') {
            setStep('EQUAL');
        } else {
            // Initialize with 2 guests for item-based split
            initializeSeatAssignments(2);
            setStep('ITEM');
        }
    };

    // Step 2: Confirm equal split
    const handleEqualSplitProceed = () => {
        setStep('REVIEW');
    };

    // Step 3: Confirm item assignments
    const handleItemSplitProceed = () => {
        // Check if all items are assigned
        if (unassignedItems.length > 0) {
            return; // Don't proceed if items are unassigned
        }
        setStep('REVIEW');
    };

    // Assign item to current seat
    const assignItemToSeat = (itemId: string) => {
        setSeatAssignments((prev) => {
            return prev.map((seat) => {
                if (seat.seatNumber === selectedSeat) {
                    // Add item if not already assigned
                    if (!seat.itemIds.includes(itemId)) {
                        return {
                            ...seat,
                            itemIds: [...seat.itemIds, itemId],
                        };
                    }
                }
                return seat;
            });
        });
    };

    // Remove item from current seat
    const removeItemFromSeat = (itemId: string) => {
        setSeatAssignments((prev) => {
            return prev.map((seat) => {
                if (seat.seatNumber === selectedSeat) {
                    const newQuantityPerItem = { ...seat.quantityPerItem };
                    delete newQuantityPerItem[itemId];
                    return {
                        ...seat,
                        itemIds: seat.itemIds.filter((id) => id !== itemId),
                        quantityPerItem: newQuantityPerItem,
                    };
                }
                return seat;
            });
        });
    };

    // Update guest count for equal split
    const updateGuestCount = (delta: number) => {
        const newCount = Math.max(1, Math.min(20, guestCount + delta));
        setGuestCount(newCount);
    };

    // Add new seat for item-based split
    const addSeat = () => {
        if (seatAssignments.length >= 20) return;
        const newSeatNumber = seatAssignments.length + 1;
        setSeatAssignments([
            ...seatAssignments,
            {
                seatNumber: newSeatNumber,
                name: `${language === 'ar' ? 'ضيف' : 'Guest'} ${newSeatNumber}`,
                itemIds: [],
            },
        ]);
    };

    // Update seat name
    const updateSeatName = (seatNumber: number, name: string) => {
        setSeatAssignments((prev) =>
            prev.map((seat) =>
                seat.seatNumber === seatNumber ? { ...seat, name } : seat
            )
        );
    };

    // Submit split to backend
    const handleSubmitSplit = async () => {
        setIsProcessing(true);
        setStep('PROCESSING');

        try {
            let result: SplitResult;

            if (splitMethod === 'EQUAL') {
                result = {
                    method: 'EQUAL',
                    splits: Array.from({ length: guestCount }, (_, i) => ({
                        seatNumber: i + 1,
                        name: `${language === 'ar' ? 'ضيف' : 'Guest'} ${i + 1}`,
                        items: [], // Equal split doesn't track individual items
                        subtotal: equalSplitTotals!.subtotal,
                        tax: equalSplitTotals!.tax,
                        total: equalSplitTotals!.total,
                    })),
                };
            } else {
                result = {
                    method: 'ITEM',
                    splits: itemSplitTotals.map((total) => {
                        const seat = seatAssignments.find((s) => s.seatNumber === total.seatNumber)!;
                        return {
                            seatNumber: total.seatNumber,
                            name: total.name,
                            items: seat.itemIds,
                            subtotal: total.subtotal,
                            tax: total.tax,
                            total: total.total,
                        };
                    }),
                };
            }

            await onComplete(result);

            setSplitResult({ success: true });
            setStep('COMPLETE');
        } catch (error) {
            setSplitResult({
                success: false,
                message: (error as Error).message || (language === 'ar' ? 'فشل العملية' : 'Operation failed'),
            });
            setStep('COMPLETE');
        } finally {
            setIsProcessing(false);
        }
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
                    onClick={handleClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    data-theme={theme}
                    className={cn(
                        'relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden',
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
                                step === 'COMPLETE'
                                    ? splitResult?.success
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        : 'bg-gradient-to-br from-red-500 to-red-600'
                                    : 'bg-gradient-to-br from-purple-500 to-indigo-600',
                            )}>
                                {step === 'COMPLETE' ? (
                                    splitResult?.success ? (
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <X className="w-5 h-5 text-white" />
                                    )
                                ) : (
                                    <Divide className="w-5 h-5 text-white" />
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
                                    {step === 'COMPLETE' && splitResult?.success
                                        ? t('split.splitComplete', 'Split Complete')
                                        : step === 'COMPLETE' && !splitResult?.success
                                            ? t('split.splitFailed', 'Split Failed')
                                            : t('split.splitBill', 'Split Bill')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Order #{order.orderNumber} • {order.tableNumber && `${t('split.table', 'Table')} ${order.tableNumber}`}
                                </p>
                            </div>
                        </div>
                        {step !== 'PROCESSING' && step !== 'COMPLETE' && (
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
                            {/* METHOD STEP */}
                            {step === 'METHOD' && (
                                <motion.div
                                    key="method"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    {/* Order Summary */}
                                    <div
                                        data-theme={theme}
                                        className={cn(
                                            'rounded-xl p-3',
                                            'bg-slate-800/50',
                                            'data-[theme=light]:bg-slate-50',
                                        )}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">
                                                {t('split.orderTotal', 'Order Total')}
                                            </span>
                                            <PriceDisplay value={order.total} size="lg" variant="primary" />
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-400 text-center">
                                        {t('split.selectMethod', 'Select split method')}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Equal Split */}
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleMethodSelect('EQUAL')}
                                            data-theme={theme}
                                            className={cn(
                                                'p-4 rounded-xl border-2 transition-all text-left',
                                                'border-slate-700 hover:border-purple-500/50 hover:bg-purple-500/10',
                                                'data-[theme=light]:border-slate-300 data-[theme=light]:hover:border-purple-400',
                                            )}
                                        >
                                            <div className="flex flex-col items-center text-center gap-3">
                                                <div className={cn(
                                                    'w-12 h-12 rounded-xl flex items-center justify-center',
                                                    'bg-purple-500/20 text-purple-400',
                                                )}>
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p
                                                        data-theme={theme}
                                                        className={cn(
                                                            'font-bold text-sm mb-1',
                                                            'text-white',
                                                            'data-[theme=light]:text-slate-900',
                                                        )}
                                                    >
                                                        {t('split.equalSplit', 'Equal Split')}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {t('split.equalSplitDescription', 'Divide bill equally among guests')}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>

                                        {/* Item Split */}
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleMethodSelect('ITEM')}
                                            data-theme={theme}
                                            className={cn(
                                                'p-4 rounded-xl border-2 transition-all text-left',
                                                'border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/10',
                                                'data-[theme=light]:border-slate-300 data-[theme=light]:hover:border-indigo-400',
                                            )}
                                        >
                                            <div className="flex flex-col items-center text-center gap-3">
                                                <div className={cn(
                                                    'w-12 h-12 rounded-xl flex items-center justify-center',
                                                    'bg-indigo-500/20 text-indigo-400',
                                                )}>
                                                    <Receipt className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p
                                                        data-theme={theme}
                                                        className={cn(
                                                            'font-bold text-sm mb-1',
                                                            'text-white',
                                                            'data-[theme=light]:text-slate-900',
                                                        )}
                                                    >
                                                        {t('split.itemSplit', 'Item Split')}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {t('split.itemSplitDescription', 'Assign items to each guest')}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                            {/* EQUAL STEP */}
                            {step === 'EQUAL' && (
                                <motion.div
                                    key="equal"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <p className="text-sm text-slate-400 text-center">
                                        {t('split.setGuestCount', 'Set number of guests')}
                                    </p>

                                    {/* Guest Count Selector */}
                                    <div className="flex items-center justify-center gap-4">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => updateGuestCount(-1)}
                                            className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                                        >
                                            <Minus className="w-5 h-5 text-slate-300" />
                                        </motion.button>

                                        <div className="flex flex-col items-center">
                                            <span
                                                data-theme={theme}
                                                className={cn(
                                                    'text-4xl font-bold',
                                                    'text-white',
                                                    'data-[theme=light]:text-slate-900',
                                                )}
                                            >
                                                {guestCount}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {t('split.guests', 'Guests')}
                                            </span>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => updateGuestCount(1)}
                                            className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                                        >
                                            <Plus className="w-5 h-5 text-slate-300" />
                                        </motion.button>
                                    </div>

                                    {/* Per Guest Breakdown */}
                                    {equalSplitTotals && (
                                        <div
                                            data-theme={theme}
                                            className={cn(
                                                'rounded-xl p-4 space-y-2',
                                                'bg-purple-500/10 border border-purple-500/30',
                                            )}
                                        >
                                            <p className="text-xs text-purple-400 text-center mb-3">
                                                {t('split.perGuest', 'Amount Per Guest')}
                                            </p>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400">{t('summary.subtotal')}</span>
                                                <PriceDisplay
                                                    value={equalSplitTotals.subtotal}
                                                    size="sm"
                                                    variant="muted"
                                                />
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-400">{t('summary.tax')}</span>
                                                <PriceDisplay
                                                    value={equalSplitTotals.tax}
                                                    size="sm"
                                                    variant="muted"
                                                />
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-purple-500/30 font-bold">
                                                <span
                                                    data-theme={theme}
                                                    className={cn(
                                                        'text-white',
                                                        'data-[theme=light]:text-slate-900',
                                                    )}
                                                >
                                                    {t('summary.total')}
                                                </span>
                                                <PriceDisplay
                                                    value={equalSplitTotals.total}
                                                    size="lg"
                                                    variant="primary"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ITEM STEP */}
                            {step === 'ITEM' && (
                                <motion.div
                                    key="item"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-3"
                                >
                                    {/* Seat Selector */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                        {seatAssignments.map((seat) => (
                                            <motion.button
                                                key={seat.seatNumber}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setSelectedSeat(seat.seatNumber)}
                                                data-theme={theme}
                                                className={cn(
                                                    'px-3 py-2 rounded-xl border-2 transition-all flex-shrink-0',
                                                    selectedSeat === seat.seatNumber
                                                        ? 'bg-indigo-500 border-indigo-500 text-white'
                                                        : cn(
                                                            'bg-slate-800 border-slate-700',
                                                            'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-300',
                                                        ),
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    <span className="text-sm font-bold">
                                                        {seat.name}
                                                    </span>
                                                    <span className={cn(
                                                        'text-xs px-1.5 py-0.5 rounded',
                                                        selectedSeat === seat.seatNumber
                                                            ? 'bg-white/20'
                                                            : 'bg-slate-700',
                                                    )}>
                                                        {seat.itemIds.length}
                                                    </span>
                                                </div>
                                            </motion.button>
                                        ))}

                                        {seatAssignments.length < 20 && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={addSeat}
                                                className="px-3 py-2 rounded-xl border-2 border-dashed border-slate-600 hover:border-cyan-500 flex-shrink-0"
                                            >
                                                <Plus className="w-4 h-4 text-slate-400" />
                                            </motion.button>
                                        )}
                                    </div>

                                    {/* Current Seat Name Input */}
                                    <input
                                        type="text"
                                        value={seatAssignments.find((s) => s.seatNumber === selectedSeat)?.name || ''}
                                        onChange={(e) => updateSeatName(selectedSeat, e.target.value)}
                                        placeholder={language === 'ar' ? 'اسم الضيف' : 'Guest name'}
                                        data-theme={theme}
                                        className={cn(
                                            'w-full px-3 py-2 rounded-lg border-2 text-sm',
                                            'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                                            'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-300',
                                            'text-white placeholder:text-slate-500',
                                            'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder:text-slate-400',
                                        )}
                                    />

                                    {/* Unassigned Items */}
                                    {unassignedItems.length > 0 && (
                                        <div>
                                            <p className="text-xs text-slate-400 mb-2">
                                                {t('split.unassignedItems', 'Unassigned Items')}
                                            </p>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {unassignedItems.map((item) => (
                                                    <motion.div
                                                        key={item.orderItemId}
                                                        whileHover={{ scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        onClick={() => assignItemToSeat(item.orderItemId)}
                                                        data-theme={theme}
                                                        className={cn(
                                                            'rounded-lg p-2 cursor-pointer transition-all',
                                                            'bg-slate-800/50 hover:bg-slate-700/50',
                                                            'data-[theme=light]:bg-slate-50 data-[theme=light]:hover:bg-slate-100',
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p
                                                                    data-theme={theme}
                                                                    className={cn(
                                                                        'text-sm font-medium',
                                                                        'text-white',
                                                                        'data-[theme=light]:text-slate-900',
                                                                    )}
                                                                >
                                                                    {item.productName}
                                                                </p>
                                                                <p className="text-xs text-slate-400">
                                                                    {t('split.quantity', 'Qty')}: {item.quantity}
                                                                </p>
                                                            </div>
                                                            <Plus className="w-4 h-4 text-cyan-400" />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Current Seat Items */}
                                    {currentSeatItems.length > 0 && (
                                        <div>
                                            <p className="text-xs text-slate-400 mb-2">
                                                {t('split.itemsForGuest', 'Items for {{name}}', {
                                                    name: seatAssignments.find((s) => s.seatNumber === selectedSeat)?.name,
                                                })}
                                            </p>
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {currentSeatItems.map((item) => (
                                                    <motion.div
                                                        key={item.orderItemId}
                                                        whileHover={{ scale: 1.01 }}
                                                        data-theme={theme}
                                                        className={cn(
                                                            'rounded-lg p-2',
                                                            'bg-indigo-500/20 border border-indigo-500/30',
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p
                                                                    data-theme={theme}
                                                                    className={cn(
                                                                        'text-sm font-medium',
                                                                        'text-white',
                                                                        'data-[theme=light]:text-slate-900',
                                                                    )}
                                                                >
                                                                    {item.productName}
                                                                </p>
                                                                <p className="text-xs text-slate-400">
                                                                    {t('split.quantity', 'Qty')}: {item.quantity}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <PriceDisplay
                                                                    value={item.totalPrice}
                                                                    size="sm"
                                                                    variant="muted"
                                                                />
                                                                <motion.button
                                                                    whileTap={{ scale: 0.9 }}
                                                                    onClick={() => removeItemFromSeat(item.orderItemId)}
                                                                    className="p-1 rounded hover:bg-red-500/20"
                                                                >
                                                                    <Minus className="w-3 h-3 text-red-400" />
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Seat Total */}
                                            <div
                                                data-theme={theme}
                                                className={cn(
                                                    'mt-2 rounded-lg p-2 flex justify-between items-center',
                                                    'bg-indigo-500/10 border border-indigo-500/20',
                                                )}
                                            >
                                                <span className="text-xs text-indigo-400">
                                                    {t('split.seatTotal', 'Seat Total')}
                                                </span>
                                                {(() => {
                                                    const total = itemSplitTotals.find(
                                                        (t) => t.seatNumber === selectedSeat
                                                    );
                                                    return total ? (
                                                        <PriceDisplay
                                                            value={total.total}
                                                            size="sm"
                                                            variant="primary"
                                                        />
                                                    ) : null;
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Warning if items unassigned */}
                                    {unassignedItems.length > 0 && (
                                        <div className={cn(
                                            'rounded-lg p-2 flex items-start gap-2',
                                            'bg-yellow-500/20 border border-yellow-500/30',
                                        )}>
                                            <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-yellow-400">
                                                {t('split.unassignedWarning', '{{count}} items not assigned. Please assign all items before proceeding.', {
                                                    count: unassignedItems.length,
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* REVIEW STEP */}
                            {step === 'REVIEW' && (
                                <motion.div
                                    key="review"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-3"
                                >
                                    <p className="text-sm text-slate-400 text-center mb-4">
                                        {t('split.reviewSplit', 'Review split configuration')}
                                    </p>

                                    {splitMethod === 'EQUAL' ? (
                                        <div className="space-y-2">
                                            {Array.from({ length: guestCount }, (_, i) => i + 1).map((guestNum) => (
                                                <div
                                                    key={guestNum}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'rounded-lg p-3 flex justify-between items-center',
                                                        'bg-slate-800/50',
                                                        'data-[theme=light]:bg-slate-50',
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            'w-8 h-8 rounded-lg flex items-center justify-center',
                                                            'bg-purple-500/20 text-purple-400',
                                                        )}>
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <span
                                                            data-theme={theme}
                                                            className={cn(
                                                                'font-medium text-sm',
                                                                'text-white',
                                                                'data-[theme=light]:text-slate-900',
                                                            )}
                                                        >
                                                            {language === 'ar' ? 'ضيف' : 'Guest'} {guestNum}
                                                        </span>
                                                    </div>
                                                    <PriceDisplay
                                                        value={equalSplitTotals!.total}
                                                        size="sm"
                                                        variant="primary"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {itemSplitTotals.map((total) => (
                                                <div
                                                    key={total.seatNumber}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'rounded-lg p-3 flex justify-between items-center',
                                                        'bg-slate-800/50',
                                                        'data-[theme=light]:bg-slate-50',
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            'w-8 h-8 rounded-lg flex items-center justify-center',
                                                            'bg-indigo-500/20 text-indigo-400',
                                                        )}>
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p
                                                                data-theme={theme}
                                                                className={cn(
                                                                    'font-medium text-sm',
                                                                    'text-white',
                                                                    'data-[theme=light]:text-slate-900',
                                                                )}
                                                            >
                                                                {total.name}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {total.itemCount} {language === 'ar' ? 'عناصر' : 'items'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <PriceDisplay
                                                        value={total.total}
                                                        size="sm"
                                                        variant="primary"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
                                        className="w-16 h-16 mx-auto mb-4 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                                    />
                                    <p
                                        data-theme={theme}
                                        className={cn(
                                            'text-sm',
                                            'text-slate-300',
                                            'data-[theme=light]:text-slate-700',
                                        )}
                                    >
                                        {t('split.processing', 'Processing split...')}
                                    </p>
                                </motion.div>
                            )}

                            {/* COMPLETE STEP */}
                            {step === 'COMPLETE' && splitResult && (
                                <motion.div
                                    key="complete"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 10 }}
                                        className={cn(
                                            'w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center',
                                            splitResult.success
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                : 'bg-gradient-to-br from-red-500 to-red-600',
                                        )}
                                    >
                                        {splitResult.success ? (
                                            <CheckCircle2 className="w-8 h-8 text-white" />
                                        ) : (
                                            <X className="w-8 h-8 text-white" />
                                        )}
                                    </motion.div>

                                    <h3
                                        data-theme={theme}
                                        className={cn(
                                            'text-xl font-bold mb-1',
                                            'text-white',
                                            'data-[theme=light]:text-slate-900',
                                        )}
                                    >
                                        {splitResult.success
                                            ? t('split.splitCompleteTitle', 'Bill Split Successfully')
                                            : t('split.splitFailedTitle', 'Split Failed')}
                                    </h3>

                                    <p className="text-sm text-slate-400">
                                        {splitResult.message ||
                                            (splitResult.success
                                                ? t('split.splitCompleteMessage', 'The bill has been split into {{count}} separate orders.', {
                                                    count: splitMethod === 'EQUAL' ? guestCount : seatAssignments.length,
                                                })
                                                : t('split.splitFailedMessage', 'Failed to split the bill.'))}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {step !== 'PROCESSING' && step !== 'COMPLETE' && (
                        <div
                            data-theme={theme}
                            className={cn(
                                'p-4 border-t flex gap-2',
                                'border-slate-700/50',
                                'data-[theme=light]:border-slate-200',
                            )}
                        >
                            {step === 'EQUAL' && (
                                <>
                                    <Button variant="secondary" onClick={() => setStep('METHOD')}>
                                        {t('back', 'Back')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleEqualSplitProceed}
                                    >
                                        {t('split.reviewSplit', 'Review Split')}
                                        <ArrowRight className="w-4 h-4 ms-2" />
                                    </Button>
                                </>
                            )}

                            {step === 'ITEM' && (
                                <>
                                    <Button variant="secondary" onClick={() => setStep('METHOD')}>
                                        {t('back', 'Back')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleItemSplitProceed}
                                        disabled={unassignedItems.length > 0}
                                    >
                                        {t('split.reviewSplit', 'Review Split')}
                                        <ArrowRight className="w-4 h-4 ms-2" />
                                    </Button>
                                </>
                            )}

                            {step === 'REVIEW' && (
                                <>
                                    <Button variant="secondary" onClick={() => setStep(splitMethod === 'EQUAL' ? 'EQUAL' : 'ITEM')}>
                                        {t('back', 'Back')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleSubmitSplit}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                            />
                                        ) : (
                                            <>
                                                {t('split.confirmSplit', 'Confirm Split')}
                                                <Divide className="w-4 h-4 ms-2" />
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {step === 'COMPLETE' && (
                        <div
                            data-theme={theme}
                            className={cn(
                                'p-4 border-t',
                                'border-slate-700/50',
                                'data-[theme=light]:border-slate-200',
                            )}
                        >
                            <Button
                                variant={splitResult?.success ? 'primary' : 'secondary'}
                                className="w-full"
                                onClick={handleComplete}
                            >
                                {splitResult?.success ? (
                                    <>
                                        {t('split.close', 'Close')}
                                        <CheckCircle2 className="w-4 h-4 ms-2" />
                                    </>
                                ) : (
                                    t('split.close', 'Close')
                                )}
                            </Button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default SplitBillModal;
