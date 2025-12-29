import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { WorkflowState } from './workflow-state.entity';
import { WorkflowTransition } from './workflow-transition.entity';

export enum WorkflowType {
    ORDER = 'ORDER',
    REFUND = 'REFUND',
    PURCHASE_ORDER = 'PURCHASE_ORDER',
    STOCK_TRANSFER = 'STOCK_TRANSFER',
    RESERVATION = 'RESERVATION',
    SESSION_CLOSE = 'SESSION_CLOSE',
    END_OF_DAY = 'END_OF_DAY',
    KITCHEN_TICKET = 'KITCHEN_TICKET',
}

/**
 * Workflow Definition Entity
 * Configurable state machine for any entity type
 * Replaces hardcoded status enums with dynamic workflows
 * 
 * Example: Restaurant Order Workflow
 * - States: DRAFT, PENDING, PREPARING, READY, SERVED, COMPLETED
 * - Transitions define allowed state changes and auto-actions
 */
@Entity('workflow_definitions')
export class WorkflowDefinition extends AbstractEntity {
    @Column({ name: 'workflow_name' })
    workflowName: string;

    @Column({ type: 'enum', enum: WorkflowType, name: 'workflow_type' })
    workflowType: WorkflowType;

    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { name: string; description?: string }>;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean; // Default workflow for this type

    /**
     * Store IDs where this workflow applies (null = all stores)
     */
    @Column({ type: 'jsonb', nullable: true, name: 'applies_to_stores' })
    appliesToStores: string[];

    @OneToMany(() => WorkflowState, (state) => state.workflow, { cascade: true })
    states: WorkflowState[];

    @OneToMany(() => WorkflowTransition, (transition) => transition.workflow, { cascade: true })
    transitions: WorkflowTransition[];
}
