import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { AddStockDto, DeductStockDto } from '../dto/stock-operation.dto';
import { InventoryBatch } from '../entities/inventory-batch.entity';
import { StockMove } from '../entities/stock-move.entity';

@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    /**
     * Get inventory summary grouped by product and warehouse
     */
    @Get('summary')
    async getSummary(@Query('warehouseId') warehouseId?: string) {
        const data = await this.inventoryService.getInventorySummary(warehouseId);
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get all batches with optional filters
     */
    @Get('batches')
    async getBatches(
        @Query('warehouseId') warehouseId?: string,
        @Query('productId') productId?: string,
        @Query('qualityStatus') qualityStatus?: string,
        @Query('expiringWithinDays') expiringWithinDays?: string,
    ) {
        const data = await this.inventoryService.getBatches({
            warehouseId,
            productId,
            qualityStatus,
            expiringWithinDays: expiringWithinDays ? parseInt(expiringWithinDays, 10) : undefined,
        });
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Add stock to inventory (creates new batch)
     */
    @Post('add')
    async addStock(@Body() dto: AddStockDto): Promise<InventoryBatch> {
        return await this.inventoryService.addStock(dto);
    }

    /**
     * Deduct stock from inventory (FIFO)
     */
    @Post('deduct')
    async deductStock(@Body() dto: DeductStockDto): Promise<StockMove[]> {
        return await this.inventoryService.deductInventory(dto);
    }
}
