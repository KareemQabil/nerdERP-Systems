/**
 * Item Master Modal
 * Modal for creating/editing products with type selection, pricing, kitchen routing, and modifiers
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Package,
    ChefHat,
    Wheat,
    Truck,
    Tag,
    Printer,
    Clock,
    Save,
    RefreshCw,
    AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useSettingsStore } from '@/stores/settings.store';
import { categoryService, productService, type Category } from '@/services/product.service';

// =============================================================================
// Types
// =============================================================================

export type ProductType = 'STANDARD' | 'MANUFACTURED' | 'RAW_MATERIAL' | 'SERVICE';

export interface ItemMasterFormData {
    type: ProductType;
    name: string;
    sku: string;
    categoryId: string;
    unitId: string;
    description: string;
    salePrice: string;
    costPrice: string;
    taxGroupId: string;
    barcode: string;
    printerGroupId: string;
    prepTime: number;
    modifierGroupIds: string[];
    imageUrl?: string;
    trackInventory: boolean;
    isPrepared: boolean;
    isActive: boolean;
}

interface ItemMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (data: ItemMasterFormData) => Promise<void>;
    editItem?: Partial<ItemMasterFormData>;
}

// =============================================================================
// Constants
// =============================================================================

const productTypes: { type: ProductType; icon: React.ElementType; labelKey: string; descKey: string }[] = [
    { type: 'STANDARD', icon: Package, labelKey: 'itemMaster.types.standard', descKey: 'itemMaster.types.standardDesc' },
    { type: 'MANUFACTURED', icon: ChefHat, labelKey: 'itemMaster.types.manufactured', descKey: 'itemMaster.types.manufacturedDesc' },
    { type: 'RAW_MATERIAL', icon: Wheat, labelKey: 'itemMaster.types.rawMaterial', descKey: 'itemMaster.types.rawMaterialDesc' },
    { type: 'SERVICE', icon: Truck, labelKey: 'itemMaster.types.service', descKey: 'itemMaster.types.serviceDesc' },
];

const initialFormData: ItemMasterFormData = {
    type: 'STANDARD',
    name: '',
    sku: '',
    categoryId: '',
    unitId: '',
    description: '',
    salePrice: '',
    costPrice: '',
    taxGroupId: '',
    barcode: '',
    printerGroupId: '',
    prepTime: 0,
    modifierGroupIds: [],
    trackInventory: true,
    isPrepared: false,
    isActive: true,
};

// =============================================================================
// Component
// =============================================================================

export function ItemMasterModal({ isOpen, onClose, onSave, editItem }: ItemMasterModalProps) {
    const { t } = useTranslation('inventory');
    const { theme, language } = useSettingsStore();
    const isRTL = language === 'ar';

    const [formData, setFormData] = useState<ItemMasterFormData>(initialFormData);
    const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof ItemMasterFormData, string>>>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    // Fetch categories from API on mount
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const data = await categoryService.getActive();
                setCategories(data);
            } catch (error) {
                console.error('Failed to load categories:', error);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setFormData(editItem ? { ...initialFormData, ...editItem } : initialFormData);
            setCurrentPhase(1);
            setErrors({});
        }
    }, [isOpen, editItem]);

    // Update type-specific fields
    useEffect(() => {
        if (formData.type === 'MANUFACTURED') {
            setFormData(prev => ({ ...prev, isPrepared: true, trackInventory: true }));
        } else if (formData.type === 'RAW_MATERIAL') {
            setFormData(prev => ({ ...prev, isPrepared: false, trackInventory: true }));
        } else if (formData.type === 'SERVICE') {
            setFormData(prev => ({ ...prev, trackInventory: false, isPrepared: false }));
        } else {
            setFormData(prev => ({ ...prev, trackInventory: true, isPrepared: false }));
        }
    }, [formData.type]);

    const handleTypeSelect = (type: ProductType) => {
        setFormData(prev => ({ ...prev, type }));
    };

    const handleInputChange = (field: keyof ItemMasterFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const generateSku = () => {
        const prefix = formData.type.substring(0, 3);
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const sku = `${prefix}-${random}`;
        handleInputChange('sku', sku);
        handleInputChange('barcode', `628${Date.now().toString().slice(-10)}`);
    };

    const validatePhase = (phase: number): boolean => {
        const newErrors: Partial<Record<keyof ItemMasterFormData, string>> = {};

        if (phase >= 1) {
            if (!formData.name.trim()) newErrors.name = 'Name is required';
        }

        if (phase >= 2) {
            if (!formData.salePrice && formData.type !== 'RAW_MATERIAL') {
                newErrors.salePrice = 'Sale price is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validatePhase(currentPhase)) {
            setCurrentPhase(prev => Math.min(prev + 1, 3) as 1 | 2 | 3);
        }
    };

    const handleBack = () => {
        setCurrentPhase(prev => Math.max(prev - 1, 1) as 1 | 2 | 3);
    };

    const handleSubmit = async () => {
        if (!validatePhase(3)) return;

        setIsSubmitting(true);
        try {
            // If onSave prop is provided, use it (for custom handling)
            if (onSave) {
                await onSave(formData);
            } else {
                // Otherwise, call productService.create() directly
                // Convert price strings to numbers for backend validation
                const salePriceNum = parseFloat(formData.salePrice) || 0;
                const costPriceNum = formData.costPrice ? parseFloat(formData.costPrice) : undefined;

                await productService.create({
                    name: formData.name,
                    sku: formData.sku,
                    barcode: formData.barcode || undefined,
                    description: formData.description || undefined,
                    categoryId: formData.categoryId || undefined,
                    salePrice: salePriceNum,
                    costPrice: costPriceNum,
                    taxable: !!formData.taxGroupId,
                    isActive: formData.isActive,
                    isPrepared: formData.isPrepared,
                    trackInventory: formData.trackInventory,
                    imageUrl: formData.imageUrl || undefined,
                } as any);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save item:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateMargin = (): string => {
        const sale = parseFloat(formData.salePrice) || 0;
        const cost = parseFloat(formData.costPrice) || 0;
        if (sale === 0) return '0';
        return ((sale - cost) / sale * 100).toFixed(1);
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
                        'w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl',
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
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className={cn(
                                    'text-lg font-bold',
                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-800'
                                )} data-theme={theme}>
                                    {t('itemMaster.title', 'Create New Item')}
                                </h2>
                                <p className="text-xs text-gray-400">
                                    {t(`itemMaster.phase${currentPhase}`, `Phase ${currentPhase}`)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Phase Indicators */}
                    <div className="flex gap-2 px-6 py-3">
                        {[1, 2, 3].map((phase) => (
                            <div
                                key={phase}
                                className={cn(
                                    'flex-1 h-1.5 rounded-full transition-colors',
                                    phase <= currentPhase
                                        ? 'bg-emerald-500'
                                        : 'data-[theme=dark]:bg-white/10 data-[theme=light]:bg-slate-200'
                                )}
                                data-theme={theme}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
                        <AnimatePresence mode="wait">
                            {/* Phase 1: Type Selection & Basic Info */}
                            {currentPhase === 1 && (
                                <motion.div
                                    key="phase1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Type Selector */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-400 mb-3 block">
                                            {t('itemMaster.selectType', 'Item Type')}
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {productTypes.map(({ type, icon: Icon, labelKey, descKey }) => (
                                                <button
                                                    key={type}
                                                    onClick={() => handleTypeSelect(type)}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'p-4 rounded-xl border-2 transition-all text-center',
                                                        formData.type === type
                                                            ? 'border-emerald-500 bg-emerald-500/20'
                                                            : cn(
                                                                'data-[theme=dark]:border-white/10 data-[theme=dark]:hover:border-white/30',
                                                                'data-[theme=light]:border-slate-200 data-[theme=light]:hover:border-slate-300'
                                                            )
                                                    )}
                                                >
                                                    <Icon className={cn(
                                                        'w-8 h-8 mx-auto mb-2',
                                                        formData.type === type ? 'text-emerald-400' : 'text-gray-400'
                                                    )} />
                                                    <p className={cn(
                                                        'text-sm font-medium',
                                                        formData.type === type
                                                            ? 'text-emerald-400'
                                                            : 'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                                    )} data-theme={theme}>
                                                        {t(labelKey)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">{t(descKey)}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Basic Fields */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                                {t('itemMaster.fields.name', 'Name')} *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                data-theme={theme}
                                                className={cn(
                                                    'w-full px-4 py-2.5 rounded-lg border transition-colors',
                                                    errors.name ? 'border-red-500' : '',
                                                    'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                    'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                )}
                                                placeholder={t('itemMaster.placeholders.name', 'Enter product name')}
                                            />
                                            {errors.name && (
                                                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                                    {t('itemMaster.fields.sku', 'SKU')}
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={formData.sku}
                                                        onChange={(e) => handleInputChange('sku', e.target.value)}
                                                        data-theme={theme}
                                                        className={cn(
                                                            'flex-1 px-4 py-2.5 rounded-lg border transition-colors',
                                                            'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                            'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                        )}
                                                        placeholder="AUTO-GEN"
                                                    />
                                                    <button
                                                        onClick={generateSku}
                                                        className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                                    >
                                                        <RefreshCw className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                                    {t('itemMaster.fields.category', 'Category')}
                                                </label>
                                                <select
                                                    value={formData.categoryId}
                                                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'w-full px-4 py-2.5 rounded-lg border transition-colors',
                                                        'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                        'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                    )}
                                                >
                                                    <option value="">{isLoadingCategories ? t('common.loading', 'Loading...') : t('itemMaster.selectCategory', 'Select Category')}</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {isRTL && cat.nameAr ? cat.nameAr : cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                                {t('itemMaster.fields.description', 'Description')}
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                                data-theme={theme}
                                                rows={2}
                                                className={cn(
                                                    'w-full px-4 py-2.5 rounded-lg border transition-colors resize-none',
                                                    'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                    'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                )}
                                                placeholder={t('itemMaster.placeholders.description', 'Optional description')}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Phase 2: Pricing & Kitchen */}
                            {currentPhase === 2 && (
                                <motion.div
                                    key="phase2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Pricing */}
                                    <div>
                                        <h3 className={cn(
                                            'text-sm font-semibold mb-4 flex items-center gap-2',
                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                        )} data-theme={theme}>
                                            <Tag className="w-4 h-4 text-emerald-400" />
                                            {t('itemMaster.pricing', 'Pricing & Tax')}
                                        </h3>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                                    {t('itemMaster.fields.salePrice', 'Sale Price')}
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                        {isRTL ? 'ر.س' : 'SAR'}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.salePrice}
                                                        onChange={(e) => handleInputChange('salePrice', e.target.value)}
                                                        data-theme={theme}
                                                        className={cn(
                                                            'w-full pl-12 pr-4 py-2.5 rounded-lg border transition-colors',
                                                            errors.salePrice ? 'border-red-500' : '',
                                                            'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                            'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                        )}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                                    {t('itemMaster.fields.costPrice', 'Cost Price')}
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                                        {isRTL ? 'ر.س' : 'SAR'}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.costPrice}
                                                        onChange={(e) => handleInputChange('costPrice', e.target.value)}
                                                        data-theme={theme}
                                                        className={cn(
                                                            'w-full pl-12 pr-4 py-2.5 rounded-lg border transition-colors',
                                                            'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                            'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                        )}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                                    {t('itemMaster.fields.taxGroup', 'Tax Group')}
                                                </label>
                                                <select
                                                    value={formData.taxGroupId}
                                                    onChange={(e) => handleInputChange('taxGroupId', e.target.value)}
                                                    data-theme={theme}
                                                    className={cn(
                                                        'w-full px-4 py-2.5 rounded-lg border transition-colors',
                                                        'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                        'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                        'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                    )}
                                                >
                                                    <option value="">VAT 15%</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Margin Display */}
                                        {formData.salePrice && (
                                            <div className={cn(
                                                'mt-3 p-3 rounded-lg flex items-center justify-between',
                                                parseFloat(calculateMargin()) >= 30
                                                    ? 'bg-emerald-500/20'
                                                    : parseFloat(calculateMargin()) >= 0
                                                        ? 'bg-amber-500/20'
                                                        : 'bg-red-500/20'
                                            )}>
                                                <span className="text-sm text-gray-400">{t('itemMaster.margin', 'Margin')}</span>
                                                <span className={cn(
                                                    'font-bold',
                                                    parseFloat(calculateMargin()) >= 30
                                                        ? 'text-emerald-400'
                                                        : parseFloat(calculateMargin()) >= 0
                                                            ? 'text-amber-400'
                                                            : 'text-red-400'
                                                )}>
                                                    {calculateMargin()}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Barcode */}
                                    <div>
                                        <h3 className={cn(
                                            'text-sm font-semibold mb-4 flex items-center gap-2',
                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                        )} data-theme={theme}>
                                            <Tag className="w-4 h-4 text-emerald-400" />
                                            {t('itemMaster.barcode', 'Barcode & Labeling')}
                                        </h3>

                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                value={formData.barcode}
                                                onChange={(e) => handleInputChange('barcode', e.target.value)}
                                                data-theme={theme}
                                                className={cn(
                                                    'flex-1 px-4 py-2.5 rounded-lg border transition-colors font-mono',
                                                    'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                    'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                    'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                )}
                                                placeholder="6281000000000"
                                            />
                                            <Button variant="ghost" className="gap-2">
                                                <Printer className="w-4 h-4" />
                                                {t('actions.printLabel', 'Print Label')}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Inventory Tracking */}
                                    <div>
                                        <h3 className={cn(
                                            'text-sm font-semibold mb-4 flex items-center gap-2',
                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                        )} data-theme={theme}>
                                            <Package className="w-4 h-4 text-emerald-400" />
                                            {t('itemMaster.inventorySettings', 'Inventory Settings')}
                                        </h3>

                                        <div className="flex items-center justify-between p-4 rounded-lg border data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200" data-theme={theme}>
                                            <div>
                                                <div className={cn(
                                                    'font-medium',
                                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-800'
                                                )} data-theme={theme}>
                                                    {t('itemMaster.fields.trackInventory', 'Track Inventory')}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {t('itemMaster.fields.trackInventoryDesc', 'Enable stock level tracking, batches, and low-stock alerts')}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange('trackInventory', !formData.trackInventory)}
                                                className={cn(
                                                    'relative w-14 h-7 rounded-full transition-colors',
                                                    formData.trackInventory ? 'bg-emerald-500' : 'bg-gray-500'
                                                )}
                                            >
                                                <span className={cn(
                                                    'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                                                    formData.trackInventory ? 'left-8' : 'left-1'
                                                )} />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Kitchen Routing - only for prepared items */}
                                    {(formData.type === 'MANUFACTURED' || formData.type === 'STANDARD') && (
                                        <div>
                                            <h3 className={cn(
                                                'text-sm font-semibold mb-4 flex items-center gap-2',
                                                'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                            )} data-theme={theme}>
                                                <ChefHat className="w-4 h-4 text-emerald-400" />
                                                {t('itemMaster.kitchenRouting', 'Kitchen Routing')}
                                            </h3>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                                        {t('itemMaster.fields.printerGroup', 'Printer Group')}
                                                    </label>
                                                    <select
                                                        value={formData.printerGroupId}
                                                        onChange={(e) => handleInputChange('printerGroupId', e.target.value)}
                                                        data-theme={theme}
                                                        className={cn(
                                                            'w-full px-4 py-2.5 rounded-lg border transition-colors',
                                                            'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                            'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                        )}
                                                    >
                                                        <option value="">{t('itemMaster.noPrinter', 'No Kitchen Printer')}</option>
                                                        <option value="grill">Grill Station</option>
                                                        <option value="bar">Bar</option>
                                                        <option value="dessert">Dessert Station</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-400 mb-1.5 block">
                                                        {t('itemMaster.fields.prepTime', 'Prep Time (min)')}
                                                    </label>
                                                    <div className="relative">
                                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="number"
                                                            value={formData.prepTime}
                                                            onChange={(e) => handleInputChange('prepTime', parseInt(e.target.value) || 0)}
                                                            data-theme={theme}
                                                            className={cn(
                                                                'w-full pl-10 pr-4 py-2.5 rounded-lg border transition-colors',
                                                                'data-[theme=dark]:bg-white/5 data-[theme=dark]:border-white/10 data-[theme=dark]:text-white',
                                                                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200 data-[theme=light]:text-slate-800',
                                                                'focus:outline-none focus:ring-2 focus:ring-emerald-500'
                                                            )}
                                                            placeholder="5"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                'mt-3 p-3 rounded-lg text-sm',
                                                'data-[theme=dark]:bg-white/5 data-[theme=light]:bg-slate-50'
                                            )} data-theme={theme}>
                                                <span className="text-gray-400">
                                                    {t('itemMaster.kitchenInfo', 'When sold: Order sent to selected station KDS')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Phase 3: Modifiers */}
                            {currentPhase === 3 && (
                                <motion.div
                                    key="phase3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h3 className={cn(
                                            'text-sm font-semibold mb-4 flex items-center gap-2',
                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                        )} data-theme={theme}>
                                            {t('itemMaster.modifiers.title', 'Modifiers')}
                                        </h3>

                                        {/* Modifier Groups Table */}
                                        <div
                                            data-theme={theme}
                                            className={cn(
                                                'rounded-lg border overflow-hidden',
                                                'data-[theme=dark]:border-white/10',
                                                'data-[theme=light]:border-slate-200'
                                            )}
                                        >
                                            <div className={cn(
                                                'p-4 text-center',
                                                'data-[theme=dark]:bg-white/5 data-[theme=light]:bg-slate-50'
                                            )} data-theme={theme}>
                                                <p className="text-sm text-gray-400">
                                                    {t('itemMaster.modifiers.empty', 'No modifier groups linked')}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    className="mt-2 gap-2 text-emerald-400"
                                                >
                                                    {t('itemMaster.modifiers.addGroup', '+ Add Modifier Group')}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            'mt-4 p-3 rounded-lg border-l-4 border-amber-500',
                                            'data-[theme=dark]:bg-amber-500/10 data-[theme=light]:bg-amber-50'
                                        )} data-theme={theme}>
                                            <p className="text-sm text-amber-400">
                                                ⚠️ {t('itemMaster.modifiers.inventoryImpact')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className={cn(
                                        'p-4 rounded-xl border',
                                        'data-[theme=dark]:border-white/10 data-[theme=dark]:bg-white/5',
                                        'data-[theme=light]:border-slate-200 data-[theme=light]:bg-slate-50'
                                    )} data-theme={theme}>
                                        <h4 className={cn(
                                            'text-sm font-semibold mb-3',
                                            'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                        )} data-theme={theme}>
                                            {t('itemMaster.summary', 'Summary')}
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{t('itemMaster.fields.name')}</span>
                                                <span className={cn(
                                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                                )} data-theme={theme}>{formData.name || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{t('itemMaster.selectType')}</span>
                                                <span className={cn(
                                                    'data-[theme=dark]:text-white data-[theme=light]:text-slate-700'
                                                )} data-theme={theme}>{formData.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{t('itemMaster.fields.salePrice')}</span>
                                                <span className="text-emerald-400 font-medium">
                                                    {formData.salePrice ? `${isRTL ? 'ر.س' : 'SAR'} ${formData.salePrice}` : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className={cn(
                        'flex items-center justify-between px-6 py-4 border-t',
                        'data-[theme=dark]:border-white/10 data-[theme=light]:border-slate-200'
                    )} data-theme={theme}>
                        <Button
                            variant="ghost"
                            onClick={currentPhase > 1 ? handleBack : onClose}
                        >
                            {currentPhase > 1 ? t('common.back', 'Back') : t('common.cancel', 'Cancel')}
                        </Button>

                        <div className="flex gap-2">
                            {currentPhase < 3 ? (
                                <Button
                                    variant="primary"
                                    onClick={handleNext}
                                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
                                >
                                    {t('common.next', 'Next')}
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSubmitting ? t('common.saving', 'Saving...') : t('itemMaster.save', 'Save Item')}
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default ItemMasterModal;
