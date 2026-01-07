import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AggregatorService } from './services/aggregator.service';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { OrderItem } from '../sales/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { SalesModule } from '../sales/sales.module';
import { CalculationModule } from '../calculation/calculation.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([SalesOrder, OrderItem, Product]),
        ConfigModule,
        forwardRef(() => SalesModule),
        forwardRef(() => CalculationModule),
        OrganizationModule,
    ],
    providers: [AggregatorService],
    exports: [AggregatorService],
})
export class AggregatorModule { }
