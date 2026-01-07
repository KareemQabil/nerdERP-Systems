/**
 * Delivery Module
 * H-POS: Zone-based delivery and platform integrations
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryProvider, DeliveryOrder } from './entities/delivery-order.entity';
import { DeliveryZone } from './entities/delivery-zone.entity';
import { DeliveryDriver } from './entities/delivery-driver.entity';
import { DeliveryAssignment } from './entities/delivery-assignment.entity';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { SalesModule } from '../sales/sales.module';
import { DeliveryZoneService } from './services/delivery-zone.service';
import { DeliveryZoneController } from './controllers/delivery-zone.controller';
import { DeliveryService } from './services/delivery.service';
import { DeliveryDashboardService } from './services/delivery-dashboard.service';
import { DeliveryController } from './controllers/delivery.controller';
import { DeliveryGateway } from './delivery.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DeliveryProvider,
            DeliveryOrder,
            DeliveryZone,
            DeliveryDriver,
            DeliveryAssignment,
            SalesOrder,
        ]),
        SalesModule,
    ],
    controllers: [
        DeliveryZoneController,
        DeliveryController,
    ],
    providers: [
        DeliveryZoneService,
        DeliveryService,
        DeliveryDashboardService,
        DeliveryGateway,
    ],
    exports: [
        DeliveryZoneService,
        DeliveryService,
        DeliveryDashboardService,
    ],
})
export class DeliveryModule { }
