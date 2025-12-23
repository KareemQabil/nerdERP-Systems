import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Modifier, ModifierOption, ProductModifier } from '../entities/modifier.entity';
import { CreateModifierDto, UpdateModifierDto, LinkModifierToProductDto } from '../dto/modifier.dto';

@Injectable()
export class ModifierService {
    constructor(
        @InjectRepository(Modifier)
        private readonly modifierRepo: Repository<Modifier>,
        @InjectRepository(ModifierOption)
        private readonly optionRepo: Repository<ModifierOption>,
        @InjectRepository(ProductModifier)
        private readonly productModifierRepo: Repository<ProductModifier>,
    ) { }

    async findAll(): Promise<Modifier[]> {
        return await this.modifierRepo.find({
            where: { isActive: true },
            relations: ['options'],
            order: { displayOrder: 'ASC' },
        });
    }

    async findById(id: string): Promise<Modifier> {
        const modifier = await this.modifierRepo.findOne({
            where: { id },
            relations: ['options'],
        });

        if (!modifier) {
            throw new NotFoundException(`Modifier with ID ${id} not found`);
        }

        return modifier;
    }

    async findByProduct(productId: string): Promise<Modifier[]> {
        const productModifiers = await this.productModifierRepo.find({
            where: { productId, isActive: true },
            order: { displayOrder: 'ASC' },
        });

        const modifierIds = productModifiers.map((pm) => pm.modifierId);
        if (modifierIds.length === 0) return [];

        return await this.modifierRepo.find({
            where: { id: In(modifierIds) },
            relations: ['options'],
        });
    }

    @Transactional()
    async create(dto: CreateModifierDto): Promise<Modifier> {
        const modifier = this.modifierRepo.create({
            modifierName: dto.modifierName,
            translations: dto.translations,
            isRequired: dto.isRequired || false,
            minSelections: dto.minSelections || 0,
            maxSelections: dto.maxSelections || 1,
            displayOrder: dto.displayOrder || 0,
        });

        const savedModifier = await this.modifierRepo.save(modifier);

        // Create options
        if (dto.options && dto.options.length > 0) {
            const options = dto.options.map((optDto) =>
                this.optionRepo.create({
                    ...optDto,
                    modifier: savedModifier,
                }),
            );

            await this.optionRepo.save(options);
        }

        return await this.findById(savedModifier.id);
    }

    @Transactional()
    async update(id: string, dto: UpdateModifierDto): Promise<Modifier> {
        const modifier = await this.findById(id);

        Object.assign(modifier, {
            modifierName: dto.modifierName,
            translations: dto.translations,
            isRequired: dto.isRequired,
            minSelections: dto.minSelections,
            maxSelections: dto.maxSelections,
            displayOrder: dto.displayOrder,
            isActive: dto.isActive,
        });

        await this.modifierRepo.save(modifier);

        // Update options if provided
        if (dto.options) {
            // Delete existing options
            await this.optionRepo.delete({ modifier: { id } });

            // Create new options
            const options = dto.options.map((optDto) =>
                this.optionRepo.create({
                    ...optDto,
                    modifier,
                }),
            );

            await this.optionRepo.save(options);
        }

        return await this.findById(id);
    }

    @Transactional()
    async delete(id: string): Promise<void> {
        const modifier = await this.findById(id);

        // Check if linked to any products
        const linkedProducts = await this.productModifierRepo.count({
            where: { modifierId: id, isActive: true },
        });

        if (linkedProducts > 0) {
            throw new BadRequestException(
                `Cannot delete modifier. It is linked to ${linkedProducts} product(s)`,
            );
        }

        await this.modifierRepo.remove(modifier);
    }

    @Transactional()
    async linkToProduct(dto: LinkModifierToProductDto): Promise<ProductModifier> {
        // Check if already linked
        const existing = await this.productModifierRepo.findOne({
            where: {
                productId: dto.productId,
                modifierId: dto.modifierId,
            },
        });

        if (existing) {
            throw new BadRequestException('Modifier already linked to this product');
        }

        const link = this.productModifierRepo.create({
            productId: dto.productId,
            modifierId: dto.modifierId,
            displayOrder: dto.displayOrder || 0,
            conditionLogic: dto.conditionLogic,
        });

        return await this.productModifierRepo.save(link);
    }

    @Transactional()
    async unlinkFromProduct(productId: string, modifierId: string): Promise<void> {
        await this.productModifierRepo.delete({ productId, modifierId });
    }
}
