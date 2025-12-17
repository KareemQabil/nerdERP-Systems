import { Outlet, useNavigate } from 'react-router-dom';
import { MainNavigation } from './MainNavigation';
import { Header } from './Header';
import { CartSidebar } from '@/modules/sales/components/CartSidebar';
import { BottomActionBar } from './BottomActionBar';
import { useCartStore } from '@/modules/sales/store/cartStore';
import { cn } from '@/lib/utils';

export const MainLayout = () => {
    const isCartOpen = useCartStore((state) => state.isCartOpen);
    const navigate = useNavigate();

    // Event dispatcher for modal triggers from BottomActionBar to OrdersPage
    const triggerModal = (type: string) => {
        window.dispatchEvent(new CustomEvent('pos-modal-trigger', { detail: { type } }));
    };

    return (
        <div className="h-screen w-screen bg-gradient-to-br from-[#0A1929] to-[#132F4C] overflow-hidden font-sans" dir="rtl">
            {/* Optimized Grid: Navigation (fixed) | Content (flex) | Cart (conditional) */}
            <div className="h-full w-full grid grid-cols-[80px_1fr_auto] transition-all duration-300">

                {/* Column 1: Navigation Sidebar - Fixed 80px width, z-40 */}
                <div className="h-full relative z-40">
                    <MainNavigation />
                </div>

                {/* Column 2: Main Content Area - Flexible, z-10 */}
                <div className="h-full flex flex-col overflow-hidden bg-transparent relative z-10">
                    {/* Header - Fixed height, flex-shrink-0 */}
                    <div className="flex-shrink-0">
                        <Header />
                    </div>

                    {/* Main Content - Flexible growth, scrollable, with bottom padding for action bar */}
                    <main className="flex-1 min-h-0 p-4 overflow-y-auto pb-28 scrollbar-thin scrollbar-thumb-cyan-400/30 scrollbar-track-transparent">
                        <Outlet />
                    </main>

                    {/* Bottom Action Bar - Fixed position at bottom, z-50 */}
                    <div className="fixed bottom-0 left-0 right-0 z-50" style={{ right: isCartOpen ? '400px' : '0' }}>
                        <BottomActionBar
                            onCheckout={() => triggerModal('payment')}
                            onApplyDiscount={() => triggerModal('discount')}
                            onSelectCustomer={() => triggerModal('customer')}
                            onHoldOrder={() => triggerModal('hold')}
                            onRetrieveOrder={() => triggerModal('holdOrders')}
                            onPrintReceipt={() => triggerModal('receipt')}
                            onViewOrders={() => navigate('/orders-list')}
                            onSendToKitchen={() => triggerModal('kitchen')}
                        />
                    </div>
                </div>

                {/* Column 3: Cart Sidebar - Auto width (0 or 400px), z-60 */}
                <div
                    className={cn(
                        "h-full border-r border-white/5 relative z-60 shadow-2xl overflow-hidden transition-all duration-300",
                        isCartOpen ? "w-[400px] opacity-100" : "w-0 opacity-0 pointer-events-none"
                    )}
                >
                    <CartSidebar />
                </div>
            </div>
        </div>
    );
};
