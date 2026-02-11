// server/validators/auth.schema.ts
// Zod validation schemas for authentication endpoints

import { z } from 'zod';

/**
 * POST /api/auth/login
 */
export const loginSchema = z.object({
    user_id: z
        .string()
        .min(1, 'User ID is required')
        .max(50, 'User ID too long')
        .trim(),
    password: z
        .string()
        .min(1, 'Password is required')
        .max(100, 'Password too long'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * PUT /api/user/change-password
 */
export const changePasswordSchema = z.object({
    current_password: z
        .string()
        .min(1, 'Current password is required'),
    new_password: z
        .string()
        .min(6, 'Password must be at least 6 characters')
        .max(100, 'Password too long'),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * POST /api/auth/master-access (Admin only)
 */
export const masterAccessSchema = z.object({
    target_user_id: z
        .string()
        .min(1, 'Target user ID is required')
        .max(50, 'User ID too long')
        .trim(),
});

export type MasterAccessInput = z.infer<typeof masterAccessSchema>;
