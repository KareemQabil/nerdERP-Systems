import { SetMetadata } from '@nestjs/common';

/**
 * Public Route Decorator
 *
 * Marks a route as public (no authentication required).
 * Use this decorator on routes that should be accessible without login.
 *
 * @example
 * @Public()
 * @Post('login')
 * async login() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
