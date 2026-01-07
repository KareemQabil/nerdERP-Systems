import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { OrderStatus, OrderType, SalesOrder } from '../entities/sales-order.entity';
import { OrderStateHistory } from '../entities/order-state-history.entity';
import { ReturnOrder, ReturnType, ReturnStatus, ReturnReason, ReturnedItem } from '../entities/return-order.entity';
import { OrderDiscount, DiscountType, DiscountMethod } from '../entities/order-discount.entity';
import { Payment, PaymentTransactionStatus, PaymentMethod } from '../entities/payment.entity';
import { Refund, RefundStatus, RefundReason } from '../entities/refund.entity';
import { OrderItem } from '../entities/order-item.entity';
import { User } from '../../users/entities/user.entity';
import { VoidOperationService } from './void-operation.service';
import { OrderStateMachineService, TransitionContext } from './order-state-machine.service';

/**
 * =============================================================================
 * VOID & RETURN WORKFLOW TYPES
 * =============================================================================
 */

export interface VoidRequestParams {
    orderId: string;
    voidReason: string;
    requestedBy: User;
    ipAddress?: string;
    deviceId?: string;
    storeId?: string;
}

export interface VoidApprovalParams {
    historyId: string;
    approved: boolean;
    approvedBy: User;
    rejectionReason?: string;
    ipAddress?: string;
    deviceId?: string;
}

export interface ReturnRequestParams {
    orderId: string;
    returnType: ReturnType;
    returnReason: string;
    returnedItems: Array<{
        orderItemId: string;
        productName: string;
        quantity: number;
        reason: string;
    }>;
    refundAmount?: number; // For partial returns
    requestedBy: User;
    ipAddress?: string;
    deviceId?: string;
    storeId?: string;
}

export interface ReturnApprovalParams {
    historyId: string;
    approved: boolean;
    approvedBy: User;
    refundMethod?: string; // How to refund (cash, original payment method, etc.)
    rejectionReason?: string;
    ipAddress?: string;
    deviceId?: string;
}

export interface PendingApprovalsResponse {
    voidRequests: Array<{
        historyId: string;
        orderNumber: string;
        orderType: OrderType;
        requestedBy: string;
        requestedAt: Date;
        voidReason: string;
        orderTotal: number;
    }>;
    returnRequests: Array<{
        historyId: string;
        orderNumber: string;
        orderType: OrderType;
        requestedBy: string;
        requestedAt: Date;
        returnReason: string;
        refundAmount: number;
    }>;
}

/**
 * =============================================================================
 * VOID & RETURN WORKFLOW SERVICE
 * =============================================================================
 *
 * Orchestrates void and return workflows with approval processes.
 *
 * This service coordinates:
 * - OrderStateMachineService for state transitions
 * - VoidOperationService for actual void operations
 * - ReturnOrder entity creation for audit trail
 * - Refund processing through PaymentService
 *
 * Void Workflow:
 * 1. Cashier initiates void request → VOID_REQUESTED
 * 2. Manager approves with PIN → VOID_APPROVED
 * 3. System executes void → VOID (inventory restored, refund processed)
 *
 * Return Workflow:
 * 1. Cashier initiates return request → RETURN_REQUESTED
 * 2. Manager approves with PIN → RETURN_APPROVED
 * 3. System processes refund → REFUNDED
 * 4. ReturnOrder entity created with linkage to original order
 *
 * @example
 * // Initiate void request
 * const result = await voidReturnWorkflow.initiateVoidRequest({
 *   orderId: 'order-uuid',
 *   voidReason: 'Customer changed mind',
 *   requestedBy: cashierUser,
 * });
 *
 * // Manager approves
 * const finalResult = await voidReturnWorkflow.processVoidApproval({
 *   historyId: result.history.id,
 *   approved: true,
 *   approvedBy: managerUser,
 * });
 */
