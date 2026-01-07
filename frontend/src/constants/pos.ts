/**
 * H-POS Constants
 * Egyptian Restaurant POS System Configuration
 */

// Currency Configuration (EGP - Egyptian Pound)
export const CURRENCY_CODE = 'EGP';
export const CURRENCY_SYMBOL_EN = 'EGP';
export const CURRENCY_SYMBOL_AR = 'ج.م';

// VAT Configuration
export const VAT_RATE = 0.14; // 14% VAT (ضريبة القيمة المضافة)
export const VAT_PERCENTAGE = 14;

// Table Service Charge Configuration
export const SERVICE_CHARGE_RATE = 0.12; // 12% service charge for dine-in
export const SERVICE_CHARGE_PERCENTAGE = 12;

// Order Types
export const ORDER_TYPES = {
    DINE_IN: 'DINE_IN',
    TAKEAWAY: 'TAKEAWAY',
    DELIVERY: 'DELIVERY',
    TALABAT: 'TALABAT',
    MARSOOL: 'MARSOOL',
    INSTASHOP: 'INSTASHOP',
} as const;

export type OrderType = typeof ORDER_TYPES[keyof typeof ORDER_TYPES];

// Order Type Display Names (Bilingual)
export const ORDER_TYPE_NAMES: Record<OrderType, { en: string; ar: string }> = {
    DINE_IN: { en: 'Dine In', ar: 'في المطعم' },
    TAKEAWAY: { en: 'Takeaway', ar: 'تيك أواي' },
    DELIVERY: { en: 'Delivery', ar: 'توصيل' },
    TALABAT: { en: 'Talabat', ar: 'طلب' },
    MARSOOL: { en: 'Marsool', ar: 'مرسول' },
    INSTASHOP: { en: 'Instashop', ar: 'إنستاشوب' },
};

// Payment Methods
export const PAYMENT_METHODS = {
    CASH: 'CASH',
    VISA: 'VISA',
    TALABAT: 'TALABAT',
    EPT: 'EPT', // Electronic Payment Terminal
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Payment Method Display Names (Bilingual)
export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, { en: string; ar: string }> = {
    CASH: { en: 'Cash', ar: 'نقدي' },
    VISA: { en: 'Visa', ar: 'فيزا' },
    TALABAT: { en: 'Talabat', ar: 'طلب' },
    EPT: { en: 'EPT', ar: 'بطاقة دفع' },
};

// Payment Method Icons
export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
    CASH: '💵',
    VISA: '💳',
    TALABAT: '📱',
    EPT: '🏧',
};

// Delivery Zones Configuration
export interface DeliveryZone {
    id: string;
    name: string;
    baseCharge: number;
    sortOrder: number;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
    { id: 'A', name: 'Zone A', baseCharge: 50, sortOrder: 1 },
    { id: 'B', name: 'Zone B', baseCharge: 70, sortOrder: 2 },
    { id: 'C', name: 'Zone C', baseCharge: 90, sortOrder: 3 },
    { id: 'D', name: 'Zone D', baseCharge: 110, sortOrder: 4 },
    { id: 'E', name: 'Zone E', baseCharge: 130, sortOrder: 5 },
    { id: 'F', name: 'Zone F', baseCharge: 150, sortOrder: 6 },
    { id: 'G', name: 'Zone G', baseCharge: 170, sortOrder: 7 },
];

// Fixed delivery charge for platforms
export const PLATFORM_DELIVERY_CHARGE = 50;

// Kitchen Channels
export const KITCHEN_CHANNELS = {
    PIZZA: 'PIZZA',
    BURGER: 'BURGER',
    GRILL: 'GRILL',
    DRINKS: 'DRINKS',
    DESSERT: 'DESSERT',
    APPETIZER: 'APPETIZER',
} as const;

export type KitchenChannel = typeof KITCHEN_CHANNELS[keyof typeof KITCHEN_CHANNELS];

// Kitchen Channel Display Names (Bilingual)
export const KITCHEN_CHANNEL_NAMES: Record<KitchenChannel, { en: string; ar: string }> = {
    PIZZA: { en: 'Pizza', ar: 'بيتزا' },
    BURGER: { en: 'Burger', ar: 'برجر' },
    GRILL: { en: 'Grill', ar: 'مشاوي' },
    DRINKS: { en: 'Drinks', ar: 'مشروبات' },
    DESSERT: { en: 'Dessert', ar: 'حلويات' },
    APPETIZER: { en: 'Appetizer', ar: 'مقبلات' },
};

