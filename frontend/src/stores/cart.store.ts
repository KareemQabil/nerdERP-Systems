import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import Decimal from 'decimal.js';
import { DecimalUtil } from '@/lib/decimal';

// ============= Types =============


export interface ProductInfo {
    id: string;
    sku: string;
    name: string;
    nameAr: string | null;
    salePrice: string;
    imageUrl?: string;
}

export interface CartItemModifier {
    modifierId: string;
    modifierName: string;
    optionId: string;
    optionName: string;
    priceAdjustment: string;
}

export interface CartItem {
    id: string;                    // Unique cart item ID
    productId: string;
    product: ProductInfo;
    quantity: string;              // Decimal as string
    unitPrice: string;             // Base price + modifiers
    lineTotal: string;             // unitPrice × quantity
    modifiers: CartItemModifier[];
    specialInstructions: string | null;
}

export type OrderType = 'TAKEAWAY' | 'DINE_IN' | 'DELIVERY';

export interface AppliedDiscount {
    type: 'percentage' | 'fixed';
    value: string;
    reason: string;
    code?: string;
}

export interface CustomerInfo {
    id: string;
    name: string;
    phone?: string;
}

export interface TableInfo {
    id: string;
    number: string;
    zoneName?: string;
}

// ============= Store State =============

interface CartState {
    // State
    items: CartItem[];
    orderType: OrderType;
    customer: CustomerInfo | null;
    table: TableInfo | null;
    discount: AppliedDiscount | null;
    notes: string | null;

    // Actions
    addItem: (product: ProductInfo, quantity?: number, modifiers?: CartItemModifier[], instructions?: string) => void;
    removeItem: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    updateModifiers: (cartItemId: string, modifiers: CartItemModifier[]) => void;
    updateInstructions: (cartItemId: string, instructions: string) => void;
    clearCart: () => void;

    setOrderType: (type: OrderType) => void;
    setCustomer: (customer: CustomerInfo | null) => void;
    setTable: (table: TableInfo | null) => void;
    setDiscount: (discount: AppliedDiscount | null) => void;
    setNotes: (notes: string | null) => void;

    // Computed (as functions)
    getSubtotal: () => string;
    getTaxRate: () => string;
    getTaxAmount: () => string;
    getDiscountAmount: () => string;
    getTotal: () => string;
    getItemCount: () => number;
    getTotalQuantity: () => number;
}

const TAX_RATE = '15'; // 15% VAT

