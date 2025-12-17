import type { SalesOrder } from '@/modules/sales/types/order.types';
import type { KitchenTicket } from '@/modules/kitchen/types/kitchen.types';

/**
 * Print Job Type
 */
export type PrintJobType = 'RECEIPT' | 'KITCHEN' | 'REPORT';

/**
 * Print Job Interface
 */
export interface PrintJob {
    id: string;
    type: PrintJobType;
    data: any;
    timestamp: string;
    status: 'pending' | 'printing' | 'success' | 'failed';
    error?: string;
}

/**
 * Receipt Data Interface
 */
export interface ReceiptData {
    order: SalesOrder;
    storeName: string;
    storeAddress: string;
    storeTaxId: string;
    cashierName: string;
    printDate: string;
}

/**
 * Kitchen Ticket Print Data
 */
export interface KitchenTicketPrintData {
    ticket: KitchenTicket;
    orderNumber: string;
    tableName?: string;
    printDate: string;
}

/**
 * Print Service
 * Hardware abstraction layer for printing
 * PRODUCTION: Integrates with ESC/POS printers, Star printers, etc.
 * DEVELOPMENT: Console simulation
 */
export class PrintService {
    private static printerConfig = {
        receiptPrinter: {
            name: 'Receipt Printer',
            type: 'ESC/POS',
            width: 42, // characters
            connected: true,
        },
        kitchenPrinter: {
            name: 'Kitchen Printer',
            type: 'ESC/POS',
            width: 48,
            connected: true,
        },
    };

    /**
     * Print receipt
     * @param receiptData - Order and store information
     */
    static async printReceipt(receiptData: ReceiptData): Promise<void> {
        const isDev = import.meta.env.DEV;

        if (isDev) {
            // Console simulation
            console.log('\n╔════════════════════════════════════════╗');
            console.log('║          RECEIPT PRINT JOB             ║');
            console.log('╚════════════════════════════════════════╝\n');
            console.log(`Store: ${receiptData.storeName}`);
            console.log(`Address: ${receiptData.storeAddress}`);
            console.log(`Tax ID: ${receiptData.storeTaxId}`);
            console.log('─'.repeat(42));
            console.log(`Order: ${receiptData.order.orderNumber}`);
            console.log(`Date: ${new Date(receiptData.printDate).toLocaleString('ar-SA')}`);
            console.log(`Cashier: ${receiptData.cashierName}`);
            console.log('─'.repeat(42));

            // Items
            if (receiptData.order.items) {
                receiptData.order.items.forEach(item => {
                    const qty = item.quantity;
                    const name = item.productName;
                    const price = item.lineTotal;
                    console.log(`${qty}x ${name}`.padEnd(30) + price.padStart(12));

                    // Modifiers
                    if (item.selectedModifiers && item.selectedModifiers.length > 0) {
                        item.selectedModifiers.forEach(mod => {
                            console.log(`   + ${mod.modifierName}: ${mod.optionName}`);
                        });
                    }

                    // Special instructions
                    if (item.specialInstructions) {
                        console.log(`   Note: ${item.specialInstructions}`);
                    }
                });
            }

            console.log('─'.repeat(42));
            console.log('Subtotal:'.padEnd(30) + receiptData.order.subtotal.padStart(12));

            if (receiptData.order.discountAmount !== '0.000') {
                console.log('Discount:'.padEnd(30) + `-${receiptData.order.discountAmount}`.padStart(12));
            }

            console.log('Tax (15%):'.padEnd(30) + receiptData.order.totalTax.padStart(12));
            console.log('═'.repeat(42));
            console.log('TOTAL:'.padEnd(30) + receiptData.order.totalGross.padStart(12) + ' SAR');
            console.log('═'.repeat(42));

            // ZATCA QR Code (if exists)
            if (receiptData.order.zatcaQrCode) {
                console.log('\nZATCA QR Code:');
                console.log(`[QR: ${receiptData.order.zatcaQrCode.slice(0, 20)}...]`);
            }

            console.log('\nThank you for your visit!');
            console.log('شكراً لزيارتكم');
            console.log('\n' + '═'.repeat(42) + '\n');

            // Simulate print delay
            await new Promise(resolve => setTimeout(resolve, 500));
        } else {
            // Production: Send to actual printer
            // Integration with printer library (e.g., escpos, react-thermal-printer)
            await this.sendToPrinter('RECEIPT', receiptData);
        }
    }

