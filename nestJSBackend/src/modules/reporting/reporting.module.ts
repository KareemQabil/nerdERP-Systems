import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailySalesSummary, ShiftSummary } from './entities/reporting.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DailySalesSummary,
            ShiftSummary,
        ]),
    ],
    providers: [],
    exports: [],
})
export class ReportingModule { }
