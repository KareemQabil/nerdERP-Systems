import { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { KitchenTicket } from '@/modules/sales/components/KitchenTicket/KitchenTicket';
import type { CartItem } from '@/modules/sales/store/cartStore';

export interface PrintPreviewModalProps {
    isOpen: boolean;
    type: 'KITCHEN_ORDER' | 'KITCHEN_VOID';
    data: CartItem[];
    metadata?: {
        tableName?: string;
        orderId?: string;
        voidReason?: string;
        authorizer?: string;
    };
    onConfirm: () => void;
    onCancel: () => void;
}

export function PrintPreviewModal({
    isOpen,
    type,
    data,
    metadata = {},
    onConfirm,
    onCancel,
}: PrintPreviewModalProps) {
    const ticketRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const isVoid = type === 'KITCHEN_VOID';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onCancel}
            />

            {/* Main Modal */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className={`p-6 border-b ${isVoid ? 'border-red-500/30 bg-red-500/10' : 'border-white/5'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl ${isVoid ? 'bg-red-500/20 border-red-500/30' : 'bg-orange-500/20 border-orange-400/20'} border flex items-center justify-center shadow-lg`}>
                                <Printer className={`w-6 h-6 ${isVoid ? 'text-red-400' : 'text-orange-400'}`} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white font-['Almarai']">
                                    {isVoid ? '⛔ معاينة تذكرة الإلغاء' : '👨‍🍳 معاينة طلب المطبخ'}
                                </h2>
                                <p className={`text-sm ${isVoid ? 'text-red-400/80' : 'text-orange-400/80'}`}>
                                    {isVoid ? 'VOID Ticket Preview' : 'Kitchen Order Preview'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onCancel}
                            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-300 group"
                        >
                            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Thermal Paper Preview */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-800/50">
                    <div className="flex justify-center">
                        {/* 80mm Thermal Paper Container */}
                        <div
                            className={`bg-white shadow-2xl ${isVoid ? 'ring-4 ring-red-500' : 'ring-2 ring-gray-300'} rounded-lg overflow-hidden`}
                            style={{ width: '300px' }} // ~80mm
                        >
                            <KitchenTicket
                                ref={ticketRef}
                                items={data}
                                referenceNote={metadata.tableName || metadata.orderId || 'COUNTER ORDER'}
                                orderTime={new Date()}
                                ticketType={isVoid ? 'VOID' : 'ORDER'}
                                voidReason={metadata.voidReason}
                                voidAuthorizer={metadata.authorizer}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t border-white/5 bg-gray-900/50">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Cancel Button */}
                        <button
                            onClick={onCancel}
                            className="h-14 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 text-red-400 font-bold font-['Almarai'] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <X className="w-5 h-5" />
                            <span>إلغاء</span>
                        </button>

                        {/* Confirm & Print Button */}
                        <button
                            onClick={onConfirm}
                            className={`h-14 rounded-xl ${isVoid ? 'bg-red-500/20 hover:bg-red-500/30 border-red-400/50 text-red-400' : 'bg-green-500/20 hover:bg-green-500/30 border-green-400/50 text-green-400'} border font-bold font-['Almarai'] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl`}
                        >
                            <Printer className="w-5 h-5" />
                            <span>طباعة</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Custom Scrollbar */}
            <style>{`
                .overflow-y-auto::-webkit-scrollbar {
                    width: 6px;
                }
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: rgba(251, 146, 60, 0.3);
                    border-radius: 10px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: rgba(251, 146, 60, 0.5);
                }
            `}</style>
        </div>
    );
}
