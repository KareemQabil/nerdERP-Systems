import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTranslationDto } from './create-translation.dto';

/**
 * Update Translation DTO
 */
export class UpdateTranslationDto extends PartialType(CreateTranslationDto) {
    @ApiPropertyOptional({ description: 'Translation value' })
    @IsString()
    @IsOptional()
    translationValue?: string;

    @ApiPropertyOptional({ description: 'Context (POS, KDS, ADMIN, RECEIPT)' })
    @IsString()
    @IsOptional()
    context?: string;

    @ApiPropertyOptional({ description: 'Is translation active' })
    @IsOptional()
    isActive?: boolean;
}
