/**
 * POSPage - Main Point of Sale Screen
 * Clean orchestration component for the POS interface
 * Now with API integration and smart fallback to mock data
 */
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, Map as MapIcon, ChefHat, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/stores/settings.store';
import { useCartStore } from '@/stores/cart.store';
import { useOrderStore, type HeldOrder } from '@/stores/order.store';
import { useAuthStore } from '@/stores/auth.store';
import { useConfigStore } from '@/stores/config.store';
import { useUIStore } from '@/stores/ui.store';
import { useTablesStore } from '@/stores/tables.store';
import { useKitchenStore } from '@/stores/kitchen.store';
import { useFeedback, FeedbackBar } from '@/components/feedback';
import { Input } from '@/components/ui';
import { CategoryPills, ProductCard } from '@/components/shared';
import { Feature } from '@/components/core';
import { useFeature, useInventorySocket } from '@/hooks';
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
import { ManagerSessionReport } from '../components/ManagerSessionReport';
import TableSelectionModal from '@/modules/sales/components/TableSelectionModal';
import OrderLookupModal from '@/modules/sales/components/OrderLookupModal';
import { ReturnRequestModal } from '@/modules/sales/components/ReturnRequestModal';
import EditCartItemModal from '@/modules/sales/components/EditCartItemModal';
import { SplitBillModal } from '@/modules/sales/components/SplitBillModal';
import { VoidOrderModal } from '@/modules/sales/components/VoidOrderModal';
import type { SplitOrderItem, SplitResult } from '@/modules/sales/components/SplitBillModal';
import { FloorPlanView } from '@/modules/tables/components/FloorPlanView';
import KDSPage from '@/modules/kitchen/pages/KDSPage';
import { DeliveryDashboardPage } from '@/modules/delivery/pages/DeliveryDashboardPage';
import { FullScreenModal } from '@/components/layout';
import type { Order } from '@/services/order.service';
import type { CartItem as CartItemType } from '@/stores/cart.store';

// Hooks & Mappers
import { usePOSData } from '../hooks';
import { mapProductToProductInfo, createAllCategory, mapCategoryToPillProps } from '../utils/mappers';

// Stores & Services
import { useSession } from '@/stores/session.store';
import { orderService, type OrderType } from '@/services/order.service';
import { printingService } from '@/services/printing.service';
import { deliveryService } from '@/services/delivery.service';

// Order types constant (these don't come from API)
import { orderTypes } from '@/data/mock-pos-data';

// Types
import type { CustomerInfo, PinAuthorizationRequest } from '@/types/pos.types';

