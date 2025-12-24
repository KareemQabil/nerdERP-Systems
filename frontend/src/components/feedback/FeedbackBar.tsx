import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeedbackType = 'success' | 'error' | 'info';

export interface FeedbackMessage {
    id: string;
    type: FeedbackType;
    message: string;
    duration?: number;
}

interface FeedbackBarProps {
    messages: FeedbackMessage[];
    onDismiss: (id: string) => void;
}

/**
 * Feedback bar for showing toast-like notifications
 * Positioned at top center of the screen
 */
export function FeedbackBar({ messages, onDismiss }: FeedbackBarProps) {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4">
            <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                    <FeedbackItem key={msg.id} message={msg} onDismiss={onDismiss} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function FeedbackItem({
    message,
    onDismiss,
}: {
    message: FeedbackMessage;
    onDismiss: (id: string) => void;
}) {
    const { id, type, message: text, duration = 4000 } = message;

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => onDismiss(id), duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onDismiss]);

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
    };

    const Icon = icons[type];

    const colorStyles = {
        success: cn(
            // Dark theme
            'bg-emerald-400/10 border-emerald-400/30 text-emerald-400',
            // Light theme
            'data-[theme=light]:bg-emerald-50 data-[theme=light]:border-emerald-200 data-[theme=light]:text-emerald-700',
        ),
        error: cn(
            // Dark theme
            'bg-red-400/10 border-red-400/30 text-red-400',
            // Light theme
            'data-[theme=light]:bg-red-50 data-[theme=light]:border-red-200 data-[theme=light]:text-red-700',
        ),
        info: cn(
            // Dark theme
            'bg-cyan-400/10 border-cyan-400/30 text-cyan-400',
            // Light theme
            'data-[theme=light]:bg-cyan-50 data-[theme=light]:border-cyan-200 data-[theme=light]:text-cyan-700',
        ),
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl',
                colorStyles[type]
            )}
        >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-sm font-medium">{text}</span>
            <button
                onClick={() => onDismiss(id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

// Hook for managing feedback messages
export function useFeedback() {
    const [messages, setMessages] = useState<FeedbackMessage[]>([]);

    const showFeedback = useCallback(
        (type: FeedbackType, message: string, duration?: number) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            setMessages((prev) => [...prev, { id, type, message, duration }]);
            return id;
        },
        []
    );

    const dismissFeedback = useCallback((id: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
    }, []);

    const success = useCallback(
        (message: string, duration?: number) => showFeedback('success', message, duration),
        [showFeedback]
    );

    const error = useCallback(
        (message: string, duration?: number) => showFeedback('error', message, duration),
        [showFeedback]
    );

    const info = useCallback(
        (message: string, duration?: number) => showFeedback('info', message, duration),
        [showFeedback]
    );

    return {
        messages,
        showFeedback,
        dismissFeedback,
        success,
        error,
        info,
    };
}
