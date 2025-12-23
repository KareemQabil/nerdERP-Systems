import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { ZatcaQRData } from '../types/zatca.types';

@Injectable()
export class QRGeneratorService {
    /**
     * Generate ZATCA-compliant QR code using TLV encoding
     * TLV = Tag-Length-Value format required by ZATCA
     */
    async generateQRCode(data: ZatcaQRData): Promise<string> {
        const tlvEncoded = this.encodeTLV(data);
        const base64Encoded = tlvEncoded.toString('base64');

        // Generate QR code as data URL
        return await QRCode.toDataURL(base64Encoded, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
        });
    }

    /**
     * Encode data in TLV (Tag-Length-Value) format
     * This is the ZATCA-mandated format for QR codes
     * 
     * Tags:
     * 1 = Seller name
     * 2 = VAT registration number
     * 3 = Timestamp
     * 4 = Total with VAT
     * 5 = VAT amount
     */
    private encodeTLV(data: ZatcaQRData): Buffer {
        const fields = [
            { tag: 1, value: data.sellerName },
            { tag: 2, value: data.vatRegistration },
            { tag: 3, value: data.timestamp },
            { tag: 4, value: data.totalWithVat },
            { tag: 5, value: data.vatAmount },
        ];

        const buffers: Buffer[] = [];

        for (const field of fields) {
            const valueBuffer = Buffer.from(field.value, 'utf8');
            const tagBuffer = Buffer.from([field.tag]);
            const lengthBuffer = Buffer.from([valueBuffer.length]);

            buffers.push(tagBuffer, lengthBuffer, valueBuffer);
        }

        return Buffer.concat(buffers);
    }

    /**
     * Decode TLV data (for validation/testing)
     */
    decodeTLV(tlvBuffer: Buffer): Map<number, string> {
        const result = new Map<number, string>();
        let offset = 0;

        while (offset < tlvBuffer.length) {
            const tag = tlvBuffer[offset];
            const length = tlvBuffer[offset + 1];
            const value = tlvBuffer.slice(offset + 2, offset + 2 + length).toString('utf8');

            result.set(tag, value);
            offset += 2 + length;
        }

        return result;
    }

    /**
     * Generate simple text QR code (for testing or non-ZATCA use)
     */
    async generateSimpleQR(text: string): Promise<string> {
        return await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 200,
        });
    }
}
