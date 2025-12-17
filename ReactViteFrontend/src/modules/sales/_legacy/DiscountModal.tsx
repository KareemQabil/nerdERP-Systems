import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Percent, DollarSign } from 'lucide-react';
import type { Discount } from '../types/pos.types';
import { DiscountService } from '../services/pos.service';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyDiscount: (discount: Discount, customValue?: number) => void;
    subtotal: number;
}

export function DiscountModal({
    isOpen,
    onClose,
    onApplyDiscount,
    subtotal,
}: DiscountModalProps) {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [customValue, setCustomValue] = useState<string>('');
    const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadDiscounts();
        }
    }, [isOpen]);

    const loadDiscounts = async () => {
        try {
            const data = await DiscountService.getDiscounts();
            setDiscounts(data);
        } catch (error) {
            console.error('Error loading discounts:', error);
        }
    };

    if (!isOpen) return null;

    const calculateDiscountAmount = (discount: Discount, customVal?: number) => {
        const value = customVal !== undefined ? customVal : discount.value;
        if (discount.type === 'percentage') {
            return (subtotal * value) / 100;
        }
        return value;
    };

    const handleApply = () => {
        if (selectedDiscount) {
            if (selectedDiscount.id === 'd10') {
                const value = parseFloat(customValue);
                if (value > 0) {
                    onApplyDiscount(selectedDiscount, value);
                    onClose();
                }
            } else {
                onApplyDiscount(selectedDiscount);
                onClose();
            }
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-[var(--surface)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-[var(--outline-variant)]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[var(--outline-variant)]">
                        <div>
                            <h2 className="text-2xl font-['Almarai'] font-bold text-[var(--on-surface)] mb-1" dir="auto">
                                تطبيق الخصم
                            </h2>
                            <p className="text-sm text-[var(--on-surface-variant)] font-['Almarai']" dir="auto">
                                اختر نوع الخصم المناسب
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[var(--surface-variant)] transition-colors"
                        >
                            <X className="w-6 h-6 text-[var(--on-surface-variant)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                        {/* Subtotal */}
                        <div className="bg-gradient-to-r from-cyan-400/10 to-blue-600/10 border border-cyan-400/30 rounded-2xl p-4 text-center">
                            <p className="text-sm text-[var(--on-surface-variant)] font-['Almarai'] mb-1" dir="auto">
                                المجموع الفرعي
                            </p>
                            <p className="text-2xl font-['Arial'] font-bold text-cyan-400">
                                {subtotal.toFixed(2)} ر.س
                            </p>
                        </div>

                        {/* Discount Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            {discounts.slice(0, 9).map((discount) => {
                                const discountAmount = calculateDiscountAmount(discount);
                                const isSelected = selectedDiscount?.id === discount.id;

                                return (
                                    <motion.button
                                        key={discount.id}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSelectedDiscount(discount)}
                                        className={`p-4 rounded-2xl transition-all ${isSelected
                                            ? 'bg-gradient-to-b from-cyan-400 to-blue-600 text-white shadow-lg'
                                            : 'bg-[var(--surface-variant)] border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-cyan-400/50'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            {discount.type === 'percentage' ? (
                                                <Percent className="w-6 h-6" />
                                            ) : (
                                                <DollarSign className="w-6 h-6" />
                                            )}
                                            <div className="text-center">
                                                <p className="text-lg font-['Arial'] font-bold">
                                                    {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} ر.س`}
                                                </p>
                                                <p className="text-xs font-['Arial'] opacity-70 mt-1">
                                                    -{discountAmount.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Custom Discount */}
                        <div className="space-y-3">
                            <button
                                onClick={() => setSelectedDiscount(discounts.find((d) => d.id === 'd10') || null)}
                                className={`w-full p-4 rounded-2xl transition-all ${selectedDiscount?.id === 'd10'
                                    ? 'bg-gradient-to-b from-cyan-400 to-blue-600 text-white shadow-lg'
                                    : 'bg-[var(--surface-variant)] border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:border-cyan-400/50'
                                    }`}
                            >
                                <span className="font-['Almarai']" dir="auto">خصم مخصص</span>
                            </button>

                            {selectedDiscount?.id === 'd10' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3"
                                >
                                    <input
                                        type="number"
                                        value={customValue}
                                        onChange={(e) => setCustomValue(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-4 py-4 bg-[var(--surface-variant)] border border-[var(--outline-variant)] rounded-xl text-xl font-['Arial'] font-bold text-[var(--on-surface)] text-center focus:outline-none focus:border-cyan-400 transition-colors"
                                        dir="ltr"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedDiscount({
                                                    ...selectedDiscount,
                                                    type: 'percentage',
                                                });
                                            }}
                                            className={`flex-1 py-3 rounded-xl font-['Almarai'] transition-all ${selectedDiscount.type === 'percentage'
                                                ? 'bg-cyan-400 text-[#00373a]'
                                                : 'bg-[var(--surface-variant)] border border-[var(--outline-variant)] text-[var(--on-surface-variant)]'
                                                }`}
                                        >
                                            نسبة مئوية %
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedDiscount({
                                                    ...selectedDiscount,
                                                    type: 'fixed',
                                                });
                                            }}
                                            className={`flex-1 py-3 rounded-xl font-['Almarai'] transition-all ${selectedDiscount.type === 'fixed'
                                                ? 'bg-cyan-400 text-[#00373a]'
                                                : 'bg-[var(--surface-variant)] border border-[var(--outline-variant)] text-[var(--on-surface-variant)]'
                                                }`}
                                        >
                                            مبلغ ثابت ر.س
                                        </button>
                                    </div>
                                    {customValue && parseFloat(customValue) > 0 && (
                                        <div className="bg-gradient-to-r from-cyan-400/10 to-blue-600/10 border border-cyan-400/30 rounded-xl p-3 text-center">
                                            <p className="text-sm text-[var(--on-surface-variant)] font-['Almarai']" dir="auto">
                                                قيمة الخصم
                                            </p>
                                            <p className="text-xl font-['Arial'] font-bold text-cyan-400">
                                                -{calculateDiscountAmount(selectedDiscount, parseFloat(customValue)).toFixed(2)} ر.س
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>

                        {/* Apply Button */}
                        <button
                            onClick={handleApply}
                            disabled={!selectedDiscount || (selectedDiscount.id === 'd10' && !customValue)}
                            className={`w-full py-4 rounded-2xl font-['Almarai'] font-bold text-lg transition-all ${selectedDiscount && (selectedDiscount.id !== 'd10' || customValue)
                                ? 'bg-gradient-to-b from-cyan-400 to-blue-600 text-[#00373a] hover:opacity-90 shadow-lg'
                                : 'bg-[var(--surface-variant)] text-[var(--on-surface-variant)] opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <span dir="auto">تطبيق الخصم</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
