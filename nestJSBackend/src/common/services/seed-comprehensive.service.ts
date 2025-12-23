import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../modules/organization/entities/organization.entity';
import { Store, StoreType } from '../../modules/organization/entities/store.entity';
import { TaxProfile, TaxDefinition, TaxCalculationType } from '../../modules/organization/entities/tax-profile.entity';
import { Product, ProductType } from '../../modules/products/entities/product.entity';
import { ProductCategory } from '../../modules/products/entities/product-category.entity';
import { Modifier, ModifierOption } from '../../modules/products/entities/modifier.entity';
import { ProductVariant } from '../../modules/products/entities/product-variant.entity';
import { Customer } from '../../modules/promotions/entities/customer.entity';
import { User, Role } from '../../modules/users/entities/user.entity';
import { Device } from '../../modules/users/entities/device.entity';
import { PaymentMethod } from '../../modules/payments/entities/payment-method.entity';
import { Warehouse } from '../../modules/inventory/entities/warehouse.entity';
import { KitchenStation } from '../../modules/kitchen/entities/kitchen-station.entity';
import { Table, TableZone } from '../../modules/tables/entities/table.entity';
import { Reservation } from '../../modules/tables/entities/reservation.entity';
import { RegisterSession } from '../../modules/cash/entities/register-session.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedComprehensiveService {
    constructor(
        @InjectRepository(Organization) private orgRepo: Repository<Organization>,
        @InjectRepository(Store) private storeRepo: Repository<Store>,
        @InjectRepository(TaxProfile) private taxProfileRepo: Repository<TaxProfile>,
        @InjectRepository(TaxDefinition) private taxDefRepo: Repository<TaxDefinition>,
        @InjectRepository(ProductCategory) private categoryRepo: Repository<ProductCategory>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
        @InjectRepository(Modifier) private modifierRepo: Repository<Modifier>,
        @InjectRepository(ModifierOption) private modifierOptionRepo: Repository<ModifierOption>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Role) private roleRepo: Repository<Role>,
        @InjectRepository(Device) private deviceRepo: Repository<Device>,
        @InjectRepository(PaymentMethod) private paymentMethodRepo: Repository<PaymentMethod>,
        @InjectRepository(Warehouse) private warehouseRepo: Repository<Warehouse>,
        // Phase 2 modules
        @InjectRepository(KitchenStation) private kitchenStationRepo: Repository<KitchenStation>,
        @InjectRepository(TableZone) private tableZoneRepo: Repository<TableZone>,
        @InjectRepository(Table) private tableRepo: Repository<Table>,
        @InjectRepository(Reservation) private reservationRepo: Repository<Reservation>,
        @InjectRepository(RegisterSession) private registerSessionRepo: Repository<RegisterSession>,
    ) { }

    async seed() {
        console.log('🌱 Starting comprehensive seed...');

        try {
            // 1. Organization
            console.log('📊 Creating organization...');
            const org = await this.orgRepo.save(this.orgRepo.create({
                legalName: 'NerdPOS Demo LLC',
                taxId: 'SA1234567890',
                countryCode: 'SA',
                baseCurrency: 'SAR',
            }));

            // 2. Stores
            console.log('🏪 Creating stores...');
            const mainStore = await this.storeRepo.save(this.storeRepo.create({
                storeCode: 'MAIN',
                storeType: StoreType.RESTAURANT,
                translations: {
                    en: { name: 'Main Branch - Riyadh' },
                    ar: { name: 'الفرع الرئيسي - الرياض' },
                },
                timezone: 'Asia/Riyadh',
                address: { street: 'King Fahd Road', city: 'Riyadh', country: 'SA' },
            }));

            const airportStore = await this.storeRepo.save(this.storeRepo.create({
                storeCode: 'AIRPORT',
                storeType: StoreType.RETAIL,
                translations: {
                    en: { name: 'Airport Branch' },
                    ar: { name: 'فرع المطار' },
                },
                timezone: 'Asia/Riyadh',
                address: { street: 'Airport Terminal 3', city: 'Riyadh', country: 'SA' },
            }));

            // 3. Warehouses
            console.log('📦 Creating warehouses...');
            const mainWarehouse = await this.warehouseRepo.save(this.warehouseRepo.create({
                name: 'Main Warehouse',
                location: 'Main Storage Area',
                isActive: true,
            }));

            // 4. Tax Profiles
            console.log('💰 Creating tax profiles...');
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

            // 5. Roles & Users
            console.log('👥 Creating roles and users...');
            const adminRole = await this.roleRepo.save(this.roleRepo.create({
                roleName: 'Administrator',
                roleCode: 'ADMIN',
                permissions: ['*'],
                isSystemRole: true,
            }));

            const managerRole = await this.roleRepo.save(this.roleRepo.create({
                roleName: 'Store Manager',
                roleCode: 'MANAGER',
                permissions: ['orders.*', 'inventory.*', 'reports.view'],
            }));

            const cashierRole = await this.roleRepo.save(this.roleRepo.create({
                roleName: 'Cashier',
                roleCode: 'CASHIER',
                permissions: ['orders.create', 'orders.view', 'payments.process'],
            }));

            const adminUser = await this.userRepo.save(this.userRepo.create({
                email: 'admin@nerdpos.com',
                passwordHash: await bcrypt.hash('Admin123!', 10),
                firstName: 'Admin',
                lastName: 'User',
                roleId: adminRole.id,
                pinCode: '0000',
                isActive: true,
            }));

            await this.userRepo.save(this.userRepo.create({
                email: 'manager@nerdpos.com',
                passwordHash: await bcrypt.hash('Manager123!', 10),
                firstName: 'Ahmed',
                lastName: 'Al-Mansour',
                roleId: managerRole.id,
                storeId: mainStore.id,
                pinCode: '1111',
                isActive: true,
            }));

            await this.userRepo.save(this.userRepo.create({
                email: 'cashier@nerdpos.com',
                passwordHash: await bcrypt.hash('Cashier123!', 10),
                firstName: 'Fatima',
                lastName: 'Al-Said',
                roleId: cashierRole.id,
                storeId: mainStore.id,
                pinCode: '2222',
                isActive: true,
            }));

            // 6. Devices
            console.log('🖥️  Creating devices...');
            await this.deviceRepo.save([
                this.deviceRepo.create({
                    deviceName: 'POS Terminal 1',
                    deviceCode: 'POS-001',
                    deviceType: 'POS',
                    storeId: mainStore.id,
                    isActive: true,
                }),
                this.deviceRepo.create({
                    deviceName: 'Kitchen Display',
                    deviceCode: 'KDS-001',
                    deviceType: 'KDS',
                    storeId: mainStore.id,
                    isActive: true,
                }),
            ]);

            // 7. Payment Methods
            console.log('💳 Creating payment methods...');
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

            // 8. Categories
            console.log('📂 Creating categories...');
            const burgersCategory = await this.categoryRepo.save(this.categoryRepo.create({
                name: 'Burgers',
                nameAr: 'برجر',
                displayOrder: 1,
            }));

            const pizzaCategory = await this.categoryRepo.save(this.categoryRepo.create({
                name: 'Pizza',
                nameAr: 'بيتزا',
                displayOrder: 2,
            }));

            const drinksCategory = await this.categoryRepo.save(this.categoryRepo.create({
                name: 'Drinks',
                nameAr: 'مشروبات',
                displayOrder: 3,
            }));

            const dessertsCategory = await this.categoryRepo.save(this.categoryRepo.create({
                name: 'Desserts',
                nameAr: 'حلويات',
                displayOrder: 4,
            }));

            // 9. Modifiers
            console.log('🔧 Creating modifiers...');
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
                    priceAdjustment: 5,
                    displayOrder: 2,
                }),
                this.modifierOptionRepo.create({
                    modifier: sizeModifier,
                    optionName: 'Large',
                    translations: { ar: { name: 'كبير' } },
                    priceAdjustment: 10,
                    displayOrder: 3,
                }),
            ]);

            const toppingsModifier = await this.modifierRepo.save(this.modifierRepo.create({
                modifierName: 'Extra Toppings',
                translations: { ar: { name: 'إضافات' } },
                isRequired: false,
                minSelections: 0,
                maxSelections: 5,
                displayOrder: 2,
            }));

            await this.modifierOptionRepo.save([
                this.modifierOptionRepo.create({
                    modifier: toppingsModifier,
                    optionName: 'Extra Cheese',
                    translations: { ar: { name: 'جبن إضافي' } },
                    priceAdjustment: 3,
                    displayOrder: 1,
                }),
                this.modifierOptionRepo.create({
                    modifier: toppingsModifier,
                    optionName: 'Bacon',
                    translations: { ar: { name: 'لحم مقدد' } },
                    priceAdjustment: 5,
                    displayOrder: 2,
                }),
            ]);

            // 10. Products
            console.log('🍔 Creating products...');
            const classicBurger = await this.productRepo.save(this.productRepo.create({
                sku: 'BURGER-001',
                name: 'Classic Burger',
                nameAr: 'برجر كلاسيك',
                type: ProductType.STANDARD,
                salePrice: 35,
                costPrice: 15,
                isKitchenItem: true,
                category: burgersCategory,
            }));

            const chickenBurger = await this.productRepo.save(this.productRepo.create({
                sku: 'BURGER-002',
                name: 'Chicken Burger',
                nameAr: 'برجر دجاج',
                type: ProductType.STANDARD,
                salePrice: 30,
                costPrice: 12,
                isKitchenItem: true,
                category: burgersCategory,
            }));

            const margheritaPizza = await this.productRepo.save(this.productRepo.create({
                sku: 'PIZZA-001',
                name: 'Margherita Pizza',
                nameAr: 'بيتزا مارجريتا',
                type: ProductType.STANDARD,
                salePrice: 45,
                costPrice: 20,
                isKitchenItem: true,
                category: pizzaCategory,
            }));

            const pepperoniPizza = await this.productRepo.save(this.productRepo.create({
                sku: 'PIZZA-002',
                name: 'Pepperoni Pizza',
                nameAr: 'بيتزا ببروني',
                type: ProductType.STANDARD,
                salePrice: 50,
                costPrice: 22,
                isKitchenItem: true,
                category: pizzaCategory,
            }));

            const cola = await this.productRepo.save(this.productRepo.create({
                sku: 'DRINK-001',
                name: 'Cola',
                nameAr: 'كولا',
                type: ProductType.STANDARD,
                salePrice: 8,
                costPrice: 3,
                category: drinksCategory,
            }));

            const orangeJuice = await this.productRepo.save(this.productRepo.create({
                sku: 'DRINK-002',
                name: 'Orange Juice',
                nameAr: 'عصير برتقال',
                type: ProductType.STANDARD,
                salePrice: 12,
                costPrice: 5,
                category: drinksCategory,
            }));

            const iceCream = await this.productRepo.save(this.productRepo.create({
                sku: 'DESSERT-001',
                name: 'Ice Cream',
                nameAr: 'آيس كريم',
                type: ProductType.STANDARD,
                salePrice: 15,
                costPrice: 6,
                category: dessertsCategory,
            }));

            // 11. Customers
            console.log('👤 Creating customers...');
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
                this.customerRepo.create({
                    customerCode: 'CUST-003',
                    firstName: 'Mohammed',
                    lastName: 'Al-Otaibi',
                    phone: '+966509876543',
                    email: 'mohammed@test.com',
                }),
            ]);

            console.log('✅ Comprehensive seed completed!');
            console.log('📊 Summary:');
            console.log(`   - Organizations: 1`);
            console.log(`   - Stores: 2`);
            console.log(`   - Warehouses: 1`);
            console.log(`   - Tax Profiles: 1`);
            console.log(`   - Roles: 3`);
            console.log(`   - Users: 3 (admin@nerdpos.com / Manager123!)`);
            console.log(`   - Devices: 2`);
            console.log(`   - Payment Methods: 3`);
            console.log(`   - Categories: 4`);
            console.log(`   - Products: 7`);
            console.log(`   - Modifiers: 2 (with 5 options)`);
            console.log(`   - Customers: 3`);

            // ================== PHASE 2 MODULES ===================

            // 12. Kitchen Stations
            console.log('🍳 Creating kitchen stations...');
            const kitchenStations = await this.kitchenStationRepo.save([
                this.kitchenStationRepo.create({
                    stationName: 'Grill Station',
                    stationCode: 'GRILL',
                    storeId: mainStore.id,
                    color: '#EF4444',
                    isActive: true,
                    displayOrder: 1,
                }),
                this.kitchenStationRepo.create({
                    stationName: 'Fryer Station',
                    stationCode: 'FRYER',
                    storeId: mainStore.id,
                    color: '#F59E0B',
                    isActive: true,
                    displayOrder: 2,
                }),
                this.kitchenStationRepo.create({
                    stationName: 'Cold Station',
                    stationCode: 'COLD',
                    storeId: mainStore.id,
                    color: '#3B82F6',
                    isActive: true,
                    displayOrder: 3,
                }),
                this.kitchenStationRepo.create({
                    stationName: 'Salad Station',
                    stationCode: 'SALAD',
                    storeId: mainStore.id,
                    color: '#10B981',
                    isActive: true,
                    displayOrder: 4,
                }),
                this.kitchenStationRepo.create({
                    stationName: 'Dessert Station',
                    stationCode: 'DESSERT',
                    storeId: mainStore.id,
                    color: '#8B5CF6',
                    isActive: true,
                    displayOrder: 5,
                }),
            ]);

            // Link products to kitchen stations (will be done via migration/update later)
            // Note: Product entity may need kitchenStation relation field added
            console.log('  ℹ️  Kitchen station linking will be configured separately');

            // 13. Table Zones
            console.log('🏢 Creating table zones...');
            const tableZones = await this.tableZoneRepo.save([
                this.tableZoneRepo.create({
                    zoneName: 'Main Floor',
                    storeId: mainStore.id,
                    color: '#3B82F6',
                    displayOrder: 1,
                    isActive: true,
                }),
                this.tableZoneRepo.create({
                    zoneName: 'Outdoor Seating',
                    storeId: mainStore.id,
                    color: '#10B981',
                    displayOrder: 2,
                    isActive: true,
                }),
                this.tableZoneRepo.create({
                    zoneName: 'VIP Section',
                    storeId: mainStore.id,
                    color: '#F59E0B',
                    displayOrder: 3,
                    isActive: true,
                }),
            ]);

            // 14. Tables
            console.log('🪑 Creating tables...');
            const tables = await this.tableRepo.save([
                // Main Floor tables
                this.tableRepo.create({
                    tableNumber: 'T1',
                    zone: tableZones[0],
                    storeId: mainStore.id,
                    minSeats: 2,
                    maxSeats: 4,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                    floorPosition: { x: 100, y: 100, width: 80, height: 80, shape: 'rectangle' },
                }),
                this.tableRepo.create({
                    tableNumber: 'T2',
                    zone: tableZones[0],
                    storeId: mainStore.id,
                    minSeats: 2,
                    maxSeats: 4,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                    floorPosition: { x: 200, y: 100, width: 80, height: 80, shape: 'rectangle' },
                }),
                this.tableRepo.create({
                    tableNumber: 'T3',
                    zone: tableZones[0],
                    storeId: mainStore.id,
                    minSeats: 4,
                    maxSeats: 6,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                    floorPosition: { x: 300, y: 100, width: 120, height: 80, shape: 'rectangle' },
                }),
                // Outdoor tables
                this.tableRepo.create({
                    tableNumber: 'O1',
                    zone: tableZones[1],
                    storeId: mainStore.id,
                    minSeats: 2,
                    maxSeats: 2,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                    floorPosition: { x: 100, y: 300, width: 60, height: 60, shape: 'circle' },
                }),
                this.tableRepo.create({
                    tableNumber: 'O2',
                    zone: tableZones[1],
                    storeId: mainStore.id,
                    minSeats: 2,
                    maxSeats: 4,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                    floorPosition: { x: 200, y: 300, width: 80, height: 60, shape: 'oval' },
                }),
                // VIP tables
                this.tableRepo.create({
                    tableNumber: 'VIP1',
                    zone: tableZones[2],
                    storeId: mainStore.id,
                    minSeats: 4,
                    maxSeats: 8,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                    floorPosition: { x: 500, y: 100, width: 160, height: 120, shape: 'rectangle' },
                }),
                this.tableRepo.create({
                    tableNumber: 'VIP2',
                    zone: tableZones[2],
                    storeId: mainStore.id,
                    minSeats: 6,
                    maxSeats: 10,
                    status: 'AVAILABLE' as any,
                    isActive: true,
                    floorPosition: { x: 500, y: 250, width: 180, height: 140, shape: 'rectangle' },
                }),
            ]);

            // 15. Reservations
            console.log('📅 Creating sample reservations...');
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            await this.reservationRepo.save([
                this.reservationRepo.create({
                    reservationNumber: `RES-${Date.now()}-1`,
                    table: tables[5], // VIP1
                    storeId: mainStore.id,
                    customerName: 'Ahmed Al-Farsi',
                    customerPhone: '+966501234567',
                    partySize: 6,
                    reservationDate: tomorrow,
                    reservationTime: '19:00',
                    durationMinutes: 120,
                    status: 'PENDING' as any,
                    notes: 'Birthday celebration',
                    specialRequests: 'Need birthday cake',
                }),
                this.reservationRepo.create({
                    reservationNumber: `RES-${Date.now()}-2`,
                    table: tables[2], // T3
                    storeId: mainStore.id,
                    customerName: 'Fatima Mohammad',
                    customerPhone: '+966507654321',
                    partySize: 4,
                    reservationDate: today,
                    reservationTime: '20:30',
                    durationMinutes: 90,
                    status: 'CONFIRMED' as any,
                    confirmedAt: new Date(),
                }),
            ]);

            console.log('✅ Comprehensive seed with Phase 2 modules completed!');
            console.log('📊 Phase 2 Summary:');
            console.log(`   - Kitchen Stations: 5`);
            console.log(`   - Table Zones: 3`);
            console.log(`   - Tables: 7`);
            console.log(`   - Reservations: 2`);

            return {
                success: true,
                summary: {
                    organizations: 1,
                    stores: 2,
                    users: 3,
                    roles: 3,
                    products: 7,
                    customers: 3,
                    paymentMethods: 3,
                    kitchenStations: 5,
                    tableZones: 3,
                    tables: 7,
                    reservations: 2,
                },
            };
        } catch (error) {
            console.error('❌ Seed failed:', error);
            throw error;
        }
    }
}
