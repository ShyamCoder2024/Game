// server/validators/leader.schema.ts
// Zod schemas for Account Management (Leader) APIs

import { z } from 'zod';

// ==========================================
// CREATE ACCOUNT
// ==========================================
export const createAccountSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    password: z.string().min(6).max(100),
    role: z.enum(['supermaster', 'master', 'user']),
    deal_percentage: z.number().min(0).max(100).default(0),
    my_matka_share: z.number().min(0).max(100).default(0),
    agent_matka_share: z.number().min(0).max(100).default(0),
    matka_commission: z.number().min(0).max(100).default(0),
    credit_limit: z.number().int().min(0).default(0),
    fix_limit: z.number().int().min(0).default(0),
    is_special: z.boolean().default(false),
    special_notes: z.string().max(500).optional(),
});

// ==========================================
// UPDATE ACCOUNT
// ==========================================
export const updateAccountSchema = z.object({
    name: z.string().min(1).max(100).trim().optional(),
    deal_percentage: z.number().min(0).max(100).optional(),
    my_matka_share: z.number().min(0).max(100).optional(),
    agent_matka_share: z.number().min(0).max(100).optional(),
    matka_commission: z.number().min(0).max(100).optional(),
    credit_limit: z.number().int().min(0).optional(),
    fix_limit: z.number().int().min(0).optional(),
    is_special: z.boolean().optional(),
    special_notes: z.string().max(500).optional(),
});

// ==========================================
// BLOCK / UNBLOCK
// ==========================================
export const blockAccountSchema = z.object({
    is_blocked: z.boolean(),
    reason: z.string().max(500).optional(),
});

// ==========================================
// CHANGE PASSWORD (for downline member)
// ==========================================
export const changePasswordSchema = z.object({
    new_password: z.string().min(6).max(100),
});

// ==========================================
// CHANGE OWN PASSWORD
// ==========================================
export const changeOwnPasswordSchema = z.object({
    current_password: z.string().min(1).max(100),
    new_password: z.string().min(6).max(100),
});

// ==========================================
// LIST FILTERS
// ==========================================
export const listMembersQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().max(100).optional(),
    role: z.enum(['supermaster', 'master', 'user']).optional(),
    status: z.enum(['active', 'blocked', 'all']).default('all'),
    sort: z.enum(['name', 'balance', 'created_at', 'deal_percentage']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
});

// ==========================================
// PARAM SCHEMAS
// ==========================================
export const memberIdParamSchema = z.object({
    id: z.string().regex(/^\d+$/).transform(Number),
});

// Inferred types
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
