import { Body, Controller, Post } from '@nestjs/common';
import { SalesService } from '../services/sales.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { SalesOrder } from '../entities/sales-order.entity';

@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post('orders')
    async createOrder(@Body() createDto: CreateOrderDto): Promise<SalesOrder> {
        return await this.salesService.createOrder(createDto);
    }
}
