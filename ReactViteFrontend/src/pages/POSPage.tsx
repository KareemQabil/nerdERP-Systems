import { POSLayout } from '@/shared/components/organisms/POSLayout';
import { MainNavigation } from '@/shared/components/organisms/MainNavigation';
import { ProductBrowser } from '@/shared/components/organisms/ProductBrowser';
import { CartPanel } from '@/shared/components/organisms/CartPanel';
import { POSBottomBar } from '@/shared/components/organisms/POSBottomBar';
import { useCartStore } from '@/modules/sales/store/cartStore';
import type { Product } from '@/modules/products/types/product.types';

/**
 * POSPage - Main POS Controller
 * 
 * Responsibilities:
 * - Wire ProductBrowser to cart store
 * - Pass navigation handlers
 * - Connect all organisms through POSLayout
 * - Manage global POS state
 * 
 * Layout Structure:
 * - POSLayout manages cart toggle state
 * - MainNavigation on right (z-50)
 * - CartPanel on left (z-40, toggleable)
 * - ProductBrowser in center (responsive)
 * - POSBottomBar at bottom (z-60, highest)
 */
export default function POSPage() {
    const { addItem } = useCartStore();

    // Handler: Add product to cart
    const handleAddToCart = (product: Product) => {
        addItem(product, '1.000'); // Default quantity
        console.log('Added to cart:', product.name);
        // TODO: Show toast notification
    };

    // Handler: Navigation
    const handleNavigate = (route: string) => {
        console.log('Navigate to:', route);
        // TODO: Implement routing
    };

    // Handler: Payment
    const handlePay = () => {
        console.log('Open payment modal');
        // TODO: Open payment modal
    };

    // Handler: Print
    const handlePrint = () => {
        console.log('Print order');
        // TODO: Implement print functionality
    };

    // Handler: Kitchen
    const handleKitchen = () => {
        console.log('Send to kitchen');
        // TODO: Implement kitchen order
    };

    // Handler: Hold
    const handleHold = () => {
        console.log('Hold order');
        // TODO: Implement hold order
    };

    // Handler: Refund
    const handleRefund = () => {
        console.log('Refund order');
        // TODO: Implement refund
    };

    return (
        <POSLayout
            navigation={
                <MainNavigation
                    activeRoute="/pos"
                    onNavigate={handleNavigate}
                />
            }
            productBrowser={
                <ProductBrowser
                    onAddToCart={handleAddToCart}
                />
            }
            cartPanel={
                <CartPanel />
            }
            bottomBar={
                <POSBottomBar
                    onPay={handlePay}
                    onPrint={handlePrint}
                    onKitchen={handleKitchen}
                    onHold={handleHold}
                    onRefund={handleRefund}
                    userName="Ahmed"
                    shiftStatus="Morning Shift"
                />
            }
        />
    );
}
