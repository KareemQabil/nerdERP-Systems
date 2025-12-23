import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Decimal from 'decimal.js';
import * as jsonLogic from 'json-logic-js';
import { CalculationPipeline } from '../entities/calculation-pipeline.entity';
import { StepType } from '../entities/pipeline-step.entity';

export interface PipelineExecutionResult {
    finalAmount: number;
    breakdown: Array<{
        step: string;
        stepType: StepType;
        before: number;
        after: number;
        applied: number | null;
        config: Record<string, any>;
    }>;
}

/**
 * Calculation Engine Service
 * Executes calculation pipelines with JSONLogic condition evaluation
 * All calculations use Decimal.js for precision
 * 
 * Example Usage:
 * const result = await calculationEngine.executePipeline(pipelineId, {
 *   subtotal: 100,
 *   hour: 18, // 6 PM
 *   dayOfWeek: 1 // Monday
 * });
 * 
 * Result:
 * {
 *   finalAmount: 94.00,
 *   breakdown: [
 *     { step: 'DISCOUNT (1)', before: 100, after: 80, applied: -20 },
 *     { step: 'TAX (2)', before: 80, after: 92, applied: 12 },
 *     { step: 'SURCHARGE (3)', before: 92, after: 94, applied: 2 },
 *     { step: 'ROUNDING (4)', before: 94.00, after: 94.00, applied: null }
 *   ]
 * }
 */
@Injectable()
export class CalculationEngineService {
    constructor(
        @InjectRepository(CalculationPipeline)
        private readonly pipelineRepo: Repository<CalculationPipeline>,
    ) { }

    /**
     * Execute a calculation pipeline
     * @param pipelineId Pipeline UUID
     * @param context Context data for condition evaluation and calculations
     * @returns Final amount and step-by-step breakdown
     */
    async executePipeline(
        pipelineId: string,
        context: Record<string, any>,
    ): Promise<PipelineExecutionResult> {
        const pipeline = await this.pipelineRepo.findOne({
            where: { id: pipelineId, isActive: true },
            relations: ['steps'],
        });

        if (!pipeline) {
            throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
        }

        // Sort steps by order
        const steps = pipeline.steps
            .filter((step) => step.isActive)
            .sort((a, b) => a.stepOrder - b.stepOrder);

        let currentAmount = new Decimal(context.subtotal || context.amount || 0);
        const breakdown: PipelineExecutionResult['breakdown'] = [];

        for (const step of steps) {
            // Evaluate condition if present
            if (step.conditionLogic && !this.evaluateCondition(step.conditionLogic, context)) {
                continue; // Skip this step
            }

            const before = currentAmount.toNumber();
            let applied: number | null = null;

            // Execute step based on type
            switch (step.stepType) {
                case StepType.TAX:
                    applied = this.applyTax(currentAmount, step.stepConfig);
                    currentAmount = currentAmount.plus(applied);
                    break;

                case StepType.DISCOUNT:
                    applied = this.applyDiscount(currentAmount, step.stepConfig);
                    currentAmount = currentAmount.minus(applied);
                    break;

                case StepType.SURCHARGE:
                    applied = this.applySurcharge(currentAmount, step.stepConfig);
                    currentAmount = currentAmount.plus(applied);
                    break;

                case StepType.ROUNDING:
                    currentAmount = this.applyRounding(currentAmount, step.stepConfig);
                    break;

                case StepType.CUSTOM_SCRIPT:
                    // For future: Execute custom JavaScript/TypeScript logic
                    break;
            }

            breakdown.push({
                step: `${step.stepType} (${step.stepOrder})`,
                stepType: step.stepType,
                before,
                after: currentAmount.toNumber(),
                applied,
                config: step.stepConfig,
            });
        }

        return {
            finalAmount: currentAmount.toNumber(),
            breakdown,
        };
    }

    /**
     * Evaluate JSONLogic condition
     * @param logic JSONLogic rule
     * @param context Data context
     * @returns Boolean result
     */
    private evaluateCondition(logic: any, context: any): boolean {
        try {
            return jsonLogic.apply(logic, context);
        } catch (error) {
            console.error('JSONLogic evaluation error:', error);
            return false;
        }
    }

    /**
     * Apply tax calculation
     * Config: { rate: 15, inclusive: true, applies_to: 'subtotal' }
     */
    private applyTax(amount: Decimal, config: Record<string, any>): number {
        const rate = new Decimal(config.rate || 0);
        const taxAmount = amount.times(rate).dividedBy(100);
        return taxAmount.toNumber();
    }

    /**
     * Apply discount calculation
     * Config: { rate: 20, type: 'percentage' | 'fixed', max_amount?: 50 }
     */
    private applyDiscount(amount: Decimal, config: Record<string, any>): number {
        if (config.type === 'fixed') {
            return new Decimal(config.amount || 0).toNumber();
        }

        // Percentage discount
        const rate = new Decimal(config.rate || 0);
        let discountAmount = amount.times(rate).dividedBy(100);

        // Apply max discount cap if configured
        if (config.max_amount) {
            const maxDiscount = new Decimal(config.max_amount);
            discountAmount = Decimal.min(discountAmount, maxDiscount);
        }

        return discountAmount.toNumber();
    }

    /**
     * Apply surcharge calculation
     * Config: { rate: 10, name: 'service_charge', applies_to: 'subtotal' }
     */
    private applySurcharge(amount: Decimal, config: Record<string, any>): number {
        if (config.type === 'fixed') {
            return new Decimal(config.amount || 0).toNumber();
        }

        const rate = new Decimal(config.rate || 0);
        const surchargeAmount = amount.times(rate).dividedBy(100);
        return surchargeAmount.toNumber();
    }

    /**
     * Apply rounding
     * Config: { method: 'up' | 'down' | 'nearest', precision: 2 }
     */
    private applyRounding(amount: Decimal, config: Record<string, any>): Decimal {
        const precision = config.precision || 2;
        const method = config.method || 'nearest';

        switch (method) {
            case 'up':
                return amount.toDecimalPlaces(precision, Decimal.ROUND_UP);
            case 'down':
                return amount.toDecimalPlaces(precision, Decimal.ROUND_DOWN);
            case 'nearest':
            default:
                return amount.toDecimalPlaces(precision, Decimal.ROUND_HALF_UP);
        }
    }

    /**
     * Get default pipeline for a store
     */
    async getDefaultPipeline(storeId?: string): Promise<CalculationPipeline | null> {
        const query = this.pipelineRepo
            .createQueryBuilder('pipeline')
            .where('pipeline.is_active = :isActive', { isActive: true })
            .andWhere('pipeline.entity_type = :entityType', {
                entityType: 'ORDER_PRICING',
            });

        if (storeId) {
            query.andWhere(
                '(pipeline.applies_to_stores IS NULL OR :storeId = ANY(pipeline.applies_to_stores::text[]))',
                { storeId },
            );
        }

        query.orderBy('pipeline.created_at', 'ASC').limit(1);

        return await query.getOne();
    }
}
