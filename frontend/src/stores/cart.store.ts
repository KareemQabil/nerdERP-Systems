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
    CalculationPipelineConfig,
    CalculationBreakdown,
    CalculationBreakdownStage,
} from '@/types/pos.types';
import { DELIVERY_ZONES, PLATFORM_DELIVERY_CHARGE, PLATFORM_ORDER_TYPES } from '@/constants/pos';
import { storeConfigService, type POSConfig } from '@/services/store-config.service';

// Default service charge rate (fallback if config not loaded)
const DEFAULT_SERVICE_CHARGE_RATE = 0.12;

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
    zoneId: string; // Zone ID (A, B, C, D, E, F, G)
    zone: string; // Zone name for display
    zoneCode?: string;
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
    stockReservationId: string | null;  // Track active stock reservation
    posConfig: POSConfig | null;  // Dynamic POS configuration from backend
    storeId: string | null;  // Current store ID for config fetching

    // Pipeline Configuration (new)
    pipelineConfig: CalculationPipelineConfig | null;
    usePipelineCalculation: boolean;  // Toggle between pipeline and legacy calculation
    calculationBreakdown: CalculationBreakdown | null;  // Audit trail of calculations

    // Configuration Actions
    loadPOSConfig: (storeId: string) => Promise<void>;

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
    setDeliveryByZone: (zoneId: string, addressDetails: Omit<DeliveryInfo, 'zoneId' | 'zone' | 'deliveryFee'>) => void;
    setDiscount: (discount: AppliedDiscount | null) => void;
    setNotes: (notes: string | null) => void;
    setStockReservationId: (reservationId: string | null) => void;  // Set stock reservation ID

    // Delivery Helpers
    getDeliveryZones: () => typeof DELIVERY_ZONES;

    // Pipeline Configuration Actions (new)
    setPipelineConfig: (config: CalculationPipelineConfig | null) => void;
    setUsePipelineCalculation: (use: boolean) => void;
    executePipelineCalculation: () => CalculationBreakdown;
    getCalculationBreakdown: () => CalculationBreakdown | null;

    // Kitchen Actions
    fireToKitchen: (cartItemIds?: string[]) => void;
    updateKitchenStatus: (cartItemId: string, status: KitchenStatus) => void;

    // Computed (as functions)
    getSubtotal: () => string;
    getItemDiscountsTotal: () => string;
    getServiceCharge: () => string;
    getSubtotalBeforeTax: () => string;
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

