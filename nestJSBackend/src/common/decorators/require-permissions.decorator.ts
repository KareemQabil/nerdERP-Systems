import { SetMetadata } from '@nestjs/common';

/**
 * Require Permissions Decorator
 *
 * Specifies which permissions are required to access a route.
 * Used in conjunction with AuthorizationGuard.
 *
 * @example
 * @RequirePermissions(['orders.create', 'orders.view'])
 * @Post()
 * async createOrder() { ... }
 *
 * @example With wildcard
 * @RequirePermissions(['orders.*'])
 * @Post()
 * async createOrder() { ... }
 *
 * @example Multiple permissions (user needs at least one)
 * @RequirePermissions(['orders.create', 'orders.admin'])
 * @Post()
 * async createOrder() { ... }
 */
export const REQUIRE_PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
