import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

// Use common guards and decorators
import { AuthorizationGuard } from '../../../common/guards/authorization.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { User } from '../../users/entities/user.entity';

import { VoidReturnWorkflowService } from '../services/void-return-workflow.service';
import { ReturnType, ReturnReason } from '../entities/return-order.entity';

// =====================================================
// REQUEST DTOs
// =====================================================

class InitiateReturnRequestDto {
    orderId: string;
    returnType: ReturnType;
    returnReason: string; // Use string to be flexible with reason values
    returnedItems: Array<{
        orderItemId: string;
        productName: string;
        quantity: number;
        reason: string;
    }>;
    refundAmount?: number;
    notes?: string;
}

class ProcessReturnApprovalDto {
    historyId: string;
    approved: boolean;
    refundMethod?: string;
    rejectionReason?: string;
}

// =====================================================
// RETURN CONTROLLER
// =====================================================

@ApiTags('Returns')
@ApiBearerAuth()
@Controller('api/v1/returns')
export class ReturnController {
    constructor(
        private readonly voidReturnWorkflow: VoidReturnWorkflowService,
    ) { }

    // =====================================================
    // INITIATE RETURN
    // =====================================================

    /**
     * Initiate a return request for a completed order
     * Requires manager approval before processing
     */
    @Post('initiate')
    @UseGuards(AuthorizationGuard)
    @RequirePermissions('returns.create')
    @ApiOperation({ summary: 'Initiate a return request for a completed order' })
    @ApiResponse({ status: 200, description: 'Return request initiated' })
    async initiateReturn(
        @Body() dto: InitiateReturnRequestDto,
        @Request() req: any,
    ) {
        const user: User = req.user;
        const result = await this.voidReturnWorkflow.initiateReturnRequest({
            orderId: dto.orderId,
            returnType: dto.returnType,
            returnReason: dto.returnReason,
            returnedItems: dto.returnedItems,
            refundAmount: dto.refundAmount,
            requestedBy: user,
            ipAddress: req.ip,
            deviceId: req.headers['x-device-id'],
        });

        return {
            success: true,
            data: {
                historyId: result.history.id,
                orderNumber: result.order.orderNumber,
                requiresApproval: result.requiresApproval,
            },
            messageKey: result.requiresApproval ? 'RETURN_PENDING_APPROVAL' : 'RETURN_INITIATED',
            timestamp: new Date().toISOString(),
        };
    }

    // =====================================================
    // APPROVAL WORKFLOW
    // =====================================================

    /**
     * Approve or reject a pending return request
     * Manager-only endpoint
     */
    @Post('approve')
    @UseGuards(AuthorizationGuard)
    @RequirePermissions('returns.approve')
    @ApiOperation({ summary: 'Approve or reject a return request' })
    @ApiResponse({ status: 200, description: 'Return request processed' })
    async processReturnApproval(
        @Body() dto: ProcessReturnApprovalDto,
        @Request() req: any,
    ) {
        const user: User = req.user;
        const result = await this.voidReturnWorkflow.processReturnApproval({
            historyId: dto.historyId,
            approved: dto.approved,
            approvedBy: user,
            refundMethod: dto.refundMethod,
            rejectionReason: dto.rejectionReason,
            ipAddress: req.ip,
            deviceId: req.headers['x-device-id'],
        });

        return {
            success: true,
            data: {
                history: result.history,
                order: result.order,
                returnOrder: result.returnOrder,
                executed: result.executed,
            },
            messageKey: dto.approved ? 'RETURN_APPROVED' : 'RETURN_REJECTED',
            timestamp: new Date().toISOString(),
        };
    }

    // =====================================================
    // PENDING APPROVALS
    // =====================================================

    /**
     * Get pending return/void approvals for managers
     */
    @Get('pending-approvals')
    @UseGuards(AuthorizationGuard)
    @RequirePermissions('returns.approve')
    @ApiOperation({ summary: 'Get pending void/return approvals' })
    @ApiQuery({ name: 'storeId', required: false })
    async getPendingApprovals(@Query('storeId') storeId?: string) {
        const pending = await this.voidReturnWorkflow.getPendingApprovals(storeId);
        return {
            success: true,
            data: pending,
            timestamp: new Date().toISOString(),
        };
    }

