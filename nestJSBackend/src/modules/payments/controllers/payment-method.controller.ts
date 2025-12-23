import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentMethodService } from '../services/payment-method.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../dto/payment-method.dto';

@Controller('api/v1/payment-methods')
@ApiTags('Payment Methods')
export class PaymentMethodController {
    constructor(private readonly paymentMethodService: PaymentMethodService) { }

    @Get()
    @ApiOperation({ summary: 'Get all payment methods' })
    async findAll() {
        const methods = await this.paymentMethodService.findAll();
        return {
            success: true,
            data: methods,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get payment method by ID' })
    async findOne(@Param('id') id: string) {
        const method = await this.paymentMethodService.findById(id);
        return {
            success: true,
            data: method,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    @ApiOperation({ summary: 'Create payment method' })
    async create(@Body() dto: CreatePaymentMethodDto) {
        const method = await this.paymentMethodService.create(dto);
        return {
            success: true,
            data: method,
            messageKey: 'PAYMENT_METHOD_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update payment method' })
    async update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) {
        const method = await this.paymentMethodService.update(id, dto);
        return {
            success: true,
            data: method,
            messageKey: 'PAYMENT_METHOD_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete payment method' })
    async delete(@Param('id') id: string) {
        await this.paymentMethodService.delete(id);
        return {
            success: true,
            data: null,
            messageKey: 'PAYMENT_METHOD_DELETED',
            timestamp: new Date().toISOString(),
        };
    }
}
