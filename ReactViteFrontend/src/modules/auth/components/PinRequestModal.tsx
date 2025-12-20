import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Lock } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { Permission, getPermissionDisplayName } from '../types/auth.types';
import type { User } from '../types/auth.types';

/**
 * ============================================
 * PIN REQUEST MODAL - SECURITY INTERFACE
 * ============================================
 * SOP Compliance: Manager PIN Authentication
 * 
 * Features:
 * - Numeric keypad (touch-friendly)
 * - Masked input (****)
 * - Shake animation on error
 * - Success/error states
 */

interface PinRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (authorizer: User) => void;
    requiredPermission: Permission;
    reason: string; // e.g., "Void Sent Item"
    context?: {
        itemName?: string;
        amount?: string;
        orderId?: string;
    };
}

export function PinRequestModal({
    isOpen,
    onClose,
    onSuccess,
    requiredPermission,
    reason,
    context,
}: PinRequestModalProps) {
    const [pin, setPin] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    const { validatePin } = useAuthStore();

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError('');
            setShake(false);
        }
    }, [isOpen]);

    // Handle number press
    const handleNumberPress = (num: string) => {
        if (pin.length < 4) {
            setPin(pin + num);
            setError(''); // Clear error on new input
        }
    };

    // Handle clear
    const handleClear = () => {
        setPin('');
        setError('');
    };

    // Handle enter (validate)
    const handleEnter = async () => {
        if (pin.length !== 4) {
            setError('Please enter 4-digit PIN');
            return;
        }

        setIsValidating(true);
        setError('');

        try {
            const result = await validatePin(pin, requiredPermission);

            if (result.success && result.authorizer) {
                // Success! Call onSuccess and close modal
                onSuccess(result.authorizer);
                onClose();
            } else {
                // Failed - show error with shake animation
                setError(result.error || 'Access Denied');
                setShake(true);
                setPin(''); // Clear PIN

                // Remove shake animation after it completes
                setTimeout(() => setShake(false), 650);
            }
        } catch (err) {
            setError('Validation failed. Please try again.');
            setShake(true);
            setPin('');
            setTimeout(() => setShake(false), 650);
        } finally {
            setIsValidating(false);
        }
    };

    // Keyboard support
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') {
                handleNumberPress(e.key);
            } else if (e.key === 'Enter') {
                handleEnter();
            } else if (e.key === 'Backspace') {
                setPin(pin.slice(0, -1));
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, pin]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                x: shake ? [-10, 10, -10, 10, -5, 5, 0] : 0, // Shake animation
                            }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-md bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6">
                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>

                                {/* Icon */}
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30 flex items-center justify-center">
                                        <Lock className="w-8 h-8 text-orange-400" />
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-center text-white font-['Almarai']">
                                    تفويض المدير
                                </h2>
                                <p className="text-sm text-gray-400 text-center mt-1">
                                    Manager Authorization Required
                                </p>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                {/* Reason Display */}
                                <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Action</p>
                                    <p className="text-white font-bold font-['Almarai']">{reason}</p>

                                    {/* Context (optional) */}
                                    {context && (
                                        <div className="mt-2 text-sm text-gray-300">
                                            {context.itemName && <p>Item: {context.itemName}</p>}
                                            {context.amount && <p>Amount: {context.amount} SAR</p>}
                                            {context.orderId && <p className="text-xs text-gray-500">Order: {context.orderId}</p>}
                                        </div>
                                    )}
                                </div>

                                {/* Permission Display */}
                                <div className="mb-4 text-center">
                                    <p className="text-xs text-gray-400">Required Permission</p>
                                    <p className="text-sm text-orange-400 font-semibold">
                                        {getPermissionDisplayName(requiredPermission)}
                                    </p>
                                </div>

                                {/* PIN Input Display (Masked) */}
                                <div className="mb-6 flex justify-center gap-3">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${pin.length > i
                                                ? 'bg-orange-500/20 border-orange-400 shadow-lg shadow-orange-500/20'
                                                : 'bg-white/5 border-white/10'
                                                }`}
                                        >
                                            {pin.length > i && (
                                                <div className="w-3 h-3 rounded-full bg-orange-400" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Error Message */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-400/30 flex items-center gap-2"
                                        >
                                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                            <p className="text-sm text-red-300">{error}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Numeric Keypad */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => handleNumberPress(num.toString())}
                                            disabled={isValidating}
                                            className="h-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xl transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>

                                {/* Bottom Row */}
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Clear */}
                                    <button
                                        onClick={handleClear}
                                        disabled={isValidating}
                                        className="h-14 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 text-red-400 font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Clear
                                    </button>

                                    {/* 0 */}
                                    <button
                                        onClick={() => handleNumberPress('0')}
                                        disabled={isValidating}
                                        className="h-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xl transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        0
                                    </button>

                                    {/* Enter */}
                                    <button
                                        onClick={handleEnter}
                                        disabled={isValidating || pin.length !== 4}
                                        className={`h-14 rounded-xl font-bold text-sm transition-all active:scale-95 ${pin.length === 4 && !isValidating
                                            ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                                            : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {isValidating ? (
                                            <span className="inline-block animate-spin">⏳</span>
                                        ) : (
                                            'Enter'
                                        )}
                                    </button>
                                </div>

                                {/* Helper Text */}
                                <p className="text-xs text-gray-500 text-center mt-4">
                                    Enter manager PIN to authorize this action
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
