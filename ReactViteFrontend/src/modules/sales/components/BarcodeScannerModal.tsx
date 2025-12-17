import { motion, AnimatePresence } from 'framer-motion';
import { X, Scan, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
}

export function BarcodeScannerModal({
    isOpen,
    onClose,
    onScan,
}: BarcodeScannerModalProps) {
    const [barcode, setBarcode] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setBarcode('');
            setIsScanning(false);
            return;
        }

        // Simulate barcode scanner keyboard input
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && barcode.trim()) {
                handleScan();
            } else if (e.key.length === 1) {
                setBarcode((prev) => prev + e.key);
            }
        };

        window.addEventListener('keypress', handleKeyPress);
        return () => window.removeEventListener('keypress', handleKeyPress);
    }, [isOpen, barcode]);

    if (!isOpen) return null;

    const handleScan = async () => {
        if (!barcode.trim()) return;

        setIsScanning(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        onScan(barcode.trim());
        setIsScanning(false);
        setBarcode('');
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" dir="rtl">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--outline-variant)]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[var(--surface-variant)] border-b border-[var(--outline-variant)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center">
                                <Scan className="w-5 h-5 text-[#00373a]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-['Almarai'] font-bold text-[var(--on-surface)]" dir="auto">
                                    مسح الباركود
                                </h2>
                                <p className="text-sm text-[var(--on-surface-variant)]">
                                    استخدم القارئ أو اكتب الرمز يدوياً
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isScanning}
                            className="w-10 h-10 rounded-xl hover:bg-[var(--surface)] transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-[var(--on-surface-variant)]" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Scanner Animation */}
                        <div className="relative bg-[var(--surface-variant)] rounded-2xl p-8 flex items-center justify-center h-48 overflow-hidden">
                            <motion.div
                                animate={{
                                    y: [0, 150, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'linear',
                                }}
                                className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                            />
                            <Scan className="w-20 h-20 text-cyan-400 opacity-30" />
                        </div>

                        {/* Barcode Input */}
                        <div>
                            <label className="block text-sm font-['Almarai'] font-bold text-[var(--on-surface)] mb-2" dir="auto">
                                رمز الباركود
                            </label>
                            <input
                                type="text"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                disabled={isScanning}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleScan();
                                    }
                                }}
                                placeholder="اكتب أو امسح الباركود..."
                                className="w-full px-4 py-4 bg-[var(--surface-variant)] border border-[var(--outline-variant)] rounded-xl text-xl text-center font-['Arial'] font-bold text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] placeholder:font-['Almarai'] placeholder:text-base focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
                                autoFocus
                                dir="ltr"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleScan}
                                disabled={!barcode.trim() || isScanning}
                                className="flex-1 h-14 rounded-xl bg-gradient-to-b from-cyan-400 to-blue-600 text-[#00373a] font-['Almarai'] font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isScanning ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <Scan className="w-5 h-5" />
                                        </motion.div>
                                        <span dir="auto">جاري البحث...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span dir="auto">بحث</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isScanning}
                                className="px-6 h-14 rounded-xl bg-[var(--surface-variant)] hover:bg-[var(--outline-variant)] text-[var(--on-surface)] font-['Almarai'] font-bold transition-colors disabled:opacity-50"
                            >
                                <span dir="auto">إلغاء</span>
                            </button>
                        </div>

                        {/* Tips */}
                        <div className="text-center">
                            <p className="text-xs text-[var(--on-surface-variant)] font-['Almarai']" dir="auto">
                                💡 استخدم قارئ الباركود أو اكتب الرمز يدوياً ثم اضغط Enter
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