// Table Section Types
export const SECTION_TYPES = {
    INDOOR: 'INDOOR',
    OUTDOOR: 'OUTDOOR',
} as const;

export type SectionType = typeof SECTION_TYPES[keyof typeof SECTION_TYPES];

// Section Type Display Names (Bilingual)
export const SECTION_TYPE_NAMES: Record<SectionType, { en: string; ar: string }> = {
    INDOOR: { en: 'Indoor', ar: 'داخلي' },
    OUTDOOR: { en: 'Outdoor', ar: 'خارجي' },
};

// Table Status
export const TABLE_STATUS = {
    AVAILABLE: 'AVAILABLE',
    OCCUPIED: 'OCCUPIED',
    RESERVED: 'RESERVED',
    CLEANING: 'CLEANING',
} as const;

export type TableStatus = typeof TABLE_STATUS[keyof typeof TABLE_STATUS];

// Table Status Display Names (Bilingual)
export const TABLE_STATUS_NAMES: Record<TableStatus, { en: string; ar: string }> = {
    AVAILABLE: { en: 'Available', ar: 'متاح' },
    OCCUPIED: { en: 'Occupied', ar: 'مشغول' },
    RESERVED: { en: 'Reserved', ar: 'محجوز' },
    CLEANING: { en: 'Cleaning', ar: 'تنظيف' },
};

// Table Status Colors
export const TABLE_STATUS_COLORS: Record<TableStatus, string> = {
    AVAILABLE: 'bg-green-500',
    OCCUPIED: 'bg-red-500',
    RESERVED: 'bg-yellow-500',
    CLEANING: 'bg-blue-500',
};

// Order Status for Cart/Order Lifecycle
export const ORDER_STATUS = {
    DRAFT: 'DRAFT',
    SAVED: 'SAVED',
    SENT_TO_KITCHEN: 'SENT_TO_KITCHEN',
    CLOSED: 'CLOSED',
} as const;

export type CartOrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Discount Types
export const DISCOUNT_TYPES = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED: 'FIXED',
} as const;

export type DiscountType = typeof DISCOUNT_TYPES[keyof typeof DISCOUNT_TYPES];

// Return Reasons
export const RETURN_REASONS = [
    { id: 'WRONG_PRODUCT', en: 'Wrong product', ar: 'منتج خاطئ' },
    { id: 'DEFECTIVE', en: 'Defective product', ar: 'منتج معيب' },
    { id: 'CUSTOMER_DISSATISFACTION', en: 'Customer dissatisfaction', ar: 'عدم رضا العميل' },
    { id: 'EXPIRED', en: 'Expired product', ar: 'منتج منتهي الصلاحية' },
    { id: 'OTHER', en: 'Other', ar: 'أخرى' },
] as const;

// Void Reasons
export const VOID_REASNS = [
    { id: 'WRONG_ORDER', en: 'Wrong order', ar: 'طلب خاطئ' },
    { id: 'MISTAKE', en: 'Mistake', ar: 'خطأ' },
    { id: 'CUSTOMER_REQUEST', en: 'Customer request', ar: 'طلب العميل' },
    { id: 'DUPLICATE', en: 'Duplicate', ar: 'طلب مكرر' },
    { id: 'OTHER', en: 'Other', ar: 'أخرى' },
] as const;

// Default table range per section
export const DEFAULT_MIN_TABLES = 10;
export const DEFAULT_MAX_TABLES = 20;

// Service charge application (Dine In only)
export const SERVICE_CHARGE_ORDER_TYPES: OrderType[] = [ORDER_TYPES.DINE_IN];

// Platform order types (fixed delivery charge)
export const PLATFORM_ORDER_TYPES: OrderType[] = [
    ORDER_TYPES.TALABAT,
    ORDER_TYPES.MARSOOL,
    ORDER_TYPES.INSTASHOP,
];

// Order types that create sales orders (unpaid until closed)
export const SALES_ORDER_TYPES: OrderType[] = [
    ORDER_TYPES.DELIVERY,
    ORDER_TYPES.TALABAT,
    ORDER_TYPES.MARSOOL,
    ORDER_TYPES.INSTASHOP,
];
