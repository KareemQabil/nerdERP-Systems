import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/config/i18n.config';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';
type Theme = 'light' | 'dark' | 'luxury';

interface SettingsState {
    language: Language;
    direction: Direction;
    theme: Theme;

    setLanguage: (language: Language) => void;
    setTheme: (theme: Theme) => void;
    toggleLanguage: () => void;
    toggleTheme: () => void;
    initializeFromDOM: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            language: 'ar',
            direction: 'rtl',
            theme: 'dark',

            setLanguage: (language) => {
                const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

                // Update DOM
                document.documentElement.setAttribute('dir', direction);
                document.documentElement.setAttribute('lang', language);

                // Update i18n
                i18n.changeLanguage(language);

                set({ language, direction });
            },

            setTheme: (theme) => {
                document.documentElement.setAttribute('data-theme', theme);
                set({ theme });
            },

            toggleLanguage: () => {
                const newLang = get().language === 'ar' ? 'en' : 'ar';
                get().setLanguage(newLang);
            },

            toggleTheme: () => {
                const themes: Theme[] = ['light', 'dark', 'luxury'];
                const currentIndex = themes.indexOf(get().theme);
                const nextTheme = themes[(currentIndex + 1) % themes.length];
                get().setTheme(nextTheme);
            },

            initializeFromDOM: () => {
                // Apply stored settings to DOM on app load
                const { language, theme } = get();
                const direction = language === 'ar' ? 'rtl' : 'ltr';

                document.documentElement.setAttribute('dir', direction);
                document.documentElement.setAttribute('lang', language);
                document.documentElement.setAttribute('data-theme', theme);

                i18n.changeLanguage(language);
            },
        }),
        {
            name: 'nerdpos-settings',
            onRehydrateStorage: () => (state) => {
                // Initialize DOM after hydration
                state?.initializeFromDOM();
            },
        }
    )
);
