import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentMethodService } from './services/payment-method.service';
import { PaymentMethodController } from './controllers/payment-method.controller';

@Module({
    imports: [TypeOrmModule.forFeature([PaymentMethod])],
    controllers: [PaymentMethodController],
    providers: [PaymentMethodService],
    exports: [PaymentMethodService],
})
export class PaymentsModule { }
