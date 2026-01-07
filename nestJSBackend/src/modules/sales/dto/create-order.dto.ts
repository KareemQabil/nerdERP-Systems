import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaymentMethod } from '../entities/payment.entity';
import { OrderType } from '../entities/sales-order.entity';

export class OrderItemDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsNumber()
    @Min(0.001)
    @Transform(({ value }) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? 1 : num;
    })
    quantity: number;

    @IsNumber()
    @Min(0)
    @Transform(({ value }) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? 0 : num;
    })
    unitPrice: number;
}

export class OrderPaymentDto {
    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @IsNumber()
    @Min(0.01)
    @Transform(({ value }) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? 0.01 : num;
    })
    amount: number;
}

export class CreateOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderPaymentDto)
    payments: OrderPaymentDto[];

    @IsUUID()
    @IsNotEmpty()
    registerSessionId: string;

    @IsUUID()
    @IsNotEmpty()
    warehouseId: string;

    // H-POS: Order Type (DINE_IN, TAKEAWAY, DELIVERY, TALABAT, MARSOOL, INSTASHOP)
    @IsEnum(OrderType)
    @IsOptional()
    orderType?: OrderType;

    // H-POS: Table association for dine-in orders
    @IsUUID()
    @IsOptional()
    tableId?: string;

    // H-POS: Number of customers at the table
    @IsNumber()
    @IsOptional()
    @Min(1)
    customerCount?: number;
}
