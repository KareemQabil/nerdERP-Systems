import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';

import { Discount, DiscountType, DiscountMethod, DiscountScope, DiscountStatus } from '../entities/discount.entity';
import { OrderDiscount, DiscountType as OrderDiscountType, DiscountMethod as OrderDiscountMethod, DiscountStatus as OrderDiscountStatus } from '../entities/order-discount.entity';
import { SalesOrder, OrderType } from '../entities/sales-order.entity';
import { User, Role } from '../../users/entities/user.entity';

/**
 * =============================================================================
 * DISCOUNT SERVICE TYPES
 * =============================================================================
 */

export interface ApplyDiscountParams {
    orderId: string;
    discountId?: string;           // For applying existing discount template
    discountCode?: string;         // For applying by code
    manualValue?: number;          // For manual discount (percentage or fixed)
    manualType?: 'PERCENTAGE' | 'FIXED';
    reason?: string;               // Optional reason for discount
    appliedBy: User;               // User applying the discount
    ipAddress?: string;
    deviceId?: string;
}

export interface ApplyDiscountResult {
    orderDiscount: OrderDiscount;
    discountAmount: number;
    requiresApproval: boolean;
    newOrderTotal: number;
}

export interface RemoveDiscountParams {
    orderId: string;
    orderDiscountId: string;
    removedBy: User;
    reason?: string;
}

export interface ApproveDiscountParams {
    orderDiscountId: string;
    approved: boolean;
    approvedBy: User;
    rejectionReason?: string;
}

export interface AvailableDiscountsResponse {
    discounts: Discount[];
    manualDiscountAllowed: boolean;
    maxManualPercentage: number;
    maxManualFixed: number;
}

export interface CreateDiscountDto {
    code: string;
    name: string;
    nameAr?: string;
    description?: string;
    type: DiscountType;
    method: DiscountMethod;
    value: number;
    scope?: DiscountScope;
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

export interface UpdateDiscountDto extends Partial<CreateDiscountDto> { }

/**
 * =============================================================================
 * DISCOUNT SERVICE
 * =============================================================================
 *
 * Manages discount templates and applying discounts to orders.
 *
 * Features:
 * - CRUD operations for discount templates
 * - Apply discounts to orders (template or manual)
 * - Approval workflow for restricted discounts
 * - Validation of discount rules (min order, max uses, schedule)
 * - Usage tracking
 */
@Injectable()
export class DiscountService {
    private readonly logger = new Logger(DiscountService.name);

    constructor(
        @InjectRepository(Discount)
        private readonly discountRepo: Repository<Discount>,
        @InjectRepository(OrderDiscount)
        private readonly orderDiscountRepo: Repository<OrderDiscount>,
        @InjectRepository(SalesOrder)
        private readonly orderRepo: Repository<SalesOrder>,
        private readonly dataSource: DataSource,
    ) { }

    // =====================================================
    // DISCOUNT TEMPLATE CRUD
    // =====================================================

    /**
     * Create a new discount template
     */
    @Transactional()
    async createDiscount(storeId: string, dto: CreateDiscountDto, createdByUserId: string): Promise<Discount> {
        // Check for duplicate code in store
        const existing = await this.discountRepo.findOne({
            where: { storeId, code: dto.code },
        });

        if (existing) {
            throw new BadRequestException(`Discount code '${dto.code}' already exists in this store`);
        }

        const discount = this.discountRepo.create({
            storeId,
            ...dto,
            createdByUserId,
            status: dto.isActive ? DiscountStatus.ACTIVE : DiscountStatus.INACTIVE,
        });

        const saved = await this.discountRepo.save(discount);
        this.logger.log(`Created discount: ${dto.code} (${dto.type})`);

        return saved;
    }

    /**
     * Update an existing discount
     */
    @Transactional()
    async updateDiscount(
        discountId: string,
        dto: UpdateDiscountDto,
        modifiedByUserId: string,
    ): Promise<Discount> {
        const discount = await this.discountRepo.findOne({ where: { id: discountId } });

        if (!discount) {
            throw new NotFoundException(`Discount not found: ${discountId}`);
        }

        // Update fields
        Object.assign(discount, dto, { lastModifiedByUserId: modifiedByUserId });

        // Update status based on active flag
        if (dto.isActive !== undefined) {
            discount.status = dto.isActive ? DiscountStatus.ACTIVE : DiscountStatus.INACTIVE;
        }

        const saved = await this.discountRepo.save(discount);
        this.logger.log(`Updated discount: ${discount.code}`);

        return saved;
    }

