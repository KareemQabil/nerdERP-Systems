import { Request } from 'express';

/**
 * User information attached to request by authentication middleware
 */
export interface AuthenticatedUser {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    role?: {
        roleCode: string;
        permissions: string[];
    };
}

/**
 * Extended Express Request with user and authorizingUser properties
 * Use this instead of Express.Request in controllers that require authentication
 */
export interface AuthenticatedRequest extends Request {
    /**
     * Current authenticated user (from JWT or PIN login)
     */
    user?: AuthenticatedUser;

    /**
     * User who authorized a sensitive operation (manager PIN)
     */
    authorizingUser?: AuthenticatedUser;
}
