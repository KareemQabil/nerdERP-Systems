import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Decimal } from 'decimal.js';
import {
    CalculationPipelineConfig,
    PipelineStageConfig,
    PipelineStageType,
    TaxCalculationMethod,
    ConditionType,
    CalculationPipelineConfigEntity,
} from '../entities/calculation-pipeline-config.entity';
import { OrderType } from '../entities/sales-order.entity';
import { StoreConfigurationService } from '../../organization/services/store-configuration.service';
import { Store } from '../../organization/entities/store.entity';

/**
 * =============================================================================
 * CALCULATION CONTEXT TYPES
 * =============================================================================
 */

export interface CalculationContext {
    orderType: OrderType;
    items: OrderItemCalculationData[];
    tableId?: string;
    customerCount?: number;
    deliveryZoneId?: string;
    deliveryZoneData?: DeliveryZoneData;
    discount?: DiscountRequest;
    storeId: string;
    storeConfig: {
        vatRate: number;
        serviceChargeRate: number;
        serviceChargeAppliesTo: string[];
        currencyCode: string;
    };
}

export interface OrderItemCalculationData {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    modifiersTotal: number;
    lineTotal: number;
    isVoided: boolean;
    discountExempt: boolean;
    priceIncludesTax: boolean;
    taxRate?: number;
}

export interface DeliveryZoneData {
    id: string;
    code: string;
    deliveryFee: number;
    freeDeliveryMinimum?: number;
    minimumOrderValue?: number;
    estimatedMinutes?: number;
}

export interface DiscountRequest {
    type: 'CORPORATE_PRESET' | 'MANUAL_PERCENTAGE' | 'MANUAL_AMOUNT';
    discountType: 'percentage' | 'fixed';
    value: number;
    reason: string;
    authorizedBy?: string;
    discountCode?: string;
}

export interface PipelineStageResult {
    stageId: string;
    stageName: string;
    outputs: Record<string, number>;
    auditLog: {
        timestamp: Date;
        before: Record<string, number>;
        after: Record<string, number>;
        applied: Record<string, number>;
    };
}

export interface CalculationBreakdown {
    pipelineVersion: string;
    pipelineId: string;
    orderType: OrderType;
    stages: PipelineStageResult[];
    finalTotals: {
        subtotal: number;
        serviceCharge: number;
        deliveryFee: number;
        subtotalBeforeTax: number;
        taxAmount: number;
        discountAmount: number;
        totalNet: number;
    };
    executedAt: Date;
}

export interface CalculationResult {
    totalGross: number;
    totalTax: number;
    totalNet: number;
    totalSurcharges: number;
    serviceChargeRate: number;
    serviceChargeAmount: number;
    discountAmount: number;
    discountReason?: string;
    deliveryFee?: number;
    calculationBreakdown: CalculationBreakdown;
    pipelineVersion: string;
    pipelineId: string;
}

/**
 * =============================================================================
 * STAGE HANDLERS
 * =============================================================================
 */

/**
 * Base interface for pipeline stage handlers
 */
interface IPipelineStageHandler {
    stageType: PipelineStageType;
    execute(
        config: PipelineStageConfig,
        context: CalculationContext,
        previousOutputs: Record<string, number>,
    ): Promise<{
        outputs: Record<string, number>;
        auditLog: PipelineStageResult['auditLog'];
    }>;
    validate(config: PipelineStageConfig): Promise<boolean>;
}

/**
 * Item Subtotal Handler
 * Calculates sum of all item line totals
 */
@Injectable()
class ItemSubtotalHandler implements IPipelineStageHandler {
    stageType = PipelineStageType.ITEM_SUBTOTAL;

    async execute(
        config: PipelineStageConfig,
        context: CalculationContext,
        previousOutputs: Record<string, number>,
    ) {
        const subtotal = context.items
            .filter(item => !item.isVoided || config.config.includeVoidedItems)
            .reduce((sum, item) => {
                const lineTotal = config.config.includeModifiers
                    ? item.lineTotal
                    : item.quantity * item.unitPrice;
                return sum + lineTotal;
            }, 0);

        return {
            outputs: { subtotal },
            auditLog: {
                timestamp: new Date(),
                before: {},
                after: { subtotal },
                applied: { subtotal },
            },
        };
    }

