import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitchenStation } from './entities/kitchen-station.entity';
import { KitchenTicket, KitchenTicketItem } from './entities/kitchen-ticket.entity';
import { Printer } from './entities/printer.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            KitchenStation,
            KitchenTicket,
            KitchenTicketItem,
            Printer,
        ]),
    ],
    providers: [],
    exports: [],
})
export class KitchenModule { }
