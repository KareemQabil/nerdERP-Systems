/**
 * Mock Modifier Data
 * Provides sample modifier groups for Cafe POS system
 */

export interface ModifierOption {
    id: string;
    name: string;
    nameAr: string;
    price: string; // decimal(10,3) as string
}

export interface ModifierGroup {
    id: string;
    name: string;
    nameAr: string;
    minSelection: number;
    maxSelection: number;
    options: ModifierOption[];
}

/**
 * Mock Modifier Groups
 * Size, Milk, Add-ons
 */
export const mockModifierGroups: ModifierGroup[] = [
    {
        id: 'group-size',
        name: 'Size',
        nameAr: 'الحجم',
        minSelection: 1,
        maxSelection: 1, // Radio (single select)
        options: [
            {
                id: 'size-regular',
                name: 'Regular',
                nameAr: 'عادي',
                price: '0.000', // No extra cost
            },
            {
                id: 'size-large',
                name: 'Large',
                nameAr: 'كبير',
                price: '2.000', // +2 SAR
            },
        ],
    },
    {
        id: 'group-milk',
        name: 'Milk Type',
        nameAr: 'نوع الحليب',
        minSelection: 1,
        maxSelection: 1, // Radio (single select)
        options: [
            {
                id: 'milk-whole',
                name: 'Whole Milk',
                nameAr: 'حليب كامل الدسم',
                price: '0.000',
            },
            {
                id: 'milk-oat',
                name: 'Oat Milk',
                nameAr: 'حليب الشوفان',
                price: '3.000', // +3 SAR
            },
            {
                id: 'milk-almond',
                name: 'Almond Milk',
                nameAr: 'حليب اللوز',
                price: '3.000', // +3 SAR
            },
            {
                id: 'milk-soy',
                name: 'Soy Milk',
                nameAr: 'حليب الصويا',
                price: '2.500', // +2.5 SAR
            },
        ],
    },
    {
        id: 'group-addons',
        name: 'Add-ons',
        nameAr: 'إضافات',
        minSelection: 0,
        maxSelection: 5, // Checkboxes (multi-select)
        options: [
            {
                id: 'addon-espresso',
                name: 'Espresso Shot',
                nameAr: 'شوت إسبريسو',
                price: '5.000', // +5 SAR
            },
            {
                id: 'addon-syrup',
                name: 'Flavored Syrup',
                nameAr: 'شراب بنكهة',
                price: '2.000', // +2 SAR
            },
            {
                id: 'addon-whip',
                name: 'Whipped Cream',
                nameAr: 'كريمة مخفوقة',
                price: '1.500', // +1.5 SAR
            },
            {
                id: 'addon-caramel',
                name: 'Caramel Drizzle',
                nameAr: 'رشة كراميل',
                price: '2.000', // +2 SAR
            },
        ],
    },
];

/**
 * Get modifiers for a specific product
 * In a real system, this would be fetched from API based on product category
 */
export function getModifiersForProduct(productId: string): ModifierGroup[] {
    // For now, return all groups for all products
    // In production, filter based on product.category
    return mockModifierGroups;
}
