/**
 * Features Settings Section
 * Toggle feature flags for the POS system
 */
import { useTranslation } from 'react-i18next';
import {
    Utensils,
    Package,
    Truck,
    Car,
    PauseCircle,
    GitMerge,
    Split,
    ArrowRightLeft,
    CreditCard,
    Percent,
    Gift,
    ChefHat,
    ListOrdered,
    Zap,
    Users,
    UserPlus,
    Star,
    Wallet,
    Calendar,
    MessageSquare,
    BarChart3,
    Clock,
    Printer as PrinterIcon,
    Scale,
    FileCheck,
    Shield,
} from 'lucide-react';
import { SettingsCard } from '../SettingsCard';
import { FeatureToggle, FeatureGroup } from '../FeatureToggle';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectFeatures, setFeature } from '@/features/pos/slices/configSlice';

export function FeaturesSection() {
    const { t } = useTranslation('settings');
    const dispatch = useAppDispatch();
    const features = useAppSelector(selectFeatures);

    return (
        <div className="space-y-6">
            {/* POS Features */}
            <SettingsCard
                title={t('features.posFeatures', 'POS Features')}
                description={t('features.posFeaturesDesc', 'Configure point of sale functionality')}
            >
                <FeatureGroup title={t('features.orderTypes', 'Order Types')}>
                    <FeatureToggle
                        label={t('features.dineIn', 'Dine-In')}
                        description={t('features.dineInDesc', 'Enable table service for in-house dining')}
                        icon={Utensils}
                        enabled={features.pos.dineIn}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.dineIn', enabled: v }))}
                    />
                    <FeatureToggle
                        label={t('features.takeaway', 'Takeaway')}
                        description={t('features.takeawayDesc', 'Allow customers to order for pickup')}
                        icon={Package}
                        enabled={features.pos.takeaway}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.takeaway', enabled: v }))}
                    />
                    <FeatureToggle
                        label={t('features.delivery', 'Delivery')}
                        description={t('features.deliveryDesc', 'Enable delivery order management')}
                        icon={Truck}
                        enabled={features.pos.delivery}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.delivery', enabled: v }))}
                    />
                    <FeatureToggle
                        label={t('features.driveThru', 'Drive-Thru')}
                        description={t('features.driveThruDesc', 'Support drive-through orders')}
                        icon={Car}
                        enabled={features.pos.driveThru}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.driveThru', enabled: v }))}
                    />
                </FeatureGroup>

                <FeatureGroup title={t('features.orderManagement', 'Order Management')}>
                    <FeatureToggle
                        label={t('features.holdOrders', 'Hold Orders')}
                        description={t('features.holdOrdersDesc', 'Park orders for later completion')}
                        icon={PauseCircle}
                        enabled={features.pos.holdOrders}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.holdOrders', enabled: v }))}
                    />
                    <FeatureToggle
                        label={t('features.mergeOrders', 'Merge Orders')}
                        description={t('features.mergeOrdersDesc', 'Combine multiple orders into one')}
                        icon={GitMerge}
                        enabled={features.pos.mergeOrders}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.mergeOrders', enabled: v }))}
                    />
                    <FeatureToggle
                        label={t('features.splitOrders', 'Split Orders')}
                        description={t('features.splitOrdersDesc', 'Divide orders for separate payments')}
                        icon={Split}
                        enabled={features.pos.splitOrders}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.splitOrders', enabled: v }))}
                    />
                    <FeatureToggle
                        label={t('features.transferOrders', 'Transfer Orders')}
                        description={t('features.transferOrdersDesc', 'Move orders between tables or staff')}
                        icon={ArrowRightLeft}
                        enabled={features.pos.transferOrders}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.transferOrders', enabled: v }))}
                    />
                </FeatureGroup>

                <FeatureGroup title={t('features.payments', 'Payments')}>
                    <FeatureToggle
                        label={t('features.splitPayments', 'Split Payments')}
                        description={t('features.splitPaymentsDesc', 'Accept multiple payment methods per order')}
                        icon={CreditCard}
                        enabled={features.pos.splitPayments}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.splitPayments', enabled: v }))}
                    />
                    <FeatureToggle
                        label={t('features.partialPayments', 'Partial Payments')}
                        description={t('features.partialPaymentsDesc', 'Allow deposits and layaway')}
                        icon={Percent}
                        enabled={features.pos.partialPayments}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.partialPayments', enabled: v }))}
                    />
                    <FeatureToggle
                        label={t('features.tipCollection', 'Tip Collection')}
                        description={t('features.tipCollectionDesc', 'Collect tips from customers')}
                        icon={Gift}
                        enabled={features.pos.tipCollection}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.tipCollection', enabled: v }))}
                    />
                </FeatureGroup>

                <FeatureGroup title={t('features.kitchen', 'Kitchen')}>
                    <FeatureToggle
                        label={t('features.kitchenRouting', 'Kitchen Routing')}
                        description={t('features.kitchenRoutingDesc', 'Send orders to kitchen display')}
                        icon={ChefHat}
                        enabled={features.pos.kitchenRouting}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.kitchenRouting', enabled: v }))}
                    />
                    <FeatureToggle
                        label={t('features.courseManagement', 'Course Management')}
                        description={t('features.courseManagementDesc', 'Control course timing')}
                        icon={ListOrdered}
                        enabled={features.pos.courseManagement}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.courseManagement', enabled: v }))}
                    />
                    <FeatureToggle
                        label={t('features.rushOrders', 'Rush Orders')}
                        description={t('features.rushOrdersDesc', 'Priority flagging for urgent orders')}
                        icon={Zap}
                        enabled={features.pos.rushOrders}
                        onChange={(v) => dispatch(setFeature({ path: 'pos.rushOrders', enabled: v }))}
                    />
                </FeatureGroup>
            </SettingsCard>

            {/* Customer Features */}
            <SettingsCard
                title={t('features.customerFeatures', 'Customer Features')}
                description={t('features.customerFeaturesDesc', 'CRM and loyalty functionality')}
            >
                <FeatureToggle
                    label={t('features.customerSearch', 'Customer Search')}
                    description={t('features.customerSearchDesc', 'Look up and attach customers to orders')}
                    icon={Users}
                    enabled={features.customers.search}
                    onChange={(v) => dispatch(setFeature({ path: 'customers.search', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.quickCreate', 'Quick Create')}
                    description={t('features.quickCreateDesc', 'Create customers from POS screen')}
                    icon={UserPlus}
                    enabled={features.customers.quickCreate}
                    onChange={(v) => dispatch(setFeature({ path: 'customers.quickCreate', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.loyaltyProgram', 'Loyalty Program')}
                    description={t('features.loyaltyProgramDesc', 'Points earning and redemption')}
                    icon={Star}
                    enabled={features.customers.loyaltyProgram}
                    onChange={(v) => dispatch(setFeature({ path: 'customers.loyaltyProgram', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.storeCredit', 'Store Credit')}
                    description={t('features.storeCreditDesc', 'Customer balance accounts')}
                    icon={Wallet}
                    enabled={features.customers.storeCredit}
                    onChange={(v) => dispatch(setFeature({ path: 'customers.storeCredit', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.giftCards', 'Gift Cards')}
                    description={t('features.giftCardsDesc', 'Sell and redeem gift cards')}
                    icon={Gift}
                    enabled={features.customers.giftCards}
                    onChange={(v) => dispatch(setFeature({ path: 'customers.giftCards', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.reservations', 'Reservations')}
                    description={t('features.reservationsDesc', 'Table booking management')}
                    icon={Calendar}
                    enabled={features.customers.reservations}
                    onChange={(v) => dispatch(setFeature({ path: 'customers.reservations', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.feedback', 'Feedback')}
                    description={t('features.feedbackDesc', 'Collect customer reviews')}
                    icon={MessageSquare}
                    enabled={features.customers.feedback}
                    onChange={(v) => dispatch(setFeature({ path: 'customers.feedback', enabled: v }))}
                />
            </SettingsCard>

            {/* Inventory Features */}
            <SettingsCard
                title={t('features.inventoryFeatures', 'Inventory Features')}
                description={t('features.inventoryFeaturesDesc', 'Stock management options')}
            >
                <FeatureToggle
                    label={t('features.stockTracking', 'Stock Tracking')}
                    description={t('features.stockTrackingDesc', 'Track inventory levels')}
                    icon={BarChart3}
                    enabled={features.inventory.stockTracking}
                    onChange={(v) => dispatch(setFeature({ path: 'inventory.stockTracking', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.batchTracking', 'Batch Tracking')}
                    description={t('features.batchTrackingDesc', 'Track inventory by batch/lot')}
                    icon={Package}
                    enabled={features.inventory.batchTracking}
                    onChange={(v) => dispatch(setFeature({ path: 'inventory.batchTracking', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.expiryTracking', 'Expiry Tracking')}
                    description={t('features.expiryTrackingDesc', 'Monitor product expiration dates')}
                    icon={Clock}
                    enabled={features.inventory.expiryTracking}
                    onChange={(v) => dispatch(setFeature({ path: 'inventory.expiryTracking', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.lowStockAlerts', 'Low Stock Alerts')}
                    description={t('features.lowStockAlertsDesc', 'Notify when stock is low')}
                    icon={BarChart3}
                    enabled={features.inventory.lowStockAlerts}
                    onChange={(v) => dispatch(setFeature({ path: 'inventory.lowStockAlerts', enabled: v }))}
                />
            </SettingsCard>

            {/* Security Features */}
            <SettingsCard
                title={t('features.securityFeatures', 'Security & Compliance')}
                description={t('features.securityFeaturesDesc', 'Authorization and audit settings')}
            >
                <FeatureToggle
                    label={t('features.managerPin', 'Manager PIN')}
                    description={t('features.managerPinDesc', 'Require PIN for sensitive actions')}
                    icon={Shield}
                    enabled={features.security.managerPin}
                    onChange={(v) => dispatch(setFeature({ path: 'security.managerPin', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.shiftManagement', 'Shift Management')}
                    description={t('features.shiftManagementDesc', 'Clock in/out and shift reporting')}
                    icon={Clock}
                    enabled={features.security.shiftManagement}
                    onChange={(v) => dispatch(setFeature({ path: 'security.shiftManagement', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.zatcaCompliance', 'ZATCA Compliance')}
                    description={t('features.zatcaComplianceDesc', 'Saudi e-invoicing compliance')}
                    icon={FileCheck}
                    enabled={features.security.zatcaCompliance}
                    onChange={(v) => dispatch(setFeature({ path: 'security.zatcaCompliance', enabled: v }))}
                />
            </SettingsCard>

            {/* Integrations */}
            <SettingsCard
                title={t('features.integrations', 'Integrations')}
                description={t('features.integrationsDesc', 'External connections and hardware')}
            >
                <FeatureToggle
                    label={t('features.printers', 'Printers')}
                    description={t('features.printersDesc', 'Connect receipt and kitchen printers')}
                    icon={PrinterIcon}
                    enabled={features.integrations.printers}
                    onChange={(v) => dispatch(setFeature({ path: 'integrations.printers', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.scales', 'Scales')}
                    description={t('features.scalesDesc', 'Connect weighing scales')}
                    icon={Scale}
                    enabled={features.integrations.scales}
                    onChange={(v) => dispatch(setFeature({ path: 'integrations.scales', enabled: v }))}
                />
                <FeatureToggle
                    label={t('features.paymentTerminals', 'Payment Terminals')}
                    description={t('features.paymentTerminalsDesc', 'Connect card payment terminals')}
                    icon={CreditCard}
                    enabled={features.integrations.paymentTerminals}
                    onChange={(v) => dispatch(setFeature({ path: 'integrations.paymentTerminals', enabled: v }))}
                />
            </SettingsCard>
        </div>
    );
}

export default FeaturesSection;
