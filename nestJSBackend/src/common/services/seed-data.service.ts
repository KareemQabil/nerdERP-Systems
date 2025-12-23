import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../modules/organization/entities/organization.entity';
import { Store, StoreType } from '../../modules/organization/entities/store.entity';
import { TaxProfile, TaxDefinition, TaxCalculationType } from '../../modules/organization/entities/tax-profile.entity';
import { Product, ProductType } from '../../modules/products/entities/product.entity';
import { ProductCategory } from '../../modules/products/entities/product-category.entity';
import { Customer } from '../../modules/promotions/entities/customer.entity';

/**
 * Seed Data Service - Creates test data on server start
 */
@Injectable()
export class SeedDataService {
    constructor(
        @InjectRepository(Organization) private orgRepo: Repository<Organization>,
        @InjectRepository(Store) private storeRepo: Repository<Store>,
        @InjectRepository(TaxProfile) private taxProfileRepo: Repository<TaxProfile>,
        @InjectRepository(TaxDefinition) private taxDefRepo: Repository<TaxDefinition>,
        @InjectRepository(ProductCategory) private categoryRepo: Repository<ProductCategory>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    ) { }

    async seed() {
        console.log('🌱 Seeding database...');

        // Organization
        const org = this.orgRepo.create({
            legalName: 'NerdPOS Demo LLC',
            taxId: 'SA1234567890',
            countryCode: 'SA',
            baseCurrency: 'SAR',
        });
        await this.orgRepo.save(org);

        // Store
        const store = this.storeRepo.create({
            storeCode: 'MAIN',
            storeType: StoreType.RESTAURANT,
            translations: {
                en: { name: 'Main Branch - Riyadh' },
                ar: { name: 'الفرع الرئيسي - الرياض' },
            },
            timezone: 'Asia/Riyadh',
            address: {
                street: 'King Fahd Road',
                city: 'Riyadh',
                country: 'SA',
            },
        });
        await this.storeRepo.save(store);

        // Tax Profile
        const taxProfile = this.taxProfileRepo.create({
            profileName: 'Saudi VAT 15%',
            isDefault: true,
        });
        await this.taxProfileRepo.save(taxProfile);

        const taxDef = this.taxDefRepo.create({
            taxName: 'VAT',
            taxCode: 'VAT15',
            calculationType: TaxCalculationType.PERCENTAGE,
            taxRate: 15,
            isInclusive: false,
            displayOrder: 1,
        });
        taxDef.taxProfile = taxProfile;
        await this.taxDefRepo.save(taxDef);

        // Categories
        const foodCat = this.categoryRepo.create({
            name: 'Food',
            nameAr: 'طعام',
        });
        await this.categoryRepo.save(foodCat);

        const bevCat = this.categoryRepo.create({
            name: 'Beverages',
            nameAr: 'مشروبات',
        });
        await this.categoryRepo.save(bevCat);

        // Products
        const burger = this.productRepo.create({
            sku: 'BURGER001',
            name: 'Classic Burger',
            nameAr: 'برجر كلاسيك',
            type: ProductType.STANDARD,
            salePrice: 35,
            costPrice: 15,
            isKitchenItem: true,
        });
        burger.category = foodCat;
        await this.productRepo.save(burger);

        const pizza = this.productRepo.create({
            sku: 'PIZZA001',
            name: 'Margherita Pizza',
            nameAr: 'بيتزا مارجريتا',
            type: ProductType.STANDARD,
            salePrice: 45,
            costPrice: 20,
            isKitchenItem: true,
        });
        pizza.category = foodCat;
        await this.productRepo.save(pizza);

        const cola = this.productRepo.create({
            sku: 'COLA001',
            name: 'Cola',
            nameAr: 'كولا',
            type: ProductType.STANDARD,
            salePrice: 8,
            costPrice: 3,
        });
        cola.category = bevCat;
        await this.productRepo.save(cola);

        // Customers
        await this.customerRepo.save([
            this.customerRepo.create({
                customerCode: 'CUST001',
                firstName: 'Ahmed',
                lastName: 'Al-Farsi',
                phone: '+966501234567',
                email: 'ahmed@test.com',
            }),
            this.customerRepo.create({
                customerCode: 'CUST002',
                firstName: 'Fatima',
                lastName: 'Al-Rashid',
                phone: '+966507654321',
                email: 'fatima@test.com',
            }),
        ]);

        console.log('✅ Seed data created!');
    }
}
