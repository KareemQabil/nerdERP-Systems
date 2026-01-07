import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

/**
 * Invoice Hash Entity
 * Tracks the hash chain for ZATCA compliance
 *
 * Simplified implementation:
 * - Each invoice has a unique hash (SHA-256)
 * - Each invoice references the previous invoice's hash
 * - Creates an immutable chain for audit trail
 */
export interface InvoiceHash {
    id: string;
    orderId: string;
    invoiceHash: string;
    previousHash: string;
    invoiceNumber: string;
    createdAt: Date;
}

/**
 * Invoice Hash Data Structure
 * Contains the data to be hashed for each invoice
 */
export interface InvoiceHashData {
    orderId: string;
    invoiceNumber: string;
    timestamp: string;
    totalWithVat: string;
    vatAmount: string;
    vatNumber: string;
    previousHash: string;
}

/**
 * Digital Signature Service
 *
 * Manages the invoice hash chain for ZATCA compliance.
 *
 * Simplified approach (Phase 1):
 * - SHA-256 hash of invoice data
 * - Chain linking via previous hash reference
 * - No X.509 certificates required
 *
 * Hash Structure:
 * invoiceHash = SHA256(invoiceNumber + timestamp + total + vat + vatNo + previousHash)
 */
@Injectable()
export class DigitalSignatureService {
    // In-memory storage for hash chain (Phase 1)
    // For Phase 2, this should be stored in database
    private hashChain: Map<string, InvoiceHash> = new Map();
    private latestHash: string | null = null;

    /**
     * Generate invoice hash
     *
     * @param data Invoice data to hash
     * @returns Generated hash
     */
    generateInvoiceHash(data: InvoiceHashData): string {
        // Create hash string from invoice data
        const hashInput = this.buildHashInput(data);

        // Generate SHA-256 hash
        return crypto
            .createHash('sha256')
            .update(hashInput)
            .digest('hex');
    }

    /**
     * Create invoice hash chain entry
     *
     * @param data Invoice data
     * @returns Invoice hash entry with chain linkage
     */
    async createInvoiceHashEntry(data: InvoiceHashData): Promise<InvoiceHash> {
        // Get previous hash (latest in chain)
        const previousHash = this.latestHash || '';

        // Create hash data with previous hash
        const hashData: InvoiceHashData = {
            ...data,
            previousHash,
        };

        // Generate new hash
        const invoiceHash = this.generateInvoiceHash(hashData);

        // Create hash entry
        const entry: InvoiceHash = {
            id: crypto.randomUUID(),
            orderId: data.orderId,
            invoiceHash,
            previousHash,
            invoiceNumber: data.invoiceNumber,
            createdAt: new Date(),
        };

        // Store in chain
        this.hashChain.set(data.orderId, entry);
        this.latestHash = invoiceHash;

        return entry;
    }

    /**
     * Get invoice hash by order ID
     */
    getInvoiceHash(orderId: string): InvoiceHash | null {
        return this.hashChain.get(orderId) || null;
    }

    /**
     * Get latest hash in chain
     */
    getLatestHash(): string | null {
        return this.latestHash;
    }

    /**
     * Verify hash chain integrity
     * Validates that hashes are correctly linked
     */
    verifyHashChain(orderId: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Get the target invoice
        const targetInvoice = this.getInvoiceHash(orderId);
        if (!targetInvoice) {
            errors.push('Invoice not found in hash chain');
            return { valid: false, errors };
        }

        // For complete verification, we would need all invoices in the chain
        // For Phase 1, we verify the previous hash link exists
        if (targetInvoice.previousHash && targetInvoice.previousHash !== '') {
            // Verify that previous hash exists in chain
            const hasPreviousHash = Array.from(this.hashChain.values()).some(
                (entry) => entry.invoiceHash === targetInvoice.previousHash,
            );

            if (!hasPreviousHash) {
                errors.push(`Previous hash ${targetInvoice.previousHash} not found in chain`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Get hash chain segment for export
     * Returns a range of hashes for ZATCA reporting
     */
    getHashChainSegment(startDate: Date, endDate: Date): InvoiceHash[] {
        return Array.from(this.hashChain.values()).filter(
            (entry) => entry.createdAt >= startDate && entry.createdAt <= endDate,
        );
    }

    /**
     * Build hash input string
     * Concatenates all invoice data in specific order
     */
    private buildHashInput(data: InvoiceHashData): string {
        const parts = [
            data.invoiceNumber,
            data.timestamp,
            data.totalWithVat,
            data.vatAmount,
            data.vatNumber,
            data.previousHash,
        ];

        return parts.join('|');
    }

    /**
     * Generate invoice number
     * Format: INV-YYYYMMDD-SEQ (5-digit sequence)
     */
    generateInvoiceNumber(sequence: number, date: Date = new Date()): string {
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const seqStr = sequence.toString().padStart(5, '0');
        return `INV-${dateStr}-${seqStr}`;
    }

    /**
     * Validate hash data
     */
    validateHashData(data: InvoiceHashData): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.orderId || data.orderId.length === 0) {
            errors.push('Order ID is required');
        }

        if (!data.invoiceNumber || data.invoiceNumber.length === 0) {
            errors.push('Invoice number is required');
        }

        if (!data.timestamp || isNaN(Date.parse(data.timestamp))) {
            errors.push('Valid timestamp is required');
        }

        if (!data.totalWithVat || isNaN(parseFloat(data.totalWithVat))) {
            errors.push('Valid total with VAT is required');
        }

        if (!data.vatAmount || isNaN(parseFloat(data.vatAmount))) {
            errors.push('Valid VAT amount is required');
        }

        if (!data.vatNumber || !/^\d{15}$/.test(data.vatNumber)) {
            errors.push('VAT number must be 15 digits');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Get hash chain statistics
     */
    getHashChainStats(): {
        totalInvoices: number;
        latestHash: string | null;
        oldestEntry: Date | null;
        newestEntry: Date | null;
    } {
        const entries = Array.from(this.hashChain.values());

        if (entries.length === 0) {
            return {
                totalInvoices: 0,
                latestHash: null,
                oldestEntry: null,
                newestEntry: null,
            };
        }

        const sortedEntries = entries.sort((a, b) =>
            a.createdAt.getTime() - b.createdAt.getTime(),
        );

        return {
            totalInvoices: entries.length,
            latestHash: this.latestHash,
            oldestEntry: sortedEntries[0].createdAt,
            newestEntry: sortedEntries[sortedEntries.length - 1].createdAt,
        };
    }

    /**
     * Clear hash chain (for testing only)
     * WARNING: This breaks the chain integrity
     */
    clearHashChain(): void {
        this.hashChain.clear();
        this.latestHash = null;
    }
}
