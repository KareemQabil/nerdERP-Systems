/**
 * Mock POS Data
 * Temporary mock data for demo purposes - will be replaced with API calls
 */
import { Store, UtensilsCrossed, CarFront } from 'lucide-react';
import type { ModifierGroup } from '@/types/pos.types';

export interface MockCategory {
    id: string;
    name: string;
    nameAr: string;
    icon: string;
}

export interface MockProduct {
    id: string;
    name: string;
    nameAr: string;
    price: string;
    stock: number;
    image: string;
    badgeType: 'popular' | 'bestseller' | 'new' | null;
    hasModifiers?: boolean;
}

export interface OrderTypeOption {
    id: string;
    labelAr: string;
    labelEn: string;
    icon: typeof Store;
}

// Categories
export const mockCategories: MockCategory[] = [
    { id: '1', name: 'All', nameAr: 'الكل', icon: 'all' },
    { id: '2', name: 'Hot Drinks', nameAr: 'مشروبات ساخنة', icon: 'hot-drinks' },
    { id: '3', name: 'Cold Drinks', nameAr: 'مشروبات باردة', icon: 'cold-drinks' },
    { id: '4', name: 'Bakery', nameAr: 'المخبوزات', icon: 'bakery' },
    { id: '5', name: 'Desserts', nameAr: 'الحلويات', icon: 'desserts' },
    { id: '6', name: 'Salads', nameAr: 'السلطات', icon: 'salads' },
];

// Products with Unsplash images
export const mockProducts: MockProduct[] = [
    {
        id: '1',
        name: 'Daily Brew Coffee',
        nameAr: 'قهوة اليوم',
        price: '10.000',
        stock: 100,
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
        badgeType: 'popular',
        hasModifiers: true,
    },
    {
        id: '2',
        name: 'Premium Espresso',
        nameAr: 'إسبريسو مميز',
        price: '8.000',
        stock: 100,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop',
        badgeType: 'bestseller',
        hasModifiers: true,
    },
    {
        id: '3',
        name: 'Classic Latte',
        nameAr: 'لاتيه كلاسيكي',
        price: '15.000',
        stock: 30,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
        badgeType: null,
        hasModifiers: true,
    },
    {
        id: '4',
        name: 'Pepsi Cola',
        nameAr: 'بيبسي كولا',
        price: '5.000',
        stock: 50,
        image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop',
        badgeType: null,
    },
    {
        id: '5',
        name: 'Fresh Caesar Salad',
        nameAr: 'سلطة سيزر طازجة',
        price: '30.000',
        stock: 12,
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop',
        badgeType: 'new',
    },
    {
        id: '6',
        name: 'Natural Honey Cake',
        nameAr: 'كيكة العسل الطبيعي',
        price: '22.000',
        stock: 8,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
        badgeType: 'popular',
    },
    {
        id: '7',
        name: 'Cheese Croissant',
        nameAr: 'كرواسون بالجبنة',
        price: '10.000',
        stock: 0, // Out of stock
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop',
        badgeType: null,
    },
    {
        id: '8',
        name: 'Natural Spring Water',
        nameAr: 'مياه معدنية طبيعية',
        price: '2.000',
        stock: 100,
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop',
        badgeType: null,
    },
];

// Modifier groups for coffee products
export const mockModifierGroups: ModifierGroup[] = [
    {
        id: 'size',
        name: 'Size',
        nameAr: 'الحجم',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        selectionType: 'SINGLE',
        sortOrder: 0,
        modifiers: [
            { id: 'small', name: 'Small', nameAr: 'صغير', priceAdjustment: '0.000', isDefault: true, isAvailable: true, isNegative: false, sortOrder: 0 },
            { id: 'medium', name: 'Medium', nameAr: 'وسط', priceAdjustment: '2.000', isDefault: false, isAvailable: true, isNegative: false, sortOrder: 1 },
            { id: 'large', name: 'Large', nameAr: 'كبير', priceAdjustment: '4.000', isDefault: false, isAvailable: true, isNegative: false, sortOrder: 2 },
        ],
    },
    {
        id: 'milk',
        name: 'Milk Type',
        nameAr: 'نوع الحليب',
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        selectionType: 'SINGLE',
        sortOrder: 1,
        modifiers: [
            { id: 'regular', name: 'Regular Milk', nameAr: 'حليب عادي', priceAdjustment: '0.000', isDefault: true, isAvailable: true, isNegative: false, sortOrder: 0 },
            { id: 'oat', name: 'Oat Milk', nameAr: 'حليب الشوفان', priceAdjustment: '3.000', isDefault: false, isAvailable: true, isNegative: false, sortOrder: 1 },
            { id: 'almond', name: 'Almond Milk', nameAr: 'حليب اللوز', priceAdjustment: '3.000', isDefault: false, isAvailable: true, isNegative: false, sortOrder: 2 },
            { id: 'skim', name: 'Skim Milk', nameAr: 'حليب خالي الدسم', priceAdjustment: '0.000', isDefault: false, isAvailable: true, isNegative: false, sortOrder: 3 },
        ],
    },
    {
        id: 'extras',
        name: 'Extras',
        nameAr: 'إضافات',
        isRequired: false,
        minSelections: 0,
        maxSelections: 3,
        selectionType: 'MULTIPLE',
        sortOrder: 2,
        modifiers: [
            { id: 'shot', name: 'Extra Shot', nameAr: 'شوت إضافي', priceAdjustment: '2.000', isDefault: false, isAvailable: true, isNegative: false, sortOrder: 0 },
            { id: 'caramel', name: 'Caramel Syrup', nameAr: 'شراب الكراميل', priceAdjustment: '1.500', isDefault: false, isAvailable: true, isNegative: false, sortOrder: 1 },
            { id: 'vanilla', name: 'Vanilla Syrup', nameAr: 'شراب الفانيلا', priceAdjustment: '1.500', isDefault: false, isAvailable: true, isNegative: false, sortOrder: 2 },
            { id: 'whip', name: 'Whipped Cream', nameAr: 'كريمة مخفوقة', priceAdjustment: '1.000', isDefault: false, isAvailable: true, isNegative: false, sortOrder: 3 },
        ],
    },
];

// Order types
export const orderTypes: OrderTypeOption[] = [
    { id: 'dine-in', labelAr: 'في المطعم', labelEn: 'Dine-in', icon: UtensilsCrossed },
    { id: 'takeaway', labelAr: 'سفري', labelEn: 'Takeaway', icon: CarFront },
    { id: 'pickup', labelAr: 'استلام', labelEn: 'Pickup', icon: Store },
];

// Helper to convert MockProduct to ProductInfo for cart
export function toProductInfo(product: MockProduct) {
    return {
        id: product.id,
        sku: `SKU-${product.id}`,
        name: product.name,
        nameAr: product.nameAr,
        salePrice: product.price,
        imageUrl: product.image,
        requiresKitchen: false,
        kitchenStation: null,
        trackInventory: true,
        modifierGroups: product.hasModifiers ? mockModifierGroups : [],
        hasRequiredModifiers: product.hasModifiers || false,
        // Additional required fields with defaults
        allowNegativeStock: false,
        categoryId: '1',
        isAvailable: product.stock > 0,
        isFeatured: product.badgeType === 'popular',
        taxable: true,
        stockQuantity: String(product.stock),
    };
}
