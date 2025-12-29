/**
 * Cart Section Component
 * Displays cart items and totals
 */
import { useCartStore } from '@/stores/cart.store';
import Decimal from 'decimal.js';

interface CartSectionProps {
    onCheckout?: () => void;
}

export function CartSection({ onCheckout: _onCheckout }: CartSectionProps) {
    // Use atomic selectors for performance
    const items = useCartStore((state) => state.items.filter(i => !i.isVoided));
    const getSubtotal = useCartStore((state) => state.getSubtotal);
    const getTax = useCartStore((state) => state.getTaxAmount);
    const getTotal = useCartStore((state) => state.getTotal);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeItem = useCartStore((state) => state.removeItem);

    const subtotal = getSubtotal();
    const tax = getTax();
    const total = getTotal();

    return (
        <div className="cart-section">
            {/* Cart Header */}
            <div className="cart-section__header">
                <h2>Current Order</h2>
                <span className="cart-section__count">{items.length} items</span>
            </div>

            {/* Cart Items */}
            <div className="cart-section__items">
                {items.length === 0 ? (
                    <div className="cart-section__empty">
                        <p>Cart is empty</p>
                        <p>Add products to start an order</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className="cart-item">
                            <div className="cart-item__info">
                                <span className="cart-item__name">{item.product.name}</span>
                                <span className="cart-item__price">
                                    {new Decimal(item.unitPrice).toFixed(2)} SAR
                                </span>
                            </div>

                            {/* Modifiers */}
                            {item.modifiers.length > 0 && (
                                <div className="cart-item__modifiers">
                                    {item.modifiers.map((mod, idx) => (
                                        <span key={idx} className="cart-item__modifier">
                                            + {mod.modifierName}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Quantity Controls */}
                            <div className="cart-item__quantity">
                                <button
                                    onClick={() => updateQuantity(item.id, parseInt(item.quantity) - 1)}
                                    className="qty-btn"
                                >
                                    -
                                </button>
                                <span className="qty-value">{parseInt(item.quantity)}</span>
                                <button
                                    onClick={() => updateQuantity(item.id, parseInt(item.quantity) + 1)}
                                    className="qty-btn"
                                >
                                    +
                                </button>
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="remove-btn"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="cart-item__total">
                                {new Decimal(item.lineTotal).toFixed(2)} SAR
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Cart Summary */}
            <div className="cart-section__summary">
                <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{new Decimal(subtotal).toFixed(2)} SAR</span>
                </div>
                <div className="summary-row">
                    <span>VAT (15%)</span>
                    <span>{new Decimal(tax).toFixed(2)} SAR</span>
                </div>
                <div className="summary-row summary-row--total">
                    <span>Total</span>
                    <span>{new Decimal(total).toFixed(2)} SAR</span>
                </div>
            </div>
        </div>
    );
}
