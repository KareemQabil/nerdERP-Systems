import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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

// ============= Types =============

export interface ProductInfo {
    id: string;
    sku: string;
    name: string;
    nameAr: string | null;
    salePrice: string;
    imageUrl?: string;
    // Kitchen & Inventory
    requiresKitchen: boolean;
    kitchenStation: KitchenStation | null;
    trackInventory: boolean;
    stockQuantity?: string;
    // Modifiers
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
    id: string;                      // Unique cart item ID
    productId: string;
    product: ProductInfo;
    quantity: string;                // Decimal as string

    // Pricing breakdown
    basePrice: string;               // Product sale price
    modifiersTotal: string;          // Sum of modifier adjustments
    unitPrice: string;               // basePrice + modifiersTotal
    lineTotal: string;               // unitPrice × quantity

    // Modifiers & Instructions
    modifiers: CartItemModifier[];
    specialInstructions: string | null;

    // Kitchen tracking
    kitchenStatus: KitchenStatus;
    addedAt: string;
    firedAt: string | null;
    readyAt: string | null;

    // Item-level discount
    itemDiscount: ItemDiscount | null;

    // Void tracking
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

// ============= Store State =============

interface CartState {
    // State
    items: CartItem[];
    orderType: OrderType;
    customer: CustomerInfo | null;
    table: TableInfo | null;
    delivery: DeliveryInfo | null;
    discount: AppliedDiscount | null;
    notes: string | null;

    // Item Actions
    addItem: (
        product: ProductInfo,
        quantity?: number,
        modifiers?: CartItemModifier[],
        instructions?: string
    ) => void;
    removeItem: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    updateModifiers: (cartItemId: string, modifiers: CartItemModifier[]) => void;
    updateInstructions: (cartItemId: string, instructions: string) => void;
    setItemDiscount: (cartItemId: string, discount: ItemDiscount) => void;
    removeItemDiscount: (cartItemId: string) => void;
    clearCart: () => void;

    // Void Actions
    voidItem: (cartItemId: string, reason: VoidReason, authorizedBy?: string) => void;

    // Order Context Actions
    setOrderType: (type: OrderType) => void;
    setCustomer: (customer: CustomerInfo | null) => void;
    setTable: (table: TableInfo | null) => void;
    setDelivery: (delivery: DeliveryInfo | null) => void;
    setDiscount: (discount: AppliedDiscount | null) => void;
    setNotes: (notes: string | null) => void;

    // Kitchen Actions
    fireToKitchen: (cartItemIds?: string[]) => void;
    updateKitchenStatus: (cartItemId: string, status: KitchenStatus) => void;

    // Computed (as functions)
    getSubtotal: () => string;
    getItemDiscountsTotal: () => string;
    getTaxRate: () => string;
    getTaxAmount: () => string;
    getDiscountAmount: () => string;
    getDeliveryFee: () => string;
    getTotal: () => string;
    getItemCount: () => number;
    getTotalQuantity: () => number;

    // Kitchen Status Helpers
    getActiveItems: () => CartItem[];
    getKitchenItems: () => CartItem[];
    getNonKitchenItems: () => CartItem[];
    getPendingKitchenItems: () => CartItem[];
    getReadyItems: () => CartItem[];
    getAllItemsReady: () => boolean;

    // Checkout Helpers
    canCheckout: () => boolean;
    canPartialCheckout: () => boolean;
    getCheckoutBlockers: () => string[];
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
                delivery: null,
                discount: null,
                notes: null,

