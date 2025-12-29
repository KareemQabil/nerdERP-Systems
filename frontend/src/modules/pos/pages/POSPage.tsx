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
import { useCartStore } from '@/stores/cart.store';
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
import { ProductGridSkeleton, CategoryPillsSkeleton } from '../components/skeletons';
import { OpenSessionModal } from '../components/OpenSessionModal';
import { CloseSessionModal } from '../components/CloseSessionModal';

// Hooks & Mappers
import { usePOSData } from '../hooks';
import { mapProductToProductInfo, createAllCategory, mapCategoryToPillProps } from '../utils/mappers';

// Stores & Services
import { useSession } from '@/stores/session.store';
import { orderService, type OrderType } from '@/services/order.service';

// Order types constant (these don't come from API)
import { orderTypes } from '@/data/mock-pos-data';

// Types
import type { CustomerInfo, PinAuthorizationRequest } from '@/types/pos.types';

export default function POSPage() {
    const { t } = useTranslation(['pos', 'common']);
    const { language, theme } = useSettingsStore();
    const { addItem, getItemCount, getSubtotal, getTaxAmount, getTotal, clearCart, setCustomer, setNotes } = useCartStore();
    const { holdOrder, recallOrder } = useOrderStore();
    const { verifyPin, requiresManagerAuth } = useAuthStore();
    const { posConfig } = useConfigStore();
    const { messages, dismissFeedback, success, error: showError } = useFeedback();

    // Session Management
    const {
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

    // Selected Items
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
    const [pendingPinRequest, setPendingPinRequest] = useState<PinAuthorizationRequest | null>(null);

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

    // Debounce search query
    useMemo(() => {
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

    // Helper: Map frontend order type to backend OrderType
    const mapOrderType = (frontendType: string): OrderType => {
        const mapping: Record<string, OrderType> = {
            'dine-in': 'DINE_IN',
            'takeout': 'TAKEAWAY', // Frontend uses 'takeout' but backend expects 'TAKEAWAY'
            'delivery': 'DELIVERY',
            'pickup': 'PICKUP',
            'drive-thru': 'DRIVE_THRU',
        };
        return mapping[frontendType] || 'DINE_IN';
    };

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

    // Track if initial session check is complete
    const [hasInitialized, setHasInitialized] = useState(false);

    // Initialize session on mount - check if active session exists
    useEffect(() => {
        const checkSession = async () => {
            await initializeSession();
            setHasInitialized(true);
        };
        checkSession();
    }, [initializeSession]);

    // Show session modal ONLY if:
    // 1. Initial check has completed
    // 2. Not currently loading
    // 3. No active session exists
    // Close modal if session becomes active
    useEffect(() => {
        if (hasInitialized && !isSessionLoading) {
            if (isSessionOpen) {
                // Session found - close the modal
                setIsOpenSessionModalOpen(false);
            } else {
                // No session - show the modal
                setIsOpenSessionModalOpen(true);
            }
        }
    }, [hasInitialized, isSessionOpen, isSessionLoading]);

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

        try {
            // Build order DTO for backend
            const orderPayload = {
                items: items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity, // Already a string from cart
                    unitPrice: parseFloat(item.unitPrice),
                })),
                payments: payments.map(p => ({
                    method: p.method as 'CASH' | 'CARD' | 'MOBILE' | 'BANK_TRANSFER',
                    amount: parseFloat(p.amount),
                })),
                orderType: mapOrderType(selectedOrderType), // Use helper function
                registerSessionId: sessionId,
                warehouseId: warehouseId,
            };

            console.log('[POS] Submitting order:', orderPayload);

            const order = await orderService.create(orderPayload);

            console.log('[POS] Order created:', order);

            // Clear cart on success
            clearCart();
            setSelectedCustomer(null);
            setIsCheckoutModalOpen(false);

            success(t('feedback.orderComplete', { orderNumber: order.orderNumber || 'N/A' }));
        } catch (error) {
            console.error('[POS] Order submission failed:', error);
            showError(t('feedback.orderFailed', 'Failed to create order. Please try again.'));
        }
    };

    // Handle opening a new session
    const handleOpenSession = async (openingBalance: number, userId?: string) => {
        try {
            await openSession(openingBalance, userId);
            setIsOpenSessionModalOpen(false);
            success(t('session.opened', 'Session opened successfully'));
        } catch (error: any) {
            console.error('[POS] Failed to open session:', error);

            // Check if error is due to existing session
            if (error?.response?.data?.error?.code === 'CASH_002') {
                // Session already exists - just close the modal and refresh
                setIsOpenSessionModalOpen(false);
                await initializeSession(); // Refresh to get the existing session
                showError(t('session.alreadyOpen', 'Session is already open. Using existing session.'));
            }
            // Error is already set in store for other errors
        }
    };

    // Handle closing session
    const handleCloseSession = async (closingBalance: number, notes?: string) => {
        try {
            await closeSession(closingBalance, notes);
            setIsCloseSessionModalOpen(false);
            success(t('session.closed', 'Session closed successfully'));
        } catch (error) {
            console.error('[POS] Failed to close session:', error);
            // Error is already set in store
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
            total: getTotal(),
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
                                                onClick={() => { setSelectedOrderType(type.id); setIsOrderTypeOpen(false); }}
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
                onCheckout={() => setIsCheckoutModalOpen(true)}
            />

            {/* Action Bar */}
            <POSActionBar
                cartItemCount={getItemCount()}
                onPayment={() => setIsCheckoutModalOpen(true)}
                onDiscount={handleDiscountRequest}
                onHold={canHoldOrders ? handleHoldOrder : undefined}
                onFavorites={canSearchCustomers ? () => setIsCustomerModalOpen(true) : undefined}
                onHistory={canHoldOrders ? () => setIsHeldOrdersModalOpen(true) : undefined}
                onPrint={() => setIsOrderNotesModalOpen(true)}
                onReturn={() => console.log('Return')}
                onCart={() => setIsCartExpanded(!isCartExpanded)}
                onCloseSession={() => setIsCloseSessionModalOpen(true)}
                isSessionOpen={isSessionOpen}
            />

            {/* Modals */}
            <DiscountModal
                isOpen={isDiscountModalOpen}
                onClose={() => setIsDiscountModalOpen(false)}
                onApply={handleApplyDiscount}
                orderSubtotal={getSubtotal()}
                scope="ORDER"
            />

            <CheckoutModal
                isOpen={isCheckoutModalOpen}
                onClose={() => setIsCheckoutModalOpen(false)}
                onComplete={handleCheckoutComplete}
                orderTotal={getTotal()}
                orderSubtotal={getSubtotal()}
                orderTax={getTaxAmount()}
                itemCount={getItemCount()}
                canSplitPayment={canSplitPayments}
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

            {/* Session Management Modals */}
            <OpenSessionModal
                isOpen={isOpenSessionModalOpen}
                onClose={() => setIsOpenSessionModalOpen(false)}
                onConfirm={handleOpenSession}
                isLoading={isSessionLoading}
                error={sessionError}
            />

            {/* Close Session Modal - shows actual vs expected balance */}
            {isSessionOpen && (
                <CloseSessionModal
                    isOpen={isCloseSessionModalOpen}
                    onClose={() => setIsCloseSessionModalOpen(false)}
                    onConfirm={handleCloseSession}
                    expectedBalance={0} // TODO: Calculate from session balance
                    isLoading={isSessionLoading}
                    error={sessionError}
                />
            )}
        </div>
    );
}
