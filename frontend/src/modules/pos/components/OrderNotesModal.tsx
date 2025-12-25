import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    MessageSquare,
    Check,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';

interface OrderNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (notes: string) => void;
    initialNotes?: string | null;
}

// Quick note templates
const QUICK_NOTES = [
    { en: 'Rush order', ar: 'طلب مستعجل', icon: Clock },
    { en: 'No plastic bags', ar: 'بدون أكياس بلاستيك', icon: AlertCircle },
    { en: 'Call before delivery', ar: 'اتصل قبل التوصيل', icon: AlertCircle },
    { en: 'Birthday order', ar: 'طلب عيد ميلاد', icon: AlertCircle },
    { en: 'Allergies - check with kitchen', ar: 'حساسية - تحقق مع المطبخ', icon: AlertCircle },
];

/**
 * Order Notes Modal
 * Add special notes or instructions to the order
 */
export function OrderNotesModal({
    isOpen,
    onClose,
    onSave,
    initialNotes = '',
}: OrderNotesModalProps) {
    const { t } = useTranslation('pos');
    const { theme, language } = useSettingsStore();

    const [notes, setNotes] = useState(initialNotes || '');
    const [charCount, setCharCount] = useState(0);

    const MAX_CHARS = 500;

    // Sync with initial notes when modal opens
    useEffect(() => {
        if (isOpen) {
            setNotes(initialNotes || '');
            setCharCount((initialNotes || '').length);
        }
    }, [isOpen, initialNotes]);

    const handleNotesChange = (value: string) => {
        if (value.length <= MAX_CHARS) {
            setNotes(value);
            setCharCount(value.length);
        }
    };

    const handleQuickNote = (note: string) => {
        const newNotes = notes ? `${notes}\n${note}` : note;
        if (newNotes.length <= MAX_CHARS) {
            setNotes(newNotes);
            setCharCount(newNotes.length);
        }
    };

    const handleSave = () => {
        onSave(notes.trim());
        onClose();
    };

    const handleClear = () => {
        setNotes('');
        setCharCount(0);
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
                        'relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden',
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
                                    'bg-gradient-to-br from-emerald-500 to-emerald-600',
                                )}
                            >
                                <MessageSquare className="w-5 h-5 text-white" />
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
                                    {t('orderNotes.title', 'Order Notes')}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {language === 'ar' ? 'تعليمات خاصة للطلب' : 'Special instructions'}
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

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {/* Quick Notes */}
                        <div>
                            <p
                                data-theme={theme}
                                className={cn(
                                    'text-xs font-medium mb-2',
                                    'text-slate-400',
                                    'data-[theme=light]:text-slate-500',
                                )}
                            >
                                {language === 'ar' ? 'ملاحظات سريعة' : 'Quick notes'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_NOTES.map((note, index) => (
                                    <motion.button
                                        key={index}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleQuickNote(language === 'ar' ? note.ar : note.en)}
                                        data-theme={theme}
                                        className={cn(
                                            'px-3 py-1.5 rounded-lg text-xs font-medium',
                                            'bg-slate-800/50 border border-slate-700/50',
                                            'text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400',
                                            'transition-colors',
                                            'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-200',
                                            'data-[theme=light]:text-slate-600 data-[theme=light]:hover:border-emerald-500',
                                            'data-[theme=light]:hover:text-emerald-600',
                                        )}
                                    >
                                        {language === 'ar' ? note.ar : note.en}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Textarea */}
                        <div>
                            <textarea
                                value={notes}
                                onChange={(e) => handleNotesChange(e.target.value)}
                                placeholder={language === 'ar' ? 'أدخل ملاحظات الطلب هنا...' : 'Enter order notes here...'}
                                rows={5}
                                data-theme={theme}
                                className={cn(
                                    'w-full px-4 py-3 rounded-xl text-sm resize-none',
                                    'bg-slate-800/50 border border-slate-700/50',
                                    'text-white placeholder-slate-500',
                                    'focus:outline-none focus:border-emerald-500/50',
                                    'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-200',
                                    'data-[theme=light]:text-slate-900 data-[theme=light]:focus:border-emerald-500',
                                )}
                            />
                            <div className="flex justify-between mt-1">
                                {notes && (
                                    <button
                                        onClick={handleClear}
                                        className="text-xs text-red-400 hover:text-red-300"
                                    >
                                        {language === 'ar' ? 'مسح' : 'Clear'}
                                    </button>
                                )}
                                <span
                                    data-theme={theme}
                                    className={cn(
                                        'text-xs ms-auto',
                                        charCount > MAX_CHARS * 0.9
                                            ? 'text-amber-400'
                                            : 'text-slate-500',
                                    )}
                                >
                                    {charCount}/{MAX_CHARS}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        data-theme={theme}
                        className={cn(
                            'p-4 border-t flex gap-2',
                            'border-slate-700/50',
                            'data-[theme=light]:border-slate-200',
                        )}
                    >
                        <Button variant="secondary" className="flex-1" onClick={onClose}>
                            {t('cancel', 'Cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1"
                            onClick={handleSave}
                        >
                            <Check className="w-4 h-4 me-2" />
                            {t('save', 'Save')}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default OrderNotesModal;