export const useCartStore = create<CartState>()(
    devtools(
        persist(
            (set, get) => ({
                items: [],
                orderType: 'TAKEAWAY',
                customer: null,
                table: null,
                discount: null,
                notes: null,

                addItem: (product, quantity = 1, modifiers = [], instructions) => {
                    // Calculate unit price including modifiers
                    const modifiersTotal = modifiers.reduce(
                        (sum, m) => DecimalUtil.add(sum, m.priceAdjustment),
                        new Decimal(0)
                    );
                    const unitPrice = DecimalUtil.add(product.salePrice, modifiersTotal).toFixed(3);
                    const lineTotal = DecimalUtil.multiply(unitPrice, quantity).toFixed(3);

                    // Check if identical item exists (same product + same modifiers)
                    const existingItem = get().items.find(
                        (item) =>
                            item.productId === product.id &&
                            JSON.stringify(item.modifiers) === JSON.stringify(modifiers) &&
                            item.specialInstructions === instructions
                    );

                    if (existingItem) {
                        // Increment quantity
                        const newQty = DecimalUtil.add(existingItem.quantity, quantity);
                        set((state) => ({
                            items: state.items.map((item) =>
                                item.id === existingItem.id
                                    ? {
                                        ...item,
                                        quantity: newQty.toFixed(3),
                                        lineTotal: DecimalUtil.multiply(item.unitPrice, newQty).toFixed(3),
                                    }
                                    : item
                            ),
                        }));
                    } else {
                        // Add new item
                        const newItem: CartItem = {
                            id: crypto.randomUUID(),
                            productId: product.id,
                            product,
                            quantity: quantity.toString(),
                            unitPrice,
                            lineTotal,
                            modifiers,
                            specialInstructions: instructions ?? null,
                        };
                        set((state) => ({ items: [...state.items, newItem] }));
                    }
                },

                removeItem: (cartItemId) => {
                    set((state) => ({
                        items: state.items.filter((item) => item.id !== cartItemId),
                    }));
                },

                updateQuantity: (cartItemId, quantity) => {
                    if (quantity < 1) {
                        get().removeItem(cartItemId);
                        return;
                    }
                    set((state) => ({
                        items: state.items.map((item) =>
                            item.id === cartItemId
                                ? {
                                    ...item,
                                    quantity: quantity.toString(),
                                    lineTotal: DecimalUtil.multiply(item.unitPrice, quantity).toFixed(3),
                                }
                                : item
                        ),
                    }));
                },

                updateModifiers: (cartItemId, modifiers) => {
                    set((state) => ({
                        items: state.items.map((item) => {
                            if (item.id !== cartItemId) return item;

                            const modifiersTotal = modifiers.reduce(
                                (sum, m) => DecimalUtil.add(sum, m.priceAdjustment),
                                new Decimal(0)
                            );
                            const unitPrice = DecimalUtil.add(item.product.salePrice, modifiersTotal).toFixed(3);
                            const lineTotal = DecimalUtil.multiply(unitPrice, item.quantity).toFixed(3);

                            return { ...item, modifiers, unitPrice, lineTotal };
                        }),
                    }));
                },

                updateInstructions: (cartItemId, instructions) => {
                    set((state) => ({
                        items: state.items.map((item) =>
                            item.id === cartItemId
                                ? { ...item, specialInstructions: instructions }
                                : item
                        ),
                    }));
                },

                clearCart: () => set({
                    items: [],
                    orderType: 'TAKEAWAY',
                    customer: null,
                    table: null,
                    discount: null,
                    notes: null,
                }),

                setOrderType: (type) => set({ orderType: type }),

                setCustomer: (customer) => set({ customer }),

                setTable: (table) => set({
                    table,
                    orderType: table ? 'DINE_IN' : 'TAKEAWAY',
                }),

                setDiscount: (discount) => set({ discount }),

                setNotes: (notes) => set({ notes }),

                // Computed
                getSubtotal: () => {
                    return DecimalUtil.sum(get().items.map((i) => i.lineTotal)).toFixed(3);
                },

                getTaxRate: () => TAX_RATE,

                getTaxAmount: () => {
                    const subtotal = get().getSubtotal();
                    const discountAmount = get().getDiscountAmount();
                    const taxableAmount = DecimalUtil.subtract(subtotal, discountAmount);
                    return DecimalUtil.calculatePercentage(taxableAmount, TAX_RATE).toFixed(3);
                },

                getDiscountAmount: () => {
                    const discount = get().discount;
                    if (!discount) return '0.000';

                    const subtotal = get().getSubtotal();
                    if (discount.type === 'percentage') {
                        return DecimalUtil.calculatePercentage(subtotal, discount.value).toFixed(3);
                    }
                    return discount.value;
                },

                getTotal: () => {
                    const subtotal = get().getSubtotal();
                    const tax = get().getTaxAmount();
                    const discountAmount = get().getDiscountAmount();
                    return DecimalUtil.subtract(
                        DecimalUtil.add(subtotal, tax),
                        discountAmount
                    ).toFixed(3);
                },

                getItemCount: () => get().items.length,

                getTotalQuantity: () => {
                    return get().items.reduce(
                        (sum, item) => sum + parseFloat(item.quantity),
                        0
                    );
                },
            }),
            { name: 'nerdpos-cart' }
        ),
        { name: 'CartStore' }
    )
);
