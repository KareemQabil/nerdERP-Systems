import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jsonLogic from 'json-logic-js';
import { WorkflowDefinition, WorkflowType } from '../entities/workflow-definition.entity';
import { WorkflowState, StateType } from '../entities/workflow-state.entity';
import { WorkflowTransition } from '../entities/workflow-transition.entity';

export interface TransitionResult {
    success: boolean;
    fromState: string;
    toState: string;
    actions: string[];
    errors?: string[];
}

/**
 * Workflow Engine Service
 * Manages state machines and validates transitions
 */
@Injectable()
export class WorkflowEngineService {
    constructor(
        @InjectRepository(WorkflowDefinition)
        private readonly workflowRepo: Repository<WorkflowDefinition>,
        @InjectRepository(WorkflowState)
        private readonly stateRepo: Repository<WorkflowState>,
        @InjectRepository(WorkflowTransition)
        private readonly transitionRepo: Repository<WorkflowTransition>,
    ) { }

    /**
     * Get default workflow for a type
     */
    async getDefaultWorkflow(type: WorkflowType, storeId?: string): Promise<WorkflowDefinition | null> {
        const query = this.workflowRepo
            .createQueryBuilder('workflow')
            .leftJoinAndSelect('workflow.states', 'states')
            .leftJoinAndSelect('workflow.transitions', 'transitions')
            .where('workflow.workflow_type = :type', { type })
            .andWhere('workflow.is_active = :isActive', { isActive: true })
            .andWhere('workflow.is_default = :isDefault', { isDefault: true });

        if (storeId) {
            query.andWhere(
                '(workflow.applies_to_stores IS NULL OR :storeId = ANY(workflow.applies_to_stores::text[]))',
                { storeId },
            );
        }

        return await query.getOne();
    }

    /**
     * Get initial state for a workflow
     */
    async getInitialState(workflowId: string): Promise<WorkflowState> {
        const state = await this.stateRepo.findOne({
            where: {
                workflow: { id: workflowId },
                stateType: StateType.INITIAL,
            },
        });

        if (!state) {
            throw new NotFoundException('No initial state defined for this workflow');
        }

        return state;
    }

    /**
     * Get available transitions from current state
     */
    async getAvailableTransitions(
        workflowId: string,
        currentStateKey: string,
        context: Record<string, any> = {},
    ): Promise<WorkflowTransition[]> {
        const transitions = await this.transitionRepo.find({
            where: [
                { workflow: { id: workflowId }, fromStateKey: currentStateKey },
                { workflow: { id: workflowId }, fromStateKey: '*' }, // Wildcard transitions
            ],
            order: { displayOrder: 'ASC' },
        });

        // Filter by conditions
        return transitions.filter((transition) => {
            if (!transition.conditionLogic) return true;
            try {
                return jsonLogic.apply(transition.conditionLogic, context);
            } catch {
                return false;
            }
        });
    }

    /**
     * Execute a state transition
     */
    async executeTransition(
        workflowId: string,
        currentStateKey: string,
        toStateKey: string,
        context: Record<string, any> = {},
    ): Promise<TransitionResult> {
        // Find the transition
        const transition = await this.transitionRepo.findOne({
            where: [
                { workflow: { id: workflowId }, fromStateKey: currentStateKey, toStateKey },
                { workflow: { id: workflowId }, fromStateKey: '*', toStateKey },
            ],
        });

        if (!transition) {
            throw new BadRequestException(
                `Transition from ${currentStateKey} to ${toStateKey} not allowed`,
            );
        }

        // Check conditions
        if (transition.conditionLogic) {
            const conditionMet = jsonLogic.apply(transition.conditionLogic, context);
            if (!conditionMet) {
                return {
                    success: false,
                    fromState: currentStateKey,
                    toState: toStateKey,
                    actions: [],
                    errors: ['Transition conditions not met'],
                };
            }
        }

        // Collect actions to execute
        const actions: string[] = [];

        // Get exit actions from current state
        const fromState = await this.stateRepo.findOne({
            where: { workflow: { id: workflowId }, stateKey: currentStateKey },
        });
        if (fromState?.onExitActions) {
            actions.push(...Object.keys(fromState.onExitActions));
        }

        // Get transition actions
        if (transition.triggerActions) {
            actions.push(...Object.keys(transition.triggerActions));
        }

        // Get enter actions for target state
        const toState = await this.stateRepo.findOne({
            where: { workflow: { id: workflowId }, stateKey: toStateKey },
        });
        if (toState?.onEnterActions) {
            actions.push(...Object.keys(toState.onEnterActions));
        }

        return {
            success: true,
            fromState: currentStateKey,
            toState: toStateKey,
            actions,
        };
    }

    /**
     * Validate if a state key exists in workflow
     */
    async validateState(workflowId: string, stateKey: string): Promise<boolean> {
        const state = await this.stateRepo.findOne({
            where: { workflow: { id: workflowId }, stateKey },
        });
        return !!state;
    }
}
