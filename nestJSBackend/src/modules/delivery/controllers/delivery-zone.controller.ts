/**
 * Delivery Zone Controller
 * H-POS: RESTful endpoints for zone-based delivery management
 */
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeliveryZoneService } from '../services/delivery-zone.service';
import { CreateDeliveryZoneDto, UpdateDeliveryZoneDto, CalculateDeliveryFeeDto } from '../dto/delivery-zone.dto';

@ApiTags('Delivery Zones')
@Controller('api/v1/delivery-zones')
export class DeliveryZoneController {
    constructor(private readonly zoneService: DeliveryZoneService) { }

    @Get()
    @ApiOperation({ summary: 'Get all delivery zones for a store' })
    async findAll(@Query('storeId') storeId: string) {
        const zones = await this.zoneService.findAll(storeId);
        return {
            success: true,
            data: zones,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('pos')
    @ApiOperation({ summary: 'Get simplified zones for POS cart UI' })
    async getZonesForPOS(@Query('storeId') storeId: string) {
        const zones = await this.zoneService.getZonesForPOS(storeId);
        return {
            success: true,
            data: zones,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single delivery zone' })
    async findOne(@Param('id') id: string) {
        const zone = await this.zoneService.findById(id);
        return {
            success: true,
            data: zone,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new delivery zone' })
    async create(@Body() dto: CreateDeliveryZoneDto) {
        const zone = await this.zoneService.create(dto);
        return {
            success: true,
            data: zone,
            messageKey: 'DELIVERY_ZONE_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a delivery zone' })
    async update(@Param('id') id: string, @Body() dto: UpdateDeliveryZoneDto) {
        const zone = await this.zoneService.update(id, dto);
        return {
            success: true,
            data: zone,
            messageKey: 'DELIVERY_ZONE_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a delivery zone (soft delete)' })
    async delete(@Param('id') id: string) {
        await this.zoneService.delete(id);
    }

    @Post('calculate-fee')
    @ApiOperation({ summary: 'Calculate delivery fee for an order' })
    async calculateFee(@Body() dto: CalculateDeliveryFeeDto) {
        const result = await this.zoneService.calculateDeliveryFee(dto.zoneId, dto.orderTotal);
        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('by-code/:storeId/:zoneCode')
    @ApiOperation({ summary: 'Get zone by code' })
    async findByCode(@Param('storeId') storeId: string, @Param('zoneCode') zoneCode: string) {
        const zone = await this.zoneService.findByCode(storeId, zoneCode);
        return {
            success: true,
            data: zone,
            timestamp: new Date().toISOString(),
        };
    }
}
