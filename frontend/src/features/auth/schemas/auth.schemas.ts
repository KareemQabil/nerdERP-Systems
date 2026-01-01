import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
    username: z
        .string()
        .min(1, 'auth.errors.usernameRequired')
        .min(3, 'auth.errors.usernameMinLength'),
    password: z
        .string()
        .min(1, 'auth.errors.passwordRequired')
        .min(6, 'auth.errors.passwordMinLength'),
    rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
