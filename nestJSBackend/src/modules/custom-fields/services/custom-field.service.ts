import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { CustomFieldDefinition, EntityType } from '../entities/custom-field-definition.entity';
import { CreateCustomFieldDto } from '../dto/create-custom-field.dto';

@Injectable()
export class CustomFieldService {
    constructor(
        @InjectRepository(CustomFieldDefinition)
        private readonly fieldRepo: Repository<CustomFieldDefinition>,
    ) { }

    /**
     * Get all custom field definitions for an entity type
     * @param entityType Entity type to filter by
     * @param storeId Optional store ID to filter fields applicable to specific store
     * @returns List of custom field definitions
     */
    async getFieldsForEntity(
        entityType: EntityType,
        storeId?: string,
    ): Promise<CustomFieldDefinition[]> {
        const query = this.fieldRepo
            .createQueryBuilder('field')
            .where('field.entity_type = :entityType', { entityType })
            .andWhere('field.is_active = :isActive', { isActive: true })
            .orderBy('field.display_order', 'ASC');

        // Filter by store if provided
        if (storeId) {
            query.andWhere(
                '(field.applies_to_stores IS NULL OR :storeId = ANY(field.applies_to_stores::text[]))',
                { storeId },
            );
        }

        return await query.getMany();
    }

    async findAll(): Promise<CustomFieldDefinition[]> {
        return await this.fieldRepo.find({
            order: { entityType: 'ASC', displayOrder: 'ASC' },
        });
    }

    async findById(id: string): Promise<CustomFieldDefinition> {
        const field = await this.fieldRepo.findOne({ where: { id } });

        if (!field) {
            throw new NotFoundException(`Custom field with ID ${id} not found`);
        }

        return field;
    }

    @Transactional()
    async create(dto: CreateCustomFieldDto): Promise<CustomFieldDefinition> {
        // Check for duplicate field key
        const existing = await this.fieldRepo.findOne({
            where: {
                entityType: dto.entityType,
                fieldKey: dto.fieldKey,
            },
        });

        if (existing) {
            throw new BadRequestException(
                `Field with key '${dto.fieldKey}' already exists for ${dto.entityType}`,
            );
        }

        const field = this.fieldRepo.create(dto);
        return await this.fieldRepo.save(field);
    }

    @Transactional()
    async update(
        id: string,
        updateData: Partial<CreateCustomFieldDto>,
    ): Promise<CustomFieldDefinition> {
        const field = await this.findById(id);

        Object.assign(field, updateData);

        return await this.fieldRepo.save(field);
    }

    @Transactional()
    async delete(id: string): Promise<void> {
        const field = await this.findById(id);
        await this.fieldRepo.remove(field);
    }

    /**
     * Validate custom field value against field definition
     * @param fieldKey Field key
     * @param value Value to validate
     * @param entityType Entity type
     * @returns Validation result
     */
    async validateFieldValue(
        fieldKey: string,
        value: any,
        entityType: EntityType,
    ): Promise<{ valid: boolean; errors: string[] }> {
        const field = await this.fieldRepo.findOne({
            where: { entityType, fieldKey, isActive: true },
        });

        if (!field) {
            return { valid: true, errors: [] }; // If field doesn't exist, skip validation
        }

        const errors: string[] = [];

        // Required validation
        if (field.validationRules?.required && (value === null || value === undefined || value === '')) {
            errors.push(`${fieldKey} is required`);
        }

        // Type-specific validation
        switch (field.fieldType) {
            case 'NUMBER':
                if (typeof value !== 'number') {
                    errors.push(`${fieldKey} must be a number`);
                }
                if (field.validationRules?.min !== undefined && value < field.validationRules.min) {
                    errors.push(`${fieldKey} must be at least ${field.validationRules.min}`);
                }
                if (field.validationRules?.max !== undefined && value > field.validationRules.max) {
                    errors.push(`${fieldKey} must be at most ${field.validationRules.max}`);
                }
                break;

            case 'SELECT':
                if (field.fieldOptions && !field.fieldOptions.includes(value)) {
                    errors.push(`${fieldKey} must be one of: ${field.fieldOptions.join(', ')}`);
                }
                break;

            case 'MULTI_SELECT':
                if (!Array.isArray(value)) {
                    errors.push(`${fieldKey} must be an array`);
                } else if (field.fieldOptions) {
                    const invalid = value.filter((v) => !field.fieldOptions.includes(v));
                    if (invalid.length > 0) {
                        errors.push(`${fieldKey} contains invalid options: ${invalid.join(', ')}`);
                    }
                }
                break;

            case 'TEXT':
                if (field.validationRules?.pattern) {
                    const regex = new RegExp(field.validationRules.pattern);
                    if (!regex.test(value)) {
                        errors.push(`${fieldKey} does not match required pattern`);
                    }
                }
                break;
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
