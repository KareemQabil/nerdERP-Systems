import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { CalculationPipeline, PipelineEntityType } from '../entities/calculation-pipeline.entity';
import { PipelineStep } from '../entities/pipeline-step.entity';
import { CreatePipelineDto } from '../dto/create-pipeline.dto';

@Injectable()
export class CalculationPipelineService {
    constructor(
        @InjectRepository(CalculationPipeline)
        private readonly pipelineRepo: Repository<CalculationPipeline>,
        @InjectRepository(PipelineStep)
        private readonly stepRepo: Repository<PipelineStep>,
    ) { }

    async findAll(entityType?: PipelineEntityType): Promise<CalculationPipeline[]> {
        const query = this.pipelineRepo.createQueryBuilder('pipeline').leftJoinAndSelect('pipeline.steps', 'steps');

        if (entityType) {
            query.where('pipeline.entity_type = :entityType', { entityType });
        }

        query.orderBy('pipeline.created_at', 'DESC');

        return await query.getMany();
    }

    async findById(id: string): Promise<CalculationPipeline> {
        const pipeline = await this.pipelineRepo.findOne({
            where: { id },
            relations: ['steps'],
        });

        if (!pipeline) {
            throw new NotFoundException(`Pipeline with ID ${id} not found`);
        }

        return pipeline;
    }

    @Transactional()
    async create(dto: CreatePipelineDto): Promise<CalculationPipeline> {
        const pipeline = this.pipelineRepo.create({
            pipelineName: dto.pipelineName,
            entityType: dto.entityType,
            appliesToStores: dto.appliesToStores,
        });

        const savedPipeline = await this.pipelineRepo.save(pipeline);

        // Create steps
        if (dto.steps && dto.steps.length > 0) {
            const steps = dto.steps.map((stepDto) =>
                this.stepRepo.create({
                    stepOrder: stepDto.stepOrder,
                    stepType: stepDto.stepType,
                    stepConfig: stepDto.stepConfig,
                    conditionLogic: stepDto.conditionLogic,
                    pipeline: savedPipeline,
                }),
            );

            await this.stepRepo.save(steps);
        }

        return await this.findById(savedPipeline.id);
    }

    @Transactional()
    async update(id: string, updateData: Partial<CreatePipelineDto>): Promise<CalculationPipeline> {
        const pipeline = await this.findById(id);

        Object.assign(pipeline, {
            pipelineName: updateData.pipelineName,
            appliesToStores: updateData.appliesToStores,
        });

        await this.pipelineRepo.save(pipeline);

        // Update steps if provided
        if (updateData.steps) {
            // Delete existing steps
            await this.stepRepo.delete({ pipeline: { id } });

            // Create new steps
            const steps = updateData.steps.map((stepDto) =>
                this.stepRepo.create({
                    stepOrder: stepDto.stepOrder,
                    stepType: stepDto.stepType,
                    stepConfig: stepDto.stepConfig,
                    conditionLogic: stepDto.conditionLogic,
                    pipeline,
                }),
            );

            await this.stepRepo.save(steps);
        }

        return await this.findById(id);
    }

    @Transactional()
    async delete(id: string): Promise<void> {
        const pipeline = await this.findById(id);
        await this.pipelineRepo.remove(pipeline);
    }

    @Transactional()
    async toggleActive(id: string): Promise<CalculationPipeline> {
        const pipeline = await this.findById(id);
        pipeline.isActive = !pipeline.isActive;
        return await this.pipelineRepo.save(pipeline);
    }
}
