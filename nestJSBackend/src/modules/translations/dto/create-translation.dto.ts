import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Translation DTO
 */
export class CreateTranslationDto {
    @ApiProperty({ description: 'Language code (en, ar, fr, etc.)' })
    @IsString()
    @IsNotEmpty()
    languageCode: string;

    @ApiProperty({ description: 'Translation key (e.g., "menu.title", "button.checkout")' })
    @IsString()
    @IsNotEmpty()
    translationKey: string;

    @ApiProperty({ description: 'Translation value' })
    @IsString()
    @IsNotEmpty()
    translationValue: string;

    @ApiPropertyOptional({ description: 'Context (POS, KDS, ADMIN, RECEIPT)' })
    @IsString()
    @IsOptional()
    context?: string;

    @ApiPropertyOptional({ description: 'Store ID for store-specific translations. Null for global translations' })
    @IsString()
    @IsOptional()
    storeId?: string;
}
