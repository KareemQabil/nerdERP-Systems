import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChefHat } from 'lucide-react';
import type { CartItem } from '../types/pos.types';
import { useState } from 'react';

interface KitchenSendModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    orderNumber: string;
    tableNumber?: string;
    onConfirm: (notes: string) => void;
}

export function KitchenSendModal({
    isOpen,
    onClose,
    items,
    orderNumber,
    tableNumber,
    onConfirm,
}: KitchenSendModalProps) {
    const [notes, setNotes] = useState('');
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleSend = async () => {
        setIsSending(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        onConfirm(notes);
        setIsSending(false);
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--outline-variant)]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[var(--surface-variant)] border-b border-[var(--outline-variant)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-400 flex items-center justify-center">
                                <ChefHat className="w-5 h-5 text-[#00373a]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                    إرسال للمطبخ
                                </h2>
                                <p className="text-sm text-[var(--on-surface-variant)]">
                                    طلب رقم {orderNumber}
                                    {tableNumber && ` - طاولة ${tableNumber}`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSending}
                            className="w-10 h-10 rounded-xl hover:bg-[var(--surface)] transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-[var(--on-surface-variant)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {/* Items List */}
                        <div className="bg-[var(--surface-variant)] rounded-xl p-4">
                            <h3 className="text-sm font-['Almarai'] font-bold text-[var(--on-surface)] mb-3" dir="auto">
                                العناصر ({items.length})
                            </h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start justify-between bg-[var(--surface)] rounded-lg p-3"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                                {item.quantity}x {item.product.name}
                                            </p>
                                            {item.modifiers && item.modifiers.length > 0 && (
                                                <div className="mt-1 space-y-0.5">
                                                    {item.modifiers.map((mod, modIdx) => (
                                                        <p key={modIdx} className="text-xs text-[var(--on-surface-variant)] font-['Almarai']" dir="auto">
                                                            + {mod.name}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                            {item.specialInstructions && (
                                                <p className="mt-1 text-xs text-orange-400 font-['Almarai']" dir="auto">
                                                    ⚠️ {item.specialInstructions}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Kitchen Notes */}
                        <div>
                            <label className="block text-sm font-['Almarai'] font-bold text-[var(--on-surface)] mb-2" dir="auto">
                                ملاحظات للمطبخ (اختياري)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isSending}
                                placeholder="مثال: استعجال، بدون بصل، إلخ..."
                                className="w-full px-4 py-3 bg-[var(--surface-variant)] border border-[var(--outline-variant)] rounded-xl text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] font-['Almarai'] focus:outline-none focus:border-orange-400 resize-none transition-colors disabled:opacity-50"
                                rows={3}
                                dir="rtl"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSend}
                                disabled={isSending}
                                className="flex-1 h-14 rounded-xl bg-gradient-to-b from-orange-400 to-orange-600 text-[#00373a] font-['Almarai'] font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
                            >
                                {isSending ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <Send className="w-5 h-5" />
                                        </motion.div>
                                        <span dir="auto">جاري الإرسال...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span dir="auto">إرسال للمطبخ</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isSending}
                                className="px-6 h-14 rounded-xl bg-[var(--surface-variant)] hover:bg-[var(--outline-variant)] text-[var(--on-surface)] font-['Almarai'] font-bold transition-colors disabled:opacity-50"
                            >
                                <span dir="auto">إلغاء</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
