import { useState } from 'react';
import { Lock, Unlock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreenLockStore } from '../store/screenLockStore';

/**
 * ScreenLockModal - PIN-based screen lock
 * 
 * Features:
 * - Full-screen overlay (z-index 9999)
 * - Heavy blur background
 * - Numeric keypad (0-9)
 * - 4-digit PIN display (****) 
 * - Emergency manager unlock
 * - Non-dismissible
 * - Persists across page refresh
 */
export function ScreenLockModal() {
    const { isLocked, unlock, forceUnlock, lockedAt, lockedBy } = useScreenLockStore();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    if (!isLocked) return null;

    const handleNumberClick = (num: number) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            setError('');

            // Auto-submit when 4 digits entered
            if (newPin.length === 4) {
                setTimeout(() => handleSubmit(newPin), 300);
            }
        }
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const handleSubmit = (pinToCheck: string = pin) => {
        const success = unlock(pinToCheck);

        if (!success) {
            setError('رمز PIN غير صحيح');
            setShake(true);
            setPin('');
            setTimeout(() => setShake(false), 500);
        }
    };

    const handleEmergencyUnlock = () => {
        const confirmed = window.confirm(
            'إلغاء القفل الطارئ (Manager Override)\n\nهل أنت متأكد؟'
        );

        if (confirmed) {
            forceUnlock();
        }
    };

    const lockedDuration = lockedAt
        ? Math.floor((Date.now() - new Date(lockedAt).getTime()) / 60000)
        : 0;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
                {/* Heavy Blur Background */}
                <div className="absolute inset-0 backdrop-blur-xl bg-slate-900/95" />

                {/* Lock Icon - Floating Top */}
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute top-8 left-1/2 -translate-x-1/2"
                >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-400/30 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-red-400" />
                    </div>
                </motion.div>

                {/* Lock Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: shake ? [1, 1.05, 0.95, 1.05, 1] : 1, opacity: 1 }}
                    transition={{ duration: shake ? 0.5 : 0.3 }}
                    className="relative w-full max-w-md bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-8 space-y-6"
                >
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold text-white font-['Almarai']">
                            الشاشة مقفلة
                        </h2>
                        <p className="text-gray-400">Screen Locked</p>
                        {lockedBy && (
                            <p className="text-sm text-gray-500">
                                Locked by: <span className="text-cyan-400">{lockedBy}</span>
                            </p>
                        )}
                        {lockedDuration > 0 && (
                            <p className="text-xs text-gray-500">
                                {lockedDuration} دقيقة منذ القفل
                            </p>
                        )}
                    </div>

                    {/* PIN Display */}
                    <div className="flex justify-center gap-3">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${pin.length > i
                                        ? 'bg-cyan-500/20 border-cyan-400/50'
                                        : 'bg-white/5 border-white/10'
                                    }`}
                            >
                                {pin.length > i && (
                                    <div className="w-3 h-3 rounded-full bg-cyan-400" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center text-red-400 text-sm font-['Almarai']"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num)}
                                className="h-16 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/30 text-white text-2xl font-bold transition-all active:scale-95"
                            >
                                {num}
                            </button>
                        ))}

                        {/* Bottom Row */}
                        <button
                            onClick={handleBackspace}
                            className="h-16 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/30 text-red-400 text-sm font-bold font-['Almarai'] transition-all active:scale-95"
                        >
                            مسح
                        </button>
                        <button
                            onClick={() => handleNumberClick(0)}
                            className="h-16 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/30 text-white text-2xl font-bold transition-all active:scale-95"
                        >
                            0
                        </button>
                        <button
                            onClick={() => handleSubmit()}
                            disabled={pin.length !== 4}
                            className="h-16 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center"
                        >
                            <Unlock className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Emergency Unlock */}
                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={handleEmergencyUnlock}
                            className="w-full h-12 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-amber-400 font-bold font-['Almarai'] transition-all flex items-center justify-center gap-2"
                        >
                            <Shield className="w-5 h-5" />
                            <span>إلغاء القفل الطارئ (Manager)</span>
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                            Emergency unlock - requires manager authorization
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
