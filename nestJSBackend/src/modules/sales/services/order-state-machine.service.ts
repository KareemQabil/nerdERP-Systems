import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrderStatus, OrderType, SalesOrder } from '../entities/sales-order.entity';
import { OrderStateHistory } from '../entities/order-state-history.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { StoreConfigurationService } from '../../organization/services/store-configuration.service';
/**
 * =============================================================================
 * STATE MACHINE TYPES
 * =============================================================================
 */

export interface StateTransitionRule {
    fromState: OrderStatus;
    toState: OrderStatus;
    allowedPaymentStatuses?: string[];
    requiredFields?: string[];
    autoTrigger?: AutoTriggerCondition;
    sideEffects?: SideEffect[];
    isReversible?: boolean;
}

export interface AutoTriggerCondition {
    eventType: string;
    checkCondition?: (context: TransitionContext) => boolean;
}

export interface SideEffect {
    type: 'PRINT_KOT' | 'PRINT_CHECK' | 'UPDATE_TABLE' | 'DEDUCT_INVENTORY' |
    'NOTIFY_KITCHEN' | 'NOTIFY_WAITSTAFF' | 'UPDATE_REGISTER' | 'RESTORE_INVENTORY';
    params?: Record<string, any>;
}

export interface TransitionContext {
    order: SalesOrder;
    user: User;
    reason?: string;
    metadata?: Record<string, any>;
    paymentData?: {
        method?: string;
        amount?: number;
        reference?: string;
    };
    voidData?: {
        voidReason: string;
        authorizedBy?: string;
    };
    returnData?: {
        returnReason: string;
        returnedItems?: any[];
    };
}

export interface PermissionRequirement {
    allowedRoles?: UserRole[];
    requiresManagerApproval?: boolean;
    requiresPinVerification?: boolean;
    allowedToBypassRoles?: UserRole[];
    pinThreshold?: number;
}

export interface StateMachineConfig {
    orderType: OrderType;
    allowedTransitions: StateTransitionRule[];
    defaultInitialStates: {
        hasKitchenItems: OrderStatus;
        noKitchenItems: OrderStatus;
        prePaid: OrderStatus;
    };
    autoTransitions: AutoTransitionConfig[];
    permissionRequirements: Record<string, PermissionRequirement>;
}

export interface AutoTransitionConfig {
    trigger: string;
    fromState: OrderStatus;
    toState: OrderStatus;
    delaySeconds?: number;
}

export interface AllowedTransition {
    state: OrderStatus;
    label: string;
    labelAr?: string;
    description: string;
    requiresApproval: boolean;
    requiresPin: boolean;
    allowedRoles: UserRole[];
}

export interface AllowedTransitionsResponse {
    currentState: OrderStatus;
    allowedTransitions: AllowedTransition[];
    canVoid: boolean;
    canReturn: boolean;
}

/**
 * =============================================================================
 * ORDER STATE MACHINE SERVICE
 * =============================================================================
 *
 * Core service for managing order state transitions with strict validation,
 * approval workflows, and side effects execution.
 *
 * Features:
 * - Strict state transition validation
 * - Permission-based authorization
 * - Approval workflow tracking
 * - Side effects execution (KOT printing, inventory deduction, etc.)
 * - Complete audit trail
 * - Auto-transition support
 *
 * State Machine Config is stored in StoreConfiguration with key 'pos.state_machine_config'
 */
@Injectable()
export class OrderStateMachineService {
    private readonly logger = new Logger(OrderStateMachineService.name);

    // State machine configurations (default fallback)
    private readonly stateMachineConfigs: Partial<Record<OrderType, StateMachineConfig>>;

    constructor(
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        @InjectRepository(OrderStateHistory)
        private readonly historyRepo: Repository<OrderStateHistory>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly dataSource: DataSource,
        private readonly storeConfigService: StoreConfigurationService,
    ) {
        // Initialize default state machine configs
        this.stateMachineConfigs = this.getDefaultStateMachineConfigs();
    }

