import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    RotateCcw,
    Shield,
    CheckCircle2,
    XCircle,
    Package,
    User,
    Receipt,
    FileText,
    AlertCircle,
    RefreshCw,
    DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import Decimal from 'decimal.js';
import type {
    ReturnOrderType,
    ReturnReason,
    ReturnItemRequest,
    PinAuthorizationRequest,
} from '@/types/pos.types';

// =============================================================================
// RETURN REASONS (Bilingual)
// =============================================================================

const RETURN_REASONS: Array<{
    value: ReturnReason;
    labelEn: string;
    labelAr: string;
    icon: typeof AlertCircle;
    color: string;
}> = [
    {
        value: 'DEFECTIVE',
        labelEn: 'Defective Product',
        labelAr: 'منتج معيب',
        icon: XCircle,
        color: 'from-red-500 to-red-600',
    },
    {
        value: 'WRONG_ITEM',
        labelEn: 'Wrong Item Delivered',
        labelAr: 'تم تسليم منتج خاطئ',
        icon: Package,
        color: 'from-orange-500 to-orange-600',
    },
    {
        value: 'NOT_AS_DESCRIBED',
        labelEn: 'Not as Described',
        labelAr: 'لا يطابق الوصف',
        icon: FileText,
        color: 'from-yellow-500 to-yellow-600',
    },
    {
        value: 'QUALITY_ISSUE',
        labelEn: 'Quality Issue',
        labelAr: 'مشكلة في الجودة',
        icon: AlertCircle,
        color: 'from-purple-500 to-purple-600',
    },
    {
        value: 'CUSTOMER_DISSATISFACTION',
        labelEn: 'Customer Dissatisfaction',
        labelAr: 'عدم رضا الزبون',
        icon: User,
        color: 'from-blue-500 to-blue-600',
    },
    {
        value: 'EXPIRED',
        labelEn: 'Expired Product',
        labelAr: 'منتج منتهي الصلاحية',
        icon: AlertCircle,
        color: 'from-pink-500 to-pink-600',
    },
    {
        value: 'OTHER',
        labelEn: 'Other',
        labelAr: 'أخرى',
        icon: FileText,
        color: 'from-slate-500 to-slate-600',
    },
];

// =============================================================================
// RETURN TYPES
// =============================================================================

const RETURN_TYPES: Array<{
    value: ReturnOrderType;
    labelEn: string;
    labelAr: string;
    descriptionEn: string;
    descriptionAr: string;
    icon: typeof RefreshCw;
}> = [
    {
        value: 'FULL',
        labelEn: 'Full Return',
        labelAr: 'إرجاع كامل',
        descriptionEn: 'Return all items for a full refund',
        descriptionAr: 'إرجاع جميع العناصر لاسترداد كامل',
        icon: RotateCcw,
    },
    {
        value: 'PARTIAL',
        labelEn: 'Partial Return',
        labelAr: 'إرجاع جزئي',
        descriptionEn: 'Return selected items only',
        descriptionAr: 'إرجاع العناصر المحددة فقط',
        icon: Package,
    },
    {
        value: 'EXCHANGE',
        labelEn: 'Exchange',
        labelAr: 'استبدال',
        descriptionEn: 'Exchange for different items',
        descriptionAr: 'استبدال بعناصر أخرى',
        icon: RefreshCw,
    },
];

// =============================================================================
// TYPES
// =============================================================================

export interface ReturnableItem {
    orderItemId: string;
    productName: string;
    productId: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    returnedQuantity?: number;
    isReturnable: boolean;
}

export interface ReturnOrderInfo {
    orderId: string;
    orderNumber: string;
    orderDate: string;
    orderTotal: string;
    customerName?: string;
    customerPhone?: string;
}

interface ReturnRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (request: {
        originalOrderId: string;
        returnType: ReturnOrderType;
        reason: ReturnReason;
        reasonNote?: string;
        items: ReturnItemRequest[];
        refundAmount?: string;
    }) => Promise<void>;
    /** Order to process return for */
    order: ReturnOrderInfo;
    /** Items that can be returned from the order */
    items: ReturnableItem[];
    /** Current user ID */
    userId?: string;
    /** Store ID */
    storeId?: string;
}

