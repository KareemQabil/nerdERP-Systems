import { useState } from 'react';
import { X, Printer, ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/modules/sales/store/cartStore';

export interface KitchenPreviewModalProps {
    items: CartItem[];
    onClose: () => void;
    onConfirmPrint: (referenceNote: string) => void;
}

export function KitchenPreviewModal({ items, onClose, onConfirmPrint }: KitchenPreviewModalProps) {
    const [referenceNote, setReferenceNote] = useState('');

    const handlePrint = () => {
        if (!referenceNote.trim()) {
            alert('الرجاء إدخال رقم الطاولة أو اسم العميل');
            return;
        }
        onConfirmPrint(referenceNote);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Main Glass Modal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-gray-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 left-6 z-20 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 group"
                >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </button>

                {/* Header */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(251,146,60,0.15)]">
                            <ChefHat className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white font-['Almarai']">طلب المطبخ</h2>
                            <p className="text-sm text-orange-400/80">أدخل رقم الطاولة أو اسم العميل</p>
                        </div>
                    </div>

                    {/* Reference Input Field */}
                    <div className="relative">
                        <input
                            type="text"
                            value={referenceNote}
                            onChange={(e) => setReferenceNote(e.target.value)}
                            placeholder="مثال: طاولة 5 أو أحمد محمد"
                            className="w-full h-14 px-4 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-orange-400/50 focus:bg-white/10 text-white placeholder-gray-500 text-lg font-['Almarai'] transition-all outline-none"
                            autoFocus
                        />
                        {referenceNote && (
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 font-bold">
                                ✓
                            </div>
                        )}
                    </div>
                </div>

                {/* Kitchen Ticket Preview */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-white rounded-2xl p-8 shadow-xl font-mono">
                        {/* Header */}
                        <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                            <h1 className="text-3xl font-bold uppercase mb-2">
                                {referenceNote || 'COUNTER ORDER'}
                            </h1>
                            <p className="text-lg text-gray-600">
                                {new Date().toLocaleTimeString('ar-SA', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false,
                                })}
                            </p>
                        </div>

                        {/* Items */}
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="border-b border-gray-300 pb-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl font-bold min-w-[40px]">{item.quantity}x</span>
                                        <div className="flex-1">
                                            <p className="text-xl font-bold uppercase">{item.product.name}</p>

                                            {/* Modifiers */}
                                            {item.modifiers && item.modifiers.length > 0 && (
                                                <div className="mt-2 ml-4 space-y-1">
                                                    {item.modifiers.map((modifier: any, modIdx: number) => (
                                                        <div key={modIdx} className="flex items-center gap-2">
                                                            <span className="text-orange-600 font-bold">→</span>
                                                            <span className="text-lg font-bold uppercase text-gray-800">
                                                                {modifier.name || modifier.optionName}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Special Instructions */}
                                            {item.specialInstructions && (
                                                <div className="mt-2 ml-4 bg-yellow-100 border-l-4 border-yellow-500 p-2">
                                                    <p className="text-sm font-bold text-gray-800">
                                                        📝 ملاحظة: {item.specialInstructions}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="text-center border-t-2 border-dashed border-gray-400 pt-4 mt-4">
                            <p className="text-lg font-bold">*** نسخة المطبخ ***</p>
                            <p className="text-sm text-gray-600">{new Date().toLocaleDateString('ar-SA')}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm border-t border-white/5">
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold font-['Almarai'] transition-all duration-300"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handlePrint}
                            className={cn(
                                "flex-1 h-14 rounded-2xl font-bold font-['Almarai'] flex items-center justify-center gap-3 transition-all duration-300",
                                referenceNote.trim()
                                    ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-400/30 text-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.2)]"
                                    : "bg-gray-700/20 border border-gray-600/30 text-gray-500 cursor-not-allowed"
                            )}
                            disabled={!referenceNote.trim()}
                        >
                            <Printer className="w-6 h-6" />
                            <span>طباعة الآن</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
