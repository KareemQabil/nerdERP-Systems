import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Translation Response DTO
 */
export class TranslationResponseDto {
    @ApiProperty({ description: 'Translation ID' })
    id: string;

    @ApiProperty({ description: 'Language code' })
    languageCode: string;

    @ApiProperty({ description: 'Translation key' })
    translationKey: string;

    @ApiProperty({ description: 'Translation value' })
    translationValue: string;

    @ApiPropertyOptional({ description: 'Context' })
    context?: string | null;

    @ApiPropertyOptional({ description: 'Store ID (null for global translations)' })
    storeId?: string | null;

    @ApiProperty({ description: 'Is custom translation' })
    isCustom: boolean;

    @ApiProperty({ description: 'Is active' })
    isActive: boolean;

    @ApiProperty({ description: 'Created at' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated at' })
    updatedAt: Date;
}

/**
 * Bulk Translation Response
 */
export class BulkTranslationsResponseDto {
    @ApiProperty({ description: 'Number of translations imported' })
    count: number;

    @ApiProperty({ description: 'Import result message' })
    message: string;
}
