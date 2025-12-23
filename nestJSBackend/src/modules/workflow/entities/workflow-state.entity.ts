import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { WorkflowDefinition } from './workflow-definition.entity';

export enum StateType {
    INITIAL = 'INITIAL',       // Starting state (only one per workflow)
    INTERMEDIATE = 'INTERMEDIATE', // Normal processing states
    TERMINAL = 'TERMINAL',     // Final states (completed, cancelled, etc.)
}

/**
 * Workflow State Entity
 * Individual state within a workflow
 * 
 * Examples for Order workflow:
 * - DRAFT (INITIAL) - Order being created
 * - PENDING (INTERMEDIATE) - Waiting for kitchen
 * - PREPARING (INTERMEDIATE) - Kitchen working on it
 * - READY (INTERMEDIATE) - Ready for pickup/serve
 * - COMPLETED (TERMINAL) - Order fulfilled
 * - CANCELLED (TERMINAL) - Order cancelled
 */
@Entity('workflow_states')
export class WorkflowState extends AbstractEntity {
    @ManyToOne(() => WorkflowDefinition, (workflow) => workflow.states, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workflow_id' })
    workflow: WorkflowDefinition;

    @Column({ name: 'state_key' })
    stateKey: string; // 'PENDING', 'PREPARING', 'READY'

    @Column({ type: 'jsonb' })
    translations: Record<string, { label: string; description?: string }>;

    @Column({ type: 'enum', enum: StateType, name: 'state_type' })
    stateType: StateType;

    @Column({ nullable: true })
    color: string; // UI display color '#FF5733'

    @Column({ nullable: true })
    icon: string; // UI icon name 'clock', 'check', 'fire'

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    /**
     * Auto-actions when entering this state
     * Example: { print_ticket: true, notify_kitchen: true, start_timer: 300 }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'on_enter_actions' })
    onEnterActions: Record<string, any>;

    /**
     * Auto-actions when leaving this state
     * Example: { stop_timer: true, log_duration: true }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'on_exit_actions' })
    onExitActions: Record<string, any>;
}
