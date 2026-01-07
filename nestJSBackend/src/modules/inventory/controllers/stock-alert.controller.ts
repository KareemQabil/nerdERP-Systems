import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { StockAlertService } from '../services/stock-alert.service';

@Controller('inventory/alerts')
export class StockAlertController {
    constructor(private readonly alertService: StockAlertService) { }

    @Get()
    async getActiveAlerts() {
        const alerts = await this.alertService.findActive();
        return {
            success: true,
            data: alerts,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('product/:productId')
    async getProductAlerts(
        @Param('productId') productId: string,
        @Query('warehouseId') warehouseId?: string,
    ) {
        const alerts = await this.alertService.findByProduct(productId, warehouseId);
        return {
            success: true,
            data: alerts,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('check/:productId/:warehouseId')
    async checkStock(
        @Param('productId') productId: string,
        @Param('warehouseId') warehouseId: string,
    ) {
        await this.alertService.checkAndCreateAlerts(productId, warehouseId);
        return {
            success: true,
            data: null,
            messageKey: 'ALERTS_CHECKED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/acknowledge')
    async acknowledge(@Param('id') id: string, @Body('userId') userId: string) {
        const alert = await this.alertService.acknowledge(id, userId);
        return {
            success: true,
            data: alert,
            messageKey: 'ALERT_ACKNOWLEDGED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/resolve')
    async resolve(@Param('id') id: string) {
        const alert = await this.alertService.resolve(id);
        return {
            success: true,
            data: alert,
            messageKey: 'ALERT_RESOLVED',
            timestamp: new Date().toISOString(),
        };
    }
}
