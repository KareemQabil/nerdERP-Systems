import type { CartItem, Customer, Table, OrderType, Discount, PaymentMethod } from '../types/pos.types';

interface ReceiptData {
    orderNumber: string;
    timestamp: Date;
    cashier: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    orderType: OrderType;
    customer?: Customer;
    table?: Table;
    appliedDiscount?: { discount: Discount; value: number } | null;
    paymentMethod?: PaymentMethod;
    paidAmount?: number;
    change?: number;
}

/**
 * Print Service
 * Handles receipt printing simulation
 */
export class PrintService {
    /**
     * Print a receipt
     * In production, this would send to a thermal printer via USB or network
     * For now, it simulates printing by logging and returning success
     */
    static async printReceipt(data: ReceiptData): Promise<boolean> {
        try {
            console.log('🖨️ Printing Receipt...');
            console.log('═'.repeat(40));
            console.log(`Order #: ${data.orderNumber}`);
            console.log(`Date: ${data.timestamp.toLocaleString('ar-SA')}`);
            console.log(`Cashier: ${data.cashier}`);
            console.log(`Type: ${data.orderType}`);

            if (data.customer) {
                console.log(`Customer: ${data.customer.name}`);
                console.log(`Phone: ${data.customer.phone}`);
            }

            if (data.table) {
                console.log(`Table: ${data.table.number}`);
            }

            console.log('─'.repeat(40));
            console.log('Items:');
            data.items.forEach((item) => {
                console.log(`  ${item.quantity}x ${item.product.name} - ${item.total.toFixed(2)} SAR`);
                if (item.modifiers && item.modifiers.length > 0) {
                    item.modifiers.forEach((mod) => {
                        console.log(`    + ${mod.name} (+${mod.price.toFixed(2)} SAR)`);
                    });
                }
                if (item.specialInstructions) {
                    console.log(`    Note: ${item.specialInstructions}`);
                }
            });

            console.log('─'.repeat(40));
            console.log(`Subtotal: ${data.subtotal.toFixed(2)} SAR`);
            console.log(`Tax (15%): ${data.tax.toFixed(2)} SAR`);

            if (data.discount > 0) {
                console.log(`Discount: -${data.discount.toFixed(2)} SAR`);
                if (data.appliedDiscount) {
                    const { discount } = data.appliedDiscount;
                    console.log(`  (${discount.name})`);
                }
            }

            console.log('═'.repeat(40));
            console.log(`TOTAL: ${data.total.toFixed(2)} SAR`);

            if (data.paymentMethod) {
                console.log(`Payment: ${data.paymentMethod.toUpperCase()}`);
                if (data.paidAmount) {
                    console.log(`Paid: ${data.paidAmount.toFixed(2)} SAR`);
                }
                if (data.change && data.change > 0) {
                    console.log(`Change: ${data.change.toFixed(2)} SAR`);
                }
            }

            console.log('═'.repeat(40));
            console.log('Thank you! شكراً لك');
            console.log('═'.repeat(40));

            // Simulate printer delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In production, you would:
            // 1. Format receipt as ESC/POS commands
            // 2. Send to printer via USB/network
            // 3. Handle printer errors
            // 4. Support different printer models

            return true;
        } catch (error) {
            console.error('Print failed:', error);
            return false;
        }
    }

    /**
     * Print kitchen ticket
     * Simplified ticket for kitchen display
     */
    static async printKitchenTicket(
        orderNumber: string,
        items: CartItem[],
        orderType: OrderType,
        table?: Table,
        notes?: string
    ): Promise<boolean> {
        try {
            console.log('🍳 Printing Kitchen Ticket...');
            console.log('═'.repeat(30));
            console.log(`ORDER: ${orderNumber}`);
            console.log(`Time: ${new Date().toLocaleTimeString('ar-SA')}`);
            console.log(`Type: ${orderType.toUpperCase()}`);

            if (table) {
                console.log(`TABLE: ${table.number}`);
            }

            console.log('─'.repeat(30));

            items.forEach((item) => {
                console.log(`${item.quantity}x ${item.product.name}`);
                if (item.modifiers && item.modifiers.length > 0) {
                    item.modifiers.forEach((mod) => {
                        console.log(`  + ${mod.name}`);
                    });
                }
                if (item.specialInstructions) {
                    console.log(`  ⚠️ ${item.specialInstructions}`);
                }
            });

            if (notes) {
                console.log('─'.repeat(30));
                console.log(`NOTES: ${notes}`);
            }

            console.log('═'.repeat(30));

            await new Promise(resolve => setTimeout(resolve, 1000));

            return true;
        } catch (error) {
            console.error('Kitchen print failed:', error);
            return false;
        }
    }
}
