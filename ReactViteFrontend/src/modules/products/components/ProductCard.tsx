import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Decimal from 'decimal.js';
import type { Product } from '@/modules/products/hooks/useProducts';
import { useLocalizedProduct } from '@/modules/products/hooks/useLocalizedProduct';

interface ProductCardProps {
    product: Product;
    onSmartClick: (product: Product) => void;
}

export const ProductCard = ({ product, onSmartClick }: ProductCardProps) => {
    const { getProductName } = useLocalizedProduct();
    const price = new Decimal(product.salePrice).toFixed(2);
    const hasStock = product.hasStock ?? true;

    // Format price in Arabic numerals
    const priceArabic = price.replace(/\d/g, (d: string) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);

    return (
        <article
            onClick={() => hasStock && onSmartClick(product)}
            className={cn(
                "relative overflow-hidden rounded-xl border border-white/5 bg-[#1A2027]/80 hover:bg-[#1A2027] hover:border-primary/30 transition-all cursor-pointer group backdrop-blur-sm",
                !hasStock && "opacity-50 grayscale cursor-not-allowed"
            )}
        >
            {/* Image Container - 70% of card height */}
            <div className="relative w-full aspect-[3/2.5] overflow-hidden">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#132F4C]/30 text-muted-foreground">
                        <span className="text-xs opacity-40">No Image</span>
                    </div>
                )}

                {/* Stock Badge - Top Right Corner */}
                {hasStock ? (
                    <div className="absolute top-2 right-2">
                        <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                            متوفر
                        </span>
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-error text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wide">
                            نفذ المخزون
                        </span>
                    </div>
                )}

                {/* Add Button - Visible on Hover */}
                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            hasStock && onSmartClick(product);
                        }}
                        disabled={!hasStock}
                        className="w-8 h-8 rounded-lg bg-primary hover:bg-primary-dark text-surface-dark flex items-center justify-center transition-all active:scale-90 shadow-lg disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content - 30% of card height */}
            <div className="p-3 flex flex-col gap-1.5 bg-gradient-to-t from-[#0d1117]/40 to-transparent">
                {/* Bilingual Product Name */}
                <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white leading-tight truncate">
                        {product.nameAr || getProductName(product)}
                    </h3>
                    <p className="text-xs text-white/70 leading-tight truncate">
                        {product.name}
                    </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-lg font-bold text-primary font-latin">{price}</span>
                    <span className="text-[10px] text-primary/70">ر.س</span>
                </div>
            </div>
        </article>
    );
};
