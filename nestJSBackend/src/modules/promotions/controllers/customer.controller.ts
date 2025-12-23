import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CustomerService } from '../services/customer.service';
import { CreateCustomerDto, UpdateCustomerDto, CreateCustomerAddressDto } from '../dto/customer.dto';

@Controller('api/v1/customers')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Get()
    async findAll() {
        const customers = await this.customerService.findAll();
        return {
            success: true,
            data: customers,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('search/phone')
    async findByPhone(@Query('phone') phone: string) {
        const customer = await this.customerService.findByPhone(phone);
        return {
            success: true,
            data: customer,
            timestamp: new Date().toISOString(),
        };
    }

    @Get('search/email')
    async findByEmail(@Query('email') email: string) {
        const customer = await this.customerService.findByEmail(email);
        return {
            success: true,
            data: customer,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const customer = await this.customerService.findById(id);
        return {
            success: true,
            data: customer,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    async create(@Body() dto: CreateCustomerDto) {
        const customer = await this.customerService.create(dto);
        return {
            success: true,
            data: customer,
            messageKey: 'CUSTOMER_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
        const customer = await this.customerService.update(id, dto);
        return {
            success: true,
            data: customer,
            messageKey: 'CUSTOMER_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.customerService.delete(id);
        return {
            success: true,
            data: null,
            messageKey: 'CUSTOMER_DELETED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/addresses')
    async addAddress(@Param('id') id: string, @Body() dto: CreateCustomerAddressDto) {
        const address = await this.customerService.addAddress(id, dto);
        return {
            success: true,
            data: address,
            messageKey: 'ADDRESS_ADDED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':customerId/addresses/:addressId/set-default')
    async setDefaultAddress(
        @Param('customerId') customerId: string,
        @Param('addressId') addressId: string,
    ) {
        await this.customerService.setDefaultAddress(customerId, addressId);
        return {
            success: true,
            data: null,
            messageKey: 'DEFAULT_ADDRESS_SET',
            timestamp: new Date().toISOString(),
        };
    }
}
