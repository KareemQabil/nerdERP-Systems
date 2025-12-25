import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Organization } from '../../modules/organization/entities/organization.entity';
import { Store, StoreType } from '../../modules/organization/entities/store.entity';
import { TaxProfile, TaxDefinition, TaxCalculationType } from '../../modules/organization/entities/tax-profile.entity';
import { Product, ProductType } from '../../modules/products/entities/product.entity';
import { ProductCategory } from '../../modules/products/entities/product-category.entity';
import { Modifier, ModifierOption } from '../../modules/products/entities/modifier.entity';
import { Customer } from '../../modules/promotions/entities/customer.entity';
import { User, Role } from '../../modules/users/entities/user.entity';
import { Device } from '../../modules/users/entities/device.entity';
import { PaymentMethod } from '../../modules/payments/entities/payment-method.entity';
import { Warehouse } from '../../modules/inventory/entities/warehouse.entity';
import { KitchenStation } from '../../modules/kitchen/entities/kitchen-station.entity';
import { Table, TableZone } from '../../modules/tables/entities/table.entity';
import * as bcrypt from 'bcrypt';

/**
 * Production-Ready Seed Service
 * Seeds the database with data matching the frontend mock-pos-data.ts exactly
 * This ensures a stable MVP with consistent data across frontend and backend
 */

// FIXED UUIDs - Must match frontend session.store.ts constants
const FIXED_STORE_ID = '9c8370cd-44ee-4999-aecf-72c4b490ec2f';
const FIXED_DEVICE_ID = '6a477384-24a6-427c-a961-44e1940cddc1';
const FIXED_WAREHOUSE_ID = '001bfc5f-33b6-4135-ab0a-80ba0bfefcd5';
const FIXED_ADMIN_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const FIXED_CASHIER_USER_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

@Injectable()
export class SeedComprehensiveService {
    private readonly logger = new Logger(SeedComprehensiveService.name);