export default function POSPage() {
    const { t } = useTranslation(['pos', 'common']);
    const { language, theme } = useSettingsStore();
    const { addItem, getItemCount, getSubtotal, getTaxAmount, getTotal, clearCart, setCustomer, setNotes, removeItem, orderType: cartOrderType, setTable } = useCartStore();
    const { holdOrder, recallOrder } = useOrderStore();
    const { requiresManagerAuth } = useAuthStore();
    const { posConfig } = useConfigStore();
    const { activeOverlay, openOverlay, closeOverlay } = useUIStore();
    const { tables, zones, fetchTables, fetchZones } = useTablesStore();
    const { getPendingCount } = useKitchenStore();
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
        closeSessionBlind,
        initializeSession,
        useBlindClose,
    } = useSession();

    // Real-time stock tracking via WebSocket
    const [productStock, setProductStock] = useState<Map<string, string>>(new Map());

    // Order Lookup Mode (Return vs Reprint)
    const [_orderLookupMode, setOrderLookupMode] = useState<'RETURN' | 'REPRINT'>('RETURN');

    // Void Order Modal
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

    useInventorySocket({
        autoConnect: isSessionOpen && !!warehouseId,
        onStockChanged: (event) => {
            // Update local stock map when stock changes
            setProductStock((prev) => {
                const updated = new Map(prev);
                updated.set(event.productId, event.newQuantity);
                return updated;
            });
        },
    });

    // Feature flags
    const canHoldOrders = useFeature('pos.holdOrders');
    const canSearchCustomers = useFeature('customers.search');
    const canSplitPayments = useFeature('pos.splitPayments');

    // Fetch tables data for floor plan
    useEffect(() => {
        if (warehouseId) {
            fetchZones(warehouseId);
            fetchTables(warehouseId);
        }
    }, [warehouseId, fetchZones, fetchTables]);

    // Handler to open floor plan overlay
    const handleOpenFloorPlan = () => {
        openOverlay('tables');
    };

    // Handler to handle table selection from floor plan
    const handleTableSelect = (table: { id: string; tableNumber: string; zone?: { zoneName: string } }) => {
        setTable({
            id: table.id,
            number: table.tableNumber,
            zoneName: table.zone?.zoneName,
        });
        closeOverlay();
    };

    // Handler to open kitchen overlay
    const handleOpenKitchen = () => {
        openOverlay('kitchen');
    };

    // Handler to open delivery overlay
    const handleOpenDelivery = () => {
        openOverlay('delivery');
    };

    // Delivery dashboard handlers
    const handleFetchDeliveryDashboard = async (storeId: string) => {
        try {
            const data = await deliveryService.getDashboard(storeId);

            // Transform DeliveryOrder to DeliveryOrderCard format
            const transformOrder = (order: any): any => ({
                id: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                address: order.address,
                zoneCode: order.zoneCode,
                zoneName: order.zoneName,
                deliveryFee: order.deliveryFee,
                status: order.status,
                driverId: order.driverId,
                driverName: order.driverName,
                estimatedMinutes: order.estimatedMinutes,
                createdAt: order.createdAt,
                assignedAt: order.assignedAt,
                outForDeliveryAt: order.outForDeliveryAt,
            });

            // Transform DeliveryDriver to DriverCard format
            const transformDriver = (driver: any): any => ({
                id: driver.id,
                name: driver.name,
                phone: driver.phone,
                status: driver.status,
                activeOrdersCount: driver.activeOrdersCount,
                completedTodayCount: driver.completedTodayCount,
            });

            // Map DashboardSummary to match expected format
            const summary = {
                totalPendingOrders: data.summary.totalPendingOrders,
                totalAssignedOrders: data.summary.totalAssignedOrders,
                totalOutForDelivery: data.summary.totalOutForDelivery,
                totalReadyForPickup: data.summary.totalReadyForPickup,
                totalActiveOrders: data.summary.totalPendingOrders + data.summary.totalAssignedOrders + data.summary.totalOutForDelivery,
                availableDrivers: data.summary.availableDrivers,
                busyDrivers: data.summary.busyDrivers,
                totalDrivers: data.summary.availableDrivers + data.summary.busyDrivers + data.summary.offDutyDrivers,
                avgDeliveryTimeMinutes: data.summary.avgDeliveryTimeMinutes,
                onTimeDeliveryPercentage: data.summary.onTimeDeliveryPercentage,
            };

            return {
                summary,
                pendingOrders: data.pendingOrders.map(transformOrder),
                assignedOrders: data.assignedOrders.map(transformOrder),
                outForDeliveryOrders: data.outForDeliveryOrders.map(transformOrder),
                readyForPickupOrders: data.readyForPickupOrders.map(transformOrder),
                completedOrders: data.completedOrders.map(transformOrder),
                availableDrivers: data.availableDrivers.map(transformDriver),
                busyDrivers: data.busyDrivers.map(transformDriver),
                offDutyDrivers: data.offDutyDrivers.map(transformDriver),
                zoneStats: data.zoneStats,
            };
        } catch (error) {
            console.error('[POS] Failed to fetch delivery dashboard:', error);
            // Return empty structure on error
            return {
                summary: {
                    totalPendingOrders: 0,
                    totalAssignedOrders: 0,
                    totalOutForDelivery: 0,
                    totalReadyForPickup: 0,
                    totalActiveOrders: 0,
                    availableDrivers: 0,
                    busyDrivers: 0,
                    totalDrivers: 0,
                    avgDeliveryTimeMinutes: 0,
                    onTimeDeliveryPercentage: 0,
                },
                pendingOrders: [],
                assignedOrders: [],
                outForDeliveryOrders: [],
                readyForPickupOrders: [],
                completedOrders: [],
                availableDrivers: [],
                busyDrivers: [],
                offDutyDrivers: [],
                zoneStats: [],
            };
        }
    };

    const handleAssignDriver = async (orderId: string, driverId: string) => {
        try {
            await deliveryService.assignDriver(orderId, driverId);
            success(t('feedback.driverAssigned', 'Driver assigned successfully'));
        } catch (error) {
            showError(t('feedback.driverAssignFailed', 'Failed to assign driver'));
        }
    };

    const handleUpdateDeliveryStatus = async (params: { orderId: string; status: string; note?: string }) => {
        try {
            await deliveryService.updateStatus({
                orderId: params.orderId,
                status: params.status as any, // DeliveryStatus type
                note: params.note,
            });
            success(t('feedback.statusUpdated', 'Status updated successfully'));
        } catch (error) {
            showError(t('feedback.statusUpdateFailed', 'Failed to update status'));
        }
    };

    // Get kitchen pending count for badge
    const kitchenPendingCount = getPendingCount('ALL');

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
    const [completedOrderResult, setCompletedOrderResult] = useState<{
        id: string;
        orderNumber: string;
        invoiceNumber?: string;
        invoiceHash?: string;
        qrCodeData?: string;
        orderType: string;
    } | null>(null);
    const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
    const [isHeldOrdersModalOpen, setIsHeldOrdersModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isOrderNotesModalOpen, setIsOrderNotesModalOpen] = useState(false);
    const [isManagerPinModalOpen, setIsManagerPinModalOpen] = useState(false);
    const [isOpenSessionModalOpen, setIsOpenSessionModalOpen] = useState(false);
    const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
    const [isManagerReportOpen, setIsManagerReportOpen] = useState(false);
    const [reportSessionId, setReportSessionId] = useState<string | null>(null);
    const [isTableSelectionModalOpen, setIsTableSelectionModalOpen] = useState(false);
    const [isOrderLookupModalOpen, setIsOrderLookupModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedReturnOrder, setSelectedReturnOrder] = useState<Order | null>(null);
    const [isEditCartItemModalOpen, setIsEditCartItemModalOpen] = useState(false);
    const [selectedEditCartItem, setSelectedEditCartItem] = useState<CartItemType | null>(null);

    // Split Bill Modal
    const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
    const [splitBillOrder, setSplitBillOrder] = useState<{
        orderId: string;
        orderNumber: string;
        tableNumber?: string;
        customerName?: string;
        subtotal: string;
        tax: string;
        discount: string;
        total: string;
        itemCount: number;
    } | null>(null);
    const [splitBillItems, setSplitBillItems] = useState<SplitOrderItem[]>([]);

    // Selected Items
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);
    const [pendingPinRequest, setPendingPinRequest] = useState<PinAuthorizationRequest | null>(null);
    const [pendingDiscountConfig, setPendingDiscountConfig] = useState<DiscountConfig | null>(null);

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
            'takeaway': 'TAKEAWAY',
            'delivery': 'DELIVERY',
            'pickup': 'PICKUP',
            'drive-thru': 'DRIVE_THRU',
        };
        return mapping[frontendType] || 'DINE_IN';
    };

    // Auto-open table selection when switching to DINE_IN and no table selected
    useEffect(() => {
        const cartState = useCartStore.getState();
        if (selectedOrderType === 'dine-in' && !cartState.table && isSessionOpen) {
            setIsTableSelectionModalOpen(true);
        }
    }, [selectedOrderType, isSessionOpen]);

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
        // Check if manager authorization is required for discounts
        if (requiresManagerAuth('APPLY_DISCOUNT')) {
            // Store the discount config and request PIN authorization
            setPendingDiscountConfig(discount);
            setPendingPinRequest({ action: 'APPLY_DISCOUNT' });
            setIsManagerPinModalOpen(true);
            setIsDiscountModalOpen(false); // Close discount modal while waiting for PIN
        } else {
            // No authorization required - apply directly
            applyDiscountToCart(discount);
        }
    };

    // Helper to actually apply the discount to cart
    const applyDiscountToCart = (discount: DiscountConfig) => {
        // Convert uppercase type from DiscountModal to lowercase expected by cart.store.ts
        const cartDiscount = {
            type: discount.type.toLowerCase() as 'percentage' | 'fixed',
            value: discount.value,
            reason: discount.reason || 'MANAGER',
        };

        useCartStore.getState().setDiscount(cartDiscount);
        console.log('[POS] Discount applied:', cartDiscount);
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

            // Auto-print receipt if configured
            try {
                await printingService.printReceipt(order.id);
                console.log('[POS] Receipt printed for order:', order.orderNumber);
            } catch (printError) {
                console.warn('[POS] Receipt printing failed (non-blocking):', printError);
                // Don't block checkout if printing fails
            }

            // Save order result and keep modal open for fire button
            setCompletedOrderResult({
                id: order.id,
                orderNumber: order.orderNumber || 'N/A',
                invoiceNumber: order.invoiceNumber,
                invoiceHash: order.invoiceHash,
                qrCodeData: order.zatcaQrCode,
                orderType: order.orderType,
            });

            // Don't clear cart yet - wait for user to click "New Order"
            success(t('feedback.orderComplete', { orderNumber: order.orderNumber || 'N/A' }));
        } catch (error) {
            console.error('[POS] Order submission failed:', error);
            showError(t('feedback.orderFailed', 'Failed to create order. Please try again.'));
        }
    };

    // Handle finalizing the order (called from CheckoutModal's "New Order" button)
    const handleFinalizeOrder = () => {
        clearCart();
        setSelectedCustomer(null);
        setIsCheckoutModalOpen(false);
        setCompletedOrderResult(null);
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

    // Handle closing session (supports blind close mode)
    const handleCloseSession = async (closingBalance: number, notes?: string) => {
        try {
            if (useBlindClose) {
                await closeSessionBlind(closingBalance, notes);
            } else {
                await closeSession(closingBalance, notes);
            }
            setIsCloseSessionModalOpen(false);
            // Show manager report after closing (for manager review)
            if (sessionId) {
                setReportSessionId(sessionId);
                setIsManagerReportOpen(true);
            }
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

    const handlePinAuthorize = async (pin: string, _reason?: string): Promise<boolean> => {
        if (!pendingPinRequest) return false;

        // For demo: accept any 4-digit PIN
        // TODO: Replace with actual PIN verification API call
        const isValidPin = pin.length >= 4;

        if (isValidPin) {
            // Execute action based on type
            if (pendingPinRequest.action === 'APPLY_DISCOUNT' && pendingDiscountConfig) {
                // Apply the pending discount that was selected before PIN auth
                applyDiscountToCart(pendingDiscountConfig);
                setPendingDiscountConfig(null);
            } else if (pendingPinRequest.action === 'VOID_ITEM' && pendingPinRequest.itemId) {
                removeItem(pendingPinRequest.itemId);
                success(t('feedback.itemVoided', 'Item voided'));
            } else if (pendingPinRequest.action === 'VOID_ORDER') {
                setIsVoidModalOpen(true);
            } else if (pendingPinRequest.action === 'PRICE_OVERRIDE') {
                // TODO: Handle price override
                console.log('[POS] Price override authorized');
            } else if (pendingPinRequest.action === 'OPEN_DRAWER') {
                // TODO: Call drawer open API
                success(t('feedback.drawerOpened', 'Cash drawer opened'));
            }

            setIsManagerPinModalOpen(false);
            setPendingPinRequest(null);
            return true;
        }

        return false;
    };

    // Discount button handler - opens discount selection modal directly
    const handleDiscountRequest = () => {
        // Always open discount modal first - PIN will be requested after selection if needed
        setIsDiscountModalOpen(true);
    };

    // Split Bill Handlers
    const handleSplitBill = () => {
        const cartState = useCartStore.getState();
        const items = cartState.getActiveItems();

        if (items.length === 0) {
            showError(t('feedback.emptyCart', 'Cannot split empty cart'));
            return;
        }

        // Create order summary from current cart
        const orderSummary = {
            orderId: 'temp',
            orderNumber: `TEMP-${Date.now()}`,
            tableNumber: cartState.table?.number,
            customerName: cartState.customer?.name,
            subtotal: cartState.getSubtotal(),
            tax: cartState.getTaxAmount(),
            discount: cartState.discount?.value || '0',
            total: cartState.getTotal(),
            itemCount: items.length,
        };

        const itemsToSplit: SplitOrderItem[] = items.map(item => ({
            orderItemId: item.id,
            productName: item.product.name,
            quantity: parseFloat(item.quantity),
            unitPrice: item.unitPrice,
            totalPrice: item.lineTotal,
            isSplittable: true,
        }));

        setSplitBillOrder(orderSummary);
        setSplitBillItems(itemsToSplit);
        setIsSplitBillModalOpen(true);
    };

    const handleSplitBillComplete = async (result: SplitResult) => {
        try {
            // TODO: Call backend API to process the split
            console.log('[POS] Split bill result:', result);
            success(t('feedback.splitBillComplete', 'Bill split successfully'));
            setIsSplitBillModalOpen(false);
            setSplitBillOrder(null);
            setSplitBillItems([]);
            // Clear cart after successful split
            clearCart();
            setSelectedCustomer(null);
        } catch (error) {
            console.error('[POS] Split bill failed:', error);
            showError(t('feedback.splitBillFailed', 'Failed to split bill'));
        }
    };

    const selectedProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null;

    return (
        <div data-testid="pos-page" className="relative h-screen overflow-hidden">
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
                            data-testid="product-search"
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
                            data-testid="order-type-selector"
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
                                                data-testid={`order-type-${type.id.toLowerCase().replace('_', '-')}`}
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

                    {/* Floor Plan Button - shown for dine-in */}
                    {cartOrderType === 'DINE_IN' && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleOpenFloorPlan}
                            data-theme={theme}
                            title={t('floorPlan.title', 'Floor Plan')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors',
                                'bg-slate-800/50 border-slate-700/50 text-white',
                                'hover:bg-slate-700/50',
                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                                'data-[theme=light]:text-slate-900 data-[theme=light]:hover:bg-slate-50',
                            )}
                        >
                            <MapIcon className="w-4 h-4" />
                            <span className="text-sm font-medium hidden md:inline">
                                {t('floorPlan.button', 'Floor Plan')}
                            </span>
                        </motion.button>
                    )}

                    {/* Quick Access Buttons - Kitchen & Delivery */}
                    <div className="flex items-center gap-2">
                        {/* Kitchen Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleOpenKitchen}
                            data-testid="action-kitchen"
                            data-theme={theme}
                            title={t('kitchen.title', 'Kitchen Display System')}
                            className={cn(
                                'relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors',
                                activeOverlay === 'kitchen'
                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 border-transparent text-white'
                                    : cn(
                                        'bg-slate-800/50 border-slate-700/50 text-white',
                                        'hover:bg-slate-700/50',
                                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                                        'data-[theme=light]:text-slate-900 data-[theme=light]:hover:bg-slate-50',
                                    ),
                            )}
                        >
                            <ChefHat className="w-4 h-4" />
                            <span className="text-sm font-medium hidden lg:inline">
                                {t('kitchen.button', 'Kitchen')}
                            </span>
                            {kitchenPendingCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                                    {kitchenPendingCount}
                                </span>
                            )}
                        </motion.button>

                        {/* Delivery Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleOpenDelivery}
                            data-theme={theme}
                            title={t('delivery.title', 'Delivery Dashboard')}
                            className={cn(
                                'relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors',
                                activeOverlay === 'delivery'
                                    ? 'bg-gradient-to-r from-purple-500 to-violet-600 border-transparent text-white'
                                    : cn(
                                        'bg-slate-800/50 border-slate-700/50 text-white',
                                        'hover:bg-slate-700/50',
                                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                                        'data-[theme=light]:text-slate-900 data-[theme=light]:hover:bg-slate-50',
                                    ),
                            )}
                        >
                            <Truck className="w-4 h-4" />
                            <span className="text-sm font-medium hidden lg:inline">
                                {t('delivery.button', 'Delivery')}
                            </span>
                        </motion.button>
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
                                        // Use real-time stock from WebSocket if available, otherwise use API data
                                        stock={product.trackInventory ? (productStock.get(product.id) ? parseInt(productStock.get(product.id) || '0') : parseInt(product.stockQuantity || '0')) : undefined}
                                        // Available if: active AND (not tracking inventory OR has stock)
                                        available={product.isActive && (!product.trackInventory || (productStock.get(product.id) ? parseInt(productStock.get(product.id) || '0') > 0 : parseInt(product.stockQuantity || '0') > 0))}
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
                onEditItem={(item) => {
                    setSelectedEditCartItem(item);
                    setIsEditCartItemModalOpen(true);
                }}
                onRequestAuthorization={(request) => {
                    console.log('[POS] Manager authorization requested:', request);
                    setPendingPinRequest(request);
                    setIsManagerPinModalOpen(true);
                }}
                showFireButton={cartOrderType === 'DINE_IN'}
                onFireToKitchen={() => {
                    // TODO: Implement fire to kitchen logic via kitchen service
                    console.log('[POS] Fire to kitchen - dine-in order');
                    success(t('feedback.firedToKitchen', 'Items fired to kitchen'));
                }}
            />

            {/* Action Bar */}
            <POSActionBar
                cartItemCount={getItemCount()}
                onPayment={() => setIsCheckoutModalOpen(true)}
                onDiscount={handleDiscountRequest}
                onHold={canHoldOrders ? handleHoldOrder : undefined}
                onSplitBill={cartOrderType === 'DINE_IN' ? handleSplitBill : undefined}
                onVoid={getItemCount() > 0 ? () => setIsVoidModalOpen(true) : undefined}
                onFavorites={canSearchCustomers ? () => setIsCustomerModalOpen(true) : undefined}
                onHistory={canHoldOrders ? () => setIsHeldOrdersModalOpen(true) : undefined}
                onPrint={() => {
                    setOrderLookupMode('REPRINT');
                    setIsOrderLookupModalOpen(true);
                }}
                onReturn={() => {
                    setOrderLookupMode('RETURN');
                    setIsOrderLookupModalOpen(true);
                }}
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
                onFinalize={handleFinalizeOrder}
                orderTotal={getTotal()}
                orderSubtotal={getSubtotal()}
                orderTax={getTaxAmount()}
                orderDiscount={useCartStore.getState().discount?.value || '0'}
                itemCount={getItemCount()}
                canSplitPayment={canSplitPayments}
                orderResult={completedOrderResult}
                lineItems={useCartStore.getState().getActiveItems().map(item => ({
                    id: item.productId,
                    name: item.product.name,
                    quantity: parseFloat(item.quantity),
                    unitPrice: item.unitPrice,
                    totalPrice: item.lineTotal,
                }))}
                sellerInfo={{
                    name: t('checkout.sellerName', 'NerdPOS'),
                    taxNumber: '300000000000003',
                }}
                taxRate={15}
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
                    isBlindClose={useBlindClose}
                    isLoading={isSessionLoading}
                    error={sessionError}
                />
            )}

            {/* Manager Session Report - shows after session close for review */}
            {reportSessionId && (
                <ManagerSessionReport
                    isOpen={isManagerReportOpen}
                    onClose={() => {
                        setIsManagerReportOpen(false);
                        setReportSessionId(null);
                    }}
                    sessionId={reportSessionId}
                />
            )}

            {/* Table Selection Modal - for DINE_IN orders */}
            <TableSelectionModal
                isOpen={isTableSelectionModalOpen}
                onClose={() => setIsTableSelectionModalOpen(false)}
                onSelect={(table) => {
                    // Store table in cart store
                    useCartStore.getState().setTable({
                        id: table.id,
                        number: table.tableNumber,
                        zoneName: table.zone?.zoneName,
                    });
                    setIsTableSelectionModalOpen(false);
                    success(t('feedback.tableSelected', { table: table.tableNumber }));
                }}
            />

            {/* Order Lookup Modal - for returns/voids */}
            <OrderLookupModal
                isOpen={isOrderLookupModalOpen}
                onClose={() => setIsOrderLookupModalOpen(false)}
                onSelectOrder={(order) => {
                    setSelectedReturnOrder(order);
                    setIsOrderLookupModalOpen(false);
                    setIsReturnModalOpen(true);
                }}
            />

            {/* Return Request Modal */}
            {selectedReturnOrder && (
                <ReturnRequestModal
                    isOpen={isReturnModalOpen}
                    onClose={() => {
                        setIsReturnModalOpen(false);
                        setSelectedReturnOrder(null);
                    }}
                    order={{
                        orderId: selectedReturnOrder.id,
                        orderNumber: selectedReturnOrder.orderNumber,
                        orderDate: selectedReturnOrder.createdAt,
                        orderTotal: selectedReturnOrder.total,
                        customerName: selectedReturnOrder.customerName,
                    }}
                    items={selectedReturnOrder.items.map((item) => ({
                        orderItemId: item.id,
                        productName: item.productName,
                        productId: item.productId,
                        quantity: parseInt(item.quantity, 10),
                        unitPrice: item.unitPrice,
                        totalPrice: item.lineTotal,
                        isReturnable: true,
                    }))}
                    onComplete={async (returnData) => {
                        try {
                            console.log('[POS] Processing return:', returnData);
                            // TODO: Call return API
                            success(t('feedback.returnProcessed', 'Return processed successfully'));
                            setIsReturnModalOpen(false);
                            setSelectedReturnOrder(null);
                        } catch (error) {
                            console.error('[POS] Return failed:', error);
                            showError(t('feedback.returnFailed', 'Failed to process return'));
                        }
                    }}
                />
            )}

            {/* Edit Cart Item Modal */}
            <EditCartItemModal
                cartItem={selectedEditCartItem}
                isOpen={isEditCartItemModalOpen}
                onClose={() => {
                    setIsEditCartItemModalOpen(false);
                    setSelectedEditCartItem(null);
                }}
            />

            {/* Void Order Modal */}
            <VoidOrderModal
                isOpen={isVoidModalOpen}
                onClose={() => setIsVoidModalOpen(false)}
                orderId={sessionId || 'current-cart'}
                orderNumber={t('void.currentOrder', 'Current Order')}
                orderTotal={getTotal()}
                onVoidComplete={() => {
                    clearCart();
                    setIsVoidModalOpen(false);
                    success(t('feedback.orderVoided', 'Order voided successfully'));
                }}
            />

            {/* Duplicate ManagerPinModal removed - the primary one is at lines 991-998 with proper handlePinAuthorize */}

            {/* Split Bill Modal */}
            {splitBillOrder && (
                <SplitBillModal
                    isOpen={isSplitBillModalOpen}
                    onClose={() => {
                        setIsSplitBillModalOpen(false);
                        setSplitBillOrder(null);
                        setSplitBillItems([]);
                    }}
                    onComplete={handleSplitBillComplete}
                    order={splitBillOrder}
                    items={splitBillItems}
                />
            )}

            {/* Tables Floor Plan Overlay */}
            <FullScreenModal
                isOpen={activeOverlay === 'tables'}
                onClose={closeOverlay}
                title={t('floorPlan.title', 'Floor Plan')}
            >
                <FloorPlanView
                    tables={tables}
                    zones={zones}
                    loading={false}
                    onTableClick={handleTableSelect}
                    onRefresh={() => {
                        if (warehouseId) {
                            fetchTables(warehouseId);
                            fetchZones(warehouseId);
                        }
                    }}
                />
            </FullScreenModal>

            {/* Kitchen Display Overlay */}
            <FullScreenModal
                isOpen={activeOverlay === 'kitchen'}
                onClose={closeOverlay}
                title={t('kitchen.title', 'Kitchen Display System')}
            >
                <KDSPage embedded={true} />
            </FullScreenModal>

            {/* Delivery Dashboard Overlay */}
            <FullScreenModal
                isOpen={activeOverlay === 'delivery'}
                onClose={closeOverlay}
                title={t('delivery.title', 'Delivery Dashboard')}
            >
                <DeliveryDashboardPage
                    storeId={warehouseId || 'default'}
                    onFetchDashboard={handleFetchDeliveryDashboard}
                    onAssignDriver={handleAssignDriver}
                    onUpdateStatus={handleUpdateDeliveryStatus}
                />
            </FullScreenModal>
        </div>
    );
}
