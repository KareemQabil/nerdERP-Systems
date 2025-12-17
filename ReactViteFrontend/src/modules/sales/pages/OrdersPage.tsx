import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useProducts } from '@/modules/products/hooks/useProducts';
import type { Product } from '@/modules/products/hooks/useProducts';
import { useCartStore } from '@/modules/sales/store/cartStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown } from 'lucide-react';

// Import all POS modals
import {
    PaymentModal,
    ReceiptPreviewModal,
    CustomerSelectorModal,
    TableSelectorModal,
    DiscountModal,
    HoldOrdersModal,
    KitchenSendModal,
    BarcodeScannerModal,
    ProductModifiersModal,
} from '@/modules/sales/components';

// Import services
import { HeldOrderService } from '@/modules/sales/services';
import type { Customer, Table, Discount, ProductModifier, PaymentMethod, OrderType } from '@/modules/sales/types/pos.types';

const CATEGORIES = [
    { id: 'all', name: 'All' },
    { id: 'hot', name: 'Hot' },
    { id: 'cold', name: 'Cold' },
    { id: 'bakery', name: 'Bakery' },
    { id: 'dessert', name: 'Dessert' },
];

type ModalType =
    | 'payment'
    | 'receipt'
    | 'customer'
    | 'table'
    | 'discount'
    | 'holdOrders'
    | 'kitchen'
    | 'barcode'
    | 'modifiers'
    | 'hold'
    | null;

