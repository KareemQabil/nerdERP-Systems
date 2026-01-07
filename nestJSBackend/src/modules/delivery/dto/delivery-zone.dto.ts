/**
 * Delivery Zone DTOs
 * H-POS: DTOs for zone-based delivery management
 */
import { IsString, IsNumber, IsOptional, IsUUID, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeliveryZoneDto {
    @ApiProperty({ example: 'Zone A - Downtown' })
    @IsString()
    zoneName: string;

    @ApiProperty({ example: 'A' })
    @IsString()
    zoneCode: string;

    @ApiProperty({ example: 50.0, description: 'Delivery fee in local currency' })
    @IsNumber()
    @Min(0)
    deliveryFee: number;

    @ApiProperty({ required: false, example: 300.0, description: 'Minimum order for free delivery' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    freeDeliveryMinimum?: number;

    @ApiProperty({ required: false, example: 50.0, description: 'Minimum order value to accept delivery' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minimumOrderValue?: number;

    @ApiProperty({ required: false, example: 45, description: 'Estimated delivery time in minutes' })
    @IsOptional()
    @IsNumber()
    @Min(5)
    @Max(180)
    estimatedDeliveryMinutes?: number;

    @ApiProperty({ required: false, description: 'Polygon coordinates for map selection' })
    @IsOptional()
    @IsArray()
    polygon?: { lat: number; lng: number }[];

    @ApiProperty({ required: false, example: '#FF5722', description: 'Color for UI display' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiProperty({ required: false, example: 0 })
    @IsOptional()
    @IsNumber()
    displayOrder?: number;

    @ApiProperty({ example: 'uuid-store-001' })
    @IsUUID()
    storeId: string;
}

export class UpdateDeliveryZoneDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    zoneName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    deliveryFee?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    freeDeliveryMinimum?: number | null;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    minimumOrderValue?: number | null;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    @Min(5)
    @Max(180)
    estimatedDeliveryMinutes?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    polygon?: { lat: number; lng: number }[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    displayOrder?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

/**
 * DTO for calculating delivery fee based on zone and order total
 */
export class CalculateDeliveryFeeDto {
    @ApiProperty({ example: 'uuid-zone-001' })
    @IsUUID()
    zoneId: string;

    @ApiProperty({ example: 150.0, description: 'Order subtotal' })
    @IsNumber()
    @Min(0)
    orderTotal: number;
}

/**
 * Response for delivery fee calculation
 */
export class DeliveryFeeResponse {
    zoneId: string;
    zoneName: string;
    deliveryFee: number;
    isFreeDelivery: boolean;
    freeDeliveryThreshold?: number;
    estimatedMinutes?: number;
}
