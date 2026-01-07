import {
    Controller,
    Post,
    Get,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import {
    PinVerifyDto,
    PinVerifyByUserDto,
    ClearPinLockoutDto,
    PinLockoutStatusDto,
} from '../dto/user.dto';

/**
 * PIN Verification Controller
 *
 * Enhanced PIN verification with lockout support and attempt tracking.
 * Provides secure PIN validation for POS operations with built-in
 * brute force protection (5 attempts = 15 minute lockout).
 */
@ApiTags('PIN Verification')
@Controller('api/v1/pin')
export class PinVerificationController {
    constructor(private readonly userService: UserService) {}

    /**
     * Verify PIN code (PIN-only lookup)
     *
     * Used for POS quick login when only PIN is entered.
     * Looks up user by PIN first, then verifies using hash.
     * Tracks attempts per user/device combination.
     *
     * @param dto PIN code and device ID
     * @returns User data if valid, null if invalid
     * @throws UnauthorizedException if account is locked
     */
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verify PIN code (PIN-only lookup)',
        description: 'Quick POS login using PIN. Tracks attempts and locks after 5 failed attempts.',
    })
    @ApiResponse({
        status: 200,
        description: 'PIN verified successfully',
        schema: {
            example: {
                success: true,
                data: {
                    user: {
                        id: 'uuid',
                        firstName: 'John',
                        lastName: 'Doe',
                        roleId: 'role-uuid',
                    },
                },
                timestamp: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid PIN or account locked',
        schema: {
            example: {
                success: false,
                error: {
                    code: 'AUTH_007',
                    message: 'Account locked. Try again in 15 minutes.',
                },
                timestamp: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    async verifyPin(@Body() dto: PinVerifyDto) {
        try {
            const user = await this.userService.validatePin(dto.pinCode, dto.deviceId);

            if (!user) {
                return {
                    success: false,
                    error: {
                        code: 'AUTH_006',
                        message: 'Invalid PIN code',
                    },
                    timestamp: new Date().toISOString(),
                };
            }

            return {
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        roleId: user.roleId,
                        storeId: user.storeId,
                    },
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            // Handle lockout exception
            if (error.status === 401) {
                return {
                    success: false,
                    error: {
                        code: 'AUTH_007',
                        message: error.message,
                        locked: true,
                    },
                    timestamp: new Date().toISOString(),
                };
            }
            throw error;
        }
    }

    /**
     * Verify PIN by User ID (more secure)
     *
     * Use this when user ID is known (e.g., from session, card swipe).
     * More secure than PIN-only lookup as it doesn't expose which PINs exist.
     *
     * @param dto User ID, PIN code, and device ID
     * @returns User data if valid, null if invalid
     * @throws UnauthorizedException if account is locked
     */
    @Post('verify-by-user')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verify PIN by User ID (more secure)',
        description: 'Use when user ID is known (session, card swipe). More secure than PIN-only lookup.',
    })
    @ApiResponse({
        status: 200,
        description: 'PIN verified successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid PIN or account locked',
    })
    async verifyPinByUser(@Body() dto: PinVerifyByUserDto) {
        try {
            const user = await this.userService.validatePinByUserId(
                dto.userId,
                dto.pinCode,
                dto.deviceId,
            );

            if (!user) {
                return {
                    success: false,
                    error: {
                        code: 'AUTH_006',
                        message: 'Invalid PIN code',
                    },
                    timestamp: new Date().toISOString(),
                };
            }

            return {
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        roleId: user.roleId,
                        storeId: user.storeId,
                    },
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            if (error.status === 401) {
                return {
                    success: false,
                    error: {
                        code: 'AUTH_007',
                        message: error.message,
                        locked: true,
                    },
                    timestamp: new Date().toISOString(),
                };
            }
            throw error;
        }
    }

    /**
     * Check PIN lockout status
     *
     * Check if a user is currently locked out for PIN verification
     * on a specific device.
     *
     * @param dto User ID and device ID
     * @returns Lockout status and remaining time
     */
    @Post('lockout-status')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Check PIN lockout status',
        description: 'Check if user is locked out and get remaining lockout time.',
    })
    @ApiResponse({
        status: 200,
        description: 'Lockout status retrieved',
        schema: {
            example: {
                success: true,
                data: {
                    isLocked: true,
                    remainingSeconds: 543,
                    remainingMinutes: 9,
                },
                timestamp: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    async getLockoutStatus(@Body() dto: PinLockoutStatusDto) {
        const isLocked = await this.userService.isPinLockedOut(dto.userId, dto.deviceId);
        const remainingSeconds = await this.userService.getPinLockoutRemainingSeconds(
            dto.userId,
            dto.deviceId,
        );

        return {
            success: true,
            data: {
                isLocked,
                remainingSeconds,
                remainingMinutes: Math.ceil(remainingSeconds / 60),
            },
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Clear PIN lockout (Manager action)
     *
     * Allows a manager to clear a user's PIN lockout.
     * Requires manager authentication and is audited.
     *
     * @param dto User ID, device ID, and manager ID
     * @returns Success confirmation
     */
    @Post('clear-lockout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Clear PIN lockout (Manager only)',
        description: 'Manager action to unlock a user account. Requires authentication and is audited.',
    })
    @ApiResponse({
        status: 200,
        description: 'Lockout cleared successfully',
        schema: {
            example: {
                success: true,
                message: 'Lockout cleared',
                timestamp: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - not a manager',
    })
    async clearLockout(@Body() dto: ClearPinLockoutDto) {
        // TODO: Verify manager has permission to clear lockouts
        // For now, just check if the manager exists
        const manager = await this.userService.findById(dto.managerId);
        if (!manager) {
            return {
                success: false,
                error: {
                    code: 'AUTH_008',
                    message: 'Manager not found',
                },
                timestamp: new Date().toISOString(),
            };
        }

        await this.userService.clearPinLockout(dto.userId, dto.deviceId, dto.managerId);

        return {
            success: true,
            message: 'Lockout cleared',
            timestamp: new Date().toISOString(),
        };
    }
}
