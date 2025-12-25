import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SalesReportsService } from '../services/sales-reports.service';
import { InventoryReportsService } from '../services/inventory-reports.service';
import { FinancialReportsService } from '../services/financial-reports.service';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
    constructor(
        private readonly salesReports: SalesReportsService,
        private readonly inventoryReports: InventoryReportsService,
        private readonly financialReports: FinancialReportsService,
    ) { }

    // ============ SALES REPORTS ============

    @Get('sales/daily')
    @ApiOperation({ summary: 'Get daily sales summary' })
    @ApiQuery({ name: 'date', required: false, example: '2025-01-26' })
    async getDailySales(@Query('date') date?: string) {
        const targetDate = date ? new Date(date) : new Date();
        const data = await this.salesReports.getDailySales(targetDate);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    @Get('sales/top-products')
    @ApiOperation({ summary: 'Get top selling products' })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async getTopProducts(
        @Query('start') start?: string,
        @Query('end') end?: string,
        @Query('limit') limit?: string,
    ) {
        const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = end ? new Date(end) : new Date();
        const limitNum = limit ? parseInt(limit) : 10;

        const data = await this.salesReports.getTopProducts(startDate, endDate, limitNum);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    @Get('sales/hourly')
    @ApiOperation({ summary: 'Get hourly sales breakdown' })
    @ApiQuery({ name: 'date', required: false })
    async getHourlySales(@Query('date') date?: string) {
        const targetDate = date ? new Date(date) : new Date();
        const data = await this.salesReports.getHourlySales(targetDate);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    @Get('sales/payment-methods')
    @ApiOperation({ summary: 'Get payment method breakdown' })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    async getPaymentMethods(
        @Query('start') start?: string,
        @Query('end') end?: string,
    ) {
        const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = end ? new Date(end) : new Date();

        const data = await this.salesReports.getPaymentMethodBreakdown(startDate, endDate);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    // ============ INVENTORY REPORTS ============

    @Get('inventory/stock-levels')
    @ApiOperation({ summary: 'Get current stock levels' })
    @ApiQuery({ name: 'warehouse', required: false })
    async getStockLevels(@Query('warehouse') warehouseId?: string) {
        const data = await this.inventoryReports.getStockLevels(warehouseId);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    @Get('inventory/low-stock')
    @ApiOperation({ summary: 'Get low stock alerts' })
    @ApiQuery({ name: 'threshold', required: false, example: 10 })
    async getLowStock(@Query('threshold') threshold?: string) {
        const thresholdNum = threshold ? parseInt(threshold) : 10;
        const data = await this.inventoryReports.getLowStockAlerts(thresholdNum);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    @Get('inventory/expiring')
    @ApiOperation({ summary: 'Get expiring batches' })
    @ApiQuery({ name: 'days', required: false, example: 30 })
    async getExpiringBatches(@Query('days') days?: string) {
        const daysNum = days ? parseInt(days) : 30;
        const data = await this.inventoryReports.getExpiringBatches(daysNum);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    @Get('inventory/movements')
    @ApiOperation({ summary: 'Get stock movement history' })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    @ApiQuery({ name: 'product', required: false })
    async getStockMovements(
        @Query('start') start?: string,
        @Query('end') end?: string,
        @Query('product') productId?: string,
    ) {
        const startDate = start ? new Date(start) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const endDate = end ? new Date(end) : new Date();

        const data = await this.inventoryReports.getStockMovements(startDate, endDate, productId);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    // ============ FINANCIAL REPORTS ============

    @Get('financial/revenue')
    @ApiOperation({ summary: 'Get revenue summary' })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    async getRevenueSummary(
        @Query('start') start?: string,
        @Query('end') end?: string,
    ) {
        const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = end ? new Date(end) : new Date();

        const data = await this.financialReports.getRevenueSummary(startDate, endDate);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    @Get('financial/tax')
    @ApiOperation({ summary: 'Get tax collected report' })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    async getTaxCollected(
        @Query('start') start?: string,
        @Query('end') end?: string,
    ) {
        const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = end ? new Date(end) : new Date();

        const data = await this.financialReports.getTaxCollected(startDate, endDate);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    @Get('financial/register/:sessionId')
    @ApiOperation({ summary: 'Get register session summary' })
    async getRegisterSummary(@Param('sessionId') sessionId: string) {
        const data = await this.financialReports.getRegisterSummary(sessionId);
        return { success: true, data, timestamp: new Date().toISOString() };
    }

    @Get('financial/profit')
    @ApiOperation({ summary: 'Get profit margin analysis' })
    @ApiQuery({ name: 'start', required: false })
    @ApiQuery({ name: 'end', required: false })
    async getProfitMargin(
        @Query('start') start?: string,
        @Query('end') end?: string,
    ) {
        const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = end ? new Date(end) : new Date();

        const data = await this.financialReports.getProfitMargin(startDate, endDate);
        return { success: true, data, timestamp: new Date().toISOString() };
    }
}
