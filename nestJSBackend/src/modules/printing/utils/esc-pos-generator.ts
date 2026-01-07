/**
 * ESC/POS Generator Utility
 *
 * Generates ESC/POS protocol commands for thermal printers.
 * Compatible with Epson, Star, and most thermal receipt printers.
 *
 * References:
 * - Epson ESC/POS Reference Manual
 * - Star Online Technical Reference
 */

/**
 * ESC/POS Generator Class
 */
export class EscPosGenerator {
    // =========================================================================
    // CONSTANTS
    // =========================================================================

    // Control characters
    private readonly ESC = '\x1B'; // Escape
    private readonly GS = '\x1D';  // Group Separator
    private readonly DLE = '\x10'; // Data Link Escape
    private readonly EOT = '\x04'; // End of Transmission

    // Text formatting
    private readonly CTL_FF = '\x0C'; // Form Feed
    private readonly CTL_LF = '\x0A'; // Line Feed
    private readonly CTL_CR = '\x0D'; // Carriage Return
    private readonly HT = '\x09';     // Horizontal Tab

    // Alignment
    private readonly ALIGN_LEFT = '\x00';
    private readonly ALIGN_CENTER = '\x01';
    private readonly ALIGN_RIGHT = '\x02';

    // Barcode types
    private readonly BARCODE_UPC_A = '\x00';
    private readonly BARCODE_UPC_E = '\x01';
    private readonly BARCODE_EAN13 = '\x02';
    private readonly BARCODE_EAN8 = '\x03';
    private readonly BARCODE_CODE39 = '\x04';
    private readonly BARCODE_ITF = '\x05';
    private readonly BARCODE_CODABAR = '\x06';
    private readonly BARCODE_CODE93 = '\x07';
    private readonly BARCODE_CODE128 = '\x08';
    private readonly BARCODE_EAN128 = '\x09';
    private readonly BARCODE_GS1_128 = '\x09'; // Same as EAN128

    // Image encoding
    private readonly IMAGE_WIDTH_8DOT = false;
    private readonly IMAGE_WIDTH_DOUBLE = true;

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /**
     * Initialize printer (reset to default settings)
     */
    init(): Buffer {
        return Buffer.from(this.ESC + '@'); // ESC @ - Initialize
    }

    // =========================================================================
    // TEXT FORMATTING
    // =========================================================================

    /**
     * Set text alignment
     */
    align(alignment: 'LEFT' | 'CENTER' | 'RIGHT'): Buffer {
        let align = this.ALIGN_LEFT;
        if (alignment === 'CENTER') align = this.ALIGN_CENTER;
        if (alignment === 'RIGHT') align = this.ALIGN_RIGHT;

        return Buffer.from(this.ESC + 'a' + align); // ESC a n
    }

    /**
     * Set font (A or B)
     */
    font(font: 'A' | 'B'): Buffer {
        // Font A: 12x24, Font B: 9x17
        const fontCode = font === 'A' ? '\x00' : '\x01';
        return Buffer.from(this.ESC + 'M' + fontCode); // ESC M n
    }

    /**
     * Set text size (width and height multiplier)
     *
     * @param width - Width multiplier (1-8)
     * @param height - Height multiplier (1-8)
     */
    size(width: number, height: number): Buffer {
        // GS ! n - n = width (lower nibble) + height (upper nibble)
        // Width: 1-8, Height: 1-8
        const w = Math.min(8, Math.max(1, width)) - 1;
        const h = Math.min(8, Math.max(1, height)) - 1;
        const n = (h << 4) | w;
        return Buffer.from(this.GS + '!' + String.fromCharCode(n));
    }

    /**
     * Enable/bold text
     */
    bold(enabled: boolean): Buffer {
        return Buffer.from(this.ESC + (enabled ? 'E\x01' : 'E\x00')); // ESC E n
    }

    /**
     * Enable underline
     *
     * @param mode - 0=off, 1=single dot, 2=double dot
     */
    underline(mode: 0 | 1 | 2): Buffer {
        return Buffer.from(this.ESC + '-' + String.fromCharCode(mode)); // ESC - n
    }

    /**
     * Enable double-strike mode
     */
    doubleStrike(enabled: boolean): Buffer {
        return Buffer.from(this.ESC + 'G' + (enabled ? '\x01' : '\x00')); // ESC G n
    }

    /**
     * Enable upside-down printing
     */
    upsideDown(enabled: boolean): Buffer {
        return Buffer.from(this.ESC + '{' + (enabled ? '\x01' : '\x00')); // ESC { n
    }

    /**
     * Set character spacing
     */
    charSpacing(spacing: number): Buffer {
        // ESC SP n - Set right character spacing
        const n = Math.max(0, Math.min(255, spacing));
        return Buffer.from(this.ESC + ' ' + String.fromCharCode(n));
    }

