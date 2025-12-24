import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
    // Load translations from /public/locales
    .use(HttpBackend)
    // Detect user language
    .use(LanguageDetector)
    // Pass the i18n instance to react-i18next
    .use(initReactI18next)
    // Initialize i18next
    .init({
        fallbackLng: 'ar',
        supportedLngs: ['ar', 'en'],
        defaultNS: 'common',
        ns: ['common', 'pos', 'orders', 'customers', 'inventory', 'settings'],

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'nerdpos-language',
        },

        interpolation: {
            escapeValue: false, // React already escapes values
        },

        react: {
            useSuspense: true,
        },
    });

export default i18n;
