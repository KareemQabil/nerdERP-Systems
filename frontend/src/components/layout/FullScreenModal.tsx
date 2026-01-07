/**
 * FullScreenModal Component
 *
 * A full-screen modal component with backdrop for displaying complex content
 * like floor plans, kitchen display, or delivery dashboards.
 */
import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface FullScreenModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Modal content */
    children: ReactNode;
    /** Modal title */
    title?: string;
    /** Custom header content (overrides title) */
    header?: ReactNode;
    /** Show backdrop overlay */
    showBackdrop?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * FullScreenModal
 *
 * A full-screen modal with backdrop, close button, and scrollable content area.
 * Used for displaying complex interfaces like floor plans, KDS, or dashboards.
 */
export function FullScreenModal({
    isOpen,
    onClose,
    children,
    title,
    header,
    showBackdrop = true,
}: FullScreenModalProps) {
    const { theme } = useSettingsStore();

    // Handle ESC key to close
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape' && isOpen) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    {showBackdrop && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                            onClick={onClose}
                        />
                    )}

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex"
                        onKeyDown={handleKeyDown}
                    >
                        <div
                            data-theme={theme}
                            className={cn(
                                'w-full h-full flex flex-col overflow-hidden',
                                'bg-slate-900',
                                'data-[theme=light]:bg-white',
                            )}
                        >
                            {/* Header */}
                            {(title || header) && (
                                <div
                                    data-theme={theme}
                                    className={cn(
                                        'flex items-center justify-between px-4 py-3 border-b shrink-0',
                                        'border-slate-700/50',
                                        'data-[theme=light]:border-slate-200',
                                    )}
                                >
                                    {header ? (
                                        header
                                    ) : title ? (
                                        <h2
                                            data-theme={theme}
                                            className={cn(
                                                'text-lg font-bold',
                                                'text-white',
                                                'data-[theme=light]:text-slate-900',
                                            )}
                                        >
                                            {title}
                                        </h2>
                                    ) : null}

                                    <button
                                        onClick={onClose}
                                        data-theme={theme}
                                        className={cn(
                                            'p-2 rounded-lg transition-colors',
                                            'hover:bg-slate-700/50 text-slate-400 hover:text-white',
                                            'data-[theme=light]:hover:bg-slate-100 data-[theme=light]:text-slate-500 data-[theme=light]:hover:text-slate-900',
                                        )}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 overflow-auto">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default FullScreenModal;
