// Type definitions for POS system
export type OrderType = 'dineIn' | 'takeaway' | 'delivery';
export type PaymentMethod = 'cash' | 'mada' | 'visa' | 'stcpay' | 'tabby' | 'tamara';
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface Product {
    id: string;
    name: string;
    nameEn: string;
    price: number;
    salePrice?: string;
    category: string;
    imageUrl?: string;
    barcode?: string;
    isAvailable: boolean;
    stock: number;
    isCustomizable?: boolean;
    modifiers?: ProductModifier[];
    trackInventory?: boolean;
    isPrepared?: boolean;
}

export interface Category {
    id: string;
    name: string;
    nameEn?: string;
    count: number;
    icon?: string;
    parentId?: string | null;
}

export interface ProductModifier {
    id: string;
    name: string;
    nameEn?: string;
    price: number;
    groupId?: string;
}

export interface ModifierGroup {
    id: string;
    name: string;
    nameEn?: string;
    options: ProductModifier[];
    minSelection: number;
    maxSelection: number;
    isRequired: boolean;
}

export interface CartItem {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    price: number;
    total: number;
    modifiers?: ProductModifier[];
    specialInstructions?: string;
    notes?: string;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    totalOrders: number;
    totalSpent: number;
    joinedDate: Date;
    loyaltyPoints?: number;
    tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Table {
    id: string;
    name: string;
    number: string;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved';
    currentOrderId?: string;
    section?: string;
}

export interface Discount {
    id: string;
    name: string;
    nameEn?: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    isActive: boolean;
}

export interface Warehouse {
    id: string;
    name: string;
    nameEn?: string;
    code: string;
    isActive: boolean;
}

export interface Payment {
    id: string;
    orderId: string;
    method: PaymentMethod;
    amount: number;
    status: PaymentStatus;
    reference?: string;
    createdAt: Date;
}

export interface SalesOrder {
    id: string;
    orderNumber: string;
    type: OrderType;
    status: OrderStatus;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    customerName?: string;
    customerPhone?: string;
    customerId?: string;
    tableId?: string;
    tableNumber?: string;
    payments: Payment[];
    paymentStatus: PaymentStatus;
    createdAt: Date;
    createdBy: string;
    notes?: string;
}

export interface OrderItem {
    id: string;
    productId?: string;
    productName: string;
    productNameEn?: string;
    name: string;
    quantity: number;
    price: number;
    unitPrice?: number;
    total: number;
    modifiers?: ProductModifier[];
    specialInstructions?: string;
}
