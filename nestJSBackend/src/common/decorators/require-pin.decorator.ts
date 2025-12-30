import { SetMetadata } from '@nestjs/common';

/**
 * Require PIN Decorator
 *
 * Specifies that a route requires PIN authorization.
 * Used in conjunction with PinAuthorizationGuard.
 *
 * Supported Actions:
 * - VOID_ITEM: Void an order item
 * - VOID_ORDER: Void an entire order
 * - APPLY_DISCOUNT: Apply discount to order
 * - PRICE_OVERRIDE: Override item price
 * - REFUND: Process refund
 * - OPEN_DRAWER: Open cash drawer without sale
 * - DELETE_ORDER: Delete an order
 *
 * @example
 * @RequirePin('VOID_ITEM')
 * @Post(':orderId/items/:itemId/void')
 * async voidItem(@Param('itemId') itemId: string) { ... }
 *
 * @example Manager approval for voiding paid orders
 * @RequirePin('VOID_ORDER')
 * @Post(':orderId/void')
 * async voidOrder(@Param('orderId') orderId: string) { ... }
 *
 * The request body should include:
 * {
 *   pin: string,        // 4-6 digit PIN code
 *   reason?: string     // Reason for the action (for audit trail)
 * }
 */
export const REQUIRE_PIN_KEY = 'requirePin';

export const RequirePin = (action: string) => SetMetadata(REQUIRE_PIN_KEY, action);
