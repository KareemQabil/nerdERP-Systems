import { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/atoms/Button';
import { ProductCard } from '@/shared/components/molecules/ProductCard';
import { useProducts, useCategories } from '@/modules/products/hooks/useProducts';
import type { Product } from '@/modules/products/types/product.types';

export interface ProductBrowserProps {
    onAddToCart?: (product: Product) => void;
}

/**
 * ProductBrowser Organism
 * Smart component with LEGACY_POS_SPEC styling and improved grid density
 * 
 * Features (per spec):
 * - Category Pills: Rounded-full glass styling, active state with cyan
 * - Search Input: Glass input with icon
 * - Product Grid: Responsive 2/3/4/5 columns with stagger animation
 * - Loading/Error/Empty states
 * 
 * @example
 * <ProductBrowser onAddToCart={handleAddToCart} />
 */
export function ProductBrowser({ onAddToCart }: ProductBrowserProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch categories
    const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();
    const categories = categoriesResponse?.data || [];

    // Fetch products with filters
    const {
        data: productsResponse,
        isLoading: productsLoading,
        isError,
        error,
        refetch
    } = useProducts({
        categoryId: selectedCategory,
        search: searchTerm,
        isActive: true,
    });

    const products = productsResponse?.data.data || [];

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Categories + Search */}
            <div className="space-y-4">
                {/* Category Pills - Glass Style per LEGACY_POS_SPEC */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {/* "All" Pill */}
                    <button
                        onClick={() => setSelectedCategory(undefined)}
                        className={
                            !selectedCategory
                                ? "px-6 py-2.5 rounded-full text-sm font-['Almarai'] font-bold transition-all whitespace-nowrap bg-cyan-400 text-[#00373a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]"
                                : "px-6 py-2.5 rounded-full text-sm font-['Almarai'] transition-all whitespace-nowrap bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#c2c7ce] hover:border-cyan-400/50"
                        }
                    >
                        الكل
                    </button>

                    {categoriesLoading ? (
                        // Category skeletons
                        <>
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="h-11 w-24 bg-[rgba(255,255,255,0.1)] rounded-full animate-pulse"
                                />
                            ))}
                        </>
                    ) : (
                        categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={
                                    selectedCategory === category.id
                                        ? "px-6 py-2.5 rounded-full text-sm font-['Almarai'] font-bold transition-all whitespace-nowrap bg-cyan-400 text-[#00373a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]"
                                        : "px-6 py-2.5 rounded-full text-sm font-['Almarai'] transition-all whitespace-nowrap bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#c2c7ce] hover:border-cyan-400/50"
                                }
                            >
                                {category.name}
                            </button>
                        ))
                    )}
                </div>

                {/* Search Input - Glass Style per LEGACY_POS_SPEC */}
                <div className="flex-1 relative">
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 px-4 pr-12 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-base text-[#e2e2e6] placeholder:text-[#c2c7ce] font-['Almarai'] focus:outline-none focus:border-cyan-400/50 transition-all"
                        dir="rtl"
                        placeholder="ابحث عن منتج..."
                    />
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#c2c7ce]" />
                </div>
            </div>

            {/* Products Grid - Improved density with 5 columns on XL */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Loading State */}
                {productsLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-64 bg-[rgba(255,255,255,0.05)] rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                )}

                {/* Error State */}
                {isError && (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <AlertCircle className="w-16 h-16 text-red-400" />
                        <div className="text-center">
                            <h3 className="text-lg font-['Almarai'] font-bold text-[#e2e2e6] mb-2">
                                حدث خطأ في تحميل المنتجات
                            </h3>
                            <p className="text-sm text-[#c2c7ce] mb-4">
                                {error?.message || 'يرجى المحاولة مرة أخرى'}
                            </p>
                            <Button onClick={() => refetch()}>
                                إعادة المحاولة
                            </Button>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!productsLoading && !isError && products.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="text-center">
                            <h3 className="text-lg font-['Almarai'] font-bold text-[#e2e2e6] mb-2">
                                لا توجد منتجات
                            </h3>
                            <p className="text-sm text-[#c2c7ce]">
                                {searchTerm
                                    ? 'لم يتم العثور على منتجات تطابق بحثك'
                                    : 'لا توجد منتجات في هذه الفئة'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Products Grid - Improved density: 2/3/4/5 columns */}
                {!productsLoading && !isError && products.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
                        {products.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                index={index} // Pass index for stagger animation (30ms delay)
                                onClick={onAddToCart || ((product) => {
                                    console.log('Add to cart:', product.name);
                                })}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
