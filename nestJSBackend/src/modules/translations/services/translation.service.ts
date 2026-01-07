import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Translation, SupportedLanguage } from '../entities/translation.entity';
import { CreateTranslationDto } from '../dto/create-translation.dto';
import { UpdateTranslationDto } from '../dto/update-translation.dto';
import { TranslationResponseDto, BulkTranslationsResponseDto } from '../dto/translation-response.dto';

/**
 * Translation Service
 * Manages UI translations for multiple languages
 * Supports global and store-specific translations
 */
@Injectable()
export class TranslationService {
    constructor(
        @InjectRepository(Translation)
        private readonly translationRepo: Repository<Translation>,
        @InjectRepository(SupportedLanguage)
        private readonly languageRepo: Repository<SupportedLanguage>,
    ) {}

    /**
     * Get translations by store and language
     * Merges global (storeId = null) with store-specific overrides
     */
    @Transactional()
    async getTranslationsByStore(storeId: string, languageCode: string): Promise<Translation[]> {
        const [globalTranslations, storeTranslations] = await Promise.all([
            this.translationRepo.find({
                where: { languageCode, storeId: null as any },
            }),
            this.translationRepo.find({
                where: { languageCode, storeId },
            }),
        ]);

        // Merge: store overrides take precedence
        const mergedMap = new Map<string, Translation>();

        globalTranslations.forEach(t => mergedMap.set(t.translationKey, t));
        storeTranslations.forEach(t => mergedMap.set(t.translationKey, t));

        return Array.from(mergedMap.values());
    }

    /**
     * Get all translations for a store (all languages)
     */
    @Transactional()
    async getAllTranslationsForStore(storeId: string): Promise<Translation[]> {
        return await this.translationRepo.find({
            where: [
                { storeId: null as any },
                { storeId },
            ],
            order: { translationKey: 'ASC' },
        });
    }

    /**
     * Get translation by key
     */
    @Transactional()
    async getByKey(translationKey: string, languageCode: string, storeId?: string): Promise<Translation | null> {
        // First try store-specific
        if (storeId) {
            const storeTranslation = await this.translationRepo.findOne({
                where: { translationKey, languageCode, storeId },
            });
            if (storeTranslation) {
                return storeTranslation;
            }
        }

        // Fall back to global
        return await this.translationRepo.findOne({
            where: { translationKey, languageCode, storeId: null as any },
        });
    }

    /**
     * Create new translation
     */
    @Transactional()
    async create(createDto: CreateTranslationDto): Promise<Translation> {
        const translation = this.translationRepo.create({
            languageCode: createDto.languageCode,
            translationKey: createDto.translationKey,
            translationValue: createDto.translationValue,
            context: createDto.context,
            storeId: createDto.storeId || null,
            isCustom: !!createDto.storeId,
            isActive: true,
        });

        return await this.translationRepo.save(translation);
    }

    /**
     * Update translation
     */
    @Transactional()
    async update(id: string, updateDto: UpdateTranslationDto): Promise<Translation> {
        await this.translationRepo.update(id, updateDto);
        const updated = await this.translationRepo.findOne({ where: { id } });
        if (!updated) {
            throw new Error(`Translation with id ${id} not found`);
        }
        return updated;
    }

    /**
     * Delete translation
     */
    @Transactional()
    async delete(id: string): Promise<void> {
        await this.translationRepo.delete(id);
    }

    /**
     * Bulk import translations from JSON object
     * Used for seeding initial translations
     */
    @Transactional()
    async bulkImport(languageCode: string, translations: Record<string, string>, context?: string): Promise<BulkTranslationsResponseDto> {
        const entities = Object.entries(translations).map(([key, value]) =>
            this.translationRepo.create({
                storeId: null,
                languageCode,
                translationKey: key,
                translationValue: value,
                context,
                isCustom: false,
                isActive: true,
            })
        );

        const result = await this.translationRepo.save(entities);

        return {
            count: result.length,
            message: `Successfully imported ${result.length} translations for ${languageCode}`,
        };
    }

    /**
     * Get all supported languages
     */
    async getSupportedLanguages(): Promise<SupportedLanguage[]> {
        return await this.languageRepo.find({
            where: { isActive: true },
            order: { displayOrder: 'ASC' },
        });
    }

    /**
     * Upsert translation (create or update)
     */
    @Transactional()
    async upsert(
        storeId: string | null,
        languageCode: string,
        translationKey: string,
        translationValue: string,
        context?: string,
    ): Promise<Translation> {
        // Check if exists
        const existing = await this.translationRepo.findOne({
            where: {
                translationKey,
                languageCode,
                storeId: storeId as any,
            },
        });

        if (existing) {
            existing.translationValue = translationValue;
            if (context !== undefined) existing.context = context;
            return await this.translationRepo.save(existing);
        }

        const newTranslation = this.translationRepo.create({
            storeId,
            languageCode,
            translationKey,
            translationValue,
            context,
            isCustom: !!storeId,
            isActive: true,
        });

        return await this.translationRepo.save(newTranslation);
    }

    /**
     * Convert entity to response DTO
     */
    toResponseDto(entity: Translation): TranslationResponseDto {
        return {
            id: entity.id,
            translationKey: entity.translationKey,
            translationValue: entity.translationValue,
            languageCode: entity.languageCode,
            storeId: entity.storeId,
            context: entity.context,
            isCustom: entity.isCustom,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
