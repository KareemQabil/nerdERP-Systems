import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KitchenService } from '../services/kitchen.service';
import {
    CreateKitchenStationDto,
    UpdateKitchenStationDto,
    UpdateTicketStatusDto,
    BumpTicketDto,
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
