/**
 * Cart Redux Slice
 * Manages shopping cart state for POS
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import Decimal from 'decimal.js';
import { DecimalUtil } from '@/lib/decimal';
import type {
    OrderType,
    KitchenStatus,
    ModifierGroup,
    KitchenStation,
    ItemDiscount,
    VoidReason,
} from '@/types/pos.types';

// =============================================================================
// TYPES
// =============================================================================

export interface ProductInfo {
    id: string;
    sku: string;
    name: string;
    nameAr: string | null;
    salePrice: string;
    imageUrl?: string;
    requiresKitchen: boolean;
    kitchenStation: KitchenStation | null;
    trackInventory: boolean;
    stockQuantity?: string;
    modifierGroups: ModifierGroup[];
    hasRequiredModifiers: boolean;
}

export interface CartItemModifier {
    modifierId: string;
    modifierName: string;
    modifierNameAr: string | null;
    modifierGroupId: string;
    modifierGroupName: string;
    priceAdjustment: string;
    isNegative: boolean;
}

export interface CartItem {
    id: string;
    productId: string;
    product: ProductInfo;
    quantity: string;
    basePrice: string;
    modifiersTotal: string;
    unitPrice: string;
    lineTotal: string;
    modifiers: CartItemModifier[];
    specialInstructions: string | null;
    kitchenStatus: KitchenStatus;
    addedAt: string;
    firedAt: string | null;
    readyAt: string | null;
    itemDiscount: ItemDiscount | null;
    isVoided: boolean;
    voidedAt?: string;
    voidReason?: VoidReason;
    voidAuthorizedBy?: string;
}

export interface AppliedDiscount {
    type: 'percentage' | 'fixed';
    value: string;
    reason: string;
    code?: string;
    authorizedBy?: string;
}

export interface CustomerInfo {
    id: string;
    name: string;
    nameAr?: string | null;
    phone?: string;
    loyaltyPoints?: number;
}

export interface TableInfo {
    id: string;
    number: string;
    zoneName?: string;
}

export interface DeliveryInfo {
    address: string;
    city: string;
    zone: string;
    deliveryFee: string;
    customerName: string;
    customerPhone: string;
}

// =============================================================================
// STATE INTERFACE
// =============================================================================

export interface CartState {
    items: CartItem[];
    orderType: OrderType;
    customer: CustomerInfo | null;
    table: TableInfo | null;
    delivery: DeliveryInfo | null;
    discount: AppliedDiscount | null;
    notes: string | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TAX_RATE = '15'; // 15% VAT

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: CartState = {
    items: [],
    orderType: 'TAKEAWAY',
    customer: null,
    table: null,
    delivery: null,
    discount: null,
    notes: null,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateModifiersTotal(modifiers: CartItemModifier[]): string {
    return modifiers
        .reduce((sum, m) => DecimalUtil.add(sum, m.priceAdjustment), new Decimal(0))
        .toFixed(3);
}

function calculateLineTotal(unitPrice: string, quantity: string): string {
    return DecimalUtil.multiply(unitPrice, quantity).toFixed(3);
}

function generateCartItemId(): string {
    return crypto.randomUUID();
}

// =============================================================================
// SLICE
// =============================================================================

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        // =====================================================================
        // ITEM ACTIONS
        // =====================================================================

        /**
         * Add item to cart
         */
        addItem: (
            state,
            action: PayloadAction<{
                product: ProductInfo;
                quantity?: number;
                modifiers?: CartItemModifier[];
                instructions?: string;
            }>
        ) => {
            const { product, quantity = 1, modifiers = [], instructions } = action.payload;
            const basePrice = product.salePrice;
            const modifiersTotal = calculateModifiersTotal(modifiers);
            const unitPrice = DecimalUtil.add(basePrice, modifiersTotal).toFixed(3);
            const lineTotal = calculateLineTotal(unitPrice, quantity.toString());

            // Check if identical item exists
            const modifiersKey = JSON.stringify(modifiers.map((m) => m.modifierId).sort());
            const existingItem = state.items.find(
                (item) =>
                    item.productId === product.id &&
                    JSON.stringify(item.modifiers.map((m) => m.modifierId).sort()) === modifiersKey &&
                    item.specialInstructions === (instructions ?? null) &&
                    !item.isVoided
            );

            if (existingItem) {
                // Increment quantity
                const newQty = DecimalUtil.add(existingItem.quantity, quantity);
                existingItem.quantity = newQty.toFixed(3);
                existingItem.lineTotal = calculateLineTotal(existingItem.unitPrice, newQty.toString());
            } else {
                // Add new item
                const shouldFireImmediately = state.orderType === 'DINE_IN' && product.requiresKitchen;

                const newItem: CartItem = {
                    id: generateCartItemId(),
                    productId: product.id,
                    product,
                    quantity: quantity.toString(),
                    basePrice,
                    modifiersTotal,
                    unitPrice,
                    lineTotal,
                    modifiers,
                    specialInstructions: instructions ?? null,
                    kitchenStatus: shouldFireImmediately ? 'FIRED' : 'PENDING',
                    addedAt: new Date().toISOString(),
                    firedAt: shouldFireImmediately ? new Date().toISOString() : null,
                    readyAt: null,
                    itemDiscount: null,
                    isVoided: false,
                };
                state.items.push(newItem);
            }
        },

        /**
         * Remove item from cart
         */
        removeItem: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter((item) => item.id !== action.payload);
        },

        /**
         * Void item
         */
        voidItem: (
            state,
            action: PayloadAction<{
                cartItemId: string;
                reason: VoidReason;
                authorizedBy?: string;
            }>
        ) => {
            const { cartItemId, reason, authorizedBy } = action.payload;
            const item = state.items.find((i) => i.id === cartItemId);
            if (item) {
                item.isVoided = true;
                item.voidedAt = new Date().toISOString();
                item.voidReason = reason;
                item.voidAuthorizedBy = authorizedBy;
            }
        },

        /**
         * Update item quantity
         */
        updateQuantity: (
            state,
            action: PayloadAction<{ cartItemId: string; quantity: number }>
        ) => {
            const { cartItemId, quantity } = action.payload;
            if (quantity < 1) {
                state.items = state.items.filter((item) => item.id !== cartItemId);
                return;
            }
            const item = state.items.find((i) => i.id === cartItemId);
            if (item) {
                item.quantity = quantity.toString();
                item.lineTotal = calculateLineTotal(item.unitPrice, quantity.toString());
            }
        },

        /**
         * Update item modifiers
         */
        updateModifiers: (
            state,
            action: PayloadAction<{ cartItemId: string; modifiers: CartItemModifier[] }>
        ) => {
            const { cartItemId, modifiers } = action.payload;
            const item = state.items.find((i) => i.id === cartItemId);
            if (item) {
                const modifiersTotal = calculateModifiersTotal(modifiers);
                const unitPrice = DecimalUtil.add(item.basePrice, modifiersTotal).toFixed(3);
                item.modifiers = modifiers;
                item.modifiersTotal = modifiersTotal;
                item.unitPrice = unitPrice;
                item.lineTotal = calculateLineTotal(unitPrice, item.quantity);
            }
        },

        /**
         * Update item instructions
         */
        updateInstructions: (
            state,
            action: PayloadAction<{ cartItemId: string; instructions: string }>
        ) => {
            const { cartItemId, instructions } = action.payload;
            const item = state.items.find((i) => i.id === cartItemId);
            if (item) {
                item.specialInstructions = instructions;
            }
        },

        /**
         * Set item discount
         */
        setItemDiscount: (
            state,
            action: PayloadAction<{ cartItemId: string; discount: ItemDiscount }>
        ) => {
            const { cartItemId, discount } = action.payload;
            const item = state.items.find((i) => i.id === cartItemId);
            if (item) {
                item.itemDiscount = discount;
            }
        },

        /**
         * Remove item discount
         */
        removeItemDiscount: (state, action: PayloadAction<string>) => {
            const item = state.items.find((i) => i.id === action.payload);
            if (item) {
                item.itemDiscount = null;
            }
        },

        // =====================================================================
        // ORDER CONTEXT ACTIONS
        // =====================================================================

        /**
         * Set order type
         */
        setOrderType: (state, action: PayloadAction<OrderType>) => {
            state.orderType = action.payload;
            if (action.payload !== 'DINE_IN') {
                state.table = null;
            }
            if (action.payload !== 'DELIVERY') {
                state.delivery = null;
            }
        },

        /**
         * Set customer
         */
        setCustomer: (state, action: PayloadAction<CustomerInfo | null>) => {
            state.customer = action.payload;
        },

        /**
         * Set table
         */
        setTable: (state, action: PayloadAction<TableInfo | null>) => {
            state.table = action.payload;
            if (action.payload) {
                state.orderType = 'DINE_IN';
            }
        },

        /**
         * Set delivery info
         */
        setDelivery: (state, action: PayloadAction<DeliveryInfo | null>) => {
            state.delivery = action.payload;
            if (action.payload) {
                state.orderType = 'DELIVERY';
            }
        },

        /**
         * Set order discount
         */
        setDiscount: (state, action: PayloadAction<AppliedDiscount | null>) => {
            state.discount = action.payload;
        },

        /**
         * Set order notes
         */
        setNotes: (state, action: PayloadAction<string | null>) => {
            state.notes = action.payload;
        },

        // =====================================================================
        // KITCHEN ACTIONS
        // =====================================================================

        /**
         * Fire items to kitchen
         */
        fireToKitchen: (state, action: PayloadAction<string[] | undefined>) => {
            const cartItemIds = action.payload;
            const now = new Date().toISOString();

            state.items.forEach((item) => {
                if (cartItemIds && !cartItemIds.includes(item.id)) return;
                if (!item.product.requiresKitchen || item.kitchenStatus !== 'PENDING') return;

                item.kitchenStatus = 'FIRED';
                item.firedAt = now;
            });
        },

        /**
         * Update kitchen status
         */
        updateKitchenStatus: (
            state,
            action: PayloadAction<{ cartItemId: string; status: KitchenStatus }>
        ) => {
            const { cartItemId, status } = action.payload;
            const item = state.items.find((i) => i.id === cartItemId);
            if (item) {
                item.kitchenStatus = status;
                if (status === 'READY') {
                    item.readyAt = new Date().toISOString();
                }
            }
        },

        // =====================================================================
        // CART ACTIONS
        // =====================================================================

        /**
         * Clear entire cart
         */
        clearCart: () => initialState,

        /**
         * Restore cart from held order
         */
        restoreCart: (_state, action: PayloadAction<CartState>) => {
            return action.payload;
        },
    },
});

