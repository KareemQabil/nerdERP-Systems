import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { POSLayout } from '@/shared/components/organisms/POSLayout';
import { MainNavigation } from '@/shared/components/organisms/MainNavigation';
import { ProductBrowser } from '@/shared/components/organisms/ProductBrowser';
import { CartPanel } from '@/shared/components/organisms/CartPanel';
import { POSBottomBar } from '@/shared/components/organisms/POSBottomBar';
import { ProductDetailsModal } from '@/modules/menu/components/ProductDetailsModal/ProductDetailsModal';
import { KitchenTicket } from '@/modules/sales/components/KitchenTicket/KitchenTicket';
import { KitchenPreviewModal } from '@/modules/sales/components/KitchenPreviewModal/KitchenPreviewModal';
import { PaymentModal } from '@/modules/sales/components/PaymentModal/PaymentModal';
import { OrderTypeModal } from '@/modules/sales/components/OrderTypeModal/OrderTypeModal';
import { OrdersHistoryModal } from '@/modules/sales/components/OrdersHistory/OrdersHistoryModal';
import { ShiftControlModal } from '@/modules/shifts/components/ShiftControlModal';
import { OpenShiftModal } from '@/modules/shifts/components/OpenShiftModal';
import { ScreenLockModal } from '@/modules/auth/components/ScreenLockModal';
import { useCartStore } from '@/modules/sales/store/cartStore';
import { useShiftStore } from '@/modules/shifts/store/shiftStore';
import { useScreenLockStore } from '@/modules/auth/store/screenLockStore';
import type { Product } from '@/modules/products/types/product.types';

/**
 * POSPage - Main POS Controller (PHASE 5: Complete with Table Selection)
 * 
 * Integrations:
 * - ShiftStore: Validates shift open before critical actions
 * - TableStore: Manages table assignments via TableSelectorModal
 * - KitchenTicket: Prints kitchen orders
 * - Smart Modifiers: Opens modal only if product has modifiers
 * 
 * UX Rules:
 * - Products without modifiers → Direct add to cart
 * - Products with modifiers → Open ProductDetailsModal
 * - All checkout actions → Require open shift
 * - Table selection → Updates cart orderType to DINE_IN
 */
