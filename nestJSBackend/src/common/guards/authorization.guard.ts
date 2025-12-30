import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Authorization Guard
 *
 * Checks if the authenticated user has the required permissions.
 *
 * Usage:
 * @RequirePermissions(['orders.create', 'orders.view'])
 * @UseGuards(AuthorizationGuard)
 * async createOrder() { ... }
 */
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from decorator metadata
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    ) || this.reflector.get<string[]>(
      'permissions',
      context.getClass(),
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get the request object
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is attached to the request, deny access
    if (!user) {
      throw new ForbiddenException({
        code: 'AUTH_001',
        messageKey: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Check if user has the required permissions
    const userPermissions = this.getUserPermissions(user);

    // Check wildcard permissions first
    const hasWildcard = userPermissions.some((perm: string) => perm === '*' || perm.endsWith('.*'));

    if (hasWildcard) {
      return true;
    }

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some((requiredPerm) =>
      userPermissions.some((userPerm: string) => this.matchPermission(userPerm, requiredPerm)),
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        code: 'AUTH_005',
        messageKey: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action',
        details: {
          required: requiredPermissions,
          user: userPermissions,
        },
      });
    }

    return true;
  }

  /**
   * Get user permissions from role or user object
   */
  private getUserPermissions(user: any): string[] {
    // If permissions are directly attached to user (from auth middleware)
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions;
    }

    // If role is attached to user
    if (user.role && user.role.permissions && Array.isArray(user.role.permissions)) {
      return user.role.permissions;
    }

    // If user has a roleId, we'd need to fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Match permission patterns
   * Supports wildcards: 'orders.*' matches 'orders.create', 'orders.view', etc.
   */
  private matchPermission(userPerm: string, requiredPerm: string): boolean {
    if (userPerm === requiredPerm) {
      return true;
    }

    // Check wildcard permission
    if (userPerm.endsWith('.*')) {
      const prefix = userPerm.slice(0, -2);
      return requiredPerm.startsWith(prefix);
    }

    return false;
  }
}
