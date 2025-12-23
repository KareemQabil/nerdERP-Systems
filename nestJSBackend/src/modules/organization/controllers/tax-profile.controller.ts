import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TaxProfileService } from '../services/tax-profile.service';
import { CreateTaxProfileDto, UpdateTaxProfileDto } from '../dto/tax-profile.dto';

@Controller('api/v1/tax-profiles')
export class TaxProfileController {
    constructor(private readonly taxProfileService: TaxProfileService) { }

    @Get()
    async findAll(@Query('storeId') storeId?: string) {
        const profiles = await this.taxProfileService.findAll(storeId);
        return {
            success: true,
            data: profiles,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('default')
    async getDefault(@Query('storeId') storeId?: string) {
        const profile = await this.taxProfileService.getDefaultProfile(storeId);
        return {
            success: true,
            data: profile,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const profile = await this.taxProfileService.findById(id);
        return {
            success: true,
            data: profile,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    async create(@Body() dto: CreateTaxProfileDto) {
        const profile = await this.taxProfileService.create(dto);
        return {
            success: true,
            data: profile,
            messageKey: 'TAX_PROFILE_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateTaxProfileDto) {
        const profile = await this.taxProfileService.update(id, dto);
        return {
            success: true,
            data: profile,
            messageKey: 'TAX_PROFILE_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.taxProfileService.delete(id);
        return {
            success: true,
            data: null,
            messageKey: 'TAX_PROFILE_DELETED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/set-default')
    async setDefault(@Param('id') id: string) {
        const profile = await this.taxProfileService.setDefault(id);
        return {
            success: true,
            data: profile,
            messageKey: 'TAX_PROFILE_SET_DEFAULT',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/calculate')
    async calculateTax(@Param('id') id: string, @Body('amount') amount: number) {
        const result = await this.taxProfileService.calculateTax(id, amount);
        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }
}
