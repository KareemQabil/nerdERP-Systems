import { useEffect } from 'react';
import { useConfigStore } from '@/modules/config/store/configStore';
import { configSocket } from '@/lib/config-socket';
import type { ConfigInitResponse } from '@/modules/config/types/config.types';

interface ConfigProviderProps {
    children: React.ReactNode;
    storeId: string;
    config: ConfigInitResponse;
}

/**
 * Config Provider
 * Provides config context and manages WebSocket connections for real-time updates
 */
export function ConfigProvider({ children, storeId, config }: ConfigProviderProps) {
    const { setConfig } = useConfigStore();

    // Initialize config
    useEffect(() => {
        setConfig(config);
        applyThemeToDOM(config.theme);
    }, [config, setConfig]);

    // Setup WebSocket listeners
    useEffect(() => {
        configSocket.connect();
        configSocket.subscribe(storeId);

        const handleConfigUpdated = (data: any) => {
            // Trigger config refresh
            window.location.reload();
        };

        const handleThemeUpdated = (data: any) => {
            applyThemeToDOM(data.theme);
        };

        const handleFeatureUpdated = (data: any) => {
            // Update feature in store
            const currentConfig = useConfigStore.getState().config;
            if (currentConfig) {
                const updatedFeatures = { ...currentConfig.features };
                const keys = data.featurePath.split('.');
                let current: any = updatedFeatures;

                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) current[keys[i]] = {};
                    current = current[keys[i]];
                }

                current[keys[keys.length - 1]] = data.enabled;

                useConfigStore.getState().setConfig({
                    ...currentConfig,
                    features: updatedFeatures,
                });
            }
        };

        const handleTranslationsUpdated = (data: any) => {
            // Trigger config refresh for translations
            window.location.reload();
        };

        configSocket.on('config.updated', handleConfigUpdated);
        configSocket.on('config.theme.updated', handleThemeUpdated);
        configSocket.on('config.features.updated', handleFeatureUpdated);
        configSocket.on('config.translations.updated', handleTranslationsUpdated);

        return () => {
            configSocket.off('config.updated', handleConfigUpdated);
            configSocket.off('config.theme.updated', handleThemeUpdated);
            configSocket.off('config.features.updated', handleFeatureUpdated);
            configSocket.off('config.translations.updated', handleTranslationsUpdated);
            configSocket.disconnect();
        };
    }, [storeId]);

    return <>{children}</>;
}

/**
 * Apply theme CSS variables to DOM
 */
function applyThemeToDOM(theme: Record<string, string | number>) {
    const root = document.documentElement;

    Object.entries(theme).forEach(([key, value]) => {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value as string);
    });

    // Set theme attribute for Tailwind
    root.setAttribute('data-theme', (theme.themeMode as string) || 'dark');
}
