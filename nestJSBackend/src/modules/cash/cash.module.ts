import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisterSession } from './entities/register-session.entity';
import { RegisterHandover } from './entities/register-handover.entity';
import { CashTransaction } from '../sales/entities/cash-transaction.entity';
import { Payment } from '../sales/entities/payment.entity';
import { RegisterSessionService } from './services/register-session.service';
import { RegisterSessionController } from './controllers/register-session.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            RegisterSession,
            RegisterHandover,
            CashTransaction,
            Payment
        ]),
    ],
    controllers: [RegisterSessionController],
    providers: [RegisterSessionService],
    exports: [RegisterSessionService],
})
export class CashModule { }

