import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Product } from '@/modules/products/types/product.types';

export interface ProductCardProps {
    product: Product;
    onClick?: (product: Product) => void;
    className?: string;
    index?: number; // For stagger animation delay
}

/**
 * ProductCard Molecule
 * Displays product with LEGACY_POS_SPEC glassmorphism styling
 * 
 * Features (per spec):
 * - Glass card recipe: bg-[rgba(255,255,255,0.05)], border-[rgba(255,255,255,0.1)]
 * - Stagger animation: delay = index * 0.03 seconds
 * - Hover: scale(1.03), border-cyan-400/50
 * - Tap: scale(0.97)
 * - Stock badge colors: Green (>10), Yellow (1-10), Red (0)
 * 
 * @example
 * <ProductCard product={product} onClick={handleClick} index={0} />
 */
export function ProductCard({
    product,
    onClick,
    className,
    index = 0,
}: ProductCardProps) {
    // Calculate stock level for badge color
    const stockQty = parseFloat(product.stockQuantity || '0');
    const getStockBadgeClass = () => {
        if (stockQty > 10) return 'bg-green-500/20 text-green-400';
        if (stockQty > 0) return 'bg-yellow-500/20 text-yellow-400';
        return 'bg-red-500/20 text-red-400';
    };

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }} // Stagger: 30ms per item
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onClick?.(product)}
            className={cn(
                // Glass Card Recipe (LEGACY_POS_SPEC Section 2.2)
                'bg-[rgba(255,255,255,0.05)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)]',
                'rounded-xl p-4 text-right transition-all',
                'hover:border-cyan-400/50 hover:shadow-lg cursor-pointer',
                className
            )}
            disabled={!product.isActive}
        >
            {/* Product Image - aspect-square per spec */}
            <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-[rgba(255,255,255,0.03)]">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">
                        ☕
                    </div>
                )}
            </div>

            {/* Arabic Name - Almarai font per spec */}
            <h3
                className="text-base font-['Almarai'] font-bold text-[#e2e2e6] mb-1 line-clamp-2"
                dir="auto"
            >
                {product.name}
            </h3>

            {/* English Name (if exists) */}
            {product.nameEn && (
                <p className="text-sm text-[#c2c7ce] mb-2 line-clamp-1">
                    {product.nameEn}
                </p>
            )}

            {/* Price & Stock Row */}
            <div className="flex items-center justify-between">
                {/* Price - Arial font for numbers per spec */}
                <span className="text-lg font-['Arial'] font-bold text-cyan-400">
                    {parseFloat(product.salePrice).toFixed(2)} ر.س
                </span>

                {/* Stock Badge - Color coded per spec */}
                {product.trackInventory && (
                    <span className={cn(
                        'text-xs px-2 py-1 rounded',
                        getStockBadgeClass()
                    )}>
                        {stockQty > 0 ? `${Math.floor(stockQty)} متوفر` : 'نفذ'}
                    </span>
                )}
            </div>
        </motion.button>
    );
}
