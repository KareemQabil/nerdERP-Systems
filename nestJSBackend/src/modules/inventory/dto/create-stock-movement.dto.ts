import { IsString, IsEnum, IsNumber, IsOptional, IsUUID, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StockMoveType, StockReferenceType } from '../entities/stock-move.entity';

/**
 * Create Manual Stock Movement DTO
 *
 * Used for creating manual IN/OUT/ADJ movements from the UI
 */
export class CreateStockMovementDto {
    @ApiProperty({ example: 'product-uuid' })
    @IsUUID()
    productId: string;

    @ApiProperty({ example: 'warehouse-uuid' })
    @IsUUID()
    warehouseId: string;

    @ApiProperty({
        enum: StockMoveType,
        example: StockMoveType.IN,
        description: 'Type of movement (IN = receipt, OUT = withdrawal, ADJ = adjustment)',
    })
    @IsEnum(StockMoveType)
    moveType: StockMoveType;

    @ApiProperty({
        example: 10.5,
        description: 'Quantity (positive for IN, negative for OUT if needed)',
    })
    @IsNumber()
    @Min(0.001)
    quantity: number;

    @ApiProperty({
        enum: StockReferenceType,
        example: StockReferenceType.MANUAL,
        description: 'Reference type for the movement',
    })
    @IsEnum(StockReferenceType)
    referenceType: StockReferenceType;

    @ApiProperty({
        example: 'PO-2024-001',
        required: false,
        description: 'Reference number (PO number, manual ref, etc.)',
    })
    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @ApiProperty({
        example: 15.5,
        required: false,
        description: 'Cost per unit (required for IN movements)',
    })
    @IsOptional()
    @IsNumber()
    costPerUnit?: number;

    @ApiProperty({
        example: 'batch-uuid',
        required: false,
        description: 'Specific batch ID for FIFO tracking',
    })
    @IsOptional()
    @IsUUID()
    batchId?: string;

    @ApiProperty({
        example: { reason: 'Damaged goods', approvedBy: 'Manager Name' },
        required: false,
        description: 'Additional metadata for the movement',
    })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;

    @ApiProperty({
        example: '5d35f',
        required: false,
        description: 'Device ID that initiated the movement',
    })
    @IsOptional()
    @IsString()
    deviceId?: string;

    @ApiProperty({
        example: 'user-uuid',
        required: false,
        description: 'User ID that initiated the movement',
    })
    @IsOptional()
    @IsUUID()
    userId?: string;
}

/**
 * Create Stock Transfer DTO
 *
 * Used for creating warehouse-to-stock transfers with approval workflow
 */
export class CreateStockTransferDto {
    @ApiProperty({ example: 'warehouse-from-uuid' })
    @IsUUID()
    fromWarehouseId: string;

    @ApiProperty({ example: 'warehouse-to-uuid' })
    @IsUUID()
    toWarehouseId: string;

    @ApiProperty({
        type: 'array',
        example: [
            { productId: 'prod-1', quantity: 10, notes: 'For restaurant' },
            { productId: 'prod-2', quantity: 5, notes: 'Backup stock' },
        ],
    })
    items: Array<{
        productId: string;
        quantity: number;
        notes?: string;
    }>;

    @ApiProperty({
        example: 'Urgent - Restaurant running low on supplies',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({
        example: 'user-uuid',
        description: 'User creating the transfer request',
    })
    @IsUUID()
    userId: string;

    @ApiProperty({
        example: false,
        required: false,
        description: 'Auto-approve if user has permission',
    })
    @IsOptional()
    autoApprove?: boolean;
}

/**
 * Approve Stock Transfer DTO
 */
export class ApproveTransferDto {
    @ApiProperty({
        example: 'manager-uuid',
        description: 'Manager user ID approving the transfer',
    })
    @IsUUID()
    managerId: string;

    @ApiProperty({
        example: true,
        required: false,
        description: 'Whether to approve (true) or reject (false)',
    })
    @IsOptional()
    approved: boolean;

    @ApiProperty({
        example: 'Insufficient stock at source warehouse',
        required: false,
        description: 'Rejection reason (if rejecting)',
    })
    @IsOptional()
    @IsString()
    rejectionReason?: string;
}

/**
 * Receive Transfer DTO
 */
export class ReceiveTransferDto {
    @ApiProperty({
        example: 'receiver-uuid',
        description: 'User ID receiving the transfer',
    })
    @IsUUID()
    userId: string;

    @ApiProperty({
        type: 'array',
        required: false,
        example: [
            { productId: 'prod-1', quantityReceived: 10 },
            { productId: 'prod-2', quantityReceived: 4, notes: 'One item damaged' },
        ],
        description: 'Actual received quantities (may differ from requested)',
    })
    @IsOptional()
    itemsReceived?: Array<{
        productId: string;
        quantityReceived: number;
        notes?: string;
    }>;

    @ApiProperty({
        example: 'All items received in good condition',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

/**
 * Get Pending Transfers Query DTO
 */
export class GetPendingTransfersDto {
    @ApiProperty({
        example: 'warehouse-uuid',
        required: false,
        description: 'Filter by warehouse (source or destination)',
    })
    @IsOptional()
    @IsUUID()
    warehouseId?: string;

    @ApiProperty({
        example: 'PENDING',
        enum: ['DRAFT', 'PENDING', 'IN_TRANSIT'],
        required: false,
        description: 'Filter by status',
    })
    @IsOptional()
    @IsEnum(['DRAFT', 'PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'])
    status?: string;
}
