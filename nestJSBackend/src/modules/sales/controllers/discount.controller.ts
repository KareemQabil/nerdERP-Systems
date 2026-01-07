import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum, IsIn } from 'class-validator';

// Use common guards and decorators
import { AuthorizationGuard } from '../../../common/guards/authorization.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { User } from '../../users/entities/user.entity';

import {
    DiscountService,
    CreateDiscountDto,
    UpdateDiscountDto,
    ApplyDiscountParams,
} from '../services/discount.service';
import { OrderType } from '../entities/sales-order.entity';

// =====================================================
// REQUEST DTOs
// =====================================================

class CreateDiscountRequestDto implements CreateDiscountDto {
    code: string;
    name: string;
    nameAr?: string;
    description?: string;
    type: any;
    method: any;
    value: number;
    scope?: any;
    minimumOrderValue?: number;
    maximumDiscountAmount?: number;
    maxUsesPerDay?: number;
    maxUsesTotal?: number;
    validFrom?: Date;
    validUntil?: Date;
    validDays?: number[];
    validTimeFrom?: string;
    validTimeUntil?: string;
    requiresApproval?: boolean;
    requiresPin?: boolean;
    allowedRoles?: string[];
    applicableOrderTypes?: string[];
    applicableCategoryIds?: string[];
    applicableProductIds?: string[];
    combinable?: boolean;
    priority?: number;
    isActive?: boolean;
    sortOrder?: number;
}

class ApplyDiscountRequestDto {
    orderId: string;
    discountId?: string;
    discountCode?: string;
    manualValue?: number;
    manualType?: 'PERCENTAGE' | 'FIXED';

    @IsNotEmpty({ message: 'Discount reason is required for audit trail' })
    @IsString({ message: 'Discount reason must be a string' })
    reason!: string;  // Non-assertion modifier to make it required

    @IsIn(['LOYALTY', 'COMPLAINT', 'PROMO', 'EMPLOYEE', 'MANAGER', 'OTHER'], {
        message: 'Reason must be one of: LOYALTY, COMPLAINT, PROMO, EMPLOYEE, MANAGER, OTHER'
    })
    reasonCategory?: string;  // Optional category for reporting
}

class RemoveDiscountRequestDto {
    orderId: string;
    orderDiscountId: string;
    reason?: string;
}

class ApproveDiscountRequestDto {
    orderDiscountId: string;
    approved: boolean;
    rejectionReason?: string;
}

// =====================================================
// DISCOUNT CONTROLLER
// =====================================================

@ApiTags('Discounts')
@ApiBearerAuth()
@Controller('api/v1/discounts')
export class DiscountController {
    constructor(private readonly discountService: DiscountService) { }

    // =====================================================
    // DISCOUNT TEMPLATE CRUD
    // =====================================================

