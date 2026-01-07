import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CreditCard,
    Banknote,
    Smartphone,
    Receipt,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    AlertTriangle,
    Loader,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import Decimal from 'decimal.js';
import { useStockReservation } from '@/hooks';
import { SplitPaymentPanel, type SplitPaymentEntry } from './SplitPaymentPanel';
import { FireToKitchenButton } from '@/modules/kitchen/components';
import { TaxInvoice } from './TaxInvoice';

export type PaymentMethod = 'CASH' | 'CARD' | 'MADA';

export interface PaymentEntry {
    method: PaymentMethod;
    amount: string;
    reference?: string;
}

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (payments: PaymentEntry[]) => void;
    onFinalize?: () => void;
    orderTotal: string;
    orderDiscount?: string;
    orderTax: string;
    orderSubtotal: string;
    itemCount: number;
    /** Whether split payments are allowed (from feature flags) */
    canSplitPayment?: boolean;
    /** Order result after successful checkout (for fire button) */
    orderResult?: {
        id: string;
        orderNumber: string;
        orderType: string;
        invoiceNumber?: string;
        invoiceHash?: string;
        qrCodeData?: string;
    } | null;
    /** Line items for invoice display */
    lineItems?: Array<{
        id: string;
        name: string;
        quantity: number;
        unitPrice: string;
        totalPrice: string;
    }>;
    /** Seller information for invoice */
    sellerInfo?: {
        name: string;
        taxNumber: string;
        address?: string;
        phone?: string;
    };
    /** Customer information (optional) */
    customerInfo?: {
        name: string;
        vatNumber?: string;
        address?: string;
    };
    /** VAT rate percentage (default 15) */
    taxRate?: number;
}

const PAYMENT_METHODS: {
    id: PaymentMethod;
    icon: typeof CreditCard;
    labelEn: string;
    labelAr: string;
    color: string;
}[] = [
        { id: 'CASH', icon: Banknote, labelEn: 'Cash', labelAr: 'نقدي', color: 'from-green-500 to-emerald-600' },
        { id: 'CARD', icon: CreditCard, labelEn: 'Card', labelAr: 'بطاقة', color: 'from-blue-500 to-indigo-600' },
        { id: 'MADA', icon: Smartphone, labelEn: 'Mada', labelAr: 'مدى', color: 'from-teal-500 to-teal-600' },
    ];

const QUICK_CASH_AMOUNTS = ['10', '20', '50', '100', '200', '500'];

type CheckoutStep = 'PAYMENT' | 'RECEIPT';

/**
 * Checkout Modal
 * Multi-step payment flow with split payment support
 */
