import { type ReactNode, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when modal should close */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Modal description */
    description?: string;
    /** Modal content */
    children: ReactNode;
    /** Footer content (typically buttons) */
    footer?: ReactNode;
    /** Size of the modal */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Whether to show the close button */
    showCloseButton?: boolean;
    /** Whether clicking backdrop closes the modal */
    closeOnBackdrop?: boolean;
    /** Whether pressing Escape closes the modal */
    closeOnEscape?: boolean;
}

/**
 * Modal dialog component with Framer Motion animations
 * Supports multiple sizes and accessibility features
 */
export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
}: ModalProps) {
    // Handle escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape) {
                onClose();
            }
        },
        [onClose, closeOnEscape]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEscape]);

    // Size styles
    const sizeStyles = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeOnBackdrop ? onClose : undefined}
                    />

                    {/* Modal */}
                    <motion.div
                        className={cn(
                            'relative z-10 w-full mx-4 rounded-2xl overflow-hidden shadow-2xl',
                            sizeStyles[size],
                            // Dark theme
                            'bg-slate-900 border border-slate-700',
                            // Light theme - white bg with subtle shadow
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:shadow-xl',
                            // Luxury theme
                            'data-[theme=luxury]:bg-black data-[theme=luxury]:border-amber-600/30',
                        )}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className={cn(
                                'flex items-center justify-between p-4 border-b',
                                'border-slate-700',
                                'data-[theme=light]:border-slate-200',
                                'data-[theme=luxury]:border-amber-600/30',
                            )}>
                                <div>
                                    {title && (
                                        <h2 className={cn(
                                            'text-lg font-bold',
                                            'text-white',
                                            'data-[theme=light]:text-slate-900',
                                            'data-[theme=luxury]:text-amber-400',
                                        )}>
                                            {title}
                                        </h2>
                                    )}
                                    {description && (
                                        <p className={cn(
                                            'text-sm mt-1',
                                            'text-slate-400',
                                            'data-[theme=light]:text-slate-600',
                                        )}>
                                            {description}
                                        </p>
                                    )}
                                </div>
                                {showCloseButton && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClose}
                                        className="shrink-0"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        <div className={cn(
                            'p-4 overflow-y-auto',
                            size === 'full' && 'max-h-[calc(100vh-12rem)]'
                        )}>
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className={cn(
                                'flex items-center justify-end gap-3 p-4 border-t',
                                'border-slate-700',
                                'data-[theme=light]:border-slate-200',
                                'data-[theme=luxury]:border-amber-600/30',
                            )}>
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
