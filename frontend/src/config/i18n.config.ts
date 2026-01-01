/**
 * i18n Configuration
 * Feature-based translations loaded statically for better performance
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Common translations
import commonEn from "@/i18n/locales/en";
import commonAr from "@/i18n/locales/ar";

// Feature translations
import authEn from "@/features/auth/locales/en";
import authAr from "@/features/auth/locales/ar";
import posEn from "@/features/pos/locales/en";
import posAr from "@/features/pos/locales/ar";
import settingsEn from "@/features/settings/locales/en";
import settingsAr from "@/features/settings/locales/ar";
import customersEn from "@/features/customers/locales/en";
import customersAr from "@/features/customers/locales/ar";

/**
 * Translation resources organized by language and namespace
 */
const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    pos: posEn,
    settings: settingsEn,
    customers: customersEn,
  },
  ar: {
    common: commonAr,
    auth: authAr,
    pos: posAr,
    settings: settingsAr,
    customers: customersAr,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: "ar",
    supportedLngs: ["ar", "en"],
    defaultNS: "common",
    ns: ["common", "auth", "pos", "settings", "customers"],

    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "nerdpos-language",
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
