import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table, TableZone } from './entities/table.entity';
import { Reservation } from './entities/reservation.entity';
import { TablesService } from './services/tables.service';
import { TablesController } from './controllers/tables.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Table, TableZone, Reservation]),
    ],
    controllers: [TablesController],
    providers: [TablesService],
    exports: [TablesService],
})
export class TablesModule { }
