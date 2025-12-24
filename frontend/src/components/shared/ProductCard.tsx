import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Sparkles, TrendingUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/decimal';
import { Badge } from '../ui/Badge';
import { useSettingsStore } from '@/stores/settings.store';

export interface ProductCardProps {
    /** Product ID */
    id: string;
    /** Product name (shown based on language) */
    name: string;
    /** Arabic name */
    nameAr?: string | null;
    /** Sale price (as string for precision) */
    price: string;
    /** Image URL */
    imageUrl?: string;
    /** Whether product is available */
    available?: boolean;
    /** Stock quantity (for badge) */
    stock?: number;
    /** Low stock threshold */
    lowStockThreshold?: number;
    /** Badge type for special products */
    badgeType?: 'new' | 'popular' | 'bestseller' | null;
    /** Callback when product is clicked/added */
    onAdd: (id: string) => void;
    /** Whether the card is in loading state */
    isLoading?: boolean;
}

/**
 * Premium Product Card for POS
 * Features: 3D tilt effect, animated glow border, image shimmer, badge system
 */
export function ProductCard({
    id,
    name,
    nameAr,
    price,
    imageUrl,
    available = true,
    stock,
    lowStockThreshold = 5,
    badgeType,
    onAdd,
    isLoading = false,
}: ProductCardProps) {
    const { language, theme } = useSettingsStore();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const displayName = language === 'ar' && nameAr ? nameAr : name;
    const isLowStock = stock !== undefined && stock > 0 && stock <= lowStockThreshold;
    const isOutOfStock = stock !== undefined && stock <= 0;
    const isDisabled = !available || isOutOfStock || isLoading;

    const handleClick = () => {
        if (!isDisabled) {
            onAdd(id);
        }
    };

    // Badge config based on type
    const badgeConfig = {
        new: { icon: Sparkles, label: language === 'ar' ? 'جديد' : 'New', color: 'from-emerald-400 to-emerald-500' },
        popular: { icon: TrendingUp, label: language === 'ar' ? 'رائج' : 'Popular', color: 'from-violet-400 to-violet-500' },
        bestseller: { icon: Star, label: language === 'ar' ? 'الأكثر مبيعاً' : 'Best', color: 'from-amber-400 to-amber-500' },
    };

    return (
        <motion.div
            data-theme={theme}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={!isDisabled ? {
                y: -10,
                scale: 1.03,
                rotateX: 3,
                rotateY: -3,
            } : undefined}
            whileTap={!isDisabled ? { scale: 0.97 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={handleClick}
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
            className={cn(
                'relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300',
                'backdrop-blur-xl border shadow-lg',
                // Glow effect on hover
                'glow-border',
                // Dark theme - glassmorphic
                'bg-slate-800/60 border-slate-700/50',
                'hover:border-cyan-400/60 hover:shadow-cyan-500/25 hover:shadow-2xl',
                // Light theme - ENHANCED CONTRAST with solid backgrounds
                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                'data-[theme=light]:shadow-slate-200/50',
                'data-[theme=light]:hover:border-cyan-500 data-[theme=light]:hover:shadow-xl',
                'data-[theme=light]:hover:shadow-cyan-500/30',
                // Luxury theme
                'data-[theme=luxury]:bg-black/70 data-[theme=luxury]:border-amber-500/30',
                'data-[theme=luxury]:hover:border-amber-400 data-[theme=luxury]:hover:shadow-amber-500/25',
                // Disabled states
                isDisabled && 'opacity-50 cursor-not-allowed hover:scale-100 hover:y-0',
            )}
        >
            {/* Animated glow border overlay */}
            {isHovered && !isDisabled && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                        'absolute inset-0 -z-10 rounded-2xl blur-xl',
                        'bg-gradient-to-br from-cyan-500/30 to-transparent',
                        'data-[theme=light]:from-cyan-400/20',
                        'data-[theme=luxury]:from-amber-500/30',
                    )}
                    data-theme={theme}
                />
            )}

            {/* Image Container */}
            <div
                data-theme={theme}
                className={cn(
                    'aspect-square relative overflow-hidden',
                    // Dark theme
                    'bg-gradient-to-br from-slate-700/50 to-slate-800/50',
                    // Light theme - subtle gradient
                    'data-[theme=light]:from-slate-100 data-[theme=light]:to-slate-50',
                    // Luxury theme
                    'data-[theme=luxury]:from-slate-900 data-[theme=luxury]:to-black',
                )}
            >
                {/* Shimmer loading effect */}
                {!imageLoaded && imageUrl && (
                    <div
                        data-theme={theme}
                        className={cn(
                            'absolute inset-0 animate-shimmer',
                            'bg-gradient-to-r bg-[length:200%_100%]',
                            'from-slate-700/50 via-slate-600/30 to-slate-700/50',
                            'data-[theme=light]:from-slate-200 data-[theme=light]:via-white data-[theme=light]:to-slate-200',
                            'data-[theme=luxury]:from-amber-500/10 data-[theme=luxury]:via-amber-500/5 data-[theme=luxury]:to-amber-500/10',
                        )}
                    />
                )}

                {imageUrl ? (
                    <motion.img
                        src={imageUrl}
                        alt={displayName}
                        onLoad={() => setImageLoaded(true)}
                        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className={cn(
                            'w-full h-full object-cover',
                            !imageLoaded && 'opacity-0',
                        )}
                        loading="lazy"
                    />
                ) : (
                    // Placeholder with icon
                    <div className="w-full h-full flex items-center justify-center">
                        <motion.div
                            data-theme={theme}
                            animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                            className={cn(
                                'w-16 h-16 rounded-2xl flex items-center justify-center',
                                'bg-slate-700/50',
                                'data-[theme=light]:bg-slate-200',
                                'data-[theme=luxury]:bg-amber-500/10',
                            )}
                        >
                            <Package className={cn(
                                'w-8 h-8',
                                'text-slate-500',
                                'data-[theme=light]:text-slate-400',
                                'data-[theme=luxury]:text-amber-500/50',
                            )} />
                        </motion.div>
                    </div>
                )}

                {/* Hover overlay with add button */}
                {!isDisabled && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        className={cn(
                            'absolute inset-0 flex items-center justify-center',
                            'bg-gradient-to-t from-black/70 via-black/30 to-transparent',
                        )}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={isHovered ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className={cn(
                                'w-14 h-14 rounded-full flex items-center justify-center',
                                'bg-gradient-to-br from-cyan-400 to-cyan-500 text-white',
                                'shadow-lg shadow-cyan-500/50',
                                'data-[theme=luxury]:from-amber-400 data-[theme=luxury]:to-amber-500',
                                'data-[theme=luxury]:shadow-amber-500/50',
                            )}
                            data-theme={theme}
                        >
                            <Plus className="w-7 h-7" strokeWidth={2.5} />
                        </motion.div>
                    </motion.div>
                )}

                {/* Special Badge (New, Popular, Bestseller) */}
                {badgeType && badgeConfig[badgeType] && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-3 end-3 z-10"
                    >
                        <div className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-full',
                            'text-xs font-bold text-white shadow-lg',
                            `bg-gradient-to-r ${badgeConfig[badgeType].color}`,
                        )}>
                            {(() => {
                                const IconComponent = badgeConfig[badgeType].icon;
                                return <IconComponent className="w-3 h-3" />;
                            })()}
                            <span>{badgeConfig[badgeType].label}</span>
                        </div>
                    </motion.div>
                )}

                {/* Stock badges */}
                {isOutOfStock && (
                    <div className="absolute top-3 start-3">
                        <Badge variant="error" size="sm" className="font-bold">
                            {language === 'ar' ? 'نفذ' : 'Out'}
                        </Badge>
                    </div>
                )}
                {isLowStock && !isOutOfStock && (
                    <div className="absolute top-3 start-3">
                        <Badge variant="warning" size="sm" className="font-bold animate-pulse">
                            {stock} {language === 'ar' ? 'فقط' : 'left'}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Content */}
            <div data-theme={theme} className="p-3.5">
                <h3 className={cn(
                    'text-sm font-bold truncate mb-1.5',
                    // Dark theme
                    'text-white',
                    // Light theme - DARK TEXT for contrast
                    'data-[theme=light]:text-slate-900',
                    // Luxury theme
                    'data-[theme=luxury]:text-white',
                )}>
                    {displayName}
                </h3>

                <div className="flex items-center justify-between">
                    <motion.span
                        animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                        className={cn(
                            'text-lg font-bold font-inter',
                            // Dark theme
                            'text-cyan-400',
                            // Light theme - DARKER cyan for contrast
                            'data-[theme=light]:text-cyan-700',
                            // Luxury theme
                            'data-[theme=luxury]:text-amber-400',
                        )}
                    >
                        {formatCurrency(price, 'SAR', language === 'ar' ? 'ar-SA' : 'en-SA')}
                    </motion.span>

                    {stock !== undefined && !isOutOfStock && !isLowStock && (
                        <span data-theme={theme} className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            // Dark theme
                            'bg-slate-700/50 text-slate-400',
                            // Light theme - visible badge
                            'data-[theme=light]:bg-slate-100 data-[theme=light]:text-slate-500',
                            // Luxury theme
                            'data-[theme=luxury]:bg-amber-500/10 data-[theme=luxury]:text-amber-500/70',
                        )}>
                            {stock}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