// Default VAT rate (15% for ZATCA Phase 2 Saudi Arabia) - Used as fallback if posConfig not loaded
const DEFAULT_VAT_RATE = 0.15;

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
                stockReservationId: null,  // Track active stock reservation
                posConfig: null,  // Will be loaded on mount
                storeId: null,  // Set when config is loaded

                // Pipeline Configuration (new)
                pipelineConfig: null,
                usePipelineCalculation: false,  // Default to legacy calculation for now
                calculationBreakdown: null,

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
                    stockReservationId: null,  // Clear reservation
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

                setDeliveryByZone: (zoneId, addressDetails) => {
                    // Find the zone and calculate delivery fee
                    const zone = DELIVERY_ZONES.find(z => z.id === zoneId);
                    if (!zone) {
                        console.error(`Invalid zone ID: ${zoneId}`);
                        return;
                    }

                    const delivery: DeliveryInfo = {
                        ...addressDetails,
                        zoneId: zone.id,
                        zone: zone.name,
                        deliveryFee: zone.baseCharge.toFixed(3),
                    };

                    set({
                        delivery,
                        orderType: 'DELIVERY',
                    });
                },

                setDiscount: (discount) => set({ discount }),

                setNotes: (notes) => set({ notes }),

                setStockReservationId: (reservationId) => set({ stockReservationId: reservationId }),

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

                // =========================================================================
                // CONFIGURATION ACTIONS
                // =========================================================================

                /**
                 * Load POS configuration from backend (service charge rate, VAT rate, etc.)
                 * Call this on app initialization or when store changes
                 */
                loadPOSConfig: async (storeId: string) => {
                    try {
                        const config = await storeConfigService.getPOSConfig(storeId);
                        set({ posConfig: config, storeId });
                    } catch (error) {
                        console.error('Failed to load POS config, using defaults:', error);
                        // Keep existing config or null (will use fallback defaults)
                    }
                },

                // =========================================================================
                // CALCULATION GETTERS
                // =========================================================================

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

                /**
                 * Service Charge (configurable rate for DINE_IN orders only)
                 * Applies to items subtotal before tax
                 * Rate is fetched from store configuration (default 12%)
                 */
                getServiceCharge: () => {
                    const orderType = get().orderType;
                    const table = get().table;
                    const subtotal = get().getSubtotal();
                    const posConfig = get().posConfig;

                    // Only apply service charge for DINE_IN orders with a table selected
                    if (orderType === 'DINE_IN' && table) {
                        // Use dynamic rate from config, or fall back to default
                        const rate = new Decimal(posConfig?.serviceChargeRate ?? DEFAULT_SERVICE_CHARGE_RATE);
                        return new Decimal(subtotal).mul(rate).toFixed(3);
                    }

                    return '0.000';
                },

                /**
                 * Subtotal Before Tax
                 * Items Subtotal + Service Charge (if applicable)
                 * This is the amount on which VAT is calculated
                 */
                getSubtotalBeforeTax: () => {
                    const subtotal = get().getSubtotal();
                    const serviceCharge = get().getServiceCharge();
                    return DecimalUtil.add(subtotal, serviceCharge).toFixed(3);
                },

                // VAT rate from store configuration (dynamic, editable via Settings UI)
                getTaxRate: () => {
                    const posConfig = get().posConfig;
                    const rate = posConfig?.vatRate ?? DEFAULT_VAT_RATE;
                    // Return as percentage string for display (e.g., "15" for 15%)
                    return (rate * 100).toString();
                },

                /**
                 * VAT Amount
                 * Calculated on (Subtotal + Service Charge - Discount)
                 * TODO: Make tax rate configurable per store/organization (MENA region support)
                 */
                getTaxAmount: () => {
                    const subtotalBeforeTax = get().getSubtotalBeforeTax();
                    const discountAmount = get().getDiscountAmount();
                    const taxableAmount = DecimalUtil.subtract(subtotalBeforeTax, discountAmount);
                    // Use dynamic VAT rate from store config
                    const taxRate = get().getTaxRate();
                    return DecimalUtil.calculatePercentage(taxableAmount, taxRate).toFixed(3);
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

                /**
                 * Delivery Fee Calculation
                 * - DELIVERY orders: Zone-based pricing (A=50, B=70, C=90, etc.)
                 * - Platform orders (TALABAT, MARSOOL, INSTASHOP): Fixed 50 EGP
                 * - Other orders: 0
                 */
                getDeliveryFee: () => {
                    const delivery = get().delivery;
                    const orderType = get().orderType;

                    // If delivery info is set, use the stored fee
                    if (delivery) {
                        return delivery.deliveryFee;
                    }

                    // Platform orders have fixed delivery charge
                    if (PLATFORM_ORDER_TYPES.includes(orderType as any)) {
                        return PLATFORM_DELIVERY_CHARGE.toFixed(3);
                    }

                    return '0.000';
                },

                /**
                 * Get available delivery zones for the UI
                 */
                getDeliveryZones: () => DELIVERY_ZONES,

                // =====================================================================
                // PIPELINE CALCULATION METHODS (New)
                // =====================================================================

                /**
                 * Set the calculation pipeline configuration
                 * This should be loaded from store settings
                 */
                setPipelineConfig: (config) => {
                    set({ pipelineConfig: config });
                    // Re-run calculation with new pipeline
                    if (config && get().usePipelineCalculation) {
                        get().executePipelineCalculation();
                    }
                },

                /**
                 * Toggle between pipeline and legacy calculation
                 */
                setUsePipelineCalculation: (use) => {
                    set({ usePipelineCalculation: use });
                    if (use) {
                        get().executePipelineCalculation();
                    } else {
                        set({ calculationBreakdown: null });
                    }
                },

                /**
                 * Execute the calculation pipeline and return breakdown
                 * This matches the backend CalculationPipelineService logic
                 */
                executePipelineCalculation: () => {
                    const state = get();
                    const config = state.pipelineConfig;

                    if (!config) {
                        // Fallback to legacy calculation
                        return state.getCalculationBreakdown() ?? state.executePipelineCalculation();
                    }

                    const orderType = state.orderType;
                    const pipeline = config.orderTypePipelines?.[orderType];

                    if (!pipeline) {
                        console.warn(`No pipeline configured for order type: ${orderType}`);
                        return state.getCalculationBreakdown() ?? state.executePipelineCalculation();
                    }
                    const stages: CalculationBreakdownStage[] = [];

                    const context = {
                        subtotal: '0',
                        serviceCharge: '0',
                        deliveryFee: '0',
                        subtotalBeforeTax: '0',
                        tax: '0',
                        discount: '0',
                        total: '0',
                    };

                    // Stage 1: ITEM_SUBTOTAL
                    const itemSubtotal = state.getSubtotal();
                    stages.push({
                        stageId: 'ITEM_SUBTOTAL',
                        stageName: 'Item Subtotal',
                        description: 'Sum of all item prices',
                        inputs: { items: state.items.map(i => ({ id: i.id, name: i.product.name, price: i.lineTotal })) },
                        outputs: { subtotal: itemSubtotal },
                        formula: 'SUM(lineTotal)',
                    });
                    context.subtotal = itemSubtotal;

                    // Stage 2: SERVICE_CHARGE (if applicable)
                    if (pipeline.pipeline.some(s => s.type === 'SERVICE_CHARGE')) {
                        const serviceCharge = state.getServiceCharge();
                        const rate = state.posConfig?.serviceChargeRate ?? DEFAULT_SERVICE_CHARGE_RATE;
                        stages.push({
                            stageId: 'SERVICE_CHARGE',
                            stageName: 'Service Charge',
                            description: `${(rate * 100).toFixed(0)}% service charge for dine-in orders`,
                            inputs: { rate: rate.toFixed(2), basis: context.subtotal },
                            outputs: { serviceCharge },
                            formula: `${context.subtotal} × ${rate.toFixed(2)}`,
                        });
                        context.serviceCharge = serviceCharge;
                    }

                    // Stage 3: DELIVERY_FEE (if applicable)
                    if (pipeline.pipeline.some(s => s.type === 'DELIVERY_FEE')) {
                        const deliveryFee = state.getDeliveryFee();
                        stages.push({
                            stageId: 'DELIVERY_FEE',
                            stageName: 'Delivery Fee',
                            description: 'Zone-based delivery fee',
                            inputs: { zone: state.delivery?.zone || 'N/A', baseFee: deliveryFee },
                            outputs: { deliveryFee },
                            formula: `ZONE_FEE(${state.delivery?.zoneCode || 'N/A'})`,
                        });
                        context.deliveryFee = deliveryFee;
                    }

                    // Stage 4: SUBTOTAL_BEFORE_TAX
                    const subtotalBeforeTax = state.getSubtotalBeforeTax();
                    stages.push({
                        stageId: 'SUBTOTAL_BEFORE_TAX',
                        stageName: 'Subtotal Before Tax',
                        description: 'Subtotal + Service Charge',
                        inputs: { subtotal: context.subtotal, serviceCharge: context.serviceCharge },
                        outputs: { subtotalBeforeTax },
                        formula: `${context.subtotal} + ${context.serviceCharge}`,
                    });
                    context.subtotalBeforeTax = subtotalBeforeTax;

                    // Stage 5: DISCOUNT (if applicable)
                    if (state.discount && pipeline.pipeline.some(s => s.type === 'DISCOUNT')) {
                        const discountAmount = state.getDiscountAmount();
                        stages.push({
                            stageId: 'DISCOUNT',
                            stageName: 'Discount',
                            description: `${state.discount.type} discount`,
                            inputs: { type: state.discount.type, value: state.discount.value, basis: context.subtotal },
                            outputs: { discount: discountAmount },
                            formula: state.discount.type === 'percentage'
                                ? `${context.subtotal} × ${state.discount.value}%`
                                : `-${state.discount.value}`,
                        });
                        context.discount = discountAmount;
                    }

                    // Stage 6: TAX
                    const taxRate = state.getTaxRate();
                    const taxAmount = state.getTaxAmount();
                    stages.push({
                        stageId: 'TAX',
                        stageName: 'VAT (14%)',
                        description: 'Value Added Tax',
                        inputs: { rate: taxRate, taxableAmount: context.subtotalBeforeTax, discount: context.discount },
                        outputs: { tax: taxAmount },
                        formula: `(${context.subtotalBeforeTax} - ${context.discount}) × ${taxRate}%`,
                    });
                    context.tax = taxAmount;

                    // Stage 7: TOTAL
                    const total = state.getTotal();
                    stages.push({
                        stageId: 'TOTAL',
                        stageName: 'Grand Total',
                        description: 'Final amount including all charges',
                        inputs: { subtotalBeforeTax: context.subtotalBeforeTax, tax: context.tax, discount: context.discount, deliveryFee: context.deliveryFee },
                        outputs: { total },
                        formula: `${context.subtotalBeforeTax} + ${context.tax} - ${context.discount} + ${context.deliveryFee}`,
                    });
                    context.total = total;

                    const breakdown: CalculationBreakdown = {
                        pipelineId: config.pipelineId,
                        pipelineVersion: config.version,
                        orderType,
                        executedAt: new Date().toISOString(),
                        stages,
                        summary: {
                            subtotal: context.subtotal,
                            serviceCharge: context.serviceCharge,
                            deliveryFee: context.deliveryFee,
                            subtotalBeforeTax: context.subtotalBeforeTax,
                            tax: context.tax,
                            discount: context.discount,
                            total: context.total,
                        },
                    };

                    set({ calculationBreakdown: breakdown });
                    return breakdown;
                },

                /**
                 * Get calculation breakdown or execute if not exists
                 */
                getCalculationBreakdown: () => {
                    const state = get();
                    if (state.calculationBreakdown) {
                        return state.calculationBreakdown;
                    }
                    if (state.usePipelineCalculation) {
                        return state.executePipelineCalculation();
                    }
                    return state.getCalculationBreakdown() ?? state.executePipelineCalculation();
                },

                /**
                 * Get legacy calculation breakdown (for backward compatibility)
                 */
                getLegacyCalculationBreakdown: (): CalculationBreakdown => {
                    const state = get();
                    const subtotal = state.getSubtotal();
                    const serviceCharge = state.getServiceCharge();
                    const deliveryFee = state.getDeliveryFee();
                    const subtotalBeforeTax = state.getSubtotalBeforeTax();
                    const tax = state.getTaxAmount();
                    const discount = state.getDiscountAmount();
                    const total = state.getTotal();

                    return {
                        pipelineId: 'legacy',
                        pipelineVersion: '1.0.0',
                        orderType: state.orderType,
                        executedAt: new Date().toISOString(),
                        stages: [
                            {
                                stageId: 'ITEM_SUBTOTAL',
                                stageName: 'Item Subtotal',
                                description: 'Sum of all item prices',
                                inputs: {},
                                outputs: { subtotal },
                                formula: 'SUM(items)',
                            },
                            {
                                stageId: 'SERVICE_CHARGE',
                                stageName: 'Service Charge',
                                description: state.orderType === 'DINE_IN'
                                    ? `${((state.posConfig?.serviceChargeRate ?? DEFAULT_SERVICE_CHARGE_RATE) * 100).toFixed(0)}% service charge`
                                    : 'Not applicable',
                                inputs: { rate: (state.posConfig?.serviceChargeRate ?? DEFAULT_SERVICE_CHARGE_RATE).toString() },
                                outputs: { serviceCharge },
                                formula: serviceCharge !== '0.000'
                                    ? `${subtotal} × ${(state.posConfig?.serviceChargeRate ?? DEFAULT_SERVICE_CHARGE_RATE).toFixed(2)}`
                                    : 'N/A',
                            },
                            {
                                stageId: 'DELIVERY_FEE',
                                stageName: 'Delivery Fee',
                                description: state.delivery ? `Zone ${state.delivery.zone}` : 'Not applicable',
                                inputs: { zone: state.delivery?.zoneCode || 'N/A' },
                                outputs: { deliveryFee },
                                formula: state.delivery ? `ZONE_FEE(${state.delivery.zoneCode})` : '0',
                            },
                            {
                                stageId: 'SUBTOTAL_BEFORE_TAX',
                                stageName: 'Subtotal Before Tax',
                                description: 'Amount before tax',
                                inputs: { subtotal, serviceCharge },
                                outputs: { subtotalBeforeTax },
                                formula: `${subtotal} + ${serviceCharge}`,
                            },
                            {
                                stageId: 'TAX',
                                stageName: `VAT (${state.getTaxRate()}%)`,
                                description: 'Value Added Tax',
                                inputs: { rate: state.getTaxRate(), taxableAmount: DecimalUtil.subtract(subtotalBeforeTax, discount).toFixed(3) },
                                outputs: { tax },
                                formula: `(${subtotalBeforeTax} - ${discount}) × ${state.getTaxRate()}%`,
                            },
                            {
                                stageId: 'DISCOUNT',
                                stageName: 'Discount',
                                description: state.discount ? `${state.discount.type} discount` : 'Not applicable',
                                inputs: state.discount ? { type: state.discount.type, value: state.discount.value } : {},
                                outputs: { discount },
                                formula: state.discount
                                    ? state.discount.type === 'percentage'
                                        ? `${subtotal} × ${state.discount.value}%`
                                        : `-${state.discount.value}`
                                    : '0',
                            },
                            {
                                stageId: 'TOTAL',
                                stageName: 'Grand Total',
                                description: 'Final amount',
                                inputs: { subtotalBeforeTax, tax, discount, deliveryFee },
                                outputs: { total },
                                formula: `${subtotalBeforeTax} + ${tax} - ${discount} + ${deliveryFee}`,
                            },
                        ],
                        summary: { subtotal, serviceCharge, deliveryFee, subtotalBeforeTax, tax, discount, total },
                    };
                },

                /**
                 * Total Amount
                 * Calculation:
                 * 1. Items Subtotal
                 * 2. + Service Charge (for DINE_IN only)
                 * 3. + VAT (on subtotal + service charge)
                 * 4. - Discount
                 * 5. + Delivery Fee (for delivery orders)
                 */
                getTotal: () => {
                    const subtotalBeforeTax = get().getSubtotalBeforeTax(); // Subtotal + Service Charge
                    const tax = get().getTaxAmount();
                    const discountAmount = get().getDiscountAmount();
                    const deliveryFee = get().getDeliveryFee();

                    return DecimalUtil.add(
                        DecimalUtil.subtract(
                            DecimalUtil.add(subtotalBeforeTax, tax),
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

/**
 * useCartTotals hook
 * Returns computed cart totals to prevent infinite loops
 * Use this instead of calling getter methods directly in components
 */
export const useCartTotals = () => {
    const store = useCartStore();

    return {
        itemCount: store.getItemCount(),
        subtotal: store.getSubtotal(),
        taxAmount: store.getTaxAmount(),
        total: store.getTotal(),
        discountAmount: store.getDiscountAmount(),
        serviceCharge: store.getServiceCharge(),
        deliveryFee: store.getDeliveryFee(),
        totalQuantity: store.getTotalQuantity(),
    };
};
