import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import Decimal from 'decimal.js';
import type { Product } from '@/modules/products/types/product.types';
import type { OrderType } from '../types/order.types';
import { DecimalUtil } from '@/core/utils/decimal.utils';

/**
 * Cart Item interface (NEW ARCHITECTURE + RESTAURANT WORKFLOW)
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

    // RESTAURANT WORKFLOW FIELDS (NEW)
    status: 'NEW' | 'SENT' | 'VOIDED'; // Item lifecycle status
    sentAt?: string; // ISO 8601 timestamp when sent to kitchen
    voidedAt?: string; // ISO 8601 timestamp when voided
    voidReason?: string; // Reason for voiding
}

/**
 * Cart Store Interface (NEW ARCHITECTURE + RESTAURANT WORKFLOW)
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

    // RESTAURANT WORKFLOW STATE (NEW)
    serviceCharge: string; // Auto-calculated for DINE_IN
    logs: Array<{
        id: string;
        timestamp: string;
        action: string;
        itemId?: string;
        details: any;
    }>; // Audit trail

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
    setOrderType: (type: OrderType) => void; // Enhanced with fee calculation
    setTable: (tableId: string | null) => void;
    setCustomer: (customerId: string | null) => void;
    applyDiscount: (amount: string, reason?: string) => void;
    clearDiscount: () => void;

    // RESTAURANT WORKFLOW ACTIONS (NEW)
    sendToKitchen: (referenceNote?: string) => CartItem[]; // Returns items sent
    voidItem: (itemId: string, reason?: string) => void; // Void sent items

    // Computed
    getTotals: () => {
        subtotal: string;
        tax: string;
        discount: string;
        serviceCharge: string; // NEW
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

            // RESTAURANT WORKFLOW STATE (NEW)
            serviceCharge: '0.000',
            logs: [],

            // Add item to cart (PHASE 2: Deep Comparison Logic)
            addItem: (product, quantity = '1.000', modifiers, instructions) => {
                const state = get();

                // Helper: Deep compare modifiers
                const areModifiersEqual = (mods1?: CartItem['selectedModifiers'], mods2?: CartItem['selectedModifiers']) => {
                    if (!mods1 && !mods2) return true;
                    if (!mods1 || !mods2) return false;
                    if (mods1.length !== mods2.length) return false;

                    // Sort and compare (order-independent)
                    const sorted1 = [...mods1].sort((a, b) => a.modifierId.localeCompare(b.modifierId));
                    const sorted2 = [...mods2].sort((a, b) => a.modifierId.localeCompare(b.modifierId));

                    return sorted1.every((mod1, index) => {
                        const mod2 = sorted2[index];
                        return mod1.modifierId === mod2.modifierId &&
                            mod1.optionId === mod2.optionId;
                    });
                };

                // Check if identical item exists (same product + same modifiers)
                const existingItemIndex = state.items.findIndex(item =>
                    item.product.id === product.id &&
                    areModifiersEqual(item.selectedModifiers, modifiers) &&
                    item.specialInstructions === instructions
                );

                if (existingItemIndex !== -1) {
                    // Item exists: Increase quantity
                    const existingItem = state.items[existingItemIndex];
                    const newQuantity = DecimalUtil.add(existingItem.quantity, quantity);

                    const items = state.items.map((item, index) => {
                        if (index === existingItemIndex) {
                            // Recalculate line total
                            const priceWithModifiers = DecimalUtil.add(item.unitPrice, item.modifiersTotal);
                            const lineTotal = DecimalUtil.multiply(priceWithModifiers.toFixed(3), newQuantity.toFixed(3));

                            return {
                                ...item,
                                quantity: newQuantity.toFixed(3),
                                lineTotal: lineTotal.toFixed(3),
                            };
                        }
                        return item;
                    });

                    set({ items });
                    console.log('✅ [CartStore] Increased quantity for existing item');
                } else {
                    // New item: Add to cart
                    // Calculate modifiers total using DecimalUtil
                    const modifiersTotal = modifiers
                        ? DecimalUtil.sum(modifiers.map(m => m.price))
                        : new Decimal(0);

                    // Base unit price from product
                    const unitPrice = new Decimal(product.salePrice);

                    // Calculate line total: (unitPrice + modifiers) * quantity
                    const priceWithModifiers = DecimalUtil.add(unitPrice.toFixed(3), modifiersTotal.toFixed(3));
                    const lineTotal = DecimalUtil.multiply(priceWithModifiers.toFixed(3), quantity);

                    const newItem: CartItem = {
                        id: `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        product,
                        quantity,
                        selectedModifiers: modifiers,
                        specialInstructions: instructions,
                        unitPrice: unitPrice.toFixed(3),
                        modifiersTotal: modifiersTotal.toFixed(3),
                        lineTotal: lineTotal.toFixed(3),

                        // RESTAURANT WORKFLOW (NEW)
                        status: 'NEW', // Default status for new items
                    };

                    // Add audit log
                    const log = {
                        id: `log-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        action: 'ADD_ITEM',
                        itemId: newItem.id,
                        details: {
                            productName: product.name,
                            quantity,
                        },
                    };

                    set({
                        items: [...state.items, newItem],
                        logs: [...get().logs, log],
                    });
                    console.log('✅ [CartStore] Added new item to cart');
                }
            },

            // Update item quantity
            updateItemQuantity: (itemId, quantity) => {
                const state = get();
                const items = state.items.map(item => {
                    if (item.id === itemId) {
                        // Recalculate line total
                        const priceWithModifiers = DecimalUtil.add(item.unitPrice, item.modifiersTotal);
                        const lineTotal = DecimalUtil.multiply(priceWithModifiers.toFixed(3), quantity);

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

            // Set order type (ENHANCED with fee calculation)
            setOrderType: (type) => {
                const state = get();
                let serviceCharge = '0.000';

                // Calculate service charge for DINE_IN (15%)
                if (type === 'DINE_IN') {
                    const subtotal = state.items.reduce((sum, item) => {
                        return DecimalUtil.add(sum.toFixed(3), item.lineTotal);
                    }, new Decimal(0));

                    // 15% service charge
                    serviceCharge = DecimalUtil.multiply(subtotal.toFixed(3), '0.15').toFixed(3);
                }

                // Add audit log
                const log = {
                    id: `log-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    action: 'CHANGE_ORDER_TYPE',
                    details: {
                        orderType: type,
                        serviceCharge,
                    },
                };

                set({
                    orderType: type,
                    serviceCharge,
                    logs: [...state.logs, log],
                });

                console.log(`✅ [CartStore] Order type changed to ${type}, service charge: ${serviceCharge}`);
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

            // ============================================
            // RESTAURANT WORKFLOW ACTIONS (NEW)
            // ============================================

            // Send to kitchen (Delta Print Logic)
            sendToKitchen: (referenceNote = '') => {
                const state = get();

                // FILTER: Only NEW items (not already sent)
                const newItems = state.items.filter(item => item.status === 'NEW');

                if (newItems.length === 0) {
                    console.warn('⚠️ [CartStore] No new items to send to kitchen');
                    return [];
                }

                // UPDATE STATUS: Mark as SENT
                const updatedItems = state.items.map(item => {
                    if (item.status === 'NEW') {
                        return {
                            ...item,
                            status: 'SENT' as const,
                            sentAt: new Date().toISOString(),
                        };
                    }
                    return item;
                });

                // LOG ACTION
                const log = {
                    id: `log-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    action: 'SEND_KITCHEN',
                    details: {
                        productName: `${newItems.length} items sent`,
                        quantity: `${newItems.length}`,
                        referenceNote, // Store reference note (e.g., "Table 5")
                    },
                };

                set({
                    items: updatedItems,
                    logs: [...state.logs, log],
                });

                console.log(`✅ [CartStore] Sent ${newItems.length} items to kitchen${referenceNote ? ` (${referenceNote})` : ''}`);
                return newItems;
            },

            // Void item (Manager auth required for SENT items)
            voidItem: (itemId, reason = 'OTHER') => {
                const state = get();
                const item = state.items.find(i => i.id === itemId);

                if (!item) {
                    console.error('❌ [CartStore] Item not found:', itemId);
                    return;
                }

                // LOGIC: If NEW, just remove it (not sent yet)
                if (item.status === 'NEW') {
                    const log = {
                        id: `log-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        action: 'REMOVE_ITEM',
                        itemId,
                        details: {
                            productName: item.product.name,
                        },
                    };

                    set({
                        items: state.items.filter(i => i.id !== itemId),
                        logs: [...state.logs, log],
                    });
                    console.log('✅ [CartStore] Removed NEW item directly');
                    return;
                }

                // LOGIC: If SENT, mark as VOIDED (don't delete)
                if (item.status === 'SENT') {
                    const updatedItems = state.items.map(i => {
                        if (i.id === itemId) {
                            return {
                                ...i,
                                status: 'VOIDED' as const,
                                voidedAt: new Date().toISOString(),
                                voidReason: reason,
                            };
                        }
                        return i;
                    });

                    // LOG ACTION
                    const log = {
                        id: `log-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        action: 'VOID_ITEM',
                        itemId,
                        details: {
                            productName: item.product.name,
                            reason,
                        },
                    };

                    set({
                        items: updatedItems,
                        logs: [...state.logs, log],
                    });

                    console.log(`✅ [CartStore] Voided SENT item: ${item.product.name} (${reason})`);
                }
            },

            // Get totals (CRITICAL: Uses DecimalUtil for precision)
            getTotals: () => {
                const state = get();

                // Calculate subtotal: sum of all line totals (excluding VOIDED items)
                const subtotal = DecimalUtil.sum(
                    state.items
                        .filter(item => item.status !== 'VOIDED') // Exclude voided items
                        .map(item => item.lineTotal)
                );

                // Get discount amount
                const discountAmount = state.discount
                    ? new Decimal(state.discount.amount)
                    : new Decimal(0);

                // Calculate subtotal after discount
                const subtotalAfterDiscount = DecimalUtil.subtract(subtotal.toFixed(3), discountAmount.toFixed(3));

                // Get service charge
                const serviceChargeAmount = new Decimal(state.serviceCharge);

                // Calculate tax  (15% on subtotal + service charge)
                const taxableAmount = DecimalUtil.add(subtotalAfterDiscount.toFixed(3), serviceChargeAmount.toFixed(3));
                const taxRate = new Decimal('0.15'); // 15% VAT
                const tax = taxableAmount.times(taxRate);

                // Calculate final total: subtotal - discount + service charge + tax
                const total = DecimalUtil.add(
                    taxableAmount.toFixed(3),
                    tax.toFixed(3)
                );

                return {
                    subtotal: subtotal.toFixed(3),
                    tax: tax.toFixed(3),
                    discount: discountAmount.toFixed(3),
                    serviceCharge: serviceChargeAmount.toFixed(3), // NEW
                    total: total.toFixed(3),
                    itemCount: state.items.filter(item => item.status !== 'VOIDED').length,
                };
            },
        }),
        {
            name: 'cart-store',
        }
    )
);
