import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    AlertTriangle,
    Shield,
    CheckCircle2,
    XCircle,
    Package,
    Receipt,
    User,
    Calendar,
    FileText,
    Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import type {
    VoidReason,
    VoidRequestParams,
    PinAuthorizationRequest,
} from '@/types/pos.types';

// =============================================================================
// VOID REASONS (Bilingual)
// =============================================================================

const VOID_REASONS: Array<{
    value: VoidReason;
    labelEn: string;
    labelAr: string;
    icon: typeof AlertTriangle;
    color: string;
}> = [
        {
            value: 'CUSTOMER_CHANGED_MIND',
            labelEn: 'Customer Changed Mind',
            labelAr: 'الزبون غير رأيه',
            icon: User,
            color: 'from-blue-500 to-blue-600',
        },
        {
            value: 'WRONG_ORDER',
            labelEn: 'Wrong Order',
            labelAr: 'طلب خاطئ',
            icon: XCircle,
            color: 'from-red-500 to-red-600',
        },
        {
            value: 'ITEM_OUT_OF_STOCK',
            labelEn: 'Item Out of Stock',
            labelAr: 'نفذت الكمية',
            icon: Package,
            color: 'from-yellow-500 to-yellow-600',
        },
        {
            value: 'MISTAKE',
            labelEn: 'Staff Mistake',
            labelAr: 'خطأ من الموظف',
            icon: AlertTriangle,
            color: 'from-orange-500 to-orange-600',
        },
        {
            value: 'QUALITY_ISSUE',
            labelEn: 'Quality Issue',
            labelAr: 'مشكلة في الجودة',
            icon: Ban,
            color: 'from-purple-500 to-purple-600',
        },
        {
            value: 'DUPLICATE_ORDER',
            labelEn: 'Duplicate Order',
            labelAr: 'طلب مكرر',
            icon: Receipt,
            color: 'from-gray-500 to-gray-600',
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
// TYPES
// =============================================================================

export interface VoidItemRequest {
    orderItemId: string;
    itemName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
}

export interface VoidOrderRequest {
    orderId: string;
    orderNumber: string;
    orderTotal: string;
    customerName?: string;
    tableNumber?: string;
}

interface VoidRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (request: {
        type: 'ORDER' | 'ITEM';
        reason: VoidReason;
        reasonNote?: string;
        itemIds?: string[];
    }) => Promise<void>;
    /** For item void - provide items to void */
    items?: VoidItemRequest[];
    /** For order void - provide order details */
    order?: VoidOrderRequest;
    /** Current user ID */
    userId?: string;
    /** Store ID */
    storeId?: string;
}

type VoidStep = 'CONFIRM' | 'REASON' | 'AUTHORIZE' | 'PROCESSING' | 'COMPLETE';

// =============================================================================
// VOID REQUEST MODAL COMPONENT
// =============================================================================

/**
 * VoidRequestModal
 *
 * Multi-step void request workflow:
 * 1. CONFIRM - Show what will be voided (order or items)
 * 2. REASON - Select void reason from predefined list
 * 3. AUTHORIZE - Manager PIN verification
 * 4. PROCESSING - Submitting to backend
 * 5. COMPLETE - Success confirmation
 */
export function VoidRequestModal({
    isOpen,
    onClose,
    onComplete,
    items,
    order,
    userId,
    storeId,
}: VoidRequestModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();
    const { verifyPin, currentUser } = useAuthStore();

    const [step, setStep] = useState<VoidStep>('CONFIRM');
    const [selectedReason, setSelectedReason] = useState<VoidReason | null>(null);
    const [reasonNote, setReasonNote] = useState('');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [voidResult, setVoidResult] = useState<{
        success: boolean;
        voidRequestId?: string;
        message?: string;
    } | null>(null);

    // Determine if this is an item or order void
    const voidType = items ? 'ITEM' : 'ORDER';
    const totalValue = items
        ? items.reduce((sum, item) => sum + parseFloat(item.totalPrice || '0'), 0).toFixed(3)
        : order?.orderTotal || '0';

    // Reset state when modal opens/closes
    const handleReset = () => {
        setStep('CONFIRM');
        setSelectedReason(null);
        setReasonNote('');
        setPin('');
        setPinError(null);
        setIsProcessing(false);
        setVoidResult(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Step 1: Confirm what will be voided
    const handleConfirmProceed = () => {
        setStep('REASON');
    };

    // Step 2: Select reason and proceed to authorization
    const handleReasonProceed = () => {
        if (!selectedReason) {
            setPinError(language === 'ar' ? 'يرجى اختيار السبب' : 'Please select a reason');
            return;
        }
        setPinError(null);
        setStep('AUTHORIZE');
    };

    // Step 3: Verify manager PIN
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
                voidType === 'ITEM' ? 'VOID_ITEM' : 'VOID_ORDER',
                selectedReason ?? undefined
            );

            if (result.authorized) {
                setStep('PROCESSING');
                await handleSubmitVoid();
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

    // Submit void request to backend
    const handleSubmitVoid = async () => {
        try {
            const request = {
                type: voidType as 'ORDER' | 'ITEM',
                reason: selectedReason!,
                reasonNote: reasonNote || undefined,
                itemIds: items?.map(i => i.orderItemId),
            };

            await onComplete(request);

            setVoidResult({ success: true });
            setStep('COMPLETE');
        } catch (error) {
            setVoidResult({
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
                        'relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden',
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
                                    ? voidResult?.success
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        : 'bg-gradient-to-br from-red-500 to-red-600'
                                    : 'bg-gradient-to-br from-orange-500 to-red-600',
                            )}>
                                {step === 'COMPLETE' ? (
                                    voidResult?.success ? (
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-white" />
                                    )
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-white" />
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
                                    {step === 'COMPLETE' && voidResult?.success
                                        ? t('void.voidApproved', 'Void Approved')
                                        : step === 'COMPLETE' && !voidResult?.success
                                            ? t('void.voidFailed', 'Void Failed')
                                            : voidType === 'ITEM'
                                                ? t('void.voidItems', 'Void Items')
                                                : t('void.voidOrder', 'Void Order')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {step === 'AUTHORIZE'
                                        ? t('void.managerAuthRequired', 'Manager authorization required')
                                        : voidType === 'ITEM'
                                            ? `${items?.length || 0} ${language === 'ar' ? 'عناصر' : 'items'}`
                                            : `Order #${order?.orderNumber || ''}`}
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
                            {/* CONFIRM STEP */}
                            {step === 'CONFIRM' && (
                                <motion.div
                                    key="confirm"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    {/* Warning */}
                                    <div className={cn(
                                        'rounded-xl p-3 flex items-start gap-3',
                                        'bg-orange-500/20 border border-orange-500/30',
                                    )}>
                                        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-orange-400 font-medium">
                                                {t('void.warning', 'Warning: This action cannot be undone')}
                                            </p>
                                            <p className="text-xs text-orange-400/70 mt-1">
                                                {voidType === 'ITEM'
                                                    ? t('void.itemsWillBeRemoved', 'Selected items will be permanently removed from the order.')
                                                    : t('void.orderWillBeCancelled', 'The entire order will be cancelled.')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items to void */}
                                    {items && items.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide">
                                                {t('void.itemsToVoid', 'Items to Void')}
                                            </p>
                                            {items.map((item) => (
                                                <div
                                                    key={item.orderItemId}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'rounded-lg p-3 flex justify-between items-center',
                                                        'bg-slate-800/50',
                                                        'data-[theme=light]:bg-slate-50',
                                                    )}
                                                >
                                                    <div>
                                                        <p
                                                            data-theme={theme}
                                                            className={cn(
                                                                'font-medium text-sm',
                                                                'text-white',
                                                                'data-[theme=light]:text-slate-900',
                                                            )}
                                                        >
                                                            {item.itemName}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {t('void.quantity', 'Qty')}: {item.quantity}
                                                        </p>
                                                    </div>
                                                    <PriceDisplay
                                                        value={item.totalPrice}
                                                        size="sm"
                                                        variant="danger"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Order to void */}
                                    {order && (
                                        <div
                                            data-theme={theme}
                                            className={cn(
                                                'rounded-xl p-3 space-y-2',
                                                'bg-slate-800/50',
                                                'data-[theme=light]:bg-slate-50',
                                            )}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-slate-400">
                                                    {t('void.orderNumber', 'Order Number')}
                                                </span>
                                                <span
                                                    data-theme={theme}
                                                    className={cn(
                                                        'font-bold text-sm',
                                                        'text-white',
                                                        'data-[theme=light]:text-slate-900',
                                                    )}
                                                >
                                                    #{order.orderNumber}
                                                </span>
                                            </div>
                                            {order.customerName && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-400">
                                                        {t('void.customer', 'Customer')}
                                                    </span>
                                                    <span
                                                        data-theme={theme}
                                                        className={cn(
                                                            'text-sm',
                                                            'text-slate-300',
                                                            'data-[theme=light]:text-slate-700',
                                                        )}
                                                    >
                                                        {order.customerName}
                                                    </span>
                                                </div>
                                            )}
                                            {order.tableNumber && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-slate-400">
                                                        {t('void.table', 'Table')}
                                                    </span>
                                                    <span
                                                        data-theme={theme}
                                                        className={cn(
                                                            'text-sm',
                                                            'text-slate-300',
                                                            'data-[theme=light]:text-slate-700',
                                                        )}
                                                    >
                                                        {order.tableNumber}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                                <span className="text-xs text-slate-400">
                                                    {t('void.totalAmount', 'Total Amount')}
                                                </span>
                                                <PriceDisplay
                                                    value={order.orderTotal}
                                                    size="md"
                                                    variant="danger"
                                                />
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
                                        {t('void.selectReason', 'Select a reason for this void')}
                                    </p>

                                    <div className="grid grid-cols-1 gap-2">
                                        {VOID_REASONS.map((reason) => {
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

                                    {/* Additional notes */}
                                    {selectedReason === 'OTHER' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <textarea
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
                                        </motion.div>
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
                                    {/* Selected Reason Display */}
                                    <div
                                        data-theme={theme}
                                        className={cn(
                                            'rounded-xl p-3',
                                            'bg-slate-800/50',
                                            'data-[theme=light]:bg-slate-50',
                                        )}
                                    >
                                        <p className="text-xs text-slate-400 mb-1">
                                            {t('void.voidReason', 'Void Reason')}
                                        </p>
                                        <p
                                            data-theme={theme}
                                            className={cn(
                                                'font-medium',
                                                'text-white',
                                                'data-[theme=light]:text-slate-900',
                                            )}
                                        >
                                            {selectedReason && (
                                                language === 'ar'
                                                    ? VOID_REASONS.find(r => r.value === selectedReason)?.labelAr
                                                    : VOID_REASONS.find(r => r.value === selectedReason)?.labelEn
                                            )}
                                        </p>
                                        {reasonNote && (
                                            <p className="text-xs text-slate-400 mt-1">{reasonNote}</p>
                                        )}
                                    </div>

                                    {/* Manager PIN Input */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Shield className="w-4 h-4 text-cyan-400" />
                                            <span className="text-slate-400">
                                                {t('void.enterManagerPin', 'Enter Manager PIN')}
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
                                            {t('void.managedBy', 'Managed by')} {currentUser?.fullName || currentUser?.username}
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
                                        className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
                                    />
                                    <p
                                        data-theme={theme}
                                        className={cn(
                                            'text-sm',
                                            'text-slate-300',
                                            'data-[theme=light]:text-slate-700',
                                        )}
                                    >
                                        {t('void.processing', 'Processing void request...')}
                                    </p>
                                </motion.div>
                            )}

                            {/* COMPLETE STEP */}
                            {step === 'COMPLETE' && voidResult && (
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
                                            voidResult.success
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                : 'bg-gradient-to-br from-red-500 to-red-600',
                                        )}
                                    >
                                        {voidResult.success ? (
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
                                        {voidResult.success
                                            ? t('void.voidComplete', 'Void Complete')
                                            : t('void.voidFailedTitle', 'Void Failed')}
                                    </h3>

                                    <p className="text-sm text-slate-400 mb-2">
                                        {voidResult.message ||
                                            (voidResult.success
                                                ? t('void.voidSuccessMessage', 'The void has been processed successfully.')
                                                : t('void.voidFailedMessage', 'Failed to process the void request.'))}
                                    </p>

                                    {voidResult.voidRequestId && (
                                        <p className="text-xs text-slate-500">
                                            {t('void.reference', 'Reference')}: {voidResult.voidRequestId}
                                        </p>
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
                            {step === 'CONFIRM' && (
                                <>
                                    <Button variant="secondary" onClick={handleClose}>
                                        {t('cancel', 'Cancel')}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={handleConfirmProceed}
                                    >
                                        {t('void.continue', 'Continue')}
                                        <AlertTriangle className="w-4 h-4 ms-2" />
                                    </Button>
                                </>
                            )}

                            {step === 'REASON' && (
                                <>
                                    <Button variant="secondary" onClick={() => setStep('CONFIRM')}>
                                        {t('back', 'Back')}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleReasonProceed}
                                        disabled={!selectedReason}
                                    >
                                        {t('void.authorize', 'Authorize')}
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
                                        variant="destructive"
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
                                                {t('void.confirmVoid', 'Confirm Void')}
                                                <Ban className="w-4 h-4 ms-2" />
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
                                variant={voidResult?.success ? 'primary' : 'secondary'}
                                className="w-full"
                                onClick={handleComplete}
                            >
                                {voidResult?.success ? (
                                    <>
                                        {t('void.close', 'Close')}
                                        <CheckCircle2 className="w-4 h-4 ms-2" />
                                    </>
                                ) : (
                                    t('void.close', 'Close')
                                )}
                            </Button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default VoidRequestModal;

// =============================================================================
// QUICK VOID BUTTON COMPONENT
// =============================================================================

export interface QuickVoidButtonProps {
    orderId?: string;
    orderItemId?: string;
    itemName?: string;
    itemQuantity?: number;
    onVoid: () => void;
    disabled?: boolean;
}

/**
 * QuickVoidButton
 *
 * Small button to trigger void flow from POS interface
 */
export function QuickVoidButton({
    onVoid,
    disabled = false,
}: QuickVoidButtonProps) {
    const { t } = useTranslation('pos');

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onVoid}
            disabled={disabled}
            className={cn(
                'p-2 rounded-lg transition-colors',
                'bg-red-500/20 hover:bg-red-500/30 text-red-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            title={t('void.voidItem', 'Void Item')}
        >
            <Ban className="w-4 h-4" />
        </motion.button>
    );
}
