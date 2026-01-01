import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Search,
    User,
    Phone,
    Star,
    Plus,
    Check,
    UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';
import { Button } from '@/components/ui';
import type { CustomerInfo } from '@/features/pos/types';

interface CustomerSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: CustomerInfo) => void;
    selectedCustomerId?: string;
}

// Mock customers for demo (in production, this would come from API)
const MOCK_CUSTOMERS: CustomerInfo[] = [
    {
        id: 'cust-1',
        name: 'Ahmed Al-Rashid',
        nameAr: 'أحمد الراشد',
        phone: '+966 50 123 4567',
        email: 'ahmed@example.com',
        loyaltyPoints: 1520,
        loyaltyTier: 'Gold',
    },
    {
        id: 'cust-2',
        name: 'Sarah Mohammed',
        nameAr: 'سارة محمد',
        phone: '+966 55 987 6543',
        email: 'sarah@example.com',
        loyaltyPoints: 850,
        loyaltyTier: 'Silver',
    },
    {
        id: 'cust-3',
        name: 'Omar Hassan',
        nameAr: 'عمر حسن',
        phone: '+966 54 456 7890',
        loyaltyPoints: 320,
        loyaltyTier: 'Bronze',
    },
    {
        id: 'cust-4',
        name: 'Fatima Ali',
        nameAr: 'فاطمة علي',
        phone: '+966 59 111 2222',
        loyaltyPoints: 2100,
        loyaltyTier: 'Platinum',
    },
];

const TIER_COLORS = {
    Bronze: 'from-amber-700 to-amber-800',
    Silver: 'from-slate-400 to-slate-500',
    Gold: 'from-amber-400 to-amber-500',
    Platinum: 'from-slate-300 to-slate-400',
};

/**
 * Customer Search Modal
 * Search and select customers to attach to an order
 */
