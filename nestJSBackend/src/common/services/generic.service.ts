import {
    FindManyOptions,
    FindOneOptions,
    Repository,
} from 'typeorm';
import type { DeepPartial } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { NotFoundException } from '@nestjs/common';
import { AbstractEntity } from '../entities/abstract.entity';

export abstract class GenericService<
    T extends AbstractEntity,
> {
    constructor(private readonly repository: Repository<T>) { }

    @Transactional()
    async create(createDto: DeepPartial<T>): Promise<T> {
        const entity = this.repository.create(createDto);
        return await this.repository.save(entity);
    }

    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        return await this.repository.find(options);
    }

    async findOne(options: FindOneOptions<T>): Promise<T> {
        const entity = await this.repository.findOne(options);
        if (!entity) {
            throw new NotFoundException('Entity not found');
        }
        return entity;
    }

    async findById(id: string): Promise<T> {
        const options: FindOneOptions<T> = {
            where: { id: id as any },
        };
        const entity = await this.repository.findOne(options);
        if (!entity) {
            throw new NotFoundException(`Entity with ID ${id} not found`);
        }
        return entity;
    }

    @Transactional()
    async update(id: string, updateDto: DeepPartial<T>): Promise<T> {
        await this.findById(id); // Ensure exists
        await this.repository.update(id, updateDto as any);
        return await this.findById(id);
    }

    @Transactional()
    async remove(id: string): Promise<void> {
        await this.findById(id); // Ensure exists
        await this.repository.delete(id);
    }
}
