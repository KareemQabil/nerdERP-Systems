import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinAttempt } from '../../modules/users/entities/pin-attempt.entity';

/**
 * PIN Lockout Guard
 *
 * Checks if a user is locked out for PIN verification before allowing
 * the request to proceed. Use this guard on endpoints that perform
 * PIN verification to prevent processing requests for locked accounts.
 *
 * Usage:
 * @UseGuards(PinLockoutGuard)
 * async somePinOperation(@Body() dto: { userId: string; deviceId: string }) {
 *   // User is not locked out, proceed with PIN verification
 * }
 *
 * Expected Request Body/Query:
 * {
 *   userId: string,    // User ID to check lockout for
 *   deviceId: string   // Device identifier
 * }
 *
 * Response on lockout:
 * {
 *   locked: true,
 *   remainingSeconds: number,
 *   remainingMinutes: number
 * }
 */
@Injectable()
export class PinLockoutGuard implements CanActivate {
    constructor(
        @InjectRepository(PinAttempt)
        private readonly pinAttemptRepo: Repository<PinAttempt>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Extract userId and deviceId from request body or query
        const { userId, deviceId } = request.body || request.query;

        // Validate required fields
        if (!userId) {
            throw new UnauthorizedException({
                code: 'AUTH_009',
                messageKey: 'USER_ID_REQUIRED',
                message: 'User ID is required for PIN lockout check',
            });
        }

        if (!deviceId) {
            throw new UnauthorizedException({
                code: 'AUTH_010',
                messageKey: 'DEVICE_ID_REQUIRED',
                message: 'Device ID is required for PIN lockout check',
            });
        }

        // Get the latest attempt record for this user/device combination
        const attempt = await this.pinAttemptRepo.findOne({
            where: { userId, deviceId },
            order: { createdAt: 'DESC' },
        });

        // If no attempt record exists, user is not locked out
        if (!attempt) {
            // Attach lockout status to request for downstream use
            request.pinLockoutStatus = {
                isLocked: false,
                remainingSeconds: 0,
                remainingMinutes: 0,
            };
            return true;
        }

        // Check if user is currently locked out
        if (attempt.isLocked()) {
            const remainingSeconds = attempt.getRemainingLockoutSeconds();
            const remainingMinutes = Math.ceil(remainingSeconds / 60);

            throw new UnauthorizedException({
                code: 'AUTH_007',
                messageKey: 'PIN_LOCKED',
                message: `Account locked. Try again in ${remainingMinutes} minute(s).`,
                locked: true,
                remainingSeconds,
                remainingMinutes,
            });
        }

        // Attach lockout status to request for downstream use
        request.pinLockoutStatus = {
            isLocked: false,
            remainingSeconds: 0,
            remainingMinutes: 0,
            attemptCount: attempt.isSuccessful ? 0 : attempt.attemptCount,
        };

        return true;
    }
}

/**
 * Extended PIN Lockout Guard with Attempt Info
 *
 * Similar to PinLockoutGuard but also provides attempt count information
 * to help the frontend display remaining attempts.
 */
@Injectable()
export class PinLockoutWithAttemptsGuard implements CanActivate {
    constructor(
        @InjectRepository(PinAttempt)
        private readonly pinAttemptRepo: Repository<PinAttempt>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { userId, deviceId } = request.body || request.query;

        if (!userId || !deviceId) {
            throw new UnauthorizedException({
                code: 'AUTH_009',
                messageKey: 'MISSING_PARAMETERS',
                message: 'User ID and Device ID are required',
            });
        }

        const attempt = await this.pinAttemptRepo.findOne({
            where: { userId, deviceId },
            order: { createdAt: 'DESC' },
        });

        // No attempt record - first time or no failures yet
        if (!attempt) {
            request.pinLockoutStatus = {
                isLocked: false,
                remainingSeconds: 0,
                remainingMinutes: 0,
                attemptCount: 0,
                maxAttempts: 5,
                remainingAttempts: 5,
            };
            return true;
        }

        // Check lockout status
        if (attempt.isLocked()) {
            const remainingSeconds = attempt.getRemainingLockoutSeconds();
            const remainingMinutes = Math.ceil(remainingSeconds / 60);

            throw new UnauthorizedException({
                code: 'AUTH_007',
                messageKey: 'PIN_LOCKED',
                message: `Account locked. Try again in ${remainingMinutes} minute(s).`,
                locked: true,
                remainingSeconds,
                remainingMinutes,
                attemptCount: attempt.attemptCount,
                maxAttempts: 5,
            });
        }

        // Calculate remaining attempts
        const maxAttempts = 5;
        const attemptCount = attempt.isSuccessful ? 0 : attempt.attemptCount;
        const remainingAttempts = maxAttempts - attemptCount;

        // Attach detailed status to request
        request.pinLockoutStatus = {
            isLocked: false,
            remainingSeconds: 0,
            remainingMinutes: 0,
            attemptCount,
            maxAttempts,
            remainingAttempts,
        };

        return true;
    }
}

/**
 * Pin Lockout Decorator
 *
 * Optional decorator for documenting that an endpoint checks PIN lockout.
 * Can be used with reflection to configure lockout behavior per endpoint.
 */
import { SetMetadata } from '@nestjs/common';

export const CHECK_PIN_LOCKOUT = 'checkPinLockout';

export const CheckPinLockout = (options?: {
    maxAttempts?: number;
    lockoutDurationMinutes?: number;
}) => SetMetadata(CHECK_PIN_LOCKOUT, options || {});
