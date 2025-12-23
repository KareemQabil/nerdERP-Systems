import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { randomUUID } from 'crypto';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import { HashChainService } from './hash-chain.service';
import { QRGeneratorService } from './qr-generator.service';
import { XMLGeneratorService } from './xml-generator.service';
import { ZatcaProcessResult, ZatcaQRData, ZatcaInvoiceData } from '../types/zatca.types';

@Injectable()
export class ZatcaService {
    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        private readonly hashChainService: HashChainService,
        private readonly qrGeneratorService: QRGeneratorService,
        private readonly xmlGeneratorService: XMLGeneratorService,
    ) { }

    /**
     * Main method to process an invoice for ZATCA compliance
     * This should be called when an order is completed
     */
    @Transactional()
    async processInvoice(order: SalesOrder, deviceId: string): Promise<ZatcaProcessResult> {
        // 1. Get previous hash in chain
        const previousHash = await this.hashChainService.getLastInvoiceHash(deviceId);

        // 2. Generate new hash
        const invoiceHash = this.hashChainService.generateHash(order, previousHash);

        // 3. Generate ZATCA UUID
        const zatcaUuid = randomUUID();

        // 4. Generate QR code
        const qrData: ZatcaQRData = {
            sellerName: 'Nerd ERP', // TODO: Get from organization settings
            vatRegistration: '300000000000003', // TODO: Get from organization settings
            timestamp: order.createdAt.toISOString(),
            totalWithVat: order.totalGross.toString(),
            vatAmount: order.totalTax.toString(),
        };
        const qrCode = await this.qrGeneratorService.generateQRCode(qrData);

        // 5. Update order with ZATCA fields
        order.invoiceHash = invoiceHash;
        order.previousHash = previousHash;
        order.zatcaUuid = zatcaUuid;
        order.zatcaQrCode = qrCode;

        // 6. Save updated order
        await this.orderRepo.save(order);

        return {
            invoiceHash,
            previousHash,
            zatcaUuid,
            qrCode,
        };
    }

    /**
     * Generate XML invoice for an order
     */
    async generateXMLInvoice(orderId: string): Promise<string> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'items.product'],
        });

        if (!order) {
            throw new BadRequestException('Order not found');
        }

        const invoiceData: ZatcaInvoiceData = {
            invoiceNumber: order.orderNumber,
            issueDate: order.createdAt.toISOString().split('T')[0],
            seller: {
                name: 'Nerd ERP', // TODO: Get from organization
                vatRegistration: '300000000000003', // TODO: Get from organization
                address: '123 Main St', // TODO: Get from organization
                city: 'Riyadh', // TODO: Get from organization
                postalCode: '12345', // TODO: Get from organization
                country: 'SA',
            },
            items: order.items.map((item) => ({
                name: item.productName,
                quantity: item.quantity.toString(),
                unitPrice: item.unitPrice.toString(),
                taxRate: '15', // TODO: Get from product/tax profile
                taxAmount: (parseFloat(item.total.toString()) * 0.15).toFixed(3),
                lineTotal: item.total.toString(),
            })),
            totalExcludingVat: order.totalNet.toString(),
            totalVat: order.totalTax.toString(),
            totalIncludingVat: order.totalGross.toString(),
        };

        return this.xmlGeneratorService.generateInvoiceXML(invoiceData, order.invoiceHash);
    }

    /**
     * Validate hash chain for a device
     */
    async validateHashChain(deviceId: string) {
        return await this.hashChainService.validateHashChain(deviceId);
    }

    /**
     * Get hash chain statistics
     */
    async getHashChainStats(deviceId: string) {
        return await this.hashChainService.getHashChainStats(deviceId);
    }
}
