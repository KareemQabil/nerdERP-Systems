import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, Store, UtensilsCrossed, CarFront } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/stores/settings.store';
import { useCartStore } from '@/stores/cart.store';
import { useFeedback, FeedbackBar } from '@/components/feedback';
import { Input } from '@/components/ui';
import { CategoryPills, ProductCard } from '@/components/shared';
import { CartPanel } from '../components/CartPanel';
import { POSActionBar } from '../components/POSActionBar';
import { cn } from '@/lib/utils';

// Mock data with Unsplash images for demonstration
const mockCategories = [
    { id: '1', name: 'All', nameAr: 'الكل', icon: 'all' },
    { id: '2', name: 'Hot Drinks', nameAr: 'مشروبات ساخنة', icon: 'hot-drinks' },
    { id: '3', name: 'Cold Drinks', nameAr: 'مشروبات باردة', icon: 'cold-drinks' },
    { id: '4', name: 'Bakery', nameAr: 'المخبوزات', icon: 'bakery' },
    { id: '5', name: 'Desserts', nameAr: 'الحلويات', icon: 'desserts' },
    { id: '6', name: 'Salads', nameAr: 'السلطات', icon: 'salads' },
];

// Product images from Unsplash (high quality, free to use)
const mockProducts = [
    {
        id: '1',
        name: 'Daily Brew Coffee',
        nameAr: 'قهوة اليوم',
        price: '10.000',
        stock: 100,
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
        badgeType: 'popular' as const,
    },
    {
        id: '2',
        name: 'Premium Espresso',
        nameAr: 'إسبريسو مميز',
        price: '8.000',
        stock: 100,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop',
        badgeType: 'bestseller' as const,
    },
    {
        id: '3',
        name: 'Classic Latte',
        nameAr: 'لاتيه كلاسيكي',
        price: '15.000',
        stock: 30,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
        badgeType: null,
    },
    {
        id: '4',
        name: 'Pepsi Cola',
        nameAr: 'بيبسي كولا',
        price: '5.000',
        stock: 50,
        image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop',
        badgeType: null,
    },
    {
        id: '5',
        name: 'Fresh Caesar Salad',
        nameAr: 'سلطة سيزر طازجة',
        price: '30.000',
        stock: 12,
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop',
        badgeType: 'new' as const,
    },
    {
        id: '6',
        name: 'Natural Honey Cake',
        nameAr: 'كيكة العسل الطبيعي',
        price: '22.000',
        stock: 8,
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
        badgeType: 'popular' as const,
    },
    {
        id: '7',
        name: 'Cheese Croissant',
        nameAr: 'كرواسون بالجبنة',
        price: '10.000',
        stock: 0, // Out of stock
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop',
        badgeType: null,
    },
    {
        id: '8',
        name: 'Natural Spring Water',
        nameAr: 'مياه معدنية طبيعية',
        price: '2.000',
        stock: 100,
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop',
        badgeType: null,
    },
];

// Order types
const orderTypes = [
    { id: 'dine-in', labelAr: 'في المطعم', labelEn: 'Dine-in', icon: UtensilsCrossed },
    { id: 'takeaway', labelAr: 'سفري', labelEn: 'Takeaway', icon: CarFront },
    { id: 'pickup', labelAr: 'استلام', labelEn: 'Pickup', icon: Store },
];

/**
 * Premium POS Page - Main Point of Sale Screen
 * Cart PUSHES products instead of overlapping them
 */
