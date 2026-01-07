import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeliveryService, DeliveryStatus } from '../services/delivery.service';
import { DeliveryDashboardService } from '../services/delivery-dashboard.service';

@ApiTags('Delivery')
@Controller('api/v1/delivery')
export class DeliveryController {
    constructor(
        private readonly deliveryService: DeliveryService,
        private readonly dashboardService: DeliveryDashboardService,
    ) {}

    /**
     * Get delivery dashboard data
     * Returns all data needed for the delivery dashboard UI
     */
    @Get('dashboard/:storeId')
    @ApiOperation({ summary: 'Get delivery dashboard data' })
    async getDashboard(@Param('storeId') storeId: string) {
        const data = await this.dashboardService.getDashboardData(storeId);
        return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get all drivers for a store
     */
    @Get('drivers/:storeId')
    @ApiOperation({ summary: 'Get all drivers for store' })
    async getDrivers(@Param('storeId') storeId: string) {
        const [available, busy, offDuty] = await Promise.all([
            this.dashboardService.getDriversByStatus(storeId, 'AVAILABLE' as any),
            this.dashboardService.getDriversByStatus(storeId, 'BUSY' as any),
            this.dashboardService.getDriversByStatus(storeId, 'OFF_DUTY' as any),
        ]);

        return {
            success: true,
            data: [...available, ...busy, ...offDuty],
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Assign a driver to an order
     */
    @Post('assign')
    @ApiOperation({ summary: 'Assign driver to order' })
    async assignDriver(@Body() data: {
        orderId: string;
        driverId: string;
        assignedBy: string;
        priorityLevel?: number;
        notes?: string;
    }) {
        const result = await this.deliveryService.assignDriver({
            orderId: data.orderId,
            driverId: data.driverId,
            assignedBy: { id: data.assignedBy } as any,
            priorityLevel: data.priorityLevel,
            notes: data.notes,
        });

        return {
            success: true,
            data: result,
            messageKey: 'DRIVER_ASSIGNED',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Update delivery order status
     */
    @Patch('orders/:orderId/status')
    @ApiOperation({ summary: 'Update delivery order status' })
    async updateOrderStatus(
        @Param('orderId') orderId: string,
        @Body() data: {
            status: DeliveryStatus;
            updatedBy: string;
            location?: { lat: number; lng: number };
            notes?: string;
        },
    ) {
        const result = await this.deliveryService.updateDeliveryStatus({
            orderId,
            status: data.status,
            updatedBy: { id: data.updatedBy } as any,
            location: data.location,
            notes: data.notes,
        });

        return {
            success: true,
            data: result,
            messageKey: 'DELIVERY_STATUS_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get all delivery orders for a store
     */
    @Get('orders/:storeId')
    @ApiOperation({ summary: 'Get all delivery orders' })
    async getDeliveryOrders(@Param('storeId') storeId: string) {
        const [pending, assigned, outForDelivery, ready] = await Promise.all([
            this.dashboardService.getOrdersByStatus(storeId, 'PENDING'),
            this.dashboardService.getOrdersByStatus(storeId, 'ASSIGNED'),
            this.dashboardService.getOrdersByStatus(storeId, 'OUT_FOR_DELIVERY'),
            this.dashboardService.getOrdersByStatus(storeId, 'READY'),
        ]);

        return {
            success: true,
            data: [...pending, ...assigned, ...outForDelivery, ...ready],
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Search delivery orders by order number
     */
    @Get('orders/:storeId/search')
    @ApiOperation({ summary: 'Search delivery orders' })
    async searchOrders(
        @Param('storeId') storeId: string,
        @Query('q') query: string,
    ) {
        const results = await this.dashboardService.searchOrders(storeId, query);
        return {
            success: true,
            data: results,
            timestamp: new Date().toISOString(),
        };
    }
}
