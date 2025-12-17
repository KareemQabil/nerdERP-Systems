import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
} from '@nestjs/common';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/create-category.dto';
import { ProductCategory } from '../entities/product-category.entity';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    create(@Body() createDto: CreateCategoryDto): Promise<ProductCategory> {
        return this.categoriesService.create(createDto);
    }

    @Get()
    findAll(): Promise<ProductCategory[]> {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<ProductCategory> {
        return this.categoriesService.findById(id);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateCategoryDto,
    ): Promise<ProductCategory> {
        return this.categoriesService.update(id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.categoriesService.remove(id);
    }
}