    async validate(config: PipelineStageConfig): Promise<boolean> {
        return !!config.outputs?.includes('subtotal');
    }
}

/**
 * Service Charge Handler
 * Calculates service charge based on rate and conditions
 */
@Injectable()
class ServiceChargeHandler implements IPipelineStageHandler {
    stageType = PipelineStageType.SERVICE_CHARGE;

    async execute(
        config: PipelineStageConfig,
        context: CalculationContext,
        previousOutputs: Record<string, number>,
    ) {
        // Check if service charge applies
        if (!this.evaluateCondition(config.condition, context)) {
            return {
                outputs: { serviceCharge: 0 },
                auditLog: {
                    timestamp: new Date(),
                    before: {},
                    after: { serviceCharge: 0 },
                    applied: { serviceCharge: 0 },
                },
            };
        }

        const basis = config.config.basis || 'subtotal';
        const basisAmount = previousOutputs[basis] || 0;
        const rate = config.config.rate || context.storeConfig.serviceChargeRate || 0;
        const serviceCharge = basisAmount * rate;

        return {
            outputs: { serviceCharge },
            auditLog: {
                timestamp: new Date(),
                before: { basisAmount, rate } as Record<string, number>,
                after: { serviceCharge, basisAmount } as Record<string, number>,
                applied: { serviceCharge },
            },
        };
    }

    async validate(config: PipelineStageConfig): Promise<boolean> {
        return !!config.outputs?.includes('serviceCharge');
    }

    private evaluateCondition(condition: any, context: CalculationContext): boolean {
        if (!condition) return true;

        switch (condition.type) {
            case ConditionType.AND:
                return condition.rules?.every((rule: any) => this.evaluateRule(rule, context)) ?? true;
            case ConditionType.FIELD_EXISTS:
                return !!context[condition.field as keyof CalculationContext];
            case ConditionType.FIELD_EQUALS:
                return (context as any)[condition.field] === condition.value;
            default:
                return true;
        }
    }

    private evaluateRule(rule: any, context: CalculationContext): boolean {
        const value = (context as any)[rule.field];
        switch (rule.operator) {
            case 'eq': return value === rule.value;
            case 'ne': return value !== rule.value;
            case 'exists': return value != null;
            default: return true;
        }
    }
}

/**
 * Delivery Fee Handler
 * Calculates delivery fee based on zone lookup
 */
@Injectable()
class DeliveryFeeHandler implements IPipelineStageHandler {
    stageType = PipelineStageType.DELIVERY_FEE;

    async execute(
        config: PipelineStageConfig,
        context: CalculationContext,
        previousOutputs: Record<string, number>,
    ) {
        let deliveryFee = 0;

        if (config.config.feeSource === 'ZONE_LOOKUP' && context.deliveryZoneId) {
            deliveryFee = context.deliveryZoneData?.deliveryFee || 0;
        } else if (config.config.feeSource === 'FIXED') {
            deliveryFee = config.config.fixedAmount || 0;
        }

        return {
            outputs: { deliveryFee },
            auditLog: {
                timestamp: new Date(),
                before: {} as Record<string, number>,
                after: { deliveryFee },
                applied: { deliveryFee },
            },
        };
    }

    async validate(config: PipelineStageConfig): Promise<boolean> {
        return !!config.outputs?.includes('deliveryFee');
    }
}

/**
 * Platform Delivery Fee Handler
 * Fixed fee for aggregators (Talabat, Marsool, Instashop)
 */
@Injectable()
class PlatformDeliveryFeeHandler implements IPipelineStageHandler {
    stageType = PipelineStageType.PLATFORM_DELIVERY_FEE;

