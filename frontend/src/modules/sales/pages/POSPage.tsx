/**
 * POSPage - Main Point of Sale Screen
 * Clean orchestration component for the POS interface
 * Now with API integration and smart fallback to mock data
 */
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/stores/settings.store';
import { useCartStore, useCartTotals } from '@/stores/cart.store';
import { useOrderStore, type HeldOrder } from '@/stores/order.store';
import { useAuthStore } from '@/stores/auth.store';
import { useConfigStore } from '@/stores/config.store';
import { useFeedback, FeedbackBar } from '@/components/feedback';
import { Input } from '@/components/ui';
import { CategoryPills, ProductCard } from '@/components/shared';
import { Feature } from '@/components/core';
import { useFeature } from '@/hooks';
import { cn } from '@/lib/utils';

// POS Components
import { CartPanel } from '../components/CartPanel';
import { POSActionBar } from '../components/POSActionBar';
import { DiscountModal, type DiscountConfig } from '../components/DiscountModal';
import { CheckoutModal, type PaymentEntry } from '../components/CheckoutModal';
import { ModifierModal } from '../components/ModifierModal';
import { HeldOrdersModal } from '../components/HeldOrdersModal';
import { CustomerSearchModal } from '../components/CustomerSearchModal';
import { OrderNotesModal } from '../components/OrderNotesModal';
import { ManagerPinModal } from '../components/ManagerPinModal';
import { DemoModeIndicator } from '../components/DemoModeBanner';
import { CloseSessionModal } from '../components/CloseSessionModal';
import { ManagerEODModal } from '../components/ManagerEODModal';
import { EditCartItemModal } from '../components/EditCartItemModal';
import { ProductGridSkeleton, CategoryPillsSkeleton } from '../components/skeletons';
import { OpenSessionModal } from '../components/OpenSessionModal';
import { TableSelectionModal } from '../components/TableSelectionModal';
import { VoidOrderModal } from '../components/VoidOrderModal';
import { OrderLookupModal } from '../components/OrderLookupModal';

// Hooks & Mappers
import { usePOSData, useOfflineSync } from '../hooks';
import { mapProductToProductInfo, createAllCategory, mapCategoryToPillProps } from '../utils/mappers';

// Stores & Services
import { useSession } from '@/stores/session.store';
import { orderService } from '@/services/order.service';
import { printingService } from '@/services/printing.service';

// Order types constant (these don't come from API)
import { orderTypes } from '@/data/mock-pos-data';

// Types
import type { CustomerInfo, PinAuthorizationRequest } from '@/types/pos.types';
import type { CartItem } from '@/stores/cart.store';