    /**
     * Set line spacing
     */
    lineSpacing(dots: number): Buffer {
        // ESC 3 n - Set line spacing (in dots)
        const n = Math.max(0, Math.min(255, dots));
        return Buffer.from(this.ESC + '3' + String.fromCharCode(n));
    }

    /**
     * Reset line spacing to default
     */
    resetLineSpacing(): Buffer {
        return Buffer.from(this.ESC + '2'); // ESC 2
    }

    // =========================================================================
    // PRINTING
    // =========================================================================

    /**
     * Print text and line feed
     */
    text(text: string): Buffer {
        return Buffer.from(text + this.CTL_LF);
    }

    /**
     * Print text without line feed
     */
    raw(text: string): Buffer {
        return Buffer.from(text);
    }

    /**
     * Print empty lines
     */
    emptyLines(count: number): Buffer {
        return Buffer.from(this.CTL_LF.repeat(count));
    }

    /**
     * Print horizontal line
     */
    hr(width: number = 48, char: string = '-'): Buffer {
        return Buffer.from(char.repeat(width) + this.CTL_LF);
    }

    /**
     * Feed and cut
     */
    cut(mode: 'FULL' | 'PARTIAL' = 'PARTIAL'): Buffer {
        // GS V m n - Cut
        // m: 48=full, 49=partial
        const m = mode === 'FULL' ? '\x30' : '\x31';
        return Buffer.from(this.GS + 'V' + m + '\x00');
    }

    /**
     * Feed partial cut (with advance)
     */
    cutWithFeed(advanceDots: number = 80, mode: 'FULL' | 'PARTIAL' = 'PARTIAL'): Buffer {
        const m = mode === 'FULL' ? '\x30' : '\x31';
        const n = Math.min(255, advanceDots);
        return Buffer.from(this.GS + 'V' + m + String.fromCharCode(n));
    }

    // =========================================================================
    // CASH DRAWER
    // =========================================================================

    /**
     * Pulse cash drawer kick
     *
     * @param pin - Drawer pin (0 or 1)
     * @param onTime - On time in 2ms units (default: 100ms)
     * @param offTime - Off time in 2ms units (default: 100ms)
     */
    openDrawer(pin: 0 | 1 = 0, onTime: number = 50, offTime: number = 50): Buffer {
        // ESC p m t1 t2 - Pulse
        // m: 0=pin 2, 1=pin 5
        // t1: on time (in 2ms units)
        // t2: off time (in 2ms units)
        const m = pin === 0 ? '\x00' : '\x01';
        const t1 = Math.min(255, Math.max(3, onTime));
        const t2 = Math.min(255, Math.max(3, offTime));
        return Buffer.from(this.ESC + 'p' + m + String.fromCharCode(t1) + String.fromCharCode(t2));
    }

    // =========================================================================
    // BARCODES
    // =========================================================================

    /**
     * Print barcode
     *
     * @param type - Barcode type
     * @param data - Barcode data (numeric or alphanumeric)
     * @param options - Barcode options
     */
    barcode(
        type: string,
        data: string,
        options: {
            width?: 2 | 3; // Module width (2 or 3)
            height?: number; // Barcode height in dots
            font?: 'A' | 'B' | 'OFF'; // HRI font
            position?: 'BELOW' | 'ABOVE' | 'BOTH' | 'OFF'; // HRI position
        } = {},
    ): Buffer {
        const h = options.height || 162;
        const width = options.width || 2;
        const font = options.font === 'B' ? '\x01' : (options.font === 'OFF' ? '\x02' : '\x00');
        const position = options.position === 'ABOVE' ? '\x01' :
                        (options.position === 'BOTH' ? '\x02' :
                        (options.position === 'OFF' ? '\x03' : '\x00'));

        const typeCode = this.getBarcodeTypeCode(type);

        return Buffer.concat([
            // Set barcode height
            Buffer.from(this.ESC + 'h' + String.fromCharCode(h)),
            // Print barcode
            Buffer.from(this.GS + 'k' + typeCode + data + '\x00'),
        ]);
    }

    /**
     * Print QR code
     *
     * @param data - QR code data
     * @param size - QR code size (1-16, default 6)
     * @param correction - Error correction level (L/M/Q/H)
     */
    qrCode(data: string, size: number = 6, correction: 'L' | 'M' | 'Q' | 'H' = 'L'): Buffer {
        // QR Code printing requires model-specific commands
        // This is a basic implementation for common models

        const n1 = Math.min(16, Math.max(1, size));
        const n2 = correction === 'L' ? 0 : (correction === 'M' ? 1 : (correction === 'Q' ? 2 : 3));

        // QR Code: ESC Z n1 n2 data - Non-standard, varies by manufacturer
        // For Epson: Use GS ( k
        const dataLength = data.length + 3;
        const pL = dataLength & 0xFF;
        const pH = (dataLength >> 8) & 0xFF;

        return Buffer.concat([
            Buffer.from(this.GS + '(k' + String.fromCharCode(pL) + String.fromCharCode(pH) + '\x31\x49'),
            Buffer.from(data + '\x00'),
        ]);
    }