// =============================================================================
// ACTIONS
// =============================================================================

export const {
    addItem,
    removeItem,
    voidItem,
    updateQuantity,
    updateModifiers,
    updateInstructions,
    setItemDiscount,
    removeItemDiscount,
    setOrderType,
    setCustomer,
    setTable,
    setDelivery,
    setDiscount,
    setNotes,
    fireToKitchen,
    updateKitchenStatus,
    clearCart,
    restoreCart,
} = cartSlice.actions;

// =============================================================================
// SELECTORS
// =============================================================================

// Basic selectors
export const selectCartItems = (state: RootState) => state.cart.items;
export const selectOrderType = (state: RootState) => state.cart.orderType;
export const selectCustomer = (state: RootState) => state.cart.customer;
export const selectTable = (state: RootState) => state.cart.table;
export const selectDelivery = (state: RootState) => state.cart.delivery;
export const selectDiscount = (state: RootState) => state.cart.discount;
export const selectNotes = (state: RootState) => state.cart.notes;

// Computed selectors
export const selectActiveItems = (state: RootState) =>
    state.cart.items.filter((i) => !i.isVoided);

export const selectKitchenItems = (state: RootState) =>
    selectActiveItems(state).filter((i) => i.product.requiresKitchen);

export const selectNonKitchenItems = (state: RootState) =>
    selectActiveItems(state).filter((i) => !i.product.requiresKitchen);

