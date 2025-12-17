import type { ModifierGroup, ProductModifier } from '../types/pos.types';

/**
 * Modifier Service
 * Handles product customization/modifiers
 */
export class ModifierService {
    /**
     * Get modifier groups for a product
     */
    static async getModifierGroups(productId: string): Promise<ModifierGroup[]> {
        try {
            // TODO: Replace with actual API call when backend is ready
            // const data = await apiClient.get<any, any>(`/products/${productId}/modifiers`);

            // For now, return mock data based on product type
            // This simulates different modifier options for different products

            // Example: Coffee modifiers
            if (productId.includes('coffee') || productId.includes('قهوة')) {
                return [
                    {
                        id: 'size',
                        name: 'الحجم',
                        nameEn: 'Size',
                        minSelection: 1,
                        maxSelection: 1,
                        isRequired: true,
                        options: [
                            { id: 'small', name: 'صغير', nameEn: 'Small', price: 0 },
                            { id: 'medium', name: 'وسط', nameEn: 'Medium', price: 2 },
                            { id: 'large', name: 'كبير', nameEn: 'Large', price: 4 },
                        ],
                    },
                    {
                        id: 'extras',
                        name: 'إضافات',
                        nameEn: 'Extras',
                        minSelection: 0,
                        maxSelection: 3,
                        isRequired: false,
                        options: [
                            { id: 'extra-shot', name: 'شوت إضافي', nameEn: 'Extra Shot', price: 3 },
                            { id: 'whipped-cream', name: 'كريمة', nameEn: 'Whipped Cream', price: 2 },
                            { id: 'vanilla', name: 'فانيليا', nameEn: 'Vanilla Syrup', price: 2.5 },
                            { id: 'caramel', name: 'كراميل', nameEn: 'Caramel Syrup', price: 2.5 },
                        ],
                    },
                ];
            }

            // Example: Burger modifiers
            if (productId.includes('burger') || productId.includes('برجر')) {
                return [
                    {
                        id: 'bread',
                        name: 'نوع الخبز',
                        nameEn: 'Bread Type',
                        minSelection: 1,
                        maxSelection: 1,
                        isRequired: true,
                        options: [
                            { id: 'white', name: 'أبيض', nameEn: 'White Bun', price: 0 },
                            { id: 'whole-wheat', name: 'قمح كامل', nameEn: 'Whole Wheat', price: 1 },
                            { id: 'brioche', name: 'بريوش', nameEn: 'Brioche Bun', price: 2 },
                        ],
                    },
                    {
                        id: 'cheese',
                        name: 'نوع الجبن',
                        nameEn: 'Cheese Type',
                        minSelection: 0,
                        maxSelection: 2,
                        isRequired: false,
                        options: [
                            { id: 'cheddar', name: 'شيدر', nameEn: 'Cheddar', price: 2 },
                            { id: 'swiss', name: 'سويسري', nameEn: 'Swiss', price: 2.5 },
                            { id: 'blue', name: 'أزرق', nameEn: 'Blue Cheese', price: 3 },
                        ],
                    },
                    {
                        id: 'toppings',
                        name: 'إضافات',
                        nameEn: 'Toppings',
                        minSelection: 0,
                        maxSelection: 5,
                        isRequired: false,
                        options: [
                            { id: 'lettuce', name: 'خس', nameEn: 'Lettuce', price: 0 },
                            { id: 'tomato', name: 'طماطم', nameEn: 'Tomato', price: 0 },
                            { id: 'onion', name: 'بصل', nameEn: 'Onion', price: 0 },
                            { id: 'pickles', name: 'مخلل', nameEn: 'Pickles', price: 0 },
                            { id: 'bacon', name: 'بيكون', nameEn: 'Bacon', price: 4 },
                            { id: 'egg', name: 'بيض', nameEn: 'Fried Egg', price: 2 },
                        ],
                    },
                ];
            }

            // Default: Generic modifiers
            return [
                {
                    id: 'size',
                    name: 'الحجم',
                    nameEn: 'Size',
                    minSelection: 1,
                    maxSelection: 1,
                    isRequired: true,
                    options: [
                        { id: 'regular', name: 'عادي', nameEn: 'Regular', price: 0 },
                        { id: 'large', name: 'كبير', nameEn: 'Large', price: 3 },
                    ],
                },
            ];
        } catch (error) {
            console.error('Failed to fetch modifiers:', error);
            return [];
        }
    }
}
