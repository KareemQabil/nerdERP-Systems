import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentMethod } from './entities/payment-method.entity';
import { Payment } from '../sales/entities/payment.entity';
import { Refund } from '../sales/entities/refund.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { PaymentMethodService } from './services/payment-method.service';
import { PaymentProcessingService } from './services/payment-processing.service';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { PaymentMethodController } from './controllers/payment-method.controller';
import { PaymentProcessingController } from './controllers/payment-processing.controller';
import { AuditLogService } from '../../common/services/audit-log.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([PaymentMethod, Payment, Refund, SalesOrder]),
        ConfigModule,
    ],
    controllers: [
        PaymentMethodController,
        PaymentProcessingController,
    ],
    providers: [
        PaymentMethodService,
        PaymentProcessingService,
        PaymentGatewayService,
        AuditLogService,
    ],
    exports: [
        PaymentMethodService,
        PaymentProcessingService,
        PaymentGatewayService,
    ],
})
export class PaymentsModule { }
