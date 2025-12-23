import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { PipelineStep } from './pipeline-step.entity';

export enum PipelineEntityType {
    ORDER_PRICING = 'ORDER_PRICING',
    PRODUCT_PRICING = 'PRODUCT_PRICING',
    INVENTORY_VALUATION = 'INVENTORY_VALUATION',
}

/**
 * Calculation Pipeline Entity
 * Defines the sequence of calculations (Tax, Discount, Service Charge, Rounding)
 * Replaces hardcoded pricing formulas with configurable pipelines
 * 
 * Example: Saudi Standard Pricing Pipeline
 * - Step 1: Discount (20% happy hour, 5 PM - 9 PM)
 * - Step 2: Tax (VAT 15%, inclusive)
 * - Step 3: Service Charge (10% of subtotal)
 * - Step 4: Rounding (nearest 0.01)
 */
@Entity('calculation_pipelines')
export class CalculationPipeline extends AbstractEntity {
    @Column({ name: 'pipeline_name' })
    pipelineName: string;

    @Column({ type: 'enum', enum: PipelineEntityType, name: 'entity_type' })
    entityType: PipelineEntityType;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    /**
     * Store IDs where this pipeline applies (null = all stores)
     */
    @Column({ type: 'jsonb', nullable: true, name: 'applies_to_stores' })
    appliesToStores: string[];

    @OneToMany(() => PipelineStep, (step) => step.pipeline, { cascade: true })
    steps: PipelineStep[];
}
