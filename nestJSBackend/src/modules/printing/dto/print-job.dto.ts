import { IsString, IsEnum, IsOptional, IsObject, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Print Job DTO
 */
export class CreatePrintJobDto {
    @ApiProperty({ example: 'printer-uuid' })
    @IsUUID()
    printerId: string;

    @ApiProperty({ example: 'order-uuid', required: false })
    @IsOptional()
    @IsUUID()
    orderId?: string;

    @ApiProperty({
        enum: ['RECEIPT', 'KITCHEN_TICKET', 'INVOICE', 'TEST'],
        example: 'RECEIPT',
    })
    @IsEnum(['RECEIPT', 'KITCHEN_TICKET', 'INVOICE', 'TEST'])
    type: 'RECEIPT' | 'KITCHEN_TICKET' | 'INVOICE' | 'TEST';

    @ApiProperty({ example: { orderId: 'uuid', items: [] }, required: false })
    @IsOptional()
    @IsObject()
    printData?: Record<string, any>;

    @ApiProperty({ example: 'store-uuid', required: false })
    @IsOptional()
    @IsUUID()
    storeId?: string;

    @ApiProperty({ example: 'device-uuid', required: false })
    @IsOptional()
    @IsString()
    deviceId?: string;

    @ApiProperty({ example: 'user-uuid', required: false })
    @IsOptional()
    @IsUUID()
    userId?: string;
}

/**
 * Generate Receipt DTO
 */
export class GenerateReceiptDto {
    @ApiProperty({ example: 'order-uuid' })
    @IsUUID()
    orderId: string;

    @ApiProperty({ enum: ['THERMAL_80MM', 'THERMAL_58MM', 'A4'], example: 'THERMAL_80MM' })
    @IsEnum(['THERMAL_80MM', 'THERMAL_58MM', 'A4'])
    format: 'THERMAL_80MM' | 'THERMAL_58MM' | 'A4';

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    includeZatcaQr?: boolean;

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    previewOnly?: boolean;
}

/**
 * Generate Kitchen Ticket DTO
 */
export class GenerateKitchenTicketDto {
    @ApiProperty({ example: 'order-uuid' })
    @IsUUID()
    orderId: string;

    @ApiProperty({ example: 'KITCHEN', enum: ['KITCHEN', 'BAR', 'DESSERT'] })
    @IsEnum(['KITCHEN', 'BAR', 'DESSERT'])
    station: 'KITCHEN' | 'BAR' | 'DESSERT';

    @ApiProperty({ example: false, required: false })
    @IsOptional()
    priority?: boolean;
}

/**
 * Update Print Job DTO
 */
export class UpdatePrintJobDto {
    @ApiProperty({ enum: ['QUEUED', 'PRINTING', 'COMPLETED', 'FAILED', 'CANCELLED'] })
    @IsEnum(['QUEUED', 'PRINTING', 'COMPLETED', 'FAILED', 'CANCELLED'])
    status: 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    errorMessage?: string;
}

/**
 * Test Print DTO
 */
export class TestPrintDto {
    @ApiProperty({ example: 'printer-uuid' })
    @IsUUID()
    printerId: string;

    @ApiProperty({ example: 'THERMAL_80MM' })
    @IsEnum(['THERMAL_80MM', 'THERMAL_58MM', 'A4'])
    format: 'THERMAL_80MM' | 'THERMAL_58MM' | 'A4';
}
