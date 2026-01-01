import { motion } from 'framer-motion';
import {
    Coffee,
    IceCream,
    Croissant,
    Cake,
    Salad,
    Sparkles,
    GlassWater,
    Pizza,
    Sandwich,
    Cookie,
    Soup,
    type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';

export interface Category {
    id: string;
    name: string;
    nameAr?: string | null;
    icon?: string; // Icon key for mapping
}

export interface CategoryPillsProps {
    /** List of categories */
    categories: Category[];
    /** Currently selected category ID */
    selectedId: string | null;
    /** Callback when category is selected */
    onSelect: (id: string | null) => void;
    /** Label for "All" option */
    allLabel?: string;
    /** Show "All" option */
    showAll?: boolean;
}

// Icon mapping for categories
const categoryIcons: Record<string, LucideIcon> = {
    'all': Sparkles,
    'hot-drinks': Coffee,
    'cold-drinks': GlassWater,
    'bakery': Croissant,
    'desserts': Cake,
    'salads': Salad,
    'pizza': Pizza,
    'sandwiches': Sandwich,
    'cookies': Cookie,
    'soups': Soup,
    'ice-cream': IceCream,
    // Default fallback handled separately
};

/**
 * Premium Category Pills with Icons
 * Features: Animated selection, glow effects, category icons
 */
export function CategoryPills({
    categories,
    selectedId,
    onSelect,
    allLabel = 'الكل',
    showAll = true,
}: CategoryPillsProps) {
    const { language, theme } = useAppSelector(selectSettings);

    const allCategories = showAll
        ? [{ id: 'all', name: 'All', nameAr: allLabel, icon: 'all' }, ...categories]
        : categories;

    // Get icon for category
    const getIcon = (category: Category): LucideIcon => {
        if (category.icon && categoryIcons[category.icon]) {
            return categoryIcons[category.icon];
        }
        // Try to match by name
        const nameLower = category.name.toLowerCase().replace(/\s+/g, '-');
        if (categoryIcons[nameLower]) {
            return categoryIcons[nameLower];
        }
        // Default icon
        return Sparkles;
    };

    return (
        <div className="relative" data-theme={theme}>
            {/* Scrollable container */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {allCategories.map((category) => {
                    const isSelected = category.id === 'all' ? selectedId === null : selectedId === category.id;
                    const displayName = language === 'ar' && category.nameAr ? category.nameAr : category.name;
                    const IconComponent = getIcon(category);

                    return (
                        <motion.button
                            key={category.id}
                            data-theme={theme}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSelect(category.id === 'all' ? null : category.id)}
                            className={cn(
                                'relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap',
                                'transition-all duration-300 border',
                                isSelected
                                    ? cn(
                                        // Selected state - text on gradient
                                        'text-white border-transparent',
                                        // Light theme selected
                                        'data-[theme=light]:text-white',
                                        // Luxury theme selected
                                        'data-[theme=luxury]:text-black',
                                    )
                                    : cn(
                                        // Unselected - Dark theme - ENHANCED CONTRAST
                                        'bg-slate-800/60 border-slate-600/60 text-slate-200',
                                        'hover:border-cyan-400/50 hover:text-white hover:bg-slate-700/60',
                                        // Unselected - Light theme - BETTER CONTRAST
                                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                                        'data-[theme=light]:text-slate-700 data-[theme=light]:shadow-sm',
                                        'data-[theme=light]:hover:border-cyan-500 data-[theme=light]:hover:text-cyan-700',
                                        'data-[theme=light]:hover:bg-cyan-50',
                                        // Unselected - Luxury theme
                                        'data-[theme=luxury]:bg-black/60 data-[theme=luxury]:border-amber-500/30',
                                        'data-[theme=luxury]:text-slate-300',
                                        'data-[theme=luxury]:hover:border-amber-400 data-[theme=luxury]:hover:text-amber-400',
                                    )
                            )}
                        >
                            {/* Animated gradient background for selected state */}
                            {isSelected && (
                                <motion.div
                                    layoutId="category-pill-bg"
                                    data-theme={theme}
                                    className={cn(
                                        'absolute inset-0 rounded-full',
                                        // Dark theme gradient
                                        'bg-gradient-to-r from-cyan-500 to-cyan-600',
                                        'shadow-lg shadow-cyan-500/40',
                                        // Light theme gradient - MORE PROMINENT
                                        'data-[theme=light]:from-cyan-600 data-[theme=light]:to-cyan-700',
                                        'data-[theme=light]:shadow-cyan-700/40',
                                        // Luxury theme gradient
                                        'data-[theme=luxury]:from-amber-400 data-[theme=luxury]:to-amber-500',
                                        'data-[theme=luxury]:shadow-amber-500/40',
                                    )}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            )}

                            {/* Icon */}
                            <motion.div
                                animate={isSelected ? { rotate: [0, 10, -10, 0] } : {}}
                                transition={{ duration: 0.5 }}
                                className="relative z-10"
                            >
                                <IconComponent className="w-4 h-4" />
                            </motion.div>

                            <span className="relative z-10">{displayName}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Fade edge for scroll indication */}
            <div
                data-theme={theme}
                className={cn(
                    'absolute top-0 end-0 h-full w-16 pointer-events-none',
                    'bg-gradient-to-s from-slate-900 via-slate-900/80 to-transparent',
                    // Light theme fade
                    'data-[theme=light]:from-slate-50 data-[theme=light]:via-slate-50/80',
                    // Luxury theme fade
                    'data-[theme=luxury]:from-black data-[theme=luxury]:via-black/80',
                )}
            />
        </div>
    );
}
