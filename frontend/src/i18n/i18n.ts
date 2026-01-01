import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Common translations
import commonEn from "./locales/en";
import commonAr from "./locales/ar";

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
 * i18next configuration
 * Feature-based translations with automatic language detection
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
  .use(LanguageDetector)
  .use(initReactI18next)
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
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
