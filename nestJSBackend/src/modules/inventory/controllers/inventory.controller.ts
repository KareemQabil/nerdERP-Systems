import { Body, Controller, Post } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { AddStockDto, DeductStockDto } from '../dto/stock-operation.dto';
import { InventoryBatch } from '../entities/inventory-batch.entity';
import { StockMove } from '../entities/stock-move.entity';

@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post('add')
    async addStock(@Body() dto: AddStockDto): Promise<InventoryBatch> {
        return await this.inventoryService.addStock(dto);
    }

    @Post('deduct')
    async deductStock(@Body() dto: DeductStockDto): Promise<StockMove[]> {
        return await this.inventoryService.deductInventory(dto);
    }
}
