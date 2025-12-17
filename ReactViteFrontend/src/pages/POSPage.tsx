import { MainNavigation } from '@/shared/components/organisms/MainNavigation';
import { ProductBrowser } from '@/shared/components/organisms/ProductBrowser';
import { CartPanel } from '@/shared/components/organisms/CartPanel';
import { POSBottomBar } from '@/shared/components/organisms/POSBottomBar';
import { POSLayout } from '@/shared/components/organisms/POSLayout';

/**
 * POS Page
 * Professional Point of Sale interface
 * 
 * Components:
 * - MainNavigation (right sidebar)
 * - ProductBrowser (center - categories, search, products grid)
 * - CartPanel (left - cart items, summary, checkout)
 * - POSBottomBar (bottom - PAY button, actions, user info)
 */
export default function POSPage() {
    const handlePay = () => {
        console.log('Opening payment modal...');
        // TODO: Open payment modal
    };

    const handlePrint = () => {
        console.log('Printing receipt...');
    };

    const handleKitchen = () => {
        console.log('Sending to kitchen...');
    };

    const handleHold = () => {
        console.log('Holding order...');
    };

    const handleRefund = () => {
        console.log('Processing refund...');
    };

    const handleNavigate = (route: string) => {
        console.log('Navigate to:', route);
        // TODO: Implement routing
    };

    return (
        <POSLayout
            navigation={
                <MainNavigation
                    activeRoute="/pos"
                    onNavigate={handleNavigate}
                />
            }
            productBrowser={<ProductBrowser />}
            cartPanel={<CartPanel />}
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
