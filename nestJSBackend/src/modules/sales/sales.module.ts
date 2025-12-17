import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from '../inventory/inventory.module';
import { SalesOrder } from './entities/sales-order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { SalesService } from './services/sales.service';
import { SalesController } from './controllers/sales.controller';
import { Product } from '../products/entities/product.entity';
import { RegisterSession } from '../cash/entities/register-session.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SalesOrder,
            OrderItem,
            Payment,
            Product,
            RegisterSession
        ]),
        InventoryModule,
    ],
    controllers: [SalesController],
    providers: [SalesService],
    exports: [SalesService],
})
export class SalesModule { }