export function CustomerSearchModal({
    isOpen,
    onClose,
    onSelect,
    selectedCustomerId,
}: CustomerSearchModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useAppSelector(selectSettings);

    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

    // Filter customers by search
    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return MOCK_CUSTOMERS;
        const query = searchQuery.toLowerCase();
        return MOCK_CUSTOMERS.filter(
            (c) =>
                c.name.toLowerCase().includes(query) ||
                (c.nameAr && c.nameAr.includes(searchQuery)) ||
                (c.phone && c.phone.includes(query)) ||
                (c.email && c.email.toLowerCase().includes(query))
        );
    }, [searchQuery]);

    const handleSelect = (customer: CustomerInfo) => {
        onSelect(customer);
        onClose();
    };

    const handleCreateCustomer = () => {
        if (!newCustomer.name.trim()) return;

        const customer: CustomerInfo = {
            id: `new-${Date.now()}`,
            name: newCustomer.name.trim(),
            phone: newCustomer.phone.trim() || undefined,
            loyaltyPoints: 0,
        };

        onSelect(customer);
        setIsCreating(false);
        setNewCustomer({ name: '', phone: '' });
        onClose();
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
                        'relative w-full max-w-lg max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col',
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
                                    'bg-gradient-to-br from-blue-500 to-blue-600',
                                )}
                            >
                                <User className="w-5 h-5 text-white" />
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
                                    {t('customer.select', 'Select Customer')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {language === 'ar' ? 'البحث عن عميل أو إنشاء جديد' : 'Search or create new'}
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
                                placeholder={language === 'ar' ? 'اسم، هاتف، بريد...' : 'Name, phone, email...'}
                                data-theme={theme}
                                className={cn(
                                    'w-full ps-10 pe-4 py-2 rounded-xl text-sm',
                                    'bg-slate-800/50 border border-slate-700/50',
                                    'text-white placeholder-slate-500',
                                    'focus:outline-none focus:border-blue-500/50',
                                    'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                    'data-[theme=light]:text-slate-900',
                                )}
                            />
                        </div>
                    </div>

                    {/* Customer List or Create Form */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isCreating ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                data-theme={theme}
                                className={cn(
                                    'rounded-xl border p-4 space-y-4',
                                    'bg-blue-500/10 border-blue-500/30',
                                    'data-[theme=light]:bg-blue-50 data-[theme=light]:border-blue-200',
                                )}
                            >
                                <h3
                                    data-theme={theme}
                                    className={cn(
                                        'font-bold flex items-center gap-2',
                                        'text-blue-400',
                                        'data-[theme=light]:text-blue-600',
                                    )}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    {language === 'ar' ? 'عميل جديد' : 'New Customer'}
                                </h3>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                        placeholder={language === 'ar' ? 'اسم العميل *' : 'Customer name *'}
                                        data-theme={theme}
                                        className={cn(
                                            'w-full px-3 py-2 rounded-lg text-sm',
                                            'bg-slate-800/50 border border-slate-700/50',
                                            'text-white placeholder-slate-500',
                                            'focus:outline-none focus:border-blue-500/50',
                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                                            'data-[theme=light]:text-slate-900',
                                        )}
                                    />
                                    <input
                                        type="tel"
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                        placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone number'}
                                        data-theme={theme}
                                        className={cn(
                                            'w-full px-3 py-2 rounded-lg text-sm',
                                            'bg-slate-800/50 border border-slate-700/50',
                                            'text-white placeholder-slate-500',
                                            'focus:outline-none focus:border-blue-500/50',
                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
                                            'data-[theme=light]:text-slate-900',
                                        )}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setIsCreating(false)}
                                    >
                                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-1"
                                        onClick={handleCreateCustomer}
                                        disabled={!newCustomer.name.trim()}
                                    >
                                        <Check className="w-4 h-4 me-2" />
                                        {language === 'ar' ? 'إضافة' : 'Add'}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                {/* Quick Create Button */}
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setIsCreating(true)}
                                    data-theme={theme}
                                    className={cn(
                                        'w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed',
                                        'border-slate-700/50 text-slate-400 hover:border-blue-500/50 hover:text-blue-400',
                                        'transition-colors',
                                        'data-[theme=light]:border-slate-300 data-[theme=light]:hover:border-blue-500',
                                    )}
                                >
                                    <Plus className="w-4 h-4" />
                                    {language === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer'}
                                </motion.button>

                                {/* Customer List */}
                                {filteredCustomers.map((customer) => {
                                    const isSelected = customer.id === selectedCustomerId;
                                    const displayName = language === 'ar' && customer.nameAr ? customer.nameAr : customer.name;
                                    const tierColor = TIER_COLORS[customer.loyaltyTier as keyof typeof TIER_COLORS] || TIER_COLORS.Bronze;

                                    return (
                                        <motion.button
                                            key={customer.id}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => handleSelect(customer)}
                                            data-theme={theme}
                                            className={cn(
                                                'w-full flex items-center gap-3 p-3 rounded-xl border text-start',
                                                'transition-all',
                                                isSelected
                                                    ? cn(
                                                        'bg-blue-500/20 border-blue-500/50',
                                                        'data-[theme=light]:bg-blue-50 data-[theme=light]:border-blue-300',
                                                    )
                                                    : cn(
                                                        'bg-slate-800/50 border-slate-700/50 hover:border-slate-600',
                                                        'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                                        'data-[theme=light]:hover:border-slate-300',
                                                    ),
                                            )}
                                        >
                                            {/* Avatar */}
                                            <div
                                                className={cn(
                                                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                                                    `bg-gradient-to-br ${tierColor}`,
                                                )}
                                            >
                                                <span className="text-white font-bold text-sm">
                                                    {displayName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    data-theme={theme}
                                                    className={cn(
                                                        'font-semibold truncate',
                                                        'text-white',
                                                        'data-[theme=light]:text-slate-900',
                                                    )}
                                                >
                                                    {displayName}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                                    {customer.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {customer.phone}
                                                        </span>
                                                    )}
                                                    {customer.loyaltyPoints !== undefined && (
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 text-amber-400" />
                                                            {customer.loyaltyPoints}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tier Badge */}
                                            {customer.loyaltyTier && (
                                                <span
                                                    className={cn(
                                                        'px-2 py-1 rounded text-xs font-medium',
                                                        `bg-gradient-to-r ${tierColor}`,
                                                        'text-white',
                                                    )}
                                                >
                                                    {customer.loyaltyTier}
                                                </span>
                                            )}

                                            {/* Selected Check */}
                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}

                                {filteredCustomers.length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        {language === 'ar' ? 'لا توجد نتائج' : 'No customers found'}
                                    </div>
                                )}
                            </>
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
                            {t('cancel', 'Cancel')}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default CustomerSearchModal;
