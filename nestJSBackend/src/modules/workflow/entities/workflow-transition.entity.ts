import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { WorkflowDefinition } from './workflow-definition.entity';

/**
 * Workflow Transition Entity
 * Defines allowed state changes and their conditions
 * 
 * Example Transitions:
 * - PENDING → PREPARING (requires: kitchen_station_assigned)
 * - PREPARING → READY (requires: all_items_prepared)
 * - READY → COMPLETED (requires: payment_confirmed)
 * - ANY → CANCELLED (requires: manager_approval for paid orders)
 */
@Entity('workflow_transitions')
export class WorkflowTransition extends AbstractEntity {
    @ManyToOne(() => WorkflowDefinition, (workflow) => workflow.transitions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workflow_id' })
    workflow: WorkflowDefinition;

    @Column({ name: 'from_state_key' })
    fromStateKey: string; // 'PENDING', '*' for any

    @Column({ name: 'to_state_key' })
    toStateKey: string; // 'PREPARING'

    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, { label: string }>; // Button labels

    /**
     * JSONLogic condition for this transition
     * Example: { "and": [{ "==": [{ "var": "payment_status" }, "PAID"] }] }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'condition_logic' })
    conditionLogic: any;

    /**
     * Required permissions for this transition
     * Example: ['orders.update', 'orders.void']
     */
    @Column({ type: 'jsonb', nullable: true, name: 'required_permissions' })
    requiredPermissions: string[];

    /**
     * Require manager approval for this transition
     */
    @Column({ name: 'requires_approval', default: false })
    requiresApproval: boolean;

    /**
     * Auto-actions triggered by this transition
     * Example: { send_notification: 'kitchen', print_ticket: true }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'trigger_actions' })
    triggerActions: Record<string, any>;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;
}