    constructor(
        @InjectRepository(Organization) private orgRepo: Repository<Organization>,
        @InjectRepository(Store) private storeRepo: Repository<Store>,
        @InjectRepository(TaxProfile) private taxProfileRepo: Repository<TaxProfile>,
        @InjectRepository(TaxDefinition) private taxDefRepo: Repository<TaxDefinition>,
        @InjectRepository(ProductCategory) private categoryRepo: Repository<ProductCategory>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(Modifier) private modifierRepo: Repository<Modifier>,
        @InjectRepository(ModifierOption) private modifierOptionRepo: Repository<ModifierOption>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Role) private roleRepo: Repository<Role>,
        @InjectRepository(Device) private deviceRepo: Repository<Device>,
        @InjectRepository(PaymentMethod) private paymentMethodRepo: Repository<PaymentMethod>,
        @InjectRepository(Warehouse) private warehouseRepo: Repository<Warehouse>,
        @InjectRepository(KitchenStation) private kitchenStationRepo: Repository<KitchenStation>,
        @InjectRepository(TableZone) private tableZoneRepo: Repository<TableZone>,
        @InjectRepository(Table) private tableRepo: Repository<Table>,
        private dataSource: DataSource,
    ) { }

    /**
     * Clear all data and reseed from scratch
     * Use for development/testing only
     */
    async resetAndSeed(): Promise<any> {
        this.logger.warn('⚠️ Resetting database and reseeding...');

        // Clear tables in correct order (respecting foreign keys)
        await this.dataSource.query('TRUNCATE TABLE order_items CASCADE');
        await this.dataSource.query('TRUNCATE TABLE sales_orders CASCADE');
        await this.dataSource.query('TRUNCATE TABLE register_sessions CASCADE');
        await this.dataSource.query('TRUNCATE TABLE modifier_options CASCADE');
        await this.dataSource.query('TRUNCATE TABLE modifiers CASCADE');
        await this.dataSource.query('TRUNCATE TABLE products CASCADE');
        await this.dataSource.query('TRUNCATE TABLE product_categories CASCADE');
        await this.dataSource.query('TRUNCATE TABLE tables CASCADE');
        await this.dataSource.query('TRUNCATE TABLE table_zones CASCADE');
        await this.dataSource.query('TRUNCATE TABLE kitchen_stations CASCADE');
        await this.dataSource.query('TRUNCATE TABLE devices CASCADE');
        await this.dataSource.query('TRUNCATE TABLE users CASCADE');
        await this.dataSource.query('TRUNCATE TABLE roles CASCADE');
        await this.dataSource.query('TRUNCATE TABLE payment_methods CASCADE');
        await this.dataSource.query('TRUNCATE TABLE warehouses CASCADE');
        await this.dataSource.query('TRUNCATE TABLE customers CASCADE');
        await this.dataSource.query('TRUNCATE TABLE tax_definitions CASCADE');
        await this.dataSource.query('TRUNCATE TABLE tax_profiles CASCADE');
        await this.dataSource.query('TRUNCATE TABLE stores CASCADE');
        await this.dataSource.query('TRUNCATE TABLE organizations CASCADE');

        return this.seed();
    }

    async seed() {
        this.logger.log('🌱 Starting production MVP seed...');

        try {
            // ==================== 1. ORGANIZATION ====================
            this.logger.log('📊 Creating organization...');
            const org = await this.orgRepo.save(this.orgRepo.create({
                legalName: 'NerdPOS Demo LLC',
                taxId: 'SA1234567890',
                countryCode: 'SA',
                baseCurrency: 'SAR',
            }));

            // ==================== 2. STORE ====================
            this.logger.log('🏪 Creating store...');
            const mainStore = await this.storeRepo.save(this.storeRepo.create({
                id: FIXED_STORE_ID, // Fixed UUID for frontend compatibility
                storeCode: 'MAIN',
                storeType: StoreType.RESTAURANT,
                translations: {
                    en: { name: 'Main Branch - Riyadh' },
                    ar: { name: 'الفرع الرئيسي - الرياض' },
                },
                timezone: 'Asia/Riyadh',
                address: { street: 'King Fahd Road', city: 'Riyadh', country: 'SA' },
            }));

            // ==================== 3. WAREHOUSE ====================
            this.logger.log('📦 Creating warehouse...');
            const mainWarehouse = await this.warehouseRepo.save(this.warehouseRepo.create({
                id: FIXED_WAREHOUSE_ID, // Fixed UUID for frontend compatibility
                name: 'Main Warehouse',
                location: 'Main Storage Area',
                isActive: true,
            }));

            // ==================== 4. TAX PROFILE ====================
            this.logger.log('💰 Creating tax profile (15% VAT)...');
            const taxProfile = await this.taxProfileRepo.save(this.taxProfileRepo.create({
                profileName: 'Saudi VAT 15%',
                isDefault: true,
                isActive: true,
            }));

            await this.taxDefRepo.save(this.taxDefRepo.create({
                taxProfileId: taxProfile.id,
                taxName: 'VAT',
                taxCode: 'VAT15',
                calculationType: TaxCalculationType.PERCENTAGE,
                taxRate: 15,
                isInclusive: false,
                displayOrder: 1,
            }));

            // ==================== 5. ROLES & USERS ====================
            this.logger.log('👥 Creating roles and users...');
            const adminRole = await this.roleRepo.save(this.roleRepo.create({
                roleName: 'Administrator',
                roleCode: 'ADMIN',
                permissions: ['*'],
                isSystemRole: true,
            }));

            const cashierRole = await this.roleRepo.save(this.roleRepo.create({
                roleName: 'Cashier',
                roleCode: 'CASHIER',
                permissions: ['orders.create', 'orders.view', 'payments.process'],
            }));

            // Admin user
            await this.userRepo.save(this.userRepo.create({
                email: 'admin@nerdpos.com',
                passwordHash: await bcrypt.hash('Admin123!', 10),
                firstName: 'Admin',
                lastName: 'User',
                roleId: adminRole.id,
                pinCode: '0000',
                isActive: true,
            }));

            // Cashier user
            await this.userRepo.save(this.userRepo.create({
                email: 'cashier@nerdpos.com',
                passwordHash: await bcrypt.hash('Cashier123!', 10),
                firstName: 'Ahmed',
                lastName: 'Al-Cashier',
                roleId: cashierRole.id,
                storeId: mainStore.id,
                pinCode: '1234',
                isActive: true,
            }));

            // ==================== 6. DEVICES ====================
            this.logger.log('🖥️  Creating devices...');
            const posDevice = await this.deviceRepo.save(this.deviceRepo.create({
                id: FIXED_DEVICE_ID, // Fixed UUID for frontend compatibility
                deviceName: 'POS Terminal 1',
                deviceCode: 'POS-001',
                deviceType: 'POS',
                storeId: mainStore.id,
                isActive: true,
            }));

            // ==================== 7. PAYMENT METHODS ====================
            this.logger.log('💳 Creating payment methods...');
            await this.paymentMethodRepo.save([
                this.paymentMethodRepo.create({
                    methodName: 'Cash',
                    methodCode: 'CASH',
                    methodType: 'CASH' as any,
                    isActive: true,
                    displayOrder: 1,
                }),
                this.paymentMethodRepo.create({
                    methodName: 'Credit Card',
                    methodCode: 'CARD',
                    methodType: 'CARD' as any,
                    isActive: true,
                    displayOrder: 2,
                }),
                this.paymentMethodRepo.create({
                    methodName: 'Mada',
                    methodCode: 'MADA',
                    methodType: 'MADA' as any,
                    isActive: true,
                    displayOrder: 3,
                }),
            ]);

            // ==================== 8. CATEGORIES (Matching mock-pos-data.ts) ====================
            this.logger.log('📂 Creating categories (matching frontend mock data)...');
            const categories = await this.categoryRepo.save([
                this.categoryRepo.create({ name: 'Hot Drinks', nameAr: 'مشروبات ساخنة', displayOrder: 1 }),
                this.categoryRepo.create({ name: 'Cold Drinks', nameAr: 'مشروبات باردة', displayOrder: 2 }),
                this.categoryRepo.create({ name: 'Bakery', nameAr: 'المخبوزات', displayOrder: 3 }),
                this.categoryRepo.create({ name: 'Desserts', nameAr: 'الحلويات', displayOrder: 4 }),
                this.categoryRepo.create({ name: 'Salads', nameAr: 'السلطات', displayOrder: 5 }),
            ]);

            const [hotDrinks, coldDrinks, bakery, desserts, salads] = categories;

            // ==================== 9. MODIFIER GROUPS (Matching mock-pos-data.ts) ====================
            this.logger.log('🔧 Creating modifier groups (matching frontend mock data)...');

            // Size modifier (required, single selection)
            const sizeModifier = await this.modifierRepo.save(this.modifierRepo.create({
                modifierName: 'Size',
                translations: { ar: { name: 'الحجم' } },
                isRequired: true,
                minSelections: 1,
                maxSelections: 1,
                displayOrder: 1,
            }));

            await this.modifierOptionRepo.save([
                this.modifierOptionRepo.create({
                    modifier: sizeModifier,
                    optionName: 'Small',
                    translations: { ar: { name: 'صغير' } },
                    priceAdjustment: 0,
                    displayOrder: 1,
                }),
                this.modifierOptionRepo.create({
                    modifier: sizeModifier,
                    optionName: 'Medium',
                    translations: { ar: { name: 'وسط' } },
                    priceAdjustment: 2,
                    displayOrder: 2,
                }),
                this.modifierOptionRepo.create({
                    modifier: sizeModifier,
                    optionName: 'Large',
                    translations: { ar: { name: 'كبير' } },
                    priceAdjustment: 4,
                    displayOrder: 3,
                }),
            ]);

            // Milk type modifier (optional, single selection)
            const milkModifier = await this.modifierRepo.save(this.modifierRepo.create({
                modifierName: 'Milk Type',
                translations: { ar: { name: 'نوع الحليب' } },
                isRequired: false,
                minSelections: 0,
                maxSelections: 1,
                displayOrder: 2,
            }));

            await this.modifierOptionRepo.save([
                this.modifierOptionRepo.create({
                    modifier: milkModifier,
                    optionName: 'Regular Milk',
                    translations: { ar: { name: 'حليب عادي' } },
                    priceAdjustment: 0,
                    displayOrder: 1,
                }),
                this.modifierOptionRepo.create({
                    modifier: milkModifier,
                    optionName: 'Oat Milk',
                    translations: { ar: { name: 'حليب الشوفان' } },
                    priceAdjustment: 3,
                    displayOrder: 2,
                }),
                this.modifierOptionRepo.create({
                    modifier: milkModifier,
                    optionName: 'Almond Milk',
                    translations: { ar: { name: 'حليب اللوز' } },
                    priceAdjustment: 3,
                    displayOrder: 3,
                }),
                this.modifierOptionRepo.create({
                    modifier: milkModifier,
                    optionName: 'Skim Milk',
                    translations: { ar: { name: 'حليب خالي الدسم' } },
                    priceAdjustment: 0,
                    displayOrder: 4,
                }),
            ]);

            // Extras modifier (optional, multi-selection)
            const extrasModifier = await this.modifierRepo.save(this.modifierRepo.create({
                modifierName: 'Extras',
                translations: { ar: { name: 'إضافات' } },
                isRequired: false,
                minSelections: 0,
                maxSelections: 3,
                displayOrder: 3,
            }));

            await this.modifierOptionRepo.save([
                this.modifierOptionRepo.create({
                    modifier: extrasModifier,
                    optionName: 'Extra Shot',
                    translations: { ar: { name: 'شوت إضافي' } },
                    priceAdjustment: 2,
                    displayOrder: 1,
                }),
                this.modifierOptionRepo.create({
                    modifier: extrasModifier,
                    optionName: 'Caramel Syrup',
                    translations: { ar: { name: 'شراب الكراميل' } },
                    priceAdjustment: 1.5,
                    displayOrder: 2,
                }),
                this.modifierOptionRepo.create({
                    modifier: extrasModifier,
                    optionName: 'Vanilla Syrup',
                    translations: { ar: { name: 'شراب الفانيلا' } },
                    priceAdjustment: 1.5,
                    displayOrder: 3,
                }),
                this.modifierOptionRepo.create({
                    modifier: extrasModifier,
                    optionName: 'Whipped Cream',
                    translations: { ar: { name: 'كريمة مخفوقة' } },
                    priceAdjustment: 1,
                    displayOrder: 4,
                }),
            ]);

            // ==================== 10. PRODUCTS (Matching mock-pos-data.ts exactly) ====================
            this.logger.log('☕ Creating products (matching frontend mock data)...');

            // Product 1: Daily Brew Coffee (Hot Drinks, with modifiers)
            await this.productRepo.save(this.productRepo.create({
                sku: 'HOT-001',
                name: 'Daily Brew Coffee',
                nameAr: 'قهوة اليوم',
                type: ProductType.STANDARD,
                salePrice: 10,
                costPrice: 3,
                trackInventory: false, // MVP: No stock tracking for simpler demo
                isKitchenItem: true,
                category: hotDrinks,
                metadata: { imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop', badgeType: 'popular' },
            }));

            // Product 2: Premium Espresso (Hot Drinks, with modifiers)
            await this.productRepo.save(this.productRepo.create({
                sku: 'HOT-002',
                name: 'Premium Espresso',
                nameAr: 'إسبريسو مميز',
                type: ProductType.STANDARD,
                salePrice: 8,
                costPrice: 2.5,
                trackInventory: false,
                isKitchenItem: true,
                category: hotDrinks,
                metadata: { imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop', badgeType: 'bestseller' },
            }));

            // Product 3: Classic Latte (Hot Drinks, with modifiers)
            await this.productRepo.save(this.productRepo.create({
                sku: 'HOT-003',
                name: 'Classic Latte',
                nameAr: 'لاتيه كلاسيكي',
                type: ProductType.STANDARD,
                salePrice: 15,
                costPrice: 4,
                trackInventory: false,
                isKitchenItem: true,
                category: hotDrinks,
                metadata: { imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop' },
            }));

            // Product 4: Pepsi Cola (Cold Drinks)
            await this.productRepo.save(this.productRepo.create({
                sku: 'COLD-001',
                name: 'Pepsi Cola',
                nameAr: 'بيبسي كولا',
                type: ProductType.STANDARD,
                salePrice: 5,
                costPrice: 1.5,
                trackInventory: false,
                isKitchenItem: false,
                category: coldDrinks,
                metadata: { imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=400&fit=crop' },
            }));

            // Product 5: Fresh Caesar Salad (Salads)
            await this.productRepo.save(this.productRepo.create({
                sku: 'SALAD-001',
                name: 'Fresh Caesar Salad',
                nameAr: 'سلطة سيزر طازجة',
                type: ProductType.STANDARD,
                salePrice: 30,
                costPrice: 12,
                trackInventory: false,
                isKitchenItem: true,
                category: salads,
                metadata: { imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop', badgeType: 'new' },
            }));

            // Product 6: Natural Honey Cake (Desserts)
            await this.productRepo.save(this.productRepo.create({
                sku: 'DESSERT-001',
                name: 'Natural Honey Cake',
                nameAr: 'كيكة العسل الطبيعي',
                type: ProductType.STANDARD,
                salePrice: 22,
                costPrice: 8,
                trackInventory: false,
                isKitchenItem: false,
                category: desserts,
                metadata: { imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop', badgeType: 'popular' },
            }));

            // Product 7: Cheese Croissant (Bakery) - Note: Stock 0 in mock means out of stock
            await this.productRepo.save(this.productRepo.create({
                sku: 'BAKERY-001',
                name: 'Cheese Croissant',
                nameAr: 'كرواسون بالجبنة',
                type: ProductType.STANDARD,
                salePrice: 10,
                costPrice: 3,
                trackInventory: false,
                isKitchenItem: false,
                category: bakery,
                metadata: { imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop' },
            }));

            // Product 8: Natural Spring Water (Cold Drinks)
            await this.productRepo.save(this.productRepo.create({
                sku: 'COLD-002',
                name: 'Natural Spring Water',
                nameAr: 'مياه معدنية طبيعية',
                type: ProductType.STANDARD,
                salePrice: 2,
                costPrice: 0.5,
                trackInventory: false,
                isKitchenItem: false,
                category: coldDrinks,
                metadata: { imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop' },
            }));

            // ==================== 11. CUSTOMERS ====================
            this.logger.log('👤 Creating sample customers...');
            await this.customerRepo.save([
                this.customerRepo.create({
                    customerCode: 'CUST-001',
                    firstName: 'Ahmed',
                    lastName: 'Al-Farsi',
                    phone: '+966501234567',
                    email: 'ahmed@test.com',
                }),
                this.customerRepo.create({
                    customerCode: 'CUST-002',
                    firstName: 'Fatima',
                    lastName: 'Al-Rashid',
                    phone: '+966507654321',
                    email: 'fatima@test.com',
                }),
            ]);

            // ==================== 12. KITCHEN STATIONS ====================
            this.logger.log('🍳 Creating kitchen stations...');
            await this.kitchenStationRepo.save([
                this.kitchenStationRepo.create({
                    stationName: 'Barista Station',
                    stationCode: 'BARISTA',
                    storeId: mainStore.id,
                    color: '#8B4513',
                    isActive: true,
                    displayOrder: 1,
                }),
                this.kitchenStationRepo.create({
                    stationName: 'Kitchen',
                    stationCode: 'KITCHEN',
                    storeId: mainStore.id,
                    color: '#EF4444',
                    isActive: true,
                    displayOrder: 2,
                }),
            ]);

            // ==================== 13. TABLE ZONES & TABLES ====================
            this.logger.log('🪑 Creating tables...');
            const mainFloor = await this.tableZoneRepo.save(this.tableZoneRepo.create({
                zoneName: 'Main Floor',
                storeId: mainStore.id,
                color: '#3B82F6',
                displayOrder: 1,
                isActive: true,
            }));

            await this.tableRepo.save([
                this.tableRepo.create({
                    tableNumber: 'T1',
                    zone: mainFloor,
                    storeId: mainStore.id,
                    minSeats: 2,
                    maxSeats: 4,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                }),
                this.tableRepo.create({
                    tableNumber: 'T2',
                    zone: mainFloor,
                    storeId: mainStore.id,
                    minSeats: 2,
                    maxSeats: 4,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                }),
                this.tableRepo.create({
                    tableNumber: 'T3',
                    zone: mainFloor,
                    storeId: mainStore.id,
                    minSeats: 4,
                    maxSeats: 6,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                }),
            ]);

            // ==================== SUMMARY ====================
            this.logger.log('✅ Production MVP seed completed!');
            this.logger.log('📊 Summary:');
            this.logger.log(`   - Organization: 1`);
            this.logger.log(`   - Store: 1 (${mainStore.id})`);
            this.logger.log(`   - Warehouse: 1 (${mainWarehouse.id})`);
            this.logger.log(`   - Device: 1 (${posDevice.id})`);
            this.logger.log(`   - Users: 2 (admin@nerdpos.com, cashier@nerdpos.com)`);
            this.logger.log(`   - Categories: 5 (matching frontend)`);
            this.logger.log(`   - Products: 8 (matching frontend mock data)`);
            this.logger.log(`   - Modifier Groups: 3 (Size, Milk Type, Extras)`);
            this.logger.log(`   - Payment Methods: 3`);
            this.logger.log(`   - Tables: 3`);

            return {
                success: true,
                summary: {
                    organizationId: org.id,
                    storeId: mainStore.id,
                    warehouseId: mainWarehouse.id,
                    deviceId: posDevice.id,
                    categoriesCount: 5,
                    productsCount: 8,
                    modifierGroupsCount: 3,
                },
                credentials: {
                    admin: { email: 'admin@nerdpos.com', password: 'Admin123!', pin: '0000' },
                    cashier: { email: 'cashier@nerdpos.com', password: 'Cashier123!', pin: '1234' },
                },
            };
        } catch (error) {
            this.logger.error('❌ Seed failed:', error);
            throw error;
        }
    }
}