    /**
     * Transition order to a new state
     * Main method for all state transitions
     */
    async transition(
        orderId: string,
        toState: OrderStatus,
        context: TransitionContext,
    ): Promise<{ order: SalesOrder; history: OrderStateHistory }> {
        // Fetch order with relations
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
            relations: ['items', 'table', 'payments', 'stateHistory'],
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        // Validate transition
        this.validateTransition(order, toState, context);

        // Check permissions
        await this.checkPermissions(order, toState, context);

        // Execute side effects (before state change)
        const sideEffectResults = await this.executeSideEffects(
            order,
            order.status,
            toState,
            context,
        );

        // Get transition config for history
        const transitionConfig = this.getTransitionConfig(order, toState);

        // Update order status
        order.status = toState;
        await this.orderRepo.save(order);

        // Create state history record
        const history = await this.createHistoryRecord(
            order,
            order.status, // Will be overwritten in createHistoryRecord
            toState,
            context,
            sideEffectResults,
        );

        // Emit events for WebSocket (if gateway is available)
        this.emitStateChangeEvent(order, toState);

        this.logger.log(`Order ${order.orderNumber}: ${order.status} → ${toState}`);

        return { order, history };
    }

    /**
     * Get allowed transitions for current order state
     */
    async getAllowedTransitions(
        orderId: string,
        user: User,
    ): Promise<AllowedTransitionsResponse> {
        const order = await this.orderRepo.findOne({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        const config = this.getStateMachineConfig(order.orderType);
        const currentState = order.status;

        // Get all valid transitions from current state
        const validTransitions = config.allowedTransitions.filter(
            t => t.fromState === currentState || currentState === OrderStatus.DRAFT && t.fromState === null
        );

        // Build allowed transitions response
        const allowedTransitions: AllowedTransition[] = validTransitions.map(t => {
            const permKey = `${currentState}→${t.toState}`;
            const perm = config.permissionRequirements[permKey] || {
                allowedRoles: [UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN],
            };

            return {
                state: t.toState,
                label: this.getStateLabel(t.toState),
                labelAr: this.getStateLabelAr(t.toState),
                description: this.getStateDescription(t.toState),
                requiresApproval: perm.requiresManagerApproval || false,
                requiresPin: perm.requiresPinVerification || false,
                allowedRoles: perm.allowedRoles || [],
            };
        });

        return {
            currentState,
            allowedTransitions,
            canVoid: this.canVoidOrder(order),
            canReturn: this.canReturnOrder(order),
        };
    }

    /**
     * Submit state change for approval
     */
    async submitForApproval(
        orderId: string,
        toState: OrderStatus,
        context: TransitionContext,
    ): Promise<OrderStateHistory> {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });

        if (!order) {
            throw new NotFoundException(`Order not found: ${orderId}`);
        }

        // Check if approval is required
        const permKey = `${order.status}→${toState}`;
        const config = this.getStateMachineConfig(order.orderType);
        const perm = config.permissionRequirements[permKey];

        if (!perm?.requiresManagerApproval) {
            // No approval needed, execute directly
            const result = await this.transition(orderId, toState, context);
            return result.history;
        }

        // Create pending approval history record
        const history = this.historyRepo.create({
            order,
            orderId: order.id,
            fromState: order.status,
            toState,
            transitionType: 'APPROVAL',
            requiresApproval: true,
            approvalStatus: 'PENDING',
            approvalRequestedAt: new Date(),
            initiatedByUserId: context.user.id,
            initiatedByUserName: context.user.firstName + ' ' + context.user.lastName,
            transitionReason: context.reason,
            metadata: context.metadata,
            transitionTimestamp: new Date(),
        });

        await this.historyRepo.save(history);

        // Notify managers (via WebSocket if available)
        this.emitApprovalRequestedEvent(order, toState, context.user);

        return history;
    }

