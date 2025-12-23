import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
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
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    TypeOrmModule.forFeature([
      Organization, Store, TaxProfile, TaxDefinition,
      Product, ProductCategory, ProductVariant, Modifier, ModifierOption,
      Customer, User, Role, AuditLog, Device, PaymentMethod, Warehouse
    ]),
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
  ],
  controllers: [AppController, SeedController],
  providers: [
    AppService,
    SeedDataService,
    SeedComprehensiveService,
  ],
})
export class AppModule { }
