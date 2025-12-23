import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { CalculationPipeline } from './calculation-pipeline.entity';

export enum StepType {
    TAX = 'TAX',
    DISCOUNT = 'DISCOUNT',
    SURCHARGE = 'SURCHARGE',
    ROUNDING = 'ROUNDING',
    CUSTOM_SCRIPT = 'CUSTOM_SCRIPT',
}

/**
 * Pipeline Step Entity
 * Individual calculation steps executed in sequence
 * Supports JSONLogic conditions for dynamic rule evaluation
 * 
 * Example Step Configs:
 * 
 * TAX Step:
 * {
 *   rate: 15,
 *   inclusive: true,
 *   applies_to: 'subtotal'
 * }
 * 
 * DISCOUNT Step (Happy Hour):
 * {
 *   type: 'happy_hour',
 *   rate: 20,
 *   condition: { "and": [{ "in": [{ "var": "hour" }, [17, 18, 19, 20]] }] }
 * }
 * 
 * SURCHARGE Step:
 * {
 *   name: 'service_charge',
 *   rate: 10,
 *   applies_to: 'subtotal'
 * }
 */
@Entity('pipeline_steps')
export class PipelineStep extends AbstractEntity {
    @ManyToOne(() => CalculationPipeline, (pipeline) => pipeline.steps, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'pipeline_id' })
    pipeline: CalculationPipeline;

    @Column({ name: 'step_order' })
    stepOrder: number;

    @Column({ type: 'enum', enum: StepType, name: 'step_type' })
    stepType: StepType;

    /**
     * Step-specific configuration
     * Structure varies based on step_type
     */
    @Column({ type: 'jsonb', name: 'step_config' })
    stepConfig: Record<string, any>;

    /**
     * JSONLogic condition
     * If present, step only executes if condition evaluates to true
     * Example: { "if": [{ ">": [{ "var": "subtotal" }, 100] }, true, false] }
     */
    @Column({ type: 'jsonb', nullable: true, name: 'condition_logic' })
    conditionLogic: any;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;
}
