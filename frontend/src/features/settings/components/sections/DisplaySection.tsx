/**
 * Display Settings Section
 * Theme, language, and display preferences
 */
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Sparkles, Globe, LayoutGrid, Package, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { SettingsCard, SettingsRow } from '../SettingsCard';
import { FeatureToggle } from '../FeatureToggle';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectSettings, setTheme, setLanguage } from '@/features/settings/slices/settingsSlice';
import { selectPOSConfig, setPOSConfig } from '@/features/pos/slices/configSlice';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'luxury';

const THEME_CONFIG: Record<Theme, { icon: typeof Sun; labelKey: string; color: string }> = {
    light: { icon: Sun, labelKey: 'display.light', color: 'bg-amber-100 text-amber-600' },
    dark: { icon: Moon, labelKey: 'display.dark', color: 'bg-slate-700 text-slate-300' },
    luxury: { icon: Sparkles, labelKey: 'display.luxury', color: 'bg-purple-900 text-purple-300' },
};

export function DisplaySection() {
    const { t } = useTranslation('settings');
    const dispatch = useAppDispatch();
    const { theme, language } = useAppSelector(selectSettings);
    const posConfig = useAppSelector(selectPOSConfig);
    const isDark = theme === 'dark' || theme === 'luxury';

    return (
        <div className="space-y-6">
            {/* Theme */}
            <SettingsCard
                title={t('display.theme', 'Theme')}
                description={t('display.themeDesc', 'Choose your preferred color scheme')}
            >
                <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(THEME_CONFIG) as Theme[]).map((themeOption) => {
                        const config = THEME_CONFIG[themeOption];
                        const Icon = config.icon;
                        const isSelected = theme === themeOption;

                        return (
                            <button
                                key={themeOption}
                                onClick={() => dispatch(setTheme(themeOption))}
                                className={cn(
                                    'relative p-4 rounded-xl border-2 transition-all',
                                    isSelected
                                        ? 'border-violet-500 ring-2 ring-violet-500/20'
                                        : isDark
                                            ? 'border-slate-700 hover:border-slate-600'
                                            : 'border-slate-200 hover:border-slate-300'
                                )}
                            >
                                <div
                                    className={cn(
                                        'w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2',
                                        config.color
                                    )}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>
                                <p
                                    className={cn(
                                        'text-sm font-medium text-center',
                                        isDark ? 'text-slate-200' : 'text-slate-700'
                                    )}
                                >
                                    {t(config.labelKey, themeOption)}
                                </p>
                                {isSelected && (
                                    <motion.div
                                        layoutId="theme-indicator"
                                        className="absolute top-2 end-2 w-2 h-2 bg-violet-500 rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </SettingsCard>

            {/* Language */}
            <SettingsCard
                title={t('display.language', 'Language')}
                description={t('display.languageDesc', 'Choose your preferred language')}
            >
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => dispatch(setLanguage('en'))}
                        className={cn(
                            'p-4 rounded-xl border-2 transition-all flex items-center gap-3',
                            language === 'en'
                                ? 'border-violet-500 ring-2 ring-violet-500/20'
                                : isDark
                                    ? 'border-slate-700 hover:border-slate-600'
                                    : 'border-slate-200 hover:border-slate-300'
                        )}
                    >
                        <div
                            className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center',
                                isDark ? 'bg-slate-700' : 'bg-slate-100'
                            )}
                        >
                            <Globe className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-start">
                            <p
                                className={cn(
                                    'font-medium',
                                    isDark ? 'text-white' : 'text-slate-900'
                                )}
                            >
                                English
                            </p>
                            <p className="text-xs text-slate-500">Left-to-Right</p>
                        </div>
                    </button>

                    <button
                        onClick={() => dispatch(setLanguage('ar'))}
                        className={cn(
                            'p-4 rounded-xl border-2 transition-all flex items-center gap-3',
                            language === 'ar'
                                ? 'border-violet-500 ring-2 ring-violet-500/20'
                                : isDark
                                    ? 'border-slate-700 hover:border-slate-600'
                                    : 'border-slate-200 hover:border-slate-300'
                        )}
                    >
                        <div
                            className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center',
                                isDark ? 'bg-slate-700' : 'bg-slate-100'
                            )}
                        >
                            <Globe className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-start">
                            <p
                                className={cn(
                                    'font-medium',
                                    isDark ? 'text-white' : 'text-slate-900'
                                )}
                            >
                                العربية
                            </p>
                            <p className="text-xs text-slate-500">Right-to-Left</p>
                        </div>
                    </button>
                </div>
            </SettingsCard>

            {/* Display Options */}
            <SettingsCard
                title={t('display.options', 'Display Options')}
                description={t('display.optionsDesc', 'Customize the POS display')}
            >
                <FeatureToggle
                    label={t('display.compactMode', 'Compact Cart Mode')}
                    description={t('display.compactModeDesc', 'Smaller cart items for more visibility')}
                    icon={LayoutGrid}
                    enabled={posConfig.compactCartMode}
                    onChange={(v) => dispatch(setPOSConfig({ compactCartMode: v }))}
                />

                <FeatureToggle
                    label={t('display.showStock', 'Show Stock Levels')}
                    description={t('display.showStockDesc', 'Display remaining stock on products')}
                    icon={Package}
                    enabled={posConfig.showStockLevels}
                    onChange={(v) => dispatch(setPOSConfig({ showStockLevels: v }))}
                />

                <SettingsRow
                    label={t('display.lowStockThreshold', 'Low Stock Warning')}
                    description={t('display.lowStockThresholdDesc', 'Show warning when stock falls below')}
                >
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <input
                            type="number"
                            value={posConfig.lowStockThreshold}
                            onChange={(e) => dispatch(setPOSConfig({ lowStockThreshold: Number(e.target.value) }))}
                            min={0}
                            max={100}
                            className={cn(
                                'w-20 px-3 py-1.5 rounded-lg border text-sm text-center',
                                isDark
                                    ? 'bg-slate-700 border-slate-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-900'
                            )}
                        />
                        <span className="text-slate-500">{t('display.units', 'units')}</span>
                    </div>
                </SettingsRow>
            </SettingsCard>
        </div>
    );
}

export default DisplaySection;
