import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ModifierService } from '../services/modifier.service';
import { CreateModifierDto, UpdateModifierDto, LinkModifierToProductDto } from '../dto/modifier.dto';

@Controller('api/v1/modifiers')
export class ModifierController {
    constructor(private readonly modifierService: ModifierService) { }

    @Get()
    async findAll() {
        const modifiers = await this.modifierService.findAll();
        return {
            success: true,
            data: modifiers,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('product/:productId')
    async findByProduct(@Param('productId') productId: string) {
        const modifiers = await this.modifierService.findByProduct(productId);
        return {
            success: true,
            data: modifiers,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const modifier = await this.modifierService.findById(id);
        return {
            success: true,
            data: modifier,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    async create(@Body() dto: CreateModifierDto) {
        const modifier = await this.modifierService.create(dto);
        return {
            success: true,
            data: modifier,
            messageKey: 'MODIFIER_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateModifierDto) {
        const modifier = await this.modifierService.update(id, dto);
        return {
            success: true,
            data: modifier,
            messageKey: 'MODIFIER_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.modifierService.delete(id);
        return {
            success: true,
            data: null,
            messageKey: 'MODIFIER_DELETED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post('link')
    async linkToProduct(@Body() dto: LinkModifierToProductDto) {
        const link = await this.modifierService.linkToProduct(dto);
        return {
            success: true,
            data: link,
            messageKey: 'MODIFIER_LINKED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete('link/:productId/:modifierId')
    async unlinkFromProduct(
        @Param('productId') productId: string,
        @Param('modifierId') modifierId: string,
    ) {
        await this.modifierService.unlinkFromProduct(productId, modifierId);
        return {
            success: true,
            data: null,
            messageKey: 'MODIFIER_UNLINKED',
            timestamp: new Date().toISOString(),
        };
    }
}
