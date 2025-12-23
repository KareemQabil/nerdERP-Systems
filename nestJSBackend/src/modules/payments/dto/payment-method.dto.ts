import { IsString, IsBoolean, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
    @ApiProperty({ example: 'Credit Card' })
    @IsString()
    methodName: string;

    @ApiProperty({ example: 'CARD' })
    @IsString()
    methodCode: string;

    @ApiProperty({ example: 'Visa/Mastercard' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: true })
    @IsBoolean()
    isActive: boolean;

    @ApiProperty({ example: 1.5, description: 'Processing fee percentage' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    feePercentage?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    config?: Record<string, any>;
}

export class UpdatePaymentMethodDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    methodName?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    feePercentage?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    config?: Record<string, any>;
}
