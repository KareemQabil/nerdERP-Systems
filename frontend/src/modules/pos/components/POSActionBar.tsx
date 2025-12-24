import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CreditCard,
    Tag,
    Clock,
    Heart,
    RotateCcw,
    Printer,
    CornerUpLeft,
    ShoppingCart,
    Sun,
    Moon,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui';
import { useSettingsStore } from '@/stores/settings.store';

export interface POSActionBarProps {
    onPayment?: () => void;
    onDiscount?: () => void;
    onHold?: () => void;
    onFavorites?: () => void;
    onHistory?: () => void;
    onPrint?: () => void;
    onReturn?: () => void;
    onCart?: () => void;
    cartItemCount?: number;
}

interface ActionButton {
    key: string;
    icon: React.ElementType;
    labelKey: string;
    shortcut?: string;
    onClick?: () => void;
}

// Theme options for tri-switch
const themeOptions = [
    { id: 'dark', icon: Moon, label: 'Dark', labelAr: 'داكن' },
    { id: 'light', icon: Sun, label: 'Light', labelAr: 'فاتح' },
    { id: 'luxury', icon: Sparkles, label: 'Luxury', labelAr: 'فاخر' },
] as const;

/**
 * Premium Bottom Action Bar for POS
 * Features: Tri-switch theme, tooltips, keyboard shortcuts, pulsing badge
 * Cart button positioned at START (left in LTR, right in RTL)
 */