@Injectable()
export class VoidReturnWorkflowService {
    private readonly logger = new Logger(VoidReturnWorkflowService.name);

    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(OrderStateHistory)
        private readonly historyRepo: Repository<OrderStateHistory>,
        @InjectRepository(ReturnOrder)
        private readonly returnOrderRepo: Repository<ReturnOrder>,
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
        @InjectRepository(Refund)
        private readonly refundRepo: Repository<Refund>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepo: Repository<OrderItem>,
        private readonly dataSource: DataSource,
        private readonly stateMachineService: OrderStateMachineService,
        private readonly voidOperationService: VoidOperationService,
    ) { }

    // =========================================================================
    // VOID WORKFLOW
    // =========================================================================

    /**
     * Initiate void request for an order
     * Transition: ANY_STATE → VOID_REQUESTED
     *
     * Requires manager approval before execution.
     */
    async initiateVoidRequest(params: VoidRequestParams): Promise<{
        history: OrderStateHistory;
        order: SalesOrder;
        requiresApproval: boolean;
    }> {
        // Fetch order with relations
        const order = await this.orderRepo.findOne({
            where: { id: params.orderId },
            relations: ['items', 'payments', 'table'],
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${params.orderId}`);
        }

        // Check if order can be voided
        if (order.status === OrderStatus.VOID) {
            throw new BadRequestException('Order is already voided');
        }

        if (order.status === OrderStatus.REFUNDED) {
            throw new BadRequestException('Cannot void a refunded order');
        }

        // Check if already requested
        const existingRequest = await this.historyRepo.findOne({
            where: {
                orderId: params.orderId,
                toState: OrderStatus.VOID_REQUESTED,
                approvalStatus: 'PENDING',
            },
        });

        if (existingRequest) {
            throw new BadRequestException('Void request already pending approval');
        }

        // Check if approval is required based on order state
        const requiresApproval = this.requiresApprovalForVoid(order);

        if (requiresApproval) {
            // Submit for approval
            const history = await this.stateMachineService.submitForApproval(
                params.orderId,
                OrderStatus.VOID_REQUESTED,
                {
                    order,
                    user: params.requestedBy,
                    reason: params.voidReason,
                    metadata: {
                        ipAddress: params.ipAddress,
                        deviceId: params.deviceId,
                        storeId: params.storeId,
                        workflowType: 'VOID_REQUEST',
                    },
                    voidData: {
                        voidReason: params.voidReason,
                    },
                },
            );

            this.logger.log(`Void request initiated for order ${order.orderNumber} by ${params.requestedBy.firstName}`);

            return {
                history,
                order,
                requiresApproval: true,
            };
        } else {
            // No approval needed, execute void directly
            const result = await this.executeVoid(order, params);
            return {
                history: result.history,
                order: result.order,
                requiresApproval: false,
            };
        }
    }

    /**
     * Process void approval (approve or reject)
     * Transition: VOID_REQUESTED → VOID_APPROVED (if approved)
     * Transition: VOID_REQUESTED → [reject, stay in current state]
     */
    async processVoidApproval(params: VoidApprovalParams): Promise<{
        history: OrderStateHistory;
        order: SalesOrder | null;
        executed: boolean;
    }> {
        // Pre-fetch history to get the order for TransitionContext
        const existingHistory = await this.historyRepo.findOne({
            where: { id: params.historyId },
            relations: ['order', 'order.items', 'order.payments'],
        });

        if (!existingHistory || !existingHistory.order) {
            throw new NotFoundException(`History record not found: ${params.historyId}`);
        }

        const result = await this.stateMachineService.respondToApproval(
            params.historyId,
            params.approved,
            {
                order: existingHistory.order,
                user: params.approvedBy,
                reason: params.rejectionReason,
                metadata: {
                    ipAddress: params.ipAddress,
                    deviceId: params.deviceId,
                    workflowType: 'VOID_APPROVAL',
                },
            },
        );

        if (params.approved && result.order) {
            // Transition to VOID_APPROVED then execute void
            const approvalHistory = await this.stateMachineService.transition(
                result.order.id,
                OrderStatus.VOID_APPROVED,
                {
                    order: result.order,
                    user: params.approvedBy,
                    reason: 'Manager approved void request',
                    metadata: {
                        approvedBy: params.approvedBy.id,
                        ipAddress: params.ipAddress,
                        deviceId: params.deviceId,
                    },
                },
            );

            // Execute the actual void
            await this.executeVoid(result.order, {
                orderId: result.order.id,
                voidReason: result.history.voidReason || 'Void approved',
                requestedBy: params.approvedBy,
                ipAddress: params.ipAddress,
                deviceId: params.deviceId,
                storeId: existingHistory.order.registerSession?.storeId || 'default',
            });

            this.logger.log(`Void approved and executed for order ${result.order.orderNumber}`);

            return {
                history: approvalHistory.history,
                order: result.order,
                executed: true,
            };
        }

        this.logger.log(`Void request rejected for history ${params.historyId}`);

        return {
            history: result.history,
            order: result.order,
            executed: false,
        };
    }

    /**
     * Execute the actual void operation
     * Uses VoidOperationService for the actual work
     */
    private async executeVoid(order: SalesOrder, params: {
        orderId: string;
        voidReason: string;
        requestedBy: User;
        ipAddress?: string;
        deviceId?: string;
        storeId?: string;
    }): Promise<{ history: OrderStateHistory; order: SalesOrder }> {
        // Use VoidOperationService for actual void
        const voidedOrder = await this.voidOperationService.voidOrder({
            orderId: params.orderId,
            reason: params.voidReason,
            requestedByUserId: params.requestedBy.id,
            requestedByUserName: `${params.requestedBy.firstName} ${params.requestedBy.lastName}`,
            authorizingUserId: params.requestedBy.id, // Self-authorized if no approval needed
            authorizingUserName: `${params.requestedBy.firstName} ${params.requestedBy.lastName}`,
            ipAddress: params.ipAddress,
            deviceId: params.deviceId,
            storeId: params.storeId,
        });

        // Transition to VOID state
        const result = await this.stateMachineService.transition(
            params.orderId,
            OrderStatus.VOID,
            {
                order: voidedOrder,
                user: params.requestedBy,
                reason: params.voidReason,
                metadata: {
                    ipAddress: params.ipAddress,
                    deviceId: params.deviceId,
                },
            },
        );

        return {
            history: result.history,
            order: voidedOrder,
        };
    }

    // =========================================================================
    // RETURN WORKFLOW
    // =========================================================================

    /**
     * Initiate return request for a completed order
     * Transition: COMPLETED → RETURN_REQUESTED
     *
     * Requires manager approval before refund processing.
     */
    async initiateReturnRequest(params: ReturnRequestParams): Promise<{
        history: OrderStateHistory;
        order: SalesOrder;
        requiresApproval: boolean;
    }> {
        // Fetch order with relations
        const order = await this.orderRepo.findOne({
            where: { id: params.orderId },
            relations: ['items', 'payments', 'table'],
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${params.orderId}`);
        }

        // Check if order can be returned
        if (order.status !== OrderStatus.COMPLETED) {
            throw new BadRequestException('Only completed orders can be returned');
        }

        // Check if already requested
        const existingRequest = await this.historyRepo.findOne({
            where: {
                orderId: params.orderId,
                toState: OrderStatus.RETURN_REQUESTED,
                approvalStatus: 'PENDING',
            },
        });

        if (existingRequest) {
            throw new BadRequestException('Return request already pending approval');
        }

        // Validate returned items
        const orderItemIds = order.items.map(item => item.id);
        const invalidItems = params.returnedItems.filter(
            ri => !orderItemIds.includes(ri.orderItemId)
        );

        if (invalidItems.length > 0) {
            throw new BadRequestException('Some items do not belong to this order');
        }

        // Calculate refund amount if not provided
        let refundAmount = params.refundAmount;
        if (!refundAmount) {
            refundAmount = this.calculateReturnRefundAmount(order, params.returnedItems);
        }

        // Submit for approval
        const history = await this.stateMachineService.submitForApproval(
            params.orderId,
            OrderStatus.RETURN_REQUESTED,
            {
                order,
                user: params.requestedBy,
                reason: params.returnReason,
                metadata: {
                    ipAddress: params.ipAddress,
                    deviceId: params.deviceId,
                    storeId: params.storeId,
                    workflowType: 'RETURN_REQUEST',
                    returnType: params.returnType,
                    returnedItems: params.returnedItems,
                    refundAmount,
                },
                returnData: {
                    returnReason: params.returnReason,
                    returnedItems: params.returnedItems,
                },
            },
        );

        this.logger.log(`Return request initiated for order ${order.orderNumber} by ${params.requestedBy.firstName}`);

        return {
            history,
            order,
            requiresApproval: true,
        };
    }

    /**
     * Process return approval (approve or reject)
     * Transition: RETURN_REQUESTED → RETURN_APPROVED → REFUNDED (if approved)
     */
    async processReturnApproval(params: ReturnApprovalParams): Promise<{
        history: OrderStateHistory;
        order: SalesOrder | null;
        returnOrder?: ReturnOrder;
        executed: boolean;
    }> {
        // Fetch history record to get return details
        const historyRecord = await this.historyRepo.findOne({
            where: { id: params.historyId },
            relations: ['order'],
        });

        if (!historyRecord) {
            throw new NotFoundException(`History record not found: ${params.historyId}`);
        }

        const result = await this.stateMachineService.respondToApproval(
            params.historyId,
            params.approved,
            {
                order: historyRecord.order,
                user: params.approvedBy,
                reason: params.rejectionReason,
                metadata: {
                    ipAddress: params.ipAddress,
                    deviceId: params.deviceId,
                    workflowType: 'RETURN_APPROVAL',
                },
            },
        );

        if (params.approved && result.order) {
            // Transition to RETURN_APPROVED
            await this.stateMachineService.transition(
                result.order.id,
                OrderStatus.RETURN_APPROVED,
                {
                    order: result.order,
                    user: params.approvedBy,
                    reason: 'Manager approved return request',
                    metadata: {
                        approvedBy: params.approvedBy.id,
                        ipAddress: params.ipAddress,
                        deviceId: params.deviceId,
                    },
                },
            );

            // Execute return and create ReturnOrder entity
            const returnOrder = await this.executeReturn(
                result.order,
                historyRecord,
                params.approvedBy,
                params.refundMethod,
                params.ipAddress,
                params.deviceId,
            );

            this.logger.log(`Return approved and processed for order ${result.order.orderNumber}`);

            return {
                history: result.history,
                order: result.order,
                returnOrder,
                executed: true,
            };
        }

        this.logger.log(`Return request rejected for history ${params.historyId}`);

        return {
            history: result.history,
            order: result.order,
            executed: false,
        };
    }

    /**
     * Execute the actual return operation
     * Creates ReturnOrder entity and processes refunds
     */
    private async executeReturn(
        order: SalesOrder,
        requestHistory: OrderStateHistory,
        approvedBy: User,
        refundMethod?: string,
        ipAddress?: string,
        deviceId?: string,
    ): Promise<ReturnOrder> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const returnTypeValue = requestHistory.metadata?.returnType || ReturnType.FULL_RETURN;
            const returnedItemsData = (requestHistory.returnedItems || []) as ReturnedItem[];
            const refundAmountValue = requestHistory.metadata?.refundAmount || order.totalNet;
            const returnReasonValue = requestHistory.returnReason as ReturnReason || ReturnReason.OTHER;

            // Create ReturnOrder entity
            const returnOrder = queryRunner.manager.create(ReturnOrder, {
                originalOrder: order,
                originalOrderNumber: order.orderNumber,
                returnType: returnTypeValue,
                status: ReturnStatus.APPROVED,
                returnedItems: returnedItemsData,
                itemsCount: returnedItemsData.length,
                refundAmount: refundAmountValue,
                returnReason: returnReasonValue,
                requestedByUserId: requestHistory.initiatedByUserId,
                requestedByUserName: requestHistory.initiatedByUserName,
                approvedByUserId: approvedBy.id,
                approvedByUserName: `${approvedBy.firstName} ${approvedBy.lastName}`,
                approvedAt: new Date(),
                storeId: order.registerSession?.storeId || 'default',
            });

            const savedReturnOrder = await queryRunner.manager.save(returnOrder);

            // Process refunds for each payment
            const payments = await queryRunner.manager.find(Payment, {
                where: { order: { id: order.id }, status: PaymentTransactionStatus.APPROVED },
            });

            for (const payment of payments) {
                await this.processReturnRefund(
                    queryRunner,
                    payment,
                    order,
                    savedReturnOrder,
                    approvedBy,
                    refundAmountValue / payments.length, // Split refund across payments
                    ipAddress,
                    deviceId,
                );
            }

            // Update order status
            order.status = OrderStatus.REFUNDED;
            await queryRunner.manager.save(order);

            // Update return order status
            savedReturnOrder.status = ReturnStatus.COMPLETED;
            savedReturnOrder.completedAt = new Date();
            await queryRunner.manager.save(savedReturnOrder);

            await queryRunner.commitTransaction();

            this.logger.log(`Return processed for order ${order.orderNumber}, return order ID: ${savedReturnOrder.id}`);

            return savedReturnOrder;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error executing return: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Process refund for a single payment during return
     */
    private async processReturnRefund(
        queryRunner: any,
        payment: Payment,
        order: SalesOrder,
        returnOrder: ReturnOrder,
        approvedBy: User,
        refundAmount: number,
        ipAddress?: string,
        deviceId?: string,
    ): Promise<void> {
        // Create Refund entity
        const refund = queryRunner.manager.create(Refund, {
            order,
            returnOrder,
            payment,
            refundNumber: `REF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            status: RefundStatus.COMPLETED,
            refundAmount,
            refundReason: returnOrder.returnReason,
            requestedByUserId: returnOrder.requestedByUserId,
            requestedByUserName: returnOrder.requestedByUserName,
            approvedByUserId: approvedBy.id,
            approvedByUserName: `${approvedBy.firstName} ${approvedBy.lastName}`,
            originalPaymentMethod: payment.method,
            processedAt: new Date(),
            metadata: {
                ipAddress,
                deviceId,
                returnOrderId: returnOrder.id,
            },
        });

        await queryRunner.manager.save(refund);

        // Update payment status
        payment.status = PaymentTransactionStatus.REFUNDED;
        await queryRunner.manager.save(payment);

        // TODO: Integrate with payment gateway for actual refund
        // if (payment.method !== PaymentMethod.CASH) {
        //     await this.paymentGatewayService.refundPayment({ ... });
        // }
    }

    // =========================================================================
    // APPROVAL DASHBOARD
    // =========================================================================

    /**
     * Get pending approvals for manager dashboard
     */
    async getPendingApprovals(storeId?: string): Promise<PendingApprovalsResponse> {
        const voidRequestsHistory = await this.historyRepo.find({
            where: {
                toState: In([OrderStatus.VOID_REQUESTED, OrderStatus.VOID_APPROVED]),
                approvalStatus: 'PENDING',
                ...(storeId && { order: { storeId } as any }),
            },
            relations: ['order'],
            order: { createdAt: 'DESC' },
        });

        const returnRequestsHistory = await this.historyRepo.find({
            where: {
                toState: In([OrderStatus.RETURN_REQUESTED, OrderStatus.RETURN_APPROVED]),
                approvalStatus: 'PENDING',
                ...(storeId && { order: { storeId } as any }),
            },
            relations: ['order'],
            order: { createdAt: 'DESC' },
        });

        const voidRequests = voidRequestsHistory.map(h => ({
            historyId: h.id,
            orderNumber: h.order?.orderNumber || 'N/A',
            orderType: h.order?.orderType || OrderType.DINE_IN,
            requestedBy: h.initiatedByUserName,
            requestedAt: h.approvalRequestedAt || h.createdAt,
            voidReason: h.voidReason || 'Not specified',
            orderTotal: h.order?.totalNet || 0,
        }));

        const returnRequests = returnRequestsHistory.map(h => ({
            historyId: h.id,
            orderNumber: h.order?.orderNumber || 'N/A',
            orderType: h.order?.orderType || OrderType.DINE_IN,
            requestedBy: h.initiatedByUserName,
            requestedAt: h.approvalRequestedAt || h.createdAt,
            returnReason: h.returnReason || 'Not specified',
            refundAmount: h.metadata?.refundAmount || 0,
        }));

        return {
            voidRequests,
            returnRequests,
        };
    }

    /**
     * Get void/return history for an order
     */
    async getOrderVoidReturnHistory(orderId: string): Promise<{
        voidHistory: OrderStateHistory[];
        returnHistory: OrderStateHistory[];
        returnOrders: ReturnOrder[];
    }> {
        const [voidHistory, returnHistory, returnOrders] = await Promise.all([
            this.historyRepo.find({
                where: {
                    orderId,
                    toState: In([OrderStatus.VOID_REQUESTED, OrderStatus.VOID_APPROVED, OrderStatus.VOID]),
                },
                order: { transitionTimestamp: 'ASC' },
            }),
            this.historyRepo.find({
                where: {
                    orderId,
                    toState: In([OrderStatus.RETURN_REQUESTED, OrderStatus.RETURN_APPROVED, OrderStatus.REFUNDED]),
                },
                order: { transitionTimestamp: 'ASC' },
            }),
            this.returnOrderRepo.find({
                where: { originalOrderId: orderId },
            }),
        ]);

        return {
            voidHistory,
            returnHistory,
            returnOrders,
        };
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Check if void requires approval based on order state
     */
    private requiresApprovalForVoid(order: SalesOrder): boolean {
        // Always require approval for paid orders
        if (order.paymentStatus === 'PAID' || order.paymentStatus === 'PARTIAL') {
            return true;
        }

        // Require approval for orders already sent to kitchen
        if (order.status === OrderStatus.FIRED_TO_KITCHEN ||
            order.status === OrderStatus.PREPARING ||
            order.status === OrderStatus.READY) {
            return true;
        }

        // No approval needed for draft/saved orders with no payment
        return false;
    }

    /**
     * Calculate refund amount for returned items
     */
    private calculateReturnRefundAmount(
        order: SalesOrder,
        returnedItems: Array<{
            orderItemId: string;
            productName: string;
            quantity: number;
            reason: string;
        }>,
    ): number {
        let refundAmount = 0;

        for (const returnedItem of returnedItems) {
            const orderItem = order.items.find(item => item.id === returnedItem.orderItemId);
            if (orderItem) {
                // Prorate refund based on quantity returned
                const proration = returnedItem.quantity / orderItem.quantity;
                refundAmount += orderItem.total * proration;
            }
        }

        // Add applicable taxes and service charges (prorated)
        const totalOrderValue = order.totalNet;
        const itemValueRatio = refundAmount / (order.totalGross || 1);
        refundAmount = totalOrderValue * itemValueRatio;

        return Math.round(refundAmount * 100) / 100; // Round to 2 decimals
    }

    /**
     * Get return order by ID
     */
    async getReturnOrder(returnOrderId: string): Promise<ReturnOrder> {
        const returnOrder = await this.returnOrderRepo.findOne({
            where: { id: returnOrderId },
            relations: ['originalOrder', 'originalOrder.items'],
        });

        if (!returnOrder) {
            throw new NotFoundException(`Return order not found: ${returnOrderId}`);
        }

        return returnOrder;
    }

    /**
     * Get all return orders for an original order
     */
    async getOrderReturnOrders(originalOrderId: string): Promise<ReturnOrder[]> {
        return await this.returnOrderRepo.find({
            where: { originalOrderId },
            order: { createdAt: 'DESC' },
        });
    }
}
