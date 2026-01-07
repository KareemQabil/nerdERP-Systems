import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import { OrderItem } from '../../sales/entities/order-item.entity';
import { Payment } from '../../sales/entities/payment.entity';

/**
 * Receipt Data Interface
 */
interface ReceiptData {
    // Store info
    storeName: string;
    storeAddress?: string;
    storePhone?: string;
    vatNumber?: string;

    // Order info
    orderNumber: string;
    orderDate: string;
    orderTime: string;
    cashierName: string;

    // Items
    items: ReceiptItem[];

    // Totals
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    total: number;

    // Payment
    paymentMethod: string;
    amountPaid: number;
    change?: number;

    // ZATCA (optional)
    includeZatcaQr?: boolean;
    zatcaQrData?: string;
}

interface ReceiptItem {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers?: Array<{ name: string; price: number }>;
}

/**
 * Kitchen Ticket Data Interface
 */
interface KitchenTicketData {
    orderNumber: string;
    tableNumber?: string;
    station: 'KITCHEN' | 'BAR' | 'DESSERT';
    priority: boolean;
    items: KitchenTicketItem[];
    timestamp: string;
    notes?: string;
}

interface KitchenTicketItem {
    name: string;
    quantity: number;
    modifiers?: string[];
    notes?: string;
}

/**
 * Receipt Generator Service
 *
 * Generates receipt data for different print formats:
 * - 80mm thermal receipts
 * - 58mm kitchen tickets
 * - A4 tax invoices
 */
@Injectable()
export class ReceiptGeneratorService {
    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepo: Repository<OrderItem>,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
    ) { }

    /**
     * Generate receipt data for a completed order
     */
    async generateReceipt(orderId: string, format: 'THERMAL_80MM' | 'THERMAL_58MM' | 'A4' = 'THERMAL_80MM'): Promise<ReceiptData> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'payments', 'store', 'user'],
        });

        if (!order) {
            throw new NotFoundException(`Order ${orderId} not found`);
        }

        // Get order items with product details
        const items = await this.orderItemRepo.find({
            where: { order: { id: orderId } },
            relations: ['product'],
        });

        // Build receipt items
        const receiptItems: ReceiptItem[] = items.map((item) => ({
            name: item.product?.name || item.productName || 'Unknown Item',
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.total),
            modifiers: item.modifiers ? JSON.parse(JSON.stringify(item.modifiers)) : undefined,
        }));

        // Calculate totals
        const subtotal = Number(order.totalGross ?? 0);
        const taxRate = 0.15; // 15% VAT in Saudi Arabia
        const taxAmount = Number(order.totalTax ?? 0);
        const discount = Number(order.discountAmount ?? 0);
        const total = Number(order.totalNet);

        // Get payment info
        const payment = order.payments?.[0];
        const paymentMethod = this.formatPaymentMethod((payment as any)?.method || 'CASH');
        const amountPaid = payment ? Number(payment.amount) : total;
        const change = payment && (payment as any).changeGiven ? Number((payment as any).changeGiven) : undefined;

        // Store info (using defaults since store relation not on SalesOrder)
        const storeName = 'NerdPOS Store';
        const storeAddress = undefined;
        const storePhone = undefined;
        const vatNumber = '300000000000003'; // Demo VAT number

        // Build receipt data
        const receiptData: ReceiptData = {
            storeName,
            storeAddress,
            storePhone,
            vatNumber,
            orderNumber: order.orderNumber,
            orderDate: this.formatDate(order.createdAt),
            orderTime: this.formatTime(order.createdAt),
            cashierName: (order as any).createdBy?.fullName || 'System',
            items: receiptItems,
            subtotal,
            taxRate,
            taxAmount,
            discount,
            total,
            paymentMethod,
            amountPaid,
            change,
            includeZatcaQr: true, // Always include ZATCA QR for compliance
        };

        // Generate ZATCA QR data if needed
        if (receiptData.includeZatcaQr) {
            receiptData.zatcaQrData = this.generateZatcaQrData(receiptData, order.id);
        }

        return receiptData;
    }

    /**
     * Generate kitchen ticket data
     */
    async generateKitchenTicket(orderId: string, station: 'KITCHEN' | 'BAR' | 'DESSERT'): Promise<KitchenTicketData> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items'],
        });

        if (!order) {
            throw new NotFoundException(`Order ${orderId} not found`);
        }

        const items = await this.orderItemRepo.find({
            where: { order: { id: orderId } },
            relations: ['product'],
        });

        // Filter items by category based on station
        const stationItems = items.filter((item) => {
            const category = item.product?.category?.name?.toLowerCase() || '';
            switch (station) {
                case 'KITCHEN':
                    return ['food', 'main', 'appetizer', 'salad', 'soup'].some((s) =>
                        category.includes(s),
                    );
                case 'BAR':
                    return ['drink', 'beverage', 'juice', 'coffee', 'tea'].some((s) =>
                        category.includes(s),
                    );
                case 'DESSERT':
                    return ['dessert', 'cake', 'ice cream', 'sweet'].some((s) =>
                        category.includes(s),
                    );
                default:
                    return true;
            }
        });

        const ticketItems: KitchenTicketItem[] = stationItems.map((item) => ({
            name: item.product?.name || 'Unknown',
            quantity: item.quantity,
            modifiers: item.modifiers ? Object.keys(item.modifiers) : undefined,
            notes: item.specialInstructions,
        }));

        return {
            orderNumber: order.orderNumber,
            tableNumber: (order as any).tableId ? `Table ${(order as any).tableId}` : undefined,
            station,
            priority: false,
            items: ticketItems,
            timestamp: this.formatTime(order.createdAt),
            notes: order.notes,
        };
    }

    /**
     * Generate ZATCA QR code data (TLV encoded)
     * Simplified version for phase 1
     *
     * Tags:
     * 01 - Seller name
     * 02 - VAT registration number
     * 03 - Timestamp
     * 04 - Total with VAT
     * 05 - VAT amount
     */
    private generateZatcaQrData(receipt: ReceiptData, orderId: string): string {
        const now = new Date().toISOString();

        // Simplified TLV encoding (Base64 encoded for frontend)
        const tlvData = {
            seller: receipt.storeName,
            vatNo: receipt.vatNumber,
            timestamp: now,
            total: receipt.total.toFixed(3),
            vat: receipt.taxAmount.toFixed(3),
        };

        // For production, proper TLV encoding would be done here
        // For now, we'll return a base64 encoded JSON that the frontend can use
        return Buffer.from(JSON.stringify(tlvData)).toString('base64');
    }

    /**
     * Format payment method for display
     */
    private formatPaymentMethod(method: string): string {
        const methods: Record<string, string> = {
            CASH: 'Cash',
            CARD: 'Card',
            STC_PAY: 'STC Pay',
            APPLE_PAY: 'Apple Pay',
            MADA: 'Mada',
            CREDIT: 'Credit',
        };
        return methods[method] || method;
    }

    /**
     * Format date for receipt
     */
    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    /**
     * Format time for receipt
     */
    private formatTime(date: Date): string {
        return date.toTimeString().split(' ')[0].substring(0, 5);
    }
}
