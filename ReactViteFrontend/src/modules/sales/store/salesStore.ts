import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Order, PaymentMethod } from '../types/pos.types';
import type { CartItem } from '@/modules/sales/store/cartStore';
import type { Product } from '@/modules/products/types/product.types';

/**
 * Invoice Number Generator
 * Format: INV-XXXX (e.g., INV-1001, INV-1002)
 */
function generateInvoiceNumber(lastNumber: number): string {
    const nextNumber = lastNumber + 1;
    return `INV-${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Sales Store Interface
 */
interface SalesStore {
    // State
    orders: Order[];
    lastInvoiceNumber: number;

    // Actions
    addSale: (
        items: CartItem[],
        subtotal: string,
        tax: string,
        discount: string,
        total: string,
        paymentMethod: PaymentMethod,
        cashTendered?: string
    ) => Order;
    getOrderById: (id: string) => Order | undefined;
    getAllOrders: () => Order[];
    getOrdersByDate: (date: Date) => Order[];
}

/**
 * Sales Store (Zustand)
 * Manages completed transactions and invoice history
 * 
 * Features:
 * - Sequential invoice numbering
 * - localStorage persistence
 * - Order history
 * - Type-safe order creation
 */
export const useSalesStore = create<SalesStore>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial State
                orders: [],
                lastInvoiceNumber: 1000, // Start from 1001

                // Add Sale (Main Transaction Logic)
                addSale: (items, subtotal, tax, discount, total, paymentMethod, cashTendered) => {
                    const state = get();

                    // Generate invoice number
                    const invoiceNumber = generateInvoiceNumber(state.lastInvoiceNumber);

                    // Create order object
                    const order: Order = {
                        id: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        invoiceNumber,
                        createdAt: new Date().toISOString(),
                        items: items.map(item => ({
                            id: item.id,
                            product: item.product,
                            quantity: parseFloat(item.quantity),
                            modifiers: item.selectedModifiers?.map(mod => ({
                                id: mod.modifierId,
                                name: mod.modifierName,
                                price: parseFloat(mod.price),
                            })) || [],
                            unitPrice: parseFloat(item.unitPrice),
                            modifiersTotal: parseFloat(item.modifiersTotal),
                            lineTotal: parseFloat(item.lineTotal),
                            notes: item.specialInstructions,
                        })),
                        subtotal: parseFloat(subtotal),
                        tax: parseFloat(tax),
                        discount: parseFloat(discount),
                        total: parseFloat(total),
                        paymentMethod,
                        status: 'completed',
                    };

                    // Update state
                    set({
                        orders: [...state.orders, order],
                        lastInvoiceNumber: state.lastInvoiceNumber + 1,
                    });

                    console.log('✅ [SalesStore] Sale completed:', invoiceNumber);
                    return order;
                },

                // Get order by ID
                getOrderById: (id) => {
                    const state = get();
                    return state.orders.find(order => order.id === id);
                },

                // Get all orders
                getAllOrders: () => {
                    return get().orders;
                },

                // Get orders by date
                getOrdersByDate: (date) => {
                    const state = get();
                    const targetDate = date.toISOString().split('T')[0];

                    return state.orders.filter(order => {
                        const orderDate = order.createdAt.split('T')[0];
                        return orderDate === targetDate;
                    });
                },
            }),
            {
                name: 'sales-store', // localStorage key
                partialize: (state) => ({
                    orders: state.orders,
                    lastInvoiceNumber: state.lastInvoiceNumber,
                }),
            }
        ),
        { name: 'sales-store' }
    )
);
