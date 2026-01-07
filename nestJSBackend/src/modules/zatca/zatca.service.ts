import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import * as QRCode from 'qrcode';

/**
 * ZATCA (Zakat, Tax and Customs Authority) Compliance Service
 *
 * Implements Saudi Arabian E-invoicing requirements:
 * - Invoice hash generation (SHA-256)
 * - QR code generation with TLV encoding
 * - Invoice verification and signing
 *
 * @see https://zatca.gov.sa/E-InvoicingSystems/Basic/
 */
@Injectable()
export class ZATCAService {
    private readonly logger = new Logger(ZATCAService.name);

    /**
     * Generate SHA-256 hash for invoice (ZATCA compliance)
     *
     * The hash is computed from the invoice data in a specific format:
     * 1. Seller name
     * 2. Tax number
     * 3. Invoice date
     * 4. Invoice total (with VAT)
     * 5. VAT amount
     *
     * @param invoiceData Invoice data to hash
     * @returns Hex-encoded SHA-256 hash
     */
    generateInvoiceHash(invoiceData: {
        sellerName: string;
        taxNumber: string;
        invoiceDate: string; // ISO 8601 format
        invoiceTotal: string; // Decimal string
        vatAmount: string; // Decimal string
    }): string {
        // Normalize and concatenate the invoice data
        // Format: sellerName|taxNumber|invoiceDate|invoiceTotal|vatAmount
        const normalizedData = [
            this.normalizeString(invoiceData.sellerName),
            this.normalizeString(invoiceData.taxNumber),
            invoiceData.invoiceDate,
            this.formatDecimal(invoiceData.invoiceTotal),
            this.formatDecimal(invoiceData.vatAmount),
        ].join('|');

        this.logger.debug(`Normalized invoice data for hashing: ${normalizedData}`);

        // Generate SHA-256 hash
        const hash = createHash('sha256').update(normalizedData, 'utf8').digest('hex');

        this.logger.log(`Generated invoice hash: ${hash}`);
        return hash;
    }

    /**
     * Generate TLV (Tag-Length-Value) encoded QR code data
     *
     * ZATCA QR code format (simplified):
     * - Tag 1: Seller name
     * - Tag 2: Tax number
     * - Tag 3: Invoice date
     * - Tag 4: Invoice total (with VAT)
     * - Tag 5: VAT amount
     *
     * Each TLV triplet is: [Tag (1 byte)][Length (2 bytes)][Value (n bytes)]
     *
     * @param invoiceData Invoice data for QR code
     * @returns Base64-encoded TLV data
     */
    generateQRCodeData(invoiceData: {
        sellerName: string;
        taxNumber: string;
        invoiceDate: string;
        invoiceTotal: string;
        vatAmount: string;
    }): string {
        const fields = [
            { tag: 0x01, value: this.normalizeString(invoiceData.sellerName) },
            { tag: 0x02, value: this.normalizeString(invoiceData.taxNumber) },
            { tag: 0x03, value: invoiceData.invoiceDate },
            { tag: 0x04, value: this.formatDecimal(invoiceData.invoiceTotal) },
            { tag: 0x05, value: this.formatDecimal(invoiceData.vatAmount) },
        ];

        // Build TLV encoded data
        let tlvData = Buffer.alloc(0);

        for (const field of fields) {
            const valueBuffer = Buffer.from(field.value, 'utf8');
            const length = valueBuffer.length;

            // TLV triplet: [Tag (1 byte)][Length (2 bytes big-endian)][Value (n bytes)]
            const triplet = Buffer.alloc(1 + 2 + length);
            triplet.writeUInt8(field.tag, 0);
            triplet.writeUInt16BE(length, 1);
            valueBuffer.copy(triplet, 3);

            tlvData = Buffer.concat([tlvData, triplet]);
        }

        // Return as Base64
        const base64Data = tlvData.toString('base64');
        this.logger.log(`Generated QR code TLV data: ${base64Data.substring(0, 50)}...`);
        return base64Data;
    }

    /**
     * Generate QR code image as Data URL
     *
     * @param qrCodeData TLV-encoded QR code data
     * @returns Data URL of QR code PNG image
     */
    async generateQRCodeImage(qrCodeData: string): Promise<string> {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'M',
            });

            this.logger.debug('Generated QR code image');
            return qrCodeDataURL;
        } catch (error) {
            this.logger.error(`Failed to generate QR code: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify invoice hash (for validation)
     *
     * @param invoiceData Invoice data
     * @param providedHash Hash to verify against
     * @returns true if hash matches
     */
    verifyInvoiceHash(
        invoiceData: {
            sellerName: string;
            taxNumber: string;
            invoiceDate: string;
            invoiceTotal: string;
            vatAmount: string;
        },
        providedHash: string,
    ): boolean {
        const computedHash = this.generateInvoiceHash(invoiceData);
        const isValid = computedHash === providedHash;

        if (!isValid) {
            this.logger.warn(`Invoice hash mismatch: expected ${computedHash}, got ${providedHash}`);
        }

        return isValid;
    }

    /**
     * Normalize string for hashing
     * - Trim whitespace
     * - Convert to uppercase
     * - Remove extra spaces
     */
    private normalizeString(value: string): string {
        return value
            .trim()
            .toUpperCase()
            .replace(/\s+/g, ' ');
    }

    /**
     * Format decimal number for hashing
     * - Remove leading zeros
     * - Keep 3 decimal places
     * - Remove thousand separators
     */
    private formatDecimal(value: string): string {
        const num = parseFloat(value.replace(/,/g, ''));
        if (isNaN(num)) {
            return '0.000';
        }
        return num.toFixed(3);
    }

    /**
     * Generate sequential invoice number
     *
     * Format: INV-{YYYYMMDD}-{SEQUENCE}
     * Example: INV-20250104-0001
     *
     * @param date Invoice date
     * @param sequence Daily sequence number (padded to 4 digits)
     * @returns Formatted invoice number
     */
    generateInvoiceNumber(date: Date, sequence: number): string {
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const sequenceStr = sequence.toString().padStart(4, '0');
        return `INV-${dateStr}-${sequenceStr}`;
    }

    /**
     * Validate invoice number format
     *
     * @param invoiceNumber Invoice number to validate
     * @returns true if valid format
     */
    validateInvoiceNumber(invoiceNumber: string): boolean {
        // Format: INV-YYYYMMDD-SEQUENCE
        const regex = /^INV-\d{8}-\d{4}$/;
        return regex.test(invoiceNumber);
    }

    /**
     * Extract date from invoice number
     *
     * @param invoiceNumber Invoice number
     * @returns Extracted date or null if invalid
     */
    extractInvoiceDate(invoiceNumber: string): Date | null {
        if (!this.validateInvoiceNumber(invoiceNumber)) {
            return null;
        }

        const match = invoiceNumber.match(/^INV-(\d{4})(\d{2})(\d{2})-/);
        if (!match) {
            return null;
        }

        const [, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
}
