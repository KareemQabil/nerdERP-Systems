import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

interface EnhancedLoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export function EnhancedLoading({ message, fullScreen = true }: EnhancedLoadingProps) {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const LoadingContent = () => (
        <div className="flex flex-col items-center justify-center gap-6">
            {/* Animated Logo */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
            >
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                    style={{
                        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.05) 100%)',
                        border: '1px solid rgba(34, 211, 238, 0.3)'
                    }}
                >
                    <ShoppingCart className="w-10 h-10" style={{ color: '#22d3ee' }} />

                    {/* Pulse effect */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                            background: 'radial-gradient(circle at center, rgba(34, 211, 238, 0.3) 0%, transparent 70%)'
                        }}
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
            </motion.div>

            {/* Spinner */}
            <div className="relative">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 rounded-full"
                    style={{
                        border: '3px solid rgba(34, 211, 238, 0.1)',
                        borderTopColor: '#22d3ee'
                    }}
                />

                {/* Center dot */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                    style={{ background: '#22d3ee' }}
                />
            </div>

            {/* Loading Text */}
            <div className="text-center">
                <p
                    className="font-['Almarai'] mb-2"
                    style={{
                        fontSize: '16px',
                        lineHeight: '24px',
                        color: '#e2e2e6',
                        fontWeight: 'bold'
                    }}
                    dir="auto"
                >
                    {message || (isRTL ? 'جاري التحميل...' : 'Loading...')}
                </p>

                <div className="flex items-center justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ background: '#22d3ee' }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #023047 0%, #001219 100%)' }}
            >
                <LoadingContent />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-12">
            <LoadingContent />
        </div>
    );
}
