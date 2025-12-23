import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DeviceService } from '../services/device.service';
import { CreateDeviceDto, UpdateDeviceDto } from '../dto/user.dto';

@Controller('api/v1/devices')
@ApiTags('Devices')
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) { }

    @Get()
    @ApiOperation({ summary: 'Get all devices' })
    async findAll() {
        const devices = await this.deviceService.findAll();
        return {
            success: true,
            data: devices,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('store/:storeId')
    @ApiOperation({ summary: 'Get devices by store' })
    async findByStore(@Param('storeId') storeId: string) {
        const devices = await this.deviceService.findByStore(storeId);
        return {
            success: true,
            data: devices,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get device by ID' })
    async findOne(@Param('id') id: string) {
        const device = await this.deviceService.findById(id);
        return {
            success: true,
            data: device,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    @ApiOperation({ summary: 'Register new device' })
    async create(@Body() dto: CreateDeviceDto) {
        const device = await this.deviceService.create(dto);
        return {
            success: true,
            data: device,
            messageKey: 'DEVICE_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update device' })
    async update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
        const device = await this.deviceService.update(id, dto);
        return {
            success: true,
            data: device,
            messageKey: 'DEVICE_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete device' })
    async delete(@Param('id') id: string) {
        await this.deviceService.delete(id);
        return {
            success: true,
            data: null,
            messageKey: 'DEVICE_DELETED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/heartbeat')
    @ApiOperation({ summary: 'Device heartbeat ping' })
    async heartbeat(@Param('id') id: string) {
        await this.deviceService.heartbeat(id);
        return {
            success: true,
            data: { lastSeenAt: new Date() },
            timestamp: new Date().toISOString(),
        };
    }
}
