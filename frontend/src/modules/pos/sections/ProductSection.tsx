/**
 * Product Section Component
 * Displays category navigation and product grid
 */
import { useState } from 'react';
import { useProducts } from '@/modules/products';
import type { ProductQueryParams } from '@/modules/products';

interface ProductSectionProps {
    onProductClick: (product: any) => void;
}

export function ProductSection({ onProductClick }: ProductSectionProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [search, setSearch] = useState('');

    const params: ProductQueryParams = {
        categoryId: selectedCategory,
        search: search || undefined,
        isActive: true,
        includeModifiers: true,
    };

    const { data, isLoading, error } = useProducts(params);

    return (
        <div className="product-section">
            {/* Search Bar */}
            <div className="product-section__search">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="product-section__search-input"
                />
            </div>

            {/* Category Bar */}
            <div className="product-section__categories">
                <button
                    className={`category-btn ${!selectedCategory ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(undefined)}
                >
                    All
                </button>
                {/* Categories would be loaded and mapped here */}
            </div>

            {/* Product Grid */}
            <div className="product-section__grid">
                {isLoading && <div className="loading">Loading products...</div>}
                {error && <div className="error">Error loading products</div>}
                {data?.data?.map((product) => (
                    <div
                        key={product.id}
                        className="product-card"
                        onClick={() => onProductClick(product)}
                    >
                        <div className="product-card__name">{product.name}</div>
                        <div className="product-card__price">
                            {product.salePrice.toFixed(2)} SAR
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
