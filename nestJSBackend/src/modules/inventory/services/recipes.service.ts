import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericService } from '../../../common/services/generic.service';
import { Recipe } from '../entities/recipe.entity';

@Injectable()
export class RecipesService extends GenericService<Recipe> {
    constructor(
        @InjectRepository(Recipe)
        repository: Repository<Recipe>,
    ) {
        super(repository);
    }
}
