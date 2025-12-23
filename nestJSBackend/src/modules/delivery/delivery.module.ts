import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryProvider, DeliveryOrder } from './entities/delivery-order.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DeliveryProvider,
            DeliveryOrder,
        ]),
    ],
    providers: [],
    exports: [],
})
export class DeliveryModule { }
