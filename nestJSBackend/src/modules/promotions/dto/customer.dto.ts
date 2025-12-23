import { IsString, IsEmail, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCustomerAddressDto {
    @IsString()
    @IsOptional()
    addressLabel?: string;

    @IsString()
    streetAddress: string;

    @IsString()
    @IsOptional()
    district?: string;

    @IsString()
    city: string;

    @IsString()
    @IsOptional()
    postalCode?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsOptional()
    coordinates?: { lat: number; lng: number };

    @IsString()
    @IsOptional()
    deliveryInstructions?: string;
}

export class CreateCustomerDto {
    @IsString()
    firstName: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsDateString()
    @IsOptional()
    dateOfBirth?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @ValidateNested({ each: true })
    @Type(() => CreateCustomerAddressDto)
    @IsOptional()
    addresses?: CreateCustomerAddressDto[];

    @IsOptional()
    metadata?: Record<string, any>;

    @IsArray()
    @IsOptional()
    tags?: string[];
}

export class UpdateCustomerDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsDateString()
    @IsOptional()
    dateOfBirth?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsOptional()
    metadata?: Record<string, any>;

    @IsArray()
    @IsOptional()
    tags?: string[];

    @IsString()
    @IsOptional()
    notes?: string;
}
