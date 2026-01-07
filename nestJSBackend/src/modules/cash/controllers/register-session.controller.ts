import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterSessionService } from '../services/register-session.service';
import {
    CreateRegisterSessionDto,
    CloseRegisterSessionDto,
    BlindCloseSessionDto,
    DropToSafeDto,
    PettyCashDto,
    ReviewSessionDto,
    InitiateHandoverDto,
    AcceptHandoverDto,
    DisputeHandoverDto,
    ResolveHandoverDto,
} from '../dto/cash.dto';

@Controller('cash/sessions')
@ApiTags('Cash Management')
export class RegisterSessionController {
    constructor(private readonly sessionService: RegisterSessionService) { }

    // =========================================================================
    // SESSION LIFECYCLE
    // =========================================================================

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

    @Post(':id/close-blind')
    @ApiOperation({
        summary: 'Close register session (blind close)',
        description: 'Cashier enters counted cash WITHOUT seeing expected balance. Recommended method for cash control.'
    })
    @ApiResponse({ status: 200, description: 'Session closed' })
    async closeSessionBlind(
        @Param('id') id: string,
        @Body() dto: BlindCloseSessionDto
    ) {
        const result = await this.sessionService.closeSessionBlind(id, dto);
        return {
            success: result.success,
            data: { sessionId: result.sessionId },
            message: result.message,
            messageKey: 'SESSION_CLOSED_BLIND',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/close')
    @ApiOperation({
        summary: 'Close register session (legacy)',
        description: 'Standard close - NOT recommended. Use /close-blind instead.'
    })
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

    // =========================================================================
    // SESSION QUERIES
    // =========================================================================

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

    @Get(':id/report')
    @ApiOperation({
        summary: 'Get full session report (managers only)',
        description: 'Returns complete breakdown including expected balance and discrepancy'
    })
    async getSessionReport(@Param('id') id: string) {
        const report = await this.sessionService.getSessionReport(id);
        return {
            success: true,
            data: report,
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/review')
    @ApiOperation({ summary: 'Manager reviews session discrepancy' })
    async reviewSession(
        @Param('id') id: string,
        @Body() dto: ReviewSessionDto
    ) {
        const session = await this.sessionService.reviewSession(id, dto);
        return {
            success: true,
            data: session,
            messageKey: 'SESSION_REVIEWED',
            timestamp: new Date().toISOString(),
        };
    }

    // =========================================================================
    // BALANCE (Internal/Manager Only)
    // =========================================================================

    @Get(':id/balance')
    @ApiOperation({
        summary: 'Get expected balance (MANAGERS ONLY)',
        description: 'This endpoint should be restricted to managers - never expose to cashiers during active session'
    })
    async getBalance(@Param('id') id: string) {
        const balance = await this.sessionService.getBalance(id);
        return {
            success: true,
            data: balance,
            timestamp: new Date().toISOString(),
        };
    }

    // =========================================================================
    // CASH TRANSACTIONS
    // =========================================================================

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

    // =========================================================================
    // HANDOVER OPERATIONS
    // =========================================================================

    @Post(':id/handover/initiate')
    @ApiOperation({ summary: 'Initiate shift handover (outgoing cashier)' })
    @ApiResponse({ status: 201, description: 'Handover initiated' })
    async initiateHandover(
        @Param('id') id: string,
        @Body() dto: InitiateHandoverDto
    ) {
        const handover = await this.sessionService.initiateHandover(id, dto);
        return {
            success: true,
            data: handover,
            messageKey: 'HANDOVER_INITIATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('handover/:handoverId/accept')
    @ApiOperation({ summary: 'Accept handover (incoming cashier)' })
    @ApiResponse({ status: 200, description: 'Handover accepted, new session created' })
    async acceptHandover(
        @Param('handoverId') handoverId: string,
        @Body() dto: AcceptHandoverDto
    ) {
        const result = await this.sessionService.acceptHandover(handoverId, dto);
        return {
            success: true,
            data: {
                handover: result.handover,
                newSession: result.newSession,
            },
            messageKey: 'HANDOVER_ACCEPTED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('handover/:handoverId/dispute')
    @ApiOperation({ summary: 'Dispute handover (incoming cashier disagrees with count)' })
    @ApiResponse({ status: 200, description: 'Handover disputed, awaiting manager' })
    async disputeHandover(
        @Param('handoverId') handoverId: string,
        @Body() dto: DisputeHandoverDto
    ) {
        const handover = await this.sessionService.disputeHandover(handoverId, dto);
        return {
            success: true,
            data: handover,
            messageKey: 'HANDOVER_DISPUTED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('handover/:handoverId/resolve')
    @ApiOperation({ summary: 'Resolve handover dispute (manager intervention)' })
    @ApiResponse({ status: 200, description: 'Handover resolved' })
    async resolveHandover(
        @Param('handoverId') handoverId: string,
        @Body() dto: ResolveHandoverDto
    ) {
        const result = await this.sessionService.resolveHandover(handoverId, dto);
        return {
            success: true,
            data: {
                handover: result.handover,
                newSession: result.newSession,
            },
            messageKey: 'HANDOVER_RESOLVED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('handover/pending/:storeId')
    @ApiOperation({ summary: 'Get pending handovers for a store' })
    async getPendingHandovers(@Param('storeId') storeId: string) {
        const handovers = await this.sessionService.getPendingHandovers(storeId);
        return {
            success: true,
            data: handovers,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('handover/disputed/:storeId')
    @ApiOperation({ summary: 'Get disputed handovers for a store (manager view)' })
    async getDisputedHandovers(@Param('storeId') storeId: string) {
        const handovers = await this.sessionService.getDisputedHandovers(storeId);
        return {
            success: true,
            data: handovers,
            timestamp: new Date().toISOString(),
        };
    }

    // =========================================================================
    // STORE QUERIES
    // =========================================================================

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
