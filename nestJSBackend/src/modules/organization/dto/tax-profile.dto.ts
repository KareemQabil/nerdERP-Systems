import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TaxCalculationType } from '../entities/tax-profile.entity';

export class CreateTaxDefinitionDto {
    @IsString()
    taxName: string;

    @IsString()
    taxCode: string;

    @IsEnum(TaxCalculationType)
    calculationType: TaxCalculationType;

    @IsNumber()
    @Min(0)
    @Max(100)
    taxRate: number;

    @IsBoolean()
    @IsOptional()
    isInclusive?: boolean;

    @IsNumber()
    @IsOptional()
    displayOrder?: number;

    @IsString()
    @IsOptional()
    compoundOnTaxId?: string;

    @IsString()
    @IsOptional()
    jurisdictionCode?: string;
}

export class CreateTaxProfileDto {
    @IsString()
    profileName: string;

    @IsOptional()
    translations?: Record<string, { name: string }>;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @IsArray()
    @IsOptional()
    appliesToStores?: string[];

    @ValidateNested({ each: true })
    @Type(() => CreateTaxDefinitionDto)
    @IsOptional()
    taxDefinitions?: CreateTaxDefinitionDto[];
}

export class UpdateTaxProfileDto {
    @IsString()
    @IsOptional()
    profileName?: string;

    @IsOptional()
    translations?: Record<string, { name: string }>;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @IsOptional()
    appliesToStores?: string[];

    @ValidateNested({ each: true })
    @Type(() => CreateTaxDefinitionDto)
    @IsOptional()
    taxDefinitions?: CreateTaxDefinitionDto[];
}
