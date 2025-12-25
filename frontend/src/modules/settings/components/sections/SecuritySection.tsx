/**
 * Security Settings Section
 * PIN requirements and session settings
 */
import { useTranslation } from 'react-i18next';
import { Shield, Percent, X, RotateCcw, Wallet, Clock } from 'lucide-react';
import { SettingsCard, SettingsRow } from '../SettingsCard';
import { FeatureToggle } from '../FeatureToggle';
import { useConfigStore } from '@/stores/config.store';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';

type PinRequiredAction = 'DISCOUNT' | 'VOID' | 'REFUND' | 'CASH_DROP' | 'PRICE_OVERRIDE';

const PIN_ACTION_CONFIG: Record<PinRequiredAction, { icon: typeof Shield; labelKey: string; descKey: string }> = {
    DISCOUNT: {
        icon: Percent,
        labelKey: 'security.discounts',
        descKey: 'security.discountsDesc',
    },
    VOID: {
        icon: X,
        labelKey: 'security.voidItems',
        descKey: 'security.voidItemsDesc',
    },
    REFUND: {
        icon: RotateCcw,
        labelKey: 'security.refunds',
        descKey: 'security.refundsDesc',
    },
    CASH_DROP: {
        icon: Wallet,
        labelKey: 'security.cashDrop',
        descKey: 'security.cashDropDesc',
    },
    PRICE_OVERRIDE: {
        icon: Percent,
        labelKey: 'security.priceOverride',
        descKey: 'security.priceOverrideDesc',
    },
};

export function SecuritySection() {
    const { t } = useTranslation('settings');
    const { theme } = useSettingsStore();
    const { posConfig, setPOSConfig, features } = useConfigStore();
    const isDark = theme === 'dark' || theme === 'luxury';

    const togglePinRequirement = (action: PinRequiredAction) => {
        const current = posConfig.requirePinFor;
        const newActions = current.includes(action)
            ? current.filter((a) => a !== action)
            : [...current, action];
        setPOSConfig({ requirePinFor: newActions });
    };

    return (
        <div className="space-y-6">
            {/* PIN Requirements */}
            <SettingsCard
                title={t('security.pinRequirements', 'Manager PIN Required For')}
                description={t('security.pinRequirementsDesc', 'Actions that require manager authorization')}
            >
                {features.security.managerPin ? (
                    (Object.keys(PIN_ACTION_CONFIG) as PinRequiredAction[]).map((action) => {
                        const config = PIN_ACTION_CONFIG[action];
                        const isRequired = posConfig.requirePinFor.includes(action);

                        return (
                            <FeatureToggle
                                key={action}
                                label={t(config.labelKey, action)}
                                description={t(config.descKey, '')}
                                icon={config.icon}
                                enabled={isRequired}
                                onChange={() => togglePinRequirement(action)}
                            />
                        );
                    })
                ) : (
                    <div
                        className={cn(
                            'p-4 rounded-xl text-center',
                            isDark ? 'bg-slate-700/30' : 'bg-slate-100'
                        )}
                    >
                        <Shield className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-500">
                            {t('security.enableManagerPin', 'Enable Manager PIN in Features to configure requirements')}
                        </p>
                    </div>
                )}
            </SettingsCard>

            {/* Limits */}
            <SettingsCard
                title={t('security.limits', 'Authorization Limits')}
                description={t('security.limitsDesc', 'Thresholds for manager authorization')}
            >
                <SettingsRow
                    label={t('security.maxDiscount', 'Max Discount Without Auth')}
                    description={t('security.maxDiscountDesc', 'Discounts above this require manager PIN')}
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={posConfig.maxDiscountPercent}
                            onChange={(e) => setPOSConfig({ maxDiscountPercent: Number(e.target.value) })}
                            min={0}
                            max={100}
                            className={cn(
                                'w-20 px-3 py-1.5 rounded-lg border text-sm text-center',
                                isDark
                                    ? 'bg-slate-700 border-slate-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-900'
                            )}
                        />
                        <span className="text-slate-500">%</span>
                    </div>
                </SettingsRow>

                <SettingsRow
                    label={t('security.maxRefund', 'Max Refund Without Auth')}
                    description={t('security.maxRefundDesc', 'Refunds above this require manager PIN')}
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={posConfig.maxRefundWithoutAuth}
                            onChange={(e) => setPOSConfig({ maxRefundWithoutAuth: e.target.value })}
                            className={cn(
                                'w-24 px-3 py-1.5 rounded-lg border text-sm text-center',
                                isDark
                                    ? 'bg-slate-700 border-slate-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-900'
                            )}
                        />
                        <span className="text-slate-500">{posConfig.currency}</span>
                    </div>
                </SettingsRow>
            </SettingsCard>

            {/* Session Settings */}
            <SettingsCard
                title={t('security.session', 'Session Settings')}
                description={t('security.sessionDesc', 'User session and timeout settings')}
            >
                <SettingsRow
                    label={t('security.sessionTimeout', 'Session Timeout')}
                    description={t('security.sessionTimeoutDesc', 'Auto-lock after inactivity')}
                >
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <select
                            value={posConfig.sessionTimeout}
                            onChange={(e) => setPOSConfig({ sessionTimeout: Number(e.target.value) })}
                            className={cn(
                                'px-3 py-1.5 rounded-lg border text-sm',
                                isDark
                                    ? 'bg-slate-700 border-slate-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-900'
                            )}
                        >
                            <option value={5}>5 {t('security.minutes', 'minutes')}</option>
                            <option value={10}>10 {t('security.minutes', 'minutes')}</option>
                            <option value={15}>15 {t('security.minutes', 'minutes')}</option>
                            <option value={30}>30 {t('security.minutes', 'minutes')}</option>
                            <option value={60}>1 {t('security.hour', 'hour')}</option>
                            <option value={0}>{t('security.never', 'Never')}</option>
                        </select>
                    </div>
                </SettingsRow>
            </SettingsCard>
        </div>
    );
}

export default SecuritySection;
