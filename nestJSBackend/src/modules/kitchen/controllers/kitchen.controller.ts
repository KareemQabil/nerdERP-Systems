import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KitchenService } from '../services/kitchen.service';
import {
    CreateKitchenStationDto,
    UpdateKitchenStationDto,
    UpdateTicketStatusDto,
    BumpTicketDto,
    FireOrderToKitchenDto,
    UpdateTicketItemStatusDto,
} from '../dto/kitchen.dto';

@Controller('api/v1/kitchen')
@ApiTags('Kitchen Operations')
export class KitchenController {
    constructor(private readonly kitchenService: KitchenService) { }

    // ==================== STATIONS ====================

    @Post('stations')
    @ApiOperation({ summary: 'Create kitchen station' })
    @ApiResponse({ status: 201, description: 'Station created' })
    async createStation(@Body() dto: CreateKitchenStationDto) {
        const station = await this.kitchenService.createStation(dto);
        return {
            success: true,
            data: station,
            messageKey: 'STATION_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('stations/:storeId')
    @ApiOperation({ summary: 'Get all stations for store' })
    async getStations(@Param('storeId') storeId: string) {
        const stations = await this.kitchenService.findAllStations(storeId);
        return {
            success: true,
            data: stations,
            timestamp: new Date().toISOString(),
        };
    }

    @Put('stations/:id')
    @ApiOperation({ summary: 'Update kitchen station' })
    async updateStation(
        @Param('id') id: string,
        @Body() dto: UpdateKitchenStationDto
    ) {
        const station = await this.kitchenService.updateStation(id, dto);
        return {
            success: true,
            data: station,
            messageKey: 'STATION_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    // ==================== POS INTEGRATION (NEW) ====================

    /**
     * Fire order to kitchen - Main POS → Kitchen entry point
     *
     * This endpoint:
     * - Creates kitchen tickets for all kitchen items in the order
     * - Groups items by their assigned kitchen stations
     * - Updates order status to FIRED_TO_KITCHEN
     * - Triggers WebSocket event to KDS displays
     *
     * Error codes:
     * - KITCHEN_001: Order not found
     * - KITCHEN_002: Order cannot be fired (already completed/void)
     * - KITCHEN_003: No kitchen items to fire
     */
    @Post('orders/:orderId/fire-to-kitchen')
    @ApiOperation({ summary: 'Fire order to kitchen (POS → Kitchen)' })
    @ApiResponse({ status: 201, description: 'Kitchen tickets created and broadcast' })
    @ApiResponse({ status: 400, description: 'Bad request - order cannot be fired' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async fireOrderToKitchen(
        @Param('orderId') orderId: string,
        @Body() dto: FireOrderToKitchenDto,
    ) {
        const tickets = await this.kitchenService.fireOrderToKitchen(
            orderId,
            dto.itemIds,
        );

        return {
            success: true,
            data: tickets,
            messageKey: 'ORDER_FIRED_TO_KITCHEN',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Update ticket item status
     *
     * Marks individual items as PREPARING or READY
     * Updates both ticket item and corresponding order item
     */
    @Put('ticket-items/:ticketItemId/status')
    @ApiOperation({ summary: 'Update ticket item status (PREPARING/READY)' })
    @ApiResponse({ status: 200, description: 'Item status updated' })
    @ApiResponse({ status: 400, description: 'Item already prepared' })
    @ApiResponse({ status: 404, description: 'Ticket item not found' })
    async updateTicketItemStatus(
        @Param('ticketItemId') ticketItemId: string,
        @Body() dto: UpdateTicketItemStatusDto,
    ) {
        const updatedItem = await this.kitchenService.updateTicketItemStatus(
            ticketItemId,
            dto.status,
            dto.userId,
        );

        return {
            success: true,
            data: updatedItem,
            messageKey: 'TICKET_ITEM_STATUS_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get ticket for order item
     *
     * Checks if an item has been sent to kitchen and returns its ticket
     */
    @Get('order-items/:orderItemId/ticket')
    @ApiOperation({ summary: 'Get ticket for order item' })
    @ApiResponse({ status: 200, description: 'Ticket retrieved' })
    @ApiResponse({ status: 404, description: 'No ticket found for item' })
    async getTicketForOrderItem(@Param('orderItemId') orderItemId: string) {
        const ticketItem = await this.kitchenService.getTicketForOrderItem(orderItemId);

        if (!ticketItem) {
            return {
                success: false,
                data: null,
                messageKey: 'TICKET_NOT_FOUND',
                message: 'No ticket found for this order item',
                timestamp: new Date().toISOString(),
            };
        }

        return {
            success: true,
            data: ticketItem,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get tickets for station (KDS view)
     *
     * Returns active or all tickets for a specific kitchen station
     */
    @Get('stations/:stationId/tickets')
    @ApiOperation({ summary: 'Get tickets for station (KDS)' })
    @ApiResponse({ status: 200, description: 'Tickets retrieved' })
    async getTicketsForStation(
        @Param('stationId') stationId: string,
        @Query('activeOnly') activeOnly?: string,
    ) {
        const tickets = await this.kitchenService.getTicketsForStation(
            stationId,
            activeOnly !== 'false',
        );

        return {
            success: true,
            data: tickets,
            timestamp: new Date().toISOString(),
        };
    }

    // ==================== TICKETS ====================

    @Post('tickets/from-order/:orderId')
    @ApiOperation({ summary: 'Create kitchen tickets from order' })
    @ApiResponse({ status: 201, description: 'Tickets created and routed to stations' })
    async createTicketsFromOrder(@Param('orderId') orderId: string) {
        const tickets = await this.kitchenService.createTicketsFromOrder(orderId);
        return {
            success: true,
            data: tickets,
            messageKey: 'TICKETS_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('tickets/active/:stationId')
    @ApiOperation({ summary: 'Get active tickets for station (KDS view)' })
    async getActiveTickets(@Param('stationId') stationId: string) {
        const tickets = await this.kitchenService.getActiveTickets(stationId);
        return {
            success: true,
            data: tickets,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('tickets/station/:stationId')
    @ApiOperation({ summary: 'Get all tickets for station (history)' })
    async getStationTickets(@Param('stationId') stationId: string) {
        const tickets = await this.kitchenService.getStationTickets(stationId);
        return {
            success: true,
            data: tickets,
            timestamp: new Date().toISOString(),
        };
    }

    @Put('tickets/:id/status')
    @ApiOperation({ summary: 'Update ticket status (PENDING → PREPARING → READY)' })
    async updateTicketStatus(
        @Param('id') id: string,
        @Body() dto: UpdateTicketStatusDto
    ) {
        const ticket = await this.kitchenService.updateTicketStatus(id, dto);
        return {
            success: true,
            data: ticket,
            messageKey: 'TICKET_STATUS_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('tickets/:id/bump')
    @ApiOperation({ summary: 'Bump ticket (mark complete, remove from KDS)' })
    async bumpTicket(
        @Param('id') id: string,
        @Body() dto: BumpTicketDto
    ) {
        const ticket = await this.kitchenService.bumpTicket(id, dto);
        return {
            success: true,
            data: ticket,
            messageKey: 'TICKET_BUMPED',
            timestamp: new Date().toISOString(),
        };
    }
}
