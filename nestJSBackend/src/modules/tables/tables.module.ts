import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table, TableZone } from './entities/table.entity';
import { Reservation } from './entities/reservation.entity';
import { TablesService } from './services/tables.service';
import { TablesController } from './controllers/tables.controller';
import { TablesGateway } from './tables.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([Table, TableZone, Reservation]),
    ],
    controllers: [TablesController],
    providers: [TablesService, TablesGateway],
    exports: [TablesService],
})
export class TablesModule { }
