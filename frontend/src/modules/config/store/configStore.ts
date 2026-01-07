import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ConfigInitResponse } from '../types/config.types';

interface ConfigState {
    config: ConfigInitResponse | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setConfig: (config: ConfigInitResponse) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearConfig: () => void;

    // Feature helpers
    getFeature: (path: string) => boolean;
    getTranslation: (key: string, lang: string) => string;
    getTheme: () => Record<string, string | number>;
    getStore: () => ConfigInitResponse['store'] | null;
}

export const useConfigStore = create<ConfigState>()(
    devtools(
        persist(
            (set, get) => ({
                config: null,
                isLoading: false,
                error: null,

                setConfig: (config) => set({ config, error: null }),
                setLoading: (isLoading) => set({ isLoading }),
                setError: (error) => set({ error }),
                clearConfig: () => set({ config: null, error: null }),

                getFeature: (path: string) => {
                    const config = get().config;
                    if (!config?.features) return false;

                    const keys = path.split('.');
                    let current: any = config.features;

                    for (const key of keys) {
                        if (current?.[key] === undefined) return false;
                        current = current[key];
                    }

                    return current === true;
                },

                getTranslation: (key: string, lang: string) => {
                    const config = get().config;
                    return config?.translations?.[lang]?.[key] || key;
                },

                getTheme: () => {
                    const config = get().config;
                    return config?.theme || {};
                },

                getStore: () => {
                    const config = get().config;
                    return config?.store || null;
                },
            }),
            {
                name: 'config-storage',
                partialize: (state) => ({ config: state.config }), // Persist config
            }
        ),
        { name: 'ConfigStore' }
    )
);
