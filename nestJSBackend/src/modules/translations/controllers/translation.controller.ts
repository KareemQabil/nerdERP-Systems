import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TranslationService } from '../services/translation.service';
import { CreateTranslationDto } from '../dto/create-translation.dto';
import { UpdateTranslationDto } from '../dto/update-translation.dto';
import { TranslationResponseDto, BulkTranslationsResponseDto } from '../dto/translation-response.dto';
import { Translation } from '../entities/translation.entity';

/**
 * Translation Controller
 * Manages UI translations for multiple languages
 */
@ApiTags('Translations')
@Controller('translations')
export class TranslationController {
    constructor(private readonly translationService: TranslationService) {}

    /**
     * GET /api/translations/:storeId/:lang
     * Get all translations for store in language
     */
    @Get(':storeId/:lang')
    @ApiOperation({
        summary: 'Get translations by store and language',
        description: 'Returns all translations for a specific store and language, including global translations merged with store-specific overrides.',
    })
    async getTranslations(
        @Param('storeId') storeId: string,
        @Param('lang') lang: string,
    ): Promise<{ success: true; data: Translation[] }> {
        const translations = await this.translationService.getTranslationsByStore(storeId, lang);
        return { success: true, data: translations };
    }

    /**
     * GET /api/translations/global/:lang
     * Get global translations only
     */
    @Get('global/:lang')
    @ApiOperation({
        summary: 'Get global translations',
        description: 'Returns global (system-wide) translations for a specific language.',
    })
    async getGlobalTranslations(
        @Param('lang') lang: string,
    ): Promise<{ success: true; data: Translation[] }> {
        const translations = await this.translationService.getTranslationsByStore('', lang);
        return { success: true, data: translations };
    }

    /**
     * POST /api/translations/import
     * Bulk import translations from JSON
     */
    @Post('import')
    @ApiOperation({
        summary: 'Bulk import translations',
        description: 'Imports multiple translations from a JSON object. Used for seeding initial system translations.',
    })
    async importTranslations(
        @Body() body: {
            languageCode: string;
            translations: Record<string, string>;
            context?: string;
        },
    ): Promise<{ success: true; data: BulkTranslationsResponseDto }> {
        const result = await this.translationService.bulkImport(
            body.languageCode,
            body.translations,
            body.context,
        );
        return { success: true, data: result };
    }

    /**
     * PUT /api/translations/:storeId
     * Update or create translation
     */
    @Put(':storeId')
    @ApiOperation({
        summary: 'Upsert translation',
        description: 'Creates a new translation or updates an existing one. Supports both global and store-specific translations.',
    })
    async upsertTranslation(
        @Param('storeId') storeId: string,
        @Body() body: {
            languageCode: string;
            translationKey: string;
            translationValue: string;
            context?: string;
        },
    ): Promise<{ success: true; data: Translation }> {
        const translation = await this.translationService.upsert(
            storeId === 'global' ? null : storeId,
            body.languageCode,
            body.translationKey,
            body.translationValue,
            body.context,
        );
        return { success: true, data: translation };
    }

    /**
     * POST /api/translations
     * Create new translation
     */
    @Post()
    @ApiOperation({
        summary: 'Create translation',
        description: 'Creates a new translation entry.',
    })
    async createTranslation(
        @Body() createDto: CreateTranslationDto,
    ): Promise<{ success: true; data: TranslationResponseDto }> {
        const translation = await this.translationService.create(createDto);
        return {
            success: true,
            data: this.translationService.toResponseDto(translation),
        };
    }

    /**
     * DELETE /api/translations/:id
     * Delete translation
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'Delete translation',
        description: 'Deletes a translation by ID.',
    })
    async deleteTranslation(@Param('id') id: string): Promise<{ success: true }> {
        await this.translationService.delete(id);
        return { success: true };
    }

    /**
     * GET /api/translations/languages
     * Get all supported languages
     */
    @Get('languages')
    @ApiOperation({
        summary: 'Get supported languages',
        description: 'Returns all active supported languages in the system.',
    })
    async getSupportedLanguages(): Promise<{
        success: true;
        data: any[];
    }> {
        const languages = await this.translationService.getSupportedLanguages();
        return { success: true, data: languages };
    }
}