    /**
     * Delete a discount (soft delete by setting inactive)
     */
    @Transactional()
    async deleteDiscount(discountId: string): Promise<void> {
        const discount = await this.discountRepo.findOne({ where: { id: discountId } });

        if (!discount) {
            throw new NotFoundException(`Discount not found: ${discountId}`);
        }

        discount.isActive = false;
        discount.status = DiscountStatus.INACTIVE;

        await this.discountRepo.save(discount);
        this.logger.log(`Deleted (deactivated) discount: ${discount.code}`);
    }

    /**
     * Get all discounts for a store
     */
    async getStoreDiscounts(storeId: string, includeInactive = false): Promise<Discount[]> {
        const where: any = { storeId };

        if (!includeInactive) {
            where.isActive = true;
        }

        return await this.discountRepo.find({
            where,
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    /**
     * Get discount by ID
     */
    async getDiscountById(discountId: string): Promise<Discount> {
        const discount = await this.discountRepo.findOne({ where: { id: discountId } });

        if (!discount) {
            throw new NotFoundException(`Discount not found: ${discountId}`);
        }

        return discount;
    }

    /**
     * Get discount by code
     */
    async getDiscountByCode(storeId: string, code: string): Promise<Discount> {
        const discount = await this.discountRepo.findOne({
            where: { storeId, code: code.toUpperCase() },
        });

        if (!discount) {
            throw new NotFoundException(`Discount code not found: ${code}`);
        }

        return discount;
    }

    // =====================================================
    // APPLY DISCOUNT TO ORDER
    // =====================================================

    /**
     * Apply a discount to an order
     */
    @Transactional()
    async applyDiscount(params: ApplyDiscountParams): Promise<ApplyDiscountResult> {
        // Fetch order
        const order = await this.orderRepo.findOne({
            where: { id: params.orderId },
            relations: ['items'],
        });

        if (!order) {
            throw new NotFoundException(`Order not found: ${params.orderId}`);
        }

        // Get store ID from order (using register session or default)
        const storeId = params.appliedBy.storeId || 'default';

        // Determine if using template or manual discount
        let discount: Discount | null = null;
        let discountType: OrderDiscountType;
        let discountMethod: OrderDiscountMethod;
        let discountValue: number;
        let requiresApproval = false;

        if (params.discountId) {
            discount = await this.getDiscountById(params.discountId);
        } else if (params.discountCode) {
            discount = await this.getDiscountByCode(storeId, params.discountCode);
        }

        if (discount) {
            // Validate discount can be used
            this.validateDiscountUsage(discount, order, params.appliedBy);

            // Map discount template types to order discount types
            discountType = this.mapDiscountType(discount.type);
            discountMethod = discount.method === DiscountMethod.PERCENTAGE
                ? OrderDiscountMethod.PERCENTAGE
                : OrderDiscountMethod.FIXED;
            discountValue = Number(discount.value);
            requiresApproval = discount.requiresApproval;
        } else if (params.manualValue !== undefined && params.manualType) {
            // Manual discount
            discountType = params.manualType === 'PERCENTAGE'
                ? OrderDiscountType.MANUAL_PERCENTAGE
                : OrderDiscountType.MANUAL_AMOUNT;
            discountMethod = params.manualType === 'PERCENTAGE'
                ? OrderDiscountMethod.PERCENTAGE
                : OrderDiscountMethod.FIXED;
            discountValue = params.manualValue;

            // Manual discounts over threshold require approval
            if (discountMethod === OrderDiscountMethod.PERCENTAGE && discountValue > 20) {
                requiresApproval = true;
            } else if (discountMethod === OrderDiscountMethod.FIXED && discountValue > 100) {
                requiresApproval = true;
            }
        } else {
            throw new BadRequestException('Must provide discountId, discountCode, or manualValue/manualType');
        }

        // Calculate discount amount
        const orderTotal = new Decimal(order.totalGross);
        let discountAmount: Decimal;

        if (discountMethod === OrderDiscountMethod.PERCENTAGE) {
            discountAmount = orderTotal.times(discountValue).dividedBy(100);
        } else {
            discountAmount = new Decimal(discountValue);
        }

        // Cap at order total
        if (discountAmount.greaterThan(orderTotal)) {
            discountAmount = orderTotal;
        }

        // Apply maximum cap from discount template
        if (discount?.maximumDiscountAmount) {
            const maxCap = new Decimal(discount.maximumDiscountAmount);
            if (discountAmount.greaterThan(maxCap)) {
                discountAmount = maxCap;
            }
        }

        // Create OrderDiscount record
        const orderDiscount = this.orderDiscountRepo.create({
            order,
            discountType,
            discountMethod,
            value: discountValue,
            amount: discountAmount.toNumber(),
            discountCode: discount?.code,
            status: requiresApproval ? OrderDiscountStatus.PENDING : OrderDiscountStatus.APPLIED,
            requiresAuthorization: requiresApproval,
            requestedByUserId: params.appliedBy.id,
            reason: params.reason,
            deviceId: params.deviceId,
            ipAddress: params.ipAddress,
        });

        const savedOrderDiscount = await this.orderDiscountRepo.save(orderDiscount);

        // Update order totals if discount is auto-applied
        let newOrderTotal = orderTotal.toNumber();
        if (!requiresApproval) {
            newOrderTotal = orderTotal.minus(discountAmount).toNumber();
            await this.updateOrderTotals(order, discountAmount.toNumber());

            // Increment usage count on discount template
            if (discount) {
                discount.incrementUsage();
                await this.discountRepo.save(discount);
            }
        }

        this.logger.log(
            `Applied discount to order ${order.orderNumber}: ${discountAmount.toFixed(3)} ` +
            `(${discountType}, ${requiresApproval ? 'pending approval' : 'applied'})`
        );

        return {
            orderDiscount: savedOrderDiscount,
            discountAmount: discountAmount.toNumber(),
            requiresApproval,
            newOrderTotal,
        };
    }

    /**
     * Remove a discount from an order
     */
    @Transactional()
    async removeDiscount(params: RemoveDiscountParams): Promise<void> {
        const orderDiscount = await this.orderDiscountRepo.findOne({
            where: { id: params.orderDiscountId, orderId: params.orderId },
            relations: ['order'],
        });

        if (!orderDiscount) {
            throw new NotFoundException(`Order discount not found: ${params.orderDiscountId}`);
        }

        // Update order totals (restore original)
        if (orderDiscount.status === OrderDiscountStatus.APPLIED) {
            const order = orderDiscount.order;
            const discountAmount = new Decimal(orderDiscount.amount);

            order.totalNet = new Decimal(order.totalNet).plus(discountAmount).toNumber();
            order.discountAmount = new Decimal(order.discountAmount || 0).minus(discountAmount).toNumber();

            await this.orderRepo.save(order);
        }

        // Mark discount as reversed
        orderDiscount.status = OrderDiscountStatus.REVERSED;
        orderDiscount.notes = params.reason || 'Discount removed';

        await this.orderDiscountRepo.save(orderDiscount);

        this.logger.log(`Removed discount from order: ${orderDiscount.discountCode || 'manual'}`);
    }

    /**
     * Approve or reject a pending discount
     */
    @Transactional()
    async processDiscountApproval(params: ApproveDiscountParams): Promise<OrderDiscount> {
        const orderDiscount = await this.orderDiscountRepo.findOne({
            where: { id: params.orderDiscountId },
            relations: ['order'],
        });

        if (!orderDiscount) {
            throw new NotFoundException(`Order discount not found: ${params.orderDiscountId}`);
        }

        if (orderDiscount.status !== OrderDiscountStatus.PENDING) {
            throw new BadRequestException('Discount is not pending approval');
        }

        // Check manager role
        if (!this.isManager(params.approvedBy)) {
            throw new ForbiddenException('Only managers can approve discounts');
        }

        if (params.approved) {
            // Approve and apply
            orderDiscount.status = OrderDiscountStatus.APPLIED;
            orderDiscount.authorizedByUserId = params.approvedBy.id;
            orderDiscount.authorizedAt = new Date();

            // Update order totals
            await this.updateOrderTotals(orderDiscount.order, orderDiscount.amount);

            this.logger.log(`Approved discount for order: ${orderDiscount.order.orderNumber}`);
        } else {
            // Reject
            orderDiscount.status = OrderDiscountStatus.REJECTED;
            orderDiscount.rejectionReason = params.rejectionReason || 'Rejected by manager';

            this.logger.log(`Rejected discount for order: ${orderDiscount.order.orderNumber}`);
        }

        return await this.orderDiscountRepo.save(orderDiscount);
    }

    // =====================================================
    // AVAILABLE DISCOUNTS
    // =====================================================

    /**
     * Get available discounts for an order
     */
    async getAvailableDiscounts(
        storeId: string,
        orderType: OrderType,
        user: User,
    ): Promise<AvailableDiscountsResponse> {
        // Get all active discounts for store
        const allDiscounts = await this.discountRepo.find({
            where: {
                storeId,
                isActive: true,
                status: DiscountStatus.ACTIVE,
            },
            order: { sortOrder: 'ASC', priority: 'DESC' },
        });

        // Filter by validity
        const validDiscounts = allDiscounts.filter(discount => {
            // Check if currently valid (schedule)
            if (!discount.isCurrentlyValid()) {
                return false;
            }

            // Check order type applicability
            if (!discount.appliesToOrderType(orderType)) {
                return false;
            }

            // Check usage limits
            if (!discount.canBeUsed()) {
                return false;
            }

            // Check allowed roles
            if (discount.allowedRoles && discount.allowedRoles.length > 0) {
                const userRoleCode = user.role?.roleCode || '';
                if (!discount.allowedRoles.includes(userRoleCode)) {
                    return false;
                }
            }

            return true;
        });

        // Determine manual discount limits based on user role
        let maxManualPercentage = 10;  // Default for cashiers
        let maxManualFixed = 50;

        if (this.isManager(user)) {
            maxManualPercentage = 50;
            maxManualFixed = 500;
        }
        if (this.isAdmin(user)) {
            maxManualPercentage = 100;
            maxManualFixed = 10000;
        }

        return {
            discounts: validDiscounts,
            manualDiscountAllowed: true,
            maxManualPercentage,
            maxManualFixed,
        };
    }

    /**
     * Get pending discount approvals for a store
     */
    async getPendingApprovals(storeId: string): Promise<OrderDiscount[]> {
        // Use query builder for complex joins
        return await this.orderDiscountRepo
            .createQueryBuilder('discount')
            .leftJoinAndSelect('discount.order', 'order')
            .where('discount.status = :status', { status: OrderDiscountStatus.PENDING })
            .orderBy('discount.createdAt', 'ASC')
            .getMany();
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    /**
     * Map Discount template type to OrderDiscount type
     */
    private mapDiscountType(type: DiscountType): OrderDiscountType {
        switch (type) {
            case DiscountType.MANUAL_PERCENTAGE:
                return OrderDiscountType.MANUAL_PERCENTAGE;
            case DiscountType.MANUAL_FIXED:
                return OrderDiscountType.MANUAL_AMOUNT;
            case DiscountType.CORPORATE_PRESET:
            case DiscountType.VIP_CUSTOMER:
            case DiscountType.STAFF:
                return OrderDiscountType.CORPORATE_PRESET;
            case DiscountType.PROMOTION:
            case DiscountType.HAPPY_HOUR:
            case DiscountType.SEASONAL:
                return OrderDiscountType.PROMOTION;
            case DiscountType.LOYALTY:
            case DiscountType.POINTS_REDEMPTION:
                return OrderDiscountType.LOYALTY_REDEMPTION;
            case DiscountType.COUPON:
                return OrderDiscountType.COUPON_CODE;
            default:
                return OrderDiscountType.MANUAL_PERCENTAGE;
        }
    }

    /**
     * Validate that a discount can be used for an order
     */
    private validateDiscountUsage(discount: Discount, order: SalesOrder, user: User): void {
        // Check if active
        if (!discount.isActive || discount.status !== DiscountStatus.ACTIVE) {
            throw new BadRequestException(`Discount '${discount.code}' is not active`);
        }

        // Check if currently valid (schedule)
        if (!discount.isCurrentlyValid()) {
            throw new BadRequestException(`Discount '${discount.code}' is not valid at this time`);
        }

        // Check usage limits
        if (!discount.canBeUsed()) {
            throw new BadRequestException(`Discount '${discount.code}' has exceeded usage limits`);
        }

        // Check minimum order value
        if (discount.minimumOrderValue && order.totalGross < discount.minimumOrderValue) {
            throw new BadRequestException(
                `Minimum order value of ${discount.minimumOrderValue} required for this discount`
            );
        }

        // Check order type applicability
        if (!discount.appliesToOrderType(order.orderType)) {
            throw new BadRequestException(`Discount '${discount.code}' is not valid for ${order.orderType} orders`);
        }

        // Check allowed roles
        if (discount.allowedRoles && discount.allowedRoles.length > 0) {
            const userRoleCode = user.role?.roleCode || '';
            if (!discount.allowedRoles.includes(userRoleCode)) {
                throw new ForbiddenException(`You are not authorized to apply discount '${discount.code}'`);
            }
        }
    }

    /**
     * Update order totals after applying discount
     */
    private async updateOrderTotals(order: SalesOrder, discountAmount: number): Promise<void> {
        const currentDiscount = new Decimal(order.discountAmount || 0);
        const newDiscount = currentDiscount.plus(discountAmount);

        order.discountAmount = newDiscount.toNumber();
        order.totalNet = new Decimal(order.totalGross).minus(newDiscount).toNumber();

        await this.orderRepo.save(order);
    }

    /**
     * Check if user is a manager
     */
    private isManager(user: User): boolean {
        const roleCode = user.role?.roleCode?.toUpperCase() || '';
        return roleCode === 'MANAGER' || roleCode === 'ADMIN';
    }

    /**
     * Check if user is an admin
     */
    private isAdmin(user: User): boolean {
        const roleCode = user.role?.roleCode?.toUpperCase() || '';
        return roleCode === 'ADMIN';
    }
}
