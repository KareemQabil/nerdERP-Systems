import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { ZatcaService } from './services/zatca.service';
import { HashChainService } from './services/hash-chain.service';
import { QRGeneratorService } from './services/qr-generator.service';
import { XMLGeneratorService } from './services/xml-generator.service';
import { ZatcaController } from './zatca.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SalesOrder])],
    controllers: [ZatcaController],
    providers: [
        ZatcaService,
        HashChainService,
        QRGeneratorService,
        XMLGeneratorService,
    ],
    exports: [ZatcaService], // Export for use in Sales module
})
export class ZatcaModule { }
