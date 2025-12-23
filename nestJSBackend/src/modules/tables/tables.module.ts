import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableZone, Table } from './entities/table.entity';
import { Reservation } from './entities/reservation.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TableZone,
            Table,
            Reservation,
        ]),
    ],
    providers: [],
    exports: [],
})
export class TablesModule { }