    // =========================================================================
    // IMAGES
    // =========================================================================

    /**
     * Print image (1-bit monochrome)
     *
     * @param imageData - Image data (1-bit per pixel, row-major)
     * @param width - Image width in dots
     * @param height - Image height in dots
     */
    image(imageData: Buffer, width: number, height: number): Buffer {
        // GS v 0 - Print raster bit image
        // Format: GS v 0 m xL xH yL yH d1...dk

        const bytesPerLine = Math.ceil(width / 8);
        const xL = bytesPerLine & 0xFF;
        const xH = (bytesPerLine >> 8) & 0xFF;
        const yL = height & 0xFF;
        const yH = (height >> 8) & 0xFF;

        return Buffer.concat([
            Buffer.from(this.GS + 'v0' + String.fromCharCode(xL) + String.fromCharCode(xH) + String.fromCharCode(yL) + String.fromCharCode(yH)),
            imageData,
        ]);
    }

    // =========================================================================
    // STATUS
    // =========================================================================

    /**
     * Get real-time printer status
     */
    getPrinterStatus(): Buffer {
        // DLE EOT n - Real-time status transmission
        // n=1: Printer status
        return Buffer.from(this.DLE + this.EOT + '\x01');
    }

    /**
     * Get offline status
     */
    getOfflineStatus(): Buffer {
        // DLE EOT n - n=2: Offline status
        return Buffer.from(this.DLE + this.EOT + '\x02');
    }

    /**
     * Get error status
     */
    getErrorStatus(): Buffer {
        // DLE EOT n - n=3: Error status
        return Buffer.from(this.DLE + this.EOT + '\x03');
    }

    /**
     * Get paper sensor status
     */
    getPaperStatus(): Buffer {
        // DLE EOT n - n=4: Paper sensor status
        return Buffer.from(this.DLE + this.EOT + '\x04');
    }

    // =========================================================================
    // HIGH-LEVEL HELPERS
    // =========================================================================

    /**
     * Generate a complete receipt
     */
    generateReceipt(data: {
        header?: string[];
        items: Array<{ name: string; qty: number; price: string; total?: string }>;
        subtotals?: Array<{ label: string; value: string }>;
        total: string;
        footer?: string[];
        barcode?: string;
        qrCode?: string;
        cut?: boolean;
    }): Buffer {
        const commands: Buffer[] = [];

        // Initialize
        commands.push(this.init());

        // Header (centered, bold, large)
        if (data.header) {
            commands.push(this.align('CENTER'));
            commands.push(this.bold(true));
            commands.push(this.size(2, 2));
            for (const line of data.header) {
                commands.push(this.text(line));
            }
            commands.push(this.size(1, 1));
            commands.push(this.bold(false));
            commands.push(this.emptyLines(1));
        }

        // Items (left aligned)
        commands.push(this.align('LEFT'));
        commands.push(this.hr(42));
        for (const item of data.items) {
            commands.push(this.text(`${item.qty}x ${item.name}`));
            if (item.total) {
                commands.push(this.align('RIGHT'));
                commands.push(this.text(item.total));
                commands.push(this.align('LEFT'));
            }
        }
        commands.push(this.hr(42));
        commands.push(this.emptyLines(1));

        // Subtotals
        if (data.subtotals) {
            for (const sub of data.subtotals) {
                commands.push(this.text(`${sub.label}`));
                commands.push(this.align('RIGHT'));
                commands.push(this.text(sub.value));
                commands.push(this.align('LEFT'));
            }
            commands.push(this.emptyLines(1));
        }

        // Total (large, bold)
        commands.push(this.bold(true));
        commands.push(this.size(2, 2));
        commands.push(this.text(`TOTAL: ${data.total}`));
        commands.push(this.size(1, 1));
        commands.push(this.bold(false));
        commands.push(this.emptyLines(2));

        // Barcode
        if (data.barcode) {
            commands.push(this.align('CENTER'));
            commands.push(this.barcode('CODE128', data.barcode));
            commands.push(this.emptyLines(1));
        }

        // QR Code
        if (data.qrCode) {
            commands.push(this.align('CENTER'));
            commands.push(this.qrCode(data.qrCode));
            commands.push(this.emptyLines(1));
        }

        // Footer (centered, small)
        if (data.footer) {
            commands.push(this.align('CENTER'));
            commands.push(this.size(1, 1));
            for (const line of data.footer) {
                commands.push(this.text(line));
            }
        }

        // Cut
        if (data.cut !== false) {
            commands.push(this.cut('PARTIAL'));
        }

        return Buffer.concat(commands);
    }

