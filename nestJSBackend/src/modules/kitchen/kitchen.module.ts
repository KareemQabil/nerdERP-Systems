import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitchenStation } from './entities/kitchen-station.entity';
import { KitchenTicket, KitchenTicketItem } from './entities/kitchen-ticket.entity';
import { Printer } from './entities/printer.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { OrderItem } from '../sales/entities/order-item.entity';
import { KitchenService } from './services/kitchen.service';
import { StationAssignmentService } from './services/station-assignment.service';
import { KitchenController } from './controllers/kitchen.controller';
import { KitchenGateway } from './kitchen.gateway';
import { InventoryModule } from '../inventory/inventory.module';
import { Product } from '../products/entities/product.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            KitchenStation,
            KitchenTicket,
            KitchenTicketItem,
            SalesOrder,
            OrderItem,
            Printer,
            Product,
        ]),
        forwardRef(() => InventoryModule),
    ],
    controllers: [KitchenController],
    providers: [KitchenService, StationAssignmentService, KitchenGateway],
    exports: [KitchenService, StationAssignmentService, KitchenGateway],
})
export class KitchenModule { }