export default function POSPage() {
    const { addItem, items, clearCart, getTotals, sendToKitchen, orderType, setOrderType } = useCartStore();
    const { isShiftOpen } = useShiftStore();
    const { isLocked, lock } = useScreenLockStore();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
    const [showShiftControl, setShowShiftControl] = useState(false);
    const [showKitchenPreview, setShowKitchenPreview] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showOrdersHistory, setShowOrdersHistory] = useState(false);
    const kitchenTicketRef = useRef<HTMLDivElement>(null);

    // Handler: Smart Modifiers Logic
    const handleProductClick = (product: Product) => {
        // Check if product has modifiers
        const hasModifiers = product.modifiers && product.modifiers.length > 0;

        if (hasModifiers) {
            // Open modal for customization
            setSelectedProduct(product);
            console.log('Opening modifier modal for:', product.name);
        } else {
            // Add directly to cart (e.g., water bottle)
            addItem(product, '1.000');
            console.log('Added directly to cart (no modifiers):', product.name);
        }
    };

    // Handler: Add to cart with modifiers (from modal)
    const handleAddToCartWithModifiers = (
        product: Product,
        quantity: string,
        modifiers: any[],
        instructions: string
    ) => {
        addItem(product, quantity, modifiers, instructions);
        console.log('Added to cart with modifiers:', {
            product: product.name,
            quantity,
            modifiers,
            instructions,
        });
    };

    // Handler: Close modal
    const handleCloseModal = () => {
        setSelectedProduct(null);
    };

    // Handler: Kitchen Print
    const handlePrintKitchen = useReactToPrint({
        contentRef: kitchenTicketRef,
    });

    const handleKitchen = () => {
        // SHIFT GUARD
        if (!isShiftOpen) {
            alert('⚠️ Please open a shift first!');
            return;
        }

        if (items.length === 0) {
            alert('السلة فارغة');
            return;
        }

        // Count NEW items (restaurant workflow)
        const newItems = items.filter(item => item.status === 'NEW');

        if (newItems.length === 0) {
            alert('ℹ️ No new items to send! All items already sent to kitchen.');
            return;
        }

        // Send to kitchen (delta print - only NEW items marked as SENT)
        const sentItems = sendToKitchen('Table Order');

        console.log(`✅ Sent ${sentItems.length} items to kitchen (delta print)`);

        // Show kitchen preview briefly
        setShowKitchenPreview(true);
        setTimeout(() => setShowKitchenPreview(false), 2000);

        // Trigger print
        setTimeout(() => handlePrintKitchen(), 300);
    };

    // Handler: Confirm Kitchen Print (from KitchenPreviewModal)
    const handleConfirmKitchenPrint = (referenceNote: string) => {
        // Trigger print
        if (handlePrintKitchen) {
            handlePrintKitchen();
        }

        console.log('Kitchen ticket printed for:', referenceNote);
        setShowKitchenPreview(false);
    };

    // Handler: Navigation
    const handleNavigate = (route: string) => {
        console.log('Navigate to:', route);
        // TODO: Implement routing
    };

    // Handler: Payment (with shift validation)
    const handlePay = () => {
        // SHIFT GUARD
        if (!isShiftOpen) {
            alert('⚠️ Please open a shift first!');
            return;
        }

        if (items.length === 0) {
            alert('السلة فارغة');
            return;
        }

        setShowPayment(true);
    };

    // Handler: Payment Confirmation
    const handlePaymentConfirm = (paymentMethod: any, cashTendered?: string) => {
        console.log('Payment confirmed:', { paymentMethod, cashTendered });

        // TODO: Create order in backend
        // TODO: Print receipt

        // Clear cart
        clearCart();
        setShowPayment(false);

        alert('✅ Payment successful!');
    };

    // Handler: Print
    const handlePrint = () => {
        console.log('Print order');
        // TODO: Implement receipt print
    };

    // Handler: Hold
    const handleHold = () => {
        if (items.length === 0) {
            alert('السلة فارغة');
            return;
        }

        console.log('Hold order');
        // TODO: Implement hold order
    };

    // Handler: Refund
    const handleRefund = () => {
        console.log('Refund order');
        // TODO: Implement refund
    };

    // Handler: Order Type Selection (Takeaway or Dine-In)
    const handleOrderType = () => {
        setShowOrderTypeModal(true);
    };

    // Handler: Cycle Order Type (TAKEAWAY → DINE_IN → DELIVERY)
    const handleCycleOrderType = () => {
        if (orderType === 'TAKEAWAY') {
            setOrderType('DINE_IN');
        } else if (orderType === 'DINE_IN') {
            setOrderType('DELIVERY');
        } else if (orderType === 'DELIVERY') {
            setOrderType('DELIVERY_UBEREATS');
        } else {
            setOrderType('TAKEAWAY');
        }
        console.log(`🔄 Order type cycled to: ${orderType}`);
    };

    // Handler: Orders History
    const handleOrders = () => {
        setShowOrdersHistory(true);
    };

    // Handler: Shift Control
    const handleShiftControl = () => {
        setShowShiftControl(true);
        console.log('Opening shift control');
    };

    // Handler: Lock Screen
    const handleLock = () => {
        const pin = window.prompt('أدخل رمز PIN (4 أرقام)\nEnter 4-digit PIN:');

        if (!pin) return;

        if (pin.length !== 4 || isNaN(Number(pin))) {
            alert('⚠️ PIN must be exactly 4 digits');
            return;
        }

        lock(pin, 'Cashier'); // Lock with PIN
        console.log('🔒 Screen locked');
    };

    return (
        <>
            {/* SHIFT LOCK: Force OpenShiftModal if no shift is open */}
            {!isShiftOpen ? (
                <OpenShiftModal
                    onShiftOpened={() => {
                        console.log('✅ Shift opened - POS unlocked');
                        // Modal will close itself, POS will re-render with isShiftOpen=true
                    }}
                />
            ) : (
                <>
                    <POSLayout
                        navigation={
                            <MainNavigation
                                activeRoute="/pos"
                                onNavigate={handleNavigate}
                                onShift={handleShiftControl}
                                onLock={handleLock}
                            />
                        }
                        productBrowser={
                            <ProductBrowser
                                onAddToCart={handleProductClick}
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
                                onOrders={handleOrders}
                                onCycleOrderType={handleCycleOrderType}
                                userName="Ahmed"
                                // Restaurant Workflow
                                orderType={orderType}
                                newItemsCount={items.filter(i => i.status === 'NEW').length}
                            />
                        }
                    />

                    {/* ProductDetailsModal (Conditional - Only for products with modifiers) */}
                    {selectedProduct && (
                        <ProductDetailsModal
                            product={selectedProduct}
                            onClose={handleCloseModal}
                            onAddToCart={handleAddToCartWithModifiers}
                        />
                    )}

                    {/* OrderTypeModal (Conditional) */}
                    {showOrderTypeModal && (
                        <OrderTypeModal
                            onClose={() => setShowOrderTypeModal(false)}
                        />
                    )}

                    {/* ShiftControlModal (Conditional) */}
                    {showShiftControl && (
                        <ShiftControlModal
                            onClose={() => setShowShiftControl(false)}
                        />
                    )}

                    {/* PaymentModal (Conditional) */}
                    {showPayment && (
                        <PaymentModal
                            total={getTotals().total}
                            onConfirm={handlePaymentConfirm}
                            onClose={() => setShowPayment(false)}
                        />
                    )}

                    {/* OrdersHistoryModal (Conditional) */}
                    {showOrdersHistory && (
                        <OrdersHistoryModal
                            onClose={() => setShowOrdersHistory(false)}
                        />
                    )}

                    {/* Hidden Kitchen Ticket for Printing */}
                    <div style={{ display: 'none' }}>
                        <KitchenTicket
                            ref={kitchenTicketRef}
                            items={items}
                            referenceNote="COUNTER ORDER"
                        />
                    </div>
                </>
            )}

            {/* GLOBAL SCREEN LOCK GUARD: Renders on top of EVERYTHING */}
            {isLocked && <ScreenLockModal />}
        </>
    );
}
