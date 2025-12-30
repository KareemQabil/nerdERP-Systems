/**
 * Express Request Type Extensions
 * Adds custom properties to Express Request object
 * 
 * This file extends the Express Request interface to include
 * user and authorizingUser properties set by authentication middleware.
 */

declare namespace Express {
    interface Request {
        /**
         * Current authenticated user (from JWT or PIN login)
         */
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email?: string;
            role?: {
                roleCode: string;
                permissions: string[];
            };
        };

        /**
         * User who authorized a sensitive operation (manager PIN)
         */
        authorizingUser?: {
            id: string;
            firstName: string;
            lastName: string;
            role?: {
                roleCode: string;
                permissions: string[];
            };
        };
    }
}
