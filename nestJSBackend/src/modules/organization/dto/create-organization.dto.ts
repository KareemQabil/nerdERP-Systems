import { IsString, IsOptional, IsObject, Length } from 'class-validator';

export class CreateOrganizationDto {
    @IsString()
    legalName: string;

    @IsString()
    taxId: string;

    @IsString()
    @Length(2, 2)
    countryCode: string;

    @IsString()
    @Length(3, 3)
    @IsOptional()
    baseCurrency?: string = 'SAR';

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}