export default function POSPage() {
    const { t } = useTranslation(['pos', 'common']);
    const { language, theme } = useSettingsStore();
    const { addItem, getItemCount } = useCartStore();
    const { messages, dismissFeedback, success } = useFeedback();

    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrderType, setSelectedOrderType] = useState('takeaway');
    const [isOrderTypeOpen, setIsOrderTypeOpen] = useState(false);

    const handleAddProduct = (productId: string) => {
        const product = mockProducts.find((p) => p.id === productId);
        if (product) {
            addItem({
                id: product.id,
                sku: `SKU-${product.id}`,
                name: product.name,
                nameAr: product.nameAr,
                salePrice: product.price,
                imageUrl: product.image,
            });
            success(t('feedback.productAdded', { name: language === 'ar' ? product.nameAr : product.name }));
        }
    };

    // Filter products by search
    const filteredProducts = mockProducts.filter((product) => {
        const matchesSearch = searchQuery === '' ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.nameAr.includes(searchQuery);
        return matchesSearch;
    });

    const currentOrderType = orderTypes.find(ot => ot.id === selectedOrderType)!;
    const OrderTypeIcon = currentOrderType.icon;

    return (
        <div data-theme={theme} className="relative min-h-screen pb-24 flex">
            {/* Feedback Bar - toast notifications */}
            <FeedbackBar messages={messages} onDismiss={dismissFeedback} />

            {/* Main Content - Shrinks when cart is open */}
            <motion.div
                className="flex-1 min-w-0"
                animate={{
                    paddingInlineEnd: isCartExpanded ? '400px' : '0px',
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
                <div className="p-6 space-y-5">
                    {/* Top Bar: Order Type Selector + Search */}
                    <div className="flex items-center gap-4">
                        {/* Order Type Selector - Enhanced dropdown */}
                        <div className="relative">
                            <motion.button
                                onClick={() => setIsOrderTypeOpen(!isOrderTypeOpen)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                data-theme={theme}
                                className={cn(
                                    'flex items-center gap-3 px-5 py-3 rounded-xl backdrop-blur-xl border',
                                    'transition-all duration-300 min-w-[160px]',
                                    // Dark theme
                                    'bg-slate-800/60 border-slate-600/60 hover:border-cyan-400/50',
                                    // Light theme - HIGH CONTRAST
                                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-400',
                                    'data-[theme=light]:hover:border-cyan-600 data-[theme=light]:shadow-lg',
                                    // Luxury theme
                                    'data-[theme=luxury]:bg-black/60 data-[theme=luxury]:border-amber-500/30',
                                    'data-[theme=luxury]:hover:border-amber-400',
                                )}
                            >
                                <OrderTypeIcon data-theme={theme} className={cn(
                                    'w-5 h-5',
                                    'text-cyan-400',
                                    'data-[theme=light]:text-cyan-700',
                                    'data-[theme=luxury]:text-amber-400',
                                )} />
                                <span data-theme={theme} className={cn(
                                    'font-bold',
                                    'text-white',
                                    'data-[theme=light]:text-slate-900',
                                    'data-[theme=luxury]:text-amber-400',
                                )}>
                                    {language === 'ar' ? currentOrderType.labelAr : currentOrderType.labelEn}
                                </span>
                                <motion.div
                                    animate={{ rotate: isOrderTypeOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronDown data-theme={theme} className={cn(
                                        'w-4 h-4',
                                        'text-slate-400',
                                        'data-[theme=light]:text-slate-700',
                                    )} />
                                </motion.div>
                            </motion.button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {isOrderTypeOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        data-theme={theme}
                                        className={cn(
                                            'absolute top-full mt-2 w-full z-50 rounded-xl overflow-hidden',
                                            'backdrop-blur-xl border shadow-xl',
                                            'bg-slate-900/95 border-slate-600/60',
                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                                            'data-[theme=light]:shadow-slate-300/50',
                                            'data-[theme=luxury]:bg-black/95 data-[theme=luxury]:border-amber-500/40',
                                        )}
                                    >
                                        {orderTypes.map((orderType) => {
                                            const Icon = orderType.icon;
                                            const isSelected = orderType.id === selectedOrderType;
                                            return (
                                                <button
                                                    key={orderType.id}
                                                    onClick={() => {
                                                        setSelectedOrderType(orderType.id);
                                                        setIsOrderTypeOpen(false);
                                                    }}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                                                        isSelected
                                                            ? 'bg-cyan-500/20 data-[theme=light]:bg-cyan-100 data-[theme=luxury]:bg-amber-500/20'
                                                            : 'hover:bg-slate-800/50 data-[theme=light]:hover:bg-slate-100',
                                                    )}
                                                >
                                                    <Icon data-theme={theme} className={cn(
                                                        'w-5 h-5',
                                                        isSelected
                                                            ? 'text-cyan-400 data-[theme=light]:text-cyan-700 data-[theme=luxury]:text-amber-400'
                                                            : 'text-slate-400 data-[theme=light]:text-slate-600',
                                                    )} />
                                                    <span data-theme={theme} className={cn(
                                                        'font-medium',
                                                        isSelected
                                                            ? 'text-white data-[theme=light]:text-cyan-800 data-[theme=luxury]:text-amber-400'
                                                            : 'text-slate-300 data-[theme=light]:text-slate-800',
                                                    )}>
                                                        {language === 'ar' ? orderType.labelAr : orderType.labelEn}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Search Input with glassmorphism */}
                        <div className="flex-1">
                            <Input
                                placeholder={t('search', { defaultValue: 'بحث... (Ctrl+F)' })}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                leftIcon={<Search className="w-5 h-5" />}
                                className="backdrop-blur-xl"
                            />
                        </div>
                    </div>

                    {/* Category Pills - horizontal scroll with icons */}
                    <CategoryPills
                        categories={mockCategories}
                        selectedId={selectedCategory}
                        onSelect={setSelectedCategory}
                        allLabel={t('categories.all')}
                    />

                    {/* Products Grid - responsive with enhanced cards */}
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.05,
                                },
                            },
                        }}
                    >
                        {filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0 },
                                }}
                            >
                                <ProductCard
                                    id={product.id}
                                    name={product.name}
                                    nameAr={product.nameAr}
                                    price={product.price}
                                    stock={product.stock}
                                    imageUrl={product.image}
                                    available={product.stock > 0}
                                    badgeType={product.badgeType}
                                    onAdd={handleAddProduct}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Cart Panel - Fixed position, pushes content via margin */}
            <CartPanel
                isExpanded={isCartExpanded}
                onClose={() => setIsCartExpanded(false)}
            />

            {/* Bottom Action Bar */}
            <POSActionBar
                cartItemCount={getItemCount()}
                onPayment={() => console.log('Payment')}
                onDiscount={() => console.log('Discount')}
                onHold={() => console.log('Hold')}
                onFavorites={() => console.log('Favorites')}
                onHistory={() => console.log('History')}
                onPrint={() => console.log('Print')}
                onReturn={() => console.log('Return')}
                onCart={() => setIsCartExpanded(!isCartExpanded)}
            />
        </div>
    );
}
