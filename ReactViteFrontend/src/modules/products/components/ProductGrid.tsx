import type { Product } from '@/modules/products/hooks/useProducts';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
    products: Product[];
    onSmartClick: (product: Product) => void;
}

export const ProductGrid = ({ products, onSmartClick }: ProductGridProps) => {
    return (
        <div className="grid grid-cols-5 gap-3">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onSmartClick={onSmartClick}
                />
            ))}
        </div>
    );
};
