import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { OrderItem } from '../sales/entities/order-item.entity';
import { Payment } from '../sales/entities/payment.entity';
import { InventoryBatch } from '../inventory/entities/inventory-batch.entity';
import { StockMove } from '../inventory/entities/stock-move.entity';
import { RegisterSession } from '../cash/entities/register-session.entity';
import { SalesReportsService } from './services/sales-reports.service';
import { InventoryReportsService } from './services/inventory-reports.service';
import { FinancialReportsService } from './services/financial-reports.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SalesOrder,
            OrderItem,
            Payment,
            InventoryBatch,
            StockMove,
            RegisterSession,
        ]),
    ],
    controllers: [ReportsController],
    providers: [
        SalesReportsService,
        InventoryReportsService,
        FinancialReportsService,
    ],
    exports: [
        SalesReportsService,
        InventoryReportsService,
        FinancialReportsService,
    ],
})
export class ReportingModule { }
