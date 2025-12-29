import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreConfiguration, ConfigType } from '../../modules/organization/entities/store-configuration.entity';
import { Store } from '../../modules/organization/entities/store.entity';

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
    ) { }

    async seed(): Promise<void> {
        this.logger.log('Seeding default configurations...');

        // Get all stores
        const stores = await this.storeRepo.find();

        if (stores.length === 0) {
            this.logger.warn('No stores found - skipping configuration seed');
            return;
        }

        for (const store of stores) {
            await this.seedStoreConfigs(store.id);
        }

        this.logger.log(`Default configurations seeded for ${stores.length} store(s)`);
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
            { key: 'session', label: 'Session & Cash', description: 'Cashier session and drawer settings' },
            { key: 'eod', label: 'End of Day', description: 'Manager end-of-day settings' },
            { key: 'inventory', label: 'Inventory', description: 'Stock management settings' },
            { key: 'order', label: 'Orders', description: 'Order creation and workflow' },
            { key: 'kitchen', label: 'Kitchen', description: 'Kitchen display settings' },
            { key: 'payment', label: 'Payments', description: 'Payment methods and rules' },
            { key: 'discount', label: 'Discounts', description: 'Discount limits and approvals' },
            { key: 'zatca', label: 'ZATCA', description: 'E-invoicing compliance' },
            { key: 'tax', label: 'Tax', description: 'Tax rates and calculation' },
        ];
    }
}
