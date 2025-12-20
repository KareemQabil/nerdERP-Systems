import { useState } from 'react';
import { POSLayout } from '@/shared/components/organisms/POSLayout';
import { MainNavigation } from '@/shared/components/organisms/MainNavigation';
import { ProductBrowser } from '@/shared/components/organisms/ProductBrowser';
import { CartPanel } from '@/shared/components/organisms/CartPanel';
import { POSBottomBar } from '@/shared/components/organisms/POSBottomBar';
import { ProductDetailsModal } from '@/modules/menu/components/ProductDetailsModal/ProductDetailsModal';
import { PaymentModal } from '@/modules/sales/components/PaymentModal/PaymentModal';
import { OrderTypeModal } from '@/modules/sales/components/OrderTypeModal/OrderTypeModal';
import { OrdersHistoryModal } from '@/modules/sales/components/OrdersHistory/OrdersHistoryModal';
import { ShiftControlModal } from '@/modules/shifts/components/ShiftControlModal';
import { OpenShiftModal } from '@/modules/shifts/components/OpenShiftModal';
import { ScreenLockModal } from '@/modules/auth/components/ScreenLockModal';
import { useCartStore } from '@/modules/sales/store/cartStore';
import { useShiftStore } from '@/modules/shifts/store/shiftStore';
import { useScreenLockStore } from '@/modules/auth/store/screenLockStore';
import { useHeldOrdersStore } from '@/modules/sales/store/heldOrdersStore';
import toast from 'react-hot-toast';
import { HeldOrdersModal } from '@/modules/sales/components/HeldOrdersModal/HeldOrdersModal';
import { PrintPreviewModal } from '@/shared/components/modals/PrintPreviewModal/PrintPreviewModal';
import type { Product } from '@/modules/products/types/product.types';
import type { CartItem } from '@/modules/sales/store/cartStore';

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
    const { addItem, items, clearCart, getTotals, sendToKitchen, orderType } = useCartStore();
    const { isShiftOpen } = useShiftStore();
    const { isLocked, lock } = useScreenLockStore();
    const { holdOrder, heldOrders } = useHeldOrdersStore();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
    const [showHeldOrders, setShowHeldOrders] = useState(false); // PHASE 4: Held Orders Manager
    const [showShiftControl, setShowShiftControl] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showOrdersHistory, setShowOrdersHistory] = useState(false);
    // PHASE 4: Print Preview Modal State
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [printPreviewData, setPrintPreviewData] = useState<CartItem[]>([]);
    const [printPreviewType, setPrintPreviewType] = useState<'KITCHEN_ORDER' | 'KITCHEN_VOID'>('KITCHEN_ORDER');
    const [printPreviewMetadata, setPrintPreviewMetadata] = useState<any>({});

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

    const handleKitchen = () => {
        // SHIFT GUARD
        if (!isShiftOpen) {
            toast.error('⚠️ Please open a shift first!');
            return;
        }

        if (items.length === 0) {
            toast.error('❌ السلة فارغة / Cart is empty');
            return;
        }

        // Count NEW items (restaurant workflow)
        const newItems = items.filter(item => item.status === 'NEW');

        if (newItems.length === 0) {
            toast.error('ℹ️ No new items to send! All items already sent to kitchen.');
            return;
        }

        // ✅ PHASE 4: Open Print Preview Modal instead of direct print
        setPrintPreviewData(newItems);
        setPrintPreviewType('KITCHEN_ORDER');
        setPrintPreviewMetadata({ tableName: 'Table Order' });
        setShowPrintPreview(true);
    };

    // Handler: Confirm Print (from PrintPreviewModal)
    const handleConfirmPrint = () => {
        // Send to kitchen (marks items as SENT)
        const sentItems = sendToKitchen('Table Order');

        // Close modal
        setShowPrintPreview(false);

        // User feedback
        toast.success(`👨‍🍳 Sent ${sentItems.length} item(s) to kitchen`, { duration: 3000 });
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

    // Handler: Hold Order (PHASE 4: Smart Context Preservation)
    const handleHold = () => {
        if (items.length === 0) {
            toast.error('❌ السلة فارغة / Cart is empty');
            return;
        }

        let customerName: string | null = null;
        let tableName: string | null = null;
        let tableId: string | null = null;

        // Smart Hold Logic based on Order Type
        if (orderType === 'DINE_IN') {
            // Table Hold: Prompt for table name (or use existing if available)
            tableName = window.prompt('📋 Table Hold\n\nEnter table number/name:');
            if (!tableName) {
                toast.error('❌ Table name required for Dine-In hold');
                return;
            }
            tableId = `table-${tableName.toLowerCase().replace(/\s/g, '-')}`;
        } else {
            // Parking Hold: Optional customer name for reference
            customerName = window.prompt('👤 Parking Order\n\nOptional: Enter customer name for reference:') || 'Walk-in';
        }

        // Hold the order with context
        const holdId = holdOrder(
            items,
            orderType,
            tableId || undefined,
            tableName || undefined,
            customerName || undefined,
            undefined // optional note
        );

        // Clear cart after successful hold
        clearCart();

        // User Feedback
        if (orderType === 'DINE_IN' && tableName) {
            toast.success(`🍽️ Table ${tableName} order held successfully`);
        } else {
            toast.success(`📦 Order parked${customerName ? ` for ${customerName}` : ''} successfully`);
        }

        console.log(`✅ [POSPage] Order held:`, {
            holdId,
            orderType,
            itemCount: items.length,
            sentItems: items.filter(i => i.status === 'SENT').length,
            tableId,
            tableName,
            customerName,
        });
    };

    // Handler: Refund
    const handleRefund = () => {
        console.log('Refund order');
        // TODO: Implement refund
    };

    // Handler: Order Type Selection (PHASE 4: Opens Modal)
    const handleOrderTypeClick = () => {
        setShowOrderTypeModal(true);
        console.log('📋 Opening Order Type Selection Modal');
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

    // Handler: Held Orders (PHASE 4: View/Resume held orders)
    const handleHeldOrders = () => {
        setShowHeldOrders(true);
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
                                onCycleOrderType={handleOrderTypeClick} // PHASE 4: Opens OrderTypeModal
                                onHeldOrders={handleHeldOrders} // PHASE 4: Opens HeldOrdersModal
                                userName="Ahmed"
                                // Restaurant Workflow
                                orderType={orderType}
                                newItemsCount={items.filter(i => i.status === 'NEW').length}
                                heldOrdersCount={heldOrders.length} // PHASE 4: Badge count
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

                    {/* HeldOrdersModal (PHASE 4: Conditional) */}
                    {showHeldOrders && (
                        <HeldOrdersModal
                            onClose={() => setShowHeldOrders(false)}
                        />
                    )}

                    {/* PrintPreviewModal (PHASE 4: Conditional) */}
                    {showPrintPreview && (
                        <PrintPreviewModal
                            isOpen={showPrintPreview}
                            type={printPreviewType}
                            data={printPreviewData}
                            metadata={printPreviewMetadata}
                            onConfirm={handleConfirmPrint}
                            onCancel={() => setShowPrintPreview(false)}
                        />
                    )}
                </>
            )}

            {/* GLOBAL SCREEN LOCK GUARD: Renders on top of EVERYTHING */}
            {isLocked && <ScreenLockModal />}
        </>
    );
}