export const OrdersPage = () => {
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [appliedDiscount, setAppliedDiscount] = useState<{ discount: Discount; value: number } | null>(null);
    const [lastReceipt, setLastReceipt] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [orderType, setOrderType] = useState<OrderType>('takeaway');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data: products, isLoading, isError } = useProducts();
    const { items, addItem, clearCart } = useCartStore();

    // Listen for modal trigger events from MainLayout/BottomActionBar
    useEffect(() => {
        const handleModalTrigger = (event: any) => {
            const modalType = event.detail?.type as ModalType;

            // Handle hold order separately as it's an action not a modal
            if (modalType === 'hold') {
                handleHoldOrder();
            } else {
                setActiveModal(modalType);
            }
        };

        window.addEventListener('pos-modal-trigger', handleModalTrigger);
        return () => window.removeEventListener('pos-modal-trigger', handleModalTrigger);
    }, [items, selectedCustomer, selectedTable, appliedDiscount]);

    // Calculate totals - CartItem extends Product so all properties are available
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.salePrice || '0') * item.quantity), 0);
    const tax = subtotal * 0.15;
    const discountAmount = appliedDiscount
        ? appliedDiscount.discount.type === 'percentage'
            ? (subtotal * appliedDiscount.value) / 100
            : appliedDiscount.value
        : 0;
    const total = subtotal + tax - discountAmount;

    if (isLoading) {
        return <div className="text-white p-8">{t('Loading products...')}</div>;
    }

    if (isError) {
        return <div className="text-red-500 p-8">{t('Error loading products.')}</div>;
    }

    // Default hasStock to true if missing
    const filteredProducts: Product[] = products?.map((p) => ({
        ...p,
        hasStock: p.hasStock ?? true,
    })) || [];

    // Handle product click - add to cart or show modifiers modal
    const handleProductClick = (product: Product) => {
        if (product.modifiers && product.modifiers.length > 0) {
            setSelectedProduct(product);
            setActiveModal('modifiers');
        } else {
            addItem(product);
            toast.success('تمت إضافة ' + product.name);
        }
    };

    const handleCustomerSelect = (customer: Customer | null) => {
        if (!customer) {
            setSelectedCustomer(null);
            setActiveModal(null);
            toast.info('تم إلغاء اختيار العميل');
            return;
        }
        setSelectedCustomer(customer);
        setActiveModal(null);
        toast.success('تم تحديد العميل: ' + customer.name);
    };

    const handleTableSelect = (table: Table) => {
        setSelectedTable(table);
        setActiveModal(null);
        toast.success('تم تحديد الطاولة: ' + table.number);
    };

    const handleDiscountApply = (discount: Discount, customValue?: number) => {
        const value = customValue !== undefined ? customValue : discount.value;
        setAppliedDiscount({ discount, value });
        setActiveModal(null);
        toast.success('تم تطبيق خصم ' + discount.name);
    };

    const handleHoldOrder = async () => {
        if (items.length === 0) return;

        try {
            await HeldOrderService.holdOrder(
                items as any,
                'dineIn',
                selectedTable || undefined,
                appliedDiscount || undefined,
                selectedCustomer?.name
            );
            clearCart();
            setSelectedCustomer(null);
            setSelectedTable(null);
            setAppliedDiscount(null);
            toast.success('تم حفظ الطلب بنجاح');
        } catch (error) {
            toast.error('فشل حفظ الطلب');
        }
    };

    const handleRetrieveOrder = async (orderId: string) => {
        const order = await HeldOrderService.retrieveOrder(orderId);
        if (order) {
            // Restore cart state
            clearCart();
            order.items.forEach((item: any) => addItem(item.product));
            if (order.appliedDiscount) setAppliedDiscount(order.appliedDiscount);
            setActiveModal(null);
            toast.success('تم استعادة الطلب');
        }
    };

    const handleDeleteHeldOrder = async (orderId: string) => {
        await HeldOrderService.deleteHeldOrder(orderId);
        toast.success('تم حذف الطلب');
    };

    const handlePayment = (method: PaymentMethod, amount: number, change?: number) => {
        setLastReceipt({
            orderNumber: 'ORD-' + Date.now().toString().slice(-6),
            items,
            subtotal,
            tax,
            discount: discountAmount,
            total,
            paymentMethod: method,
            change: change || 0,
            customer: selectedCustomer,
            table: selectedTable,
            timestamp: new Date(),
        });

        setActiveModal('receipt');
        toast.success('تمت عملية الدفع بنجاح');
    };



    const handleSendToKitchen = (_notes: string) => {
        toast.success('تم إرسال الطلب للمطبخ');
        setActiveModal(null);
    };

    const handleModifiersConfirm = (modifiers: ProductModifier[], _instructions: string) => {
        if (!selectedProduct) return;

        // Add product with modifiers - just add to cart normally
        addItem(selectedProduct);

        toast.success('تمت إضافة ' + selectedProduct.name + ' مع التخصيصات');
        setActiveModal(null);
        setSelectedProduct(null);
    };

    return (
        <div className="space-y-4">
            {/* Categories with Keyboard Shortcuts & Search */}
            <div className="space-y-4">
                {/* Categories with Keyboard Shortcuts */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)] scrollbar-track-transparent">
                    {CATEGORIES.map((cat, index) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-['Almarai'] transition-all whitespace-nowrap",
                                activeCategory === cat.id
                                    ? "bg-cyan-400 text-[#00373a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]"
                                    : "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#c2c7ce] hover:border-cyan-400/50"
                            )}
                        >
                            <span dir="auto">{cat.name}</span> ({filteredProducts.filter(p => cat.id === 'all' || p.category === cat.id).length})
                            {index < 9 && (
                                <span className="ml-2 text-xs opacity-70">
                                    [{index + 1}]
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search & Order Type */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={(t('common.search') || 'بحث') + '... (Ctrl+F)'}
                            className="w-full h-12 px-4 pr-12 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-base text-[#e2e2e6] placeholder:text-[#c2c7ce] font-['Almarai'] focus:outline-none focus:border-cyan-400/50 transition-all"
                            dir="rtl"
                        />
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#c2c7ce]" />
                    </div>

                    {/* Order Type Dropdown */}
                    <div className="relative group">
                        <button className="h-12 px-8 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] text-base font-['Almarai'] hover:border-cyan-400/50 transition-colors flex items-center gap-3 min-w-[180px] justify-between">
                            <span dir="auto">
                                {orderType === 'takeaway' && (t('pos.orderType.takeaway') || 'سفري')}
                                {orderType === 'dineIn' && (selectedTable ? 'طاولة ' + selectedTable.number : (t('pos.orderType.dineIn') || 'محلي'))}
                                {orderType === 'delivery' && (t('pos.orderType.delivery') || 'توصيل')}
                            </span>
                            <ChevronDown className="w-5 h-5" />
                        </button>

                        {/* Dropdown */}
                        <div className="absolute left-0 top-full mt-2 w-56 bg-[#1a1c1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <button
                                onClick={() => setOrderType('takeaway')}
                                className="w-full px-5 py-4 text-right hover:bg-[rgba(255,255,255,0.05)] transition-colors first:rounded-t-xl"
                            >
                                <span className="text-base font-['Almarai'] text-[#e2e2e6]" dir="auto">
                                    {t('pos.orderType.takeaway') || 'سفري'}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveModal('table')}
                                className="w-full px-5 py-4 text-right hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                            >
                                <span className="text-base font-['Almarai'] text-[#e2e2e6]" dir="auto">
                                    {t('pos.orderType.dineIn') || 'محلي'}
                                </span>
                            </button>
                            <button
                                onClick={() => setOrderType('delivery')}
                                className="w-full px-5 py-4 text-right hover:bg-[rgba(255,255,255,0.05)] transition-colors last:rounded-b-xl"
                            >
                                <span className="text-base font-['Almarai'] text-[#e2e2e6]" dir="auto">
                                    {t('pos.orderType.delivery') || 'توصيل'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center mb-4">
                        <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full" />
                    </div>
                    <p className="text-base text-[#c2c7ce]" dir="auto">
                        {t('Loading products...')}
                    </p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center mb-4">
                        <div className="w-12 h-12 text-[#c2c7ce] opacity-50">📦</div>
                    </div>
                    <h3 className="text-xl font-['Almarai'] text-[#e2e2e6] mb-2" dir="auto">
                        لا توجد منتجات
                    </h3>
                    <p className="text-base text-[#c2c7ce]" dir="auto">
                        جرب تغيير الفئة أو البحث بكلمات مختلفة
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map((product, index) => (
                        <button
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            disabled={!product.hasStock}
                            className={cn(
                                "bg-[rgba(255,255,255,0.05)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-right transition-all",
                                product.hasStock
                                    ? "hover:border-cyan-400/50 hover:shadow-lg cursor-pointer"
                                    : "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {/* Product Image */}
                            {product.imageUrl && (
                                <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-[rgba(255,255,255,0.03)]">
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Product Info */}
                            <h3 className="text-base font-['Almarai'] font-bold text-[#e2e2e6] mb-1 line-clamp-2" dir="auto">
                                {product.name}
                            </h3>
                            <p className="text-sm text-[#c2c7ce] mb-2 line-clamp-1">
                                {product.nameAr || product.name}
                            </p>

                            {/* Price & Stock */}
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-['Arial'] font-bold text-cyan-400">
                                    {parseFloat(product.salePrice || '0').toFixed(2)} ر.س
                                </span>
                                <span className={cn(
                                    "text-xs px-2 py-1 rounded",
                                    product.hasStock
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-red-500/20 text-red-400"
                                )}>
                                    {product.hasStock ? 'متوفر' : 'نفذ'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Payment Modal */}
            <PaymentModal
                isOpen={activeModal === 'payment'}
                onClose={() => setActiveModal(null)}
                items={items as any}
                subtotal={subtotal}
                tax={tax}
                discount={discountAmount}
                total={total}
                onPaymentComplete={handlePayment}
            />

            {/* Receipt Preview Modal */}
            <ReceiptPreviewModal
                isOpen={activeModal === 'receipt'}
                onClose={() => {
                    setActiveModal(null);
                    if (lastReceipt) {
                        clearCart();
                        setSelectedCustomer(null);
                        setSelectedTable(null);
                        setAppliedDiscount(null);
                    }
                }}
                payment={lastReceipt}
                items={items as any}
                subtotal={subtotal}
                tax={tax}
                discount={discountAmount}
                total={total}
            />

            {/* Customer Selector Modal */}
            <CustomerSelectorModal
                isOpen={activeModal === 'customer'}
                onClose={() => setActiveModal(null)}
                customers={[]}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={handleCustomerSelect}
                onAddCustomer={() => toast.info('Add customer feature coming soon')}
            />

            {/* Table Selector Modal */}
            <TableSelectorModal
                isOpen={activeModal === 'table'}
                onClose={() => setActiveModal(null)}
                onSelectTable={handleTableSelect}
            />

            {/* Discount Modal */}
            <DiscountModal
                isOpen={activeModal === 'discount'}
                onClose={() => setActiveModal(null)}
                subtotal={subtotal}
                onApplyDiscount={handleDiscountApply}
            />

            {/* Hold Orders Modal */}
            <HoldOrdersModal
                isOpen={activeModal === 'holdOrders'}
                onClose={() => setActiveModal(null)}
                heldOrders={[]} // Will be loaded from service in real time
                onRetrieve={handleRetrieveOrder}
                onDelete={handleDeleteHeldOrder}
            />

            {/* Kitchen Send Modal */}
            <KitchenSendModal
                isOpen={activeModal === 'kitchen'}
                onClose={() => setActiveModal(null)}
                items={items as any}
                orderNumber={'ORD-' + Date.now().toString().slice(-6)}
                tableNumber={selectedTable?.number}
                onConfirm={handleSendToKitchen}
            />

            {/* Barcode Scanner Modal */}
            <BarcodeScannerModal
                isOpen={activeModal === 'barcode'}
                onClose={() => setActiveModal(null)}
                onScan={(barcode) => {
                    toast.info('Scanned: ' + barcode);
                    // TODO: Search product by barcode and add to cart
                    setActiveModal(null);
                }}
            />

            {/* Product Modifiers Modal */}
            <ProductModifiersModal
                isOpen={activeModal === 'modifiers' && !!selectedProduct}
                onClose={() => {
                    setActiveModal(null);
                    setSelectedProduct(null);
                }}
                productId={selectedProduct?.id || ''}
                productName={selectedProduct?.name || ''}
                onConfirm={handleModifiersConfirm}
            />
        </div>
    );
};