type ReturnStep = 'TYPE' | 'ITEMS' | 'REASON' | 'AUTHORIZE' | 'PROCESSING' | 'COMPLETE';

// =============================================================================
// RETURN REQUEST MODAL COMPONENT
// =============================================================================

/**
 * ReturnRequestModal
 *
 * Multi-step return request workflow:
 * 1. TYPE - Select return type (full/partial/exchange)
 * 2. ITEMS - Select items to return (for partial/exchange)
 * 3. REASON - Select return reason
 * 4. AUTHORIZE - Manager PIN verification
 * 5. PROCESSING - Submitting to backend
 * 6. COMPLETE - Success/failure confirmation
 */
export function ReturnRequestModal({
    isOpen,
    onClose,
    onComplete,
    order,
    items,
    userId,
    storeId,
}: ReturnRequestModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();
    const { verifyPin, currentUser } = useAuthStore();

    const [step, setStep] = useState<ReturnStep>('TYPE');
    const [returnType, setReturnType] = useState<ReturnOrderType | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
    const [selectedReason, setSelectedReason] = useState<ReturnReason | null>(null);
    const [reasonNote, setReasonNote] = useState('');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [returnResult, setReturnResult] = useState<{
        success: boolean;
        returnRequestId?: string;
        message?: string;
    } | null>(null);

    // Calculate totals based on selected items
    const { returnTotal, returnCount } = useMemo(() => {
        let total = new Decimal(0);
        let count = 0;

        selectedItems.forEach((itemId) => {
            const item = items.find((i) => i.orderItemId === itemId);
            if (item) {
                const qty = itemQuantities[itemId] || item.quantity;
                const unitPrice = new Decimal(item.unitPrice);
                total = total.plus(unitPrice.mul(qty));
                count += qty;
            }
        });

        return { returnTotal: total.toFixed(3), returnCount: count };
    }, [selectedItems, itemQuantities, items]);

    // Reset state when modal opens/closes
    const handleReset = () => {
        setStep('TYPE');
        setReturnType(null);
        setSelectedItems(new Set());
        setItemQuantities({});
        setSelectedReason(null);
        setReasonNote('');
        setPin('');
        setPinError(null);
        setIsProcessing(false);
        setReturnResult(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Step 1: Select return type
    const handleTypeSelect = (type: ReturnOrderType) => {
        setReturnType(type);
        if (type === 'FULL') {
            // Select all items for full return
            const allItemIds = new Set(items.map((i) => i.orderItemId));
            const allQuantities: Record<string, number> = {};
            items.forEach((item) => {
                allQuantities[item.orderItemId] = item.quantity;
            });
            setSelectedItems(allItemIds);
            setItemQuantities(allQuantities);
            setStep('REASON');
        } else {
            setSelectedItems(new Set());
            setItemQuantities({});
            setStep('ITEMS');
        }
    };

    // Step 2: Confirm item selection
    const handleItemsProceed = () => {
        if (selectedItems.size === 0) {
            setPinError(language === 'ar' ? 'يرجى اختيار عنصر واحد على الأقل' : 'Please select at least one item');
            return;
        }
        setPinError(null);
        setStep('REASON');
    };

    // Step 3: Select reason and proceed to authorization
    const handleReasonProceed = () => {
        if (!selectedReason) {
            setPinError(language === 'ar' ? 'يرجى اختيار السبب' : 'Please select a reason');
            return;
        }
        setPinError(null);
        setStep('AUTHORIZE');
    };

    // Toggle item selection
    const toggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
            delete itemQuantities[itemId];
        } else {
            newSelected.add(itemId);
            const item = items.find((i) => i.orderItemId === itemId);
            if (item) {
                setItemQuantities((prev) => ({
                    ...prev,
                    [itemId]: item.quantity,
                }));
            }
        }
        setSelectedItems(newSelected);
    };

    // Update quantity for an item
    const updateQuantity = (itemId: string, delta: number) => {
        const item = items.find((i) => i.orderItemId === itemId);
        if (!item) return;

        const currentQty = itemQuantities[itemId] || item.quantity;
        const newQty = Math.max(1, Math.min(item.quantity, currentQty + delta));

        setItemQuantities((prev) => ({
            ...prev,
            [itemId]: newQty,
        }));
    };

    // Step 4: Verify manager PIN
    const handleAuthorize = async () => {
        if (!pin || pin.length < 4) {
            setPinError(language === 'ar' ? 'يرجى إدخال رمز PIN صحيح' : 'Please enter a valid PIN');
            return;
        }

        setPinError(null);
        setIsProcessing(true);

        try {
            const result = await verifyPin(
                pin,
                'REFUND',
                selectedReason
            );

            if (result.authorized) {
                setStep('PROCESSING');
                await handleSubmitReturn();
            } else {
                setPinError(language === 'ar' ? 'رمز PIN غير صحيح' : 'Invalid PIN');
                setIsProcessing(false);
            }
        } catch (error) {
            const errorMessage = (error as Error).message;
            if (errorMessage === 'PIN_LOCKED') {
                setPinError(language === 'ar' ? 'رمز PIN مقفل. يرجى الاتصال بالمدير.' : 'PIN is locked. Please contact a manager.');
            } else {
                setPinError(language === 'ar' ? 'رمز PIN غير صحيح' : 'Invalid PIN');
            }
            setIsProcessing(false);
        }
    };

    // Submit return request to backend
    const handleSubmitReturn = async () => {
        try {
            const returnItems: ReturnItemRequest[] = Array.from(selectedItems).map((itemId) => {
                const item = items.find((i) => i.orderItemId === itemId)!;
                return {
                    orderItemId: itemId,
                    productId: item.productId,
                    quantity: itemQuantities[itemId] || item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: new Decimal(item.unitPrice)
                        .mul(itemQuantities[itemId] || item.quantity)
                        .toFixed(3),
                };
            });

            const request = {
                originalOrderId: order.orderId,
                returnType: returnType!,
                reason: selectedReason!,
                reasonNote: reasonNote || undefined,
                items: returnItems,
                refundAmount: returnType === 'EXCHANGE' ? undefined : returnTotal,
            };

            await onComplete(request);

            setReturnResult({ success: true });
            setStep('COMPLETE');
        } catch (error) {
            setReturnResult({
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
                                step === 'COMPLETE'
                                    ? returnResult?.success
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        : 'bg-gradient-to-br from-red-500 to-red-600'
                                    : 'bg-gradient-to-br from-blue-500 to-indigo-600',
                            )}>
                                {step === 'COMPLETE' ? (
                                    returnResult?.success ? (
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-white" />
                                    )
                                ) : (
                                    <RotateCcw className="w-5 h-5 text-white" />
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
                                    {step === 'COMPLETE' && returnResult?.success
                                        ? t('return.returnApproved', 'Return Approved')
                                        : step === 'COMPLETE' && !returnResult?.success
                                            ? t('return.returnFailed', 'Return Failed')
                                            : t('return.processReturn', 'Process Return')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Order #{order.orderNumber} • {items.length} {language === 'ar' ? 'عناصر' : 'items'}
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
                            {/* TYPE STEP */}
                            {step === 'TYPE' && (
                                <motion.div
                                    key="type"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-3"
                                >
                                    <p className="text-sm text-slate-400 text-center">
                                        {t('return.selectType', 'Select return type')}
                                    </p>

                                    <div className="grid grid-cols-1 gap-2">
                                        {RETURN_TYPES.map((type) => {
                                            const Icon = type.icon;
                                            return (
                                                <motion.button
                                                    key={type.value}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleTypeSelect(type.value)}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'p-4 rounded-xl border-2 transition-all text-left',
                                                        'border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10',
                                                        'data-[theme=light]:border-slate-300 data-[theme=light]:hover:border-cyan-400',
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={cn(
                                                            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                                                            'bg-blue-500/20 text-blue-400',
                                                        )}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p
                                                                data-theme={theme}
                                                                className={cn(
                                                                    'font-bold text-sm mb-1',
                                                                    'text-white',
                                                                    'data-[theme=light]:text-slate-900',
                                                                )}
                                                            >
                                                                {language === 'ar' ? type.labelAr : type.labelEn}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {language === 'ar' ? type.descriptionAr : type.descriptionEn}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* ITEMS STEP */}
                            {step === 'ITEMS' && (
                                <motion.div
                                    key="items"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-3"
                                >
                                    <p className="text-sm text-slate-400 text-center">
                                        {t('return.selectItems', 'Select items to return')}
                                    </p>

                                    <div className="space-y-2">
                                        {items.filter(i => i.isReturnable).map((item) => {
                                            const isSelected = selectedItems.has(item.orderItemId);
                                            const returnQty = itemQuantities[item.orderItemId] || 0;

                                            return (
                                                <motion.div
                                                    key={item.orderItemId}
                                                    whileHover={{ scale: 1.01 }}
                                                    onClick={() => toggleItem(item.orderItemId)}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'rounded-xl p-3 border-2 cursor-pointer transition-all',
                                                        isSelected
                                                            ? 'border-blue-500 bg-blue-500/10'
                                                            : cn(
                                                                'border-slate-700 hover:border-slate-600',
                                                                'data-[theme=light]:border-slate-300',
                                                            ),
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={cn(
                                                            'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5',
                                                            isSelected ? 'bg-blue-500' : 'bg-slate-700',
                                                        )}>
                                                            {isSelected && (
                                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p
                                                                data-theme={theme}
                                                                className={cn(
                                                                    'font-medium text-sm truncate',
                                                                    'text-white',
                                                                    'data-[theme=light]:text-slate-900',
                                                                )}
                                                            >
                                                                {item.productName}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-slate-400">
                                                                    {t('return.qty', 'Qty')}: {item.quantity}
                                                                </span>
                                                                <span className="text-xs text-slate-500">•</span>
                                                                <PriceDisplay
                                                                    value={item.unitPrice}
                                                                    size="xs"
                                                                    variant="muted"
                                                                />
                                                            </div>
                                                        </div>

                                                        {isSelected && returnType !== 'FULL' && (
                                                            <div className="flex items-center gap-1">
                                                                <motion.button
                                                                    whileTap={{ scale: 0.9 }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateQuantity(item.orderItemId, -1);
                                                                    }}
                                                                    className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                                                                >
                                                                    <X className="w-3 h-3 text-slate-400" />
                                                                </motion.button>
                                                                <span
                                                                    data-theme={theme}
                                                                    className={cn(
                                                                        'w-8 text-center text-sm font-bold',
                                                                        'text-white',
                                                                        'data-[theme=light]:text-slate-900',
                                                                    )}
                                                                >
                                                                    {returnQty}
                                                                </span>
                                                                <motion.button
                                                                    whileTap={{ scale: 0.9 }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        updateQuantity(item.orderItemId, 1);
                                                                    }}
                                                                    className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                                                                    disabled={returnQty >= item.quantity}
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3 text-slate-400" />
                                                                </motion.button>
                                                            </div>
                                                        )}

                                                        {!isSelected && (
                                                            <PriceDisplay
                                                                value={item.totalPrice}
                                                                size="sm"
                                                                variant="muted"
                                                            />
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {selectedItems.size > 0 && (
                                        <div
                                            data-theme={theme}
                                            className={cn(
                                                'rounded-xl p-3 border border-blue-500/30 bg-blue-500/10',
                                            )}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-400">
                                                    {t('return.totalReturn', 'Total Return')}
                                                </span>
                                                <div className="text-right">
                                                    <PriceDisplay
                                                        value={returnTotal}
                                                        size="md"
                                                        variant="primary"
                                                    />
                                                    <p className="text-xs text-blue-400/70 mt-1">
                                                        {returnCount} {language === 'ar' ? 'عناصر' : 'items'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* REASON STEP */}
                            {step === 'REASON' && (
                                <motion.div
                                    key="reason"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-3"
                                >
                                    <p className="text-sm text-slate-400 text-center">
                                        {t('return.selectReason', 'Select a reason for this return')}
                                    </p>

                                    {/* Return Type & Amount Summary */}
                                    <div
                                        data-theme={theme}
                                        className={cn(
                                            'rounded-xl p-3',
                                            'bg-slate-800/50',
                                            'data-[theme=light]:bg-slate-50',
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-slate-400">
                                                {t('return.returnType', 'Return Type')}
                                            </span>
                                            <span
                                                data-theme={theme}
                                                className={cn(
                                                    'text-sm font-bold',
                                                    'text-blue-400',
                                                )}
                                            >
                                                {returnType && (
                                                    language === 'ar'
                                                        ? RETURN_TYPES.find(t => t.value === returnType)?.labelAr
                                                        : RETURN_TYPES.find(t => t.value === returnType)?.labelEn
                                                )}
                                            </span>
                                        </div>
                                        {returnType !== 'EXCHANGE' && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-slate-400">
                                                    {t('return.refundAmount', 'Refund Amount')}
                                                </span>
                                                <PriceDisplay
                                                    value={returnTotal}
                                                    size="sm"
                                                    variant="primary"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                        {RETURN_REASONS.map((reason) => {
                                            const Icon = reason.icon;
                                            const isSelected = selectedReason === reason.value;
                                            return (
                                                <motion.button
                                                    key={reason.value}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedReason(reason.value)}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left',
                                                        isSelected
                                                            ? `bg-gradient-to-r ${reason.color} border-transparent text-white`
                                                            : cn(
                                                                'border-slate-700 hover:border-slate-600',
                                                                'data-[theme=light]:border-slate-300 data-[theme=light]:hover:border-slate-400',
                                                            ),
                                                    )}
                                                >
                                                    <div className={cn(
                                                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                                        isSelected ? 'bg-white/20' : 'bg-slate-700/50',
                                                    )}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-medium text-sm">
                                                        {language === 'ar' ? reason.labelAr : reason.labelEn}
                                                    </span>
                                                    {isSelected && (
                                                        <CheckCircle2 className="w-4 h-4 ml-auto" />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {selectedReason === 'OTHER' && (
                                        <motion.textarea
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            value={reasonNote}
                                            onChange={(e) => setReasonNote(e.target.value)}
                                            placeholder={language === 'ar'
                                                ? 'أدخل التفاصيل...'
                                                : 'Enter details...'}
                                            data-theme={theme}
                                            className={cn(
                                                'w-full p-3 rounded-xl border-2 resize-none text-sm',
                                                'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                                                'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-300',
                                                'text-white placeholder:text-slate-500',
                                                'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder:text-slate-400',
                                            )}
                                            rows={3}
                                            maxLength={200}
                                        />
                                    )}
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
                                    {/* Summary */}
                                    <div
                                        data-theme={theme}
                                        className={cn(
                                            'rounded-xl p-3 space-y-2',
                                            'bg-slate-800/50',
                                            'data-[theme=light]:bg-slate-50',
                                        )}
                                    >
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-400">
                                                {t('return.returnType', 'Return Type')}
                                            </span>
                                            <span
                                                data-theme={theme}
                                                className={cn(
                                                    'text-xs font-bold',
                                                    'text-blue-400',
                                                )}
                                            >
                                                {returnType && (
                                                    language === 'ar'
                                                        ? RETURN_TYPES.find(t => t.value === returnType)?.labelAr
                                                        : RETURN_TYPES.find(t => t.value === returnType)?.labelEn
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs text-slate-400">
                                                {t('return.reason', 'Reason')}
                                            </span>
                                            <span
                                                data-theme={theme}
                                                className={cn(
                                                    'text-xs',
                                                    'text-white',
                                                    'data-[theme=light]:text-slate-900',
                                                )}
                                            >
                                                {selectedReason && (
                                                    language === 'ar'
                                                        ? RETURN_REASONS.find(r => r.value === selectedReason)?.labelAr
                                                        : RETURN_REASONS.find(r => r.value === selectedReason)?.labelEn
                                                )}
                                            </span>
                                        </div>
                                        {returnType !== 'EXCHANGE' && (
                                            <div className="flex justify-between pt-2 border-t border-slate-700">
                                                <span className="text-xs text-slate-400">
                                                    {t('return.refundAmount', 'Refund Amount')}
                                                </span>
                                                <PriceDisplay
                                                    value={returnTotal}
                                                    size="sm"
                                                    variant="primary"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Manager PIN Input */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Shield className="w-4 h-4 text-cyan-400" />
                                            <span className="text-slate-400">
                                                {t('return.enterManagerPin', 'Enter Manager PIN')}
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

                                        <p className="text-xs text-slate-500 text-center">
                                            {t('return.managedBy', 'Managed by')} {currentUser?.fullName || currentUser?.username}
                                        </p>
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
                                        className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
                                    />
                                    <p
                                        data-theme={theme}
                                        className={cn(
                                            'text-sm',
                                            'text-slate-300',
                                            'data-[theme=light]:text-slate-700',
                                        )}
                                    >
                                        {t('return.processing', 'Processing return request...')}
                                    </p>
                                </motion.div>
                            )}

                            {/* COMPLETE STEP */}
                            {step === 'COMPLETE' && returnResult && (
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
                                            returnResult.success
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                : 'bg-gradient-to-br from-red-500 to-red-600',
                                        )}
                                    >
                                        {returnResult.success ? (
                                            <CheckCircle2 className="w-8 h-8 text-white" />
                                        ) : (
                                            <XCircle className="w-8 h-8 text-white" />
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
                                        {returnResult.success
                                            ? t('return.returnComplete', 'Return Complete')
                                            : t('return.returnFailedTitle', 'Return Failed')}
                                    </h3>

                                    <p className="text-sm text-slate-400 mb-2">
                                        {returnResult.message ||
                                            (returnResult.success
                                                ? t('return.returnSuccessMessage', 'The return has been processed successfully.')
                                                : t('return.returnFailedMessage', 'Failed to process the return request.'))}
                                    </p>

                                    {returnResult.returnRequestId && (
                                        <p className="text-xs text-slate-500">
                                            {t('return.reference', 'Reference')}: {returnResult.returnRequestId}
                                        </p>
                                    )}

                                    {returnResult.success && returnType !== 'EXCHANGE' && (
                                        <div
                                            data-theme={theme}
                                            className={cn(
                                                'mt-4 rounded-xl p-3',
                                                'bg-green-500/20 border border-green-500/30',
                                            )}
                                        >
                                            <p className="text-xs text-green-400 mb-1">
                                                {t('return.refundToProcess', 'Refund to Process')}
                                            </p>
                                            <PriceDisplay
                                                value={returnTotal}
                                                size="lg"
                                                variant="primary"
                                            />
                                        </div>
                                    )}
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
                            {step === 'ITEMS' && (
                                <>
                                    <Button variant="secondary" onClick={() => setStep('TYPE')}>
                                        {t('back', 'Back')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleItemsProceed}
                                        disabled={selectedItems.size === 0}
                                    >
                                        {t('continue', 'Continue')}
                                    </Button>
                                </>
                            )}

                            {step === 'REASON' && (
                                <>
                                    <Button variant="secondary" onClick={() => setStep(returnType === 'FULL' ? 'TYPE' : 'ITEMS')}>
                                        {t('back', 'Back')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleReasonProceed}
                                        disabled={!selectedReason}
                                    >
                                        {t('return.authorize', 'Authorize')}
                                        <Shield className="w-4 h-4 ms-2" />
                                    </Button>
                                </>
                            )}

                            {step === 'AUTHORIZE' && (
                                <>
                                    <Button variant="secondary" onClick={() => setStep('REASON')}>
                                        {t('back', 'Back')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleAuthorize}
                                        disabled={isProcessing || !pin}
                                    >
                                        {isProcessing ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                            />
                                        ) : (
                                            <>
                                                {t('return.confirmReturn', 'Confirm Return')}
                                                <RotateCcw className="w-4 h-4 ms-2" />
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
                                variant={returnResult?.success ? 'primary' : 'secondary'}
                                className="w-full"
                                onClick={handleComplete}
                            >
                                {returnResult?.success ? (
                                    <>
                                        {t('return.close', 'Close')}
                                        <CheckCircle2 className="w-4 h-4 ms-2" />
                                    </>
                                ) : (
                                    t('return.close', 'Close')
                                )}
                            </Button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ReturnRequestModal;
