/**
 * CheckoutModal Component
 * Multi-step checkout flow with payment processing
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Decimal from 'decimal.js';
import { useCartStore } from '@/stores/cart.store';
import { ordersApi, inventoryApi } from '@/modules/sales';
import type { CreateOrderPayload, PaymentMethod } from '@/modules/sales';
import './CheckoutModal.css';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

type CheckoutStep = 'PAYMENT' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

interface PaymentEntry {
    method: PaymentMethod;
    amount: string;
}

export function CheckoutModal({ isOpen, onClose, onComplete }: CheckoutModalProps) {
    // Cart state
    const items = useCartStore((state) => state.items.filter(i => !i.isVoided));
    const orderType = useCartStore((state) => state.orderType);
    const customer = useCartStore((state) => state.customer);
    const table = useCartStore((state) => state.table);
    const notes = useCartStore((state) => state.notes);
    const getTotal = useCartStore((state) => state.getTotal);
    const clearCart = useCartStore((state) => state.clearCart);

    // Modal state
    const [step, setStep] = useState<CheckoutStep>('PAYMENT');
    const [payments, setPayments] = useState<PaymentEntry[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
    const [amountInput, setAmountInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [reservationId, setReservationId] = useState<string | null>(null);

    const total = getTotal();
    const totalPaid = payments.reduce(
        (sum, p) => new Decimal(sum).plus(p.amount).toFixed(3),
        '0.000'
    );
    const remaining = new Decimal(total).minus(totalPaid).toFixed(3);

    // Create order mutation
    const createOrderMutation = useMutation({
        mutationFn: async (payload: CreateOrderPayload) => {
            return await ordersApi.createOrder(payload);
        },
        onSuccess: () => {
            setStep('SUCCESS');
            setTimeout(() => {
                clearCart();
                onComplete();
                handleClose();
            }, 2000);
        },
        onError: (err: any) => {
            setStep('ERROR');
            setError(err?.response?.data?.error?.message || 'Order creation failed');
            // Release reservation on error
            if (reservationId) {
                inventoryApi.releaseReservation(reservationId).catch(console.error);
            }
        },
    });

    // Handle payment addition
    const handleAddPayment = () => {
        const amount = parseFloat(amountInput);
        if (!amount || amount <= 0) {
            setError('Invalid amount');
            return;
        }

        const remainingNum = parseFloat(remaining);
        if (amount > remainingNum) {
            setError(`Amount exceeds remaining balance (${remainingNum.toFixed(2)} SAR)`);
            return;
        }

        setPayments([...payments, { method: selectedMethod, amount: amount.toFixed(3) }]);
        setAmountInput('');
        setError(null);
    };

    // Handle quick payment (full amount)
    const handleQuickPayment = (method: PaymentMethod) => {
        if (parseFloat(remaining) <= 0) return;

        setPayments([{ method, amount: remaining }]);
        setError(null);
    };

    // Handle remove payment
    const handleRemovePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    // Handle checkout
    const handleCheckout = async () => {
        // Validate payments
        if (parseFloat(remaining) > 0.01) {
            setError('Payment incomplete');
            return;
        }

        setStep('PROCESSING');
        setError(null);

        try {
            // 1. Reserve stock first
            const warehouseId = 'default-warehouse-id'; // TODO: Get from session/config
            const reservationId = await inventoryApi.reserveStock(
                items.map(item => ({
                    productId: item.productId,
                    quantity: parseFloat(item.quantity),
                })),
                warehouseId
            );

            setReservationId(reservationId);

            // 2. Create order payload
            const payload: CreateOrderPayload = {
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: parseFloat(item.quantity),
                    unitPrice: parseFloat(item.unitPrice),
                    modifiers: item.modifiers.map(mod => ({
                        modifierId: mod.modifierId,
                        optionId: mod.modifierId, // TODO: Fix when modifier options are available
                        quantity: 1,
                    })),
                    specialInstructions: item.specialInstructions || undefined,
                })),
                payments: payments.map(p => ({
                    method: p.method,
                    amount: parseFloat(p.amount),
                })),
                orderType,
                registerSessionId: 'session-id', // TODO: Get from session store
                warehouseId,
                customerId: customer?.id,
                tableId: table?.id,
                notes: notes || undefined,
            };

            // 3. Create order
            await createOrderMutation.mutateAsync(payload);
        } catch (err: any) {
            setStep('ERROR');
            setError(err.message || 'Checkout failed');
            if (reservationId) {
                inventoryApi.releaseReservation(reservationId).catch(console.error);
            }
        }
    };

    const handleClose = () => {
        setStep('PAYMENT');
        setPayments([]);
        setAmountInput('');
        setError(null);
        setReservationId(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="checkout-modal-overlay" onClick={handleClose}>
            <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="checkout-modal__header">
                    <h2>Checkout</h2>
                    <button className="close-btn" onClick={handleClose}>×</button>
                </div>

                {/* Content based on step */}
                {step === 'PAYMENT' && (
                    <>
                        {/* Order Summary */}
                        <div className="checkout-modal__summary">
                            <div className="summary-row">
                                <span>Items ({items.length})</span>
                                <span>{new Decimal(total).toFixed(2)} SAR</span>
                            </div>
                            <div className="summary-row summary-row--total">
                                <span>Total</span>
                                <span>{new Decimal(total).toFixed(2)} SAR</span>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="checkout-modal__quick-payments">
                            <button
                                className="quick-payment-btn"
                                onClick={() => handleQuickPayment('CASH')}
                                disabled={parseFloat(remaining) <= 0}
                            >
                                💵 Cash
                            </button>
                            <button
                                className="quick-payment-btn"
                                onClick={() => handleQuickPayment('CARD')}
                                disabled={parseFloat(remaining) <= 0}
                            >
                                💳 Card
                            </button>
                            <button
                                className="quick-payment-btn"
                                onClick={() => handleQuickPayment('MADA')}
                                disabled={parseFloat(remaining) <= 0}
                            >
                                🏦 Mada
                            </button>
                        </div>

                        {/* Split Payment */}
                        <div className="checkout-modal__split-payment">
                            <h3>Split Payment</h3>
                            <div className="split-payment-input">
                                <select
                                    value={selectedMethod}
                                    onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="MADA">Mada</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={amountInput}
                                    onChange={(e) => setAmountInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddPayment()}
                                />
                                <button onClick={handleAddPayment}>Add</button>
                            </div>
                        </div>

                        {/* Payment List */}
                        {payments.length > 0 && (
                            <div className="checkout-modal__payments">
                                <h3>Payments</h3>
                                {payments.map((payment, index) => (
                                    <div key={index} className="payment-entry">
                                        <span>{payment.method}</span>
                                        <span>{new Decimal(payment.amount).toFixed(2)} SAR</span>
                                        <button onClick={() => handleRemovePayment(index)}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Remaining */}
                        <div className="checkout-modal__remaining">
                            <span>Remaining</span>
                            <span className={parseFloat(remaining) > 0 ? 'text-warning' : 'text-success'}>
                                {new Decimal(remaining).toFixed(2)} SAR
                            </span>
                        </div>

                        {/* Error */}
                        {error && <div className="checkout-modal__error">{error}</div>}

                        {/* Actions */}
                        <div className="checkout-modal__actions">
                            <button className="btn btn--secondary" onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                className="btn btn--primary"
                                onClick={handleCheckout}
                                disabled={parseFloat(remaining) > 0.01}
                            >
                                Complete Order
                            </button>
                        </div>
                    </>
                )}

                {step === 'PROCESSING' && (
                    <div className="checkout-modal__processing">
                        <div className="spinner"></div>
                        <p>Processing order...</p>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="checkout-modal__success">
                        <div className="success-icon">✓</div>
                        <h3>Order Complete!</h3>
                        <p>Redirecting...</p>
                    </div>
                )}

                {step === 'ERROR' && (
                    <div className="checkout-modal__error-state">
                        <div className="error-icon">✗</div>
                        <h3>Order Failed</h3>
                        <p>{error}</p>
                        <button className="btn btn--primary" onClick={() => setStep('PAYMENT')}>
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
