import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';

/**
 * PIN Authorization Guard
 *
 * Verifies PIN code for sensitive operations like void, discount, refund.
 *
 * Usage:
 * @RequirePin('VOID_ITEM')
 * @UseGuards(PinAuthorizationGuard)
 * async voidItem(@Body() dto: { pin: string; action: string; reason: string }) {
 *   // Guard verified PIN and attached req.authorizingUser
 * }
 *
 * Expected Request Body:
 * {
 *   pin: string,           // 4-6 digit PIN code
 *   action: string,        // Optional: action being performed (auto-detected from decorator)
 *   reason?: string        // Optional: reason for the action
 * }
 */
@Injectable()
export class PinAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get the required action from decorator metadata
    const requiredAction = this.reflector.get<string>(
      'requirePin',
      context.getHandler(),
    ) || this.reflector.get<string>(
      'requirePin',
      context.getClass(),
    );

    // Extract PIN and action from request body or query
    const { pin, action, reason } = request.body || request.query;

    // Validate PIN presence
    if (!pin) {
      throw new BadRequestException({
        code: 'AUTH_006',
        messageKey: 'PIN_REQUIRED',
        message: 'PIN code is required for this operation',
      });
    }

    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(pin)) {
      throw new BadRequestException({
        code: 'AUTH_007',
        messageKey: 'INVALID_PIN_FORMAT',
        message: 'PIN must be 4-6 digits',
      });
    }

    // Find user with matching PIN
    const authorizingUser = await this.userRepo.findOne({
      where: {
        pinCode: await this.hashPin(pin),
        isActive: true,
      },
      relations: ['role'],
    });

    if (!authorizingUser) {
      throw new UnauthorizedException({
        code: 'AUTH_006',
        messageKey: 'INVALID_PIN',
        message: 'Invalid PIN code',
      });
    }

    // Check if PIN is locked (too many failed attempts)
    if (authorizingUser.metadata?.pinLockedUntil) {
      const lockedUntil = new Date(authorizingUser.metadata.pinLockedUntil);
      if (lockedUntil > new Date()) {
        const minutesRemaining = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        throw new ForbiddenException({
          code: 'SESSION_001',
          messageKey: 'PIN_LOCKED',
          message: `PIN is locked. Try again in ${minutesRemaining} minutes.`,
        });
      } else {
        // Lock expired, clear it
        authorizingUser.metadata = {
          ...authorizingUser.metadata,
          pinFailedAttempts: 0,
          pinLockedUntil: null,
        };
        await this.userRepo.save(authorizingUser);
      }
    }

    // Verify the user has permission for this action
    const actionToVerify = action || requiredAction;
    if (actionToVerify && !this.hasActionPermission(authorizingUser, actionToVerify)) {
      throw new ForbiddenException({
        code: 'AUTH_005',
        messageKey: 'INSUFFICIENT_PERMISSIONS',
        message: `User with PIN does not have permission for action: ${actionToVerify}`,
        details: {
          action: actionToVerify,
          userId: authorizingUser.id,
          userName: `${authorizingUser.firstName} ${authorizingUser.lastName}`,
        },
      });
    }

    // Clear failed attempts on successful PIN verification
    if (authorizingUser.metadata?.pinFailedAttempts > 0) {
      authorizingUser.metadata = {
        ...authorizingUser.metadata,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      };
      await this.userRepo.save(authorizingUser);
    }

    // Attach authorizing user and reason to request for use in controllers
    request.authorizingUser = {
      id: authorizingUser.id,
      firstName: authorizingUser.firstName,
      lastName: authorizingUser.lastName,
      email: authorizingUser.email,
      roleId: authorizingUser.roleId,
      role: authorizingUser.role,
    };
    request.authorizationReason = reason;

    return true;
  }

  /**
   * Hash PIN code for comparison
   */
  private async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, 10);
  }

  /**
   * Check if user has permission for the specified action
   */
  private hasActionPermission(user: User, action: string): boolean {
    // Get user permissions from role
    const permissions = user.role?.permissions || [];

    // Admin and Manager roles have all permissions
    if (user.role?.roleCode === 'ADMIN' || user.role?.roleCode === 'MANAGER') {
      return true;
    }

    // Define permission mappings for actions
    const actionPermissions: Record<string, string[]> = {
      VOID_ITEM: ['VOID_ITEM', 'orders.*', '*'],
      VOID_ORDER: ['VOID_ORDER', 'orders.*', '*'],
      APPLY_DISCOUNT: ['APPLY_DISCOUNT', 'orders.*', '*'],
      PRICE_OVERRIDE: ['PRICE_OVERRIDE', 'orders.*', '*'],
      REFUND: ['REFUND', 'VOID_ORDER', 'orders.*', '*'],
      OPEN_DRAWER: ['OPEN_DRAWER', 'cash.*', '*'],
      DELETE_ORDER: ['DELETE_ORDER', 'VOID_ORDER', 'orders.*', '*'],
    };

    const requiredPerms = actionPermissions[action] || [];

    // Check if user has any of the required permissions
    return requiredPerms.some((requiredPerm) =>
      permissions.some((userPerm) => this.matchPermission(userPerm, requiredPerm)),
    );
  }

  /**
   * Match permission patterns with wildcards
   */
  private matchPermission(userPerm: string, requiredPerm: string): boolean {
    if (userPerm === requiredPerm) {
      return true;
    }

    if (userPerm === '*') {
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
