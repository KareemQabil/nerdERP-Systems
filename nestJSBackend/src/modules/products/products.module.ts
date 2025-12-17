import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { CategoriesService } from './services/categories.service';
import { ProductsService } from './services/products.service';
import { CategoriesController } from './controllers/categories.controller';
import { ProductsController } from './controllers/products.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Product, ProductCategory])],
    controllers: [CategoriesController, ProductsController],
    providers: [CategoriesService, ProductsService],
    exports: [ProductsService, CategoriesService],
})
export class ProductsModule { }