    /**
     * Generate a kitchen ticket
     */
    generateKitchenTicket(data: {
        orderNumber: string;
        table?: string;
        items: Array<{ name: string; qty: number; notes?: string }>;
        notes?: string;
        cut?: boolean;
    }): Buffer {
        const commands: Buffer[] = [];

        commands.push(this.init());

        // Order number (large, centered, bold)
        commands.push(this.align('CENTER'));
        commands.push(this.bold(true));
        commands.push(this.size(2, 2));
        commands.push(this.text(`ORDER #${data.orderNumber}`));
        commands.push(this.size(1, 1));
        commands.push(this.text(data.table || 'TAKEAWAY'));
        commands.push(this.bold(false));
        commands.push(this.emptyLines(2));

        // Items
        commands.push(this.align('LEFT'));
        commands.push(this.hr(32));
        for (const item of data.items) {
            commands.push(this.bold(true));
            commands.push(this.text(`${item.qty}x ${item.name}`));
            commands.push(this.bold(false));
            if (item.notes) {
                commands.push(this.text(`   (${item.notes})`));
            }
        }
        commands.push(this.hr(32));

        // Order notes
        if (data.notes) {
            commands.push(this.emptyLines(1));
            commands.push(this.bold(true));
            commands.push(this.text('NOTES:'));
            commands.push(this.bold(false));
            commands.push(this.text(data.notes));
        }

        commands.push(this.emptyLines(3));

        if (data.cut !== false) {
            commands.push(this.cut('PARTIAL'));
        }

        return Buffer.concat(commands);
    }

    /**
     * Generate a test page
     */
    generateTestPage(): Buffer {
        const commands: Buffer[] = [];

        commands.push(this.init());

        commands.push(this.align('CENTER'));
        commands.push(this.bold(true));
        commands.push(this.size(2, 2));
        commands.push(this.text('PRINTER TEST'));
        commands.push(this.size(1, 1));
        commands.push(this.bold(false));
        commands.push(this.emptyLines(2));

        commands.push(this.align('LEFT'));
        commands.push(this.text('Font A: Normal text'));
        commands.push(this.font('B'));
        commands.push(this.text('Font B: Smaller text'));
        commands.push(this.font('A'));

        commands.push(this.emptyLines(1));
        commands.push(this.bold(true));
        commands.push(this.text('Bold text'));
        commands.push(this.bold(false));

        commands.push(this.emptyLines(1));
        commands.push(this.underline(1));
        commands.push(this.text('Underlined text'));
        commands.push(this.underline(0));

        commands.push(this.emptyLines(1));
        commands.push(this.size(2, 2));
        commands.push(this.text('Double size'));
        commands.push(this.size(1, 1));

        commands.push(this.emptyLines(1));
        commands.push(this.align('CENTER'));
        commands.push(this.text('CENTERED'));
        commands.push(this.align('LEFT'));
        commands.push(this.text('Left'));
        commands.push(this.align('RIGHT'));
        commands.push(this.text('Right'));
        commands.push(this.align('LEFT'));

        commands.push(this.emptyLines(2));
        commands.push(this.barcode('CODE128', '123456789'));
        commands.push(this.emptyLines(2));

        commands.push(this.qrCode('https://example.com', 6));
        commands.push(this.emptyLines(2));

        commands.push(this.align('CENTER'));
        commands.push(this.text('Test complete!'));
        commands.push(this.emptyLines(3));

        commands.push(this.cut('PARTIAL'));

        return Buffer.concat(commands);
    }

    /**
     * Generate from generic data structure
     */
    generateFromData(data: any): Buffer {
        if (data.type === 'RECEIPT') {
            return this.generateReceipt(data);
        }
        if (data.type === 'KITCHEN_TICKET') {
            return this.generateKitchenTicket(data);
        }
        if (data.type === 'TEST') {
            return this.generateTestPage();
        }

        // Fallback: simple text
        return this.text(JSON.stringify(data, null, 2));
    }

    // =========================================================================
    // UTILITY
    // =========================================================================

    private getBarcodeTypeCode(type: string): string {
        const types: Record<string, string> = {
            'UPC_A': this.BARCODE_UPC_A,
            'UPC_E': this.BARCODE_UPC_E,
            'EAN13': this.BARCODE_EAN13,
            'EAN8': this.BARCODE_EAN8,
            'CODE39': this.BARCODE_CODE39,
            'ITF': this.BARCODE_ITF,
            'CODABAR': this.BARCODE_CODABAR,
            'CODE93': this.BARCODE_CODE93,
            'CODE128': this.BARCODE_CODE128,
            'EAN128': this.BARCODE_EAN128,
        };
        return types[type.toUpperCase()] || this.BARCODE_CODE128;
    }
}
