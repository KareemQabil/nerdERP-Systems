import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { ProductVariant, Combo } from '../entities/product-variant.entity';
import { CreateProductVariantDto, CreateComboDto } from '../dto/product-variant.dto';

@Injectable()
export class ProductVariantService {
    constructor(
        @InjectRepository(ProductVariant)
        private readonly variantRepo: Repository<ProductVariant>,
        @InjectRepository(Combo)
        private readonly comboRepo: Repository<Combo>,
    ) { }

    async findVariantsByProduct(productId: string): Promise<ProductVariant[]> {
        return await this.variantRepo.find({
            where: { productId, isActive: true },
        });
    }

    async findVariantById(id: string): Promise<ProductVariant> {
        const variant = await this.variantRepo.findOne({ where: { id } });
        if (!variant) {
            throw new NotFoundException(`Variant with ID ${id} not found`);
        }
        return variant;
    }

    @Transactional()
    async createVariant(dto: CreateProductVariantDto): Promise<ProductVariant> {
        const variant = this.variantRepo.create(dto);
        return await this.variantRepo.save(variant);
    }

    @Transactional()
    async updateVariant(id: string, dto: Partial<CreateProductVariantDto>): Promise<ProductVariant> {
        const variant = await this.findVariantById(id);
        Object.assign(variant, dto);
        return await this.variantRepo.save(variant);
    }

    @Transactional()
    async deleteVariant(id: string): Promise<void> {
        const variant = await this.findVariantById(id);
        variant.isActive = false;
        await this.variantRepo.save(variant);
    }

    async findAllCombos(): Promise<Combo[]> {
        return await this.comboRepo.find({
            where: { isActive: true },
            order: { displayOrder: 'ASC' },
        });
    }

    async findComboById(id: string): Promise<Combo> {
        const combo = await this.comboRepo.findOne({ where: { id } });
        if (!combo) {
            throw new NotFoundException(`Combo with ID ${id} not found`);
        }
        return combo;
    }

    @Transactional()
    async createCombo(dto: CreateComboDto): Promise<Combo> {
        // Validate components exist
        if (!dto.components || dto.components.length === 0) {
            throw new BadRequestException('Combo must have at least one component');
        }

        const combo = this.comboRepo.create(dto);
        return await this.comboRepo.save(combo);
    }

    @Transactional()
    async updateCombo(id: string, dto: Partial<CreateComboDto>): Promise<Combo> {
        const combo = await this.findComboById(id);
        Object.assign(combo, dto);
        return await this.comboRepo.save(combo);
    }

    @Transactional()
    async deleteCombo(id: string): Promise<void> {
        const combo = await this.findComboById(id);
        combo.isActive = false;
        await this.comboRepo.save(combo);
    }
}
