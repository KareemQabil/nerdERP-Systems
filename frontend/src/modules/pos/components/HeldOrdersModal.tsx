import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Clock,
    ShoppingBag,
    Trash2,
    ArrowRight,
    Edit3,
    User,
    UtensilsCrossed,
    Package,
    Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useOrderStore, type HeldOrder } from '@/stores/order.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';

interface HeldOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRecall: (order: HeldOrder) => void;
}

/**
 * Held Orders Modal
 * View, manage, and recall parked orders
 */
export function HeldOrdersModal({ isOpen, onClose, onRecall }: HeldOrdersModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();
    const { heldOrders, deleteHeldOrder, renameHeldOrder } = useOrderStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Filter orders by search
    const filteredOrders = heldOrders.filter((order) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            order.name.toLowerCase().includes(query) ||
            (order.nameAr && order.nameAr.includes(searchQuery)) ||
            (order.customer?.name.toLowerCase().includes(query)) ||
            (order.table?.number.includes(query))
        );
    });

    const handleRecall = (order: HeldOrder) => {
        onRecall(order);
        onClose();
    };

    const handleStartEdit = (order: HeldOrder) => {
        setEditingId(order.id);
        setEditName(order.name);
    };

    const handleSaveEdit = (orderId: string) => {
        if (editName.trim()) {
            renameHeldOrder(orderId, editName.trim());
        }
        setEditingId(null);
        setEditName('');
    };

    const handleDelete = (orderId: string) => {
        deleteHeldOrder(orderId);
    };

    const formatTimeAgo = (isoDate: string) => {
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Just now';
        if (diffMins < 60) return language === 'ar' ? `${diffMins} دقيقة` : `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return language === 'ar' ? `${diffHours} ساعة` : `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return language === 'ar' ? `${diffDays} يوم` : `${diffDays}d ago`;
    };

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
                        'relative w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col',
                        'bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl',
                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                        'data-[theme=luxury]:bg-slate-950/95 data-[theme=luxury]:border-amber-800/30',
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
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center',
                                    'bg-gradient-to-br from-violet-500 to-violet-600',
                                )}
                            >
                                <Clock className="w-5 h-5 text-white" />
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
                                    {t('heldOrders.title', 'Held Orders')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {heldOrders.length} {language === 'ar' ? 'طلب معلق' : 'orders on hold'}
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
                    <div className="p-4 border-b border-slate-700/50 data-[theme=light]:border-slate-200" data-theme={theme}>
                        <div className="relative">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={language === 'ar' ? 'بحث...' : 'Search orders...'}
                                data-theme={theme}
                                className={cn(
                                    'w-full ps-10 pe-4 py-2 rounded-xl text-sm',
                                    'bg-slate-800/50 border border-slate-700/50',
                                    'text-white placeholder-slate-500',
                                    'focus:outline-none focus:border-violet-500/50',
                                    'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                    'data-[theme=light]:text-slate-900',
                                )}
                            />
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <motion.div
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    data-theme={theme}
                                    className={cn(
                                        'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                                        'bg-slate-800',
                                        'data-[theme=light]:bg-slate-100',
                                    )}
                                >
                                    <ShoppingBag className="w-8 h-8 text-slate-500" />
                                </motion.div>
                                <p className="text-slate-400">
                                    {searchQuery
                                        ? (language === 'ar' ? 'لا توجد نتائج' : 'No orders found')
                                        : (language === 'ar' ? 'لا توجد طلبات معلقة' : 'No held orders')}
                                </p>
                            </div>
                        ) : (
                            filteredOrders.map((order) => (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    data-theme={theme}
                                    className={cn(
                                        'rounded-xl border p-4',
                                        'bg-slate-800/50 border-slate-700/50',
                                        'hover:border-violet-500/50 transition-colors',
                                        'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                        'data-[theme=light]:hover:border-violet-500',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Order Info */}
                                        <div className="flex-1 min-w-0">
                                            {/* Name (editable) */}
                                            {editingId === order.id ? (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(order.id);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                        autoFocus
                                                        className={cn(
                                                            'flex-1 px-2 py-1 rounded text-sm font-bold',
                                                            'bg-slate-700 border border-violet-500 text-white',
                                                            'focus:outline-none',
                                                        )}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={() => handleSaveEdit(order.id)}
                                                    >
                                                        {language === 'ar' ? 'حفظ' : 'Save'}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3
                                                        data-theme={theme}
                                                        className={cn(
                                                            'font-bold',
                                                            'text-white',
                                                            'data-[theme=light]:text-slate-900',
                                                        )}
                                                    >
                                                        {order.name}
                                                    </h3>
                                                    <button
                                                        onClick={() => handleStartEdit(order)}
                                                        className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-white"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Meta info */}
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTimeAgo(order.heldAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Package className="w-3 h-3" />
                                                    {order.items.length} {language === 'ar' ? 'عنصر' : 'items'}
                                                </span>
                                                {order.customer && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {order.customer.name}
                                                    </span>
                                                )}
                                                {order.table && (
                                                    <span className="flex items-center gap-1">
                                                        <UtensilsCrossed className="w-3 h-3" />
                                                        {language === 'ar' ? 'طاولة' : 'Table'} {order.table.number}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Items preview */}
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {order.items.slice(0, 3).map((item, i) => (
                                                    <span
                                                        key={i}
                                                        data-theme={theme}
                                                        className={cn(
                                                            'px-2 py-0.5 rounded text-xs',
                                                            'bg-slate-700/50 text-slate-300',
                                                            'data-[theme=light]:bg-slate-200 data-[theme=light]:text-slate-600',
                                                        )}
                                                    >
                                                        {item.quantity}x {language === 'ar' && item.product.nameAr ? item.product.nameAr : item.product.name}
                                                    </span>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <span className="px-2 py-0.5 text-xs text-slate-500">
                                                        +{order.items.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Total & Actions */}
                                        <div className="flex flex-col items-end gap-2">
                                            <PriceDisplay value={order.total} size="lg" variant="primary" />

                                            <div className="flex gap-1">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleDelete(order.id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleRecall(order)}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm',
                                                        'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30',
                                                        'data-[theme=light]:bg-violet-100 data-[theme=light]:text-violet-600',
                                                    )}
                                                >
                                                    {language === 'ar' ? 'استرجاع' : 'Recall'}
                                                    <ArrowRight className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        data-theme={theme}
                        className={cn(
                            'p-4 border-t',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200',
                        )}
                    >
                        <Button variant="secondary" className="w-full" onClick={onClose}>
                            {t('close', 'Close')}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default HeldOrdersModal;
