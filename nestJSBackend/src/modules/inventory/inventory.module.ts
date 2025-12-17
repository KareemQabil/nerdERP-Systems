import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { StockMove } from './entities/stock-move.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Recipe } from './entities/recipe.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryService } from './services/inventory.service';
import { WarehousesService } from './services/warehouses.service';
import { RecipesService } from './services/recipes.service';
import { InventoryController } from './controllers/inventory.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { StockMovesController } from './controllers/stock-moves.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            InventoryBatch,
            StockMove,
            Warehouse,
            Recipe,
            Product
        ]),
    ],
    controllers: [InventoryController, WarehousesController, StockMovesController],
    providers: [InventoryService, WarehousesService, RecipesService],
    exports: [InventoryService, WarehousesService],
})
export class InventoryModule { }
