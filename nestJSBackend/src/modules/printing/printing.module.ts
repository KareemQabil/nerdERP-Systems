import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintJob } from './entities/print-job.entity';
import { PrintingService } from './services/printing.service';
import { ReceiptGeneratorService } from './services/receipt-generator.service';
import { PrintQueueService } from './services/print-queue.service';
import { PrinterDriverService } from './services/printer-driver.service';
import { PrintingController } from './controllers/printing.controller';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { OrderItem } from '../sales/entities/order-item.entity';
import { Payment } from '../sales/entities/payment.entity';
import { EscPosGenerator } from './utils/esc-pos-generator';

/**
 * Printing Module
 *
 * Handles all printing operations for the POS system including:
 * - Customer receipts (80mm thermal)
 * - Kitchen tickets (58mm)
 * - A4 tax invoices (ZATCA compliant)
 * - Print queue management with retry logic
 * - Network printer driver (ESC/POS over TCP)
 */
@Module({
    imports: [TypeOrmModule.forFeature([PrintJob, SalesOrder, OrderItem, Payment])],
    controllers: [PrintingController],
    providers: [
        PrintingService,
        ReceiptGeneratorService,
        PrintQueueService,
        PrinterDriverService,
        EscPosGenerator,
    ],
    exports: [PrintingService, ReceiptGeneratorService, PrintQueueService, PrinterDriverService],
})
export class PrintingModule { }
