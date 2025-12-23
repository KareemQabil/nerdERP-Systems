import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Store } from '../entities/store.entity';
import { CreateStoreDto } from '../dto/create-store.dto';

@Injectable()
export class StoreService {
    constructor(
        @InjectRepository(Store)
        private readonly storeRepo: Repository<Store>,
    ) { }

    async findAll(organizationId?: string): Promise<Store[]> {
        const query = this.storeRepo.createQueryBuilder('store');

        if (organizationId) {
            query.where('store.organization_id = :organizationId', { organizationId });
        }

        return await query.getMany();
    }

    async findById(id: string): Promise<Store> {
        const store = await this.storeRepo.findOne({
            where: { id },
            relations: ['organization', 'parentStore'],
        });

        if (!store) {
            throw new NotFoundException(`Store with ID ${id} not found`);
        }

        return store;
    }

    async findByCode(storeCode: string): Promise<Store> {
        const store = await this.storeRepo.findOne({
            where: { storeCode },
            relations: ['organization'],
        });

        if (!store) {
            throw new NotFoundException(`Store with code ${storeCode} not found`);
        }

        return store;
    }

    @Transactional()
    async create(dto: CreateStoreDto): Promise<Store> {
        const store = this.storeRepo.create({
            ...dto,
            organization: { id: dto.organizationId } as any,
            parentStore: dto.parentStoreId
                ? ({ id: dto.parentStoreId } as any)
                : null,
        });

        return await this.storeRepo.save(store);
    }

    @Transactional()
    async update(id: string, updateData: Partial<CreateStoreDto>): Promise<Store> {
        const store = await this.findById(id);

        if (updateData.organizationId) {
            store.organization = { id: updateData.organizationId } as any;
        }

        if (updateData.parentStoreId) {
            store.parentStore = { id: updateData.parentStoreId } as any;
        }

        Object.assign(store, {
            ...updateData,
            organizationId: undefined,
            parentStoreId: undefined,
        });

        return await this.storeRepo.save(store);
    }

    @Transactional()
    async delete(id: string): Promise<void> {
        const store = await this.findById(id);
        await this.storeRepo.remove(store);
    }

    /**
     * Get active stores for a specific organization
     */
    async findActiveStores(organizationId: string): Promise<Store[]> {
        return await this.storeRepo.find({
            where: {
                organization: { id: organizationId },
                isActive: true,
            },
        });
    }
}
