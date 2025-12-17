import { useState } from 'react';
import { Search, Mail, Plus, Trash2, Eye } from 'lucide-react';
import { Button } from '@/shared/components/atoms/Button';
import { Input } from '@/shared/components/atoms/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/atoms/Card';
import { Badge } from '@/shared/components/atoms/Badge';
import { Spinner } from '@/shared/components/atoms/Spinner';
import { ProductCard } from '@/shared/components/molecules/ProductCard';
import { CartItem } from '@/shared/components/molecules/CartItem';
import { QuantitySelector } from '@/shared/components/molecules/QuantitySelector';
import { SearchBar } from '@/shared/components/molecules/SearchBar';
import { OrderSummaryRow } from '@/shared/components/molecules/OrderSummaryRow';

/**
 * UiKit Showcase Page
 * Visual verification of all Atom and Molecule components
 * TEMPORARY - For design system validation
 */
export default function UiKitPage() {
    // State for molecule demos
    const [quantity, setQuantity] = useState(2);
    const [searchValue, setSearchValue] = useState('');

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#023047] to-[#001219] p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-[#e2e2e6] mb-2">Design System Showcase</h1>
                    <p className="text-[#c2c7ce]">Visual verification of all Atom components</p>
                </div>

                {/* Buttons */}
                <section>
                    <h2 className="text-2xl font-bold text-[#e2e2e6] mb-6">Buttons</h2>

                    {/* Variants */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-[#e2e2e6] mb-4">Variants</h3>
                            <div className="flex flex-wrap gap-4">
                                <Button variant="default">Primary (Default)</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="destructive">Destructive</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                            </div>
                        </div>

                        {/* Sizes */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#e2e2e6] mb-4">Sizes</h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <Button size="sm">Small</Button>
                                <Button size="default">Default</Button>
                                <Button size="lg">Large</Button>
                                <Button size="xl">Extra Large (POS)</Button>
                            </div>
                        </div>

                        {/* States */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#e2e2e6] mb-4">States</h3>
                            <div className="flex flex-wrap gap-4">
                                <Button isLoading>Loading...</Button>
                                <Button disabled>Disabled</Button>
                                <Button startIcon={<Plus className="h-4 w-4" />}>With Start Icon</Button>
                                <Button endIcon={<Trash2 className="h-4 w-4" />}>With End Icon</Button>
                            </div>
                        </div>

                        {/* Arabic Text */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#e2e2e6] mb-4">RTL / Arabic</h3>
                            <div className="flex flex-wrap gap-4">
                                <Button size="lg">إضافة منتج</Button>
                                <Button variant="destructive" size="lg">حذف</Button>
                                <Button variant="secondary" size="lg">إغلاق</Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Inputs */}
                <section>
                    <h2 className="text-2xl font-bold text-[#e2e2e6] mb-6">Input Fields</h2>

                    <div className="space-y-6 max-w-md">
                        <Input placeholder="Default input..." />

                        <Input
                            label="Search"
                            placeholder="ابحث عن منتج..."
                            startIcon={<Search className="h-4 w-4" />}
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="email@example.com"
                            startIcon={<Mail className="h-4 w-4" />}
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter password"
                            endIcon={<Eye className="h-4 w-4" />}
                        />

                        <Input
                            label="Error State"
                            placeholder="Invalid input"
                            error="هذا الحقل مطلوب"
                            variant="error"
                        />

                        {/* Sizes */}
                        <div className="space-y-4">
                            <Input inputSize="sm" placeholder="Small input" />
                            <Input inputSize="default" placeholder="Default input" />
                            <Input inputSize="lg" placeholder="Large input" />
                        </div>
                    </div>
                </section>

                {/* Cards */}
                <section>
                    <h2 className="text-2xl font-bold text-[#e2e2e6] mb-6">Cards</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Default Card */}
                        <Card variant="default">
                            <CardHeader>
                                <CardTitle>Default Card</CardTitle>
                                <CardDescription>Solid surface background</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-[#c2c7ce]">
                                    This is the default card style with solid gradient background.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Glass Card */}
                        <Card variant="glass">
                            <CardHeader>
                                <CardTitle>Glass Card</CardTitle>
                                <CardDescription>Glassmorphism effect</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-[#c2c7ce]">
                                    This card uses glassmorphism with backdrop blur.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Elevated Card */}
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle>Elevated Card</CardTitle>
                                <CardDescription>With shadow</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-[#c2c7ce]">
                                    This card has an elevated shadow for emphasis.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Badges */}
                <section>
                    <h2 className="text-2xl font-bold text-[#e2e2e6] mb-6">Badges</h2>

                    <div className="space-y-6">
                        {/* Order Statuses */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#e2e2e6] mb-4">Order Statuses</h3>
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="pending">قيد الانتظار</Badge>
                                <Badge variant="preparing">قيد التحضير</Badge>
                                <Badge variant="ready">جاهز</Badge>
                                <Badge variant="completed">مكتمل</Badge>
                                <Badge variant="void">ملغي</Badge>
                            </div>
                        </div>

                        {/* Payment Statuses */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#e2e2e6] mb-4">Payment Statuses</h3>
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="unpaid">غير مدفوع</Badge>
                                <Badge variant="partial">دفع جزئي</Badge>
                                <Badge variant="paid">مدفوع</Badge>
                                <Badge variant="refunded">مسترد</Badge>
                            </div>
                        </div>

                        {/* General Statuses */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#e2e2e6] mb-4">General Statuses</h3>
                            <div className="flex flex-wrap gap-3">
                                <Badge variant="success">Success</Badge>
                                <Badge variant="warning">Warning</Badge>
                                <Badge variant="error">Error</Badge>
                                <Badge variant="info">Info</Badge>
                                <Badge variant="default">Default</Badge>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Spinners */}
                <section>
                    <h2 className="text-2xl font-bold text-[#e2e2e6] mb-6">Loading Spinners</h2>

                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <Spinner size="sm" />
                            <p className="text-sm text-[#c2c7ce] mt-2">Small</p>
                        </div>
                        <div className="text-center">
                            <Spinner size="default" />
                            <p className="text-sm text-[#c2c7ce] mt-2">Default</p>
                        </div>
                        <div className="text-center">
                            <Spinner size="lg" />
                            <p className="text-sm text-[#c2c7ce] mt-2">Large</p>
                        </div>
                    </div>
                </section>

                {/* Combined Example - Product Card */}
                <section>
                    <h2 className="text-2xl font-bold text-[#e2e2e6] mb-6">Combined Example: Product Card</h2>

                    <Card variant="glass" className="max-w-sm">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle>كابتشينو كبير</CardTitle>
                                    <CardDescription>مشروبات ساخنة</CardDescription>
                                </div>
                                <Badge variant="success">متوفر</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-cyan-400 font-inter">25.00 SAR</span>
                                <Badge variant="info">15% ضريبة</Badge>
                            </div>
                            <Button className="w-full" size="lg">
                                <Plus className="h-5 w-5 ml-2" />
                                إضافة إلى الطلب
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                {/* ===== MOLECULES SECTION ===== */}
                <section className="pt-12 border-t-2 border-cyan-400/30">
                    <h2 className="text-3xl font-bold text-cyan-400 mb-8">Molecule Components</h2>

                    {/* Product Cards Grid */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-[#e2e2e6] mb-4">Product Cards</h3>
                            <p className="text-[#c2c7ce] mb-6">
                                "البقرة الحلوب" - The main product display component
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <ProductCard
                                    name="كابتشينو كبير"
                                    price="25.000"
                                    onClick={() => console.log('Product clicked')}
                                />

                                <ProductCard
                                    name="لاتيه"
                                    price="22.000"
                                    badge="الأكثر مبيعاً"
                                    onClick={() => console.log('Product clicked')}
                                />

                                <ProductCard
                                    name="إسبريسو"
                                    price="15.000"
                                    image="/images/espresso.jpg"
                                    onClick={() => console.log('Product clicked')}
                                />

                                <ProductCard
                                    name="فرابتشينو"
                                    price="28.000"
                                    isOutOfStock
                                    onClick={() => console.log('Cannot click - out of stock')}
                                />
                            </div>
                        </div>

                        {/* Quantity Selector */}
                        <div>
                            <h3 className="text-2xl font-bold text-[#e2e2e6] mb-4">Quantity Selector (CRITICAL)</h3>
                            <p className="text-[#c2c7ce] mb-6">Touch-friendly quantity adjustment with +/- buttons</p>

                            <div className="flex flex-wrap items-center gap-8">
                                <div className="space-y-2">
                                    <p className="text-sm text-[#c2c7ce]">Small</p>
                                    <QuantitySelector
                                        value={quantity}
                                        onIncrement={() => setQuantity(q => Math.min(999, q + 1))}
                                        onDecrement={() => setQuantity(q => Math.max(1, q - 1))}
                                        size="sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm text-[#c2c7ce]">Default</p>
                                    <QuantitySelector
                                        value={quantity}
                                        onIncrement={() => setQuantity(q => Math.min(999, q + 1))}
                                        onDecrement={() => setQuantity(q => Math.max(1, q - 1))}
                                        size="default"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm text-[#c2c7ce]">Large (POS)</p>
                                    <QuantitySelector
                                        value={quantity}
                                        onIncrement={() => setQuantity(q => Math.min(999, q + 1))}
                                        onDecrement={() => setQuantity(q => Math.max(1, q - 1))}
                                        size="lg"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm text-[#c2c7ce]">With Direct Input</p>
                                    <QuantitySelector
                                        value={quantity}
                                        onIncrement={() => setQuantity(q => Math.min(999, q + 1))}
                                        onDecrement={() => setQuantity(q => Math.max(1, q - 1))}
                                        onChange={(val) => setQuantity(val)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cart Items */}
                        <div>
                            <h3 className="text-2xl font-bold text-[#e2e2e6] mb-4">Cart Items</h3>
                            <p className="text-[#c2c7ce] mb-6">Compact rows for cart sidebar display</p>

                            <div className="max-w-md space-y-3">
                                <CartItem
                                    name="كابتشينو كبير"
                                    quantity={2}
                                    price="50.000"
                                    modifiers={["حجم كبير", "سكر إضافي +2.00"]}
                                    onRemove={() => console.log('Remove item')}
                                    onIncrement={() => console.log('Increment')}
                                    onDecrement={() => console.log('Decrement')}
                                />

                                <CartItem
                                    name="لاتيه"
                                    quantity={1}
                                    price="22.000"
                                    onRemove={() => console.log('Remove item')}
                                    onIncrement={() => console.log('Increment')}
                                    onDecrement={() => console.log('Decrement')}
                                />

                                <CartItem
                                    name="كرواسون طازج"
                                    quantity={3}
                                    price="24.000"
                                    modifiers={["سخن في الميكروويف"]}
                                    onRemove={() => console.log('Remove item')}
                                    onIncrement={() => console.log('Increment')}
                                    onDecrement={() => console.log('Decrement')}
                                />
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div>
                            <h3 className="text-2xl font-bold text-[#e2e2e6] mb-4">Search Bar</h3>
                            <p className="text-[#c2c7ce] mb-6">Search input with debounce + optional filter button</p>

                            <div className="space-y-4 max-w-2xl">
                                <SearchBar
                                    value={searchValue}
                                    placeholder="ابحث عن منتج..."
                                    onSearch={(value) => {
                                        console.log('Search:', value);
                                        setSearchValue(value);
                                    }}
                                />

                                <SearchBar
                                    value={searchValue}
                                    placeholder="ابحث مع تصفية..."
                                    onSearch={(value) => {
                                        console.log('Search:', value);
                                        setSearchValue(value);
                                    }}
                                    showFilter
                                    onFilterClick={() => console.log('Open filters')}
                                />
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div>
                            <h3 className="text-2xl font-bold text-[#e2e2e6] mb-4">Order Summary Rows</h3>
                            <p className="text-[#c2c7ce] mb-6">Label-value pairs for order totals</p>

                            <Card variant="default" className="max-w-md p-6">
                                <div className="space-y-1">
                                    <OrderSummaryRow label="المجموع الفرعي" value="100.000" />
                                    <OrderSummaryRow label="الخصم" value="-10.000" />
                                    <OrderSummaryRow label="الضريبة (15%)" value="13.500" />
                                    <OrderSummaryRow
                                        label="الإجمالي"
                                        value="103.500"
                                        variant="highlight"
                                    />
                                </div>
                            </Card>
                        </div>

                        {/* Complete Cart Example */}
                        <div>
                            <h3 className="text-2xl font-bold text-[#e2e2e6] mb-4">Complete Cart Preview</h3>
                            <p className="text-[#c2c7ce] mb-6">Combined molecules showing actual POS cart layout</p>

                            <Card variant="glass" className="max-w-md p-6">
                                <CardHeader className="p-0 pb-4">
                                    <CardTitle>السلة (3 منتجات)</CardTitle>
                                </CardHeader>

                                <CardContent className="p-0 space-y-6">
                                    {/* Cart Items */}
                                    <div className="space-y-3">
                                        <CartItem
                                            name="كابتشينو كبير"
                                            quantity={2}
                                            price="50.000"
                                            modifiers={["حجم كبير"]}
                                            onRemove={() => console.log('Remove')}
                                            onIncrement={() => console.log('+')}
                                            onDecrement={() => console.log('-')}
                                        />
                                        <CartItem
                                            name="كرواسون"
                                            quantity={1}
                                            price="8.000"
                                            onRemove={() => console.log('Remove')}
                                            onIncrement={() => console.log('+')}
                                            onDecrement={() => console.log('-')}
                                        />
                                    </div>

                                    {/* Summary */}
                                    <div className="pt-4 border-t border-[rgba(255,255,255,0.1)] space-y-1">
                                        <OrderSummaryRow label="المجموع الفرعي" value="58.000" />
                                        <OrderSummaryRow label="الضريبة (15%)" value="8.700" />
                                        <OrderSummaryRow label="الإجمالي" value="66.700" variant="highlight" />
                                    </div>

                                    {/* Checkout Button */}
                                    <Button className="w-full" size="lg">
                                        إتمام الطلب
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
