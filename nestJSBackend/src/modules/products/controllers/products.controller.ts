import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CreateProductDto, UpdateProductDto } from '../dto/create-product.dto';
import { Product } from '../entities/product.entity';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    create(@Body() createDto: CreateProductDto): Promise<Product> {
        return this.productsService.create(createDto);
    }

    @Get()
    findAll(): Promise<Product[]> {
        return this.productsService.findAll({ relations: ['category'] });
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Product> {
        return this.productsService.findById(id);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateProductDto,
    ): Promise<Product> {
        return this.productsService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.productsService.remove(id);
    }
}
