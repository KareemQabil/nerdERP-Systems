import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMove } from '../entities/stock-move.entity';

@Controller('stock-moves')
export class StockMovesController {
    constructor(
        @InjectRepository(StockMove)
        private readonly stockMoveRepo: Repository<StockMove>,
    ) { }

    @Get()
    async findAll(@Query('warehouseId') warehouseId?: string, @Query('productId') productId?: string): Promise<StockMove[]> {
        const where: any = {};
        if (warehouseId) where.warehouse = { id: warehouseId };
        if (productId) where.product = { id: productId };
        return await this.stockMoveRepo.find({
            where,
            order: { createdAt: 'DESC' },
            relations: ['product', 'warehouse', 'batch'],
            take: 100 // Limit results
        });
    }
}
