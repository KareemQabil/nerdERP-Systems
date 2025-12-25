import { Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ZatcaService } from './services/zatca.service';

@ApiTags('ZATCA E-Invoicing')
@Controller('zatca')
export class ZatcaController {
    constructor(private readonly zatcaService: ZatcaService) { }

    @Get('validate-chain/:deviceId')
    @ApiOperation({ summary: 'Validate hash chain integrity for a device' })
    @ApiResponse({ status: 200, description: 'Hash chain validation result' })
    async validateHashChain(@Param('deviceId') deviceId: string) {
        const result = await this.zatcaService.validateHashChain(deviceId);
        return {
            success: result.valid,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('stats/:deviceId')
    @ApiOperation({ summary: 'Get hash chain statistics for a device' })
    @ApiResponse({ status: 200, description: 'Hash chain statistics' })
    async getHashChainStats(@Param('deviceId') deviceId: string) {
        const stats = await this.zatcaService.getHashChainStats(deviceId);
        return {
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('invoice/:orderId/xml')
    @ApiOperation({ summary: 'Generate XML invoice for an order' })
    @ApiResponse({ status: 200, description: 'UBL 2.1 XML invoice' })
    async getInvoiceXML(@Param('orderId') orderId: string) {
        const xml = await this.zatcaService.generateXMLInvoice(orderId);
        return {
            success: true,
            data: { xml },
            timestamp: new Date().toISOString(),
        };
    }

    @Post('process/:orderId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Process invoice for ZATCA compliance (admin)' })
    @ApiResponse({ status: 200, description: 'ZATCA processing result' })
    async processInvoice(
        @Param('orderId') orderId: string,
    ) {
        // This endpoint would typically only be used for manual processing
        // Normal flow is automatic via sales service
        return {
            success: true,
            data: { message: 'ZATCA processing is automatic via sales flow' },
            timestamp: new Date().toISOString(),
        };
    }
}