    /**
     * Respond to pending approval
     */
    async respondToApproval(
        historyId: string,
        approved: boolean,
        context: TransitionContext,
    ): Promise<{ history: OrderStateHistory; order: SalesOrder | null }> {
        const history = await this.historyRepo.findOne({
            where: { id: historyId },
            relations: ['order'],
        });

        if (!history) {
            throw new NotFoundException(`History record not found: ${historyId}`);
        }

        if (history.approvalStatus !== 'PENDING') {
            throw new BadRequestException('Approval request already processed');
        }

        if (!history.requiresApproval) {
            throw new BadRequestException('This transition does not require approval');
        }

        if (approved) {
            // Approve and execute transition
            history.approvalStatus = 'APPROVED';
            history.approvedByUserId = context.user.id;
            history.approvedByUserName = context.user.firstName + ' ' + context.user.lastName;
            history.approvalRespondedAt = new Date();

            await this.historyRepo.save(history);

            // Execute the actual transition
            const result = await this.transition(
                history.orderId,
                history.toState,
                { ...context, metadata: { ...context.metadata, approvedBy: context.user.id } },
            );

            return { history, order: result.order };
        } else {
            // Reject approval
            history.approvalStatus = 'REJECTED';
            history.rejectionReason = context.reason || 'Approval rejected';
            history.approvalRespondedAt = new Date();

            await this.historyRepo.save(history);

            return { history, order: history.order };
        }
    }

    /**
     * Get state transition history for an order
     */
    async getStateHistory(orderId: string): Promise<OrderStateHistory[]> {
        return await this.historyRepo.find({
            where: { orderId },
            order: { transitionTimestamp: 'ASC' },
        });
    }