export function CheckoutModal({
    isOpen,
    onClose,
    onComplete,
    onFinalize,
    orderTotal,
    orderDiscount = '0',
    orderTax,
    orderSubtotal,
    itemCount,
    canSplitPayment = false,
    orderResult,
    lineItems = [],
    sellerInfo,
    customerInfo,
    taxRate = 15,
}: CheckoutModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();

    // Stock reservation hook
    const {
        isReserving,
        reservationError,
        unavailableItems,
        reserveStock,
        commitReservation,
        releaseReservation,
        clearError,
    } = useStockReservation();

    const [step, setStep] = useState<CheckoutStep>('PAYMENT');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
    const [payments, setPayments] = useState<PaymentEntry[]>([]);
    const [cashReceived, setCashReceived] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMode, setPaymentMode] = useState<'SINGLE' | 'SPLIT'>('SINGLE');
    const [splitPayments, setSplitPayments] = useState<SplitPaymentEntry[]>([]);

    // Reserve stock when modal opens
    useEffect(() => {
        if (isOpen) {
            reserveStock();
        }
        // Cleanup: release reservation when modal closes without payment
        return () => {
            if (isOpen && step === 'PAYMENT' && payments.length === 0) {
                releaseReservation();
            }
        };
        // Only run when isOpen changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Calculate remaining and change
    const calculations = useMemo(() => {
        const total = new Decimal(orderTotal);
        const paid = payments.reduce((sum, p) => sum.plus(p.amount), new Decimal(0));
        const remaining = total.minus(paid);
        const cashInput = new Decimal(cashReceived || '0');
        const change = selectedMethod === 'CASH' ? cashInput.minus(remaining) : new Decimal(0);

        return {
            total: total.toFixed(3),
            paid: paid.toFixed(3),
            remaining: remaining.toFixed(3),
            remainingNum: remaining.toNumber(),
            change: change.greaterThan(0) ? change.toFixed(3) : '0.000',
            changeNum: change.toNumber(),
            isFullyPaid: remaining.lessThanOrEqualTo(0),
        };
    }, [orderTotal, payments, cashReceived, selectedMethod]);

    // Add payment
    const handleAddPayment = (amount: string) => {
        const newPayment: PaymentEntry = {
            method: selectedMethod,
            amount,
        };
        setPayments((prev) => [...prev, newPayment]);
        setCashReceived('');
    };

    // Remove payment
    const _handleRemovePayment = (index: number) => {
        setPayments((prev) => prev.filter((_, i) => i !== index));
    };

    // Complete checkout - call parent to create order and get ZATCA data
    const handleComplete = async () => {
        try {
            setIsProcessing(true);

            // Call parent's onComplete which will:
            // 1. Create order via orderService.create()
            // 2. Backend generates ZATCA data (invoiceHash, qrCodeData)
            // 3. Parent updates orderResult prop with ZATCA data
            // 4. Parent commits stock reservation
            await onComplete(payments);

            // After onComplete returns, parent has set orderResult
            // Move to receipt step to display the invoice with ZATCA data
            setStep('RECEIPT');
        } catch (error) {
            console.error('[CheckoutModal] Payment processing failed:', error);
            // Stay on payment step if processing failed
        } finally {
            setIsProcessing(false);
        }
    };

    // Finalize - called when user clicks "New Order" after viewing receipt
    // Note: Order was already created in handleComplete, this just resets UI
    const handleFinalize = async () => {
        try {
            // Commit any remaining stock reservation (should be done by backend order creation)
            await commitReservation();
        } catch (error) {
            console.error('[CheckoutModal] Failed to commit reservation:', error);
            // Continue anyway - the backend order creation should have handled this
        }

        // Reset state for next order
        setStep('PAYMENT');
        setPayments([]);
        setCashReceived('');
        onClose();
    };

    // Reset on close
    const handleClose = () => {
        // Release stock reservation if payment wasn't completed
        if (step === 'PAYMENT') {
            releaseReservation();
        }
        setStep('PAYMENT');
        setPayments([]);
        setCashReceived('');
        setPaymentMode('SINGLE');
        setSplitPayments([]);
        clearError();
        onClose();
    };

    // Handle printing the invoice
    const _handlePrintInvoice = () => {
        window.print();
    };

    // Split payment handlers
    const handleAddSplitPayment = (method: any, amount: string, reference?: string) => {
        const newPayment: SplitPaymentEntry = {
            id: `sp-${Date.now()}`,
            method,
            amount,
            reference,
            status: 'PENDING',
        };
        setSplitPayments((prev) => [...prev, newPayment]);
    };

    const handleRemoveSplitPayment = (paymentId: string) => {
        setSplitPayments((prev) => prev.filter((p) => p.id !== paymentId));
    };

    const handleConfirmSplitPayment = () => {
        // Convert split payments to regular payment entries
        const convertedPayments: PaymentEntry[] = splitPayments.map((sp) => ({
            method: sp.method as PaymentMethod,
            amount: sp.amount,
            reference: sp.reference,
        }));
        setPayments(convertedPayments);
        handleComplete();
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
                    data-testid="checkout-modal"
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
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center',
                                    step === 'RECEIPT'
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        : 'bg-gradient-to-br from-cyan-500 to-cyan-600',
                                )}
                            >
                                {step === 'RECEIPT' ? (
                                    <CheckCircle className="w-5 h-5 text-white" />
                                ) : (
                                    <Receipt className="w-5 h-5 text-white" />
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
                                    {step === 'RECEIPT'
                                        ? t('checkout.complete', 'Payment Complete')
                                        : t('checkout.title', 'Checkout')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {itemCount} {language === 'ar' ? 'عنصر' : 'items'}
                                </p>
                            </div>
                        </div>
                        {step !== 'RECEIPT' && (
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
                            {step === 'PAYMENT' && (
                                <motion.div
                                    key="payment"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    {/* Order Summary Mini */}
                                    <div
                                        data-theme={theme}
                                        className={cn(
                                            'rounded-xl p-3 space-y-1',
                                            'bg-slate-800/50',
                                            'data-[theme=light]:bg-slate-50',
                                        )}
                                    >
                                        {/* Reservation Error Alert */}
                                        {reservationError && (
                                            <div className="mb-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-red-400 text-sm">
                                                            {t('checkout.stockError', 'Stock Error')}
                                                        </p>
                                                        <p className="text-red-300 text-xs mt-1">{reservationError}</p>
                                                        {unavailableItems.length > 0 && (
                                                            <ul className="mt-2 text-xs text-red-300 space-y-1">
                                                                {unavailableItems.map((item) => (
                                                                    <li key={item.productId}>
                                                                        • {item.productName}: {t('checkout.requested', 'Requested')} {item.quantity}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Reserving Indicator */}
                                        {isReserving && (
                                            <div className="mb-3 p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                                                <div className="flex items-center gap-2">
                                                    <Loader className="w-4 h-4 text-cyan-400 animate-spin" />
                                                    <p className="text-sm text-cyan-400">
                                                        {t('checkout.reservingStock', 'Reserving stock...')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm" data-testid="checkout-subtotal">
                                            <span className="text-slate-400">{t('summary.subtotal')}</span>
                                            <PriceDisplay value={orderSubtotal} size="sm" />
                                        </div>
                                        {parseFloat(orderDiscount) > 0 && (
                                            <div className="flex justify-between text-sm text-green-400">
                                                <span>{t('summary.discount')}</span>
                                                <span>-<PriceDisplay value={orderDiscount} size="sm" /></span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm" data-testid="checkout-tax">
                                            <span className="text-slate-400">{t('summary.tax')}</span>
                                            <PriceDisplay value={orderTax} size="sm" variant="muted" />
                                        </div>
                                        <div
                                            data-theme={theme}
                                            className={cn(
                                                'flex justify-between pt-2 border-t font-bold',
                                                'border-slate-700',
                                                'data-[theme=light]:border-slate-200',
                                            )}
                                        >
                                            <span
                                                data-theme={theme}
                                                className={cn(
                                                    'text-white',
                                                    'data-[theme=light]:text-slate-900',
                                                )}
                                            >
                                                {t('summary.total')}
                                            </span>
                                            <span data-testid="checkout-total">
                                                <PriceDisplay value={orderTotal} size="lg" variant="primary" />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Split Payment Toggle */}
                                    {canSplitPayment && (
                                        <div className="flex justify-center">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setPaymentMode(paymentMode === 'SINGLE' ? 'SPLIT' : 'SINGLE')}
                                                data-theme={theme}
                                                className={cn(
                                                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                                    paymentMode === 'SPLIT'
                                                        ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white'
                                                        : cn(
                                                            'bg-slate-700/50 text-slate-300 hover:bg-slate-700',
                                                            'data-[theme=light]:bg-slate-100 data-[theme=light]:text-slate-600 data-[theme=light]:hover:bg-slate-200',
                                                        ),
                                                )}
                                            >
                                                {paymentMode === 'SPLIT'
                                                    ? t('checkout.singlePayment', 'Single Payment')
                                                    : t('checkout.splitPayment', 'Split Payment')
                                                }
                                            </motion.button>
                                        </div>
                                    )}

                                    {/* Split Payment Panel */}
                                    {paymentMode === 'SPLIT' ? (
                                        <SplitPaymentPanel
                                            orderTotal={orderTotal}
                                            payments={splitPayments}
                                            onAddPayment={handleAddSplitPayment}
                                            onRemovePayment={handleRemoveSplitPayment}
                                            onConfirm={handleConfirmSplitPayment}
                                            isProcessing={isProcessing}
                                        />
                                    ) : (
                                        <>
                                            {/* Payment Methods */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {PAYMENT_METHODS.map((method) => {
                                                    const Icon = method.icon;
                                                    const isSelected = selectedMethod === method.id;
                                                    return (
                                                        <motion.button
                                                            key={method.id}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setSelectedMethod(method.id)}
                                                            data-testid={`payment-method-${method.id.toLowerCase()}`}
                                                            data-theme={theme}
                                                            className={cn(
                                                                'p-3 rounded-xl border-2 transition-all flex items-center gap-2',
                                                                isSelected
                                                                    ? `bg-gradient-to-r ${method.color} border-transparent text-white`
                                                                    : cn(
                                                                        'border-slate-700 hover:border-slate-600',
                                                                        'data-[theme=light]:border-slate-300 data-[theme=light]:hover:border-slate-400',
                                                                    ),
                                                            )}
                                                        >
                                                            <Icon className="w-5 h-5" />
                                                            <span className="font-medium">
                                                                {language === 'ar' ? method.labelAr : method.labelEn}
                                                            </span>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>

                                            {/* Cash Input */}
                                            {selectedMethod === 'CASH' && (
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap gap-2">
                                                        {QUICK_CASH_AMOUNTS.map((amount) => (
                                                            <motion.button
                                                                key={amount}
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => setCashReceived(amount)}
                                                                data-testid={`quick-cash-${amount}`}
                                                                data-theme={theme}
                                                                className={cn(
                                                                    'px-3 py-2 rounded-lg font-bold text-sm',
                                                                    cashReceived === amount
                                                                        ? 'bg-cyan-500 text-white'
                                                                        : cn(
                                                                            'bg-slate-700 text-slate-300 hover:bg-slate-600',
                                                                            'data-[theme=light]:bg-slate-200 data-[theme=light]:text-slate-700',
                                                                        ),
                                                                )}
                                                            >
                                                                {amount}
                                                            </motion.button>
                                                        ))}
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setCashReceived(calculations.remaining)}
                                                            data-theme={theme}
                                                            className={cn(
                                                                'px-3 py-2 rounded-lg font-bold text-sm',
                                                                'bg-green-500/20 text-green-400 hover:bg-green-500/30',
                                                            )}
                                                        >
                                                            {t('checkout.exact', 'Exact')}
                                                        </motion.button>
                                                    </div>

                                                    {/* Change Display */}
                                                    {calculations.changeNum > 0 && (
                                                        <div
                                                            data-theme={theme}
                                                            className={cn(
                                                                'rounded-xl p-3 text-center',
                                                                'bg-green-500/20 border border-green-500/30',
                                                            )}
                                                        >
                                                            <p className="text-sm text-green-400">
                                                                {t('checkout.change', 'Change')}
                                                            </p>
                                                            <p className="text-2xl font-bold text-green-400" data-testid="change-amount">
                                                                <PriceDisplay value={calculations.change} size="lg" />
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Remaining Amount */}
                                            {payments.length > 0 && calculations.remainingNum > 0 && (
                                                <div
                                                    data-theme={theme}
                                                    className={cn(
                                                        'rounded-xl p-3 text-center',
                                                        'bg-yellow-500/20 border border-yellow-500/30',
                                                    )}
                                                >
                                                    <p className="text-sm text-yellow-400">
                                                        {t('checkout.remaining', 'Remaining')}
                                                    </p>
                                                    <p className="text-xl font-bold text-yellow-400">
                                                        <PriceDisplay value={calculations.remaining} size="lg" />
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            )}

                            {step === 'RECEIPT' && (
                                <motion.div
                                    key="receipt"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    data-testid="payment-success"
                                    className="max-h-[70vh] overflow-y-auto"
                                >
                                    <TaxInvoice
                                        invoiceNumber={orderResult?.invoiceNumber || orderResult?.orderNumber || 'N/A'}
                                        invoiceDate={new Date()}
                                        sellerInfo={sellerInfo || {
                                            name: t('checkout.sellerName', 'Your Business Name'),
                                            taxNumber: t('checkout.taxNumber', '300000000000003'),
                                        }}
                                        customerInfo={customerInfo}
                                        items={lineItems.length > 0 ? lineItems : [{
                                            id: '1',
                                            name: t('checkout.item', 'Item'),
                                            quantity: 1,
                                            unitPrice: orderSubtotal,
                                            totalPrice: orderSubtotal,
                                        }]}
                                        subtotal={orderSubtotal}
                                        taxAmount={orderTax}
                                        taxRate={taxRate}
                                        discountAmount={orderDiscount}
                                        total={orderTotal}
                                        paymentMethod={payments.length > 0 ? payments[0].method : t('checkout.cash', 'Cash')}
                                        invoiceHash={orderResult?.invoiceHash}
                                        qrCodeData={orderResult?.qrCodeData}
                                        onPrint={() => window.print()}
                                        onDownload={() => {
                                            // Download invoice as PDF functionality
                                            console.log('[CheckoutModal] Download invoice');
                                        }}
                                    />

                                    {/* Action Buttons */}
                                    <div className="mt-4 flex justify-center gap-3">
                                        {orderResult && (
                                            <FireToKitchenButton
                                                orderId={orderResult.id}
                                                orderType={orderResult.orderType}
                                                onFired={() => {
                                                    console.log('[CheckoutModal] Order fired to kitchen');
                                                }}
                                            />
                                        )}
                                        <Button
                                            variant="primary"
                                            onClick={onFinalize || handleFinalize}
                                            className="gap-2"
                                        >
                                            {t('checkout.newOrder', 'New Order')}
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    {step === 'PAYMENT' && (
                        <div
                            data-theme={theme}
                            className={cn(
                                'p-4 border-t flex gap-2',
                                'border-slate-700/50',
                                'data-[theme=light]:border-slate-200',
                            )}
                        >
                            <Button variant="secondary" onClick={handleClose}>
                                <ArrowLeft className="w-4 h-4 me-2" />
                                {t('cancel', 'Cancel')}
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                data-testid="complete-payment-btn"
                                onClick={() => {
                                    if (selectedMethod === 'CASH' && cashReceived) {
                                        handleAddPayment(
                                            new Decimal(cashReceived)
                                                .greaterThan(calculations.remaining)
                                                ? calculations.remaining
                                                : cashReceived
                                        );
                                    } else if (selectedMethod !== 'CASH') {
                                        handleAddPayment(calculations.remaining);
                                    }
                                    if (calculations.isFullyPaid || payments.length > 0) {
                                        handleComplete();
                                    }
                                }}
                                disabled={
                                    isProcessing ||
                                    isReserving ||
                                    !!reservationError ||
                                    (selectedMethod === 'CASH' && !cashReceived && !calculations.isFullyPaid)
                                }
                            >
                                {isProcessing ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                    />
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 me-2" />
                                        {t('checkout.pay', 'Complete Payment')}
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default CheckoutModal;
