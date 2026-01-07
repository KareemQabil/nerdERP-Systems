import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { CustomFieldsModule } from './modules/custom-fields/custom-fields.module';
import { CalculationModule } from './modules/calculation/calculation.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { TablesModule } from './modules/tables/tables.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UsersModule } from './modules/users/users.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { TranslationsModule } from './modules/translations/translations.module';
import { PrintingModule } from './modules/printing/printing.module';
import { ZatcaModule } from './modules/zatca/zatca.module';
import { AggregatorModule } from './modules/aggregator/aggregator.module';
import { ConfigModule } from './modules/config/config.module';
import { SeedDataService } from './common/services/seed-data.service';
import { SeedComprehensiveService } from './common/services/seed-comprehensive.service';
import { SeedController } from './common/controllers/seed.controller';
import { Organization } from './modules/organization/entities/organization.entity';
import { Store } from './modules/organization/entities/store.entity';
import { TaxProfile, TaxDefinition } from './modules/organization/entities/tax-profile.entity';
import { Product } from './modules/products/entities/product.entity';
import { ProductCategory } from './modules/products/entities/product-category.entity';
import { ProductVariant } from './modules/products/entities/product-variant.entity';
import { Modifier, ModifierOption } from './modules/products/entities/modifier.entity';
import { Customer } from './modules/promotions/entities/customer.entity';
import { User, Role, AuditLog } from './modules/users/entities/user.entity';
import { Device } from './modules/users/entities/device.entity';
import { PaymentMethod } from './modules/payments/entities/payment-method.entity';
import { Warehouse } from './modules/inventory/entities/warehouse.entity';
// Phase 2 entities
import { KitchenStation } from './modules/kitchen/entities/kitchen-station.entity';
import { Table, TableZone } from './modules/tables/entities/table.entity';
import { Reservation } from './modules/tables/entities/reservation.entity';
import { RegisterSession } from './modules/cash/entities/register-session.entity';
import { PrintJob } from './modules/printing/entities/print-job.entity';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Enabled to create database schema
        logging: ['error', 'warn', 'schema'],
        ssl: {
          rejectUnauthorized: false, // Required for Neon with SSL
        },
      }),
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        const dataSource = new DataSource(options);

        // Handle retry scenario - if dataSource already registered, just return initialized one
        try {
          return addTransactionalDataSource(dataSource);
        } catch (error) {
          // If already added on a previous retry attempt, just initialize and return
          if (error instanceof Error && error.message.includes('already added')) {
            await dataSource.initialize();
            return dataSource;
          }
          throw error;
        }
      },
    }),
    TypeOrmModule.forFeature([
      Organization, Store, TaxProfile, TaxDefinition,
      Product, ProductCategory, ProductVariant, Modifier, ModifierOption,
      Customer, User, Role, AuditLog, Device, PaymentMethod, Warehouse,
      // Phase 2 entities
      KitchenStation, TableZone, Table, Reservation, RegisterSession,
      // Phase 2.2 entities
      PrintJob,
    ]),
    CommonModule, // Must be before other modules that use AuditLogService
    ProductsModule,
    InventoryModule,
    SalesModule,
    OrganizationModule,
    CustomFieldsModule,
    CalculationModule,
    WorkflowModule,
    PromotionsModule,
    KitchenModule,
    TablesModule,
    DeliveryModule,
    WebhooksModule,
    PaymentsModule,
    UsersModule,
    ReportingModule,
    TranslationsModule,
    PrintingModule,
    ZatcaModule,
    AggregatorModule,
    ConfigModule,
  ],
  controllers: [AppController, SeedController],
  providers: [
    AppService,
    SeedDataService,
    SeedComprehensiveService,
  ],
})
export class AppModule { }
