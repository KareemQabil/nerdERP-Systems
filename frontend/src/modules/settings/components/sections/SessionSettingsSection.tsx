/**
 * Session Settings Section
 * Configure cashier session and cash drawer settings including blind count
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Calculator,
    Eye,
    EyeOff,
    Clock,
    FileText,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { SettingsCard, SettingsRow } from '../SettingsCard';
import { FeatureToggle } from '../FeatureToggle';
import { useSettingsStore } from '@/stores/settings.store';
import { useConfigStore } from '@/stores/config.store';
import { storeConfigService } from '@/services/store-config.service';
import { cn } from '@/lib/utils';

export function SessionSettingsSection() {
    const { t } = useTranslation('settings');
    const { theme } = useSettingsStore();
    const { store } = useConfigStore();
    const storeId = store?.id;
    const isDark = theme === 'dark' || theme === 'luxury';

    // Config state
    const [blindCountEnabled, setBlindCountEnabled] = useState(true);
    const [discrepancyThreshold, setDiscrepancyThreshold] = useState(5);
    const [allowMultipleSessions, setAllowMultipleSessions] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState(480);

    // Loading/saving state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // Load configurations on mount
    useEffect(() => {
        const loadConfigs = async () => {
            if (!storeId) return;

            try {
                setLoading(true);
                const [blind, threshold, multiple, timeout] = await Promise.all([
                    storeConfigService.getBoolean(storeId, 'session.blind_count_enabled', true),
                    storeConfigService.getNumber(storeId, 'session.discrepancy_notes_threshold', 5),
                    storeConfigService.getBoolean(storeId, 'session.allow_multiple_open', false),
                    storeConfigService.getNumber(storeId, 'session.timeout_minutes', 480),
                ]);

                setBlindCountEnabled(blind);
                setDiscrepancyThreshold(threshold);
                setAllowMultipleSessions(multiple);
                setSessionTimeout(timeout);
            } catch (error) {
                console.error('Failed to load session configs:', error);
            } finally {
                setLoading(false);
            }
        };

        loadConfigs();
    }, [storeId]);

    // Save handlers
    const saveConfig = async (
        key: string,
        value: boolean | number,
        type: 'boolean' | 'number',
        setter: React.Dispatch<React.SetStateAction<any>>
    ) => {
        if (!storeId) return;

        setSaving(key);
        try {
            if (type === 'boolean') {
                await storeConfigService.setBoolean(storeId, key, value as boolean, 'session');
            } else {
                await storeConfigService.setNumber(storeId, key, value as number, 'session');
            }
            setter(value);
        } catch (error) {
            console.error(`Failed to save ${key}:`, error);
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Blind Count Settings */}
            <SettingsCard
                title={t('session.blindCount', 'Blind Count')}
                description={t('session.blindCountDesc', 'Hide expected cash during drawer count for security')}
            >
                <FeatureToggle
                    label={t('session.enableBlindCount', 'Enable Blind Count')}
                    description={t('session.enableBlindCountDesc', 'Cashier enters counted cash without seeing expected amount')}
                    icon={blindCountEnabled ? EyeOff : Eye}
                    enabled={blindCountEnabled}
                    disabled={saving === 'session.blind_count_enabled'}
                    onChange={(v) => saveConfig('session.blind_count_enabled', v, 'boolean', setBlindCountEnabled)}
                />

                <div className={cn(
                    'mt-4 p-4 rounded-xl',
                    isDark ? 'bg-slate-700/30' : 'bg-amber-50'
                )}>
                    <div className="flex items-start gap-3">
                        <AlertCircle className={cn(
                            'w-5 h-5 mt-0.5',
                            isDark ? 'text-amber-400' : 'text-amber-600'
                        )} />
                        <div>
                            <p className={cn(
                                'text-sm font-medium',
                                isDark ? 'text-amber-400' : 'text-amber-700'
                            )}>
                                {t('session.blindCountInfo', 'How Blind Count Works')}
                            </p>
                            <p className={cn(
                                'text-sm mt-1',
                                isDark ? 'text-slate-400' : 'text-amber-600'
                            )}>
                                {t('session.blindCountInfoDesc',
                                    'When closing a session, cashiers input their counted cash first. ' +
                                    'The expected amount and discrepancy are revealed only after submission.'
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </SettingsCard>

            {/* Discrepancy Settings */}
            <SettingsCard
                title={t('session.discrepancy', 'Discrepancy Rules')}
                description={t('session.discrepancyDesc', 'Configure when notes are required for cash discrepancies')}
            >
                <SettingsRow
                    label={t('session.notesThreshold', 'Notes Required Threshold')}
                    description={t('session.notesThresholdDesc', 'Require explanation for discrepancies above this amount (SAR)')}
                >
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <input
                            type="number"
                            min={0}
                            step={1}
                            value={discrepancyThreshold}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setDiscrepancyThreshold(v);
                            }}
                            onBlur={() => saveConfig('session.discrepancy_notes_threshold', discrepancyThreshold, 'number', setDiscrepancyThreshold)}
                            className={cn(
                                'w-20 px-3 py-1.5 rounded-lg border text-sm text-center',
                                isDark
                                    ? 'bg-slate-700 border-slate-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-900'
                            )}
                        />
                        <span className={cn(
                            'text-sm',
                            isDark ? 'text-slate-400' : 'text-slate-500'
                        )}>
                            SAR
                        </span>
                        {saving === 'session.discrepancy_notes_threshold' && (
                            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                        )}
                    </div>
                </SettingsRow>
            </SettingsCard>

            {/* Session Management */}
            <SettingsCard
                title={t('session.management', 'Session Management')}
                description={t('session.managementDesc', 'Control session behavior and timeouts')}
            >
                <FeatureToggle
                    label={t('session.allowMultiple', 'Allow Multiple Open Sessions')}
                    description={t('session.allowMultipleDesc', 'Allow same user/device to have multiple sessions')}
                    icon={Calculator}
                    enabled={allowMultipleSessions}
                    disabled={saving === 'session.allow_multiple_open'}
                    onChange={(v) => saveConfig('session.allow_multiple_open', v, 'boolean', setAllowMultipleSessions)}
                />

                <SettingsRow
                    label={t('session.timeout', 'Session Timeout')}
                    description={t('session.timeoutDesc', 'Auto-logout inactive sessions after this many minutes (0 = disabled)')}
                >
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <input
                            type="number"
                            min={0}
                            step={30}
                            value={sessionTimeout}
                            onChange={(e) => setSessionTimeout(Number(e.target.value))}
                            onBlur={() => saveConfig('session.timeout_minutes', sessionTimeout, 'number', setSessionTimeout)}
                            className={cn(
                                'w-20 px-3 py-1.5 rounded-lg border text-sm text-center',
                                isDark
                                    ? 'bg-slate-700 border-slate-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-900'
                            )}
                        />
                        <span className={cn(
                            'text-sm',
                            isDark ? 'text-slate-400' : 'text-slate-500'
                        )}>
                            {t('session.minutes', 'minutes')}
                        </span>
                        {saving === 'session.timeout_minutes' && (
                            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                        )}
                    </div>
                </SettingsRow>
            </SettingsCard>
        </div>
    );
}

export default SessionSettingsSection;
