import { create } from 'zustand';
import type { Product } from '@/modules/products/hooks/useProducts';
import Decimal from 'decimal.js';

interface CartItem extends Product {
    quantity: number;
    selectedModifiers?: any[];
}

interface CartStore {
    items: CartItem[];
    isCartOpen: boolean;
    addItem: (product: Product, quantity?: number, modifiers?: any[]) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
    toggleCart: () => void;
    total: string;
}

export const useCartStore = create<CartStore>((set, get) => ({
    items: [],
    isCartOpen: false,
    addItem: (product, quantity = 1, modifiers = []) => set((state) => {
        const existingItem = state.items.find((item) => item.id === product.id);

        // Simple logic: if item exists (and no modifiers/same modifiers logic which we skip for now), increment
        if (existingItem && modifiers.length === 0) {
            return {
                items: state.items.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                ),
            };
        }

        return {
            items: [...state.items, { ...product, quantity, selectedModifiers: modifiers }],
        };
    }),
    removeItem: (productId) => set((state) => ({
        items: state.items.filter((item) => item.id !== productId),
    })),
    clearCart: () => set({ items: [] }),
    toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
    get total() {
        const items = get().items;
        const sum = items.reduce((acc, item) => {
            const price = new Decimal(item.salePrice);
            const qty = new Decimal(item.quantity);
            return acc.plus(price.times(qty));
        }, new Decimal(0));
        return sum.toFixed(2);
    },
}));