    /**
     * Create a new discount template
     */
    @Post()
    @UseGuards(AuthorizationGuard)
    @RequirePermissions('discounts.create')
    @ApiOperation({ summary: 'Create a new discount template' })
    @ApiResponse({ status: 201, description: 'Discount created successfully' })
    async createDiscount(
        @Body() dto: CreateDiscountRequestDto,
        @Request() req: any,
        @Query('storeId') storeId: string,
    ) {
        const user: User = req.user;
        const discount = await this.discountService.createDiscount(storeId, dto, user.id);
        return {
            success: true,
            data: discount,
            messageKey: 'DISCOUNT_CREATED',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get all discounts for a store
     */
    @Get()
    @ApiOperation({ summary: 'Get all discounts for a store' })
    @ApiQuery({ name: 'storeId', required: true })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    async getStoreDiscounts(
        @Query('storeId') storeId: string,
        @Query('includeInactive') includeInactive?: boolean,
    ) {
        const discounts = await this.discountService.getStoreDiscounts(storeId, includeInactive === true);
        return {
            success: true,
            data: discounts,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get discount by ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get discount by ID' })
    async getDiscountById(@Param('id') id: string) {
        const discount = await this.discountService.getDiscountById(id);
        return {
            success: true,
            data: discount,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Update a discount
     */
    @Put(':id')
    @UseGuards(AuthorizationGuard)
    @RequirePermissions('discounts.update')
    @ApiOperation({ summary: 'Update a discount template' })
    async updateDiscount(
        @Param('id') id: string,
        @Body() dto: Partial<CreateDiscountRequestDto>,
        @Request() req: any,
    ) {
        const user: User = req.user;
        const discount = await this.discountService.updateDiscount(id, dto, user.id);
        return {
            success: true,
            data: discount,
            messageKey: 'DISCOUNT_UPDATED',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Delete (deactivate) a discount
     */
    @Delete(':id')
    @UseGuards(AuthorizationGuard)
    @RequirePermissions('discounts.delete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a discount template' })
    async deleteDiscount(@Param('id') id: string) {
        await this.discountService.deleteDiscount(id);
    }

    // =====================================================
    // APPLY DISCOUNT TO ORDER
    // =====================================================

    /**
     * Apply a discount to an order
     */
    @Post('apply')
    @UseGuards(AuthorizationGuard)
    @RequirePermissions('discounts.apply')
    @ApiOperation({ summary: 'Apply a discount to an order' })
    @ApiResponse({ status: 200, description: 'Discount applied successfully' })
    async applyDiscount(
        @Body() dto: ApplyDiscountRequestDto,
        @Request() req: any,
    ) {
        const user: User = req.user;
        const result = await this.discountService.applyDiscount({
            ...dto,
            appliedBy: user,
            ipAddress: req.ip,
            deviceId: req.headers['x-device-id'],
        });

        return {
            success: true,
            data: {
                orderDiscount: result.orderDiscount,
                discountAmount: result.discountAmount,
                requiresApproval: result.requiresApproval,
                newOrderTotal: result.newOrderTotal,
            },
            messageKey: result.requiresApproval ? 'DISCOUNT_PENDING_APPROVAL' : 'DISCOUNT_APPLIED',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Remove a discount from an order
     */
    @Post('remove')
    @UseGuards(AuthorizationGuard)
    @RequirePermissions('discounts.remove')
    @ApiOperation({ summary: 'Remove a discount from an order' })
    @HttpCode(HttpStatus.OK)
    async removeDiscount(
        @Body() dto: RemoveDiscountRequestDto,
        @Request() req: any,
    ) {
        const user: User = req.user;
        await this.discountService.removeDiscount({
            ...dto,
            removedBy: user,
        });

        return {
            success: true,
            messageKey: 'DISCOUNT_REMOVED',
            timestamp: new Date().toISOString(),
        };
    }

    // =====================================================
    // APPROVAL WORKFLOW
    // =====================================================

    /**
     * Approve or reject a pending discount
     */
    @Post('approve')
    @UseGuards(AuthorizationGuard)
    @RequirePermissions('discounts.approve')
    @ApiOperation({ summary: 'Approve or reject a pending discount' })
    async processDiscountApproval(
        @Body() dto: ApproveDiscountRequestDto,
        @Request() req: any,
    ) {
        const user: User = req.user;
        const orderDiscount = await this.discountService.processDiscountApproval({
            ...dto,
            approvedBy: user,
        });

        return {
            success: true,
            data: orderDiscount,
            messageKey: dto.approved ? 'DISCOUNT_APPROVED' : 'DISCOUNT_REJECTED',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get pending discount approvals
     */
    @Get('pending-approvals')
    @UseGuards(AuthorizationGuard)
    @RequirePermissions('discounts.approve')
    @ApiOperation({ summary: 'Get pending discount approvals for a store' })
    async getPendingApprovals(@Query('storeId') storeId: string) {
        const pending = await this.discountService.getPendingApprovals(storeId);
        return {
            success: true,
            data: pending,
            timestamp: new Date().toISOString(),
        };
    }

    // =====================================================
    // AVAILABLE DISCOUNTS
    // =====================================================

    /**
     * Get available discounts for an order
     */
    @Get('available')
    @ApiOperation({ summary: 'Get available discounts for an order' })
    @ApiQuery({ name: 'storeId', required: true })
    @ApiQuery({ name: 'orderType', required: true })
    async getAvailableDiscounts(
        @Query('storeId') storeId: string,
        @Query('orderType') orderType: OrderType,
        @Request() req: any,
    ) {
        const user: User = req.user;
        const available = await this.discountService.getAvailableDiscounts(storeId, orderType, user);
        return {
            success: true,
            data: available,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Validate a discount code
     */
    @Get('validate/:code')
    @ApiOperation({ summary: 'Validate a discount code' })
    @ApiQuery({ name: 'storeId', required: true })
    async validateDiscountCode(
        @Param('code') code: string,
        @Query('storeId') storeId: string,
    ) {
        try {
            const discount = await this.discountService.getDiscountByCode(storeId, code);
            return {
                success: true,
                data: {
                    valid: discount.canBeUsed(),
                    discount,
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                data: {
                    valid: false,
                    message: error.message,
                },
                timestamp: new Date().toISOString(),
            };
        }
    }
}
