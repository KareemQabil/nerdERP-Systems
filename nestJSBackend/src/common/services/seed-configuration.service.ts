import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreConfiguration, ConfigType } from '../../modules/organization/entities/store-configuration.entity';
import { Store } from '../../modules/organization/entities/store.entity';
import { Translation } from '../../modules/translations/entities/translation.entity';
import { SupportedLanguage } from '../../modules/translations/entities/translation.entity';

interface DefaultConfig {
    key: string;
    value: any;
    type: ConfigType;
    category: string;
    description: string;
}

/**
 * Default Configuration Seeder
 * Seeds default business rule configurations for all stores
 */
@Injectable()
export class SeedConfigurationService {
    private readonly logger = new Logger(SeedConfigurationService.name);

    // Default configurations organized by category
    private readonly defaultConfigs: DefaultConfig[] = [
        // =======================================================================
        // THEME SETTINGS
        // =======================================================================
        {
            key: 'theme.primary',
            value: '#22d3ee',
            type: ConfigType.STRING,
            category: 'theme',
            description: 'Primary accent color',
        },
        {
            key: 'theme.secondary',
            value: '#cbd5e1',
            type: ConfigType.STRING,
            category: 'theme',
            description: 'Secondary accent color',
        },
        {
            key: 'theme.glass_opacity',
            value: 0.6,
            type: ConfigType.NUMBER,
            category: 'theme',
            description: 'Glass effect transparency (0-1)',
        },
        {
            key: 'theme.border_radius',
            value: '1rem',
            type: ConfigType.STRING,
            category: 'theme',
            description: 'Border radius for rounded corners',
        },
        {
            key: 'theme.font_family',
            value: 'Almarai',
            type: ConfigType.STRING,
            category: 'theme',
            description: 'Primary font family',
        },
        {
            key: 'theme.theme_mode',
            value: 'dark',
            type: ConfigType.STRING,
            category: 'theme',
            description: 'Theme mode (light, dark, luxury)',
        },

        // =======================================================================
        // FEATURE FLAGS - MODULES
        // =======================================================================
        {
            key: 'features.modules.pos',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable POS module',
        },
        {
            key: 'features.modules.inventory',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable Inventory module',
        },
        {
            key: 'features.modules.kitchen',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable Kitchen Display System',
        },
        {
            key: 'features.modules.customers',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable Customers module',
        },
        {
            key: 'features.modules.reports',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable Reports module',
        },
        {
            key: 'features.modules.settings',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable Settings module',
        },

        // =======================================================================
        // FEATURE FLAGS - POS
        // =======================================================================
        {
            key: 'features.pos.dine_in',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable dine-in orders',
        },
        {
            key: 'features.pos.takeaway',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable takeaway orders',
        },
        {
            key: 'features.pos.delivery',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable delivery orders',
        },
        {
            key: 'features.pos.pickup',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable pickup orders',
        },
        {
            key: 'features.pos.drive_thru',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable drive-thru orders',
        },
        {
            key: 'features.pos.hold_orders',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable order hold feature',
        },
        {
            key: 'features.pos.merge_orders',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable order merge feature',
        },
        {
            key: 'features.pos.split_orders',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable order split feature',
        },
        {
            key: 'features.pos.transfer_orders',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable order transfer feature',
        },
        {
            key: 'features.pos.split_payments',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable split payments',
        },
        {
            key: 'features.pos.partial_payments',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable partial payments',
        },
        {
            key: 'features.pos.tip_collection',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable tip collection',
        },
        {
            key: 'features.pos.kitchen_routing',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable kitchen routing',
        },
        {
            key: 'features.pos.course_management',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable course management',
        },
        {
            key: 'features.pos.rush_orders',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable rush orders',
        },
        {
            key: 'features.pos.table_side_ordering',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable table-side ordering',
        },
        {
            key: 'features.pos.customer_display',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable customer display',
        },
        {
            key: 'features.pos.qr_ordering',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable QR code ordering',
        },

        // =======================================================================
        // FEATURE FLAGS - CUSTOMERS
        // =======================================================================
        {
            key: 'features.customers.search',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable customer search',
        },
        {
            key: 'features.customers.quick_create',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable quick customer creation',
        },
        {
            key: 'features.customers.loyalty_program',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable loyalty program',
        },
        {
            key: 'features.customers.store_credit',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable store credit',
        },
        {
            key: 'features.customers.gift_cards',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable gift cards',
        },
        {
            key: 'features.customers.reservations',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable reservations',
        },
        {
            key: 'features.customers.feedback',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable customer feedback',
        },

        // =======================================================================
        // FEATURE FLAGS - INVENTORY
        // =======================================================================
        {
            key: 'features.inventory.stock_tracking',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable stock tracking',
        },
        {
            key: 'features.inventory.batch_tracking',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable batch/lot tracking',
        },
        {
            key: 'features.inventory.expiry_tracking',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable expiry tracking',
        },
        {
            key: 'features.inventory.low_stock_alerts',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable low stock alerts',
        },
        {
            key: 'features.inventory.auto_reorder',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable auto-reorder',
        },
        {
            key: 'features.inventory.recipe_management',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable recipe/BOM management',
        },
        {
            key: 'features.inventory.wastage_tracking',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable wastage tracking',
        },

        // =======================================================================
        // FEATURE FLAGS - SECURITY
        // =======================================================================
        {
            key: 'features.security.manager_pin',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable manager PIN',
        },
        {
            key: 'features.security.shift_management',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable shift management',
        },
        {
            key: 'features.security.cash_drawer_control',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable cash drawer control',
        },
        {
            key: 'features.security.blind_closeout',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable blind closeout',
        },
        {
            key: 'features.security.zatca_compliance',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable ZATCA compliance',
        },
        {
            key: 'features.security.audit_trail',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable audit trail',
        },

        // =======================================================================
        // FEATURE FLAGS - INTEGRATIONS
        // =======================================================================
        {
            key: 'features.integrations.online_ordering',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable online ordering integration',
        },
        {
            key: 'features.integrations.delivery_partners',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable delivery partners integration',
        },
        {
            key: 'features.integrations.accounting',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable accounting integration',
        },
        {
            key: 'features.integrations.payment_terminals',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable payment terminals',
        },
        {
            key: 'features.integrations.printers',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable printer integration',
        },
        {
            key: 'features.integrations.scales',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'features',
            description: 'Enable scales integration',
        },

        // =======================================================================
        // TAX SETTINGS (for ConfigInitResponse)
        // =======================================================================
        {
            key: 'taxes.vat_rate',
            value: 0.15,
            type: ConfigType.NUMBER,
            category: 'taxes',
            description: 'VAT rate (decimal)',
        },
        {
            key: 'taxes.vat_included',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'taxes',
            description: 'Prices include VAT',
        },
        {
            key: 'taxes.service_charge_rate',
            value: 0,
            type: ConfigType.NUMBER,
            category: 'taxes',
            description: 'Service charge rate (decimal)',
        },

        // =======================================================================
        // POS SETTINGS (for ConfigInitResponse)
        // =======================================================================
        {
            key: 'pos.vat_rate',
            value: 0.14,
            type: ConfigType.NUMBER,
            category: 'pos',
            description: 'POS VAT rate',
        },
        {
            key: 'pos.service_charge_rate',
            value: 0.12,
            type: ConfigType.NUMBER,
            category: 'pos',
            description: 'POS service charge rate',
        },
        {
            key: 'pos.service_charge_applies_to',
            value: ['DINE_IN'],
            type: ConfigType.JSON,
            category: 'pos',
            description: 'Service charge applies to order types',
        },
        {
            key: 'pos.currency_code',
            value: 'SAR',
            type: ConfigType.STRING,
            category: 'pos',
            description: 'Currency code',
        },
        {
            key: 'pos.currency_symbol',
            value: 'ر.س',
            type: ConfigType.STRING,
            category: 'pos',
            description: 'Currency symbol',
        },
        {
            key: 'pos.currency_decimal_places',
            value: 2,
            type: ConfigType.NUMBER,
            category: 'pos',
            description: 'Currency decimal places',
        },
        {
            key: 'pos.platform_delivery_charge',
            value: 0,
            type: ConfigType.NUMBER,
            category: 'pos',
            description: 'Platform delivery charge',
        },
        {
            key: 'pos.enable_delivery_zones',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'pos',
            description: 'Enable delivery zones',
        },
        {
            key: 'pos.require_table_for_dine_in',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'pos',
            description: 'Require table for dine-in',
        },
        {
            key: 'pos.require_customer_count',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'pos',
            description: 'Require customer count',
        },
        {
            key: 'pos.void_requires_manager',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'pos',
            description: 'Void requires manager',
        },
        {
            key: 'pos.delete_after_save_requires_manager',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'pos',
            description: 'Delete after save requires manager',
        },
        {
            key: 'pos.return_requires_manager',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'pos',
            description: 'Return requires manager',
        },

        // =======================================================================
        // SESSION SETTINGS
        // =======================================================================
        {
            key: 'session.blind_count_enabled',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'session',
            description: 'Hide expected cash amount during drawer count (blind count)',
        },
        {
            key: 'session.discrepancy_notes_threshold',
            value: 5.000,
            type: ConfigType.NUMBER,
            category: 'session',
            description: 'Discrepancy amount (SAR) above which notes are required',
        },
        {
            key: 'session.allow_multiple_open',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'session',
            description: 'Allow multiple open sessions per device',
        },
        {
            key: 'session.timeout_minutes',
            value: 480,
            type: ConfigType.NUMBER,
            category: 'session',
            description: 'Auto-logout inactive session after X minutes (0 = disabled)',
        },

        // =======================================================================
        // END OF DAY SETTINGS
        // =======================================================================
        {
            key: 'eod.require_all_sessions_closed',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'eod',
            description: 'Require all cashier sessions closed before starting EOD',
        },
        {
            key: 'eod.auto_generate_report',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'eod',
            description: 'Automatically generate EOD report when closing',
        },
        {
            key: 'eod.archive_days',
            value: 365,
            type: ConfigType.NUMBER,
            category: 'eod',
            description: 'Number of days to keep EOD reports before archiving',
        },

        // =======================================================================
        // INVENTORY SETTINGS
        // =======================================================================
        {
            key: 'inventory.deduct_on_order_complete',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'inventory',
            description: 'Automatically deduct stock when order is completed',
        },
        {
            key: 'inventory.allow_negative_stock',
            value: { enabled: false, requires_approval: true },
            type: ConfigType.JSON,
            category: 'inventory',
            description: 'Allow selling when stock is insufficient',
        },
        {
            key: 'inventory.low_stock_threshold',
            value: 10,
            type: ConfigType.NUMBER,
            category: 'inventory',
            description: 'Show low stock warning when quantity falls below this',
        },
        {
            key: 'inventory.track_batches',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'inventory',
            description: 'Enable batch/lot tracking for inventory',
        },

        // =======================================================================
        // ORDER SETTINGS
        // =======================================================================
        {
            key: 'order.default_type',
            value: 'DINE_IN',
            type: ConfigType.ENUM,
            category: 'order',
            description: 'Default order type for new orders',
        },
        {
            key: 'order.enabled_types',
            value: ['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'PICKUP'],
            type: ConfigType.JSON,
            category: 'order',
            description: 'Enabled order types for this store',
        },
        {
            key: 'order.require_table_for_dine_in',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'order',
            description: 'Require table selection for dine-in orders',
        },
        {
            key: 'order.require_customer_for_delivery',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'order',
            description: 'Require customer selection for delivery orders',
        },
        {
            key: 'order.auto_fire_to_kitchen',
            value: { DINE_IN: false, TAKEAWAY: true, DELIVERY: true, PICKUP: true },
            type: ConfigType.JSON,
            category: 'order',
            description: 'Auto-send to kitchen on order creation by type',
        },

        // =======================================================================
        // KITCHEN SETTINGS
        // =======================================================================
        {
            key: 'kitchen.auto_print_tickets',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'kitchen',
            description: 'Automatically print kitchen tickets when fired',
        },
        {
            key: 'kitchen.alert_threshold_seconds',
            value: 600,
            type: ConfigType.NUMBER,
            category: 'kitchen',
            description: 'Show alert for tickets older than X seconds',
        },
        {
            key: 'kitchen.bump_mode',
            value: 'BY_ITEM',
            type: ConfigType.ENUM,
            category: 'kitchen',
            description: 'Bump tickets by item or by full order',
        },

        // =======================================================================
        // PAYMENT SETTINGS
        // =======================================================================
        {
            key: 'payment.enabled_methods',
            value: ['CASH', 'CARD', 'MOBILE'],
            type: ConfigType.JSON,
            category: 'payment',
            description: 'Enabled payment methods',
        },
        {
            key: 'payment.allow_split',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'payment',
            description: 'Allow split payments on a single order',
        },
        {
            key: 'payment.allow_partial',
            value: { enabled: false },
            type: ConfigType.BOOLEAN,
            category: 'payment',
            description: 'Allow partial payments (keeping order open)',
        },
        {
            key: 'payment.tip_enabled',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'payment',
            description: 'Allow adding tips to orders',
        },
        {
            key: 'payment.rounding_method',
            value: 'NONE',
            type: ConfigType.ENUM,
            category: 'payment',
            description: 'Round totals to nearest halala (NONE, NEAREST_5, NEAREST_10)',
        },

        // =======================================================================
        // DISCOUNT SETTINGS
        // =======================================================================
        {
            key: 'discount.max_percentage',
            value: 50,
            type: ConfigType.NUMBER,
            category: 'discount',
            description: 'Maximum discount percentage allowed',
        },
        {
            key: 'discount.require_approval_above',
            value: 20,
            type: ConfigType.NUMBER,
            category: 'discount',
            description: 'Require manager approval for discounts above X%',
        },
        {
            key: 'discount.allow_item_level',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'discount',
            description: 'Allow discounts on individual items',
        },

        // =======================================================================
        // ZATCA / TAX SETTINGS
        // =======================================================================
        {
            key: 'zatca.enabled',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'zatca',
            description: 'Enable ZATCA e-invoicing compliance',
        },
        {
            key: 'zatca.phase',
            value: 2,
            type: ConfigType.NUMBER,
            category: 'zatca',
            description: 'ZATCA compliance phase (1 or 2)',
        },
        {
            key: 'tax.default_rate',
            value: 15.00,
            type: ConfigType.NUMBER,
            category: 'tax',
            description: 'Default VAT rate percentage',
        },
        {
            key: 'tax.inclusive_pricing',
            value: { enabled: true },
            type: ConfigType.BOOLEAN,
            category: 'tax',
            description: 'Product prices include tax',
        },
    ];

    constructor(
        @InjectRepository(StoreConfiguration)
        private readonly configRepo: Repository<StoreConfiguration>,
        @InjectRepository(Store)
        private readonly storeRepo: Repository<Store>,
        @InjectRepository(Translation)
        private readonly translationRepo: Repository<Translation>,
        @InjectRepository(SupportedLanguage)
        private readonly languageRepo: Repository<SupportedLanguage>,
    ) { }

    async seed(): Promise<void> {
        this.logger.log('Seeding default configurations...');

        // Get all stores
        const stores = await this.storeRepo.find();

        if (stores.length === 0) {
            this.logger.warn('No stores found - skipping configuration seed');
            return;
        }

        // Seed supported languages first
        await this.seedSupportedLanguages();

        // Seed default translations
        await this.seedDefaultTranslations();

        for (const store of stores) {
            await this.seedStoreConfigs(store.id);
        }

        this.logger.log(`Default configurations seeded for ${stores.length} store(s)`);
    }

    /**
     * Seed supported languages
     */
    private async seedSupportedLanguages(): Promise<void> {
        const defaultLanguages = [
            { languageCode: 'ar', languageName: 'Arabic', nativeName: 'العربية', direction: 'rtl', isDefault: true, isActive: true, displayOrder: 1 },
            { languageCode: 'en', languageName: 'English', nativeName: 'English', direction: 'ltr', isDefault: false, isActive: true, displayOrder: 2 },
        ];

        for (const lang of defaultLanguages) {
            const existing = await this.languageRepo.findOne({
                where: { languageCode: lang.languageCode },
            });

            if (!existing) {
                await this.languageRepo.save(lang);
                this.logger.log(`Seeded language: ${lang.languageName}`);
            }
        }
    }

    /**
     * Seed default translations from common keys
     */
    private async seedDefaultTranslations(): Promise<void> {
        const defaultTranslationsAr: Record<string, string> = {
            'settings.title': 'الإعدادات',
            'settings.subtitle': 'تكوين نظام النقاط',
            'settings.sections.general': 'عام',
            'settings.sections.features': 'الميزات',
            'settings.sections.pos': 'نقاط البيع',
            'settings.sections.payments': 'المدفوعات',
            'settings.sections.security': 'الأمان',
            'settings.sections.display': 'العرض',
            'settings.sections.translations': 'الترجمات',
            'settings.sections.themeEditor': 'محرر السمة',
            'settings.themeEditor.title': 'محرر السمة',
            'settings.themeEditor.description': 'تخصيص الألوان والمظهر',
            'settings.themeEditor.presets': 'الألوان الجاهزة',
            'settings.themeEditor.primaryColor': 'اللون الأساسي',
            'settings.themeEditor.secondaryColor': 'اللون الثانوي',
            'settings.themeEditor.glassOpacity': 'شفافية الزجاج',
            'settings.themeEditor.borderRadius': 'نصف قطر الحدود',
            'settings.themeEditor.save': 'حفظ السمة',
            'settings.themeEditor.saving': 'جاري الحفظ...',
        };

        const defaultTranslationsEn: Record<string, string> = {
            'settings.title': 'Settings',
            'settings.subtitle': 'Configure your POS',
            'settings.sections.general': 'General',
            'settings.sections.features': 'Features',
            'settings.sections.pos': 'POS',
            'settings.sections.payments': 'Payments',
            'settings.sections.security': 'Security',
            'settings.sections.display': 'Display',
            'settings.sections.translations': 'Translations',
            'settings.sections.themeEditor': 'Theme Editor',
            'settings.themeEditor.title': 'Theme Editor',
            'settings.themeEditor.description': 'Customize colors and appearance',
            'settings.themeEditor.presets': 'Color Presets',
            'settings.themeEditor.primaryColor': 'Primary Color',
            'settings.themeEditor.secondaryColor': 'Secondary Color',
            'settings.themeEditor.glassOpacity': 'Glass Opacity',
            'settings.themeEditor.borderRadius': 'Border Radius',
            'settings.themeEditor.save': 'Save Theme',
            'settings.themeEditor.saving': 'Saving...',
        };

        // Seed Arabic translations
        await this.seedTranslationsForLanguage('ar', defaultTranslationsAr);

        // Seed English translations
        await this.seedTranslationsForLanguage('en', defaultTranslationsEn);
    }

    /**
     * Seed translations for a specific language
     */
    private async seedTranslationsForLanguage(languageCode: string, translations: Record<string, string>): Promise<void> {
        for (const [key, value] of Object.entries(translations)) {
            const existing = await this.translationRepo.findOne({
                where: {
                    translationKey: key,
                    languageCode,
                    storeId: null as any,
                },
            });

            if (!existing) {
                await this.translationRepo.save({
                    translationKey: key,
                    translationValue: value,
                    languageCode,
                    storeId: null,
                    context: 'SETTINGS',
                    isCustom: false,
                    isActive: true,
                });
            }
        }
    }

    private async seedStoreConfigs(storeId: string): Promise<void> {
        for (const config of this.defaultConfigs) {
            // Check if config already exists
            const existing = await this.configRepo.findOne({
                where: { store: { id: storeId }, configKey: config.key },
            });

            if (!existing) {
                await this.configRepo.save({
                    store: { id: storeId } as Store,
                    configKey: config.key,
                    configValue: config.value,
                    configType: config.type,
                    category: config.category,
                    description: config.description,
                });
            }
        }
    }

    /**
     * Get category list with descriptions for UI
     */
    getCategories(): { key: string; label: string; description: string }[] {
        return [
            { key: 'theme', label: 'Theme', description: 'Visual appearance and colors' },
            { key: 'features', label: 'Features', description: 'Feature flags and module toggles' },
            { key: 'session', label: 'Session & Cash', description: 'Cashier session and drawer settings' },
            { key: 'eod', label: 'End of Day', description: 'Manager end-of-day settings' },
            { key: 'inventory', label: 'Inventory', description: 'Stock management settings' },
            { key: 'order', label: 'Orders', description: 'Order creation and workflow' },
            { key: 'kitchen', label: 'Kitchen', description: 'Kitchen display settings' },
            { key: 'payment', label: 'Payments', description: 'Payment methods and rules' },
            { key: 'discount', label: 'Discounts', description: 'Discount limits and approvals' },
            { key: 'zatca', label: 'ZATCA', description: 'E-invoicing compliance' },
            { key: 'tax', label: 'Tax', description: 'Tax rates and calculation' },
            { key: 'taxes', label: 'Taxes', description: 'Tax configuration' },
            { key: 'pos', label: 'POS', description: 'Point of sale settings' },
        ];
    }
}
