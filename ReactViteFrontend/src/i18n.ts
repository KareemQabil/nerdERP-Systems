import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: {
                    "Loading products...": "Loading products...",
                    "Error loading products.": "Error loading products.",
                    "Price": "Price",
                    "SAR": "SAR",
                    "No Image": "No Image",
                    "Out of Stock": "Out of Stock",
                    "Product Added": "Product Added",
                    "Added to cart": "{{name}} added to cart"
                }
            },
            ar: {
                translation: {
                    "Loading products...": "جاري تحميل المنتجات...",
                    "Error loading products.": "خطأ في تحميل المنتجات.",
                    "Price": "السعر",
                    "SAR": "ر.س",
                    "No Image": "لا توجد صورة",
                    "Out of Stock": "نفذت الكمية",
                    "Product Added": "تمت الإضافة",
                    "Added to cart": "تمت إضافة {{name}} للسلة"
                }
            }
        },
        lng: "ar", // Default to Arabic
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
