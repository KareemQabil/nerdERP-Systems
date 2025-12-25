/**
 * Payments Settings Section
 * Configure payment methods
 */
import { useTranslation } from 'react-i18next';
import { Banknote, CreditCard, Gift, Star, Wallet } from 'lucide-react';
import { SettingsCard } from '../SettingsCard';
import { FeatureToggle } from '../FeatureToggle';
import { useConfigStore } from '@/stores/config.store';
import type { PaymentMethodType } from '@/types/config.types';

const PAYMENT_METHOD_CONFIG: Record<PaymentMethodType, { icon: typeof Banknote; labelKey: string; descKey: string }> = {
    CASH: {
        icon: Banknote,
        labelKey: 'payments.cash',
        descKey: 'payments.cashDesc',
    },
    CARD: {
        icon: CreditCard,
        labelKey: 'payments.card',
        descKey: 'payments.cardDesc',
    },
    GIFT_CARD: {
        icon: Gift,
        labelKey: 'payments.giftCard',
        descKey: 'payments.giftCardDesc',
    },
    LOYALTY_POINTS: {
        icon: Star,
        labelKey: 'payments.loyaltyPoints',
        descKey: 'payments.loyaltyPointsDesc',
    },
    STORE_CREDIT: {
        icon: Wallet,
        labelKey: 'payments.storeCredit',
        descKey: 'payments.storeCreditDesc',
    },
};

export function PaymentsSection() {
    const { t } = useTranslation('settings');
    const { posConfig, setPOSConfig, features } = useConfigStore();

    const togglePaymentMethod = (method: PaymentMethodType) => {
        const current = posConfig.enabledPaymentMethods;
        const newMethods = current.includes(method)
            ? current.filter((m) => m !== method)
            : [...current, method];
        setPOSConfig({ enabledPaymentMethods: newMethods });
    };

    // Some payment methods depend on features
    const isMethodAvailable = (method: PaymentMethodType): boolean => {
        switch (method) {
            case 'GIFT_CARD':
                return features.customers.giftCards;
            case 'LOYALTY_POINTS':
                return features.customers.loyaltyProgram;
            case 'STORE_CREDIT':
                return features.customers.storeCredit;
            default:
                return true;
        }
    };

    return (
        <div className="space-y-6">
            <SettingsCard
                title={t('payments.title', 'Payment Methods')}
                description={t('payments.description', 'Configure which payment methods are accepted')}
            >
                {(Object.keys(PAYMENT_METHOD_CONFIG) as PaymentMethodType[]).map((method) => {
                    const config = PAYMENT_METHOD_CONFIG[method];
                    const isEnabled = posConfig.enabledPaymentMethods.includes(method);
                    const isAvailable = isMethodAvailable(method);

                    return (
                        <FeatureToggle
                            key={method}
                            label={t(config.labelKey, method)}
                            description={
                                !isAvailable
                                    ? t('payments.featureRequired', 'Enable related feature first')
                                    : t(config.descKey, '')
                            }
                            icon={config.icon}
                            enabled={isEnabled}
                            onChange={() => togglePaymentMethod(method)}
                            disabled={!isAvailable}
                        />
                    );
                })}
            </SettingsCard>
        </div>
    );
}

export default PaymentsSection;
