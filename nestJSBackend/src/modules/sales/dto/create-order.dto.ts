import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/payment.entity';

export class OrderItemDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsNumber()
    @Min(0.001)
    quantity: number;

    @IsNumber()
    @Min(0)
    unitPrice: number;
}

export class OrderPaymentDto {
    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @IsNumber()
    @Min(0.01)
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
}