    async execute(
        config: PipelineStageConfig,
        context: CalculationContext,
        previousOutputs: Record<string, number>,
    ) {
        const deliveryFee = config.config.fixedAmount || 0;

        return {
            outputs: { platformDeliveryFee: deliveryFee, deliveryFee },
            auditLog: {
                timestamp: new Date(),
                before: {},
                after: { deliveryFee },
                applied: { deliveryFee },
            },
        };
    }

    async validate(config: PipelineStageConfig): Promise<boolean> {
        return !!config.outputs?.includes('deliveryFee');
    }
}

/**
 * Subtotal Before Tax Handler
 * Sums specified previous outputs
 */
@Injectable()
class SubtotalBeforeTaxHandler implements IPipelineStageHandler {
    stageType = PipelineStageType.SUBTOTAL_BEFORE_TAX;

    async execute(
        config: PipelineStageConfig,
        context: CalculationContext,
        previousOutputs: Record<string, number>,
    ) {
        const sumOf = config.config.sumOf || [];
        const subtotalBeforeTax = sumOf.reduce(
            (sum, key) => sum + (previousOutputs[key] || 0),
            0
        );

        return {
            outputs: { subtotalBeforeTax },
            auditLog: {
                timestamp: new Date(),
                before: previousOutputs,
                after: { subtotalBeforeTax },
                applied: { subtotalBeforeTax },
            },
        };
    }

    async validate(config: PipelineStageConfig): Promise<boolean> {
        return !!config.outputs?.includes('subtotalBeforeTax');
    }
}

/**
 * Tax Handler
 * Calculates VAT/tax based on rate and calculation method
 */
@Injectable()
class TaxHandler implements IPipelineStageHandler {
    stageType = PipelineStageType.TAX;

    async execute(
        config: PipelineStageConfig,
        context: CalculationContext,
        previousOutputs: Record<string, number>,
    ) {
        const basis = config.config.basis || 'subtotalBeforeTax';
        const basisAmount = previousOutputs[basis] || 0;

        // Get rate from config or store config
        let rate: number;
        if (config.config.rateSource === 'store_config') {
            rate = context.storeConfig.vatRate;
        } else {
            rate = config.config.rate || 0.14; // Default 14%
        }

        const calculationMethod = config.config.calculationMethod || TaxCalculationMethod.INCLUSIVE;

        let taxAmount = 0;
        if (calculationMethod === TaxCalculationMethod.INCLUSIVE) {
            // Inclusive: price already includes tax
            // Tax = (Amount * Rate) / (1 + Rate)
            taxAmount = (basisAmount * rate) / (1 + rate);
        } else {
            // Exclusive: tax added on top
            taxAmount = basisAmount * rate;
        }

        return {
            outputs: { taxAmount },
            auditLog: {
                timestamp: new Date(),
                before: { [basis]: basisAmount, rate },
                after: { taxAmount, [basis]: basisAmount },
                applied: { taxAmount },
            },
        };
    }

    async validate(config: PipelineStageConfig): Promise<boolean> {
        return !!config.outputs?.includes('taxAmount');
    }
}

/**
 * Discount Handler
 * Applies discount to grand total
 */
@Injectable()
class DiscountHandler implements IPipelineStageHandler {
    stageType = PipelineStageType.DISCOUNT;

    async execute(
        config: PipelineStageConfig,
        context: CalculationContext,
        previousOutputs: Record<string, number>,
    ) {
        if (!context.discount) {
            return {
                outputs: { discountAmount: 0 },
                auditLog: {
                    timestamp: new Date(),
                    before: {},
                    after: { discountAmount: 0 },
                    applied: { discountAmount: 0 },
                },
            };
        }

        const { discount, storeConfig } = context;
        const subtotalBeforeTax = previousOutputs.subtotalBeforeTax || 0;
        const taxAmount = previousOutputs.taxAmount || 0;
        const grandTotal = subtotalBeforeTax + taxAmount;

        let discountAmount = 0;
        if (discount.discountType === 'percentage') {
            discountAmount = grandTotal * (discount.value / 100);
        } else {
            discountAmount = discount.value;
        }

        return {
            outputs: { discountAmount },
            auditLog: {
                timestamp: new Date(),
                before: { grandTotal } as Record<string, number>,
                after: { discountAmount },
                applied: { discountAmount },
            },
        };
    }

