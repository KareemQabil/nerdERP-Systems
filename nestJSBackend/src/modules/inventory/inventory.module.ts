import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryBatch } from './entities/inventory-batch.entity';
import { StockMove } from './entities/stock-move.entity';
import { StockReservation } from './entities/stock-reservation.entity';
import { WasteEntry } from './entities/waste-entry.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Recipe } from './entities/recipe.entity';
import { UnitConversion } from './entities/unit-conversion.entity';
import { StockTransfer, StockTransferItem } from './entities/stock-transfer.entity';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder, PurchaseOrderItem } from './entities/purchase-order.entity';
import { StockAlert } from './entities/stock-alert.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryService } from './services/inventory.service';
import { WarehousesService } from './services/warehouses.service';
import { RecipesService } from './services/recipes.service';
import { RecipeBomService } from './services/recipe-bom.service';
import { StockAlertService } from './services/stock-alert.service';
import { InventoryController } from './controllers/inventory.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { StockMovesController } from './controllers/stock-moves.controller';
import { StockAlertController } from './controllers/stock-alert.controller';
import { PurchasesController } from './controllers/purchases.controller';
import { InventoryGateway } from './inventory.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            InventoryBatch,
            StockMove,
            StockReservation,
            WasteEntry,
            Warehouse,
            Recipe,
            UnitConversion,
            StockTransfer,
            StockTransferItem,
            Supplier,
            PurchaseOrder,
            PurchaseOrderItem,
            StockAlert,
            Product
        ]),
    ],
    controllers: [InventoryController, WarehousesController, StockMovesController, StockAlertController, PurchasesController],
    providers: [InventoryService, WarehousesService, RecipesService, RecipeBomService, StockAlertService, InventoryGateway],
    exports: [InventoryService, WarehousesService, StockAlertService],
})
export class InventoryModule { }

