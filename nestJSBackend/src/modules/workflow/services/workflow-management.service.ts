import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { WorkflowDefinition, WorkflowType } from '../entities/workflow-definition.entity';
import { WorkflowState, StateType } from '../entities/workflow-state.entity';
import { WorkflowTransition } from '../entities/workflow-transition.entity';
import {
    CreateWorkflowDto,
    UpdateWorkflowDto,
    CreateWorkflowStateDto,
    UpdateWorkflowStateDto,
    CreateWorkflowTransitionDto,
    UpdateWorkflowTransitionDto,
} from '../dto/workflow.dto';

interface FindAllFilters {
    type?: WorkflowType;
    storeId?: string;
    includeInactive?: boolean;
}

/**
 * Workflow Management Service
 * CRUD operations for workflow definitions, states, and transitions
 */
@Injectable()
export class WorkflowManagementService {
    constructor(
        @InjectRepository(WorkflowDefinition)
        private readonly workflowRepo: Repository<WorkflowDefinition>,
        @InjectRepository(WorkflowState)
        private readonly stateRepo: Repository<WorkflowState>,
        @InjectRepository(WorkflowTransition)
        private readonly transitionRepo: Repository<WorkflowTransition>,
    ) { }

    // =========================================================================
    // WORKFLOW DEFINITIONS
    // =========================================================================

    async findAll(filters: FindAllFilters): Promise<WorkflowDefinition[]> {
        const query = this.workflowRepo
            .createQueryBuilder('workflow')
            .leftJoinAndSelect('workflow.states', 'states')
            .leftJoinAndSelect('workflow.transitions', 'transitions')
            .orderBy('workflow.workflowType', 'ASC')
            .addOrderBy('workflow.workflowName', 'ASC');

        if (filters.type) {
            query.andWhere('workflow.workflow_type = :type', { type: filters.type });
        }

        if (!filters.includeInactive) {
            query.andWhere('workflow.is_active = :isActive', { isActive: true });
        }

        if (filters.storeId) {
            query.andWhere(
                '(workflow.applies_to_stores IS NULL OR :storeId = ANY(workflow.applies_to_stores::text[]))',
                { storeId: filters.storeId },
            );
        }

        return query.getMany();
    }

    async findById(id: string): Promise<WorkflowDefinition> {
        const workflow = await this.workflowRepo.findOne({
            where: { id },
            relations: ['states', 'transitions'],
        });

        if (!workflow) {
            throw new NotFoundException(`Workflow with ID ${id} not found`);
        }

        return workflow;
    }

    @Transactional()
    async create(dto: CreateWorkflowDto): Promise<WorkflowDefinition> {
        // If this is set as default, unset other defaults of same type
        if (dto.isDefault) {
            await this.workflowRepo.update(
                { workflowType: dto.workflowType, isDefault: true },
                { isDefault: false },
            );
        }

        const workflow = this.workflowRepo.create({
            workflowName: dto.workflowName,
            workflowType: dto.workflowType,
            translations: dto.translations,
            isActive: true,
            isDefault: dto.isDefault ?? false,
            appliesToStores: dto.appliesToStores,
        });

        const savedWorkflow = await this.workflowRepo.save(workflow);

        // Create initial states
        if (dto.states?.length) {
            for (const stateDto of dto.states) {
                await this.addState(savedWorkflow.id, stateDto);
            }
        }

        // Create initial transitions
        if (dto.transitions?.length) {
            for (const transitionDto of dto.transitions) {
                await this.addTransition(savedWorkflow.id, transitionDto);
            }
        }

        return this.findById(savedWorkflow.id);
    }

    @Transactional()
    async update(id: string, dto: UpdateWorkflowDto): Promise<WorkflowDefinition> {
        const workflow = await this.findById(id);

        // If setting as default, unset other defaults
        if (dto.isDefault && !workflow.isDefault) {
            await this.workflowRepo.update(
                { workflowType: workflow.workflowType, isDefault: true },
                { isDefault: false },
            );
        }

        Object.assign(workflow, dto);
        await this.workflowRepo.save(workflow);

        return this.findById(id);
    }

    @Transactional()
    async delete(id: string): Promise<{ success: boolean }> {
        const workflow = await this.findById(id);

        // Soft delete - just deactivate
        workflow.isActive = false;
        workflow.isDefault = false;
        await this.workflowRepo.save(workflow);

        return { success: true };
    }

    @Transactional()
    async duplicate(id: string, newName: string): Promise<WorkflowDefinition> {
        const original = await this.findById(id);

        // Create new workflow
        const newWorkflow = this.workflowRepo.create({
            workflowName: newName,
            workflowType: original.workflowType,
            translations: original.translations,
            isActive: true,
            isDefault: false,
            appliesToStores: undefined, // Don't copy store assignments
        });

        const saved = await this.workflowRepo.save(newWorkflow);

        // Copy states
        for (const state of original.states) {
            await this.stateRepo.save({
                workflow: { id: saved.id },
                stateKey: state.stateKey,
                stateType: state.stateType,
                translations: state.translations,
                color: state.color,
                icon: state.icon,
                displayOrder: state.displayOrder,
                onEnterActions: state.onEnterActions,
                onExitActions: state.onExitActions,
            });
        }

        // Copy transitions
        for (const transition of original.transitions) {
            await this.transitionRepo.save({
                workflow: { id: saved.id },
                fromStateKey: transition.fromStateKey,
                toStateKey: transition.toStateKey,
                translations: transition.translations,
                conditionLogic: transition.conditionLogic,
                requiredPermissions: transition.requiredPermissions,
                requiresApproval: transition.requiresApproval,
                triggerActions: transition.triggerActions,
                displayOrder: transition.displayOrder,
            });
        }

        return this.findById(saved.id);
    }

