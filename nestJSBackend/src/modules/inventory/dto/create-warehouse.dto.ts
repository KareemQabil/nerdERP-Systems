import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateWarehouseDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateWarehouseDto extends CreateWarehouseDto { }
