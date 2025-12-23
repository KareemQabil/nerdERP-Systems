import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterSessionService } from '../services/register-session.service';
import {
    CreateRegisterSessionDto,
    CloseRegisterSessionDto,
    DropToSafeDto,
    PettyCashDto,
} from '../dto/cash.dto';

@Controller('api/v1/cash/sessions')
@ApiTags('Cash Management')
export class RegisterSessionController {
    constructor(private readonly sessionService: RegisterSessionService) { }

    @Post('open')
    @ApiOperation({ summary: 'Open new register session' })
    @ApiResponse({ status: 201, description: 'Session opened' })
    @ApiResponse({ status: 400, description: 'Device already has active session' })
    async openSession(@Body() dto: CreateRegisterSessionDto) {
        const session = await this.sessionService.openSession(dto);
        return {
            success: true,
            data: session,
            messageKey: 'SESSION_OPENED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/close')
    @ApiOperation({ summary: 'Close register session with cash count' })
    @ApiResponse({ status: 200, description: 'Session closed' })
    async closeSession(
        @Param('id') id: string,
        @Body() dto: CloseRegisterSessionDto
    ) {
        const session = await this.sessionService.closeSession(id, dto);
        return {
            success: true,
            data: session,
            messageKey: 'SESSION_CLOSED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('active/:deviceId')
    @ApiOperation({ summary: 'Get active session for device' })
    async getActiveSession(@Param('deviceId') deviceId: string) {
        const session = await this.sessionService.getActiveSession(deviceId);
        return {
            success: true,
            data: session,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get session by ID' })
    async getSession(@Param('id') id: string) {
        const session = await this.sessionService.findById(id);
        return {
            success: true,
            data: session,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id/balance')
    @ApiOperation({ summary: 'Calculate expected balance for session' })
    async getBalance(@Param('id') id: string) {
        const balance = await this.sessionService.getBalance(id);
        return {
            success: true,
            data: balance,
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/drop-to-safe')
    @ApiOperation({ summary: 'Drop cash to safe' })
    @ApiResponse({ status: 201, description: 'Cash dropped to safe' })
    async dropToSafe(
        @Param('id') id: string,
        @Body() dto: DropToSafeDto
    ) {
        const transaction = await this.sessionService.dropToSafe(id, dto);
        return {
            success: true,
            data: transaction,
            messageKey: 'CASH_DROPPED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/petty-cash')
    @ApiOperation({ summary: 'Record petty cash payout' })
    @ApiResponse({ status: 201, description: 'Petty cash recorded' })
    async addPettyCash(
        @Param('id') id: string,
        @Body() dto: PettyCashDto
    ) {
        const transaction = await this.sessionService.addPettyCash(id, dto);
        return {
            success: true,
            data: transaction,
            messageKey: 'PETTY_CASH_RECORDED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('store/:storeId/:date')
    @ApiOperation({ summary: 'Get sessions by store and date' })
    async getSessionsByDate(
        @Param('storeId') storeId: string,
        @Param('date') date: string
    ) {
        const sessions = await this.sessionService.getSessionsByDate(storeId, date);
        return {
            success: true,
            data: sessions,
            timestamp: new Date().toISOString(),
        };
    }
}
