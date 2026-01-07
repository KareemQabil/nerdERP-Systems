/**
 * StockMovementModal Component
 *
 * Modal for creating manual stock movements (IN/OUT/ADJ).
 *
 * Features:
 * - Movement type selection (IN, OUT, ADJ)
 * - Product search with SKU/name
 * - Current stock display
 * - Decimal quantity input (0.001 precision)
 * - Cost per unit for IN movements
 * - Batch selection with FIFO order
 * - Reference type and number
 * - Reason notes (required for ADJ, OUT)
 * - Manager PIN for authorization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ArrowDown,
    ArrowUp,
    RefreshCw,
    Search,
    Package,
    AlertCircle,
    Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useInventoryStore } from '@/stores/inventory.store';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { PinInput, type PinInputRef } from '@/components/auth/PinInput';

export type StockMoveType = 'IN' | 'OUT' | 'ADJ';
export type StockReferenceType = 'PO' | 'MANUAL' | 'WASTE' | 'RECIPE' | 'VOID';

export interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    warehouseId: string;
    initialType?: StockMoveType;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    unit: string;
}

export interface Batch {
    id: string;
    batchNumber: string;
    quantity: number;
    expiryDate?: string;
    costPerUnit: number;
}

const MOVE_TYPES: { value: StockMoveType; labelEn: string; labelAr: string; icon: React.ElementType }[] = [
    { value: 'IN', labelEn: 'Stock In (Receipt)', labelAr: 'إدخال مخزون', icon: ArrowDown },
    { value: 'OUT', labelEn: 'Stock Out (Withdrawal)', labelAr: 'صرف مخزون', icon: ArrowUp },
    { value: 'ADJ', labelEn: 'Adjustment', labelAr: 'تسوية', icon: RefreshCw },
];

const REFERENCE_TYPES: { value: StockReferenceType; labelEn: string; labelAr: string }[] = [
    { value: 'PO', labelEn: 'Purchase Order', labelAr: 'أمر شراء' },
    { value: 'MANUAL', labelEn: 'Manual Entry', labelAr: 'إدخال يدوي' },
    { value: 'WASTE', labelEn: 'Waste/Damage', labelAr: 'هالك/تالف' },
    { value: 'RECIPE', labelEn: 'Recipe Usage', labelAr: 'استخدام وصفة' },
    { value: 'VOID', labelEn: 'Void Return', labelAr: 'إلغاء مرتجع' },
];

/**
 * Stock Movement Modal
 */