export const selectPendingKitchenItems = (state: RootState) =>
    selectKitchenItems(state).filter(
        (i) => i.kitchenStatus === 'PENDING' || i.kitchenStatus === 'FIRED' || i.kitchenStatus === 'PREPARING'
    );

export const selectReadyItems = (state: RootState) =>
    selectActiveItems(state).filter(
        (i) => !i.product.requiresKitchen || i.kitchenStatus === 'READY' || i.kitchenStatus === 'SERVED'
    );

export const selectAllItemsReady = (state: RootState) => {
    const kitchenItems = selectKitchenItems(state);
    return kitchenItems.every((i) => i.kitchenStatus === 'READY' || i.kitchenStatus === 'SERVED');
};

export const selectSubtotal = (state: RootState): string => {
    const activeItems = selectActiveItems(state);
    return DecimalUtil.sum(activeItems.map((i) => i.lineTotal)).toFixed(3);
};

export const selectItemDiscountsTotal = (state: RootState): string => {
    const activeItems = selectActiveItems(state);
    const total = activeItems.reduce((sum, item) => {
        if (item.itemDiscount) {
            return DecimalUtil.add(sum, item.itemDiscount.calculatedAmount);
        }
        return sum;
    }, new Decimal(0));
    return total.toFixed(3);
};

export const selectTaxRate = (_state: RootState): string => TAX_RATE;

