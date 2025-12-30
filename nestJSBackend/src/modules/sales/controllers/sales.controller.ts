import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SalesService } from '../services/sales.service';
import { VoidOperationService } from '../services/void-operation.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { VoidItemDto, VoidOrderDto, BulkVoidItemsDto } from '../dto/void-operation.dto';
import { SalesOrder, OrderStatus } from '../entities/sales-order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { UseGuards } from '@nestjs/common';
import { RequirePin } from '../../../common/decorators';
import { PinAuthorizationGuard } from '../../../common/guards';
import { forwardRef, Inject } from '@nestjs/common';
import { KitchenService } from '../../kitchen/services/kitchen.service';
import { FireOrderToKitchenDto } from '../../kitchen/dto/kitchen.dto';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.interface';

@ApiTags('Sales')
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly voidOperationService: VoidOperationService,
    @Inject(forwardRef(() => KitchenService))
    private readonly kitchenService: KitchenService,
  ) { }

  // ==========================================================================
  // ORDER OPERATIONS
  // ==========================================================================

  @Post('orders')
  @ApiOperation({ summary: 'Create a new sales order' })
  @ApiResponse({ status: 201, type: SalesOrder, description: 'Order created successfully' })
  async createOrder(@Body() createDto: CreateOrderDto): Promise<SalesOrder> {
    return await this.salesService.createOrder(createDto);
  }

  // ==========================================================================
  // KITCHEN INTEGRATION
  // ==========================================================================

  /**
   * Fire order to kitchen - Send kitchen items for preparation
   *
   * This endpoint:
   * - Creates kitchen tickets for all kitchen items in the order
   * - Groups items by their assigned kitchen stations
   * - Updates order status to FIRED_TO_KITCHEN
   * - Triggers WebSocket event to KDS displays
   *
   * Error codes:
   * - KITCHEN_001: Order not found
   * - KITCHEN_002: Order cannot be fired (already completed/void)
   * - KITCHEN_003: No kitchen items to fire
   */
  @Post('orders/:orderId/fire-to-kitchen')
  @ApiOperation({ summary: 'Fire order to kitchen (POS → Kitchen)' })
  @ApiResponse({ status: 201, description: 'Kitchen tickets created and broadcast' })
  @ApiResponse({ status: 400, description: 'Bad request - order cannot be fired' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async fireOrderToKitchen(
    @Param('orderId') orderId: string,
    @Body() dto: FireOrderToKitchenDto,
  ) {
    const tickets = await this.kitchenService.fireOrderToKitchen(orderId, dto.itemIds);

    return {
      success: true,
      data: tickets,
      messageKey: 'ORDER_FIRED_TO_KITCHEN',
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // VOID OPERATIONS
  // ==========================================================================

  /**
   * Void a single order item
   *
   * Requires manager PIN authorization. This will:
   * - Mark the item as voided
   * - Restore inventory (if applicable)
   * - Create audit log entry
   *
   * Error codes:
   * - VOID_001: Item already voided
   * - VOID_002: Order already completed
   * - SESSION_001: PIN locked
   * - AUTH_006: Invalid PIN
   */
  @Post('orders/:orderId/items/:itemId/void')
  @UseGuards(PinAuthorizationGuard)
  @RequirePin('VOID_ITEM')
  @ApiOperation({ summary: 'Void an order item' })
  @ApiResponse({ status: 200, type: OrderItem, description: 'Item voided successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - item already voided or order completed' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - item not found' })
  async voidItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: VoidItemDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<OrderItem> {
    const authorizingUser = req.authorizingUser!;
    const requestingUser = req.user!;

    return await this.voidOperationService.voidItem({
      orderItemId: itemId,
      reason: dto.reason,
      requestedByUserId: requestingUser.id,
      requestedByUserName: `${requestingUser.firstName} ${requestingUser.lastName}`,
      authorizingUserId: authorizingUser.id,
      authorizingUserName: `${authorizingUser.firstName} ${authorizingUser.lastName}`,
    });
  }

  /**
   * Void an entire order
   *
   * Requires manager PIN authorization. This will:
   * - Void all non-voided items in the order
   * - Restore inventory for all items
   * - Process refunds if order was paid
   * - Create audit log entries
   *
   * Error codes:
   * - VOID_003: Order not found
   * - VOID_004: Order already voided
   * - SESSION_001: PIN locked
   * - AUTH_006: Invalid PIN
   */
  @Post('orders/:orderId/void')
  @UseGuards(PinAuthorizationGuard)
  @RequirePin('VOID_ORDER')
  @ApiOperation({ summary: 'Void an entire order' })
  @ApiResponse({ status: 200, type: SalesOrder, description: 'Order voided successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - order already voided' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - order not found' })
  async voidOrder(
    @Param('orderId') orderId: string,
    @Body() dto: VoidOrderDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SalesOrder> {
    const authorizingUser = req.authorizingUser!;
    const requestingUser = req.user!;

    return await this.voidOperationService.voidOrder({
      orderId,
      reason: dto.reason,
      requestedByUserId: requestingUser.id,
      requestedByUserName: `${requestingUser.firstName} ${requestingUser.lastName}`,
      authorizingUserId: authorizingUser.id,
      authorizingUserName: `${authorizingUser.firstName} ${authorizingUser.lastName}`,
    });
  }

  /**
   * Bulk void multiple order items
   *
   * Requires manager PIN authorization.
   */
  @Post('orders/bulk-void-items')
  @UseGuards(PinAuthorizationGuard)
  @RequirePin('VOID_ITEM')
  @ApiOperation({ summary: 'Void multiple order items' })
  @ApiResponse({ status: 200, type: [OrderItem], description: 'Items voided successfully' })
  async bulkVoidItems(
    @Body() dto: BulkVoidItemsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<OrderItem[]> {
    const authorizingUser = req.authorizingUser!;
    const requestingUser = req.user!;

    return await this.voidOperationService.bulkVoidItems({
      orderItemId: dto.itemIds,
      reason: dto.reason,
      requestedByUserId: requestingUser.id,
      requestedByUserName: `${requestingUser.firstName} ${requestingUser.lastName}`,
      authorizingUserId: authorizingUser.id,
      authorizingUserName: `${authorizingUser.firstName} ${authorizingUser.lastName}`,
    });
  }

  /**
   * Get void history for an order
   *
   * Returns all voided items and their details for audit purposes
   */
  @Get('orders/:orderId/void-history')
  @ApiOperation({ summary: 'Get void history for an order' })
  @ApiResponse({ status: 200, description: 'Void history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Not found - order not found' })
  async getVoidHistory(@Param('orderId') orderId: string) {
    return await this.voidOperationService.getVoidHistory(orderId);
  }
}