export function POSActionBar({
    onPayment,
    onDiscount,
    onHold,
    onFavorites,
    onHistory,
    onPrint,
    onReturn,
    onCart,
    cartItemCount = 0,
}: POSActionBarProps) {
    const { t } = useTranslation('pos');
    const { theme, setTheme, language } = useSettingsStore();
    const [isThemeOpen, setIsThemeOpen] = useState(false);

    const actions: ActionButton[] = [
        { key: 'payment', icon: CreditCard, labelKey: 'actions.payment', shortcut: 'F2', onClick: onPayment },
        { key: 'discount', icon: Tag, labelKey: 'actions.discount', shortcut: 'F3', onClick: onDiscount },
        { key: 'hold', icon: Clock, labelKey: 'actions.hold', shortcut: 'F4', onClick: onHold },
        { key: 'favorites', icon: Heart, labelKey: 'actions.favorites', shortcut: 'F5', onClick: onFavorites },
        { key: 'history', icon: RotateCcw, labelKey: 'actions.history', shortcut: 'F6', onClick: onHistory },
        { key: 'print', icon: Printer, labelKey: 'actions.print', shortcut: 'F7', onClick: onPrint },
        { key: 'return', icon: CornerUpLeft, labelKey: 'actions.return', shortcut: 'F8', onClick: onReturn },
    ];

    const currentTheme = themeOptions.find(t => t.id === theme) || themeOptions[0];
    const CurrentThemeIcon = currentTheme.icon;

    return (
        <div data-theme={theme} className={cn(
            'fixed bottom-0 start-20 end-0 z-30',
            'h-20 border-t',
            'flex items-center px-6',
            // Dark theme - solid background
            'bg-slate-900 border-slate-700 shadow-2xl',
            // Light theme - SOLID WHITE for contrast
            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
            'data-[theme=light]:shadow-xl data-[theme=light]:shadow-slate-400/30',
            // Luxury theme
            'data-[theme=luxury]:bg-black data-[theme=luxury]:border-amber-500/50',
        )}>
            {/* Cart Button - START (Left in LTR, Right in RTL) */}
            <motion.button
                onClick={onCart}
                whileHover={{ y: -4, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    'group relative flex items-center gap-3 px-6 py-3 rounded-2xl',
                    'border shadow-xl transition-all duration-300',
                    // Primary styling
                    'bg-gradient-to-br from-cyan-500 to-cyan-600',
                    'border-cyan-400/50 shadow-cyan-500/30',
                    'hover:from-cyan-400 hover:to-cyan-500 hover:shadow-cyan-500/50',
                    // Light theme - DARKER for contrast
                    'data-[theme=light]:from-cyan-600 data-[theme=light]:to-cyan-700',
                    'data-[theme=light]:border-cyan-600/50 data-[theme=light]:shadow-cyan-700/40',
                    // Luxury theme
                    'data-[theme=luxury]:from-amber-500 data-[theme=luxury]:to-amber-600',
                    'data-[theme=luxury]:border-amber-400/50 data-[theme=luxury]:shadow-amber-500/30',
                )}
                data-theme={theme}
            >
                {/* Badge with pulse animation */}
                <AnimatePresence>
                    {cartItemCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-2 -end-2"
                        >
                            <Badge
                                variant="error"
                                size="sm"
                                className="font-bold min-w-[1.25rem] animate-pulse"
                            >
                                {cartItemCount}
                            </Badge>
                        </motion.div>
                    )}
                </AnimatePresence>

                <ShoppingCart className="w-6 h-6 text-white" />
                <span className="text-base font-bold text-white">
                    {t('actions.cart')}
                </span>
            </motion.button>

            {/* Separator */}
            <div data-theme={theme} className={cn(
                'w-px h-12 mx-4',
                'bg-slate-700',
                'data-[theme=light]:bg-slate-300',
                'data-[theme=luxury]:bg-amber-500/50',
            )} />

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-1">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <motion.button
                            key={action.key}
                            onClick={action.onClick}
                            whileHover={{ y: -4, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            data-theme={theme}
                            className={cn(
                                'group relative flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-xl',
                                'border transition-all duration-300',
                                // Dark theme
                                'bg-slate-800 border-slate-700 hover:border-cyan-400/60',
                                'hover:bg-slate-700 hover:shadow-lg hover:shadow-cyan-500/10',
                                // Light theme - HIGH CONTRAST
                                'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-300',
                                'data-[theme=light]:hover:bg-cyan-50 data-[theme=light]:hover:border-cyan-500',
                                'data-[theme=light]:hover:shadow-cyan-500/20',
                                // Luxury theme
                                'data-[theme=luxury]:bg-slate-900 data-[theme=luxury]:border-amber-500/30',
                                'data-[theme=luxury]:hover:bg-amber-500/15 data-[theme=luxury]:hover:border-amber-400',
                            )}
                        >
                            {/* Tooltip */}
                            <div className={cn(
                                'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg',
                                'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100',
                                'transition-all duration-200 pointer-events-none z-50',
                                'border shadow-lg text-xs font-medium whitespace-nowrap',
                                'bg-slate-900 border-slate-700 text-white',
                                'data-[theme=light]:bg-slate-800 data-[theme=light]:border-slate-700 data-[theme=light]:text-white',
                                'data-[theme=luxury]:bg-black data-[theme=luxury]:border-amber-500/40 data-[theme=luxury]:text-amber-100',
                            )} data-theme={theme}>
                                {t(action.labelKey)}
                                {action.shortcut && (
                                    <span className="ms-2 px-1.5 py-0.5 rounded bg-white/10 text-[10px]">
                                        {action.shortcut}
                                    </span>
                                )}
                            </div>

                            <Icon data-theme={theme} className={cn(
                                'w-5 h-5 transition-all duration-300',
                                'text-slate-300 group-hover:text-cyan-400',
                                // Light theme - DARK icons
                                'data-[theme=light]:text-slate-700 data-[theme=light]:group-hover:text-cyan-600',
                                // Luxury theme
                                'data-[theme=luxury]:text-amber-400/80 data-[theme=luxury]:group-hover:text-amber-400',
                            )} />

                            <span data-theme={theme} className={cn(
                                'text-xs font-semibold transition-colors',
                                'text-slate-400 group-hover:text-white',
                                // Light theme - DARK text
                                'data-[theme=light]:text-slate-700 data-[theme=light]:group-hover:text-cyan-700',
                                // Luxury theme
                                'data-[theme=luxury]:text-slate-400 data-[theme=luxury]:group-hover:text-amber-300',
                            )}>
                                {t(action.labelKey)}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Separator before theme */}
            <div data-theme={theme} className={cn(
                'w-px h-12 mx-4',
                'bg-slate-700',
                'data-[theme=light]:bg-slate-300',
                'data-[theme=luxury]:bg-amber-500/50',
            )} />

            {/* Theme Tri-Switch */}
            <div className="relative">
                <motion.button
                    onClick={() => setIsThemeOpen(!isThemeOpen)}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    data-theme={theme}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300',
                        // Dark theme
                        'bg-slate-800 border-slate-700 text-slate-300',
                        'hover:border-cyan-400/60 hover:text-white',
                        // Light theme
                        'data-[theme=light]:bg-slate-100 data-[theme=light]:border-slate-300',
                        'data-[theme=light]:text-slate-700 data-[theme=light]:hover:border-cyan-500',
                        // Luxury theme
                        'data-[theme=luxury]:bg-slate-900 data-[theme=luxury]:border-amber-500/30',
                        'data-[theme=luxury]:text-amber-400 data-[theme=luxury]:hover:border-amber-400',
                    )}
                >
                    <CurrentThemeIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">
                        {language === 'ar' ? currentTheme.labelAr : currentTheme.label}
                    </span>
                </motion.button>

                {/* Theme Dropdown */}
                <AnimatePresence>
                    {isThemeOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            data-theme={theme}
                            className={cn(
                                'absolute bottom-full mb-2 end-0 w-40 rounded-xl overflow-hidden',
                                'border shadow-xl z-50',
                                'bg-slate-900 border-slate-700',
                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                                'data-[theme=light]:shadow-slate-400/30',
                                'data-[theme=luxury]:bg-black data-[theme=luxury]:border-amber-500/40',
                            )}
                        >
                            {themeOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = theme === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            setTheme(option.id as 'dark' | 'light' | 'luxury');
                                            setIsThemeOpen(false);
                                        }}
                                        data-theme={theme}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                                            isSelected
                                                ? cn(
                                                    'bg-cyan-500/20 text-cyan-400',
                                                    'data-[theme=light]:bg-cyan-100 data-[theme=light]:text-cyan-700',
                                                    'data-[theme=luxury]:bg-amber-500/20 data-[theme=luxury]:text-amber-400',
                                                )
                                                : cn(
                                                    'text-slate-300 hover:bg-slate-800',
                                                    'data-[theme=light]:text-slate-700 data-[theme=light]:hover:bg-slate-100',
                                                    'data-[theme=luxury]:text-slate-400 data-[theme=luxury]:hover:bg-slate-900',
                                                ),
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">
                                            {language === 'ar' ? option.labelAr : option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
