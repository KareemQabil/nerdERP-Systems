import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TablesService } from '../services/tables.service';
import {
    CreateTableDto,
    CreateTableZoneDto,
    UpdateTableStatusDto,
    CreateReservationDto,
    UpdateReservationDto,
} from '../dto/tables.dto';

@Controller('tables')
@ApiTags('Tables & Reservations')
export class TablesController {
    constructor(private readonly tablesService: TablesService) { }

    // ==================== ZONES ====================

    @Post('zones')
    @ApiOperation({ summary: 'Create table zone' })
    @ApiResponse({ status: 201, description: 'Zone created' })
    async createZone(@Body() dto: CreateTableZoneDto) {
        const zone = await this.tablesService.createZone(dto);
        return {
            success: true,
            data: zone,
            messageKey: 'ZONE_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('zones')
    @ApiOperation({ summary: 'Get all zones for store' })
    async getZones(@Query('storeId') storeId?: string) {
        const zones = await this.tablesService.findAllZones(storeId);
        return {
            success: true,
            data: zones,
            timestamp: new Date().toISOString(),
        };
    }

    @Patch('zones/:zoneId')
    @ApiOperation({ summary: 'Update zone' })
    async updateZone(
        @Param('zoneId') zoneId: string,
        @Body() dto: Partial<CreateTableZoneDto>
    ) {
        const zone = await this.tablesService.updateZone(zoneId, dto);
        return {
            success: true,
            data: zone,
            messageKey: 'ZONE_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete('zones/:zoneId')
    @ApiOperation({ summary: 'Delete zone' })
    async deleteZone(@Param('zoneId') zoneId: string) {
        await this.tablesService.deleteZone(zoneId);
        return {
            success: true,
            messageKey: 'ZONE_DELETED',
            timestamp: new Date().toISOString(),
        };
    }

    // ==================== TABLES ====================

    @Post()
    @ApiOperation({ summary: 'Create table' })
    @ApiResponse({ status: 201, description: 'Table created' })
    async createTable(@Body() dto: CreateTableDto) {
        const table = await this.tablesService.createTable(dto);
        return {
            success: true,
            data: table,
            messageKey: 'TABLE_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get()
    @ApiOperation({ summary: 'Get all tables for store' })
    async getTables(@Query('storeId') storeId?: string) {
        const tables = await this.tablesService.findAllTables(storeId);
        return {
            success: true,
            data: tables,
            timestamp: new Date().toISOString(),
        };
    }

    @Patch(':tableId')
    @ApiOperation({ summary: 'Update table' })
    async updateTable(
        @Param('tableId') tableId: string,
        @Body() dto: Partial<CreateTableDto>
    ) {
        const table = await this.tablesService.updateTable(tableId, dto);
        return {
            success: true,
            data: table,
            messageKey: 'TABLE_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':tableId')
    @ApiOperation({ summary: 'Delete table' })
    async deleteTable(@Param('tableId') tableId: string) {
        await this.tablesService.deleteTable(tableId);
        return {
            success: true,
            messageKey: 'TABLE_DELETED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('available/:storeId')
    @ApiOperation({ summary: 'Get available tables' })
    async getAvailableTables(@Param('storeId') storeId: string) {
        const tables = await this.tablesService.getAvailableTables(storeId);
        return {
            success: true,
            data: tables,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get table by ID' })
    async getTable(@Param('id') id: string) {
        const table = await this.tablesService.findTableById(id);
        return {
            success: true,
            data: table,
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id/status')
    @ApiOperation({ summary: 'Update table status' })
    async updateTableStatus(
        @Param('id') id: string,
        @Body() dto: UpdateTableStatusDto
    ) {
        const table = await this.tablesService.updateTableStatus(id, dto);
        return {
            success: true,
            data: table,
            messageKey: 'TABLE_STATUS_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/occupy')
    @ApiOperation({ summary: 'Occupy table with order' })
    async occupyTable(
        @Param('id') id: string,
        @Body() body: { orderId: string }
    ) {
        const table = await this.tablesService.occupyTable(id, body.orderId);
        return {
            success: true,
            data: table,
            messageKey: 'TABLE_OCCUPIED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/free')
    @ApiOperation({ summary: 'Free table' })
    async freeTable(@Param('id') id: string) {
        const table = await this.tablesService.freeTable(id);
        return {
            success: true,
            data: table,
            messageKey: 'TABLE_FREED',
            timestamp: new Date().toISOString(),
        };
    }

    // ==================== RESERVATIONS ====================

    @Post('reservations')
    @ApiOperation({ summary: 'Create reservation' })
    @ApiResponse({ status: 201, description: 'Reservation created' })
    async createReservation(@Body() dto: CreateReservationDto) {
        const reservation = await this.tablesService.createReservation(dto);
        return {
            success: true,
            data: reservation,
            messageKey: 'RESERVATION_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('reservations/:storeId/:date')
    @ApiOperation({ summary: 'Get reservations by store and date' })
    async getReservations(
        @Param('storeId') storeId: string,
        @Param('date') date: string
    ) {
        const reservations = await this.tablesService.getTodayReservations(storeId, date);
        return {
            success: true,
            data: reservations,
            timestamp: new Date().toISOString(),
        };
    }

    @Put('reservations/:id')
    @ApiOperation({ summary: 'Update reservation' })
    async updateReservation(
        @Param('id') id: string,
        @Body() dto: UpdateReservationDto
    ) {
        const reservation = await this.tablesService.updateReservation(id, dto);
        return {
            success: true,
            data: reservation,
            messageKey: 'RESERVATION_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('reservations/:id/check-in')
    @ApiOperation({ summary: 'Check in reservation' })
    async checkInReservation(@Param('id') id: string) {
        const reservation = await this.tablesService.checkInReservation(id);
        return {
            success: true,
            data: reservation,
            messageKey: 'RESERVATION_CHECKED_IN',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete('reservations/:id')
    @ApiOperation({ summary: 'Cancel reservation' })
    async cancelReservation(@Param('id') id: string) {
        const reservation = await this.tablesService.cancelReservation(id);
        return {
            success: true,
            data: reservation,
            messageKey: 'RESERVATION_CANCELLED',
            timestamp: new Date().toISOString(),
        };
    }

    // ==================== TABLE CLEANING WORKFLOW ====================

    @Post(':id/set-cleaning')
    @ApiOperation({
        summary: 'Set table to cleaning status',
        description: 'Called after order completion. Table transitions from OCCUPIED to CLEANING.'
    })
    async setTableCleaning(@Param('id') id: string) {
        const table = await this.tablesService.setTableCleaning(id);
        return {
            success: true,
            data: table,
            messageKey: 'TABLE_SET_CLEANING',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/mark-clean')
    @ApiOperation({
        summary: 'Mark table as clean and available',
        description: 'Called by staff after cleaning. Table transitions from CLEANING to AVAILABLE.'
    })
    async markTableClean(@Param('id') id: string) {
        const table = await this.tablesService.markTableClean(id);
        return {
            success: true,
            data: table,
            messageKey: 'TABLE_MARKED_CLEAN',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('cleaning/:storeId')
    @ApiOperation({ summary: 'Get tables that need cleaning' })
    async getTablesNeedingCleaning(@Param('storeId') storeId: string) {
        const tables = await this.tablesService.getTablesNeedingCleaning(storeId);
        return {
            success: true,
            data: tables,
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/block')
    @ApiOperation({
        summary: 'Block table',
        description: 'Block table for maintenance or VIP reservation'
    })
    async blockTable(
        @Param('id') id: string,
        @Body() body: { reason?: string }
    ) {
        const table = await this.tablesService.blockTable(id, body.reason);
        return {
            success: true,
            data: table,
            messageKey: 'TABLE_BLOCKED',
            timestamp: new Date().toISOString(),
        };
    }
}

