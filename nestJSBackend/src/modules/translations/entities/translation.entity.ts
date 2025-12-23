import { Entity, Column, Index } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

/**
 * Translation Entity
 * Centralized translation storage for UI overrides
 * Complements entity-level translations JSONB columns
 */
@Entity('translations')
@Index(['languageCode', 'translationKey'], { unique: true })
export class Translation extends AbstractEntity {
    @Column({ name: 'language_code' })
    languageCode: string; // 'en', 'ar', 'fr'

    @Column({ name: 'translation_key' })
    translationKey: string; // 'menu.title', 'button.checkout', 'error.insufficient_stock'

    @Column({ name: 'translation_value', type: 'text' })
    translationValue: string;

    @Column({ nullable: true })
    context: string; // 'POS', 'KDS', 'ADMIN', 'RECEIPT'

    @Column({ name: 'store_id', nullable: true })
    storeId: string; // null = global, storeId = override for specific store

    @Column({ name: 'is_custom', default: false })
    isCustom: boolean; // Tenant-customized vs system default
}

/**
 * Supported Language Entity
 * Languages configured for the system
 */
@Entity('supported_languages')
export class SupportedLanguage extends AbstractEntity {
    @Column({ name: 'language_code', unique: true })
    languageCode: string;

    @Column({ name: 'language_name' })
    languageName: string;

    @Column({ name: 'native_name' })
    nativeName: string; // e.g., 'العربية' for Arabic

    @Column({ default: 'ltr' })
    direction: string; // 'ltr' or 'rtl'

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;
}
