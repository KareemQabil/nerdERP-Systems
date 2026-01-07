import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * ZATCA QR Code Data Structure
 *
 * TLV (Tag-Length-Value) encoded QR data for Saudi Arabian tax compliance.
 * Simplified implementation for Phase 1.
 *
 * Tags:
 * - 01: Seller name
 * - 02: VAT registration number
 * - 03: Timestamp (ISO 8601)
 * - 04: Total with VAT (3 decimals)
 * - 05: VAT amount (3 decimals)
 */
export interface ZatcaQRData {
    seller: string;
    vatNo: string;
    timestamp: string;
    total: string;
    vat: string;
}

/**
 * QR Code Service
 *
 * Generates ZATCA-compliant QR codes for tax invoices.
 *
 * TLV Encoding Format:
 * Each tag is encoded as: TAG (1 byte) + LENGTH (1 byte) + VALUE (N bytes)
 *
 * Example: "0108NerdPOS001020123456789012342024-01-01T12:00:00Z040000000123456780050000000001234568"
 */
@Injectable()
export class QrCodeService {
    private readonly TAG_SELLER = '01';
    private readonly TAG_VAT_NO = '02';
    private readonly TAG_TIMESTAMP = '03';
    private readonly TAG_TOTAL = '04';
    private readonly TAG_VAT = '05';

    /**
     * Generate ZATCA QR code data for an invoice
     *
     * @param data Invoice data
     * @returns Base64 encoded TLV string (for frontend rendering)
     */
    generateQRCode(data: ZatcaQRData): string {
        // Build TLV encoded string
        const tlvString = this.buildTLVString(data);

        // Return base64 encoded for frontend
        // Frontend will decode and use with qrcode.react
        return Buffer.from(tlvString).toString('base64');
    }

    /**
     * Generate decoded QR data object
     * Useful for debugging and display
     */
    generateQRDataObject(data: ZatcaQRData): ZatcaQRData {
        return {
            seller: this.sanitizeString(data.seller),
            vatNo: this.sanitizeString(data.vatNo),
            timestamp: data.timestamp,
            total: this.formatAmount(data.total),
            vat: this.formatAmount(data.vat),
        };
    }

    /**
     * Generate QR code for frontend (decoded JSON format)
     * Frontend can parse this to display QR details
     */
    generateQrForFrontend(data: ZatcaQRData): object {
        return {
            seller: this.sanitizeString(data.seller),
            vatNo: this.sanitizeString(data.vatNo),
            timestamp: data.timestamp,
            total: this.formatAmount(data.total),
            vat: this.formatAmount(data.vat),
            // Also include the encoded version for QR scanning
            encoded: this.generateQRCode(data),
        };
    }

    /**
     * Parse and validate QR code data
     *
     * @param base64Data Base64 encoded TLV string
     * @returns Parsed QR data object
     */
    parseQRCode(base64Data: string): ZatcaQRData | null {
        try {
            const tlvString = Buffer.from(base64Data, 'base64').toString();
            return this.parseTLVString(tlvString);
        } catch (error) {
            console.error('[QrCodeService] Failed to parse QR code:', error);
            return null;
        }
    }

    /**
     * Build TLV encoded string
     */
    private buildTLVString(data: ZatcaQRData): string {
        const seller = this.sanitizeString(data.seller);
        const vatNo = this.sanitizeString(data.vatNo);
        const timestamp = data.timestamp;
        const total = this.formatAmount(data.total);
        const vat = this.formatAmount(data.vat);

        // Build TLV parts
        const parts = [
            `${this.TAG_SELLER}${this.padLength(seller.length)}${seller}`,
            `${this.TAG_VAT_NO}${this.padLength(vatNo.length)}${vatNo}`,
            `${this.TAG_TIMESTAMP}${this.padLength(timestamp.length)}${timestamp}`,
            `${this.TAG_TOTAL}${this.padLength(total.length)}${total}`,
            `${this.TAG_VAT}${this.padLength(vat.length)}${vat}`,
        ];

        return parts.join('');
    }

    /**
     * Parse TLV encoded string
     */
    private parseTLVString(tlvString: string): ZatcaQRData | null {
        try {
            const result: any = {};
            let index = 0;

            while (index < tlvString.length) {
                const tag = tlvString.substring(index, index + 2);
                index += 2;

                const length = parseInt(tlvString.substring(index, index + 2));
                index += 2;

                const value = tlvString.substring(index, index + length);
                index += length;

                switch (tag) {
                    case this.TAG_SELLER:
                        result.seller = value;
                        break;
                    case this.TAG_VAT_NO:
                        result.vatNo = value;
                        break;
                    case this.TAG_TIMESTAMP:
                        result.timestamp = value;
                        break;
                    case this.TAG_TOTAL:
                        result.total = value;
                        break;
                    case this.TAG_VAT:
                        result.vat = value;
                        break;
                }
            }

            return result as ZatcaQRData;
        } catch (error) {
            console.error('[QrCodeService] TLV parsing error:', error);
            return null;
        }
    }

    /**
     * Sanitize string for TLV encoding
     * Removes non-alphanumeric characters except spaces and hyphens
     */
    private sanitizeString(str: string): string {
        // Keep only alphanumeric, spaces, and some special characters
        return str.replace(/[^a-zA-Z0-9\s\-\.]/g, '').trim();
    }

    /**
     * Format amount to 3 decimal places (ZATCA requirement)
     */
    private formatAmount(amount: string | number): string {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return num.toFixed(3);
    }

    /**
     * Pad length to 2 digits
     */
    private padLength(length: number): string {
        return length.toString().padStart(2, '0');
    }

    /**
     * Validate QR code data
     */
    validateQRData(data: ZatcaQRData): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.seller || data.seller.length === 0) {
            errors.push('Seller name is required');
        }

        if (!data.vatNo || !/^\d{15}$/.test(data.vatNo)) {
            errors.push('VAT number must be 15 digits');
        }

        if (!this.isValidTimestamp(data.timestamp)) {
            errors.push('Invalid timestamp format');
        }

        const total = parseFloat(data.total);
        if (isNaN(total) || total < 0) {
            errors.push('Total must be a positive number');
        }

        const vat = parseFloat(data.vat);
        if (isNaN(vat) || vat < 0) {
            errors.push('VAT must be a positive number');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate ISO 8601 timestamp
     */
    private isValidTimestamp(timestamp: string): boolean {
        return !isNaN(Date.parse(timestamp));
    }
}
