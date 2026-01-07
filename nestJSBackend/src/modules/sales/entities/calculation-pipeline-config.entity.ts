import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Store } from '../../organization/entities/store.entity';

/**
 * =============================================================================
 * CALCULATION PIPELINE CONFIGURATION TYPES
 * =============================================================================
 *
 * This configuration enables a modular, "Lego Architecture" calculation system
 * where business rules are defined in JSONB rather than hardcoded.
 */

/**
 * Pipeline Stage Types
 * Each stage type has specific configuration and execution logic
 */
export enum PipelineStageType {
  ITEM_SUBTOTAL = 'ITEM_SUBTOTAL',
  SERVICE_CHARGE = 'SERVICE_CHARGE',
  DELIVERY_FEE = 'DELIVERY_FEE',
  PLATFORM_DELIVERY_FEE = 'PLATFORM_DELIVERY_FEE',
  SUBTOTAL_BEFORE_TAX = 'SUBTOTAL_BEFORE_TAX',
  TAX = 'TAX',
  DISCOUNT = 'DISCOUNT',
  SURCHARGE = 'SURCHARGE',
  TOTAL = 'TOTAL',
}

/**
 * Tax Calculation Methods
 */
export enum TaxCalculationMethod {
  INCLUSIVE = 'INCLUSIVE',   // Tax included in price (divide by 1+rate)
  EXCLUSIVE = 'EXCLUSIVE',   // Tax added on top (multiply by rate)
}

/**
 * Condition Types for Conditional Pipeline Execution
 */
export enum ConditionType {
  AND = 'AND',
  OR = 'OR',
  FIELD_EXISTS = 'FIELD_EXISTS',
  FIELD_EQUALS = 'FIELD_EQUALS',
}

/**
 * Pipeline Condition Rule
 */
export interface PipelineConditionRule {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'exists';
  value?: any;
}

/**
 * Pipeline Condition
 */
export interface PipelineCondition {
  type: ConditionType;
  rules?: PipelineConditionRule[];
  field?: string;
}

/**
 * Pipeline Stage Configuration
 */
export interface PipelineStageConfig {
  /**
   * Stage identifier (unique within pipeline)
   */
  id: string;

  /**
   * Stage type (determines execution logic)
   */
  type: PipelineStageType;

  /**
   * Display name for audit trail
   */
  name: string;

  /**
   * Detailed description
   */
  description?: string;

  /**
   * Optional condition for executing this stage
   */
  condition?: PipelineCondition;

  /**
   * Stage-specific configuration
   */
  config: Record<string, any>;

  /**
   * Output variable names produced by this stage
   */
  outputs: string[];

  /**
   * Whether this stage is enabled
   */
  enabled?: boolean;
}

/**
 * Order Type Pipeline
 */
export interface OrderTypePipeline {
  enabled: boolean;
  pipeline: PipelineStageConfig[] | string; // Can be array or reference to another order type
}

/**
 * Discount Configuration
 */
export interface DiscountConfig {
  type: 'percentage' | 'fixed';
  maxPercentage?: number;
  maxAmount?: number;
  requiresAuthorization: boolean;
  authorizationLevel: 'CASHIER' | 'MANAGER' | 'ADMIN';
  applicationPoint: 'SUBTOTAL' | 'GRAND_TOTAL';
  applyToTax: boolean;
  applyToServiceCharge: boolean;
  applyToDelivery: boolean;
}

/**
 * Complete Calculation Pipeline Configuration
 * This interface defines the full JSONB structure stored in configValue
 */
export interface CalculationPipelineConfig {
  version: string;
  storeId: string;
  pipelineId: string;
  description: string;
  isActive: boolean;
  orderTypePipelines: Record<string, OrderTypePipeline>;
  discountConfigs: Record<string, DiscountConfig>;
}

/**
 * =============================================================================
 * ENTITY: CalculationPipelineConfigEntity
 * =============================================================================
 *
 * Stores modular calculation pipeline configurations per store.
 * This replaces hardcoded calculation logic in SalesService.
 *
 * @example
 * // Default Egyptian Restaurant Configuration
 * {
 *   "version": "1.0.0",
 *   "pipelineId": "egypt-restaurant-default",
 *   "description": "Default Egyptian restaurant with 14% VAT and 12% service charge",
 *   "isActive": true,
 *   "orderTypePipelines": {
 *     "DINE_IN": {
 *       "enabled": true,
 *       "pipeline": [
 *         { "type": "ITEM_SUBTOTAL", "config": {}, "outputs": ["subtotal"] },
 *         { "type": "SERVICE_CHARGE", "config": { "rate": 0.12 }, "outputs": ["serviceCharge"] },
 *         { "type": "SUBTOTAL_BEFORE_TAX", "config": { "sumOf": ["subtotal", "serviceCharge"] }, "outputs": ["subtotalBeforeTax"] },
 *         { "type": "TAX", "config": { "rate": 0.14, "calculationMethod": "INCLUSIVE" }, "outputs": ["taxAmount"] },
 *         { "type": "TOTAL", "config": { "formula": "subtotalBeforeTax + taxAmount" }, "outputs": ["totalNet"] }
 *       ]
 *     }
 *   }
 * }
 */
@Entity('calculation_pipeline_configs')
export class CalculationPipelineConfigEntity extends AbstractEntity {
  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  /**
   * Pipeline configuration version
   * Enables tracking which calculation logic was used for historical orders
   */
  @Column({ name: 'version' })
  version: string;

  /**
   * Unique pipeline identifier
   * e.g., 'egypt-restaurant-default', 'saudi-restaurant-v2'
   */
  @Column({ name: 'pipeline_id', unique: true })
  pipelineId: string;

  /**
   * Human-readable description
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Whether this pipeline is active
   * Only one pipeline per store should be active at a time
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * Complete pipeline configuration (JSONB)
   * Contains all order type pipelines, discount configs, etc.
   */
  @Column({ type: 'jsonb', name: 'config' })
  config: CalculationPipelineConfig;
}
