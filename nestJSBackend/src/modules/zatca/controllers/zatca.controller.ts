import { Controller, Get, Post, Query, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { QrCodeService, ZatcaQRData } from '../services/qr-code.service';
import { DigitalSignatureService, InvoiceHashData } from '../services/digital-signature.service';
import { ReportingService, DailyTaxSummary, MonthlyTaxReport } from '../services/reporting.service';

/**
 * ZATCA Controller
 *
 * Provides endpoints for Saudi Arabian tax compliance.
 *
 * Features:
 * - QR code generation for invoices
 * - Invoice hash chain management
 * - Tax reports (daily, monthly)
 * - Void reporting
 * - ZATCA export format
 */
@ApiTags('zatca')
@Controller('zatca')
export class ZatcaController {
    constructor(
        private readonly qrCodeService: QrCodeService,
        private readonly digitalSignatureService: DigitalSignatureService,
        private readonly reportingService: ReportingService,
    ) { }

    /**
     * Generate QR code for an order
     *
     * POST /api/v1/zatca/qr
     *
     * Request body:
     * {
     *   "seller": "NerdPOS",
     *   "vatNo": "123456789012345",
     *   "timestamp": "2024-01-01T12:00:00Z",
     *   "total": "100.00",
     *   "vat": "15.00"
     * }
     *
     * Response:
     * {
     *   "encoded": "Base64 encoded TLV string",
     *   "seller": "NerdPOS",
     *   "vatNo": "123456789012345",
     *   "timestamp": "2024-01-01T12:00:00Z",
     *   "total": "100.000",
     *   "vat": "15.000"
     * }
     */
    @Post('qr')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Generate ZATCA QR code for an invoice' })
    @ApiResponse({ status: 200, description: 'QR code generated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid QR data' })
    @ApiBody({
        description: 'Invoice data for QR code generation',
        required: true,
        schema: {
            type: 'object',
            properties: {
                seller: { type: 'string', example: 'NerdPOS' },
                vatNo: { type: 'string', example: '123456789012345', description: '15-digit VAT number' },
                timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T12:00:00Z' },
                total: { type: 'string', example: '100.00', description: 'Total with VAT' },
                vat: { type: 'string', example: '15.00', description: 'VAT amount' },
            },
        },
    })
    generateQRCode(@Body() data: ZatcaQRData) {
        // Validate data
        const validation = this.qrCodeService.validateQRData(data);
        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors,
            };
        }

        // Generate QR for frontend
        const qrData = this.qrCodeService.generateQrForFrontend(data);

        return {
            success: true,
            data: qrData,
        };
    }

    /**
     * Parse QR code
     *
     * POST /api/v1/zatca/qr/parse
     *
     * Request body:
     * {
     *   "base64Data": "Base64 encoded TLV string"
     * }
     *
     * Response:
     * {
     *   "seller": "NerdPOS",
     *   "vatNo": "123456789012345",
     *   "timestamp": "2024-01-01T12:00:00Z",
     *   "total": "100.000",
     *   "vat": "15.000"
     * }
     */
    @Post('qr/parse')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Parse ZATCA QR code' })
    @ApiResponse({ status: 200, description: 'QR code parsed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid QR code data' })
    @ApiBody({
        description: 'Base64 encoded QR data',
        required: true,
        schema: {
            type: 'object',
            properties: {
                base64Data: { type: 'string', example: 'MDEwOE5lcmRQT1MwMTEwMTIzNDU2Nzg5MDEyMzQyMDI0LTAxLTAxVDEyOjAwOjAwWjA0MDAwMDAwMDEyMzQ1NjgwMDUwMDAwMDAwMDEyMzQ1Ng==' },
            },
        },
    })
    parseQRCode(@Body() body: { base64Data: string }) {
        const parsed = this.qrCodeService.parseQRCode(body.base64Data);

        if (!parsed) {
            return {
                success: false,
                error: 'Failed to parse QR code',
            };
        }

        return {
            success: true,
            data: parsed,
        };
    }

    /**
     * Create invoice hash entry
     *
     * POST /api/v1/zatca/invoice-hash
     *
     * Creates a new entry in the hash chain for an invoice.
     * The hash is generated from invoice data and linked to the previous hash.
     *
     * Request body:
     * {
     *   "orderId": "order-uuid",
     *   "invoiceNumber": "INV-20240101-00001",
     *   "timestamp": "2024-01-01T12:00:00Z",
     *   "totalWithVat": "115.00",
     *   "vatAmount": "15.00",
     *   "vatNumber": "123456789012345"
     * }
     */
    @Post('invoice-hash')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Create invoice hash chain entry' })
    @ApiResponse({ status: 200, description: 'Hash entry created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid hash data' })
    @ApiBody({
        description: 'Invoice data for hash generation',
        required: true,
        schema: {
            type: 'object',
            properties: {
                orderId: { type: 'string', example: 'order-uuid' },
                invoiceNumber: { type: 'string', example: 'INV-20240101-00001' },
                timestamp: { type: 'string', format: 'date-time', example: '2024-01-01T12:00:00Z' },
                totalWithVat: { type: 'string', example: '115.00' },
                vatAmount: { type: 'string', example: '15.00' },
                vatNumber: { type: 'string', example: '123456789012345' },
            },
        },
    })
    async createInvoiceHash(@Body() data: InvoiceHashData) {
        // Validate data
        const validation = this.digitalSignatureService.validateHashData(data);
        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors,
            };
        }

        // Create hash entry
        const hashEntry = await this.digitalSignatureService.createInvoiceHashEntry(data);

        return {
            success: true,
            data: hashEntry,
        };
    }

    /**
     * Get invoice hash by order ID
     *
     * GET /api/v1/zatca/invoice-hash/:orderId
     *
     * Returns the hash chain entry for a specific order.
     */
    @Get('invoice-hash/:orderId')
    @ApiOperation({ summary: 'Get invoice hash by order ID' })
    @ApiResponse({ status: 200, description: 'Hash entry retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Hash entry not found' })
    @ApiParam({ name: 'orderId', type: 'string', example: 'order-uuid' })
    getInvoiceHash(@Param('orderId') orderId: string) {
        const hashEntry = this.digitalSignatureService.getInvoiceHash(orderId);

        if (!hashEntry) {
            return {
                success: false,
                error: 'Hash entry not found',
            };
        }

        return {
            success: true,
            data: hashEntry,
        };
    }

    /**
     * Verify hash chain
     *
     * GET /api/v1/zatca/verify-hash/:orderId
     *
     * Verifies the integrity of the hash chain up to the specified order.
     */
    @Get('verify-hash/:orderId')
    @ApiOperation({ summary: 'Verify hash chain integrity' })
    @ApiResponse({ status: 200, description: 'Hash chain verified' })
    @ApiParam({ name: 'orderId', type: 'string', example: 'order-uuid' })
    verifyHashChain(@Param('orderId') orderId: string) {
        const verification = this.digitalSignatureService.verifyHashChain(orderId);

        return {
            success: verification.valid,
            data: verification,
        };
    }

    /**
     * Get latest hash in chain
     *
     * GET /api/v1/zatca/latest-hash
     *
     * Returns the latest hash in the chain (for chain continuity verification).
     */
    @Get('latest-hash')
    @ApiOperation({ summary: 'Get latest hash in chain' })
    @ApiResponse({ status: 200, description: 'Latest hash retrieved' })
    getLatestHash() {
        const latestHash = this.digitalSignatureService.getLatestHash();

        return {
            success: true,
            data: {
                latestHash,
            },
        };
    }

    /**
     * Get hash chain statistics
     *
     * GET /api/v1/zatca/hash-stats
     *
     * Returns statistics about the hash chain.
     */
    @Get('hash-stats')
    @ApiOperation({ summary: 'Get hash chain statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved' })
    getHashChainStats() {
        const stats = this.digitalSignatureService.getHashChainStats();

        return {
            success: true,
            data: stats,
        };
    }

    /**
     * Get daily tax summary
     *
     * GET /api/v1/zatca/daily-report
     *
     * Query params:
     * - date: ISO date string (defaults to today)
     *
     * Example: GET /api/v1/zatca/daily-report?date=2024-01-01
     */
    @Get('daily-report')
    @ApiOperation({ summary: 'Get daily tax summary' })
    @ApiResponse({ status: 200, description: 'Daily report generated' })
    @ApiQuery({ name: 'date', required: false, type: 'string', example: '2024-01-01' })
    async getDailyReport(@Query('date') dateStr?: string) {
        const date = dateStr ? new Date(dateStr) : new Date();

        const summary = await this.reportingService.getDailyTaxSummary(date);

        return {
            success: true,
            data: summary,
        };
    }

    /**
     * Get monthly tax report
     *
     * GET /api/v1/zatca/monthly-report
     *
     * Query params:
     * - year: Year (defaults to current year)
     * - month: Month 1-12 (defaults to current month)
     *
     * Example: GET /api/v1/zatca/monthly-report?year=2024&month=1
     */
    @Get('monthly-report')
    @ApiOperation({ summary: 'Get monthly tax report with daily breakdown' })
    @ApiResponse({ status: 200, description: 'Monthly report generated' })
    @ApiQuery({ name: 'year', required: false, type: 'number', example: 2024 })
    @ApiQuery({ name: 'month', required: false, type: 'number', example: 1 })
    async getMonthlyReport(
        @Query('year') yearStr?: string,
        @Query('month') monthStr?: string,
    ) {
        const now = new Date();
        const year = yearStr ? parseInt(yearStr) : now.getFullYear();
        const month = monthStr ? parseInt(monthStr) : now.getMonth() + 1;

        const report = await this.reportingService.getMonthlyTaxReport(year, month);

        return {
            success: true,
            data: report,
        };
    }

    /**
     * Get void report
     *
     * GET /api/v1/zatca/void-report
     *
     * Query params:
     * - startDate: Start date (ISO format)
     * - endDate: End date (ISO format)
     *
     * Example: GET /api/v1/zatca/void-report?startDate=2024-01-01&endDate=2024-01-31
     */
    @Get('void-report')
    @ApiOperation({ summary: 'Get void report with breakdown by reason and user' })
    @ApiResponse({ status: 200, description: 'Void report generated' })
    @ApiResponse({ status: 400, description: 'Invalid date range' })
    @ApiQuery({ name: 'startDate', required: true, type: 'string', example: '2024-01-01' })
    @ApiQuery({ name: 'endDate', required: true, type: 'string', example: '2024-01-31' })
    async getVoidReport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // Validate date range
        const validation = this.reportingService.validateDateRange(startDate, endDate);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
            };
        }

        const report = await this.reportingService.getVoidReport(startDate, endDate);

        return {
            success: true,
            data: report,
        };
    }

    /**
     * Get ZATCA export data
     *
     * GET /api/v1/zatca/export
     *
     * Query params:
     * - startDate: Start date (ISO format)
     * - endDate: End date (ISO format)
     * - vatNumber: VAT registration number
     * - companyName: Company name
     *
     * Example: GET /api/v1/zatca/export?startDate=2024-01-01&endDate=2024-01-31&vatNumber=123456789012345&companyName=NerdPOS
     */
    @Get('export')
    @ApiOperation({ summary: 'Get ZATCA export format data' })
    @ApiResponse({ status: 200, description: 'Export data generated' })
    @ApiResponse({ status: 400, description: 'Invalid parameters' })
    @ApiQuery({ name: 'startDate', required: true, type: 'string', example: '2024-01-01' })
    @ApiQuery({ name: 'endDate', required: true, type: 'string', example: '2024-01-31' })
    @ApiQuery({ name: 'vatNumber', required: true, type: 'string', example: '123456789012345' })
    @ApiQuery({ name: 'companyName', required: true, type: 'string', example: 'NerdPOS' })
    async getZatcaExport(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('vatNumber') vatNumber: string,
        @Query('companyName') companyName: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // Validate date range
        const validation = this.reportingService.validateDateRange(startDate, endDate);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
            };
        }

        const exportData = await this.reportingService.getZatcaExportData(
            startDate,
            endDate,
            vatNumber,
            companyName,
        );

        return {
            success: true,
            data: exportData,
        };
    }

    /**
     * Get tax by rate
     *
     * GET /api/v1/zatca/tax-by-rate
     *
     * Returns tax breakdown by VAT rate for a period.
     */
    @Get('tax-by-rate')
    @ApiOperation({ summary: 'Get tax breakdown by VAT rate' })
    @ApiResponse({ status: 200, description: 'Tax breakdown generated' })
    @ApiQuery({ name: 'startDate', required: true, type: 'string', example: '2024-01-01' })
    @ApiQuery({ name: 'endDate', required: true, type: 'string', example: '2024-01-31' })
    async getTaxByRate(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        const validation = this.reportingService.validateDateRange(startDate, endDate);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
            };
        }

        const data = await this.reportingService.getTaxByRate(startDate, endDate);

        return {
            success: true,
            data,
        };
    }

    /**
     * Get top items
     *
     * GET /api/v1/zatca/top-items
     *
     * Returns top-selling items for a period.
     */
    @Get('top-items')
    @ApiOperation({ summary: 'Get top-selling items' })
    @ApiResponse({ status: 200, description: 'Top items retrieved' })
    @ApiQuery({ name: 'startDate', required: true, type: 'string', example: '2024-01-01' })
    @ApiQuery({ name: 'endDate', required: true, type: 'string', example: '2024-01-31' })
    @ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 })
    async getTopItems(
        @Query('startDate') startDateStr: string,
        @Query('endDate') endDateStr: string,
        @Query('limit') limitStr?: string,
    ) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        const limit = limitStr ? parseInt(limitStr) : 10;

        const validation = this.reportingService.validateDateRange(startDate, endDate);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
            };
        }

        const items = await this.reportingService.getTopItems(startDate, endDate, limit);

        return {
            success: true,
            data: items,
        };
    }

    /**
     * Generate invoice number
     *
     * POST /api/v1/zatca/invoice-number
     *
     * Generates a sequential invoice number.
     *
     * Request body:
     * {
     *   "sequence": 1
     * }
     */
    @Post('invoice-number')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Generate invoice number' })
    @ApiResponse({ status: 200, description: 'Invoice number generated' })
    @ApiBody({
        required: true,
        schema: {
            type: 'object',
            properties: {
                sequence: { type: 'number', example: 1 },
                date: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00Z' },
            },
        },
    })
    generateInvoiceNumber(@Body() body: { sequence?: number; date?: string }) {
        const sequence = body.sequence || 1;
        const date = body.date ? new Date(body.date) : new Date();

        const invoiceNumber = this.digitalSignatureService.generateInvoiceNumber(sequence, date);

        return {
            success: true,
            data: {
                invoiceNumber,
            },
        };
    }
}
