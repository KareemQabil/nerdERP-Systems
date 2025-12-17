import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'; // Import Repository specifically
import { GenericService } from '../../../common/services/generic.service';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsService extends GenericService<Product> {
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
    ) {
        super(productRepo);
    }
}