    async validate(config: PipelineStageConfig): Promise<boolean> {
        return !!config.outputs?.includes('discountAmount');
    }
}

/**
 * Surcharge Handler
 * Applies additional surcharges
 */
@Injectable()
class SurchargeHandler implements IPipelineStageHandler {
    stageType = PipelineStageType.SURCHARGE;

    async execute(
        config: PipelineStageConfig,
        context: CalculationContext,
        previousOutputs: Record<string, number>,
    ) {
        const surchargeAmount = config.config.amount || 0;

        return {
            outputs: { surchargeAmount },
            auditLog: {
                timestamp: new Date(),
                before: {},
                after: { surchargeAmount },
                applied: { surchargeAmount },
            },
        };
    }

    async validate(config: PipelineStageConfig): Promise<boolean> {
        return !!config.outputs?.includes('surchargeAmount');
    }
}

/**
 * Total Handler
 * Calculates final grand total
 */
@Injectable()
class TotalHandler implements IPipelineStageHandler {
    stageType = PipelineStageType.TOTAL;

    async execute(
        config: PipelineStageConfig,
        context: CalculationContext,
        previousOutputs: Record<string, number>,
    ) {
        // Simple formula evaluation
        const subtotalBeforeTax = previousOutputs.subtotalBeforeTax || 0;
        const taxAmount = previousOutputs.taxAmount || 0;
        const discountAmount = previousOutputs.discountAmount || 0;

        const totalNet = subtotalBeforeTax + taxAmount - discountAmount;

        return {
            outputs: { totalNet },
            auditLog: {
                timestamp: new Date(),
                before: { subtotalBeforeTax, taxAmount, discountAmount },
                after: { totalNet },
                applied: { totalNet },
            },
        };
    }

    async validate(config: PipelineStageConfig): Promise<boolean> {
        return !!config.outputs?.includes('totalNet');
    }
}

/**
 * =============================================================================
 * MAIN CALCULATION PIPELINE SERVICE
 * =============================================================================
 */

@Injectable()
export class CalculationPipelineService {
    private readonly logger = new Logger(CalculationPipelineService.name);

    private readonly handlers: Map<PipelineStageType, IPipelineStageHandler> = new Map();

    constructor(
        @InjectRepository(CalculationPipelineConfigEntity)
        private readonly pipelineRepo: Repository<CalculationPipelineConfigEntity>,
        private readonly storeConfigService: StoreConfigurationService,
    ) {
        this.registerHandlers();
    }

    private registerHandlers() {
        this.handlers.set(PipelineStageType.ITEM_SUBTOTAL, new ItemSubtotalHandler());
        this.handlers.set(PipelineStageType.SERVICE_CHARGE, new ServiceChargeHandler());
        this.handlers.set(PipelineStageType.DELIVERY_FEE, new DeliveryFeeHandler());
        this.handlers.set(PipelineStageType.PLATFORM_DELIVERY_FEE, new PlatformDeliveryFeeHandler());
        this.handlers.set(PipelineStageType.SUBTOTAL_BEFORE_TAX, new SubtotalBeforeTaxHandler());
        this.handlers.set(PipelineStageType.TAX, new TaxHandler());
        this.handlers.set(PipelineStageType.DISCOUNT, new DiscountHandler());
        this.handlers.set(PipelineStageType.SURCHARGE, new SurchargeHandler());
        this.handlers.set(PipelineStageType.TOTAL, new TotalHandler());
    }

