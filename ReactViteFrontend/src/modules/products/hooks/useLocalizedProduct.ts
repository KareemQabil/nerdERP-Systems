import { useTranslation } from 'react-i18next';
import type { Product } from '@/modules/products/hooks/useProducts';

export const useLocalizedProduct = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const getProductName = (product: Product) => {
        return isRTL && product.nameAr ? product.nameAr : product.name;
    };

    return { getProductName, isRTL };
};
