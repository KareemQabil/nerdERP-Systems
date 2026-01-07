import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Receipt, ChevronRight, Loader2, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Input, Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import { orderService, type Order } from '@/services/order.service';
import { usePrintReceipt } from '@/modules/pos/components/printing/hooks/usePrintReceipt';
import type { InvoiceData } from '@/modules/pos/components/printing/A4InvoiceTemplate';

interface OrderLookupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectOrder?: (order: Order) => void;
    mode?: 'RETURN' | 'REPRINT';
}

export function OrderLookupModal({
    isOpen,
    onClose,
    onSelectOrder,
    mode = 'RETURN',
}: OrderLookupModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();


    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch today's completed orders on open
    useEffect(() => {
        if (isOpen) {
            fetchOrders();
        }
    }, [isOpen]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const result = await orderService.getOrders({
                status: 'COMPLETED',
                limit: 50,
                order: 'DESC',
            });
            setOrders(result.data || []);
        } catch (err) {
            console.error('[OrderLookup] Failed to fetch orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter orders by search
    const filteredOrders = searchQuery
        ? orders.filter((o) =>
            o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : orders;

    const handleSelect = (order: Order) => {
        if (mode === 'RETURN') {
            if (order.status === 'VOIDED' || order.status === 'CANCELLED') {
                return; // Can't void already voided orders
            }
            onSelectOrder?.(order);
            onClose();
        }
    };

    const handlePrint = async (e: React.MouseEvent, order: Order) => {
        e.stopPropagation();

        // Map Order to InvoiceData
        const invoiceData: InvoiceData = {
            storeName: 'NerdPOS Store', // TODO: Get from settings
            storeAddress: 'Riyadh, Saudi Arabia',
            storePhone: '0500000000',
            vatNumber: '300000000000003',
            orderNumber: order.orderNumber,
            orderDate: new Date(order.createdAt).toLocaleDateString(),
            orderTime: new Date(order.createdAt).toLocaleTimeString(),
            cashierName: 'Cashier', // TODO: Get from order user
            items: order.items.map(item => ({
                name: item.productName,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                totalPrice: parseFloat(item.lineTotal),
                modifiers: [], // TODO: Map modifiers if available
            })),
            subtotal: parseFloat(order.subtotal),
            taxRate: 0.15,
            taxAmount: parseFloat(order.taxTotal),
            discount: parseFloat(order.discountTotal),
            total: parseFloat(order.total),
            paymentMethod: 'CASH', // TODO: Get from payment
            amountPaid: parseFloat(order.total), // Assuming full payment
            change: 0,
            invoiceNumber: `INV-${order.orderNumber}`,
            // Add other fields as needed
        };

        try {
            await printA4(invoiceData);
        } catch (error) {
            console.error('Print failed:', error);
        }
    };

    // We need a specific hook instance for A4 printing
    const { printReceipt: printA4, isPrinting: isPrintingA4 } = usePrintReceipt({ format: 'A4' });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    data-theme={theme}
                    className={cn(
                        'relative w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl',
                        'bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                    )}
                >
                    {/* Header */}
                    <div
                        data-theme={theme}
                        className={cn(
                            'flex items-center justify-between p-4 border-b',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200',
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2
                                    data-theme={theme}
                                    className={cn(
                                        'text-lg font-bold',
                                        'text-white',
                                        'data-[theme=light]:text-slate-900',
                                    )}
                                >
                                    {mode === 'RETURN'
                                        ? t('returns.findOrder', 'Find Order to Return')
                                        : t('orders.lookup', 'Order Lookup')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {t('returns.subtitle', 'Search by order number or customer')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b border-slate-700/50 data-[theme=light]:border-slate-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder={t('returns.searchPlaceholder', 'Order number or customer name...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Order List */}
                    <div className="overflow-y-auto max-h-[50vh]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <Receipt className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                                <p className="text-slate-400">
                                    {searchQuery
                                        ? t('returns.noResults', 'No orders found')
                                        : t('returns.noOrders', 'No completed orders today')}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700/50 data-[theme=light]:divide-slate-200">
                                {filteredOrders.map((order) => {
                                    const isVoided = order.status === 'VOIDED' || order.status === 'CANCELLED';
                                    return (
                                        <button
                                            key={order.id}
                                            onClick={() => handleSelect(order)}
                                            disabled={mode === 'RETURN' && isVoided}
                                            data-theme={theme}
                                            className={cn(
                                                'w-full p-4 flex items-center justify-between text-start transition-colors',
                                                (mode === 'RETURN' && isVoided)
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:bg-slate-700/30 data-[theme=light]:hover:bg-slate-50',
                                            )}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-white data-[theme=light]:text-slate-900">
                                                        #{order.orderNumber}
                                                    </span>
                                                    {isVoided && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                                                            {t('returns.voided', 'Voided')}
                                                        </span>
                                                    )}
                                                </div>
                                                {order.customerName && (
                                                    <p className="text-sm text-slate-400 truncate">
                                                        {order.customerName}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-500">
                                                    {new Date(order.createdAt).toLocaleTimeString(
                                                        language === 'ar' ? 'ar-SA' : 'en-US',
                                                        { hour: '2-digit', minute: '2-digit' }
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <PriceDisplay value={order.total} size="md" />

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={(e) => handlePrint(e, order)}
                                                    className="h-8 w-8 text-slate-400 hover:text-cyan-400"
                                                    title={t('common.print', 'Print Invoice')}
                                                >
                                                    {isPrintingA4 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                                </Button>

                                                {!isVoided && mode === 'RETURN' && (
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default OrderLookupModal;
