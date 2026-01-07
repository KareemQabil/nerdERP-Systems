import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin,
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Clock,
    DollarSign,
    Zap,
    Search,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { Button } from '@/components/ui';
import { PriceDisplay } from '@/components/shared';
import type {
    DeliveryZone,
    DeliveryZonePricingConfig,
    DistanceTier,
    PeakHoursSchedule,
} from '@/types/pos.types';

// =============================================================================
// DELIVERY ZONE CONFIG PAGE
// =============================================================================

interface DeliveryZoneConfigPageProps {
    storeId: string;
    onLoadZones: (storeId: string) => Promise<DeliveryZone[]>;
    onSaveZone: (zone: DeliveryZone) => Promise<void>;
    onDeleteZone: (zoneId: string) => Promise<void>;
}

/**
 * DeliveryZoneConfigPage
 *
 * Admin interface for configuring delivery zones.
 * Features:
 * - Create/edit/delete delivery zones
 * - Configure base fees and distance tiers
 * - Set estimated delivery times
 * - Configure peak hours pricing
 * - Visual zone management
 */
export function DeliveryZoneConfigPage({
    storeId,
    onLoadZones,
    onSaveZone,
    onDeleteZone,
}: DeliveryZoneConfigPageProps) {
    const { t } = useTranslation('admin');
    const { theme, language } = useSettingsStore();

    const [loading, setLoading] = useState(false);
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
    const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Load zones on mount
    useEffect(() => {
        loadZones();
    }, [storeId]);

    const loadZones = async () => {
        setLoading(true);
        try {
            const loadedZones = await onLoadZones(storeId);
            setZones(loadedZones);
        } catch (error) {
            console.error('Failed to load zones:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveZone = async (zone: DeliveryZone) => {
        try {
            await onSaveZone(zone);
            await loadZones();
            setEditingZone(null);
        } catch (error) {
            console.error('Failed to save zone:', error);
        }
    };

    const handleDeleteZone = async (zoneId: string) => {
        if (!confirm(language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) {
            return;
        }

        try {
            await onDeleteZone(zoneId);
            await loadZones();
        } catch (error) {
            console.error('Failed to delete zone:', error);
        }
    };

    const handleCreateNew = () => {
        const newZone: DeliveryZone = {
            id: '',
            zoneCode: '',
            zoneName: '',
            storeId,
            deliveryFee: 0,
            estimatedDeliveryMinutes: 30,
            minimumOrderValue: 50,
            freeDeliveryThreshold: 200,
            isActive: true,
            displayOrder: zones.length + 1,
            pricingConfig: {
                baseFee: 50,
                distanceTiers: [
                    { tierCode: 'A', fee: 50, increment: 0, estimatedMinutes: 30 },
                ],
                freeDeliveryThreshold: 200,
                minimumOrderValue: 50,
                peakHoursPricing: {
                    enabled: false,
                    surcharge: 10,
                    schedules: [],
                },
            },
        };
        setEditingZone(newZone);
        setExpandedZoneId('new');
    };

    // Filter zones by search query
    const filteredZones = zones.filter((zone) =>
        zone.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.zoneCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        'bg-gradient-to-br from-green-500 to-emerald-600',
                    )}>
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2
                            data-theme={theme}
                            className={cn(
                                'text-lg font-bold',
                                'text-white',
                                'data-[theme=light]:text-slate-900',
                            )}
                        >
                            {t('deliveryZones.title', 'Delivery Zones')}
                        </h2>
                        <p className="text-xs text-slate-400">
                            {zones.length} {language === 'ar' ? 'منطقة' : 'zones'}
                        </p>
                    </div>
                </div>

                <Button variant="primary" onClick={handleCreateNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('deliveryZones.addZone', 'Add Zone')}
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('deliveryZones.searchPlaceholder', 'Search zones...')}
                    data-theme={theme}
                    className={cn(
                        'w-full pl-10 pr-4 py-2 rounded-xl border-2',
                        'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                        'data-[theme=light]:bg-slate-50 data-[theme=light]:border-slate-300',
                        'text-white placeholder:text-slate-500',
                        'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder:text-slate-400',
                    )}
                />
            </div>

            {/* Zone Editor */}
            {editingZone && (
                <ZoneEditor
                    zone={editingZone}
                    isNew={!editingZone.id}
                    onSave={handleSaveZone}
                    onCancel={() => {
                        setEditingZone(null);
                        setExpandedZoneId(null);
                    }}
                />
            )}

            {/* Zones List */}
            <div className="space-y-2">
                {filteredZones.map((zone) => (
                    <ZoneCard
                        key={zone.id}
                        zone={zone}
                        expanded={expandedZoneId === zone.id}
                        onToggleExpand={() => setExpandedZoneId(
                            expandedZoneId === zone.id ? null : zone.id
                        )}
                        onEdit={() => {
                            setEditingZone(zone);
                            setExpandedZoneId(zone.id);
                        }}
                        onDelete={() => handleDeleteZone(zone.id)}
                    />
                ))}

                {filteredZones.length === 0 && (
                    <div
                        data-theme={theme}
                        className={cn(
                            'rounded-xl p-8 text-center',
                            'bg-slate-800/50',
                            'data-[theme=light]:bg-slate-50',
                        )}
                    >
                        <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p
                            data-theme={theme}
                            className={cn(
                                'text-slate-400',
                                'data-[theme=light]:text-slate-500',
                            )}
                        >
                            {searchQuery
                                ? t('deliveryZones.noZonesFound', 'No zones found')
                                : t('deliveryZones.noZones', 'No delivery zones configured')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// ZONE CARD COMPONENT
// =============================================================================

interface ZoneCardProps {
    zone: DeliveryZone;
    expanded: boolean;
    onToggleExpand: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function ZoneCard({ zone, expanded, onToggleExpand, onEdit, onDelete }: ZoneCardProps) {
    const { t } = useTranslation('admin');
    const { theme, language } = useSettingsStore();

    const pricing = zone.pricingConfig;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            data-theme={theme}
            className={cn(
                'rounded-xl border-2 overflow-hidden transition-all',
                zone.isActive
                    ? 'bg-slate-800/50 border-slate-700/50'
                    : 'bg-slate-800/30 border-slate-700/30 opacity-60',
                'data-[theme=light]:bg-white data-[theme=light]:border-slate-200',
            )}
        >
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={onToggleExpand}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        'bg-green-500/20',
                    )}>
                        <MapPin className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span
                                data-theme={theme}
                                className={cn(
                                    'font-bold text-sm',
                                    'text-white',
                                    'data-[theme=light]:text-slate-900',
                                )}
                            >
                                {zone.zoneName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-400">
                                {zone.zoneCode}
                            </span>
                            {!zone.isActive && (
                                <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-slate-500/20 text-slate-400">
                                    {language === 'ar' ? 'غير نشط' : 'Inactive'}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>{t('deliveryZones.baseFee', 'Fee')}: </span>
                            <PriceDisplay value={pricing?.baseFee?.toString() || zone.deliveryFee.toString()} size="xs" variant="muted" />
                            <span>•</span>
                            <span>{t('deliveryZones.estTime', 'Est')}: {zone.estimatedDeliveryMinutes}{language === 'ar' ? 'د' : 'm'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                        <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && pricing && (
                <div
                    data-theme={theme}
                    className={cn(
                        'p-4 pt-0 border-t border-slate-700/50 space-y-3',
                        'data-[theme=light]:border-slate-200',
                    )}
                >
                    {/* Distance Tiers */}
                    <div>
                        <h4
                            data-theme={theme}
                            className={cn(
                                'text-xs font-bold text-slate-400 mb-2',
                                'uppercase tracking-wide',
                            )}
                        >
                            {t('deliveryZones.distanceTiers', 'Distance Tiers')}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {pricing.distanceTiers.map((tier, index) => (
                                <div
                                    key={index}
                                    data-theme={theme}
                                    className={cn(
                                        'rounded-lg p-2 text-center',
                                        'bg-slate-700/30',
                                        'data-[theme=light]:bg-slate-100',
                                    )}
                                >
                                    <div className="text-xs font-bold text-cyan-400 mb-1">
                                        {tier.tierCode}
                                    </div>
                                    <div className="text-sm">
                                        <PriceDisplay value={tier.fee.toString()} size="xs" variant="muted" />
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {tier.estimatedMinutes}{language === 'ar' ? 'د' : 'm'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Info */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                            <span className="text-slate-400">{t('deliveryZones.minOrder', 'Min Order')}</span>
                            <div className="font-bold">
                                <PriceDisplay value={pricing.minimumOrderValue.toString()} size="sm" variant="muted" />
                            </div>
                        </div>
                        <div>
                            <span className="text-slate-400">{t('deliveryZones.freeDelivery', 'Free Delivery')}</span>
                            <div className="font-bold">
                                {pricing.freeDeliveryThreshold > 0 ? (
                                    <PriceDisplay value={pricing.freeDeliveryThreshold.toString()} size="sm" variant="muted" />
                                ) : (
                                    <span className="text-slate-500">-</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="text-slate-400">{t('deliveryZones.peakHours', 'Peak Hours')}</span>
                            <div className="font-bold text-slate-400">
                                {pricing.peakHoursPricing?.enabled ? (
                                    <span className="text-orange-400">
                                        +{pricing.peakHoursPricing.surcharge} {language === 'ar' ? 'ر.س' : 'SAR'}
                                    </span>
                                ) : (
                                    t('deliveryZones.disabled', 'Off')
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// =============================================================================
// ZONE EDITOR COMPONENT
// =============================================================================

interface ZoneEditorProps {
    zone: DeliveryZone;
    isNew: boolean;
    onSave: (zone: DeliveryZone) => void;
    onCancel: () => void;
}

function ZoneEditor({ zone, isNew, onSave, onCancel }: ZoneEditorProps) {
    const { t } = useTranslation('admin');
    const { theme, language } = useSettingsStore();
    const [localZone, setLocalZone] = useState<DeliveryZone>(zone);

    const updateField = (field: keyof DeliveryZone, value: any) => {
        setLocalZone((prev) => ({ ...prev, [field]: value }));
    };

    const updatePricing = (field: keyof DeliveryZonePricingConfig, value: any) => {
        setLocalZone((prev) => ({
            ...prev,
            pricingConfig: {
                ...prev.pricingConfig!,
                [field]: value,
            },
        }));
    };

    const handleSave = () => {
        onSave(localZone);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            data-theme={theme}
            className={cn(
                'rounded-xl border-2 p-4 space-y-4',
                'bg-cyan-500/10 border-cyan-500/30',
                'data-[theme=light]:bg-cyan-50 data-[theme=light]:border-cyan-200',
            )}
        >
            <div className="flex items-center justify-between">
                <h3
                    data-theme={theme}
                    className={cn(
                        'font-bold text-sm',
                        'text-cyan-400',
                    )}
                >
                    {isNew ? t('deliveryZones.newZone', 'New Zone') : t('deliveryZones.editZone', 'Edit Zone')}
                </h3>
                <button
                    onClick={onCancel}
                    className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Zone Code */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('deliveryZones.zoneCode', 'Zone Code')}
                    </label>
                    <input
                        type="text"
                        value={localZone.zoneCode}
                        onChange={(e) => updateField('zoneCode', e.target.value)}
                        placeholder="A, B, C..."
                        data-theme={theme}
                        className={cn(
                            'w-full px-3 py-2 rounded-lg border-2 text-sm',
                            'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white placeholder:text-slate-500',
                            'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder:text-slate-400',
                        )}
                    />
                </div>

                {/* Zone Name */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('deliveryZones.zoneName', 'Zone Name')}
                    </label>
                    <input
                        type="text"
                        value={localZone.zoneName}
                        onChange={(e) => updateField('zoneName', e.target.value)}
                        placeholder={language === 'ar' ? 'وسط المدينة' : 'Downtown'}
                        data-theme={theme}
                        className={cn(
                            'w-full px-3 py-2 rounded-lg border-2 text-sm',
                            'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white placeholder:text-slate-500',
                            'data-[theme=light]:text-slate-900 data-[theme=light]:placeholder:text-slate-400',
                        )}
                    />
                </div>

                {/* Base Fee */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('deliveryZones.baseFee', 'Base Fee')} ({language === 'ar' ? 'ر.س' : 'SAR'})
                    </label>
                    <input
                        type="number"
                        value={localZone.pricingConfig?.baseFee || localZone.deliveryFee}
                        onChange={(e) => updatePricing('baseFee', parseFloat(e.target.value))}
                        min="0"
                        step="1"
                        data-theme={theme}
                        className={cn(
                            'w-full px-3 py-2 rounded-lg border-2 text-sm',
                            'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    />
                </div>

                {/* Estimated Minutes */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('deliveryZones.estTime', 'Est Time')} ({language === 'ar' ? 'دقيقة' : 'minutes'})
                    </label>
                    <input
                        type="number"
                        value={localZone.estimatedDeliveryMinutes}
                        onChange={(e) => updateField('estimatedDeliveryMinutes', parseInt(e.target.value))}
                        min="5"
                        step="5"
                        data-theme={theme}
                        className={cn(
                            'w-full px-3 py-2 rounded-lg border-2 text-sm',
                            'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    />
                </div>
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-3 gap-3">
                {/* Min Order Value */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('deliveryZones.minOrder', 'Min Order')}
                    </label>
                    <input
                        type="number"
                        value={localZone.pricingConfig?.minimumOrderValue || 0}
                        onChange={(e) => updatePricing('minimumOrderValue', parseFloat(e.target.value))}
                        min="0"
                        step="1"
                        data-theme={theme}
                        className={cn(
                            'w-full px-3 py-2 rounded-lg border-2 text-sm',
                            'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    />
                </div>

                {/* Free Delivery Threshold */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('deliveryZones.freeThreshold', 'Free Threshold')}
                    </label>
                    <input
                        type="number"
                        value={localZone.pricingConfig?.freeDeliveryThreshold || 0}
                        onChange={(e) => updatePricing('freeDeliveryThreshold', parseFloat(e.target.value))}
                        min="0"
                        step="1"
                        data-theme={theme}
                        className={cn(
                            'w-full px-3 py-2 rounded-lg border-2 text-sm',
                            'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    />
                </div>

                {/* Peak Hours Surcharge */}
                <div>
                    <label className="text-xs text-slate-400 block mb-1">
                        {t('deliveryZones.peakSurcharge', 'Peak Surcharge')}
                    </label>
                    <input
                        type="number"
                        value={localZone.pricingConfig?.peakHoursPricing?.surcharge || 0}
                        onChange={(e) => updatePricing('peakHoursPricing', {
                            ...localZone.pricingConfig?.peakHoursPricing!,
                            surcharge: parseFloat(e.target.value),
                        })}
                        min="0"
                        step="1"
                        data-theme={theme}
                        className={cn(
                            'w-full px-3 py-2 rounded-lg border-2 text-sm',
                            'bg-slate-800/50 border-slate-700 focus:border-cyan-500 outline-none',
                            'data-[theme=light]:bg-white data-[theme=light]:border-slate-300',
                            'text-white',
                            'data-[theme=light]:text-slate-900',
                        )}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={onCancel}>
                    {t('cancel', 'Cancel')}
                </Button>
                <Button variant="primary" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    {t('save', 'Save')}
                </Button>
            </div>
        </motion.div>
    );
}

export default DeliveryZoneConfigPage;