    /**
     * Print kitchen ticket
     * @param ticketData - Kitchen ticket information
     */
    static async printKitchenTicket(ticketData: KitchenTicketPrintData): Promise<void> {
        const isDev = import.meta.env.DEV;

        if (isDev) {
            // Console simulation
            console.log('\n╔════════════════════════════════════════════╗');
            console.log('║         KITCHEN TICKET PRINT               ║');
            console.log('╚════════════════════════════════════════════╝\n');
            console.log(`╔═══ ${ticketData.ticket.ticketNumber} ═══╗`);
            console.log(`Order: ${ticketData.orderNumber}`);
            if (ticketData.tableName) {
                console.log(`Table: ${ticketData.tableName}`);
            }
            console.log(`Time: ${new Date(ticketData.printDate).toLocaleTimeString('ar-SA')}`);
            console.log('─'.repeat(48));

            // Product
            console.log(`\n${ticketData.ticket.quantity}x ${ticketData.ticket.productName}`);

            // Modifiers
            if (ticketData.ticket.modifiersText) {
                console.log(`\nModifiers: ${ticketData.ticket.modifiersText}`);
            }

            // Special instructions (EMPHASIZED)
            if (ticketData.ticket.specialInstructions) {
                console.log('\n⚠️  SPECIAL INSTRUCTIONS:');
                console.log(`   ${ticketData.ticket.specialInstructions}`);
            }

            // Priority indicator
            if (ticketData.ticket.priority > 0) {
                console.log(`\n🔥 PRIORITY: ${ticketData.ticket.priority}`);
            }

            console.log('\n' + '═'.repeat(48) + '\n');

            // Simulate print delay
            await new Promise(resolve => setTimeout(resolve, 300));
        } else {
            // Production: Send to kitchen printer
            await this.sendToPrinter('KITCHEN', ticketData);
        }
    }

    /**
     * Print end-of-day report (Z-Report)
     * @param reportData - Session and sales summary
     */
    static async printZReport(reportData: any): Promise<void> {
        const isDev = import.meta.env.DEV;

        if (isDev) {
            console.log('\n╔════════════════════════════════════════╗');
            console.log('║          Z-REPORT (END OF DAY)         ║');
            console.log('╚════════════════════════════════════════╝\n');
            console.log(`Session: ${reportData.sessionNumber}`);
            console.log(`Date: ${new Date().toLocaleDateString('ar-SA')}`);
            console.log('─'.repeat(42));
            console.log('Sales Summary:');
            console.log(`  Total Sales: ${reportData.totalSales} SAR`);
            console.log(`  Cash Payments: ${reportData.cashPayments} SAR`);
            console.log(`  Card Payments: ${reportData.cardPayments} SAR`);
            console.log('─'.repeat(42));
            console.log('Cash Summary:');
            console.log(`  Opening Cash: ${reportData.openingCash} SAR`);
            console.log(`  Expected Cash: ${reportData.expectedCash} SAR`);
            console.log(`  Actual Cash: ${reportData.actualCash} SAR`);
            console.log(`  Difference: ${reportData.difference} SAR`);
            console.log('═'.repeat(42) + '\n');

            await new Promise(resolve => setTimeout(resolve, 800));
        } else {
            await this.sendToPrinter('REPORT', reportData);
        }
    }

    /**
     * Send data to physical printer
     * (Production implementation)
     */
    private static async sendToPrinter(type: PrintJobType, data: any): Promise<void> {
        // Production implementation:
        // 1. Format data according to printer protocol (ESC/POS, StarPRNT, etc.)
        // 2. Send to printer via USB, Network, or Bluetooth
        // 3. Handle printer errors

        console.log(`[PRODUCTION] Sending ${type} to printer...`);
        // Example: await escpos.print(formattedData);
    }

    /**
     * Check printer status
     */
    static async checkPrinterStatus(printerType: 'receipt' | 'kitchen'): Promise<boolean> {
        const isDev = import.meta.env.DEV;

        if (isDev) {
            // Simulate printer check
            return true;
        }

        // Production: Query actual printer status
        // Return: printer online/offline, paper status, errors
        return this.printerConfig[`${printerType}Printer`].connected;
    }
}
