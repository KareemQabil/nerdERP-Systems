import { Injectable, Logger } from '@nestjs/common';
import { StoreConfigurationService } from '../../organization/services/store-configuration.service';
import { StoreService } from '../../organization/services/store.service';
import { ConfigInitResponse, ThemeConfigResponse, FeatureFlagsResponse, TaxConfigResponse } from '../dto/config-init.dto';
import { Translation } from '../../translations/entities/translation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or } from 'typeorm';
import { SupportedLanguage } from '../../translations/entities/translation.entity';

/**
 * Config Init Service
 * Aggregates all configuration into a single endpoint for fast app initialization
 * Public endpoint (no auth) for quick app loading
 */
@Injectable()
export class ConfigInitService {
    private readonly logger = new Logger(ConfigInitService.name);

    constructor(
        private readonly storeConfigService: StoreConfigurationService,
        private readonly storeService: StoreService,
        @InjectRepository(Translation)
        private readonly translationRepo: Repository<Translation>,
        @InjectRepository(SupportedLanguage)
        private readonly languageRepo: Repository<SupportedLanguage>,
    ) {}

    /**
     * Get complete initialization config for a store
     * Returns: theme, translations, features, taxes, store info
     */
    async getStoreInitConfig(storeId: string, languageCode: string = 'ar'): Promise<ConfigInitResponse> {
        this.logger.debug(`Fetching init config for store ${storeId}, lang ${languageCode}`);

        // Parallel fetch for performance
        const [store, configurations, translations, supportedLanguages] = await Promise.all([
            this.storeService.findById(storeId),
            this.storeConfigService.getAllConfigs(storeId),
            this.getAllTranslationsForStore(storeId),
            this.getSupportedLanguages(),
        ]);

        // Extract and build config sections
        const theme = this.extractThemeConfig(configurations);
        const translationsMap = this.buildTranslationsMap(translations);
        const features = this.extractFeatureFlags(configurations);
        const taxes = this.extractTaxConfig(configurations);
        const pos = await this.storeConfigService.getPOSConfig(storeId);

        return {
            store: {
                id: store.id,
                name: store.translations?.[languageCode]?.name || store.storeCode,
                currency: this.getCurrencyFromConfig(configurations) || 'SAR',
                timezone: store.timezone || 'Asia/Riyadh',
            },
            theme,
            translations: translationsMap,
            features,
            taxes,
            pos,
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get all translations for a store (both global and store-specific)
     */
    private async getAllTranslationsForStore(storeId: string): Promise<Translation[]> {
        const supportedLangs = await this.getSupportedLanguages();

        const translations = await Promise.all(
            supportedLangs
                .filter(l => l.isActive)
                .map(lang =>
                    this.translationRepo.find({
                        where: [
                            { languageCode: lang.languageCode, storeId: null as any },
                            { languageCode: lang.languageCode, storeId },
                        ],
                    }),
                ),
        );

        return translations.flat();
    }

    /**
     * Get all active supported languages
     */
    private async getSupportedLanguages(): Promise<SupportedLanguage[]> {
        return await this.languageRepo.find({
            where: { isActive: true },
            order: { displayOrder: 'ASC' },
        });
    }

    /**
     * Extract theme configuration from store configurations
     */
    private extractThemeConfig(configs: any[]): ThemeConfigResponse {
        const themeMap = new Map(
            configs.filter(c => c.category === 'theme').map(c => [c.configKey, c.configValue])
        );

        return {
            primary: themeMap.get('theme.primary') || '#22d3ee',
            secondary: themeMap.get('theme.secondary') || '#cbd5e1',
            glassOpacity: themeMap.get('theme.glass_opacity') || 0.6,
            borderRadius: themeMap.get('theme.border_radius') || '1rem',
            fontFamily: themeMap.get('theme.font_family') || 'Almarai',
            themeMode: themeMap.get('theme.theme_mode') || 'dark',
        };
    }

    /**
     * Build translations map grouped by language
     */
    private buildTranslationsMap(translations: Translation[]): Record<string, Record<string, string>> {
        const map: Record<string, Record<string, string>> = {};

        // Group by language code, with store overrides taking precedence
        translations.forEach(t => {
            if (!map[t.languageCode]) {
                map[t.languageCode] = {};
            }

            // Only add if not already present (store-specific overrides global)
            if (!map[t.languageCode][t.translationKey]) {
                map[t.languageCode][t.translationKey] = t.translationValue;
            }
        });

        return map;
    }

    /**
     * Extract feature flags from store configurations
     */
    private extractFeatureFlags(configs: any[]): FeatureFlagsResponse {
        const featureMap = new Map(
            configs.filter(c => c.category === 'features').map(c => [c.configKey, c.configValue])
        );

        return {
            modules: {
                pos: this.getBooleanFeature(featureMap, 'features.modules.pos', true),
                inventory: this.getBooleanFeature(featureMap, 'features.modules.inventory', true),
                kitchen: this.getBooleanFeature(featureMap, 'features.modules.kitchen', false),
                customers: this.getBooleanFeature(featureMap, 'features.modules.customers', true),
                reports: this.getBooleanFeature(featureMap, 'features.modules.reports', true),
                settings: this.getBooleanFeature(featureMap, 'features.modules.settings', true),
            },
            pos: {
                dineIn: this.getBooleanFeature(featureMap, 'features.pos.dine_in', true),
                takeaway: this.getBooleanFeature(featureMap, 'features.pos.takeaway', true),
                delivery: this.getBooleanFeature(featureMap, 'features.pos.delivery', false),
                pickup: this.getBooleanFeature(featureMap, 'features.pos.pickup', false),
                driveThru: this.getBooleanFeature(featureMap, 'features.pos.drive_thru', false),
                holdOrders: this.getBooleanFeature(featureMap, 'features.pos.hold_orders', true),
                mergeOrders: this.getBooleanFeature(featureMap, 'features.pos.merge_orders', false),
                splitOrders: this.getBooleanFeature(featureMap, 'features.pos.split_orders', false),
                transferOrders: this.getBooleanFeature(featureMap, 'features.pos.transfer_orders', false),
                splitPayments: this.getBooleanFeature(featureMap, 'features.pos.split_payments', true),
                partialPayments: this.getBooleanFeature(featureMap, 'features.pos.partial_payments', false),
                tipCollection: this.getBooleanFeature(featureMap, 'features.pos.tip_collection', false),
                kitchenRouting: this.getBooleanFeature(featureMap, 'features.pos.kitchen_routing', false),
                courseManagement: this.getBooleanFeature(featureMap, 'features.pos.course_management', false),
                rushOrders: this.getBooleanFeature(featureMap, 'features.pos.rush_orders', false),
                tableSideOrdering: this.getBooleanFeature(featureMap, 'features.pos.table_side_ordering', false),
                customerDisplay: this.getBooleanFeature(featureMap, 'features.pos.customer_display', false),
                qrOrdering: this.getBooleanFeature(featureMap, 'features.pos.qr_ordering', false),
            },
            customers: {
                search: this.getBooleanFeature(featureMap, 'features.customers.search', true),
                quickCreate: this.getBooleanFeature(featureMap, 'features.customers.quick_create', true),
                loyaltyProgram: this.getBooleanFeature(featureMap, 'features.customers.loyalty_program', false),
                storeCredit: this.getBooleanFeature(featureMap, 'features.customers.store_credit', false),
                giftCards: this.getBooleanFeature(featureMap, 'features.customers.gift_cards', false),
                reservations: this.getBooleanFeature(featureMap, 'features.customers.reservations', false),
                feedback: this.getBooleanFeature(featureMap, 'features.customers.feedback', false),
            },
            inventory: {
                stockTracking: this.getBooleanFeature(featureMap, 'features.inventory.stock_tracking', true),
                batchTracking: this.getBooleanFeature(featureMap, 'features.inventory.batch_tracking', false),
                expiryTracking: this.getBooleanFeature(featureMap, 'features.inventory.expiry_tracking', false),
                lowStockAlerts: this.getBooleanFeature(featureMap, 'features.inventory.low_stock_alerts', true),
                autoReorder: this.getBooleanFeature(featureMap, 'features.inventory.auto_reorder', false),
                recipeManagement: this.getBooleanFeature(featureMap, 'features.inventory.recipe_management', false),
                wastageTracking: this.getBooleanFeature(featureMap, 'features.inventory.wastage_tracking', false),
            },
            security: {
                managerPin: this.getBooleanFeature(featureMap, 'features.security.manager_pin', true),
                shiftManagement: this.getBooleanFeature(featureMap, 'features.security.shift_management', true),
                cashDrawerControl: this.getBooleanFeature(featureMap, 'features.security.cash_drawer_control', false),
                blindCloseout: this.getBooleanFeature(featureMap, 'features.security.blind_closeout', false),
                zatcaCompliance: this.getBooleanFeature(featureMap, 'features.security.zatca_compliance', true),
                auditTrail: this.getBooleanFeature(featureMap, 'features.security.audit_trail', true),
            },
            integrations: {
                onlineOrdering: this.getBooleanFeature(featureMap, 'features.integrations.online_ordering', false),
                deliveryPartners: this.getBooleanFeature(featureMap, 'features.integrations.delivery_partners', false),
                accounting: this.getBooleanFeature(featureMap, 'features.integrations.accounting', false),
                paymentTerminals: this.getBooleanFeature(featureMap, 'features.integrations.payment_terminals', false),
                printers: this.getBooleanFeature(featureMap, 'features.integrations.printers', true),
                scales: this.getBooleanFeature(featureMap, 'features.integrations.scales', false),
            },
        };
    }

    /**
     * Extract tax configuration from store configurations
     */
    private extractTaxConfig(configs: any[]): TaxConfigResponse {
        const taxMap = new Map(
            configs.filter(c => c.category === 'taxes').map(c => [c.configKey, c.configValue])
        );

        return {
            vatRate: taxMap.get('taxes.vat_rate') ?? 0.15,
            vatIncluded: taxMap.get('taxes.vat_included') ?? true,
            serviceChargeRate: taxMap.get('taxes.service_charge_rate') ?? 0,
        };
    }

    /**
     * Get currency from configurations
     */
    private getCurrencyFromConfig(configs: any[]): string {
        const posConfig = configs.find(c => c.configKey === 'pos.currency_code');
        return posConfig?.configValue || 'SAR';
    }

    /**
     * Helper to get boolean feature value with fallback
     */
    private getBooleanFeature(featureMap: Map<string, any>, key: string, defaultValue: boolean): boolean {
        const value = featureMap.get(key);

        // Handle { enabled: true } format
        if (typeof value === 'object' && value !== null && 'enabled' in value) {
            return value.enabled;
        }

        return value ?? defaultValue;
    }
}
