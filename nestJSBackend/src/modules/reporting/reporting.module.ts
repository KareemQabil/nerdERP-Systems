import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailySalesSummary, ShiftSummary } from './entities/reporting.entity';
import { SalesReportService } from './services/sales-report.service';
import { ReportingController } from './controllers/reporting.controller';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { OrderItem } from '../sales/entities/order-item.entity';
import { Payment } from '../sales/entities/payment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DailySalesSummary,
            ShiftSummary,
            SalesOrder,
            OrderItem,
            Payment,
        ]),
    ],
    providers: [SalesReportService],
    controllers: [ReportingController],
    exports: [SalesReportService],
})
export class ReportingModule { }