export const selectDiscountAmount = (state: RootState): string => {
    const discount = state.cart.discount;
    if (!discount) return '0.000';

    const subtotal = selectSubtotal(state);
    if (discount.type === 'percentage') {
        return DecimalUtil.calculatePercentage(subtotal, discount.value).toFixed(3);
    }
    return discount.value;
};

export const selectTaxAmount = (state: RootState): string => {
    const subtotal = selectSubtotal(state);
    const discountAmount = selectDiscountAmount(state);
    const taxableAmount = DecimalUtil.subtract(subtotal, discountAmount);
    return DecimalUtil.calculatePercentage(taxableAmount, TAX_RATE).toFixed(3);
};

export const selectDeliveryFee = (state: RootState): string => {
    return state.cart.delivery?.deliveryFee ?? '0.000';
};

export const selectTotal = (state: RootState): string => {
    const subtotal = selectSubtotal(state);
    const tax = selectTaxAmount(state);
    const discountAmount = selectDiscountAmount(state);
    const deliveryFee = selectDeliveryFee(state);

    return DecimalUtil.add(
        DecimalUtil.subtract(DecimalUtil.add(subtotal, tax), discountAmount),
        deliveryFee
    ).toFixed(3);
};

export const selectItemCount = (state: RootState): number =>
    selectActiveItems(state).length;

export const selectTotalQuantity = (state: RootState): number =>
    selectActiveItems(state).reduce((sum, item) => sum + parseFloat(item.quantity), 0);

export const selectCanCheckout = (state: RootState): boolean => {
    const blockers = selectCheckoutBlockers(state);
    return blockers.length === 0;
};

export const selectCanPartialCheckout = (state: RootState): boolean => {
    const orderType = state.cart.orderType;
    const readyItems = selectReadyItems(state);
    return orderType === 'DINE_IN' && readyItems.length > 0;
};

export const selectCheckoutBlockers = (state: RootState): string[] => {
    const blockers: string[] = [];
    const activeItems = selectActiveItems(state);
    const orderType = state.cart.orderType;
    const table = state.cart.table;
    const delivery = state.cart.delivery;

    if (activeItems.length === 0) {
        blockers.push('Cart is empty');
        return blockers;
    }

    if (orderType === 'DINE_IN' && !table) {
        blockers.push('Table selection required for dine-in');
    }

    if (orderType === 'DELIVERY' && !delivery) {
        blockers.push('Delivery address required');
    }

    if (orderType === 'DINE_IN') {
        const pendingItems = selectPendingKitchenItems(state);
        pendingItems.forEach((item) => {
            blockers.push(`${item.product.name} is ${item.kitchenStatus.toLowerCase()}`);
        });
    }

    return blockers;
};

/**
 * Combined data for checkout modal
 * Returns all data needed for checkout in a single object
 */
export const selectCheckoutData = (state: RootState) => ({
    items: selectActiveItems(state),
    orderType: state.cart.orderType,
    customer: state.cart.customer,
    table: state.cart.table,
    delivery: state.cart.delivery,
    discount: state.cart.discount,
    notes: state.cart.notes,
    subtotal: selectSubtotal(state),
    discountAmount: selectDiscountAmount(state),
    taxRate: selectTaxRate(state),
    taxAmount: selectTaxAmount(state),
    deliveryFee: selectDeliveryFee(state),
    total: selectTotal(state),
    itemCount: selectItemCount(state),
    totalQuantity: selectTotalQuantity(state),
    canCheckout: selectCanCheckout(state),
    blockers: selectCheckoutBlockers(state),
});

/**
 * Kitchen status summary
 * Returns aggregated kitchen status data
 */
export const selectKitchenSummary = (state: RootState) => {
    const kitchenItems = selectKitchenItems(state);
    const pending = kitchenItems.filter((i) => i.kitchenStatus === 'PENDING').length;
    const fired = kitchenItems.filter((i) => i.kitchenStatus === 'FIRED').length;
    const preparing = kitchenItems.filter((i) => i.kitchenStatus === 'PREPARING').length;
    const ready = kitchenItems.filter((i) => i.kitchenStatus === 'READY').length;
    const served = kitchenItems.filter((i) => i.kitchenStatus === 'SERVED').length;

    return {
        totalKitchenItems: kitchenItems.length,
        pending,
        fired,
        preparing,
        ready,
        served,
        allReady: selectAllItemsReady(state),
        hasPendingItems: pending > 0 || fired > 0 || preparing > 0,
    };
};

// =============================================================================
// REDUCER
// =============================================================================

export default cartSlice.reducer;