    /**
     * Execute calculation pipeline for an order
     */
    async executePipeline(
        context: CalculationContext,
        pipelineConfig?: CalculationPipelineConfig,
    ): Promise<CalculationResult> {
        const config = pipelineConfig || await this.getPipelineConfig(context.storeId);

        if (!config) {
            throw new NotFoundException('Calculation pipeline not found for store');
        }

        const orderTypeKey = context.orderType || OrderType.DINE_IN;
        const orderTypePipeline = config.orderTypePipelines[orderTypeKey];

        if (!orderTypePipeline || !orderTypePipeline.enabled) {
            this.logger.warn(`Pipeline not configured for order type: ${orderTypeKey}`);
            return this.getFallbackResult(context);
        }

        // Handle pipeline reference (e.g., MARSOOL -> TALABAT)
        let pipeline = orderTypePipeline.pipeline;
        if (typeof pipeline === 'string') {
            const referencedPipeline = config.orderTypePipelines[pipeline];
            pipeline = referencedPipeline?.pipeline as PipelineStageConfig[];
        }

        if (!Array.isArray(pipeline)) {
            throw new Error(`Invalid pipeline configuration for ${orderTypeKey}`);
        }

        // Execute pipeline stages
        const stages: PipelineStageResult[] = [];
        const outputs: Record<string, number> = {};

        for (const stage of pipeline) {
            if (stage.enabled === false) continue;

            const handler = this.handlers.get(stage.type);
            if (!handler) {
                this.logger.warn(`No handler for stage type: ${stage.type}`);
                continue;
            }

            // Check condition
            if (!this.evaluateCondition(stage.condition, context, outputs)) {
                continue;
            }

            const result = await handler.execute(stage, context, outputs);

            stages.push({
                stageId: stage.id,
                stageName: stage.name,
                outputs: result.outputs,
                auditLog: result.auditLog,
            });

            // Merge outputs for next stage
            Object.assign(outputs, result.outputs);
        }

        // Build final result
        const breakdown: CalculationBreakdown = {
            pipelineVersion: config.version,
            pipelineId: config.pipelineId,
            orderType: context.orderType,
            stages,
            finalTotals: {
                subtotal: outputs.subtotal || 0,
                serviceCharge: outputs.serviceCharge || 0,
                deliveryFee: outputs.deliveryFee || 0,
                subtotalBeforeTax: outputs.subtotalBeforeTax || 0,
                taxAmount: outputs.taxAmount || 0,
                discountAmount: outputs.discountAmount || 0,
                totalNet: outputs.totalNet || 0,
            },
            executedAt: new Date(),
        };

        return {
            totalGross: breakdown.finalTotals.subtotal,
            totalTax: breakdown.finalTotals.taxAmount,
            totalNet: breakdown.finalTotals.totalNet,
            totalSurcharges: (breakdown.finalTotals.serviceCharge || 0) + (breakdown.finalTotals.deliveryFee || 0),
            serviceChargeRate: context.storeConfig.serviceChargeRate,
            serviceChargeAmount: breakdown.finalTotals.serviceCharge,
            discountAmount: breakdown.finalTotals.discountAmount,
            discountReason: context.discount?.reason,
            deliveryFee: breakdown.finalTotals.deliveryFee,
            calculationBreakdown: breakdown,
            pipelineVersion: config.version,
            pipelineId: config.pipelineId,
        };
    }

    /**
     * Get pipeline configuration for a store
     */
    async getPipelineConfig(storeId: string): Promise<CalculationPipelineConfig | null> {
        const configs = await this.pipelineRepo.find({
            where: { store: { id: storeId }, isActive: true },
            order: { createdAt: 'DESC' },
        });

        if (configs.length > 0) {
            return configs[0].config;
        }

        // Try to get from store_configuration
        try {
            const config = await this.storeConfigService.getConfig(
                storeId,
                'pos.calculation_pipeline',
                null,
            );
            if (config) {
                return config as CalculationPipelineConfig;
            }
            return this.getDefaultPipelineConfig(storeId);
        } catch {
            return this.getDefaultPipelineConfig(storeId);
        }
    }

