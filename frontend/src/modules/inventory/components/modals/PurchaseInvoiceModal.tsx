/**
 * Purchase Invoice Modal
 * Modal for receiving stock with supplier interface and weighted average costing
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Search,
    Trash2,
    Plus,
    FileDown,
    Calculator,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useSettingsStore } from '@/stores/settings.store';
import { useInventoryStore } from '@/stores/inventory.store';
import { formatCurrency } from '@/lib/decimal';
import Decimal from 'decimal.js';

// =============================================================================
// Types
// =============================================================================

interface PurchaseLineItem {
    id: string;
    productId: string;
    productName: string;
    quantity: string;
    costPrice: string;
    expiryDate?: string;
    lineTotal: string;
}

interface PurchaseInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function PurchaseInvoiceModal({ isOpen, onClose }: PurchaseInvoiceModalProps) {
    const { t } = useTranslation('inventory');
    const { theme, language } = useSettingsStore();
    const { warehouses, selectedWarehouseId, createPurchaseInvoice, isSubmitting } = useInventoryStore();
    const isRTL = language === 'ar';

    // Form state
    const [supplierId, setSupplierId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [warehouseId, setWarehouseId] = useState(selectedWarehouseId || '');
    const [lines, setLines] = useState<PurchaseLineItem[]>([]);
    const [notes, setNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setInvoiceNumber(`INV-${Date.now().toString().slice(-8)}`);
            setInvoiceDate(new Date().toISOString().split('T')[0]);
            setWarehouseId(selectedWarehouseId || '');
            setLines([]);
            setNotes('');
            setSearchQuery('');
        }
    }, [isOpen, selectedWarehouseId]);

    // Add line item
    const addLine = () => {
        const newLine: PurchaseLineItem = {
            id: `line-${Date.now()}`,
            productId: '',
            productName: '',
            quantity: '1',
            costPrice: '0',
            lineTotal: '0',
        };
        setLines([...lines, newLine]);
    };

    // Update line item
    const updateLine = (id: string, field: keyof PurchaseLineItem, value: string) => {
        setLines(lines.map(line => {
            if (line.id === id) {
                const updated = { ...line, [field]: value };
                // Recalculate line total
                const qty = new Decimal(updated.quantity || 0);
                const cost = new Decimal(updated.costPrice || 0);
                updated.lineTotal = qty.times(cost).toFixed(3);
                return updated;
            }
            return line;
        }));
    };

    // Remove line item
    const removeLine = (id: string) => {
        setLines(lines.filter(line => line.id !== id));
    };

    // Calculate totals
    const subtotal = lines.reduce((sum, line) => sum.plus(line.lineTotal || 0), new Decimal(0));
    const vatRate = new Decimal(0.15); // 15% VAT
    const vatAmount = subtotal.times(vatRate);
    const total = subtotal.plus(vatAmount);

    // Handle submit
    const handleSubmit = async () => {
        if (lines.length === 0) return;

        try {
            await createPurchaseInvoice({
                supplierId: supplierId || undefined,
                invoiceNumber,
                invoiceDate,
                warehouseId,
                lines: lines.map(line => ({
                    productId: line.productId,
                    quantity: parseFloat(line.quantity),
                    costPrice: parseFloat(line.costPrice),
                    expiryDate: line.expiryDate,
                })),
                notes: notes || undefined,
            });
            onClose();
        } catch (error) {
            console.error('Failed to create purchase invoice:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    data-theme={theme}
                    className={cn(
                        'w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl',
                        'data-[theme=dark]:bg-[#1a1f25] data-[theme=dark]:border data-[theme=dark]:border-white/10',
                        'data-[theme=light]:bg-white',
                    )}
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    {/* Header */}
                    <div className={cn(
                        'flex items-center justify-between px-6 py-4 border-b',
                        'data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200'
                    )} data-theme={theme}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <FileDown className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className={cn(
                                    'text-lg font-bold',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-800'
                                )} data-theme={theme}>
                                    {t('purchase.title', 'Receive Stock - Purchase Invoice')}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
                        {/* Invoice Details */}
                        <div className="mb-6">
                            <h3 className={cn(
                                'text-sm font-semibold mb-4',
                                'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                            )} data-theme={theme}>
                                {t('purchase.invoiceDetails', 'Invoice Details')}
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                        {t('purchase.supplier', 'Supplier')}
                                    </label>
                                    <select
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        data-theme={theme}
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-lg border transition-colors',
                                            'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        )}
                                    >
                                        <option value="">{t('purchase.selectSupplier', 'Select Supplier')}</option>
                                        {/* Suppliers will be loaded from API */}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                        {t('purchase.invoiceNumber', 'Invoice #')}
                                    </label>
                                    <input
                                        type="text"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        data-theme={theme}
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-lg border transition-colors',
                                            'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        )}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                        {t('purchase.invoiceDate', 'Invoice Date')}
                                    </label>
                                    <input
                                        type="date"
                                        value={invoiceDate}
                                        onChange={(e) => setInvoiceDate(e.target.value)}
                                        data-theme={theme}
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-lg border transition-colors',
                                            'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        )}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                        {t('purchase.warehouse', 'Warehouse')}
                                    </label>
                                    <select
                                        value={warehouseId}
                                        onChange={(e) => setWarehouseId(e.target.value)}
                                        data-theme={theme}
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-lg border transition-colors',
                                            'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                            'focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        )}
                                    >
                                        {warehouses.map(wh => (
                                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={cn(
                                    'text-sm font-semibold',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                )} data-theme={theme}>
                                    {t('purchase.items', 'Items')}
                                </h3>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={t('purchase.searchProduct', 'Search product...')}
                                            data-theme={theme}
                                            className={cn(
                                                'pl-10 pr-4 py-2 rounded-lg border text-sm',
                                                'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                'focus:outline-none focus:ring-2 focus:ring-blue-500'
                                            )}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={addLine}
                                        className="gap-2 text-blue-400"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {t('purchase.addItem', 'Add Item')}
                                    </Button>
                                </div>
                            </div>

                            {/* Lines Table */}
                            <div
                                data-theme={theme}
                                className={cn(
                                    'rounded-lg border overflow-hidden',
                                    'data-[theme=dark]:border-white/10',
                                    'data-[theme=light]:border-slate-200'
                                )}
                            >
                                <table className="w-full">
                                    <thead>
                                        <tr data-theme={theme} className="data-[theme=dark]:bg-white/5 data-[theme=light]:bg-slate-50">
                                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-400 uppercase">
                                                {t('table.product', 'Product')}
                                            </th>
                                            <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase w-24">
                                                {t('table.quantity', 'Qty')}
                                            </th>
                                            <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase w-32">
                                                {t('purchase.costPrice', 'Cost')}
                                            </th>
                                            <th className="px-4 py-3 text-end text-xs font-medium text-gray-400 uppercase w-32">
                                                {t('purchase.total', 'Total')}
                                            </th>
                                            <th className="px-4 py-3 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                                    {t('purchase.noItems', 'No items added yet')}
                                                </td>
                                            </tr>
                                        ) : (
                                            lines.map((line) => (
                                                <tr
                                                    key={line.id}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'border-t',
                                                        'data-[theme=dark]:border-white/5',
                                                        'data-[theme=light]:border-slate-100'
                                                    )}
                                                >
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="text"
                                                            value={line.productName}
                                                            onChange={(e) => updateLine(line.id, 'productName', e.target.value)}
                                                            placeholder={t('purchase.productName', 'Product name')}
                                                            data-theme={theme}
                                                            className={cn(
                                                                'w-full px-3 py-1.5 rounded border text-sm',
                                                                'data-[theme=dark]:bg-transparent data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                                'focus:outline-none focus:ring-2 focus:ring-blue-500'
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            value={line.quantity}
                                                            onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                                                            data-theme={theme}
                                                            className={cn(
                                                                'w-full px-3 py-1.5 rounded border text-sm text-end',
                                                                'data-[theme=dark]:bg-transparent data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                                'focus:outline-none focus:ring-2 focus:ring-blue-500'
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={line.costPrice}
                                                            onChange={(e) => updateLine(line.id, 'costPrice', e.target.value)}
                                                            data-theme={theme}
                                                            className={cn(
                                                                'w-full px-3 py-1.5 rounded border text-sm text-end',
                                                                'data-[theme=dark]:bg-transparent data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                                'focus:outline-none focus:ring-2 focus:ring-blue-500'
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-end font-mono text-sm">
                                                        <span className={cn(
                                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                                        )} data-theme={theme}>
                                                            {formatCurrency(parseFloat(line.lineTotal), 'SAR', isRTL ? 'ar-SA' : 'en-SA')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <button
                                                            onClick={() => removeLine(line.id)}
                                                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Invoice Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Costing Preview */}
                            <div className={cn(
                                'p-4 rounded-xl border',
                                'data-[theme=dark]:border-white/10 data-[theme=dark]:bg-white/5',
                                'data-[theme=light]:border-slate-200 data-[theme=light]:bg-slate-50'
                            )} data-theme={theme}>
                                <h4 className={cn(
                                    'text-sm font-semibold mb-3 flex items-center gap-2',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                )} data-theme={theme}>
                                    <Calculator className="w-4 h-4 text-blue-400" />
                                    {t('purchase.costingPreview', 'Costing Preview')}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {t('purchase.costingInfo', 'Weighted average costs will be recalculated upon posting.')}
                                </p>
                            </div>

                            {/* Totals */}
                            <div className={cn(
                                'p-4 rounded-xl border',
                                'data-[theme=dark]:border-white/10 data-[theme=dark]:bg-white/5',
                                'data-[theme=light]:border-slate-200 data-[theme=light]:bg-slate-50'
                            )} data-theme={theme}>
                                <h4 className={cn(
                                    'text-sm font-semibold mb-3',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                )} data-theme={theme}>
                                    {t('purchase.invoiceSummary', 'Invoice Summary')}
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('purchase.subtotal', 'Subtotal')}</span>
                                        <span className={cn(
                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                        )} data-theme={theme}>
                                            {formatCurrency(subtotal.toNumber(), 'SAR', isRTL ? 'ar-SA' : 'en-SA')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('purchase.vat', 'VAT (15%)')}</span>
                                        <span className={cn(
                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                        )} data-theme={theme}>
                                            {formatCurrency(vatAmount.toNumber(), 'SAR', isRTL ? 'ar-SA' : 'en-SA')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200" data-theme={theme}>
                                        <span className="font-bold data-[theme=dark]:text-white data-[theme=light]:text-slate-800" data-theme={theme}>
                                            {t('purchase.total', 'Total')}
                                        </span>
                                        <span className="font-bold text-blue-400">
                                            {formatCurrency(total.toNumber(), 'SAR', isRTL ? 'ar-SA' : 'en-SA')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* What happens on posting */}
                        <div className={cn(
                            'mt-6 p-4 rounded-xl border-l-4 border-blue-500',
                            'data-[theme=dark]:bg-blue-500/10 data-[theme=light]:bg-blue-50'
                        )} data-theme={theme}>
                            <p className="text-sm font-medium text-blue-400 mb-2">
                                ⚡ {t('purchase.uponPosting', 'Upon posting this invoice:')}
                            </p>
                            <ul className="text-xs text-gray-400 space-y-1">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    {t('purchase.batchesCreated', 'Inventory batches created with new costs')}
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    {t('purchase.costsRecalculated', 'Weighted average costs recalculated')}
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    {t('purchase.posNotified', 'All POS terminals notified')}
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    {t('purchase.stockAvailable', 'Out-of-stock items become available instantly')}
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={cn(
                        'flex items-center justify-between px-6 py-4 border-t',
                        'data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200'
                    )} data-theme={theme}>
                        <Button variant="ghost" onClick={onClose}>
                            {t('common.cancel', 'Cancel')}
                        </Button>

                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting || lines.length === 0}
                            className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('common.processing', 'Processing...')}
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    {t('purchase.confirm', 'Confirm & Receive')}
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default PurchaseInvoiceModal;
