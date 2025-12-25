import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import { createHash } from 'crypto';

@Injectable()
export class HashChainService {
    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
    ) { }

    /**
     * Get the hash of the last invoice for a specific device
     * This is critical for maintaining the hash chain
     */
    async getLastInvoiceHash(deviceId: string): Promise<string | null> {
        const lastOrder = await this.orderRepo
            .createQueryBuilder('order')
            .leftJoin('order.registerSession', 'session')
            .where('session.device_id = :deviceId', { deviceId })
            .andWhere('order.invoice_hash IS NOT NULL')
            .orderBy('order.created_at', 'DESC')
            .limit(1)
            .getOne();

        return lastOrder?.invoiceHash || null;
    }

    /**
     * Generate hash for an invoice
     * Hash = SHA-256(previousHash + orderData)
     */
    generateHash(order: SalesOrder, previousHash: string | null): string {
        const canonicalString = [
            order.orderNumber,
            order.createdAt.toISOString(),
            order.totalGross.toString(),
            order.totalTax.toString(),
            previousHash || 'GENESIS',
        ].join('|');

        return createHash('sha256')
            .update(canonicalString, 'utf8')
            .digest('hex');
    }

    /**
     * Validate the entire hash chain for a device
     * Ensures no tampering has occurred
     */
    async validateHashChain(deviceId: string): Promise<{
        valid: boolean;
        brokenAt?: string;
        message: string;
    }> {
        const orders = await this.orderRepo
            .createQueryBuilder('order')
            .leftJoin('order.registerSession', 'session')
            .where('session.device_id = :deviceId', { deviceId })
            .andWhere('order.invoice_hash IS NOT NULL')
            .orderBy('order.created_at', 'ASC')
            .getMany();

        if (orders.length === 0) {
            return { valid: true, message: 'No invoices to validate' };
        }

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            const expectedPreviousHash = i === 0 ? null : orders[i - 1].invoiceHash;

            // Check if previous hash matches
            if (order.previousHash !== expectedPreviousHash) {
                return {
                    valid: false,
                    brokenAt: order.orderNumber,
                    message: `Hash chain broken at invoice ${order.orderNumber}`,
                };
            }

            // Recalculate and verify current hash
            const calculatedHash = this.generateHash(order, order.previousHash);
            if (calculatedHash !== order.invoiceHash) {
                return {
                    valid: false,
                    brokenAt: order.orderNumber,
                    message: `Invalid hash at invoice ${order.orderNumber}`,
                };
            }
        }

        return {
            valid: true,
            message: `Hash chain valid for ${orders.length} invoices`,
        };
    }

    /**
     * Get hash chain statistics
     */
    async getHashChainStats(deviceId: string): Promise<{
        totalInvoices: number;
        firstInvoice?: string;
        lastInvoice?: string;
        lastHash?: string;
    }> {
        const result = await this.orderRepo
            .createQueryBuilder('order')
            .leftJoin('order.registerSession', 'session')
            .select('COUNT(*)', 'total')
            .addSelect('MIN(order.created_at)', 'first')
            .addSelect('MAX(order.created_at)', 'last')
            .where('session.device_id = :deviceId', { deviceId })
            .andWhere('order.invoice_hash IS NOT NULL')
            .getRawOne();

        const lastOrder = await this.orderRepo
            .createQueryBuilder('order')
            .leftJoin('order.registerSession', 'session')
            .where('session.device_id = :deviceId', { deviceId })
            .andWhere('order.invoice_hash IS NOT NULL')
            .orderBy('order.created_at', 'DESC')
            .limit(1)
            .getOne();

        return {
            totalInvoices: parseInt(result.total) || 0,
            firstInvoice: result.first,
            lastInvoice: result.last,
            lastHash: lastOrder?.invoiceHash,
        };
    }
}
