/**
 * General Settings Section
 * Store information and basic settings
 */
import { useTranslation } from 'react-i18next';
import { Store, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { SettingsCard, SettingsRow } from '../SettingsCard';
import { useConfigStore } from '@/stores/config.store';
import { useSettingsStore } from '@/stores/settings.store';
import { cn } from '@/lib/utils';

export function GeneralSection() {
    const { t } = useTranslation('settings');
    const { theme } = useSettingsStore();
    const { organization, store } = useConfigStore();
    const isDark = theme === 'dark' || theme === 'luxury';

    return (
        <div className="space-y-6">
            {/* Store Information */}
            <SettingsCard
                title={t('general.storeInfo', 'Store Information')}
                description={t('general.storeInfoDesc', 'Basic information about your store')}
            >
                <SettingsRow
                    label={t('general.storeName', 'Store Name')}
                    description={t('general.storeNameDesc', 'The name displayed on receipts and reports')}
                >
                    <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-slate-400" />
                        <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                            {store?.name || 'NerdPOS Store'}
                        </span>
                    </div>
                </SettingsRow>

                <SettingsRow
                    label={t('general.organization', 'Organization')}
                >
                    <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
                        {organization?.name || 'NerdPOS Organization'}
                    </span>
                </SettingsRow>

                <SettingsRow
                    label={t('general.address', 'Address')}
                >
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
                            {store?.address || t('general.notSet', 'Not set')}
                        </span>
                    </div>
                </SettingsRow>

                <SettingsRow
                    label={t('general.phone', 'Phone')}
                >
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
                            {store?.phone || t('general.notSet', 'Not set')}
                        </span>
                    </div>
                </SettingsRow>

                <SettingsRow
                    label={t('general.email', 'Email')}
                >
                    <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
                            {store?.email || t('general.notSet', 'Not set')}
                        </span>
                    </div>
                </SettingsRow>
            </SettingsCard>

            {/* Regional Settings */}
            <SettingsCard
                title={t('general.regional', 'Regional Settings')}
                description={t('general.regionalDesc', 'Timezone and locale settings')}
            >
                <SettingsRow
                    label={t('general.timezone', 'Timezone')}
                >
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
                            {organization?.timezone || 'Asia/Riyadh'}
                        </span>
                    </div>
                </SettingsRow>

                <SettingsRow
                    label={t('general.currency', 'Currency')}
                >
                    <span className={cn('text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
                        {organization?.currency || 'SAR'} - Saudi Riyal
                    </span>
                </SettingsRow>
            </SettingsCard>

            {/* System Info */}
            <SettingsCard
                title={t('general.system', 'System Information')}
            >
                <SettingsRow label={t('general.version', 'Version')}>
                    <span className="text-sm text-slate-500">v2.0.0</span>
                </SettingsRow>

                <SettingsRow label={t('general.lastSync', 'Last Sync')}>
                    <span className="text-sm text-slate-500">
                        {useConfigStore.getState().lastSyncAt
                            ? new Date(useConfigStore.getState().lastSyncAt!).toLocaleString()
                            : t('general.never', 'Never')
                        }
                    </span>
                </SettingsRow>
            </SettingsCard>
        </div>
    );
}

export default GeneralSection;
