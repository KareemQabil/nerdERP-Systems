import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericService } from '../../../common/services/generic.service';
import { Warehouse } from '../entities/warehouse.entity';

@Injectable()
export class WarehousesService extends GenericService<Warehouse> {
    constructor(
        @InjectRepository(Warehouse)
        repository: Repository<Warehouse>,
    ) {
        super(repository);
    }
}
