import { IsString, IsEnum, IsBoolean, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkflowType } from '../entities/workflow-definition.entity';
import { StateType } from '../entities/workflow-state.entity';

// =============================================================================
// WORKFLOW STATE DTOs
// =============================================================================

export class CreateWorkflowStateDto {
    @ApiProperty({ description: 'Unique key for the state', example: 'PENDING' })
    @IsString()
    stateKey: string;

    @ApiProperty({ description: 'State type', enum: StateType })
    @IsEnum(StateType)
    stateType: StateType;

    @ApiPropertyOptional({ description: 'Translations for state label' })
    @IsObject()
    @IsOptional()
    translations?: Record<string, { label: string; description?: string }>;

    @ApiPropertyOptional({ description: 'Display color', example: '#FF5733' })
    @IsString()
    @IsOptional()
    color?: string;

    @ApiPropertyOptional({ description: 'Icon name', example: 'clock' })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiPropertyOptional({ description: 'Display order' })
    @IsOptional()
    displayOrder?: number;

    @ApiPropertyOptional({ description: 'Actions to execute when entering this state' })
    @IsObject()
    @IsOptional()
    onEnterActions?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Actions to execute when leaving this state' })
    @IsObject()
    @IsOptional()
    onExitActions?: Record<string, any>;
}

export class UpdateWorkflowStateDto {
    @ApiPropertyOptional()
    @IsObject()
    @IsOptional()
    translations?: Record<string, { label: string; description?: string }>;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    color?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiPropertyOptional()
    @IsOptional()
    displayOrder?: number;

    @ApiPropertyOptional()
    @IsObject()
    @IsOptional()
    onEnterActions?: Record<string, any>;

    @ApiPropertyOptional()
    @IsObject()
    @IsOptional()
    onExitActions?: Record<string, any>;
}

// =============================================================================
// WORKFLOW TRANSITION DTOs
// =============================================================================

export class CreateWorkflowTransitionDto {
    @ApiProperty({ description: 'Source state key', example: 'PENDING' })
    @IsString()
    fromStateKey: string;

    @ApiProperty({ description: 'Target state key', example: 'PREPARING' })
    @IsString()
    toStateKey: string;

    @ApiPropertyOptional({ description: 'Translations for button label' })
    @IsObject()
    @IsOptional()
    translations?: Record<string, { label: string }>;

    @ApiPropertyOptional({ description: 'JSONLogic condition for this transition' })
    @IsOptional()
    conditionLogic?: any;

    @ApiPropertyOptional({ description: 'Required permissions', type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    requiredPermissions?: string[];

    @ApiPropertyOptional({ description: 'Requires manager approval' })
    @IsBoolean()
    @IsOptional()
    requiresApproval?: boolean;

    @ApiPropertyOptional({ description: 'Actions triggered by this transition' })
    @IsObject()
    @IsOptional()
    triggerActions?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Display order' })
    @IsOptional()
    displayOrder?: number;
}

export class UpdateWorkflowTransitionDto {
    @ApiPropertyOptional()
    @IsObject()
    @IsOptional()
    translations?: Record<string, { label: string }>;

    @ApiPropertyOptional()
    @IsOptional()
    conditionLogic?: any;

    @ApiPropertyOptional()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    requiredPermissions?: string[];

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    requiresApproval?: boolean;

    @ApiPropertyOptional()
    @IsObject()
    @IsOptional()
    triggerActions?: Record<string, any>;

    @ApiPropertyOptional()
    @IsOptional()
    displayOrder?: number;
}

// =============================================================================
// WORKFLOW DEFINITION DTOs
// =============================================================================

export class CreateWorkflowDto {
    @ApiProperty({ description: 'Workflow name', example: 'Restaurant Order Flow' })
    @IsString()
    workflowName: string;

    @ApiProperty({ description: 'Workflow type', enum: WorkflowType })
    @IsEnum(WorkflowType)
    workflowType: WorkflowType;

    @ApiPropertyOptional({ description: 'Translations for workflow name' })
    @IsObject()
    @IsOptional()
    translations?: Record<string, { name: string; description?: string }>;

    @ApiPropertyOptional({ description: 'Is this the default workflow for its type' })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @ApiPropertyOptional({ description: 'Store IDs where this workflow applies (null = all)' })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    appliesToStores?: string[];

    @ApiPropertyOptional({ description: 'Initial states for the workflow', type: [CreateWorkflowStateDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateWorkflowStateDto)
    @IsOptional()
    states?: CreateWorkflowStateDto[];

    @ApiPropertyOptional({ description: 'Initial transitions for the workflow', type: [CreateWorkflowTransitionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateWorkflowTransitionDto)
    @IsOptional()
    transitions?: CreateWorkflowTransitionDto[];
}

export class UpdateWorkflowDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    workflowName?: string;

    @ApiPropertyOptional()
    @IsObject()
    @IsOptional()
    translations?: Record<string, { name: string; description?: string }>;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @ApiPropertyOptional()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    appliesToStores?: string[];
}
