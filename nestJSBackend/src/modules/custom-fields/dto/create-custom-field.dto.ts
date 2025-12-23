import { IsString, IsEnum, IsObject, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { EntityType, FieldType } from '../entities/custom-field-definition.entity';

export class CreateCustomFieldDto {
    @IsEnum(EntityType)
    entityType: EntityType;

    @IsString()
    fieldKey: string;

    @IsObject()
    fieldLabel: Record<string, string>;

    @IsEnum(FieldType)
    fieldType: FieldType;

    @IsArray()
    @IsOptional()
    fieldOptions?: string[];

    @IsObject()
    @IsOptional()
    validationRules?: {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: string;
    };

    @IsNumber()
    @IsOptional()
    displayOrder?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @IsOptional()
    appliesToStores?: string[];
}
