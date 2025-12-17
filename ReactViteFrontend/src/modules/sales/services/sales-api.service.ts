import { apiClient } from '@/core/services/api/api-client';
import type { SalesOrder, CreateOrderDto, OrderFilterDto, Payment } from '../types/order.types';
import type { StandardResponse, PaginatedResponse } from '@/core/types/api.types';
import { DecimalUtil } from '@/core/utils/decimal.utils';
import { create MockStandardResponse, createMockPaginatedResponse } from '@/core/services/mock/mock-products';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_DATA === 'true';

/**
 * Sales API Service
 * Handles all order-related API calls
 * CRITICAL: Mock mode includes FULL calculation logic
 */
export class SalesApiService {
    private static readonly BASE_PATH = '/api/v1/sales/orders';

    /**
     * Calculate order totals with precision
     * Uses DecimalUtil for all money calculations
     */
    private static calculateOrderTotals(items: CreateOrderDto['items'], discountAmount: string = '0.000') {
        // Calculate each line total
        const lineCalculations = items.map(item => {
            const quantity = new Decimal(item.quantity);

            // Get base unit price (would come from product lookup in real implementation)
            // For mock, assume 20.000 SAR per item
            const unitPrice = new Decimal('20.000');

            // Calculate modifiers total (if any)
            const modifiersTotal = item.selectedModifiers
                ? new Decimal('2.500') // Mock: 2.500 SAR per modifier
                    .times(item.selectedModifiers.length)
                : new Decimal(0);

            // Line subtotal = (unitPrice + modifiers) * quantity
            const lineSubtotal = unitPrice.plus(modifiersTotal).times(quantity);

            return {
                unitPrice: unitPrice.toFixed(3),
                modifiersTotal: modifiersTotal.toFixed(3),
                lineSubtotal: lineSubtotal.toFixed(3),
            };
        });

        // Calculate order subtotal (sum of all line subtotals)
        const subtotal = DecimalUtil.sum(
            lineCalculations.map(line => line.lineSubtotal)
        );

        // Apply discount
        const discount = new Decimal(discountAmount);
        const subtotalAfterDiscount = subtotal.minus(discount);

        // Calculate tax (15% VAT - Saudi Arabia standard)
        const taxRate = new Decimal('15.00');
        const totalTax = DecimalUtil.calculatePercentage(subtotalAfterDiscount, taxRate);

        // Calculate final total
        const totalGross = subtotalAfterDiscount.plus(totalTax);

        return {
            lineCalculations,
            subtotal: subtotal.toFixed(3),
            discountAmount: discount.toFixed(3),
            totalTax: totalTax.toFixed(3),
            totalGross: totalGross.toFixed(3),
        };
    }

    /**
     * Get orders with filters
     */
    static async getOrders(filters?: OrderFilterDto): Promise<PaginatedResponse<SalesOrder>> {
        if (IS_MOCK_MODE) {
            // Mock implementation with sample orders
            const mockOrders: SalesOrder[] = [
                {
                    id: 'order-001',
                    orderNumber: 'ORD-20250117-0001',
                    publicRef: 'K-101',
                    invoiceCounter: 1,
                    registerSessionId: 'session-001',
                    deviceId: 'device-001',
                    servedByUserId: 'user-001',
                    orderType: 'DINE_IN',
                    orderStatus: 'COMPLETED',
                    paymentStatus: 'PAID',
                    subtotal: '60.000', // 3 items * 20.000
                    discountAmount: '0.000',
                    totalTax: '9.000', // 15% of 60.000
                    totalGross: '69.000', // 60.000 + 9.000
                    isSimplifiedInvoice: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];

            return createMockPaginatedResponse(mockOrders, filters?.page, filters?.limit);
        }

        const response = await apiClient.get<PaginatedResponse<SalesOrder>>(
            this.BASE_PATH,
            { params: filters }
        );
        return response.data;
    }

    /**
     * Create new order
     * CRITICAL: Includes full calculation logic in mock mode
     */
    static async createOrder(dto: CreateOrderDto): Promise<StandardResponse<SalesOrder>> {
        if (IS_MOCK_MODE) {
            // Calculate totals using DecimalUtil
            const calculations = this.calculateOrderTotals(dto.items);

            const newOrder: SalesOrder = {
                id: `order-${Date.now()}`,
                orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
                publicRef: `K-${Math.floor(Math.random() * 999)}`,
                invoiceCounter: 1,
                registerSessionId: dto.registerSessionId,
                deviceId: dto.deviceId,
                customerId: dto.customerId,
                tableId: dto.tableId,
                servedByUserId: 'user-001', // Mock user
                orderType: dto.orderType,
                orderStatus: 'DRAFT',
                paymentStatus: 'UNPAID',

                // **CALCULATED VALUES using DecimalUtil**
                subtotal: calculations.subtotal,
                discountAmount: calculations.discountAmount,
                totalTax: calculations.totalTax,
                totalGross: calculations.totalGross,

                isSimplifiedInvoice: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            return createMockStandardResponse(newOrder);
        }

        const response = await apiClient.post<StandardResponse<SalesOrder>>(
            this.BASE_PATH,
            dto
        );
        return response.data;
    }

    /**
     * Get order by ID
     */
    static async getOrderById(id: string): Promise<StandardResponse<SalesOrder>> {
        if (IS_MOCK_MODE) {
            const order: SalesOrder = {
                id,
                orderNumber: 'ORD-20250117-0001',
                publicRef: 'K-101',
                invoiceCounter: 1,
                registerSessionId: 'session-001',
                deviceId: 'device-001',
                servedByUserId: 'user-001',
                orderType: 'TAKEAWAY',
                orderStatus: 'DRAFT',
                paymentStatus: 'UNPAID',
                subtotal: '40.000',
                discountAmount: '0.000',
                totalTax: '6.000', // 15% VAT
                totalGross: '46.000',
                isSimplifiedInvoice: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            return createMockStandardResponse(order);
        }

        const response = await apiClient.get<StandardResponse<SalesOrder>>(`${this.BASE_PATH}/${id}`);
        return response.data;
    }

    /**
     * Complete order (finalize)
     */
    static async completeOrder(orderId: string): Promise<StandardResponse<SalesOrder>> {
        if (IS_MOCK_MODE) {
            // In real implementation, would update order status
            const completedOrder: SalesOrder = {
                id: orderId,
                orderNumber: 'ORD-20250117-0001',
                publicRef: 'K-101',
                invoiceCounter: 1,
                registerSessionId: 'session-001',
                deviceId: 'device-001',
                servedByUserId: 'user-001',
                orderType: 'TAKEAWAY',
                orderStatus: 'COMPLETED', // Changed from DRAFT
                paymentStatus: 'PAID', // Changed from UNPAID
                subtotal: '40.000',
                discountAmount: '0.000',
                totalTax: '6.000',
                totalGross: '46.000',
                isSimplifiedInvoice: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
            };

            return createMockStandardResponse(completedOrder);
        }

        const response = await apiClient.post<StandardResponse<SalesOrder>>(
            `${this.BASE_PATH}/${orderId}/complete`
        );
        return response.data;
    }
}
