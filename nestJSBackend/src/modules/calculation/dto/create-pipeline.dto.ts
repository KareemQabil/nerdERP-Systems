import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber, IsObject, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PipelineEntityType } from '../entities/calculation-pipeline.entity';
import { StepType } from '../entities/pipeline-step.entity';

export class CreatePipelineStepDto {
    @IsNumber()
    stepOrder: number;

    @IsEnum(StepType)
    stepType: StepType;

    @IsObject()
    stepConfig: Record<string, any>;

    @IsObject()
    @IsOptional()
    conditionLogic?: any;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class CreatePipelineDto {
    @IsString()
    pipelineName: string;

    @IsEnum(PipelineEntityType)
    entityType: PipelineEntityType;

    @IsArray()
    @IsOptional()
    appliesToStores?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePipelineStepDto)
    @IsOptional()
    steps?: CreatePipelineStepDto[];
}
