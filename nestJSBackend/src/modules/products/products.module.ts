import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { Modifier, ModifierOption, ProductModifier } from './entities/modifier.entity';
import { ProductVariant, Combo } from './entities/product-variant.entity';
import { CategoriesService } from './services/categories.service';
import { ProductsService } from './services/products.service';
import { ModifierService } from './services/modifier.service';
import { ProductVariantService } from './services/product-variant.service';
import { CategoriesController } from './controllers/categories.controller';
import { ProductsController } from './controllers/products.controller';
import { ModifierController } from './controllers/modifier.controller';
import { ProductVariantController } from './controllers/product-variant.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Product, ProductCategory, Modifier, ModifierOption, ProductModifier, ProductVariant, Combo])],
    controllers: [CategoriesController, ProductsController, ModifierController, ProductVariantController],
    providers: [CategoriesService, ProductsService, ModifierService, ProductVariantService],
    exports: [ProductsService, CategoriesService, ModifierService, ProductVariantService],
})
export class ProductsModule { }
