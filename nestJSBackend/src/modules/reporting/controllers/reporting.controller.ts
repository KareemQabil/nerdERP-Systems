import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { SalesReportService } from '../services/sales-report.service';
import { AuthorizationGuard } from '../../../common/guards/authorization.guard';
import type {
    SalesReportQuery,
    VoidReportQuery,
    EmployeePerformanceQuery,
} from '../services/sales-report.service';

@ApiTags('Reporting')
@Controller('api/v1/reports')
@UseGuards(AuthorizationGuard)
@ApiBearerAuth()
export class ReportingController {
    constructor(private readonly salesReportService: SalesReportService) {}

    // ==========================================================================
    // SALES REPORT
    // ==========================================================================

    @Get('sales')
    @ApiOperation({ summary: 'Get sales report' })
    @ApiQuery({ name: 'storeId', required: false })
    @ApiQuery({ name: 'warehouseId', required: false })
    @ApiQuery({ name: 'fromDate', required: false, example: '2024-01-01' })
    @ApiQuery({ name: 'toDate', required: false, example: '2024-01-31' })
    @ApiQuery({ name: 'period', required: false, enum: ['hourly', 'daily', 'weekly', 'monthly'], example: 'daily' })
    async getSalesReport(@Query() query: SalesReportQuery) {
        return await this.salesReportService.getSalesReport(query);
    }

    @Get('sales/top-items')
    @ApiOperation({ summary: 'Get top selling items' })
    @ApiQuery({ name: 'storeId', required: false })
    @ApiQuery({ name: 'warehouseId', required: false })
    @ApiQuery({ name: 'fromDate', required: false })
    @ApiQuery({ name: 'toDate', required: false })
    @ApiQuery({ name: 'limit', required: false, example: 20 })
    async getTopSellingItems(@Query() query: SalesReportQuery & { limit?: number }) {
        return await this.salesReportService.getTopSellingItems(query);
    }

    // ==========================================================================
    // VOID REPORT
    // ==========================================================================

    @Get('voids')
    @ApiOperation({ summary: 'Get void report' })
    @ApiQuery({ name: 'storeId', required: false })
    @ApiQuery({ name: 'userId', required: false })
    @ApiQuery({ name: 'fromDate', required: false })
    @ApiQuery({ name: 'toDate', required: false })
    async getVoidReport(@Query() query: VoidReportQuery) {
        return await this.salesReportService.getVoidReport(query);
    }

    // ==========================================================================
    // EMPLOYEE PERFORMANCE
    // ==========================================================================

    @Get('employees')
    @ApiOperation({ summary: 'Get employee performance report' })
    @ApiQuery({ name: 'storeId', required: false })
    @ApiQuery({ name: 'userId', required: false })
    @ApiQuery({ name: 'fromDate', required: false })
    @ApiQuery({ name: 'toDate', required: false })
    async getEmployeePerformance(@Query() query: EmployeePerformanceQuery) {
        return await this.salesReportService.getEmployeePerformance(query);
    }
}
