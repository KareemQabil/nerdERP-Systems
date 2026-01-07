/**
 * Theme Editor Section
 * Live color picker and theme customization
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Save, Eye } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SettingsCard, SettingsRow } from '../SettingsCard';
import { useConfigStore } from '@/modules/config/store/configStore';
import { configSocket } from '@/lib/config-socket';
import { cn } from '@/lib/utils';

const COLOR_PRESETS = [
    { name: 'Cyan (Default)', primary: '#22d3ee', secondary: '#cbd5e1' },
    { name: 'Purple', primary: '#a78bfa', secondary: '#c4b5fd' },
    { name: 'Green', primary: '#34d399', secondary: '#6ee7b7' },
    { name: 'Orange', primary: '#fb923c', secondary: '#fdba74' },
    { name: 'Pink', primary: '#f472b6', secondary: '#f9a8d4' },
];

export function ThemeEditorSection() {
    const { t } = useTranslation('settings');
    const queryClient = useQueryClient();
    const { config } = useConfigStore();
    const [themeValues, setThemeValues] = useState(config?.theme || {});

    // Save theme mutation
    const saveMutation = useMutation({
        mutationFn: async (theme: Record<string, string | number>) => {
            const storeId = config?.store.id || 'default-store-id';

            // Map theme object to configuration array
            const configurations = Object.entries(theme).map(([key, value]) => ({
                configKey: `theme.${key}`,
                configValue: value,
                configType: 'STRING',
                category: 'theme',
            }));

            // Call the store configuration API
            const response = await fetch(`/api/stores/${storeId}/configurations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configurations }),
            });

            if (!response.ok) {
                throw new Error('Failed to save theme');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['config', 'init'] });
            configSocket.emit('theme:updated');
        },
    });

    const handleColorChange = (key: string, value: string) => {
        setThemeValues((prev) => ({ ...prev, [key]: value }));
        // Live preview
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        document.documentElement.style.setProperty(cssVar, value);
    };

    const handlePresetClick = (preset: typeof COLOR_PRESETS[0]) => {
        handleColorChange('primary', preset.primary);
        handleColorChange('secondary', preset.secondary);
        setThemeValues((prev) => ({
            ...prev,
            primary: preset.primary,
            secondary: preset.secondary,
        }));
    };

    const handleSave = () => {
        saveMutation.mutate(themeValues);
    };

    return (
        <div className="space-y-6">
            <SettingsCard
                title={t('themeEditor.title', 'Theme Editor')}
                description={t('themeEditor.description', 'Customize colors and appearance')}
            >
                {/* Color Presets */}
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">
                        {t('themeEditor.presets', 'Color Presets')}
                    </h4>
                    <div className="grid grid-cols-5 gap-2">
                        {COLOR_PRESETS.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => handlePresetClick(preset)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                            >
                                <div
                                    className="w-6 h-6 rounded"
                                    style={{
                                        background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                                    }}
                                />
                                <span className="text-sm text-slate-300">{preset.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Pickers */}
                <div className="space-y-4">
                    <SettingsRow
                        label={t('themeEditor.primaryColor', 'Primary Color')}
                        description={t('themeEditor.primaryColorDesc', 'Main accent color')}
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={themeValues.primary || '#22d3ee'}
                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                            />
                            <input
                                type="text"
                                value={themeValues.primary || '#22d3ee'}
                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                className={cn(
                                    'w-24 px-3 py-2 rounded-lg border text-sm',
                                    'bg-slate-700 border-slate-600 text-white',
                                    'font-mono'
                                )}
                            />
                            <Eye className="w-4 h-4 text-slate-400" />
                        </div>
                    </SettingsRow>

                    <SettingsRow
                        label={t('themeEditor.secondaryColor', 'Secondary Color')}
                        description={t('themeEditor.secondaryColorDesc', 'Supporting accent color')}
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={themeValues.secondary || '#cbd5e1'}
                                onChange={(e) => handleColorChange('secondary', e.target.value)}
                                className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
                            />
                            <input
                                type="text"
                                value={themeValues.secondary || '#cbd5e1'}
                                onChange={(e) => handleColorChange('secondary', e.target.value)}
                                className={cn(
                                    'w-24 px-3 py-2 rounded-lg border text-sm',
                                    'bg-slate-700 border-slate-600 text-white',
                                    'font-mono'
                                )}
                            />
                        </div>
                    </SettingsRow>

                    <SettingsRow
                        label={t('themeEditor.glassOpacity', 'Glass Opacity')}
                        description={t('themeEditor.glassOpacityDesc', 'Transparency for glass effects')}
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={themeValues.glassOpacity || 0.6}
                                onChange={(e) => handleColorChange('glassOpacity', parseFloat(e.target.value))}
                                className="w-48"
                            />
                            <span className="text-sm text-slate-400">
                                {Math.round((themeValues.glassOpacity || 0.6) * 100)}%
                            </span>
                        </div>
                    </SettingsRow>

                    <SettingsRow
                        label={t('themeEditor.borderRadius', 'Border Radius')}
                        description={t('themeEditor.borderRadiusDesc', 'Corner rounding')}
                    >
                        <input
                            type="text"
                            value={themeValues.borderRadius || '1rem'}
                            onChange={(e) => handleColorChange('borderRadius', e.target.value)}
                            className={cn(
                                'w-24 px-3 py-2 rounded-lg border text-sm',
                                'bg-slate-700 border-slate-600 text-white'
                            )}
                        />
                    </SettingsRow>
                </div>

                {/* Save Button */}
                <div className="mt-6 pt-6 border-t border-slate-700">
                    <button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className={cn(
                            'flex items-center gap-2 px-6 py-3 rounded-xl',
                            'bg-gradient-to-r from-violet-600 to-purple-600',
                            'text-white font-medium',
                            'hover:shadow-lg hover:shadow-violet-500/20',
                            'transition-all',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                    >
                        <Save className="w-4 h-4" />
                        {saveMutation.isPending
                            ? t('themeEditor.saving', 'Saving...')
                            : t('themeEditor.save', 'Save Theme')
                        }
                    </button>
                </div>
            </SettingsCard>
        </div>
    );
}

export default ThemeEditorSection;
