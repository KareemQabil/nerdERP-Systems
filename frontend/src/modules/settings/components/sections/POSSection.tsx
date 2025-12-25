/**
 * POS Settings Section
 * Configure POS-specific settings like order types and tax
 */
import { useTranslation } from 'react-i18next';
import { Utensils, Package, Truck, Car, Percent, DollarSign } from 'lucide-react';
import { SettingsCard, SettingsRow } from '../SettingsCard';
import { FeatureToggle } from '../FeatureToggle';
import { useConfigStore } from '@/stores/config.store';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';
import type { OrderType } from '@/types/config.types';

const ORDER_TYPE_CONFIG: Record<OrderType, { icon: typeof Utensils; colorClass: string }> = {
    DINE_IN: { icon: Utensils, colorClass: 'text-blue-500' },
    TAKEAWAY: { icon: Package, colorClass: 'text-green-500' },
    DELIVERY: { icon: Truck, colorClass: 'text-orange-500' },
    PICKUP: { icon: Package, colorClass: 'text-purple-500' },
    DRIVE_THRU: { icon: Car, colorClass: 'text-red-500' },
};

export function POSSection() {
    const { t } = useTranslation('settings');
    const { theme } = useSettingsStore();
    const { posConfig, setPOSConfig } = useConfigStore();
    const isDark = theme === 'dark' || theme === 'luxury';

    const toggleOrderType = (type: OrderType) => {
        const current = posConfig.enabledOrderTypes;
        const newTypes = current.includes(type)
            ? current.filter((t) => t !== type)
            : [...current, type];
        setPOSConfig({ enabledOrderTypes: newTypes });
    };

    const setDefaultOrderType = (type: OrderType) => {
        setPOSConfig({ defaultOrderType: type });
    };

    return (
        <div className="space-y-6">
            {/* Order Types */}
            <SettingsCard
                title={t('pos.orderTypes', 'Order Types')}
                description={t('pos.orderTypesDesc', 'Configure which order types are available')}
            >
                {(Object.keys(ORDER_TYPE_CONFIG) as OrderType[]).map((type) => {
                    const config = ORDER_TYPE_CONFIG[type];
                    const Icon = config.icon;
                    const isEnabled = posConfig.enabledOrderTypes.includes(type);
                    const isDefault = posConfig.defaultOrderType === type;

                    return (
                        <div
                            key={type}
                            className={cn(
                                'flex items-center gap-4 p-4 rounded-xl transition-colors',
                                isDark
                                    ? 'bg-slate-700/30 hover:bg-slate-700/50'
                                    : 'bg-slate-50 hover:bg-slate-100'
                            )}
                        >
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center',
                                    isEnabled
                                        ? 'bg-slate-700/50'
                                        : isDark
                                            ? 'bg-slate-600/30'
                                            : 'bg-slate-200',
                                    config.colorClass
                                )}
                            >
                                <Icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1">
                                <p
                                    className={cn(
                                        'font-medium text-sm',
                                        isDark ? 'text-slate-200' : 'text-slate-700'
                                    )}
                                >
                                    {t(`pos.orderType.${type}`, type.replace('_', ' '))}
                                </p>
                                {isDefault && (
                                    <span className="text-xs text-violet-400">
                                        {t('pos.default', 'Default')}
                                    </span>
                                )}
                            </div>

                            {/* Set as Default */}
                            {isEnabled && !isDefault && (
                                <button
                                    onClick={() => setDefaultOrderType(type)}
                                    className={cn(
                                        'px-3 py-1 text-xs rounded-lg transition-colors',
                                        isDark
                                            ? 'bg-slate-600 hover:bg-slate-500 text-slate-300'
                                            : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                                    )}
                                >
                                    {t('pos.setDefault', 'Set Default')}
                                </button>
                            )}

                            {/* Toggle */}
                            <button
                                onClick={() => toggleOrderType(type)}
                                className={cn(
                                    'relative w-12 h-7 rounded-full transition-colors',
                                    isEnabled
                                        ? 'bg-violet-500'
                                        : isDark
                                            ? 'bg-slate-600'
                                            : 'bg-slate-300'
                                )}
                            >
                                <div
                                    className={cn(
                                        'absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                                    )}
                                />
                            </button>
                        </div>
                    );
                })}
            </SettingsCard>

            {/* Tax Settings */}
            <SettingsCard
                title={t('pos.tax', 'Tax Settings')}
                description={t('pos.taxDesc', 'Configure tax calculation')}
            >
                <SettingsRow
                    label={t('pos.taxRate', 'Tax Rate')}
                    description={t('pos.taxRateDesc', 'Default VAT percentage')}
                >
                    <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-slate-400" />
                        <span
                            className={cn(
                                'text-lg font-semibold',
                                isDark ? 'text-white' : 'text-slate-900'
                            )}
                        >
                            {posConfig.taxRate}%
                        </span>
                    </div>
                </SettingsRow>

                <FeatureToggle
                    label={t('pos.taxIncluded', 'Prices Include Tax')}
                    description={t('pos.taxIncludedDesc', 'Product prices already include VAT')}
                    icon={DollarSign}
                    enabled={posConfig.taxIncluded}
                    onChange={(v) => setPOSConfig({ taxIncluded: v })}
                />
            </SettingsCard>

            {/* Currency Settings */}
            <SettingsCard
                title={t('pos.currency', 'Currency')}
                description={t('pos.currencyDesc', 'Currency display settings')}
            >
                <SettingsRow
                    label={t('pos.currencyCode', 'Currency Code')}
                >
                    <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                        {posConfig.currency}
                    </span>
                </SettingsRow>

                <SettingsRow
                    label={t('pos.currencySymbol', 'Symbol')}
                >
                    <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
                        {posConfig.currencySymbol}
                    </span>
                </SettingsRow>

                <SettingsRow
                    label={t('pos.symbolPosition', 'Symbol Position')}
                >
                    <select
                        value={posConfig.currencyPosition}
                        onChange={(e) => setPOSConfig({ currencyPosition: e.target.value as 'before' | 'after' })}
                        className={cn(
                            'px-3 py-1.5 rounded-lg border text-sm',
                            isDark
                                ? 'bg-slate-700 border-slate-600 text-white'
                                : 'bg-white border-slate-300 text-slate-900'
                        )}
                    >
                        <option value="before">{t('pos.before', 'Before')} ($100)</option>
                        <option value="after">{t('pos.after', 'After')} (100 ر.س)</option>
                    </select>
                </SettingsRow>

                <SettingsRow
                    label={t('pos.decimalPlaces', 'Decimal Places')}
                >
                    <select
                        value={posConfig.decimalPlaces}
                        onChange={(e) => setPOSConfig({ decimalPlaces: Number(e.target.value) })}
                        className={cn(
                            'px-3 py-1.5 rounded-lg border text-sm',
                            isDark
                                ? 'bg-slate-700 border-slate-600 text-white'
                                : 'bg-white border-slate-300 text-slate-900'
                        )}
                    >
                        <option value={2}>2 (0.00)</option>
                        <option value={3}>3 (0.000)</option>
                    </select>
                </SettingsRow>
            </SettingsCard>
        </div>
    );
}

export default POSSection;
