import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Organization } from '../entities/organization.entity';
import { CreateOrganizationDto } from '../dto/create-organization.dto';

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(Organization)
        private readonly orgRepo: Repository<Organization>,
    ) { }

    async findAll(): Promise<Organization[]> {
        return await this.orgRepo.find();
    }

    async findById(id: string): Promise<Organization> {
        const organization = await this.orgRepo.findOne({ where: { id } });

        if (!organization) {
            throw new NotFoundException(`Organization with ID ${id} not found`);
        }

        return organization;
    }

    @Transactional()
    async create(dto: CreateOrganizationDto): Promise<Organization> {
        const organization = this.orgRepo.create(dto);
        return await this.orgRepo.save(organization);
    }

    @Transactional()
    async update(
        id: string,
        updateData: Partial<CreateOrganizationDto>,
    ): Promise<Organization> {
        const organization = await this.findById(id);

        Object.assign(organization, updateData);

        return await this.orgRepo.save(organization);
    }

    @Transactional()
    async delete(id: string): Promise<void> {
        const organization = await this.findById(id);
        await this.orgRepo.remove(organization);
    }
}
