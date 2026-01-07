/**
 * Void/Return Order Modal
 * Allows voiding an order or processing a return with manager authorization
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, RotateCcw, Trash2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useAuthStore } from '@/stores/auth.store';
import { Button, Input } from '@/components/ui';
import { orderService } from '@/services/order.service';

interface VoidOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    orderNumber: string;
    orderTotal: string;
    onVoidComplete?: () => void;
}

// Main void type - determines inventory handling
type VoidType = 'RETURN_TO_STOCK' | 'WASTE';

// Reason for context/reporting only
type VoidReason =
    | 'CLIENT_RETURN'
    | 'PUNCH_ERROR'
    | 'DUPLICATE'
    | 'TRAINING'
    | 'PRODUCT_SPOILAGE'
    | 'WRONG_ORDER'
    | 'QUALITY_ISSUE'
    | 'PROMO_COMP'
    | 'DELIVERY_ISSUE'
    | 'MANAGER_OVERRIDE'
    | 'OTHER';

interface VoidTypeOption {
    value: VoidType;
    labelEn: string;
    labelAr: string;
    icon: string;
    description: string;
    descriptionAr: string;
}

interface VoidReasonOption {
    value: VoidReason;
    labelEn: string;
    labelAr: string;
}

const VOID_TYPES: VoidTypeOption[] = [
    {
        value: 'RETURN_TO_STOCK',
        labelEn: 'Return to Stock',
        labelAr: 'إرجاع للمخزون',
        icon: '📦',
        description: 'Items were not prepared - return to inventory',
        descriptionAr: 'المنتجات لم تُحضر - إرجاع للمخزون',
    },
    {
        value: 'WASTE',
        labelEn: 'Waste',
        labelAr: 'هدر',
        icon: '🗑️',
        description: 'Items were prepared/consumed - no stock adjustment',
        descriptionAr: 'المنتجات تم تحضيرها - بدون تعديل المخزون',
    },
];

const VOID_REASONS: VoidReasonOption[] = [
    { value: 'CLIENT_RETURN', labelEn: 'Client Return', labelAr: 'إرجاع عميل' },
    { value: 'PUNCH_ERROR', labelEn: 'Punch Error', labelAr: 'خطأ إدخال' },
    { value: 'DUPLICATE', labelEn: 'Duplicate Order', labelAr: 'طلب مكرر' },
    { value: 'TRAINING', labelEn: 'Training', labelAr: 'تدريب' },
    { value: 'PRODUCT_SPOILAGE', labelEn: 'Product Spoilage', labelAr: 'منتج تالف' },
    { value: 'WRONG_ORDER', labelEn: 'Wrong Order', labelAr: 'طلب خاطئ' },
    { value: 'QUALITY_ISSUE', labelEn: 'Quality Issue', labelAr: 'مشكلة جودة' },
    { value: 'PROMO_COMP', labelEn: 'Promo / Comp', labelAr: 'ترويج / مجاني' },
    { value: 'DELIVERY_ISSUE', labelEn: 'Delivery Issue', labelAr: 'مشكلة توصيل' },
    { value: 'MANAGER_OVERRIDE', labelEn: 'Manager Override', labelAr: 'تجاوز المدير' },
    { value: 'OTHER', labelEn: 'Other', labelAr: 'أخرى' },
];

export function VoidOrderModal({
    isOpen,
    onClose,
    orderId,
    orderNumber,
    orderTotal,
    onVoidComplete,
}: VoidOrderModalProps) {
    const { t } = useTranslation(['pos', 'common']);
    const { theme, language } = useSettingsStore();
    const { verifyPin, currentUser, requiresManagerAuth } = useAuthStore();

    const [step, setStep] = useState<'TYPE' | 'REASON' | 'PIN' | 'PROCESSING' | 'SUCCESS'>('TYPE');
    const [selectedVoidType, setSelectedVoidType] = useState<VoidType | null>(null);
    const [selectedReason, setSelectedReason] = useState<VoidReason | null>(null);
    const [customReason, setCustomReason] = useState('');
    const [managerPin, setManagerPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const needsManagerAuth = requiresManagerAuth('DELETE_ORDER');

    const handleTypeSubmit = () => {
        if (!selectedVoidType) {
            setError(t('void.selectType', 'Please select void type'));
            return;
        }
        setError(null);
        setStep('REASON');
    };

    const handleReasonSubmit = () => {
        // Reason is optional but nice to have for reporting
        setError(null);

        if (needsManagerAuth) {
            setStep('PIN');
        } else {
            handleVoidOrder();
        }
    };

    const handlePinSubmit = async () => {
        if (managerPin.length < 4) {
            setError(t('void.invalidPin', 'PIN must be at least 4 digits'));
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            const result = await verifyPin(managerPin, 'DELETE_ORDER', selectedReason || undefined);
            if (!result.authorized) {
                setError(t('void.pinFailed', 'Invalid PIN or insufficient permissions'));
                setIsProcessing(false);
                return;
            }

            // PIN verified, proceed with void
            await handleVoidOrder(result.managerId);
        } catch (err) {
            console.error('[VoidOrder] PIN verification failed:', err);
            setError(t('void.verifyFailed', 'Failed to verify PIN'));
            setIsProcessing(false);
        }
    };

    const handleVoidOrder = async (authorizedBy?: string) => {
        setStep('PROCESSING');
        setIsProcessing(true);
        setError(null);

        try {
            const reason = selectedReason === 'OTHER' ? customReason : selectedReason || 'CUSTOMER_REQUEST';

            await orderService.voidOrder(
                orderId,
                reason,
                authorizedBy || currentUser?.id || 'unknown'
            );

            setStep('SUCCESS');
            setTimeout(() => {
                onVoidComplete?.();
                handleClose();
            }, 1500);
        } catch (err: any) {
            console.error('[VoidOrder] Void failed:', err);
            setError(err?.message || t('void.failed', 'Failed to void order'));
            setStep('REASON');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setStep('TYPE');
        setSelectedVoidType(null);
        setSelectedReason(null);
        setCustomReason('');
        setManagerPin('');
        setError(null);
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
                    )}
                >
                    {/* Header */}
                    <div
                        data-theme={theme}
                        className={cn(
                            'flex items-center justify-between p-4 border-b',
                            'border-slate-700/50 bg-red-500/10',
                            'data-[theme=light]:border-slate-200',
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                                <RotateCcw className="w-5 h-5 text-white" />
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
                                    {t('void.title', 'Void Order')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {orderNumber} • {orderTotal} SAR
                                </p>
                            </div>
                        </div>
                        {step !== 'PROCESSING' && step !== 'SUCCESS' && (
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <AnimatePresence mode="wait">
                            {step === 'TYPE' && (
                                <motion.div
                                    key="type"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    {/* Warning */}
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-yellow-400">
                                            {t('void.warning', 'This action cannot be undone. The order will be marked as voided.')}
                                        </p>
                                    </div>

                                    {/* Void Type Selection */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">
                                            {t('void.selectType', 'Select Void Type')}
                                        </label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {VOID_TYPES.map((type) => (
                                                <button
                                                    key={type.value}
                                                    onClick={() => {
                                                        setSelectedVoidType(type.value);
                                                        setError(null);
                                                    }}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'p-4 rounded-xl border-2 text-start transition-all',
                                                        selectedVoidType === type.value
                                                            ? 'border-red-500 bg-red-500/10'
                                                            : cn(
                                                                'border-slate-700 hover:border-slate-600',
                                                                'data-[theme=light]:border-slate-300',
                                                            ),
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{type.icon}</span>
                                                        <div>
                                                            <p className={cn(
                                                                'font-bold',
                                                                selectedVoidType === type.value ? 'text-red-400' : 'text-white',
                                                                'data-[theme=light]:text-slate-900',
                                                            )}>
                                                                {language === 'ar' ? type.labelAr : type.labelEn}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {language === 'ar' ? type.descriptionAr : type.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <p className="text-sm text-red-400 text-center">{error}</p>
                                    )}
                                </motion.div>
                            )}

                            {step === 'REASON' && (
                                <motion.div
                                    key="reason"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    {/* Selected Type Summary */}
                                    <div className={cn(
                                        'p-3 rounded-xl border',
                                        selectedVoidType === 'RETURN_TO_STOCK'
                                            ? 'bg-blue-500/10 border-blue-500/30'
                                            : 'bg-orange-500/10 border-orange-500/30',
                                    )}>
                                        <p className="text-sm font-medium">
                                            <span className="mr-2">
                                                {selectedVoidType === 'RETURN_TO_STOCK' ? '📦' : '🗑️'}
                                            </span>
                                            {selectedVoidType === 'RETURN_TO_STOCK'
                                                ? (language === 'ar' ? 'إرجاع للمخزون' : 'Return to Stock')
                                                : (language === 'ar' ? 'هدر' : 'Waste')
                                            }
                                        </p>
                                    </div>

                                    {/* Reason Dropdown */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">
                                            {t('void.reason', 'Reason (Optional)')}
                                        </label>
                                        <select
                                            value={selectedReason || ''}
                                            onChange={(e) => setSelectedReason(e.target.value as VoidReason || null)}
                                            data-theme={theme}
                                            className={cn(
                                                'w-full p-3 rounded-xl border-2 bg-transparent',
                                                'border-slate-700 text-white',
                                                'data-[theme=light]:border-slate-300 data-[theme=light]:text-slate-900',
                                            )}
                                        >
                                            <option value="">{language === 'ar' ? 'اختر السبب...' : 'Select reason...'}</option>
                                            {VOID_REASONS.map((reason) => (
                                                <option key={reason.value} value={reason.value}>
                                                    {language === 'ar' ? reason.labelAr : reason.labelEn}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Custom Note Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-400">
                                            {t('void.notes', 'Notes (Optional)')}
                                        </label>
                                        <Input
                                            placeholder={t('void.notesPlaceholder', 'Additional notes...')}
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <p className="text-sm text-red-400 text-center">{error}</p>
                                    )}
                                </motion.div>
                            )}

                            {step === 'PIN' && (
                                <motion.div
                                    key="pin"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="text-center space-y-2">
                                        <div className="w-16 h-16 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center">
                                            <Lock className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white">
                                            {t('void.managerAuth', 'Manager Authorization')}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {t('void.enterPin', 'Enter manager PIN to void this order')}
                                        </p>
                                    </div>

                                    <Input
                                        type="password"
                                        placeholder="••••"
                                        value={managerPin}
                                        onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ''))}
                                        maxLength={6}
                                        className="text-center text-2xl tracking-widest"
                                        autoFocus
                                    />

                                    {error && (
                                        <p className="text-sm text-red-400 text-center">{error}</p>
                                    )}
                                </motion.div>
                            )}

                            {step === 'PROCESSING' && (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-8 text-center"
                                >
                                    <div className="w-12 h-12 mx-auto mb-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-slate-400">{t('void.processing', 'Voiding order...')}</p>
                                </motion.div>
                            )}

                            {step === 'SUCCESS' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-8 text-center"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', damping: 10 }}
                                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center"
                                    >
                                        <Trash2 className="w-8 h-8 text-white" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {t('void.success', 'Order Voided')}
                                    </h3>
                                    <p className="text-slate-400">
                                        {t('void.orderVoided', 'The order has been successfully voided')}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {(step === 'TYPE' || step === 'REASON' || step === 'PIN') && (
                        <div
                            data-theme={theme}
                            className={cn(
                                'p-4 border-t flex gap-2',
                                'border-slate-700/50',
                                'data-[theme=light]:border-slate-200',
                            )}
                        >
                            <Button
                                variant="secondary"
                                onClick={
                                    step === 'PIN'
                                        ? () => setStep('REASON')
                                        : step === 'REASON'
                                            ? () => setStep('TYPE')
                                            : handleClose
                                }
                            >
                                {step === 'TYPE' ? t('common:cancel', 'Cancel') : t('common:back', 'Back')}
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={
                                    step === 'PIN'
                                        ? handlePinSubmit
                                        : step === 'REASON'
                                            ? handleReasonSubmit
                                            : handleTypeSubmit
                                }
                                disabled={isProcessing || (step === 'TYPE' && !selectedVoidType)}
                            >
                                {step === 'PIN' ? (
                                    <>
                                        <Lock className="w-4 h-4 me-2" />
                                        {t('void.authorize', 'Authorize & Void')}
                                    </>
                                ) : step === 'REASON' ? (
                                    <>
                                        <Trash2 className="w-4 h-4 me-2" />
                                        {needsManagerAuth
                                            ? t('void.continueAuth', 'Continue to Auth')
                                            : t('void.voidOrder', 'Void Order')}
                                    </>
                                ) : (
                                    t('common:next', 'Next')
                                )}
                            </Button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default VoidOrderModal;