export default function POSPage() {
    const { t } = useTranslation(['pos', 'common']);
    const { language, theme } = useSettingsStore();

    // Use useCartTotals for computed values (prevents infinite loops!)
    const { itemCount, subtotal, taxAmount, total } = useCartTotals();

    // Only destructure action methods, not getter methods
    const { addItem, clearCart, setCustomer, setNotes } = useCartStore();
    const { holdOrder, recallOrder } = useOrderStore();
    const { verifyPin, requiresManagerAuth, currentUser } = useAuthStore();
    const { posConfig, store } = useConfigStore();
    const { messages, dismissFeedback, success, error: showError } = useFeedback();

    // Session Management
    const {
        session,
        isOpen: isSessionOpen,
        sessionId,
        warehouseId,
        isLoading: isSessionLoading,
        error: sessionError,
        openSession,
        closeSession,
        initializeSession,
    } = useSession();

    // Feature flags
    const canHoldOrders = useFeature('pos.holdOrders');
    const canSearchCustomers = useFeature('customers.search');
    const canSplitPayments = useFeature('pos.splitPayments');

    // Get enabled order types from config
    const enabledOrderTypes = orderTypes.filter((type) => {
        // Convert type.id (kebab-case) to posConfig format (SCREAMING_SNAKE_CASE)
        const configKey = type.id.toUpperCase().replace('-', '_');
        return posConfig.enabledOrderTypes.includes(configKey as any);
    });

    // UI State
    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedOrderType, setSelectedOrderType] = useState(posConfig.defaultOrderType.toLowerCase().replace('_', '-'));
    const [isOrderTypeOpen, setIsOrderTypeOpen] = useState(false);

    // Modal States
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
    const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isOrderNotesModalOpen, setIsOrderNotesModalOpen] = useState(false);
    const [isManagerPinModalOpen, setIsManagerPinModalOpen] = useState(false);
    const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
    const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
    const [isEODModalOpen, setIsEODModalOpen] = useState(false);
    const [isTableSelectionModalOpen, setIsTableSelectionModalOpen] = useState(false);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
    const [isValidatingPayment, setIsValidatingPayment] = useState(false);
    const [isCheckoutSuccess, setIsCheckoutSuccess] = useState(false);
    const [reservationId, setReservationId] = useState<string | null>(null);
    // Store completed order data for displaying QR code
    const [completedOrderData, setCompletedOrderData] = useState<{
        orderNumber: string;
        zatcaQrCode?: string;
        orderId?: string;
    } | null>(null);

    // Selected Items
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
    const [pendingPinRequest, setPendingPinRequest] = useState<PinAuthorizationRequest | null>(null);
    const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
    const [selectedTable, setSelectedTable] = useState<{ id: string; tableNumber: string } | null>(null);
    // Returns/Void flow
    const [isOrderLookupModalOpen, setIsOrderLookupModalOpen] = useState(false);
    const [orderToVoid, setOrderToVoid] = useState<{ id: string; orderNumber: string; total: string } | null>(null);

    const { pendingCount, isSyncing, saveFailedOrder, syncOrders } = useOfflineSync();



    // === API DATA WITH SMART FALLBACK ===
    const {
        categories: apiCategories,
        products: apiProducts,
        isLoading,
        isUsingMockData,
    } = usePOSData({
        categoryId: selectedCategory,
        searchQuery: debouncedSearch,
        enableFallback: true,
    });

    // Debounce search query - use useEffect, not useMemo!
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Map categories for UI (add 'All' category)
    const categories = useMemo(() => {
        const all = createAllCategory();
        const mapped = apiCategories.map(mapCategoryToPillProps);
        return [all, ...mapped];
    }, [apiCategories]);

    // Products are already filtered by API/fallback
    const products = apiProducts;

    // Computed
    const availableOrderTypes = enabledOrderTypes.length > 0 ? enabledOrderTypes : orderTypes;
    const selectedOrderTypeData = availableOrderTypes.find(t => t.id === selectedOrderType) || availableOrderTypes[0];
    const OrderTypeIcon = selectedOrderTypeData?.icon || orderTypes[0].icon;

    // Handlers
    const handleAddProduct = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (product) {
            addItem(mapProductToProductInfo(product));
            success(t('feedback.productAdded', { name: language === 'ar' ? (product.nameAr || product.name) : product.name }));
        }
    };

    const handleCustomizeProduct = (productId: string) => {
        setSelectedProductId(productId);
        setIsModifierModalOpen(true);
    };

    const handleApplyDiscount = (discount: DiscountConfig) => {
        console.log('Discount applied:', discount);
        success(t('feedback.discountApplied', 'Discount applied!'));
    };

    /**
     * Pre-validation before opening payment modal
     * 1. Reserve inventory (prevent overselling)
     * 2. Validate required modifiers
     */
    const handlePaymentClick = async () => {
        const cartItems = useCartStore.getState().items;

        if (cartItems.length === 0) {
            showError('Cart is empty');
            return;
        }

        setIsValidatingPayment(true);

        try {
            // 1. Validate required modifiers
            const invalidItems = cartItems.filter((item: CartItem) =>
                item.product.modifierGroups?.some((group: any) =>
                    group.isRequired && !item.modifiers.some((m: any) => m.modifierGroupId === group.id)
                )
            );

            if (invalidItems.length > 0) {
                showError(`Missing required modifiers for: ${invalidItems.map((i: CartItem) => i.product.name).join(', ')}`);
                setIsValidatingPayment(false);
                return;
            }

            // 2. Reserve inventory stock
            const { apiClient } = await import('@/lib/api-client');
            const response = await apiClient.post('/api/v1/inventory/reserve', {
                warehouseId: warehouseId,
                sessionId: session?.id,
                items: cartItems.map((item: CartItem) => ({
                    productId: item.product.id,
                    quantity: parseFloat(item.quantity)
                }))
            });

            if (!response.data.success) {
                showError(`Stock unavailable: ${response.data.unavailableItems?.join(', ') || 'Unknown items'}`);
                setIsValidatingPayment(false);
                return;
            }

            // Save reservation ID for cleanup
            setReservationId(response.data.data.reservationId);

            // Open checkout modal
            setIsCheckoutModalOpen(true);
        } catch (err: any) {
            showError('Failed to validate payment. Please try again.');
            console.error('Payment validation error:', err);
        } finally {
            setIsValidatingPayment(false);
        }
    };

    // Initialize session on mount - show modal if no session
    useEffect(() => {
        const checkSession = async () => {
            await initializeSession();
        };
        checkSession();
    }, [initializeSession]);

    // Show session modal if no active session (after initialization completes, but not during order submission)
    useEffect(() => {
        // Only show modal if:
        // 1. Not loading
        // 2. No active session
        // 3. Not in the middle of submitting an order
        if (!isSessionLoading && !isSessionOpen && !isSubmittingOrder) {
            setIsOpenSessionModalOpen(true);
        }
    }, [isSessionOpen, isSessionLoading, isSubmittingOrder]);

    // Handle checkout with API integration
    const handleCheckoutComplete = async (payments: PaymentEntry[]) => {
        // Require session for order submission
        if (!sessionId) {
            setIsOpenSessionModalOpen(true);
            showError(t('session.required', 'Please open a session first'));
            return;
        }

        const cartState = useCartStore.getState();
        const items = cartState.getActiveItems();

        if (items.length === 0) {
            showError(t('feedback.emptyCart', 'Cart is empty'));
            return;
        }

        setIsSubmittingOrder(true);

        let orderPayload: any = null;

        try {
            // Get cart context
            const { orderType, customer, table, notes } = cartState;

            // Build order DTO for backend with modifiers and context
            orderPayload = {
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: Math.max(Number(item.quantity) || 1, 0.001),
                    unitPrice: Number(item.unitPrice) || 0,
                    // Include modifiers
                    modifiers: item.modifiers?.map(m => ({
                        modifierId: m.modifierGroupId, // Use group ID as modifier ID
                        optionId: m.modifierId, // The actual modifier option ID
                        priceAdjustment: Number(m.priceAdjustment) || 0,
                        quantity: 1,
                    })) || [],
                })),
                payments: payments
                    .filter(p => Number(p.amount) >= 0.01) // Filter out empty payments
                    .map(p => ({
                        method: p.method,
                        amount: Math.max(Number(p.amount) || 0, 0.01),
                    })),
                registerSessionId: sessionId,
                warehouseId: warehouseId,
                // Order context
                orderType: orderType || 'TAKEAWAY',
                customerId: customer?.id,
                tableId: table?.id,
                notes: notes || undefined,
                reservationId: reservationId || undefined,
            };

            console.log('[POS] Submitting order:', orderPayload);

            const order = await orderService.create(orderPayload);

            console.log('[POS] Order created:', order);

            // Store order data for displaying QR code in success screen
            setCompletedOrderData({
                orderNumber: order.orderNumber,
                zatcaQrCode: order.zatcaQrCode,
                orderId: order.id,
            });

            // Trigger success animation in modal
            setIsCheckoutSuccess(true);

            // Don't wait here - let user see QR code and manually close
            // The cleanup happens when user clicks "New Order"
        } catch (error) {
            console.error('[POS] Order submission failed:', error);

            // Offline handling: if it failed due to network, save locally
            const isOffline = !navigator.onLine || (error as any)?.code === 'ERR_NETWORK' || (error as any)?.message === 'Network Error';

            if (isOffline) {
                await saveFailedOrder(orderPayload);
                // Clear cart anyway as the order is "secured" in local DB
                clearCart();
                setSelectedCustomer(null);
                setIsCheckoutModalOpen(false);
                success(t('feedback.orderSavedOffline', 'Saved locally. Will sync when online.'));
            } else {
                showError(t('feedback.orderFailed', 'Failed to create order. Please try again.'));
            }
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    // Handle finishing checkout (after user sees QR and clicks New Order)
    const handleCheckoutFinalize = () => {
        clearCart();
        setSelectedCustomer(null);
        setIsCheckoutModalOpen(false);
        setIsCheckoutSuccess(false);
        setReservationId(null);
        const orderNum = completedOrderData?.orderNumber;
        setCompletedOrderData(null);
        if (orderNum) {
            success(t('feedback.orderComplete', { orderNumber: orderNum }));
        }
    };

    // Handle opening a new session
    const handleOpenSession = async (openingBalance: number) => {
        try {
            await openSession(openingBalance);
            setIsOpenSessionModalOpen(false);
            success(t('session.opened', 'Session opened successfully'));
        } catch (error) {
            console.error('[POS] Failed to open session:', error);
            // Error is already set in store
        }
    };

    // Handle closing the current session
    const handleCloseSession = async (closingBalance: number, notes?: string) => {
        try {
            await closeSession(closingBalance, notes);
            setIsCloseSessionModalOpen(false);
            success(t('session.closed', 'Session closed successfully'));
        } catch (error) {
            console.error('[POS] Failed to close session:', error);
            showError(t('session.closeFailed', 'Failed to close session'));
        }
    };

    const handleHoldOrder = () => {
        const cartState = useCartStore.getState();
        const items = cartState.getActiveItems();
        if (items.length === 0) {
            showError(t('feedback.emptyCart', 'Cart is empty'));
            return;
        }
        // Construct held order data (cast to any to bypass type mismatches between stores)
        holdOrder({
            name: selectedCustomer?.name || `Order ${new Date().toLocaleTimeString()}`,
            nameAr: selectedCustomer?.nameAr || null,
            orderType: cartState.orderType,
            items: items as any,
            customer: selectedCustomer,
            table: cartState.table as any,
            delivery: cartState.delivery as any,
            discount: cartState.discount as any,
            notes: cartState.notes,
            heldBy: 'current-user',
            cashierName: 'Cashier',
            subtotal: cartState.getSubtotal(),
            taxAmount: cartState.getTaxAmount(),
            total: total,
        });

        clearCart();
        setSelectedCustomer(null);
        success(t('feedback.orderHeld', 'Order held'));
    };

    const handleRecallOrder = (order: HeldOrder) => {
        recallOrder(order.id);
        order.items.forEach(item => addItem(item.product));
        if (order.customer) setSelectedCustomer(order.customer);
        success(t('feedback.orderRecalled', 'Order recalled'));
    };

    const handleSelectCustomer = (customer: CustomerInfo) => {
        setSelectedCustomer(customer);
        setCustomer(customer);
        success(t('feedback.customerAdded', { name: customer.name }));
    };

    const handleSaveNotes = (notes: string) => {
        setNotes(notes);
        success(t('feedback.notesSaved', 'Notes saved'));
    };

    const handlePinAuthorize = async (pin: string, reason?: string): Promise<boolean> => {
        if (!pendingPinRequest) return false;
        const result = await verifyPin(pin, pendingPinRequest.action, reason);
        if (result.authorized) {
            if (pendingPinRequest.action === 'APPLY_DISCOUNT') setIsDiscountModalOpen(true);
            setPendingPinRequest(null);
            return true;
        }
        return false;
    };

    const handleDiscountRequest = () => {
        if (requiresManagerAuth('APPLY_DISCOUNT')) {
            setPendingPinRequest({ action: 'APPLY_DISCOUNT' });
            setIsManagerPinModalOpen(true);
        } else {
            setIsDiscountModalOpen(true);
        }
    };

    const selectedProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null;

    return (
        <div className="relative h-screen overflow-hidden">
            {/* Feedback Bar */}
            <FeedbackBar messages={messages} onDismiss={dismissFeedback} />

            {/* Main Content - Adjusts for cart on LEFT side */}
            <motion.div
                animate={{ paddingLeft: isCartExpanded ? 400 : 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="h-full flex flex-col p-4 overflow-hidden"
            >
                {/* Header */}
                <header className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
                    {/* Search */}
                    <div className="flex-1 max-w-md">
                        <Input
                            placeholder={t('searchProducts')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                            className="w-full"
                        />
                    </div>

                    {/* Demo Mode Indicator */}
                    <DemoModeIndicator isActive={isUsingMockData} />

                    {/* Order Type Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsOrderTypeOpen(!isOrderTypeOpen)}
                            data-theme={theme}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors',
                                'bg-slate-800/50 border-slate-700/50 text-white',
                                'hover:bg-slate-700/50',
                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                                'data-[theme=light]:text-slate-900 data-[theme=light]:hover:bg-slate-50',
                            )}
                        >
                            <OrderTypeIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {language === 'ar' ? selectedOrderTypeData.labelAr : selectedOrderTypeData.labelEn}
                            </span>
                            <ChevronDown className={cn('w-4 h-4 transition-transform', isOrderTypeOpen && 'rotate-180')} />
                        </button>

                        <AnimatePresence>
                            {isOrderTypeOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    data-theme={theme}
                                    className={cn(
                                        'absolute top-full mt-2 end-0 min-w-[160px] rounded-xl border shadow-xl overflow-hidden z-50',
                                        'bg-slate-800 border-slate-700',
                                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                                    )}
                                >
                                    {orderTypes.map((type) => {
                                        const Icon = type.icon;
                                        return (
                                            <button
                                                key={type.id}
                                                onClick={() => {
                                                    setSelectedOrderType(type.id);
                                                    setIsOrderTypeOpen(false);
                                                    // Show table selection for dine-in
                                                    if (type.id === 'dine-in') {
                                                        setIsTableSelectionModalOpen(true);
                                                    } else {
                                                        // Clear table if switching away from dine-in
                                                        setSelectedTable(null);
                                                    }
                                                }}
                                                data-theme={theme}
                                                className={cn(
                                                    'w-full flex items-center gap-2 px-4 py-3 text-start transition-colors',
                                                    selectedOrderType === type.id
                                                        ? 'bg-cyan-500/20 text-cyan-400 data-[theme=light]:bg-cyan-50 data-[theme=light]:text-cyan-600'
                                                        : 'text-slate-300 hover:bg-slate-700/50 data-[theme=light]:text-slate-700 data-[theme=light]:hover:bg-slate-50',
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="text-sm font-medium">
                                                    {language === 'ar' ? type.labelAr : type.labelEn}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                {/* Categories */}
                <div className="mb-4 flex-shrink-0">
                    {isLoading ? (
                        <CategoryPillsSkeleton count={6} />
                    ) : (
                        <CategoryPills
                            categories={categories}
                            selectedId={selectedCategory}
                            onSelect={setSelectedCategory}
                        />
                    )}
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <ProductGridSkeleton count={12} />
                    ) : products.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-slate-400">
                            {searchQuery ? t('noSearchResults', 'No products found') : t('noProducts', 'No products available')}
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
                        >
                            {products.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <ProductCard
                                        id={product.id}
                                        name={product.name}
                                        nameAr={product.nameAr || product.name}
                                        price={product.salePrice}
                                        imageUrl={product.imageUrl}
                                        // Only show stock when trackInventory is enabled
                                        stock={product.trackInventory ? parseInt(product.stockQuantity || '0') : undefined}
                                        // Available if: active AND (not tracking inventory OR has stock)
                                        available={product.isActive && (!product.trackInventory || parseInt(product.stockQuantity || '0') > 0)}
                                        badgeType={null}
                                        hasRequiredModifiers={product.modifierGroups?.some(g => g.isRequired) || false}
                                        product={mapProductToProductInfo(product)}
                                        onAdd={handleAddProduct}
                                        onCustomize={() => handleCustomizeProduct(product.id)}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Cart Panel */}
            <CartPanel
                isExpanded={isCartExpanded}
                onClose={() => setIsCartExpanded(false)}
                onCheckout={handlePaymentClick}
                onEditItem={(item) => setEditingCartItem(item)}
            />

            {/* Action Bar */}
            <POSActionBar
                cartItemCount={itemCount}
                onPayment={handlePaymentClick}
                onDiscount={handleDiscountRequest}
                onHold={canHoldOrders ? handleHoldOrder : undefined}
                onFavorites={canSearchCustomers ? () => setIsCustomerModalOpen(true) : undefined}
                onHistory={canHoldOrders ? () => setIsHeldOrdersModalOpen(true) : undefined}
                onPrint={() => setIsOrderNotesModalOpen(true)}
                onReturn={() => setIsOrderLookupModalOpen(true)}
                onCart={() => setIsCartExpanded(!isCartExpanded)}
                onEndShift={() => setIsCloseSessionModalOpen(true)}
                onEOD={() => setIsEODModalOpen(true)}
                isManager={currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN'}
                isLoading={isValidatingPayment}
                pendingSyncCount={pendingCount}
                isSyncing={isSyncing}
                onSync={syncOrders}
            />

            {/* Modals */}
            <DiscountModal
                isOpen={isDiscountModalOpen}
                onClose={() => setIsDiscountModalOpen(false)}
                onApply={handleApplyDiscount}
                orderSubtotal={subtotal}
                scope="ORDER"
            />

            <CheckoutModal
                isOpen={isCheckoutModalOpen}
                onClose={async () => {
                    setIsCheckoutModalOpen(false);
                    setIsCheckoutSuccess(false);
                    setCompletedOrderData(null);
                    // Handle inventory reservation release if user cancels
                    if (reservationId) {
                        try {
                            const { apiClient } = await import('@/lib/api-client');
                            await apiClient.post('/api/v1/inventory/release', { reservationId });
                            setReservationId(null);
                        } catch (err) {
                            console.error('Failed to release reservation:', err);
                        }
                    }
                }}
                onComplete={handleCheckoutComplete}
                isSubmitting={isSubmittingOrder}
                isSuccess={isCheckoutSuccess}
                orderTotal={total}
                orderSubtotal={subtotal}
                orderTax={taxAmount}
                itemCount={itemCount}
                canSplitPayment={canSplitPayments}
                zatcaQrCode={completedOrderData?.zatcaQrCode}
                orderNumber={completedOrderData?.orderNumber}
                onPrintReceipt={async () => {
                    if (completedOrderData?.orderId) {
                        try {
                            await printingService.printReceipt(completedOrderData.orderId);
                            success(t('feedback.receiptPrinted', 'Receipt sent to printer'));
                        } catch (err) {
                            console.error('[POS] Print failed:', err);
                            // Don't block checkout if print fails
                        }
                    }
                    handleCheckoutFinalize();
                }}
            />

            {selectedProduct && (
                <ModifierModal
                    isOpen={isModifierModalOpen}
                    onClose={() => { setIsModifierModalOpen(false); setSelectedProductId(null); }}
                    product={mapProductToProductInfo(selectedProduct)}
                />
            )}

            {/* Feature-gated modals */}
            <Feature flag="pos.holdOrders">
                <HeldOrdersModal
                    isOpen={isHeldOrdersModalOpen}
                    onClose={() => setIsHeldOrdersModalOpen(false)}
                    onRecall={handleRecallOrder}
                />
            </Feature>

            <Feature flag="customers.search">
                <CustomerSearchModal
                    isOpen={isCustomerModalOpen}
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSelect={handleSelectCustomer}
                    selectedCustomerId={selectedCustomer?.id}
                />
            </Feature>

            <OrderNotesModal
                isOpen={isOrderNotesModalOpen}
                onClose={() => setIsOrderNotesModalOpen(false)}
                onSave={handleSaveNotes}
                initialNotes={useCartStore.getState().notes}
            />

            {pendingPinRequest && (
                <ManagerPinModal
                    isOpen={isManagerPinModalOpen}
                    onClose={() => { setIsManagerPinModalOpen(false); setPendingPinRequest(null); }}
                    onAuthorize={handlePinAuthorize}
                    request={pendingPinRequest}
                />
            )}

            {/* Session Management Modal - REQUIRED when no session active */}
            <OpenSessionModal
                isOpen={isOpenSessionModalOpen}
                onClose={() => setIsOpenSessionModalOpen(false)}
                onConfirm={handleOpenSession}
                isLoading={isSessionLoading}
                error={sessionError}
                required={!isSessionOpen}
            />

            {/* Close Session Modal for end of shift */}
            <CloseSessionModal
                isOpen={isCloseSessionModalOpen}
                onClose={() => setIsCloseSessionModalOpen(false)}
                onConfirm={handleCloseSession}
                isLoading={isSessionLoading}
                error={sessionError}
                openingBalance={parseFloat(session?.openingBalance || '0')}
            />

            {/* Manager EOD Modal */}
            <ManagerEODModal
                isOpen={isEODModalOpen}
                onClose={() => setIsEODModalOpen(false)}
                storeId={store?.id || ''}
                managerId={currentUser?.id || ''}
                onComplete={() => success(t('eod.completed', 'EOD report completed'))}
            />

            {/* Table Selection Modal (for DINE_IN orders) */}
            <TableSelectionModal
                isOpen={isTableSelectionModalOpen}
                onClose={() => setIsTableSelectionModalOpen(false)}
                onSelect={(table) => {
                    setSelectedTable({ id: table.id, tableNumber: table.tableNumber });
                    // Update cart store with table info
                    useCartStore.getState().setTable({
                        id: table.id,
                        number: table.tableNumber,
                        zoneName: table.zone?.zoneName,
                    });
                }}
                selectedTableId={selectedTable?.id}
            />

            {/* Edit Cart Item Modal (Koshary Scenario) */}
            <EditCartItemModal
                cartItem={editingCartItem}
                isOpen={editingCartItem !== null}
                onClose={() => setEditingCartItem(null)}
            />

            {/* Order Lookup Modal (for Returns) */}
            <OrderLookupModal
                isOpen={isOrderLookupModalOpen}
                onClose={() => setIsOrderLookupModalOpen(false)}
                onSelectOrder={(order) => {
                    setOrderToVoid({
                        id: order.id,
                        orderNumber: order.orderNumber,
                        total: order.total,
                    });
                }}
            />

            {/* Void Order Modal */}
            {orderToVoid && (
                <VoidOrderModal
                    isOpen={orderToVoid !== null}
                    onClose={() => setOrderToVoid(null)}
                    orderId={orderToVoid.id}
                    orderNumber={orderToVoid.orderNumber}
                    orderTotal={orderToVoid.total}
                    onVoidComplete={() => {
                        success(t('void.orderVoided', 'Order voided successfully'));
                    }}
                />
            )}
        </div>
    );
}
