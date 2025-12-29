import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EndOfDayService } from '../services/end-of-day.service';

class StartEODDto {
    managerId: string;
    /** The business day to close (YYYY-MM-DD). If omitted, uses smart default based on current time */
    businessDate?: string;
}

class CompleteEODDto {
    managerNotes?: string;
}

@Controller('api/v1/eod')
@ApiTags('End of Day')
export class EndOfDayController {
    constructor(private readonly eodService: EndOfDayService) { }

    @Post('stores/:storeId/start')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Start EOD report for a store' })
    @ApiResponse({ status: 201, description: 'EOD report started' })
    async startEOD(
        @Param('storeId') storeId: string,
        @Body() dto: StartEODDto,
    ) {
        const businessDate = dto.businessDate ? new Date(dto.businessDate) : undefined;
        const eod = await this.eodService.startEOD(storeId, dto.managerId, businessDate);
        return {
            success: true,
            data: eod,
            messageKey: 'EOD_STARTED',
            timestamp: new Date().toISOString(),
        };
    }

    @Patch(':eodId/complete')
    @ApiOperation({ summary: 'Complete EOD report' })
    @ApiResponse({ status: 200, description: 'EOD report completed' })
    async completeEOD(
        @Param('eodId') eodId: string,
        @Body() dto: CompleteEODDto,
    ) {
        const eod = await this.eodService.completeEOD(eodId, dto.managerNotes);
        return {
            success: true,
            data: eod,
            messageKey: 'EOD_COMPLETED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('stores/:storeId')
    @ApiOperation({ summary: 'List EOD reports for a store' })
    async listEOD(
        @Param('storeId') storeId: string,
        @Query('limit') limit?: number,
    ) {
        const reports = await this.eodService.list(storeId, limit || 30);
        return {
            success: true,
            data: reports,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('stores/:storeId/date/:date')
    @ApiOperation({ summary: 'Get EOD report by date' })
    async getByDate(
        @Param('storeId') storeId: string,
        @Param('date') date: string,
    ) {
        const eod = await this.eodService.getByDate(storeId, new Date(date));
        return {
            success: true,
            data: eod,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':eodId')
    @ApiOperation({ summary: 'Get EOD report by ID' })
    async getById(@Param('eodId') eodId: string) {
        const eod = await this.eodService.getById(eodId);
        return {
            success: true,
            data: eod,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('stores/:storeId/pending-sessions')
    @ApiOperation({ summary: 'Get closed sessions pending EOD review' })
    async getPendingSessions(@Param('storeId') storeId: string) {
        const sessions = await this.eodService.getPendingSessions(storeId);
        return {
            success: true,
            data: sessions,
            timestamp: new Date().toISOString(),
        };
    }
}
