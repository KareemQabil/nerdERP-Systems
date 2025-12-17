import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TreeRepository } from 'typeorm';
import { GenericService } from '../../../common/services/generic.service';
import { ProductCategory } from '../entities/product-category.entity';

@Injectable()
export class CategoriesService extends GenericService<ProductCategory> {
    constructor(
        @InjectRepository(ProductCategory)
        private readonly categoryRepo: TreeRepository<ProductCategory>,
    ) {
        super(categoryRepo);
    }

    // Override findAll to return tree structure
    async findAll(): Promise<ProductCategory[]> {
        return await this.categoryRepo.findTrees();
    }
}