    /**
     * Auto-transition based on events
     * Called by kitchen, payment, or other services
     */
    async autoTransition(
        orderId: string,
        trigger: string,
        context: TransitionContext,
    ): Promise<void> {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });

        if (!order) {
            this.logger.warn(`Order not found for auto-transition: ${orderId}`);
            return;
        }

        const config = this.getStateMachineConfig(order.orderType);
        const autoTransition = config.autoTransitions.find(
            t => t.trigger === trigger && t.fromState === order.status
        );

        if (!autoTransition) {
            return;
        }

        // Check condition
        if (autoTransition.fromState !== order.status) {
            return;
        }

        // Execute transition after delay (if specified)
        if (autoTransition.delaySeconds && autoTransition.delaySeconds > 0) {
            setTimeout(async () => {
                await this.transition(orderId, autoTransition.toState, {
                    ...context,
                    metadata: { ...context.metadata, autoTrigger: true },
                });
            }, autoTransition.delaySeconds * 1000);
        } else {
            await this.transition(orderId, autoTransition.toState, {
                ...context,
                metadata: { ...context.metadata, autoTrigger: true },
            });
        }
    }

    /**
     * Check if transition is valid
     */
    private validateTransition(
        order: SalesOrder,
        toState: OrderStatus,
        context: TransitionContext,
    ): void {
        // Cannot transition to same state
        if (order.status === toState) {
            throw new BadRequestException(`Order is already in ${toState} state`);
        }

        // Check if transition is allowed
        const config = this.getStateMachineConfig(order.orderType);
        const transition = config.allowedTransitions.find(
            t => t.fromState === order.status && t.toState === toState
        );

        if (!transition) {
            throw new BadRequestException(
                `Invalid transition: ${order.status} → ${toState}`
            );
        }

        // Check required fields
        if (transition.requiredFields) {
            for (const field of transition.requiredFields) {
                const fieldValue = (order as any)[field];
                if (!fieldValue) {
                    throw new BadRequestException(`Required field missing: ${field}`);
                }
            }
        }

        // Check payment status compatibility
        if (transition.allowedPaymentStatuses) {
            if (!transition.allowedPaymentStatuses.includes(order.paymentStatus)) {
                throw new BadRequestException(
                    `Payment status must be one of: ${transition.allowedPaymentStatuses.join(', ')}`
                );
            }
        }
    }

    /**
     * Check permissions for transition
     */
    private async checkPermissions(
        order: SalesOrder,
        toState: OrderStatus,
        context: TransitionContext,
    ): Promise<void> {
        const permKey = `${order.status}→${toState}`;
        const config = this.getStateMachineConfig(order.orderType);
        const perm = config.permissionRequirements[permKey];

        if (!perm) {
            // No specific permissions required
            return;
        }

        // Check user role
        if (perm.allowedRoles && perm.allowedRoles.length > 0) {
            if (!perm.allowedRoles.includes(context.user.role as unknown as UserRole)) {
                throw new ForbiddenException(
                    `Transition requires one of roles: ${perm.allowedRoles.join(', ')}`
                );
            }
        }

        // Check PIN verification
        if (perm.requiresPinVerification) {
            const threshold = perm.pinThreshold || 0;
            // PIN verification should be done before calling this method
            // This is a placeholder for the actual verification
            // In production, verify the PIN was already checked
            if (!context.metadata?.pinVerified) {
                throw new ForbiddenException('PIN verification required');
            }
        }

        // Check manager approval
        if (perm.requiresManagerApproval) {
            if (!context.metadata?.approvedBy) {
                throw new ForbiddenException('Manager approval required');
            }
        }

        // Check if user can bypass
        if (perm.allowedToBypassRoles && perm.allowedToBypassRoles.includes(context.user.role as unknown as UserRole)) {
            return; // User can bypass restrictions
        }
    }

    /**
     * Execute side effects for transition
     */
    private async executeSideEffects(
        order: SalesOrder,
        fromState: OrderStatus,
        toState: OrderStatus,
        context: TransitionContext,
    ): Promise<Array<{ type: string; status: 'SUCCESS' | 'FAILED' | 'SKIPPED'; errorMessage?: string }>> {
        const transition = this.getTransitionConfig(order, toState);
        const results: Array<{ type: string; status: 'SUCCESS' | 'FAILED' | 'SKIPPED'; errorMessage?: string }> = [];

        if (!transition.sideEffects) {
            return results;
        }

        for (const sideEffect of transition.sideEffects) {
            try {
                switch (sideEffect.type) {
                    case 'PRINT_KOT':
                        await this.printKOT(order, sideEffect.params);
                        results.push({ type: 'PRINT_KOT', status: 'SUCCESS' });
                        break;

                    case 'PRINT_CHECK':
                        await this.printCheck(order, sideEffect.params);
                        results.push({ type: 'PRINT_CHECK', status: 'SUCCESS' });
                        break;

                    case 'UPDATE_TABLE':
                        await this.updateTable(order, sideEffect.params);
                        results.push({ type: 'UPDATE_TABLE', status: 'SUCCESS' });
                        break;

                    case 'DEDUCT_INVENTORY':
                        await this.deductInventory(order);
                        results.push({ type: 'DEDUCT_INVENTORY', status: 'SUCCESS' });
                        break;

                    case 'RESTORE_INVENTORY':
                        await this.restoreInventory(order);
                        results.push({ type: 'RESTORE_INVENTORY', status: 'SUCCESS' });
                        break;

                    case 'NOTIFY_KITCHEN':
                        await this.notifyKitchen(order, sideEffect.params);
                        results.push({ type: 'NOTIFY_KITCHEN', status: 'SUCCESS' });
                        break;

                    case 'NOTIFY_WAITSTAFF':
                        await this.notifyWaitstaff(order, sideEffect.params);
                        results.push({ type: 'NOTIFY_WAITSTAFF', status: 'SUCCESS' });
                        break;

                    default:
                        results.push({ type: sideEffect.type, status: 'SKIPPED' });
                }
            } catch (error) {
                results.push({ type: sideEffect.type, status: 'FAILED', errorMessage: error.message });
            }
        }

        return results;
    }

    /**
     * Get state machine configuration for order type
     */
    private getStateMachineConfig(orderType: OrderType): StateMachineConfig {
        const config = this.stateMachineConfigs[orderType] || this.stateMachineConfigs[OrderType.DINE_IN];
        if (!config) {
            throw new Error(`No state machine config found for order type: ${orderType}`);
        }
        return config;
    }

    /**
     * Get transition configuration
     */
    private getTransitionConfig(order: SalesOrder, toState: OrderStatus): StateTransitionRule {
        const config = this.getStateMachineConfig(order.orderType);
        return config.allowedTransitions.find(
            t => t.fromState === order.status && t.toState === toState
        ) || {} as StateTransitionRule;
    }

    /**
     * Create state history record
     */
    private async createHistoryRecord(
        order: SalesOrder,
        fromState: OrderStatus,
        toState: OrderStatus,
        context: TransitionContext,
        sideEffectResults: any[],
    ): Promise<OrderStateHistory> {
        const history = this.historyRepo.create({
            orderId: order.id,
            fromState,
            toState,
            transitionType: context.metadata?.autoTrigger ? 'AUTOMATIC' : 'MANUAL',
            initiatedByUserId: context.user.id,
            initiatedByUserName: context.user.firstName + ' ' + context.user.lastName,
            transitionReason: context.reason,
            customerFacingNote: context.metadata?.customerNote,
            notes: context.metadata?.notes,
            sideEffects: sideEffectResults,
            financialSnapshot: {
                totalGross: order.totalGross,
                totalTax: order.totalTax,
                totalNet: order.totalNet,
                paymentStatus: order.paymentStatus,
                amountPaid: order.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
                amountDue: order.totalNet,
            },
            paymentData: context.paymentData ? {
                paymentMethod: context.paymentData.method,
                paymentAmount: context.paymentData.amount,
                paymentReference: context.paymentData.reference,
            } : undefined,
            voidReason: context.voidData?.voidReason,
            returnReason: context.returnData?.returnReason,
            returnedItems: context.returnData?.returnedItems,
            metadata: context.metadata,
            deviceId: context.metadata?.deviceId,
            ipAddress: context.metadata?.ipAddress,
            transitionTimestamp: new Date(),
        } as any);

        return await this.historyRepo.save(history) as unknown as OrderStateHistory;
    }

    /**
     * Check if order can be voided
     */
    private canVoidOrder(order: SalesOrder): boolean {
        const terminalStates = [OrderStatus.COMPLETED, OrderStatus.VOID, OrderStatus.REFUNDED];
        return !terminalStates.includes(order.status);
    }

    /**
     * Check if order can be returned
     */
    private canReturnOrder(order: SalesOrder): boolean {
        return order.status === OrderStatus.COMPLETED;
    }

    /**
     * Get state label for display
     */
    private getStateLabel(state: OrderStatus): string {
        const labels: Partial<Record<OrderStatus, string>> = {
            [OrderStatus.DRAFT]: 'Draft',
            [OrderStatus.SAVED]: 'Saved',
            [OrderStatus.FIRED_TO_KITCHEN]: 'Sent to Kitchen',
            [OrderStatus.PREPARING]: 'Preparing',
            [OrderStatus.READY]: 'Ready',
            [OrderStatus.SERVED]: 'Served',
            [OrderStatus.PAYMENT_PENDING]: 'Payment Pending',
            [OrderStatus.PAYMENT_PROCESSING]: 'Payment Processing',
            [OrderStatus.PAID]: 'Paid',
            [OrderStatus.PARTIALLY_PAID]: 'Partially Paid',
            [OrderStatus.COMPLETED]: 'Completed',
            [OrderStatus.VOID]: 'Void',
            [OrderStatus.VOID_REQUESTED]: 'Void Requested',
            [OrderStatus.VOID_APPROVED]: 'Void Approved',
            [OrderStatus.RETURN_REQUESTED]: 'Return Requested',
            [OrderStatus.RETURN_APPROVED]: 'Return Approved',
            [OrderStatus.REFUNDED]: 'Refunded',
            [OrderStatus.RECEIVED_FROM_AGGREGATOR]: 'Received from Aggregator',
            [OrderStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
            [OrderStatus.AWAITING_PICKUP]: 'Awaiting Pickup',
            [OrderStatus.PENDING]: 'Pending',
        };
        return labels[state] || state;
    }

    /**
     * Get state Arabic label
     */
    private getStateLabelAr(state: OrderStatus): string {
        const labels: Partial<Record<OrderStatus, string>> = {
            [OrderStatus.DRAFT]: 'مسودة',
            [OrderStatus.SAVED]: 'محفوظة',
            [OrderStatus.FIRED_TO_KITCHEN]: 'أرسلت للمطبخ',
            [OrderStatus.PREPARING]: 'قيد التحضير',
            [OrderStatus.READY]: 'جاهزة',
            [OrderStatus.SERVED]: 'مقدمة',
            [OrderStatus.PAYMENT_PENDING]: 'بانتظار الدفع',
            [OrderStatus.PAYMENT_PROCESSING]: 'جاري الدفع',
            [OrderStatus.PAID]: 'مدفوع',
            [OrderStatus.PARTIALLY_PAID]: 'مدفوع جزئياً',
            [OrderStatus.COMPLETED]: 'مكتملة',
            [OrderStatus.VOID]: 'ملغاة',
            [OrderStatus.VOID_REQUESTED]: 'طلب إلغاء',
            [OrderStatus.VOID_APPROVED]: 'إلغاء موافق عليه',
            [OrderStatus.RETURN_REQUESTED]: 'طلب إرجاع',
            [OrderStatus.RETURN_APPROVED]: 'إرجاع موافق عليه',
            [OrderStatus.REFUNDED]: 'مسترد',
            [OrderStatus.OUT_FOR_DELIVERY]: 'قيد التوصيل',
            [OrderStatus.AWAITING_PICKUP]: 'بانتظار الاستلام',
            [OrderStatus.PENDING]: 'معلق',
        };
        return labels[state] || state;
    }

    /**
     * Get state description
     */
    private getStateDescription(state: OrderStatus): string {
        const descriptions: Partial<Record<OrderStatus, string>> = {
            [OrderStatus.DRAFT]: 'Order is being built',
            [OrderStatus.SAVED]: 'Order saved but not paid',
            [OrderStatus.FIRED_TO_KITCHEN]: 'Order sent to kitchen',
            [OrderStatus.PREPARING]: 'Kitchen is preparing the order',
            [OrderStatus.READY]: 'Order is ready for service',
            [OrderStatus.SERVED]: 'Order has been served to customer',
            [OrderStatus.PAYMENT_PENDING]: 'Awaiting payment from customer',
            [OrderStatus.PAYMENT_PROCESSING]: 'Payment is being processed',
            [OrderStatus.PAID]: 'Payment received',
            [OrderStatus.PARTIALLY_PAID]: 'Partial payment received',
            [OrderStatus.COMPLETED]: 'Order completed and closed',
            [OrderStatus.VOID]: 'Order was cancelled',
            [OrderStatus.VOID_REQUESTED]: 'Void requested, awaiting approval',
            [OrderStatus.VOID_APPROVED]: 'Void approved',
            [OrderStatus.RETURN_REQUESTED]: 'Return requested, awaiting approval',
            [OrderStatus.RETURN_APPROVED]: 'Return approved',
            [OrderStatus.REFUNDED]: 'Order has been refunded',
            [OrderStatus.OUT_FOR_DELIVERY]: 'Order is out for delivery',
            [OrderStatus.AWAITING_PICKUP]: 'Order is awaiting customer pickup',
            [OrderStatus.PENDING]: 'Order is pending',
        };
        return descriptions[state] || '';
    }

    /**
     * Side effect implementations (placeholders)
     */
    private async printKOT(order: SalesOrder, params?: any): Promise<void> {
        // Delegate to printing service
        this.logger.log(`Printing KOT for order ${order.orderNumber}`);
    }

    private async printCheck(order: SalesOrder, params?: any): Promise<void> {
        this.logger.log(`Printing check for order ${order.orderNumber}`);
    }

    private async updateTable(order: SalesOrder, params?: any): Promise<void> {
        if (params?.status && order.tableId) {
            // Update table status
            this.logger.log(`Updating table ${order.tableId} to ${params.status}`);
        }
    }

    private async deductInventory(order: SalesOrder): Promise<void> {
        this.logger.log(`Deducting inventory for order ${order.orderNumber}`);
    }

    private async restoreInventory(order: SalesOrder): Promise<void> {
        this.logger.log(`Restoring inventory for order ${order.orderNumber}`);
    }

    private async notifyKitchen(order: SalesOrder, params?: any): Promise<void> {
        this.logger.log(`Notifying kitchen for order ${order.orderNumber}`);
    }

    private async notifyWaitstaff(order: SalesOrder, params?: any): Promise<void> {
        this.logger.log(`Notifying waitstaff for order ${order.orderNumber}`);
    }

    /**
     * Event emission (placeholder for WebSocket gateway)
     */
    private emitStateChangeEvent(order: SalesOrder, toState: OrderStatus): void {
        // This would emit via WebSocket gateway
        this.logger.log(`State change event: ${order.orderNumber} → ${toState}`);
    }

    private emitApprovalRequestedEvent(order: SalesOrder, toState: OrderStatus, user: User): void {
        this.logger.log(`Approval requested: ${order.orderNumber} → ${toState} by ${user.firstName}`);
    }

    /**
     * Get default state machine configurations
     */
    private getDefaultStateMachineConfigs(): Partial<Record<OrderType, StateMachineConfig>> {
        const aggregatorConfig: StateMachineConfig = {
            orderType: OrderType.DELIVERY, // will be overridden
            allowedTransitions: [
                { fromState: OrderStatus.RECEIVED_FROM_AGGREGATOR, toState: OrderStatus.FIRED_TO_KITCHEN },
                { fromState: OrderStatus.FIRED_TO_KITCHEN, toState: OrderStatus.PREPARING },
                { fromState: OrderStatus.PREPARING, toState: OrderStatus.READY },
                { fromState: OrderStatus.READY, toState: OrderStatus.OUT_FOR_DELIVERY },
                { fromState: OrderStatus.OUT_FOR_DELIVERY, toState: OrderStatus.COMPLETED },
            ],
            defaultInitialStates: {
                hasKitchenItems: OrderStatus.RECEIVED_FROM_AGGREGATOR,
                noKitchenItems: OrderStatus.RECEIVED_FROM_AGGREGATOR,
                prePaid: OrderStatus.RECEIVED_FROM_AGGREGATOR,
            },
            autoTransitions: [],
            permissionRequirements: {},
        };

        return {
            [OrderType.DINE_IN]: {
                orderType: OrderType.DINE_IN,
                allowedTransitions: [
                    { fromState: OrderStatus.DRAFT, toState: OrderStatus.SAVED, requiredFields: ['tableId', 'customerCount'] },
                    { fromState: OrderStatus.SAVED, toState: OrderStatus.FIRED_TO_KITCHEN },
                    { fromState: OrderStatus.FIRED_TO_KITCHEN, toState: OrderStatus.PREPARING },
                    { fromState: OrderStatus.PREPARING, toState: OrderStatus.READY },
                    { fromState: OrderStatus.READY, toState: OrderStatus.SERVED },
                    { fromState: OrderStatus.SERVED, toState: OrderStatus.PAYMENT_PENDING },
                    { fromState: OrderStatus.SAVED, toState: OrderStatus.PAYMENT_PENDING },
                    { fromState: OrderStatus.PAYMENT_PENDING, toState: OrderStatus.PAID },
                    { fromState: OrderStatus.SAVED, toState: OrderStatus.PAID },
                    { fromState: OrderStatus.PAID, toState: OrderStatus.COMPLETED },
                ],
                defaultInitialStates: {
                    hasKitchenItems: OrderStatus.FIRED_TO_KITCHEN,
                    noKitchenItems: OrderStatus.SAVED,
                    prePaid: OrderStatus.PAID,
                },
                autoTransitions: [
                    { trigger: 'ALL_ITEMS_READY', fromState: OrderStatus.FIRED_TO_KITCHEN, toState: OrderStatus.READY },
                    { trigger: 'PAYMENT_CONFIRMED', fromState: OrderStatus.PAYMENT_PENDING, toState: OrderStatus.PAID },
                ],
                permissionRequirements: {
                    'SAVED->VOID': { allowedRoles: [UserRole.MANAGER, UserRole.ADMIN], requiresManagerApproval: true },
                    'PAID->VOID': { allowedRoles: [UserRole.MANAGER, UserRole.ADMIN], requiresManagerApproval: true, requiresPinVerification: true },
                },
            },
            [OrderType.TAKEAWAY]: {
                orderType: OrderType.TAKEAWAY,
                allowedTransitions: [
                    { fromState: OrderStatus.DRAFT, toState: OrderStatus.PAID },
                    { fromState: OrderStatus.PAID, toState: OrderStatus.FIRED_TO_KITCHEN },
                    { fromState: OrderStatus.FIRED_TO_KITCHEN, toState: OrderStatus.PREPARING },
                    { fromState: OrderStatus.PREPARING, toState: OrderStatus.READY },
                    { fromState: OrderStatus.READY, toState: OrderStatus.COMPLETED },
                ],
                defaultInitialStates: {
                    hasKitchenItems: OrderStatus.PAID,
                    noKitchenItems: OrderStatus.PAID,
                    prePaid: OrderStatus.PAID,
                },
                autoTransitions: [],
                permissionRequirements: {},
            },
            [OrderType.DELIVERY]: {
                orderType: OrderType.DELIVERY,
                allowedTransitions: [
                    { fromState: OrderStatus.DRAFT, toState: OrderStatus.SAVED },
                    { fromState: OrderStatus.SAVED, toState: OrderStatus.FIRED_TO_KITCHEN },
                    { fromState: OrderStatus.SAVED, toState: OrderStatus.PAID },
                    { fromState: OrderStatus.PAID, toState: OrderStatus.FIRED_TO_KITCHEN },
                    { fromState: OrderStatus.FIRED_TO_KITCHEN, toState: OrderStatus.PREPARING },
                    { fromState: OrderStatus.PREPARING, toState: OrderStatus.READY },
                    { fromState: OrderStatus.READY, toState: OrderStatus.OUT_FOR_DELIVERY },
                    { fromState: OrderStatus.OUT_FOR_DELIVERY, toState: OrderStatus.COMPLETED },
                ],
                defaultInitialStates: {
                    hasKitchenItems: OrderStatus.SAVED,
                    noKitchenItems: OrderStatus.SAVED,
                    prePaid: OrderStatus.PAID,
                },
                autoTransitions: [],
                permissionRequirements: {},
            },
            [OrderType.TALABAT]: { ...aggregatorConfig, orderType: OrderType.TALABAT },
            [OrderType.MARSOOL]: { ...aggregatorConfig, orderType: OrderType.MARSOOL },
            [OrderType.INSTASHOP]: { ...aggregatorConfig, orderType: OrderType.INSTASHOP },
        };
    }
}

