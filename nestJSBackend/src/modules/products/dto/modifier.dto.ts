import { IsString, IsBoolean, IsOptional, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateModifierOptionDto {
    @IsString()
    optionName: string;

    @IsOptional()
    translations?: Record<string, { name: string }>;

    @IsNumber()
    @IsOptional()
    priceAdjustment?: number;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @IsNumber()
    @IsOptional()
    displayOrder?: number;

    @IsString()
    @IsOptional()
    deductProductId?: string;

    @IsNumber()
    @IsOptional()
    deductQuantity?: number;
}

export class CreateModifierDto {
    @IsString()
    modifierName: string;

    @IsOptional()
    translations?: Record<string, { name: string }>;

    @IsBoolean()
    @IsOptional()
    isRequired?: boolean;

    @IsNumber()
    @Min(0)
    @IsOptional()
    minSelections?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    maxSelections?: number;

    @IsNumber()
    @IsOptional()
    displayOrder?: number;

    @ValidateNested({ each: true })
    @Type(() => CreateModifierOptionDto)
    @IsOptional()
    options?: CreateModifierOptionDto[];
}

export class UpdateModifierDto {
    @IsString()
    @IsOptional()
    modifierName?: string;

    @IsOptional()
    translations?: Record<string, { name: string }>;

    @IsBoolean()
    @IsOptional()
    isRequired?: boolean;

    @IsNumber()
    @Min(0)
    @IsOptional()
    minSelections?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    maxSelections?: number;

    @IsNumber()
    @IsOptional()
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ValidateNested({ each: true })
    @Type(() => CreateModifierOptionDto)
    @IsOptional()
    options?: CreateModifierOptionDto[];
}

export class LinkModifierToProductDto {
    @IsString()
    productId: string;

    @IsString()
    modifierId: string;

    @IsNumber()
    @IsOptional()
    displayOrder?: number;

    @IsOptional()
    conditionLogic?: any;
}
