import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { WorkflowManagementService } from '../services/workflow-management.service';
import {
    CreateWorkflowDto,
    UpdateWorkflowDto,
    CreateWorkflowStateDto,
    UpdateWorkflowStateDto,
    CreateWorkflowTransitionDto,
    UpdateWorkflowTransitionDto,
} from '../dto/workflow.dto';
import { WorkflowType } from '../entities/workflow-definition.entity';

@ApiTags('Workflows')
@Controller('workflows')
export class WorkflowController {
    constructor(
        private readonly workflowEngineService: WorkflowEngineService,
        private readonly workflowManagementService: WorkflowManagementService,
    ) { }

    // =========================================================================
    // WORKFLOW DEFINITION CRUD
    // =========================================================================

    @Get()
    @ApiOperation({ summary: 'List all workflows' })
    @ApiQuery({ name: 'type', required: false, enum: WorkflowType })
    @ApiQuery({ name: 'storeId', required: false })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    async findAll(
        @Query('type') type?: WorkflowType,
        @Query('storeId') storeId?: string,
        @Query('includeInactive') includeInactive?: boolean,
    ) {
        return this.workflowManagementService.findAll({
            type,
            storeId,
            includeInactive: includeInactive === true,
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get workflow with states and transitions' })
    @ApiParam({ name: 'id', type: 'string' })
    async findById(@Param('id', ParseUUIDPipe) id: string) {
        return this.workflowManagementService.findById(id);
    }

    @Get('type/:type/default')
    @ApiOperation({ summary: 'Get default workflow for a type' })
    @ApiParam({ name: 'type', enum: WorkflowType })
    @ApiQuery({ name: 'storeId', required: false })
    async getDefaultForType(
        @Param('type') type: WorkflowType,
        @Query('storeId') storeId?: string,
    ) {
        return this.workflowEngineService.getDefaultWorkflow(type, storeId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new workflow' })
    async create(@Body() dto: CreateWorkflowDto) {
        return this.workflowManagementService.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update workflow' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateWorkflowDto,
    ) {
        return this.workflowManagementService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete workflow (soft delete - deactivates)' })
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.workflowManagementService.delete(id);
    }

    @Post(':id/duplicate')
    @ApiOperation({ summary: 'Duplicate a workflow' })
    async duplicate(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('workflowName') newName: string,
    ) {
        return this.workflowManagementService.duplicate(id, newName);
    }

    // =========================================================================
    // STATE MANAGEMENT
    // =========================================================================

    @Post(':id/states')
    @ApiOperation({ summary: 'Add state to workflow' })
    async addState(
        @Param('id', ParseUUIDPipe) workflowId: string,
        @Body() dto: CreateWorkflowStateDto,
    ) {
        return this.workflowManagementService.addState(workflowId, dto);
    }

    @Patch(':id/states/:stateKey')
    @ApiOperation({ summary: 'Update state' })
    async updateState(
        @Param('id', ParseUUIDPipe) workflowId: string,
        @Param('stateKey') stateKey: string,
        @Body() dto: UpdateWorkflowStateDto,
    ) {
        return this.workflowManagementService.updateState(workflowId, stateKey, dto);
    }

    @Delete(':id/states/:stateKey')
    @ApiOperation({ summary: 'Remove state from workflow' })
    async removeState(
        @Param('id', ParseUUIDPipe) workflowId: string,
        @Param('stateKey') stateKey: string,
    ) {
        return this.workflowManagementService.removeState(workflowId, stateKey);
    }

    // =========================================================================
    // TRANSITION MANAGEMENT
    // =========================================================================

    @Post(':id/transitions')
    @ApiOperation({ summary: 'Add transition to workflow' })
    async addTransition(
        @Param('id', ParseUUIDPipe) workflowId: string,
        @Body() dto: CreateWorkflowTransitionDto,
    ) {
        return this.workflowManagementService.addTransition(workflowId, dto);
    }

    @Patch(':id/transitions/:transitionId')
    @ApiOperation({ summary: 'Update transition' })
    async updateTransition(
        @Param('id', ParseUUIDPipe) workflowId: string,
        @Param('transitionId', ParseUUIDPipe) transitionId: string,
        @Body() dto: UpdateWorkflowTransitionDto,
    ) {
        return this.workflowManagementService.updateTransition(workflowId, transitionId, dto);
    }

    @Delete(':id/transitions/:transitionId')
    @ApiOperation({ summary: 'Remove transition from workflow' })
    async removeTransition(
        @Param('id', ParseUUIDPipe) workflowId: string,
        @Param('transitionId', ParseUUIDPipe) transitionId: string,
    ) {
        return this.workflowManagementService.removeTransition(workflowId, transitionId);
    }

    // =========================================================================
    // WORKFLOW EXECUTION (for real-time state checking)
    // =========================================================================

    @Get(':id/states/:currentState/available-transitions')
    @ApiOperation({ summary: 'Get available transitions from current state' })
    async getAvailableTransitions(
        @Param('id', ParseUUIDPipe) workflowId: string,
        @Param('currentState') currentState: string,
        @Body() context?: Record<string, any>,
    ) {
        return this.workflowEngineService.getAvailableTransitions(
            workflowId,
            currentState,
            context || {},
        );
    }
}
