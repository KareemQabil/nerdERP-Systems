import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import Decimal from 'decimal.js';
import type { Product } from '@/modules/products/types/product.types';
import type { OrderType } from '../types/order.types';
import { DecimalUtil } from '@/core/utils/decimal.utils';

/**
 * Cart Item interface (NEW ARCHITECTURE)
 * Strictly typed based on nerdjson.md
 */
export interface CartItem {
    id: string; // Unique cart item ID
    product: Product;
    quantity: string; // decimal(10,3) as string
    selectedModifiers?: Array<{
        modifierId: string;
        modifierName: string;
        optionId: string;
        optionName: string;
        price: string; // decimal(10,3)
    }>;
    specialInstructions?: string;
    unitPrice: string; // Base price from product
    modifiersTotal: string; // Sum of modifier prices
    lineTotal: string; // (unitPrice + modifiers) * quantity
}

/**
 * Cart Store Interface (NEW ARCHITECTURE)
 */
interface CartStore {
    // State
    items: CartItem[];
    orderType: OrderType;
    tableId: string | null;
    customerId: string | null;
    discount: {
        amount: string; // decimal(10,3)
        reason?: string;
    } | null;

    // Actions
    addItem: (
        product: Product,
        quantity?: string,
        modifiers?: CartItem['selectedModifiers'],
        instructions?: string
    ) => void;
    updateItemQuantity: (itemId: string, quantity: string) => void;
    removeItem: (itemId: string) => void;
    clearCart: () => void;
    setOrderType: (type: OrderType) => void;
    setTable: (tableId: string | null) => void;
    setCustomer: (customerId: string | null) => void;
    applyDiscount: (amount: string, reason?: string) => void;
    clearDiscount: () => void;

    // Computed
    getTotals: () => {
        subtotal: string;
        tax: string;
        discount: string;
        total: string;
        itemCount: number;
    };
}

/**
 * Cart Store (NEW ARCHITECTURE)
 * Uses DecimalUtil for all calculations
 * Follows nerdjson.md schema strictly
 */
export const useCartStore = create<CartStore>()(
    devtools(
        (set, get) => ({
            // Initial state
            items: [],
            orderType: 'TAKEAWAY',
            tableId: null,
            customerId: null,
            discount: null,

            // Add item to cart
            addItem: (product, quantity = '1.000', modifiers, instructions) => {
                const state = get();

                // Calculate modifiers total using DecimalUtil
                const modifiersTotal = modifiers
                    ? DecimalUtil.sum(modifiers.map(m => m.price))
                    : new Decimal(0);

                // Base unit price from product
                const unitPrice = new Decimal(product.salePrice);

                // Calculate line total: (unitPrice + modifiers) * quantity
                const priceWithModifiers = DecimalUtil.add(unitPrice, modifiersTotal);
                const lineTotal = DecimalUtil.multiply(priceWithModifiers, quantity);

                const newItem: CartItem = {
                    id: `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    product,
                    quantity,
                    selectedModifiers: modifiers,
                    specialInstructions: instructions,
                    unitPrice: unitPrice.toFixed(3),
                    modifiersTotal: modifiersTotal.toFixed(3),
                    lineTotal: lineTotal.toFixed(3),
                };

                set({ items: [...state.items, newItem] });
            },

            // Update item quantity
            updateItemQuantity: (itemId, quantity) => {
                const state = get();
                const items = state.items.map(item => {
                    if (item.id === itemId) {
                        // Recalculate line total
                        const priceWithModifiers = DecimalUtil.add(item.unitPrice, item.modifiersTotal);
                        const lineTotal = DecimalUtil.multiply(priceWithModifiers, quantity);

                        return {
                            ...item,
                            quantity,
                            lineTotal: lineTotal.toFixed(3),
                        };
                    }
                    return item;
                });
                set({ items });
            },

            // Remove item from cart
            removeItem: (itemId) => {
                const state = get();
                set({ items: state.items.filter(item => item.id !== itemId) });
            },

            // Clear entire cart
            clearCart: () => {
                set({
                    items: [],
                    tableId: null,
                    customerId: null,
                    discount: null,
                });
            },

            // Set order type
            setOrderType: (type) => {
                set({ orderType: type });
            },

            // Set table
            setTable: (tableId) => {
                set({ tableId });
            },

            // Set customer
            setCustomer: (customerId) => {
                set({ customerId });
            },

            // Apply discount
            applyDiscount: (amount, reason) => {
                set({ discount: { amount, reason } });
            },

            // Clear discount
            clearDiscount: () => {
                set({ discount: null });
            },

            // Get totals (CRITICAL: Uses DecimalUtil for precision)
            getTotals: () => {
                const state = get();

                // Calculate subtotal: sum of all line totals
                const subtotal = DecimalUtil.sum(
                    state.items.map(item => item.lineTotal)
                );

                // Get discount amount
                const discountAmount = state.discount
                    ? new Decimal(state.discount.amount)
                    : new Decimal(0);

                // Subtract discount from subtotal
                const subtotalAfterDiscount = subtotal.minus(discountAmount);

                // Calculate 15% VAT tax
                const tax = DecimalUtil.calculatePercentage(subtotalAfterDiscount, '15');

                // Calculate final total
                const total = subtotalAfterDiscount.plus(tax);

                return {
                    subtotal: subtotal.toFixed(3),
                    tax: tax.toFixed(3),
                    discount: discountAmount.toFixed(3),
                    total: total.toFixed(3),
                    itemCount: state.items.length,
                };
            },
        }),
        { name: 'cart-store' }
    )
);