    // =====================================================
    // RETURN HISTORY
    // =====================================================

    /**
     * Get return orders for a specific order
     */
    @Get('order/:orderId')
    @ApiOperation({ summary: 'Get returns for a specific order' })
    async getOrderReturns(@Param('orderId') orderId: string) {
        const returns = await this.voidReturnWorkflow.getOrderReturnOrders(orderId);
        return {
            success: true,
            data: returns,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get void/return history for an order
     */
    @Get('history/:orderId')
    @ApiOperation({ summary: 'Get void/return history for an order' })
    async getOrderVoidReturnHistory(@Param('orderId') orderId: string) {
        const history = await this.voidReturnWorkflow.getOrderVoidReturnHistory(orderId);
        return {
            success: true,
            data: history,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Get a single return order by ID
     */
    @Get(':returnOrderId')
    @ApiOperation({ summary: 'Get a single return order by ID' })
    async getReturnOrder(@Param('returnOrderId') returnOrderId: string) {
        const returnOrder = await this.voidReturnWorkflow.getReturnOrder(returnOrderId);
        return {
            success: true,
            data: returnOrder,
            timestamp: new Date().toISOString(),
        };
    }

    // =====================================================
    // RETURN REASONS (LOOKUP)
    // =====================================================

    /**
     * Get available return reasons
     */
    @Get('lookup/reasons')
    @ApiOperation({ summary: 'Get available return/refund reasons' })
    getReturnReasons() {
        const reasons = Object.values(ReturnReason).map(reason => ({
            code: reason,
            label: this.formatReasonLabel(reason),
            category: this.getReasonCategory(reason),
        }));

        return {
            success: true,
            data: reasons,
            timestamp: new Date().toISOString(),
        };
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    private formatReasonLabel(reason: ReturnReason): string {
        const labels: Record<ReturnReason, string> = {
            [ReturnReason.DEFECTIVE]: 'Defective Product',
            [ReturnReason.DAMAGED]: 'Item Damaged',
            [ReturnReason.EXPIRED]: 'Item Expired',
            [ReturnReason.WRONG_ITEM]: 'Wrong Item Delivered',
            [ReturnReason.CUSTOMER_DISSATISFIED]: 'Customer Dissatisfied',
            [ReturnReason.CUSTOMER_CHANGE_OF_MIND]: 'Customer Changed Mind',
            [ReturnReason.TASTE_ISSUE]: 'Taste/Quality Issue',
            [ReturnReason.DELAYED_SERVICE]: 'Delayed Service',
            [ReturnReason.POOR_SERVICE]: 'Poor Service',
            [ReturnReason.WRONG_TABLE]: 'Served to Wrong Table',
            [ReturnReason.OVERCHARGED]: 'Customer Overcharged',
            [ReturnReason.DUPLICATE_CHARGE]: 'Duplicate Charge',
            [ReturnReason.OTHER]: 'Other Reason',
        };

        return labels[reason] || reason;
    }

    private getReasonCategory(reason: ReturnReason): string {
        const productReasons = [
            ReturnReason.DEFECTIVE,
            ReturnReason.DAMAGED,
            ReturnReason.EXPIRED,
            ReturnReason.TASTE_ISSUE,
        ];

        const orderReasons = [
            ReturnReason.WRONG_ITEM,
        ];

        const serviceReasons = [
            ReturnReason.DELAYED_SERVICE,
            ReturnReason.POOR_SERVICE,
            ReturnReason.WRONG_TABLE,
        ];

        const paymentReasons = [
            ReturnReason.OVERCHARGED,
            ReturnReason.DUPLICATE_CHARGE,
        ];

        if (productReasons.includes(reason)) return 'Product Issue';
        if (orderReasons.includes(reason)) return 'Order Issue';
        if (serviceReasons.includes(reason)) return 'Service';
        if (paymentReasons.includes(reason)) return 'Payment';

        return 'Customer Request';
    }
}
