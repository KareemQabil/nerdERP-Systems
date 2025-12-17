import { IsNotEmpty, IsOptional, IsString, IsNumber, IsHexColor, IsUUID } from 'class-validator';

export class CreateCategoryDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    nameAr?: string;

    @IsOptional()
    @IsNumber()
    displayOrder?: number;

    @IsOptional()
    @IsHexColor()
    colorHex?: string;

    @IsOptional()
    @IsUUID()
    parentId?: string;
}

export class UpdateCategoryDto extends CreateCategoryDto { }