export function StockMovementModal({
    isOpen,
    onClose,
    onSuccess,
    warehouseId,
    initialType = 'IN',
}: StockMovementModalProps) {
    const { t } = useTranslation('inventory');
    const { language } = useSettingsStore();
    const { createStockMovement } = useInventoryStore();
    const { checkAutoLock, updateLastActivity } = useAuthStore();

    const [moveType, setMoveType] = useState<StockMoveType>(initialType);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState('');
    const [costPerUnit, setCostPerUnit] = useState('');
    const [referenceType, setReferenceType] = useState<StockReferenceType>('MANUAL');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPinAuth, setShowPinAuth] = useState(false);
    const [pinAttempts, setPinAttempts] = useState(0);

    const pinInputRef = useRef<PinInputRef>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMoveType(initialType);
            setSelectedProduct(null);
            setQuantity('');
            setCostPerUnit('');
            setReferenceType('MANUAL');
            setReferenceNumber('');
            setReason('');
            setNotes('');
            setSearchQuery('');
            setBatches([]);
            setSelectedBatch(null);
            setIsSubmitting(false);
            setError(null);
            setShowPinAuth(false);
            setPinAttempts(0);
            updateLastActivity();
        }
    }, [isOpen, initialType, updateLastActivity]);

    // Search products
    const handleSearchProducts = useCallback(async (query: string) => {
        if (!query.trim()) {
            setAvailableProducts([]);
            return;
        }

        try {
            // TODO: Implement product search API call
            // For now, using mock data
            const mockProducts: Product[] = [
                { id: '1', name: 'Chicken Breast', sku: 'CH-001', currentStock: 25.5, unit: 'kg' },
                { id: '2', name: 'Tomato', sku: 'VE-002', currentStock: 12.0, unit: 'kg' },
            ].filter((p) =>
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                p.sku.toLowerCase().includes(query.toLowerCase()),
            );

            setAvailableProducts(mockProducts);
        } catch (err) {
            setError(language === 'ar' ? 'فشل البحث عن المنتجات' : 'Failed to search products');
        }
    }, [language]);

    // Load batches for product
    const handleSelectProduct = useCallback(async (product: Product) => {
        setSelectedProduct(product);
        setShowProductSearch(false);
        setSearchQuery('');

        // Load available batches for OUT movements (FIFO)
        if (moveType === 'OUT') {
            try {
                // TODO: Implement batches API call
                // For now, using mock data
                const mockBatches: Batch[] = [
                    { id: 'b1', batchNumber: 'BATCH-001', quantity: 10, costPerUnit: 15.5 },
                    { id: 'b2', batchNumber: 'BATCH-002', quantity: 15.5, costPerUnit: 16.0 },
                ];
                setBatches(mockBatches);
            } catch (err) {
                setError(language === 'ar' ? 'فشل تحميل الأصناف' : 'Failed to load batches');
            }
        }
    }, [moveType, language]);

    // Validate and submit
    const handleSubmit = useCallback(async () => {
        // Validation
        if (!selectedProduct) {
            setError(language === 'ar' ? 'الرجاء اختيار منتج' : 'Please select a product');
            return;
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            setError(language === 'ar' ? 'الرجاء إدخال كمية صحيحة' : 'Please enter a valid quantity');
            return;
        }

        if (moveType === 'IN' && (!costPerUnit || parseFloat(costPerUnit) <= 0)) {
            setError(language === 'ar' ? 'الرجاء إدخال سعر التكلفة' : 'Please enter cost per unit');
            return;
        }

        if (moveType === 'OUT' && qty > selectedProduct.currentStock) {
            setError(language === 'ar' ? 'الكمية تتجاوز المخزون الحالي' : 'Quantity exceeds current stock');
            return;
        }

        if ((moveType === 'ADJ' || moveType === 'OUT') && !reason.trim()) {
            setError(language === 'ar' ? 'الرجاء إدخال السبب' : 'Please enter a reason');
            return;
        }

        // Require manager PIN for OUT and ADJ
        if (moveType === 'OUT' || moveType === 'ADJ') {
            setShowPinAuth(true);
            return;
        }

        // For IN movements, proceed directly
        await executeMovement();
    }, [
        selectedProduct,
        quantity,
        costPerUnit,
        moveType,
        language,
        reason,
    ]);

    // Execute movement after PIN auth
    const executeMovement = useCallback(async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            await createStockMovement({
                productId: selectedProduct!.id,
                warehouseId,
                moveType,
                quantity: parseFloat(quantity),
                referenceType,
                referenceNumber,
                costPerUnit: moveType === 'IN' ? parseFloat(costPerUnit) : undefined,
                batchId: selectedBatch?.id,
                metadata: {
                    reason,
                    notes,
                },
            });

            setShowPinAuth(false);
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.message || (language === 'ar' ? 'فشل تنفيذ الحركة' : 'Failed to execute movement'));
        } finally {
            setIsSubmitting(false);
        }
    }, [
        selectedProduct,
        warehouseId,
        moveType,
        quantity,
        costPerUnit,
        referenceType,
        referenceNumber,
        selectedBatch,
        reason,
        notes,
        createStockMovement,
        onSuccess,
        onClose,
        language,
    ]);

    // Handle PIN verification
    const handlePinVerify = useCallback(async (pin: string) => {
        try {
            // Verify PIN with auth store
            // TODO: Integrate with auth store's PIN verification
            setShowPinAuth(false);
            await executeMovement();
        } catch (err) {
            setPinAttempts((prev) => prev + 1);
            pinInputRef.current?.shake();
            setError(language === 'ar' ? 'رمز PIN غير صحيح' : 'Invalid PIN');
        }
    }, [executeMovement, language]);

    if (!isOpen) return null;

    const selectedMoveType = MOVE_TYPES.find((t) => t.value === moveType);
    const MoveTypeIcon = selectedMoveType?.icon || RefreshCw;

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
                    className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/20">
                                <MoveTypeIcon className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {language === 'ar' ? 'حركة مخزون' : 'Stock Movement'}
                                </h2>
                                <p className="text-sm text-slate-400">
                                    {selectedMoveType && (language === 'ar' ? selectedMoveType.labelAr : selectedMoveType.labelEn)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Movement Type Selection */}
                        <div className="grid grid-cols-3 gap-2">
                            {MOVE_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setMoveType(type.value as StockMoveType)}
                                    className={cn(
                                        'p-3 rounded-xl border transition-all',
                                        moveType === type.value
                                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700/50',
                                    )}
                                >
                                    <type.icon className="w-5 h-5 mx-auto mb-1" />
                                    <span className="text-xs">
                                        {language === 'ar' ? type.labelAr : type.labelEn}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Product Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                {language === 'ar' ? 'المنتج' : 'Product'} *
                            </label>
                            <button
                                onClick={() => setShowProductSearch(true)}
                                className={cn(
                                    'w-full p-3 rounded-xl border text-left transition-all',
                                    'bg-slate-800/50 border-slate-700/50 text-white',
                                    'hover:bg-slate-700/50 hover:border-slate-600',
                                    selectedProduct ? '' : 'text-slate-500',
                                )}
                            >
                                {selectedProduct ? (
                                    <div>
                                        <div className="font-medium">{selectedProduct.name}</div>
                                        <div className="text-xs text-slate-400">
                                            SKU: {selectedProduct.sku} • {language === 'ar' ? 'مخزون' : 'Stock'}: {selectedProduct.currentStock} {selectedProduct.unit}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Search className="w-4 h-4" />
                                        <span>{language === 'ar' ? 'البحث عن منتج...' : 'Search for a product...'}</span>
                                    </div>
                                )}
                            </button>
                        </div>

                        {/* Batch Selection (for OUT movements) */}
                        {moveType === 'OUT' && batches.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    {language === 'ar' ? 'الصنف (FIFO)' : 'Batch'} *
                                </label>
                                <div className="space-y-1">
                                    {batches.map((batch) => (
                                        <button
                                            key={batch.id}
                                            onClick={() => setSelectedBatch(batch)}
                                            className={cn(
                                                'w-full p-3 rounded-xl border text-left transition-all',
                                                selectedBatch?.id === batch.id
                                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400',
                                            )}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">{batch.batchNumber}</div>
                                                    <div className="text-xs opacity-70">
                                                        {language === 'ar' ? 'متاح' : 'Available'}: {batch.quantity} • {language === 'ar' ? 'سعر' : 'Cost'}: {batch.costPerUnit}
                                                    </div>
                                                </div>
                                                {selectedBatch?.id === batch.id && (
                                                    <Check className="w-4 h-4" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                {language === 'ar' ? 'الكمية' : 'Quantity'} *
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder={selectedProduct ? `0.001 - ${selectedProduct.currentStock}` : '0.001'}
                                className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-cyan-500 focus:outline-none"
                            />
                        </div>

                        {/* Cost Per Unit (for IN movements) */}
                        {moveType === 'IN' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    {language === 'ar' ? 'سعر التكلفة للوحدة' : 'Cost Per Unit'} *
                                </label>
                                <input
                                    type="number"
                                    step="0.001"
                                    value={costPerUnit}
                                    onChange={(e) => setCostPerUnit(e.target.value)}
                                    placeholder="0.000"
                                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                        )}

                        {/* Reference Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                {language === 'ar' ? 'نوع المرجع' : 'Reference Type'}
                            </label>
                            <select
                                value={referenceType}
                                onChange={(e) => setReferenceType(e.target.value as StockReferenceType)}
                                className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-cyan-500 focus:outline-none"
                            >
                                {REFERENCE_TYPES.map((ref) => (
                                    <option key={ref.value} value={ref.value}>
                                        {language === 'ar' ? ref.labelAr : ref.labelEn}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reference Number */}
                        {referenceType === 'PO' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    {language === 'ar' ? 'رقم المرجع' : 'Reference Number'}
                                </label>
                                <input
                                    type="text"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    placeholder={language === 'ar' ? 'PO-2024-001' : 'PO-2024-001'}
                                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                        )}

                        {/* Reason (required for ADJ and OUT) */}
                        {(moveType === 'ADJ' || moveType === 'OUT') && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">
                                    {language === 'ar' ? 'السبب' : 'Reason'} *
                                </label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={language === 'ar' ? 'سبب الحركة...' : 'Reason for movement...'}
                                    className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                {language === 'ar' ? 'ملاحظات' : 'Notes'}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder={language === 'ar' ? 'ملاحظات إضافية...' : 'Additional notes...'}
                                className="w-full p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:border-cyan-500 focus:outline-none resize-none"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-red-400 bg-red-500/20 p-3 rounded-xl"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-700/50 flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-semibold bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedProduct}
                            className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-400 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{language === 'ar' ? 'جاري التنفيذ...' : 'Processing...'}</span>
                                </div>
                            ) : (
                                <span>{language === 'ar' ? 'تنفيذ' : 'Execute'}</span>
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* PIN Authorization Modal */}
                <AnimatePresence>
                    {showPinAuth && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative w-full max-w-sm bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden p-6"
                            >
                                <h3 className="text-lg font-bold text-white mb-4 text-center">
                                    {language === 'ar' ? 'مصادقة المدير' : 'Manager Authorization'}
                                </h3>
                                <p className="text-sm text-slate-400 text-center mb-4">
                                    {language === 'ar'
                                        ? 'تتطلب هذه الحركة مصادقة المدير'
                                        : 'This movement requires manager authorization'}
                                </p>
                                <PinInput
                                    ref={pinInputRef}
                                    length={4}
                                    value=""
                                    onChange={() => {}}
                                    onSubmit={handlePinVerify}
                                    error={error}
                                    attempts={pinAttempts}
                                    maxAttempts={5}
                                    label={language === 'ar' ? 'أدخل رمز PIN' : 'Enter PIN'}
                                />
                                <button
                                    onClick={() => setShowPinAuth(false)}
                                    className="w-full mt-4 py-2 rounded-xl text-slate-400 hover:bg-slate-700/50 transition-colors"
                                >
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Product Search Dropdown */}
                <AnimatePresence>
                    {showProductSearch && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-20 left-4 right-4 z-10 bg-slate-800/95 border border-slate-700/50 rounded-xl shadow-xl max-h-60 overflow-hidden"
                        >
                            <div className="p-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        handleSearchProducts(e.target.value);
                                    }}
                                    placeholder={language === 'ar' ? 'البحث عن منتج...' : 'Search products...'}
                                    className="w-full p-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:border-cyan-500 focus:outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {availableProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleSelectProduct(product)}
                                        className="w-full p-3 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-0"
                                    >
                                        <div className="font-medium text-white text-sm">{product.name}</div>
                                        <div className="text-xs text-slate-400">
                                            SKU: {product.sku} • {product.currentStock} {product.unit}
                                        </div>
                                    </button>
                                ))}
                                {availableProducts.length === 0 && searchQuery && (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}

export default StockMovementModal;
