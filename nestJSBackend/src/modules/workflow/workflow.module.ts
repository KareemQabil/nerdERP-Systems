import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowDefinition } from './entities/workflow-definition.entity';
import { WorkflowState } from './entities/workflow-state.entity';
import { WorkflowTransition } from './entities/workflow-transition.entity';
import { WorkflowEngineService } from './services/workflow-engine.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            WorkflowDefinition,
            WorkflowState,
            WorkflowTransition,
        ]),
    ],
    providers: [WorkflowEngineService],
    exports: [WorkflowEngineService],
})
export class WorkflowModule { }
