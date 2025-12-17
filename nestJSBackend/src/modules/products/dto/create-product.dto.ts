import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    IsBoolean,
    Min,
} from 'class-validator';
import { ProductType } from '../entities/product.entity';

export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    sku: string;

    @IsOptional()
    @IsString()
    barcode?: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    nameAr?: string;

    @IsEnum(ProductType)
    @IsOptional()
    type?: ProductType;

    @IsBoolean()
    @IsOptional()
    trackInventory?: boolean;

    @IsNumber()
    @Min(0)
    salePrice: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    costPrice?: number;

    @IsUUID()
    @IsOptional()
    categoryId?: string;
}

export class UpdateProductDto extends CreateProductDto { }
