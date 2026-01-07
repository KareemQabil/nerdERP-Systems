import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZatcaController } from './controllers/zatca.controller';
import { QrCodeService } from './services/qr-code.service';
import { DigitalSignatureService } from './services/digital-signature.service';
import { ReportingService } from './services/reporting.service';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { OrderItem } from '../sales/entities/order-item.entity';
import { SalesModule } from '../sales/sales.module';

/**
 * ZATCA Module
 *
 * Provides ZATCA (Saudi Arabian tax authority) compliance features.
 *
 * Features:
 * - QR code generation with TLV encoding
 * - Invoice hash chain for audit trail
 * - Tax reporting (daily, monthly)
 * - Void operation reporting
 * - ZATCA export format
 *
 * Simplified implementation (Phase 1):
 * - No X.509 certificates required
 * - Hash chain based integrity verification
 * - QR codes with base64 encoding
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([SalesOrder, OrderItem]),
        forwardRef(() => SalesModule),
    ],
    controllers: [ZatcaController],
    providers: [QrCodeService, DigitalSignatureService, ReportingService],
    exports: [QrCodeService, DigitalSignatureService, ReportingService],
})
export class ZatcaModule { }
