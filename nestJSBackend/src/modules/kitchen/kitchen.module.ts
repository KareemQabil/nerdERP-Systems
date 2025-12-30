import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitchenStation } from './entities/kitchen-station.entity';
import { KitchenTicket, KitchenTicketItem } from './entities/kitchen-ticket.entity';
import { Printer } from './entities/printer.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { OrderItem } from '../sales/entities/order-item.entity';
import { KitchenService } from './services/kitchen.service';
import { KitchenController } from './controllers/kitchen.controller';
import { KitchenGateway } from './kitchen.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([KitchenStation, KitchenTicket, KitchenTicketItem, SalesOrder, OrderItem, Printer]),
    ],
    controllers: [KitchenController],
    providers: [KitchenService, KitchenGateway],
    exports: [KitchenService, KitchenGateway],
})
export class KitchenModule { }
