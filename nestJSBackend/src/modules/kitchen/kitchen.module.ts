import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitchenStation } from './entities/kitchen-station.entity';
import { KitchenTicket, KitchenTicketItem } from './entities/kitchen-ticket.entity';
import { Printer } from './entities/printer.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { KitchenService } from './services/kitchen.service';
import { KitchenController } from './controllers/kitchen.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([KitchenStation, KitchenTicket, KitchenTicketItem, SalesOrder, Printer]),
    ],
    controllers: [KitchenController],
    providers: [KitchenService],
    exports: [KitchenService],
})
export class KitchenModule { }
