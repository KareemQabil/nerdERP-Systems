import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { TaxProfile, TaxDefinition } from '../entities/tax-profile.entity';
import { CreateTaxProfileDto, UpdateTaxProfileDto } from '../dto/tax-profile.dto';

@Injectable()
export class TaxProfileService {
    constructor(
        @InjectRepository(TaxProfile)
        private readonly taxProfileRepo: Repository<TaxProfile>,
        @InjectRepository(TaxDefinition)
        private readonly taxDefinitionRepo: Repository<TaxDefinition>,
    ) { }

    async findAll(storeId?: string): Promise<TaxProfile[]> {
        const query = this.taxProfileRepo
            .createQueryBuilder('profile')
            .leftJoinAndSelect('profile.taxDefinitions', 'definitions')
            .where('profile.is_active = :isActive', { isActive: true })
            .orderBy('profile.is_default', 'DESC')
            .addOrderBy('profile.created_at', 'DESC');

        if (storeId) {
            query.andWhere(
                '(profile.applies_to_stores IS NULL OR :storeId = ANY(profile.applies_to_stores::text[]))',
                { storeId },
            );
        }

        return await query.getMany();
    }

    async findById(id: string): Promise<TaxProfile> {
        const profile = await this.taxProfileRepo.findOne({
            where: { id },
            relations: ['taxDefinitions'],
        });

        if (!profile) {
            throw new NotFoundException(`Tax profile with ID ${id} not found`);
        }

        return profile;
    }

    async getDefaultProfile(storeId?: string): Promise<TaxProfile | null> {
        const query = this.taxProfileRepo
            .createQueryBuilder('profile')
            .leftJoinAndSelect('profile.taxDefinitions', 'definitions')
            .where('profile.is_default = :isDefault', { isDefault: true })
            .andWhere('profile.is_active = :isActive', { isActive: true });

        if (storeId) {
            query.andWhere(
                '(profile.applies_to_stores IS NULL OR :storeId = ANY(profile.applies_to_stores::text[]))',
                { storeId },
            );
        }

        return await query.getOne();
    }

    @Transactional()
    async create(dto: CreateTaxProfileDto): Promise<TaxProfile> {
        // If setting as default, unset other defaults
        if (dto.isDefault) {
            await this.unsetOtherDefaults(dto.appliesToStores);
        }

        const profile = this.taxProfileRepo.create({
            profileName: dto.profileName,
            translations: dto.translations,
            isDefault: dto.isDefault || false,
            appliesToStores: dto.appliesToStores,
        });

        const savedProfile = await this.taxProfileRepo.save(profile);

        // Create tax definitions
        if (dto.taxDefinitions && dto.taxDefinitions.length > 0) {
            const definitions = dto.taxDefinitions.map((defDto) =>
                this.taxDefinitionRepo.create({
                    ...defDto,
                    taxProfileId: savedProfile.id,
                }),
            );

            await this.taxDefinitionRepo.save(definitions);
        }

        return await this.findById(savedProfile.id);
    }

    @Transactional()
    async update(id: string, dto: UpdateTaxProfileDto): Promise<TaxProfile> {
        const profile = await this.findById(id);

        // If setting as default, unset other defaults
        if (dto.isDefault && !profile.isDefault) {
            await this.unsetOtherDefaults(dto.appliesToStores || profile.appliesToStores);
        }

        Object.assign(profile, {
            profileName: dto.profileName,
            translations: dto.translations,
            isDefault: dto.isDefault,
            isActive: dto.isActive,
            appliesToStores: dto.appliesToStores,
        });

        await this.taxProfileRepo.save(profile);

        // Update tax definitions if provided
        if (dto.taxDefinitions) {
            // Delete existing definitions
            await this.taxDefinitionRepo.delete({ taxProfileId: id });

            // Create new definitions
            const definitions = dto.taxDefinitions.map((defDto) =>
                this.taxDefinitionRepo.create({
                    ...defDto,
                    taxProfileId: id,
                }),
            );

            await this.taxDefinitionRepo.save(definitions);
        }

        return await this.findById(id);
    }

    @Transactional()
    async delete(id: string): Promise<void> {
        const profile = await this.findById(id);

        if (profile.isDefault) {
            throw new BadRequestException('Cannot delete default tax profile');
        }

        await this.taxProfileRepo.remove(profile);
    }

    @Transactional()
    async setDefault(id: string): Promise<TaxProfile> {
        const profile = await this.findById(id);

        await this.unsetOtherDefaults(profile.appliesToStores);

        profile.isDefault = true;
        await this.taxProfileRepo.save(profile);

        return profile;
    }

    /**
     * Calculate total tax for amount using this profile
     */
    async calculateTax(profileId: string, amount: number): Promise<{
        taxes: Array<{ taxName: string; taxRate: number; taxAmount: number }>;
        totalTax: number;
    }> {
        const profile = await this.findById(profileId);
        const taxes: Array<{ taxName: string; taxRate: number; taxAmount: number }> = [];
        let totalTax = 0;

        for (const def of profile.taxDefinitions) {
            const taxAmount = (amount * def.taxRate) / 100;
            taxes.push({
                taxName: def.taxName,
                taxRate: def.taxRate,
                taxAmount,
            });
            totalTax += taxAmount;
        }

        return { taxes, totalTax };
    }

    @Transactional()
    private async unsetOtherDefaults(appliesToStores?: string[]): Promise<void> {
        const query = this.taxProfileRepo
            .createQueryBuilder()
            .update()
            .set({ isDefault: false })
            .where('is_default = :isDefault', { isDefault: true });

        if (appliesToStores && appliesToStores.length > 0) {
            // Only unset defaults that apply to same stores
            query.andWhere(
                'applies_to_stores && :stores::text[]',
                { stores: appliesToStores },
            );
        }

        await query.execute();
    }
}