    /**
     * Get default pipeline configuration
     */
    private getDefaultPipelineConfig(storeId: string): CalculationPipelineConfig {
        return {
            version: '1.0.0',
            storeId,
            pipelineId: 'default-pipeline',
            description: 'Default calculation pipeline',
            isActive: true,
            orderTypePipelines: {
                [OrderType.DINE_IN]: {
                    enabled: true,
                    pipeline: [
                        { id: 'step-1', type: PipelineStageType.ITEM_SUBTOTAL, name: 'Calculate Items Subtotal', config: {}, outputs: ['subtotal'] },
                        { id: 'step-2', type: PipelineStageType.SERVICE_CHARGE, name: 'Table Service Charge', config: { rate: 0.12, basis: 'subtotal' }, outputs: ['serviceCharge'] },
                        { id: 'step-3', type: PipelineStageType.SUBTOTAL_BEFORE_TAX, name: 'Subtotal Before Tax', config: { sumOf: ['subtotal', 'serviceCharge'] }, outputs: ['subtotalBeforeTax'] },
                        { id: 'step-4', type: PipelineStageType.TAX, name: 'VAT Calculation', config: { rate: 0.14, calculationMethod: TaxCalculationMethod.INCLUSIVE, basis: 'subtotalBeforeTax' }, outputs: ['taxAmount'] },
                        { id: 'step-5', type: PipelineStageType.DISCOUNT, name: 'Apply Discount', condition: { type: ConditionType.FIELD_EXISTS, field: 'discount' }, config: { applicationPoint: 'GRAND_TOTAL' }, outputs: ['discountAmount'] },
                        { id: 'step-6', type: PipelineStageType.TOTAL, name: 'Calculate Grand Total', config: { formula: 'subtotalBeforeTax + taxAmount - discountAmount' }, outputs: ['totalNet'] },
                    ],
                },
                [OrderType.TAKEAWAY]: {
                    enabled: true,
                    pipeline: [
                        { id: 'step-1', type: PipelineStageType.ITEM_SUBTOTAL, name: 'Calculate Items Subtotal', config: {}, outputs: ['subtotal'] },
                        { id: 'step-2', type: PipelineStageType.SUBTOTAL_BEFORE_TAX, name: 'Subtotal Before Tax', config: { sumOf: ['subtotal'] }, outputs: ['subtotalBeforeTax'] },
                        { id: 'step-3', type: PipelineStageType.TAX, name: 'VAT Calculation', config: { rate: 0.14, calculationMethod: TaxCalculationMethod.INCLUSIVE, basis: 'subtotalBeforeTax' }, outputs: ['taxAmount'] },
                        { id: 'step-4', type: PipelineStageType.DISCOUNT, name: 'Apply Discount', condition: { type: ConditionType.FIELD_EXISTS, field: 'discount' }, config: { applicationPoint: 'GRAND_TOTAL' }, outputs: ['discountAmount'] },
                        { id: 'step-5', type: PipelineStageType.TOTAL, name: 'Calculate Grand Total', config: { formula: 'subtotalBeforeTax + taxAmount - discountAmount' }, outputs: ['totalNet'] },
                    ],
                },
                [OrderType.DELIVERY]: {
                    enabled: true,
                    pipeline: [
                        { id: 'step-1', type: PipelineStageType.ITEM_SUBTOTAL, name: 'Calculate Items Subtotal', config: {}, outputs: ['subtotal'] },
                        { id: 'step-2', type: PipelineStageType.DELIVERY_FEE, name: 'Zone-based Delivery Fee', config: { feeSource: 'ZONE_LOOKUP' }, outputs: ['deliveryFee'] },
                        { id: 'step-3', type: PipelineStageType.SUBTOTAL_BEFORE_TAX, name: 'Subtotal Before Tax', config: { sumOf: ['subtotal', 'deliveryFee'] }, outputs: ['subtotalBeforeTax'] },
                        { id: 'step-4', type: PipelineStageType.TAX, name: 'VAT Calculation', config: { rate: 0.14, calculationMethod: TaxCalculationMethod.INCLUSIVE, basis: 'subtotalBeforeTax' }, outputs: ['taxAmount'] },
                        { id: 'step-5', type: PipelineStageType.TOTAL, name: 'Calculate Grand Total', config: { formula: 'subtotalBeforeTax + taxAmount' }, outputs: ['totalNet'] },
                    ],
                },
            },
            discountConfigs: {
                CORPORATE_PRESET: { type: 'percentage', maxPercentage: 30, requiresAuthorization: true, authorizationLevel: 'MANAGER', applicationPoint: 'GRAND_TOTAL', applyToTax: true, applyToServiceCharge: true, applyToDelivery: true },
                MANUAL_PERCENTAGE: { type: 'percentage', maxPercentage: 15, requiresAuthorization: true, authorizationLevel: 'MANAGER', applicationPoint: 'GRAND_TOTAL', applyToTax: true, applyToServiceCharge: true, applyToDelivery: true },
                MANUAL_AMOUNT: { type: 'fixed', maxAmount: 100, requiresAuthorization: true, authorizationLevel: 'MANAGER', applicationPoint: 'GRAND_TOTAL', applyToTax: true, applyToServiceCharge: true, applyToDelivery: true },
            },
        };
    }

