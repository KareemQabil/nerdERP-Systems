import { useState, useEffect } from 'react';
import { X, Search, User, Phone, Mail, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Customer } from '@/modules/customers/types/customer.types';
import { CustomersApiService } from '@/modules/customers/services/customers-api.service';

export interface CustomerSelectorModalProps {
    onSelect: (customer: Customer) => void;
    onClose: () => void;
}

/**
 * CustomerSelectorModal Component
 * Glassmorphism modal for selecting or creating customers
 * 
 * Features:
 * - Real-time search by name/phone
 * - Customer list with tier badges
 * - Loyalty points display
 * - Quick create customer option
 * - Spring physics animation
 * 
 * @example
 * <CustomerSelectorModal
 *   onSelect={handleCustomerSelect}
 *   onClose={handleClose}
 * />
 */
export function CustomerSelectorModal({ onSelect, onClose }: CustomerSelectorModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load customers on mount and when search changes
    useEffect(() => {
        loadCustomers();
    }, [searchQuery]);

    const loadCustomers = async () => {
        setIsLoading(true);
        try {
            const response = await CustomersApiService.getCustomers({
                search: searchQuery || undefined,
                limit: 50,
            });
            setCustomers(response.data.data);
        } catch (error) {
            console.error('Failed to load customers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCustomer = (customer: Customer) => {
        onSelect(customer);
        onClose();
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'VIP':
                return 'text-purple-400 bg-purple-500/10 border-purple-400/50';
            case 'GOLD':
                return 'text-amber-400 bg-amber-500/10 border-amber-400/50';
            case 'SILVER':
                return 'text-slate-300 bg-slate-500/10 border-slate-400/50';
            default:
                return 'text-gray-400 bg-gray-500/10 border-gray-400/50';
        }
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            >
                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[85vh] bg-[#1a1c1e] rounded-2xl border border-[rgba(255,255,255,0.1)] shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)]">
                        <div>
                            <h2 className="text-2xl font-['Almarai'] font-bold text-[#e2e2e6]">
                                اختر العميل
                            </h2>
                            <p className="text-sm text-[#c2c7ce] mt-1">
                                ابحث عن العميل أو أضف جديد
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-[#c2c7ce]" />
                        </button>
                    </div>

                    {/* Search Input - Glass Style */}
                    <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c2c7ce]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ابحث بالاسم أو رقم الهاتف..."
                                className="w-full h-12 pl-12 pr-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-[#e2e2e6] placeholder:text-[#c2c7ce] font-['Almarai'] focus:outline-none focus:border-cyan-400/50 transition-all"
                                dir="rtl"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Customer List - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-[#c2c7ce] font-['Almarai']">جاري التحميل...</div>
                            </div>
                        ) : customers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <User className="w-16 h-16 text-slate-600 mb-4" />
                                <p className="text-[#c2c7ce] font-['Almarai']">لا توجد نتائج</p>
                                <p className="text-xs text-slate-500 mt-2">جرب البحث بكلمات أخرى</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {customers.map((customer) => (
                                    <motion.button
                                        key={customer.id}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => handleSelectCustomer(customer)}
                                        className="w-full p-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:border-cyan-400/50 transition-all flex items-center gap-4"
                                    >
                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                            <User className="w-7 h-7 text-[#023047]" />
                                        </div>

                                        {/* Customer Info */}
                                        <div className="flex-1 text-right">
                                            <div className="flex items-center justify-end gap-2 mb-1">
                                                <h3 className="text-base font-['Almarai'] font-bold text-[#e2e2e6]">
                                                    {customer.nameAr || customer.name}
                                                </h3>
                                                {/* Tier Badge */}
                                                <span
                                                    className={cn(
                                                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                                                        getTierColor(customer.tier)
                                                    )}
                                                >
                                                    {customer.tier}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-end gap-3 text-xs text-[#c2c7ce]">
                                                {/* Phone */}
                                                <div className="flex items-center gap-1">
                                                    <span className="font-['Arial']">{customer.phone}</span>
                                                    <Phone className="w-3 h-3" />
                                                </div>

                                                {/* Email */}
                                                {customer.email && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-['Arial']">{customer.email}</span>
                                                        <Mail className="w-3 h-3" />
                                                    </div>
                                                )}

                                                {/* Loyalty Points */}
                                                <div className="flex items-center gap-1 text-cyan-400">
                                                    <span className="font-['Arial'] font-bold">{customer.loyaltyPoints}</span>
                                                    <Award className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Select Indicator */}
                                        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 flex items-center justify-center flex-shrink-0">
                                            <div className="w-3 h-3 rounded-full bg-cyan-400" />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer - Quick Create Option */}
                    <div className="p-4 border-t border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)]">
                        <button
                            onClick={() => {
                                // TODO: Open create customer modal
                                console.log('Create new customer');
                            }}
                            className="w-full h-12 rounded-xl font-['Almarai'] font-bold text-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] hover:border-cyan-400/50 transition-all"
                        >
                            + إضافة عميل جديد
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
