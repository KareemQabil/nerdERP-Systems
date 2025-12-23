import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProductVariantService } from '../services/product-variant.service';
import { CreateProductVariantDto, CreateComboDto } from '../dto/product-variant.dto';

@Controller('api/v1/products')
export class ProductVariantController {
    constructor(private readonly variantService: ProductVariantService) { }

    @Get(':productId/variants')
    async getVariants(@Param('productId') productId: string) {
        const variants = await this.variantService.findVariantsByProduct(productId);
        return {
            success: true,
            data: variants,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('variants')
    async createVariant(@Body() dto: CreateProductVariantDto) {
        const variant = await this.variantService.createVariant(dto);
        return {
            success: true,
            data: variant,
            messageKey: 'VARIANT_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put('variants/:id')
    async updateVariant(@Param('id') id: string, @Body() dto: Partial<CreateProductVariantDto>) {
        const variant = await this.variantService.updateVariant(id, dto);
        return {
            success: true,
            data: variant,
            messageKey: 'VARIANT_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete('variants/:id')
    async deleteVariant(@Param('id') id: string) {
        await this.variantService.deleteVariant(id);
        return {
            success: true,
            data: null,
            messageKey: 'VARIANT_DELETED',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('combos')
    async getAllCombos() {
        const combos = await this.variantService.findAllCombos();
        return {
            success: true,
            data: combos,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('combos/:id')
    async getCombo(@Param('id') id: string) {
        const combo = await this.variantService.findComboById(id);
        return {
            success: true,
            data: combo,
            timestamp: new Date().toISOString(),
        };
    }

    @Post('combos')
    async createCombo(@Body() dto: CreateComboDto) {
        const combo = await this.variantService.createCombo(dto);
        return {
            success: true,
            data: combo,
            messageKey: 'COMBO_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put('combos/:id')
    async updateCombo(@Param('id') id: string, @Body() dto: Partial<CreateComboDto>) {
        const combo = await this.variantService.updateCombo(id, dto);
        return {
            success: true,
            data: combo,
            messageKey: 'COMBO_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete('combos/:id')
    async deleteCombo(@Param('id') id: string) {
        await this.variantService.deleteCombo(id);
        return {
            success: true,
            data: null,
            messageKey: 'COMBO_DELETED',
            timestamp: new Date().toISOString(),
        };
    }
}
