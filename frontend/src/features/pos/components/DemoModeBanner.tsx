/**
 * Demo Mode Banner
 * Shows when using mock data fallback instead of real API
 */
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Wifi } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { selectSettings } from '@/features/settings/slices/settingsSlice';

interface DemoModeBannerProps {
    /** Whether demo mode is active */
    isActive: boolean;
    /** Optional custom message */
    message?: string;
}

/**
 * A subtle banner that indicates the app is using demo/mock data
 * Can be dismissed by the user
 */
export function DemoModeBanner({ isActive, message }: DemoModeBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);
    const { theme, language } = useAppSelector(selectSettings);

    if (!isActive || isDismissed) return null;

    const defaultMessage = language === 'ar'
        ? 'وضع العرض التوضيحي - لا يوجد اتصال بالخادم'
        : 'Demo Mode - API Unavailable';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                data-theme={theme}
                className={cn(
                    'fixed top-0 left-0 right-20 z-50', // right-20 to account for nav
                    'flex items-center justify-center gap-3 px-4 py-2',
                    'text-sm font-medium',
                    // Dark theme - amber warning
                    'bg-amber-500/90 text-black',
                    // Light theme
                    'data-[theme=light]:bg-amber-400 data-[theme=light]:text-amber-950',
                    // Luxury theme
                    'data-[theme=luxury]:bg-amber-600/90 data-[theme=luxury]:text-white',
                )}
            >
                <Wifi className="w-4 h-4 animate-pulse" />
                <span>{message || defaultMessage}</span>
                <button
                    onClick={() => setIsDismissed(true)}
                    className={cn(
                        'p-1 rounded-full transition-colors',
                        'hover:bg-black/10',
                        'data-[theme=luxury]:hover:bg-white/10',
                    )}
                    data-theme={theme}
                >
                    <X className="w-4 h-4" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * Inline demo indicator - smaller, less intrusive
 * Shows in the header area
 */
export function DemoModeIndicator({ isActive }: { isActive: boolean }) {
    const { theme, language } = useAppSelector(selectSettings);

    if (!isActive) return null;

    return (
        <div
            data-theme={theme}
            className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                'bg-amber-500/20 text-amber-500 border border-amber-500/30',
                'data-[theme=light]:bg-amber-100 data-[theme=light]:text-amber-700 data-[theme=light]:border-amber-300',
            )}
        >
            <AlertTriangle className="w-3 h-3" />
            <span>{language === 'ar' ? 'عرض توضيحي' : 'Demo'}</span>
        </div>
    );
}