    /**
     * Validate and apply discount
     */
    async validateDiscount(
        context: CalculationContext,
        discountRequest: DiscountRequest,
    ): Promise<{ valid: boolean; error?: string; requiresAuthorization?: boolean }> {
        const config = await this.getPipelineConfig(context.storeId);
        const discountConfig = config?.discountConfigs?.[discountRequest.type];

        if (!discountConfig) {
            return { valid: false, error: 'Invalid discount type' };
        }

        // Validate amount/percentage
        if (discountRequest.discountType === 'percentage') {
            if (discountConfig.maxPercentage && discountRequest.value > discountConfig.maxPercentage) {
                return { valid: false, error: `Maximum ${discountConfig.maxPercentage}% discount` };
            }
        } else {
            if (discountConfig.maxAmount && discountRequest.value > discountConfig.maxAmount) {
                return { valid: false, error: `Maximum ${discountConfig.maxAmount} discount` };
            }
        }

        return {
            valid: true,
            requiresAuthorization: discountConfig.requiresAuthorization,
        };
    }

    private evaluateCondition(condition: any, context: CalculationContext, outputs: Record<string, number>): boolean {
        if (!condition) return true;

        switch (condition.type) {
            case ConditionType.AND:
                return condition.rules?.every((rule: any) => {
                    const value = rule.field === 'discount' ? context.discount : (context as any)[rule.field];
                    switch (rule.operator) {
                        case 'eq': return value === rule.value;
                        case 'ne': return value !== rule.value;
                        case 'exists': return value != null;
                        default: return true;
                    }
                }) ?? true;
            case ConditionType.FIELD_EXISTS:
                return !!context[condition.field as keyof CalculationContext];
            case ConditionType.FIELD_EQUALS:
                return (context as any)[condition.field] === condition.value;
            default:
                return true;
        }
    }

    private getFallbackResult(context: CalculationContext): CalculationResult {
        // Simple fallback calculation
        const subtotal = context.items.reduce((sum, item) => sum + (item.isVoided ? 0 : item.lineTotal), 0);
        const taxRate = context.storeConfig.vatRate;
        const taxAmount = (subtotal * taxRate) / (1 + taxRate);
        const totalNet = subtotal + taxAmount;

        return {
            totalGross: subtotal,
            totalTax: taxAmount,
            totalNet,
            totalSurcharges: 0,
            serviceChargeRate: 0,
            serviceChargeAmount: 0,
            discountAmount: 0,
            calculationBreakdown: {
                pipelineVersion: 'fallback',
                pipelineId: 'fallback',
                orderType: context.orderType,
                stages: [],
                finalTotals: { subtotal, serviceCharge: 0, deliveryFee: 0, subtotalBeforeTax: subtotal, taxAmount, discountAmount: 0, totalNet },
                executedAt: new Date(),
            },
            pipelineVersion: 'fallback',
            pipelineId: 'fallback',
        };
    }
}
