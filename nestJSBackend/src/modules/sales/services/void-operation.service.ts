import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Decimal } from 'decimal.js';
import { OrderItem, OrderItemModifier } from '../entities/order-item.entity';
import { SalesOrder, OrderStatus, PaymentStatus } from '../entities/sales-order.entity';
import { Payment, PaymentMethod } from '../entities/payment.entity';
import { Refund } from '../entities/refund.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { StockReferenceType } from '../../inventory/entities/stock-move.entity';
import { RefundStatus } from '../entities/refund.entity';

/**
 * Void Operation Service
 *
 * Handles voiding of order items and entire orders with:
 * - Inventory restoration
 * - Refund processing (if already paid)
 * - Audit logging
 * - Manager authorization tracking
 */
@Injectable()
export class VoidOperationService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(SalesOrder)
    private readonly orderRepo: Repository<SalesOrder>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) { }

  /**
   * Void a single order item
   *
   * @param params Void parameters
   * @returns The voided order item
   */
  @Transactional()
  async voidItem(params: {
    orderItemId: string;
    reason: string;
    requestedByUserId: string;
    requestedByUserName: string;
    authorizingUserId: string;
    authorizingUserName: string;
    ipAddress?: string;
    deviceId?: string;
    storeId?: string;
  }): Promise<OrderItem> {
    // Fetch the item with relations
    const item = await this.orderItemRepo.findOne({
      where: { id: params.orderItemId },
      relations: ['order', 'order.payments', 'product'],
    });

    if (!item) {
      throw new NotFoundException({
        code: 'VOID_001',
        messageKey: 'ITEM_NOT_FOUND',
        message: 'Order item not found',
      });
    }

    // Check if already voided
    if (item.isVoided) {
      throw new BadRequestException({
        code: 'VOID_001',
        messageKey: 'ITEM_ALREADY_VOIDED',
        message: 'This item has already been voided',
      });
    }

    // Check if order can be voided (some business rules)
    if (item.order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException({
        code: 'VOID_002',
        messageKey: 'ORDER_ALREADY_COMPLETED',
        message: 'Cannot void items from a completed order',
      });
    }

    // Restore inventory if product tracks inventory
    if (item.product?.trackInventory) {
      await this.inventoryService.restoreStock({
        productId: item.product.id,
        quantity: new Decimal(item.quantity),
        reason: `Void: ${params.reason}`,
        referenceType: StockReferenceType.VOID,
        referenceId: item.id,
      });
    }

    // Mark item as voided
    item.isVoided = true;
    item.voidedAt = new Date();
    item.voidReason = params.reason;
    item.voidedByUserId = params.requestedByUserId;
    item.voidAuthorizedByUserId = params.authorizingUserId;

    const savedItem = await this.orderItemRepo.save(item);

    // Create audit log
    await this.auditLogService.logVoidOperation({
      entityType: 'ORDER_ITEM',
      entityId: item.id,
      entitySnapshot: {
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      },
      reason: params.reason,
      requestedBy: {
        id: params.requestedByUserId,
        name: params.requestedByUserName,
      },
      authorizedBy: {
        id: params.authorizingUserId,
        name: params.authorizingUserName,
      },
      ipAddress: params.ipAddress,
      deviceId: params.deviceId,
      storeId: params.storeId,
    });

    // Check if all items in order are voided, update order status
    await this.checkAndUpdateOrderStatus(item.order.id);

    return savedItem;
  }

  /**
   * Void an entire order
   *
   * @param params Void parameters
   * @returns The voided order
   */
  @Transactional()
  async voidOrder(params: {
    orderId: string;
    reason: string;
    requestedByUserId: string;
    requestedByUserName: string;
    authorizingUserId: string;
    authorizingUserName: string;
    ipAddress?: string;
    deviceId?: string;
    storeId?: string;
  }): Promise<SalesOrder> {
    // Fetch order with relations
    const order = await this.orderRepo.findOne({
      where: { id: params.orderId },
      relations: ['items', 'items.product', 'payments'],
    });

    if (!order) {
      throw new NotFoundException({
        code: 'VOID_003',
        messageKey: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    // Check if already voided
    if (order.status === OrderStatus.VOID) {
      throw new BadRequestException({
        code: 'VOID_004',
        messageKey: 'ORDER_ALREADY_VOIDED',
        message: 'This order has already been voided',
      });
    }

    // Void all non-voided items
    const itemsToVoid = order.items.filter((item) => !item.isVoided);

    for (const item of itemsToVoid) {
      await this.voidItem({
        orderItemId: item.id,
        reason: `Order void: ${params.reason}`,
        requestedByUserId: params.requestedByUserId,
        requestedByUserName: params.requestedByUserName,
        authorizingUserId: params.authorizingUserId,
        authorizingUserName: params.authorizingUserName,
        ipAddress: params.ipAddress,
        deviceId: params.deviceId,
        storeId: params.storeId,
      });
    }

    // Process refunds if order was paid
    if (order.paymentStatus === PaymentStatus.PAID || order.paymentStatus === PaymentStatus.PARTIAL) {
      await this.processOrderRefunds(order, params);
    }

    // Update order status to VOID
    order.status = OrderStatus.VOID;
    order.voidedAt = new Date();
    order.voidReason = params.reason;
    order.voidedByUserId = params.requestedByUserId;
    order.voidAuthorizedByUserId = params.authorizingUserId;

    const savedOrder = await this.orderRepo.save(order);

    return savedOrder;
  }

  /**
   * Bulk void multiple items
   *
   * @param params Bulk void parameters
   * @returns Array of voided items
   */
  @Transactional()
  async bulkVoidItems(params: {
    orderItemId: string[];
    reason: string;
    requestedByUserId: string;
    requestedByUserName: string;
    authorizingUserId: string;
    authorizingUserName: string;
    ipAddress?: string;
    deviceId?: string;
    storeId?: string;
  }): Promise<OrderItem[]> {
    const voidedItems: OrderItem[] = [];

    for (const itemId of params.orderItemId) {
      const voidedItem = await this.voidItem({
        orderItemId: itemId,
        reason: params.reason,
        requestedByUserId: params.requestedByUserId,
        requestedByUserName: params.requestedByUserName,
        authorizingUserId: params.authorizingUserId,
        authorizingUserName: params.authorizingUserName,
        ipAddress: params.ipAddress,
        deviceId: params.deviceId,
        storeId: params.storeId,
      });
      voidedItems.push(voidedItem);
    }

    return voidedItems;
  }

  /**
   * Process refunds for a voided order
   *
   * @param order The order to refund
   * @param params Authorization parameters
   */
  private async processOrderRefunds(
    order: SalesOrder,
    params: {
      reason: string;
      requestedByUserId: string;
      requestedByUserName: string;
      authorizingUserId: string;
      authorizingUserName: string;
      ipAddress?: string;
      deviceId?: string;
      storeId?: string;
    },
  ): Promise<void> {
    const totalPaid = order.payments.reduce(
      (sum, payment) => sum.plus(new Decimal(payment.amount)),
      new Decimal(0),
    );

    // For each payment, create a refund
    for (const payment of order.payments) {
      const refund = this.refundRepo.create({
        order: order,
        refundNumber: `REF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        status: RefundStatus.COMPLETED,
        refundAmount: payment.amount,
        refundReason: params.reason as any,
        requestedByUserId: params.requestedByUserId,
        requestedByUserName: params.requestedByUserName,
        approvedByUserId: params.authorizingUserId,
        approvedByUserName: params.authorizingUserName,
        originalPaymentMethod: payment.method,
        processedAt: new Date(),
      });

      await this.refundRepo.save(refund);

      // Log refund
      await this.auditLogService.logRefundOperation({
        paymentId: payment.id,
        orderId: order.id,
        refundAmount: payment.amount,
        reason: params.reason,
        processedBy: {
          id: params.requestedByUserId,
          name: params.requestedByUserName,
        },
        authorizedBy: {
          id: params.authorizingUserId,
          name: params.authorizingUserName,
        },
        ipAddress: params.ipAddress,
        deviceId: params.deviceId,
        storeId: params.storeId,
      });

      // If not cash payment, process with payment gateway
      if (payment.method !== PaymentMethod.CASH) {
        // TODO: Integrate with payment gateway for actual refund
        // await this.paymentGatewayService.refundPayment({ ... });
      }
    }

    // Update payment status
    order.paymentStatus = PaymentStatus.REFUNDED;
    await this.orderRepo.save(order);
  }

  /**
   * Check if all items in an order are voided and update order status accordingly
   *
   * @param orderId The order ID to check
   */
  private async checkAndUpdateOrderStatus(orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) return;

    const allVoided = order.items.every((item) => item.isVoided);
    const anyVoided = order.items.some((item) => item.isVoided);

    if (allVoided && order.items.length > 0) {
      // All items voided - check if order should be marked VOID
      if (order.paymentStatus === PaymentStatus.PENDING) {
        order.status = OrderStatus.VOID;
      }
    } else if (anyVoided) {
      // Some items voided - keep status as is but could set a flag
      // order.metadata = { ...order.metadata, hasVoidedItems: true };
    }

    await this.orderRepo.save(order);
  }

  /**
   * Get void history for an order
   *
   * @param orderId The order ID
   * @returns Void history with items
   */
  async getVoidHistory(orderId: string): Promise<{
    order: SalesOrder;
    voidedItems: Array<{
      item: OrderItem;
      voidedAt: Date | null;
      voidReason: string | null;
      voidedBy: string | null;
      voidAuthorizedBy: string | null;
    }>;
  }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException({
        code: 'VOID_005',
        messageKey: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    }

    const voidedItems = order.items
      .filter((item) => item.isVoided)
      .map((item) => ({
        item,
        voidedAt: item.voidedAt,
        voidReason: item.voidReason,
        voidedBy: item.voidedByUserId,
        voidAuthorizedBy: item.voidAuthorizedByUserId,
      }));

    return {
      order,
      voidedItems,
    };
  }
}