                addItem: (product, quantity = 1, modifiers = [], instructions) => {
                    const basePrice = product.salePrice;

                    // Calculate modifiers total
                    const modifiersTotal = modifiers.reduce(
                        (sum, m) => DecimalUtil.add(sum, m.priceAdjustment),
                        new Decimal(0)
                    ).toFixed(3);

                    const unitPrice = DecimalUtil.add(basePrice, modifiersTotal).toFixed(3);
                    const lineTotal = DecimalUtil.multiply(unitPrice, quantity).toFixed(3);

                    // Check if identical item exists (same product + same modifiers + same instructions)
                    const modifiersKey = JSON.stringify(
                        modifiers.map(m => m.modifierId).sort()
                    );
                    const existingItem = get().items.find(
                        (item) =>
                            item.productId === product.id &&
                            JSON.stringify(item.modifiers.map(m => m.modifierId).sort()) === modifiersKey &&
                            item.specialInstructions === (instructions ?? null) &&
                            !item.isVoided
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
                        const orderType = get().orderType;
                        const shouldFireImmediately = orderType === 'DINE_IN' && product.requiresKitchen;

                        const newItem: CartItem = {
                            id: crypto.randomUUID(),
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
                        set((state) => ({ items: [...state.items, newItem] }));
                    }
                },

                removeItem: (cartItemId) => {
                    set((state) => ({
                        items: state.items.filter((item) => item.id !== cartItemId),
                    }));
                },

                voidItem: (cartItemId, reason, authorizedBy) => {
                    set((state) => ({
                        items: state.items.map((item) =>
                            item.id === cartItemId
                                ? {
                                    ...item,
                                    isVoided: true,
                                    voidedAt: new Date().toISOString(),
                                    voidReason: reason,
                                    voidAuthorizedBy: authorizedBy,
                                }
                                : item
                        ),
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
                            ).toFixed(3);

                            const unitPrice = DecimalUtil.add(item.basePrice, modifiersTotal).toFixed(3);
                            const lineTotal = DecimalUtil.multiply(unitPrice, item.quantity).toFixed(3);

                            return { ...item, modifiers, modifiersTotal, unitPrice, lineTotal };
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

                setItemDiscount: (cartItemId, discount) => {
                    set((state) => ({
                        items: state.items.map((item) =>
                            item.id === cartItemId
                                ? { ...item, itemDiscount: discount }
                                : item
                        ),
                    }));
                },

                removeItemDiscount: (cartItemId) => {
                    set((state) => ({
                        items: state.items.map((item) =>
                            item.id === cartItemId
                                ? { ...item, itemDiscount: null }
                                : item
                        ),
                    }));
                },

                clearCart: () => set({
                    items: [],
                    orderType: 'TAKEAWAY',
                    customer: null,
                    table: null,
                    delivery: null,
                    discount: null,
                    notes: null,
                }),

                setOrderType: (type) => {
                    set({ orderType: type });
                    // Clear table if not dine-in
                    if (type !== 'DINE_IN') {
                        set({ table: null });
                    }
                    // Clear delivery if not delivery
                    if (type !== 'DELIVERY') {
                        set({ delivery: null });
                    }
                },

                setCustomer: (customer) => set({ customer }),

                setTable: (table) => set({
                    table,
                    orderType: table ? 'DINE_IN' : get().orderType,
                }),

                setDelivery: (delivery) => set({
                    delivery,
                    orderType: delivery ? 'DELIVERY' : get().orderType,
                }),

                setDiscount: (discount) => set({ discount }),

                setNotes: (notes) => set({ notes }),

                // Kitchen Actions
                fireToKitchen: (cartItemIds) => {
                    const now = new Date().toISOString();
                    set((state) => ({
                        items: state.items.map((item) => {
                            // If specific IDs provided, only fire those
                            if (cartItemIds && !cartItemIds.includes(item.id)) {
                                return item;
                            }
                            // Only fire kitchen items that are pending
                            if (!item.product.requiresKitchen || item.kitchenStatus !== 'PENDING') {
                                return item;
                            }
                            return {
                                ...item,
                                kitchenStatus: 'FIRED' as KitchenStatus,
                                firedAt: now,
                            };
                        }),
                    }));
                },

                updateKitchenStatus: (cartItemId, status) => {
                    const now = new Date().toISOString();
                    set((state) => ({
                        items: state.items.map((item) =>
                            item.id === cartItemId
                                ? {
                                    ...item,
                                    kitchenStatus: status,
                                    readyAt: status === 'READY' ? now : item.readyAt,
                                }
                                : item
                        ),
                    }));
                },

                // Computed
                getActiveItems: () => get().items.filter(i => !i.isVoided),

                getKitchenItems: () => get().getActiveItems().filter(i => i.product.requiresKitchen),

                getNonKitchenItems: () => get().getActiveItems().filter(i => !i.product.requiresKitchen),

                getPendingKitchenItems: () => get().getKitchenItems().filter(
                    i => i.kitchenStatus === 'PENDING' || i.kitchenStatus === 'FIRED' || i.kitchenStatus === 'PREPARING'
                ),

                getReadyItems: () => get().getActiveItems().filter(
                    i => !i.product.requiresKitchen || i.kitchenStatus === 'READY' || i.kitchenStatus === 'SERVED'
                ),

                getAllItemsReady: () => {
                    const kitchenItems = get().getKitchenItems();
                    return kitchenItems.every(i => i.kitchenStatus === 'READY' || i.kitchenStatus === 'SERVED');
                },

                getSubtotal: () => {
                    return DecimalUtil.sum(
                        get().getActiveItems().map((i) => i.lineTotal)
                    ).toFixed(3);
                },

                getItemDiscountsTotal: () => {
                    const activeItems = get().getActiveItems();
                    const total = activeItems.reduce((sum, item) => {
                        if (item.itemDiscount) {
                            return DecimalUtil.add(sum, item.itemDiscount.calculatedAmount);
                        }
                        return sum;
                    }, new Decimal(0));
                    return total.toFixed(3);
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

                getDeliveryFee: () => {
                    const delivery = get().delivery;
                    return delivery?.deliveryFee ?? '0.000';
                },

                getTotal: () => {
                    const subtotal = get().getSubtotal();
                    const tax = get().getTaxAmount();
                    const discountAmount = get().getDiscountAmount();
                    const deliveryFee = get().getDeliveryFee();

                    return DecimalUtil.add(
                        DecimalUtil.subtract(
                            DecimalUtil.add(subtotal, tax),
                            discountAmount
                        ),
                        deliveryFee
                    ).toFixed(3);
                },

                getItemCount: () => get().getActiveItems().length,

                getTotalQuantity: () => {
                    return get().getActiveItems().reduce(
                        (sum, item) => sum + parseFloat(item.quantity),
                        0
                    );
                },

                // Checkout Helpers
                canCheckout: () => {
                    const state = get();
                    const blockers = state.getCheckoutBlockers();
                    return blockers.length === 0;
                },

                canPartialCheckout: () => {
                    const state = get();
                    const readyItems = state.getReadyItems();
                    return state.orderType === 'DINE_IN' && readyItems.length > 0;
                },

                getCheckoutBlockers: () => {
                    const state = get();
                    const blockers: string[] = [];

                    // No items
                    if (state.getActiveItems().length === 0) {
                        blockers.push('Cart is empty');
                        return blockers;
                    }

                    // Dine-in requires table
                    if (state.orderType === 'DINE_IN' && !state.table) {
                        blockers.push('Table selection required for dine-in');
                    }

                    // Delivery requires address
                    if (state.orderType === 'DELIVERY' && !state.delivery) {
                        blockers.push('Delivery address required');
                    }

                    // Dine-in: all kitchen items must be ready
                    if (state.orderType === 'DINE_IN') {
                        const pendingItems = state.getPendingKitchenItems();
                        if (pendingItems.length > 0) {
                            pendingItems.forEach(item => {
                                blockers.push(`${item.product.name} is ${item.kitchenStatus.toLowerCase()}`);
                            });
                        }
                    }

                    return blockers;
                },
            }),
            { name: 'nerdpos-cart' }
        ),
        { name: 'CartStore' }
    )
);