    // =========================================================================
    // STATES
    // =========================================================================

    @Transactional()
    async addState(workflowId: string, dto: CreateWorkflowStateDto): Promise<WorkflowState> {
        const workflow = await this.findById(workflowId);

        // Check for duplicate state key
        const existing = await this.stateRepo.findOne({
            where: { workflow: { id: workflowId }, stateKey: dto.stateKey },
        });

        if (existing) {
            throw new BadRequestException(`State with key "${dto.stateKey}" already exists`);
        }

        // Ensure only one INITIAL state
        if (dto.stateType === StateType.INITIAL) {
            const existingInitial = workflow.states.find(s => s.stateType === StateType.INITIAL);
            if (existingInitial) {
                throw new BadRequestException(
                    `Workflow already has an initial state: ${existingInitial.stateKey}`,
                );
            }
        }

        const state = this.stateRepo.create({
            workflow: { id: workflowId },
            stateKey: dto.stateKey,
            stateType: dto.stateType,
            translations: dto.translations || { en: { label: dto.stateKey } },
            color: dto.color,
            icon: dto.icon,
            displayOrder: dto.displayOrder ?? 0,
            onEnterActions: dto.onEnterActions,
            onExitActions: dto.onExitActions,
        });

        return this.stateRepo.save(state);
    }

    @Transactional()
    async updateState(
        workflowId: string,
        stateKey: string,
        dto: UpdateWorkflowStateDto,
    ): Promise<WorkflowState> {
        const state = await this.stateRepo.findOne({
            where: { workflow: { id: workflowId }, stateKey },
        });

        if (!state) {
            throw new NotFoundException(`State "${stateKey}" not found in workflow`);
        }

        Object.assign(state, dto);
        return this.stateRepo.save(state);
    }

    @Transactional()
    async removeState(workflowId: string, stateKey: string): Promise<{ success: boolean }> {
        const state = await this.stateRepo.findOne({
            where: { workflow: { id: workflowId }, stateKey },
        });

        if (!state) {
            throw new NotFoundException(`State "${stateKey}" not found`);
        }

        // Check for transitions using this state
        const transitions = await this.transitionRepo.find({
            where: [
                { workflow: { id: workflowId }, fromStateKey: stateKey },
                { workflow: { id: workflowId }, toStateKey: stateKey },
            ],
        });

        if (transitions.length > 0) {
            throw new BadRequestException(
                `Cannot delete state "${stateKey}": ${transitions.length} transitions reference it`,
            );
        }

        await this.stateRepo.remove(state);
        return { success: true };
    }

    // =========================================================================
    // TRANSITIONS
    // =========================================================================

    @Transactional()
    async addTransition(
        workflowId: string,
        dto: CreateWorkflowTransitionDto,
    ): Promise<WorkflowTransition> {
        await this.findById(workflowId); // Validate workflow exists

        // Validate from state exists (unless wildcard)
        if (dto.fromStateKey !== '*') {
            const fromState = await this.stateRepo.findOne({
                where: { workflow: { id: workflowId }, stateKey: dto.fromStateKey },
            });
            if (!fromState) {
                throw new BadRequestException(`Source state "${dto.fromStateKey}" not found`);
            }
        }

        // Validate to state exists
        const toState = await this.stateRepo.findOne({
            where: { workflow: { id: workflowId }, stateKey: dto.toStateKey },
        });
        if (!toState) {
            throw new BadRequestException(`Target state "${dto.toStateKey}" not found`);
        }

        const transition = this.transitionRepo.create({
            workflow: { id: workflowId },
            fromStateKey: dto.fromStateKey,
            toStateKey: dto.toStateKey,
            translations: dto.translations || { en: { label: `${dto.fromStateKey} → ${dto.toStateKey}` } },
            conditionLogic: dto.conditionLogic,
            requiredPermissions: dto.requiredPermissions,
            requiresApproval: dto.requiresApproval ?? false,
            triggerActions: dto.triggerActions,
            displayOrder: dto.displayOrder ?? 0,
        });

        return this.transitionRepo.save(transition);
    }

    @Transactional()
    async updateTransition(
        workflowId: string,
        transitionId: string,
        dto: UpdateWorkflowTransitionDto,
    ): Promise<WorkflowTransition> {
        const transition = await this.transitionRepo.findOne({
            where: { id: transitionId, workflow: { id: workflowId } },
        });

        if (!transition) {
            throw new NotFoundException(`Transition not found`);
        }

        Object.assign(transition, dto);
        return this.transitionRepo.save(transition);
    }

    @Transactional()
    async removeTransition(
        workflowId: string,
        transitionId: string,
    ): Promise<{ success: boolean }> {
        const transition = await this.transitionRepo.findOne({
            where: { id: transitionId, workflow: { id: workflowId } },
        });

        if (!transition) {
            throw new NotFoundException(`Transition not found`);
        }

        await this.transitionRepo.remove(transition);
        return { success: true };
    }
}
