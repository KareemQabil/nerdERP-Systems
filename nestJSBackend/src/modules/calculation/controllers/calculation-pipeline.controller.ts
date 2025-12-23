import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CalculationPipelineService } from '../services/calculation-pipeline.service';
import { CalculationEngineService } from '../services/calculation-engine.service';
import { CreatePipelineDto } from '../dto/create-pipeline.dto';
import { ExecutePipelineDto } from '../dto/execute-pipeline.dto';
import { PipelineEntityType } from '../entities/calculation-pipeline.entity';

@Controller('api/calculation-pipelines')
export class CalculationPipelineController {
    constructor(
        private readonly pipelineService: CalculationPipelineService,
        private readonly engineService: CalculationEngineService,
    ) { }

    @Get()
    async findAll(@Query('entityType') entityType?: PipelineEntityType) {
        const pipelines = await this.pipelineService.findAll(entityType);
        return {
            success: true,
            data: pipelines,
            timestamp: new Date().toISOString(),
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const pipeline = await this.pipelineService.findById(id);
        return {
            success: true,
            data: pipeline,
            timestamp: new Date().toISOString(),
        };
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreatePipelineDto) {
        const pipeline = await this.pipelineService.create(dto);
        return {
            success: true,
            data: pipeline,
            messageKey: 'PIPELINE_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateData: Partial<CreatePipelineDto>,
    ) {
        const pipeline = await this.pipelineService.update(id, updateData);
        return {
            success: true,
            data: pipeline,
            messageKey: 'PIPELINE_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string) {
        await this.pipelineService.delete(id);
    }

    @Post(':id/toggle-active')
    async toggleActive(@Param('id') id: string) {
        const pipeline = await this.pipelineService.toggleActive(id);
        return {
            success: true,
            data: pipeline,
            messageKey: 'PIPELINE_TOGGLED',
            timestamp: new Date().toISOString(),
        };
    }

    @Post(':id/execute')
    async executePipeline(
        @Param('id') id: string,
        @Body() dto: ExecutePipelineDto,
    ) {
        const result = await this.engineService.executePipeline(id, dto.context);
        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }
}
