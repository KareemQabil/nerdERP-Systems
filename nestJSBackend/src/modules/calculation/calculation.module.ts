import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculationPipeline } from './entities/calculation-pipeline.entity';
import { PipelineStep } from './entities/pipeline-step.entity';
import { CalculationEngineService } from './services/calculation-engine.service';
import { CalculationPipelineService } from './services/calculation-pipeline.service';
import { CalculationPipelineController } from './controllers/calculation-pipeline.controller';

@Module({
    imports: [TypeOrmModule.forFeature([CalculationPipeline, PipelineStep])],
    controllers: [CalculationPipelineController],
    providers: [CalculationEngineService, CalculationPipelineService],
    exports: [CalculationEngineService, CalculationPipelineService],
})
export class CalculationModule { }
